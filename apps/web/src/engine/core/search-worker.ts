/* --------------------------------------------------------------------------
 * search-worker.ts (Web Worker) — De-shallowing Revamp + robust randomUUID
 * - 단일/분산 검색 수행
 * - options.engineModuleURL/engineExportName로 엔진 동적 import (캐시)
 * - 분산 모드: 2-스테이지 스케줄(워밍업→집중 딥닝) + 최소/최대 슬라이스 가드
 * - 글로벌 데드라인 전달(엔진이 자체 컷오프 가능), 오버런 결과 폐기 금지
 * - 엔진 실패 시 안전한 더미 검색기로 폴백
 * - crypto.randomUUID 폴리필(프로토타입 정의 + 글로벌 별칭) 및 import 재시도
 * -------------------------------------------------------------------------- */

/// <reference lib="webworker" />

/* ------------------------ crypto.randomUUID polyfill ------------------------ */
function ensureCryptoRandomUUID() {
  const g: any = globalThis as any;
  const c: any = g.crypto ?? undefined;
  if (!c) return;                           // 워커에선 일반적으로 존재
  if (typeof c.randomUUID === 'function') { // 이미 지원됨
    if (typeof g.cryptoRandomUUID !== 'function') g.cryptoRandomUUID = c.randomUUID.bind(c);
    return;
  }

  const poly = function randomUUID(): string {
    const rnds = new Uint8Array(16);
    if (typeof c.getRandomValues === 'function') c.getRandomValues(rnds);
    else for (let i = 0; i < 16; i++) rnds[i] = Math.floor(Math.random() * 256);
    rnds[6] = (rnds[6] & 0x0f) | 0x40; // version 4
    rnds[8] = (rnds[8] & 0x3f) | 0x80; // variant 10
    const hex = Array.from(rnds).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
  };

  // 1) crypto 인스턴스에 직접 정의 (막히면 예외 무시)
  try { Object.defineProperty(c, 'randomUUID', { value: poly, configurable: true, writable: true }); } catch { /* ignore */ }
  // 2) 프로토타입에 정의 (동결된 인스턴스 대응)
  try {
    const proto = Object.getPrototypeOf(c);
    if (proto && !('randomUUID' in proto)) {
      Object.defineProperty(proto, 'randomUUID', { value: poly, configurable: true, writable: true });
    }
  } catch { /* ignore */ }
  // 3) 글로벌 별칭 보장
  if (typeof g.cryptoRandomUUID !== 'function') g.cryptoRandomUUID = poly;
}
// 폴리필을 미리 적용(엔진 import 전에)
ensureCryptoRandomUUID();

type Player = 'black' | 'white';
type Position = { row: number; col: number };

interface SearchOptions {
  timeLimit?: number;            // ms, 전체 예산(단일) 또는 루트 묶음 예산(분산)
  depthLimit?: number;
  engineModuleURL?: string;
  engineExportName?: string;

  // 내부/분산 주입용
  rootMove?: Position;           // 특정 루트만 탐색하도록 엔진 힌트
  deadline?: number;             // 절대 타임스탬프(ms since epoch or perf) — 엔진이 컷오프 용도로 사용

  // 분산 스케줄 옵션(유저가 안 주면 안전 기본값 사용)
  distributedFairShare?: boolean; // true면 루트 균등 분배(옛 방식). 기본 false(비권장)
  distributedTopK?: number;       // 딥닝에 진입할 Top-K 루트 수 (기본 3)
  warmupShare?: number;           // 워밍업 예산 비율 0.05~0.30 (기본 0.15)
  minSliceMs?: number;            // 루트당 최소 슬라이스 (기본 40ms)
  maxSingleShare?: number;        // 단일 루트가 점유 가능한 최대 비율 (기본 0.45)

  // 엔진 힌트(선택)
  initialGuess?: number;          // aspiration 등에서 사용할 초기 점수 힌트
}

interface SearchRequest {
  id: string;
  mode: 'single' | 'distributed';
  player: Player;
  gameCore: any;             // 직렬화 가능한 게임 상태(보드 등)
  options: SearchOptions;
  rootMoves?: Position[];    // 분산 모드에서 맡은 루트들(없으면 내부에서 산출 시도)
}

interface SearchResponse {
  id: string;
  workerId: number;
  success: boolean;
  error?: string;

  mode: 'single' | 'distributed';
  player: Player;

  bestMove?: Position;
  evaluation?: number;
  nodes?: number;
  pv?: Position[];

  elapsed: number;
  rootsTried?: number;
  rootBest?: Position;
}

/* ------------------------ 엔진 어댑터 ------------------------ */
// 동적 import된 모듈에서 이 시그니처의 함수를 기대
type EngineSearchFn = (
  gameCore: any,
  player: Player,
  options: SearchOptions
) => Promise<{
  bestMove?: Position;
  evaluation: number;
  nodes?: number;
  pv?: Position[];
}> | {
  bestMove?: Position;
  evaluation: number;
  nodes?: number;
  pv?: Position[];
};

// 엔진 로딩 캐시
let cachedModuleURL: string | undefined;
let cachedExportName: string | undefined;
let cachedEngineFn: EngineSearchFn | null = null;

/** 모듈을 동적으로 로딩하고 search 함수를 얻는다. */
async function getEngineSearchFn(opts: SearchOptions): Promise<EngineSearchFn> {
  const url = opts.engineModuleURL;
  const name = opts.engineExportName;
  if (url && name && url === cachedModuleURL && name === cachedExportName && cachedEngineFn) {
    return cachedEngineFn;
  }
  if (url && name) {
    try {
      const mod = await import(/* @vite-ignore */ url);
      const fn = (mod as any)[name];
      if (typeof fn === 'function') {
        cachedModuleURL = url;
        cachedExportName = name;
        cachedEngineFn = fn as EngineSearchFn;
        return cachedEngineFn;
      }
    } catch (e) {
      // fallthrough to fallback
      console.warn('[worker] engine import failed, using fallback.', e);
    }
  }
  // Fallback: 더미 엔진(합리적 기본 - X/C 회피 + 간단 휴리스틱)
  return fallbackEngineSearch;
}

/* ------------------------ 메시지 핸들링 ------------------------ */

const workerId = Math.floor(Math.random() * 1e9);

self.onmessage = (ev: MessageEvent<{ type: string; payload: SearchRequest }>) => {
  const { type, payload } = ev.data || ({} as any);
  if (type !== 'search' || !payload) return;

  if (payload.mode === 'single') {
    runSingle(payload);
  } else {
    runDistributed(payload);
  }
};

/* ------------------------ 실행 경로 ------------------------ */

async function runSingle(req: SearchRequest) {
  const t0 = performance.now();
  try {
    const engine = await getEngineSearchFn(req.options);

    // 절대 데드라인 계산(엔진이 컷오프 가능하게)
    const total = Math.max(0, req.options.timeLimit ?? 0);
    const bufferRatio = 0.08; // 안전 버퍼
    const budget = total > 0 ? Math.floor(total * (1 - bufferRatio)) : 0;
    const deadline = total > 0 ? t0 + budget : undefined;

    const result = await engine(req.gameCore, req.player, { ...req.options, deadline });

    const t1 = performance.now();
    postMessage(<SearchResponse>{
      id: req.id,
      workerId,
      success: true,
      mode: req.mode,
      player: req.player,
      bestMove: result.bestMove,
      evaluation: result.evaluation,
      nodes: result.nodes ?? 0,
      pv: result.pv ?? [],
      elapsed: t1 - t0,
    });
  } catch (err: any) {
    const t1 = performance.now();
    postMessage(<SearchResponse>{
      id: req.id,
      workerId,
      success: false,
      mode: req.mode,
      player: req.player,
      error: err?.message ?? String(err),
      elapsed: t1 - t0,
    });
  }
}

async function runDistributed(req: SearchRequest) {
  const t0 = performance.now();
  // 루트 목록: 요청 제공 없으면 gameCore로부터 산출 시도
  let roots: Position[] = Array.isArray(req.rootMoves) && req.rootMoves.length
    ? req.rootMoves
    : (deriveRootMoves(req.gameCore, req.player) ?? []);

  let bestEval = -Infinity;
  let bestMove: Position | undefined;
  let bestPV: Position[] = [];
  let totalNodes = 0;
  let tried = 0;

  try {
    const engine = await getEngineSearchFn(req.options);

    // --- 스케줄 파라미터(옵션 기반 + 안전 기본값) ---
    const total = Math.max(0, req.options.timeLimit ?? 0);
    const bufferRatio = 0.08; // 전체 예산의 8%는 안전 버퍼
    let remaining = total > 0 ? Math.floor(total * (1 - bufferRatio)) : 0;
    const globalDeadline = total > 0 ? t0 + remaining : undefined;

    const fairShare = req.options.distributedFairShare ?? false; // 기본 OFF
    const minSlice = Math.max(1, Math.floor(req.options.minSliceMs ?? 40));
    const maxSingleShare = clamp(req.options.maxSingleShare ?? 0.45, 0.1, 0.9);
    const warmShare = clamp(req.options.warmupShare ?? 0.15, 0.05, 0.3);
    const topK = Math.max(1,
      Math.min(req.options.distributedTopK ?? 3, roots.length)
    );

    // 전체 타임리밋이 명시되지 않은 경우에도 과도한 루프 방지용 최소 슬라이스 사용
    const noTotalBudget = total <= 0;

    // --- 공정분배 모드(구방식, 권장하지 않음) ---
    if (fairShare) {
      const timePerMove = Math.max(minSlice,
        Math.floor((remaining > 0 ? remaining : minSlice * roots.length) / Math.max(1, roots.length))
      );

      for (const mv of roots) {
        const tMoveStart = performance.now();
        const moveDeadline = globalDeadline ?? (tMoveStart + timePerMove);

        const moveOpts: SearchOptions = {
          ...req.options,
          timeLimit: timePerMove,
          deadline: moveDeadline,
          rootMove: mv
        };

        const result = await engine(req.gameCore, req.player, moveOpts);
        tried += 1;
        totalNodes += result.nodes ?? 0;
        if (typeof result.evaluation === 'number' && result.evaluation > bestEval) {
          bestEval = result.evaluation;
          bestMove = result.bestMove ?? mv;
          bestPV = result.pv ?? [];
        }

        // 오버런 결과를 폐기하지 않는다. 단지 remaining에서 차감.
        const moveSpent = performance.now() - tMoveStart;
        if (remaining > 0) remaining = Math.max(0, remaining - moveSpent);

        // 글로벌 데드라인 또는 남은 예산 확인
        if ((globalDeadline && performance.now() >= globalDeadline) || (remaining <= 0 && !noTotalBudget)) break;
      }

      const t1 = performance.now();
      postMessage(<SearchResponse>{
        id: req.id,
        workerId,
        success: isFinite(bestEval),
        mode: req.mode,
        player: req.player,
        bestMove,
        evaluation: isFinite(bestEval) ? bestEval : undefined,
        nodes: totalNodes,
        pv: bestPV,
        elapsed: t1 - t0,
        rootsTried: tried,
        rootBest: bestMove,
      });
      return;
    }

    // --- 비공정(권장) 분산: 2-스테이지(워밍업 → 딥닝) ---

    // Stage A: 워밍업 — 모든 루트를 얕게 스캔
    const warmBudget = (remaining > 0) ? Math.floor(remaining * warmShare) : minSlice * roots.length;
    const warmSlice = Math.max(minSlice, Math.floor(warmBudget / Math.max(1, roots.length)));
    const warmResults: Array<{ move: Position; evaluation: number; nodes: number; pv: Position[] }> = [];

    for (const mv of roots) {
      const tMoveStart = performance.now();
      const moveDeadline = (globalDeadline && remaining > 0) ? Math.min(globalDeadline, tMoveStart + warmSlice) : (tMoveStart + warmSlice);

      const moveOpts: SearchOptions = {
        ...req.options,
        timeLimit: warmSlice,
        deadline: moveDeadline,
        rootMove: mv
      };

      const result = await engine(req.gameCore, req.player, moveOpts);
      tried += 1;
      totalNodes += result.nodes ?? 0;
      warmResults.push({
        move: mv,
        evaluation: result.evaluation ?? -Infinity,
        nodes: result.nodes ?? 0,
        pv: result.pv ?? []
      });

      // 베스트 갱신
      if (typeof result.evaluation === 'number' && result.evaluation > bestEval) {
        bestEval = result.evaluation;
        bestMove = result.bestMove ?? mv;
        bestPV = result.pv ?? [];
      }

      const moveSpent = performance.now() - tMoveStart;
      if (remaining > 0) remaining = Math.max(0, remaining - moveSpent);
      if ((globalDeadline && performance.now() >= globalDeadline) || (remaining <= 0 && !noTotalBudget)) break;
    }

    // Stage B: 집중 딥닝 — 상위 K 루트에 남은 예산 대부분 배분
    if ((globalDeadline && performance.now() < globalDeadline) || (remaining > 0 || noTotalBudget)) {
      const picked = pickTopK(warmResults, topK);

      // 남은 예산 계산
      const afterWarm = remaining > 0 ? remaining : minSlice * picked.length;
      const maxSingle = (total > 0) ? Math.floor(total * maxSingleShare) : (minSlice * 6);

      // 간단한 가중치: 동일 분배(필요 시 softmax로 교체 가능)
      const slice = Math.max(minSlice, Math.floor(afterWarm / Math.max(1, picked.length)));

      for (const it of picked) {
        // 각 루트별 실제 슬라이스는 MAX_SINGLE 가드 적용
        const per = Math.min(maxSingle, slice);
        const tMoveStart = performance.now();
        const moveDeadline = (globalDeadline && remaining > 0)
          ? Math.min(globalDeadline, tMoveStart + per)
          : (tMoveStart + per);

        const moveOpts: SearchOptions = {
          ...req.options,
          timeLimit: per,
          deadline: moveDeadline,
          rootMove: it.move,
          initialGuess: it.evaluation
        };

        const deep = await engine(req.gameCore, req.player, moveOpts);
        totalNodes += deep.nodes ?? 0;

        if (typeof deep.evaluation === 'number' && deep.evaluation > bestEval) {
          bestEval = deep.evaluation;
          bestMove = deep.bestMove ?? it.move;
          bestPV = deep.pv ?? [];
        }

        const moveSpent = performance.now() - tMoveStart;
        if (remaining > 0) remaining = Math.max(0, remaining - moveSpent);
        if ((globalDeadline && performance.now() >= globalDeadline) || (remaining <= 0 && !noTotalBudget)) break;
      }
    }

    const t1 = performance.now();
    postMessage(<SearchResponse>{
      id: req.id,
      workerId,
      success: isFinite(bestEval),
      mode: req.mode,
      player: req.player,
      bestMove,
      evaluation: isFinite(bestEval) ? bestEval : undefined,
      nodes: totalNodes,
      pv: bestPV,
      elapsed: t1 - t0,
      rootsTried: tried,
      rootBest: bestMove,
    });
  } catch (err: any) {
    const t1 = performance.now();
    postMessage(<SearchResponse>{
      id: req.id,
      workerId,
      success: false,
      mode: req.mode,
      player: req.player,
      error: err?.message ?? String(err),
      elapsed: t1 - t0,
      rootsTried: tried,
      rootBest: bestMove,
    });
  }
}

/* ------------------------ Fallback Engine ------------------------ */
/**
 * 엔진 모듈이 없거나 import 실패 시 사용하는 더미 검색기.
 * - 가능한 수를 나열한 뒤, X/C 회피(+약한 중앙 선호) 휴리스틱으로 고름.
 * - rootMove가 있으면 그 루트만 평가.
 */
async function fallbackEngineSearch(
  gameCore: any,
  player: Player,
  options: SearchOptions
) {
  // 기대 인터페이스:
  // gameCore.board: (Player|null)[][]
  // gameCore.getValidMoves?: (board, player) => Position[]
  // gameCore.applyMove?: (board, move, player) => (Player|null)[][]
  // 없으면 내부 간단 로직 사용

  const board: (Player | null)[][] = gameCore?.board ?? createBoardFromCore(gameCore);
  const getMoves = gameCore?.getValidMoves ?? ((b: any, p: Player) => listValidMoves(b, p));
  const apply = gameCore?.applyMove ?? ((b: any, m: Position, p: Player) => applyMove(b, m, p));

  let moves: Position[] = [];
  if (options.rootMove) {
    moves = [options.rootMove];
  } else {
    moves = getMoves(board, player) ?? [];
  }

  if (moves.length === 0) {
    return { evaluation: 0, nodes: 1, pv: [] as Position[] };
  }

  // X/C 회피 + 가운데 소폭 선호
  let best: Position = moves[0];
  let bestScore = -Infinity;
  let nodes = 0;

  for (const m of moves) {
    nodes++;
    let s = 0;
    if (isX(m)) s -= 100;
    if (isC(m)) s -= 50;
    // 중앙(3,3),(3,4),(4,3),(4,4) 소폭 플러스
    if ((m.row === 3 || m.row === 4) && (m.col === 3 || m.col === 4)) s += 12;

    // 착수 후 뒤집힌 개수 가산(간단 휴리스틱)
    const next = apply(board, m, player);
    const diff = discDiff(next, player);
    s += diff * 2;

    if (s > bestScore) {
      bestScore = s;
      best = m;
    }
  }

  return {
    bestMove: best,
    evaluation: bestScore,
    nodes,
    pv: [best],
  };
}

/* ------------------------ 간단 보조 로직 ------------------------ */

const DIRS: ReadonlyArray<readonly [number, number]> = [
  [-1,-1],[-1,0],[-1,1],
  [ 0,-1],        [ 0,1],
  [ 1,-1],[ 1,0],[ 1,1],
] as const;

function opponent(p: Player): Player { return p === 'black' ? 'white' : 'black'; }

function listValidMoves(board: (Player|null)[][], player: Player): Position[] {
  const opp = opponent(player);
  const out: Position[] = [];
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    if (board[r][c] !== null) continue;
    for (const [dr,dc] of DIRS) {
      let y=r+dr, x=c+dc, seenOpp=false;
      while (y>=0&&y<8&&x>=0&&x<8) {
        const v = board[y][x];
        if (v===opp) { seenOpp=true; y+=dr; x+=dc; continue; }
        if (v===player && seenOpp) { out.push({row:r,col:c}); y=999; x=999; break; }
        break;
      }
    }
  }
  return out;
}

function applyMove(board: (Player|null)[][], move: Position, player: Player) {
  const b = board.map(row => row.slice());
  if (b[move.row][move.col] !== null) return b;
  b[move.row][move.col] = player;
  const opp = opponent(player);
  for (const [dr,dc] of DIRS) {
    const flips: Array<[number,number]> = [];
    let y=move.row+dr, x=move.col+dc;
    while (y>=0&&y<8&&x>=0&&x<8 && b[y][x]===opp) {
      flips.push([y,x]); y+=dr; x+=dc;
    }
    if (y>=0&&y<8&&x>=0&&x<8 && b[y][x]===player && flips.length) {
      for (const [fy,fx] of flips) b[fy][fx]=player;
    }
  }
  return b;
}

function discDiff(board:(Player|null)[][], me:Player): number {
  let my=0, op=0;
  const opp = opponent(me);
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    if (board[r][c]===me) my++;
    else if (board[r][c]===opp) op++;
  }
  return my - op;
}

function isX(p: Position): boolean {
  return (p.row===1||p.row===6) && (p.col===1||p.col===6);
}
function isC(p: Position): boolean {
  const set = new Set(['0,1','1,0','0,6','1,7','6,0','7,1','6,7','7,6']);
  return set.has(`${p.row},${p.col}`);
}

function createBoardFromCore(core:any): (Player|null)[][] {
  if (Array.isArray(core)) return core as any;
  if (Array.isArray(core?.board)) return core.board as any;
  // 기본 시작 배치
  const B: (Player|null)[][] = Array.from({length:8},()=>Array(8).fill(null));
  B[3][3] = 'white'; B[3][4] = 'black';
  B[4][3] = 'black'; B[4][4] = 'white';
  return B;
}

function deriveRootMoves(gameCore:any, player:Player): Position[] {
  const board: (Player | null)[][] = gameCore?.board ?? createBoardFromCore(gameCore);
  const getMoves = gameCore?.getValidMoves ?? ((b: any, p: Player) => listValidMoves(b, p));
  return getMoves(board, player) ?? [];
}

function pickTopK<T extends { evaluation: number }>(list: T[], k: number): T[] {
  const sorted = [...list].sort((a,b) => (b.evaluation ?? -Infinity) - (a.evaluation ?? -Infinity));
  return sorted.slice(0, Math.min(k, sorted.length));
}

function clamp(x:number, lo:number, hi:number) { return Math.max(lo, Math.min(hi, x)); }
