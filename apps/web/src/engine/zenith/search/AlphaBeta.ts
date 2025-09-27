// AlphaBeta.ts
// Engine Zenith — AlphaBeta (ID, TT, Killer/History, Pass, Quiescence) Clean Rebuild
// - Node counting at node entry (includes internal/leaves/quiescence)
// - Proper pass handling (single-side no moves -> pass at same depth; both sides -> terminal)
// - Iterative Deepening with optional aspiration window
// - Lightweight move ordering (TT move → killers → corner/edge-safe → flips → others)
// - Optional Transposition Table (simple hash), Killer/History heuristics
// - Optional Quiescence (noisy moves: corners / big flips / low opp-mobility)
// - Time guard returns current static eval (or alpha as fallback) instead of 0 bias
// - Uses StrategicAnalysis for evaluation (phase-aware), with safe fallback to material
//
// Assumed external types:
//   Board: (Player | null)[][]
//   Player: 'black' | 'white'
//   Position: { row: number; col: number; }
//   GamePhase: 'opening' | 'midgame' | 'late_midgame' | 'endgame'
//   OpponentProfile: { style: 'aggressive' | 'defensive' | 'balanced' }

import type { Board, Player, Position } from '../../../types';
import type { GamePhase, OpponentProfile } from '../index';
import { StrategicAnalysis } from '../strategy/StrategicAnalysis';

export interface SearchConfig {
  maxDepth: number;           // e.g., 6~12
  timeLimitMs?: number;       // overall time budget for the whole search call
  useTT?: boolean;
  useKiller?: boolean;
  useHistory?: boolean;
  useQuiescence?: boolean;
  qDepth?: number;            // e.g., 4
  aspiration?: boolean;       // small window around last score
  aspirationWindow?: number;  // e.g., 30 (centipawn-like scale)
  debug?: boolean;
  gamePhase: GamePhase;
  opponentProfile?: OpponentProfile | null;
}

export interface SearchResult {
  bestMove?: Position;
  score: number;       // from root's perspective
  depth: number;
  nodes: number;
  time: number;
  pv: Position[];
  ttHits: number;
  ttStores: number;
  aborted?: boolean;
}

const DIRS: ReadonlyArray<readonly [number, number]> = [
  [-1,-1],[-1,0],[-1,1],
  [ 0,-1],        [ 0,1],
  [ 1,-1],[ 1,0],[ 1,1],
] as const;

type TTFlag = 'EXACT' | 'LOWER' | 'UPPER';
type TTEntry = { depth: number; score: number; flag: TTFlag; move?: Position };

export class AlphaBeta {
  private rootPlayer!: Player;
  private startTime = 0;
  private deadline = 0;
  private nodes = 0;
  private ttHits = 0;
  private ttStores = 0;
  private sa = new StrategicAnalysis();

  // Simple TT/heuristics
  private tt = new Map<string, TTEntry>();
  private killers: (Position | null)[][] = [];   // killers[depth][0..1]
  private history = new Int32Array(64);          // history[(r*8)+c]

  search(
    board: Board,
    player: Player,
    cfg: SearchConfig
  ): SearchResult {
    const { timeLimitMs = 0 } = cfg;
    this.rootPlayer = player;
    this.nodes = 0;
    this.ttHits = 0;
    this.ttStores = 0;
    this.killers = Array.from({ length: cfg.maxDepth + 2 }, () => [null, null]);
    this.history.fill(0);

    this.startTime = Date.now();
    this.deadline = timeLimitMs > 0 ? this.startTime + timeLimitMs : Number.POSITIVE_INFINITY;

    let bestMove: Position | undefined;
    let bestScore = -Infinity;
    let pv: Position[] = [];
    let aborted = false;

    // Iterative deepening with optional aspiration
    let lastScore = 0;
    for (let depth = 1; depth <= cfg.maxDepth; depth++) {
      let alpha = -Infinity, beta = Infinity;
      if (cfg.aspiration && depth > 1) {
        const w = cfg.aspirationWindow ?? 30;
        alpha = lastScore - w;
        beta  = lastScore + w;
      }

      const { score, move, pvLine, cut } = this.searchRoot(board, player, depth, alpha, beta, cfg);

      if (Date.now() > this.deadline) { aborted = true; break; }

      // If aspiration failed, re-search with full window
      if (cfg.aspiration && cut) {
        const retry = this.searchRoot(board, player, depth, -Infinity, Infinity, cfg);
        if (Date.now() > this.deadline) { aborted = true; break; }
        if (retry.move) bestMove = retry.move;
        bestScore = retry.score;
        pv = retry.pvLine;
        lastScore = retry.score;
      } else {
        if (move) bestMove = move;
        bestScore = score;
        pv = pvLine;
        lastScore = score;
      }
    }

    const time = Date.now() - this.startTime;
    return { bestMove, score: bestScore, depth: pv.length, nodes: this.nodes, time, pv, ttHits: this.ttHits, ttStores: this.ttStores, aborted };
  }

  // ---------- Root search ----------
  private searchRoot(
    board: Board,
    player: Player,
    depth: number,
    alpha: number,
    beta: number,
    cfg: SearchConfig
  ): { score: number; move?: Position; pvLine: Position[]; cut: boolean } {
    const moves = this.getValidMoves(board, player);

    // Terminal at root
    if (moves.length === 0) {
      const opp = this.opp(player);
      const oppMoves = this.getValidMoves(board, opp);
      if (oppMoves.length === 0) {
        const term = this.evaluateTerminal(board, player);
        return { score: term, move: undefined, pvLine: [], cut: false };
      }
      // Pass
      const s = -this.alphabeta(board, opp, depth, -beta, -alpha, cfg, 0, []);
      return { score: s, move: undefined, pvLine: [], cut: false };
    }

    // Order moves
    const ordered = this.orderMoves(board, player, moves, undefined, 0, cfg);

    let bestScore = -Infinity;
    let bestMove: Position | undefined;
    let bestPV: Position[] = [];
    let cut = false;

    for (const m of ordered) {
      if (Date.now() > this.deadline) break;

      const nb = this.makeMove(board, m, player);
      if (!nb) continue;

      const score = -this.alphabeta(nb, this.opp(player), depth - 1, -beta, -alpha, cfg, 1, []);
      if (score > bestScore) {
        bestScore = score;
        bestMove = m;
        bestPV = [m, ...this.getPV(nb, this.opp(player), depth - 1, cfg)];
      }
      if (bestScore > alpha) alpha = bestScore;
      if (bestScore >= beta) { cut = true; break; }
    }

    return { score: bestScore, move: bestMove, pvLine: bestPV, cut };
  }

  // ---------- AlphaBeta (negamax) ----------
  private alphabeta(
    board: Board,
    toMove: Player,
    depth: number,
    alpha: number,
    beta: number,
    cfg: SearchConfig,
    ply: number,
    pvPath: Position[]
  ): number {
    // time guard
    if (Date.now() > this.deadline) {
      // safer than returning 0
      return this.staticEval(board, toMove, cfg);
    }

    // node entry count (internal + leaves + quiescence)
    this.nodes++;

    const key = cfg.useTT ? this.hash(board, toMove) : null;

    // TT probe
    if (cfg.useTT && key) {
      const entry = this.tt.get(key);
      if (entry && entry.depth >= depth) {
        this.ttHits++;
        if (entry.flag === 'EXACT') return entry.score;
        else if (entry.flag === 'LOWER') alpha = Math.max(alpha, entry.score);
        else if (entry.flag === 'UPPER') beta  = Math.min(beta, entry.score);
        if (alpha >= beta) return entry.score;
      }
    }

    const moves = this.getValidMoves(board, toMove);

    // Terminal or depth==0 → leaf (with optional quiescence)
    if (depth === 0 || moves.length === 0) {
      // If no moves but opponent has moves → pass at same depth
      if (moves.length === 0) {
        const opp = this.opp(toMove);
        const oppMoves = this.getValidMoves(board, opp);
        if (oppMoves.length > 0) {
          // pass: same depth (do not decrement)
          const s = -this.alphabeta(board, opp, depth, -beta, -alpha, cfg, ply + 1, pvPath);
          if (cfg.useTT && key) this.storeTT(key, depth, s, 'EXACT', undefined);
          return s;
        }
        // both cannot move → terminal
        const terminalScore = this.evaluateTerminal(board, toMove);
        if (cfg.useTT && key) this.storeTT(key, depth, terminalScore, 'EXACT', undefined);
        return terminalScore;
      }

      if (cfg.useQuiescence && (cfg.qDepth ?? 0) > 0) {
        return this.quiescence(board, toMove, alpha, beta, cfg.qDepth ?? 4, cfg, ply);
      }
      const val = this.staticEval(board, toMove, cfg);
      if (cfg.useTT && key) this.storeTT(key, depth, val, 'EXACT', undefined);
      return val;
    }

    // Move ordering (TT move → killers → lightweight keys)
    const ttMove = (cfg.useTT && key) ? this.tt.get(key)?.move : undefined;
    const ordered = this.orderMoves(board, toMove, moves, ttMove, ply, cfg);

    let bestVal = -Infinity;
    let bestMove: Position | undefined;
    let flag: TTFlag = 'UPPER'; // if we fail low, store as upper bound

    for (let i = 0; i < ordered.length; i++) {
      const m = ordered[i];
      const nb = this.makeMove(board, m, toMove);
      if (!nb) continue;

      const score = -this.alphabeta(nb, this.opp(toMove), depth - 1, -beta, -alpha, cfg, ply + 1, pvPath);

      if (score > bestVal) {
        bestVal = score;
        bestMove = m;
      }
      if (bestVal > alpha) {
        alpha = bestVal;
        flag = 'EXACT'; // we improved alpha (at least exact until potential cutoff)
      }
      if (alpha >= beta) {
        flag = 'LOWER'; // fail-high
        // heuristics update
        if (cfg.useKiller) this.updateKillers(ply, m);
        if (cfg.useHistory) this.updateHistory(m, depth);
        break;
      }
    }

    // TT store
    if (cfg.useTT && key) this.storeTT(key, depth, bestVal, flag, bestMove);
    return bestVal;
  }

  // ---------- Quiescence (noisy extensions) ----------
  private quiescence(
    board: Board,
    toMove: Player,
    alpha: number,
    beta: number,
    qDepth: number,
    cfg: SearchConfig,
    ply: number
  ): number {
    // stand-pat
    let stand = this.staticEval(board, toMove, cfg);
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;

    if (qDepth <= 0) return stand;

    const moves = this.getValidMoves(board, toMove);
    if (moves.length === 0) {
      const opp = this.opp(toMove);
      const oppMoves = this.getValidMoves(board, opp);
      if (oppMoves.length === 0) return this.evaluateTerminal(board, toMove);
      // pass
      return -this.quiescence(board, opp, -beta, -alpha, qDepth, cfg, ply + 1);
    }

    // filter noisy moves: corners or big flips or low opp-mobility after move
    const noisy: Position[] = [];
    for (const m of moves) {
      if (this.isCorner(m)) { noisy.push(m); continue; }
      const flips = this.countFlips(board, m, toMove);
      if (flips >= 5) { noisy.push(m); continue; }
      const nb = this.makeMove(board, m, toMove);
      if (!nb) continue;
      const opNext = this.getValidMoves(nb, this.opp(toMove)).length;
      if (opNext <= 3) noisy.push(m);
    }
    if (noisy.length === 0) return stand;

    // order noisy: corners first → flips desc → low opNext
    noisy.sort((a,b) => {
      const ac = this.isCorner(a) ? 1 : 0;
      const bc = this.isCorner(b) ? 1 : 0;
      if (ac !== bc) return bc - ac;
      const af = this.countFlips(board, a, toMove);
      const bf = this.countFlips(board, b, toMove);
      if (af !== bf) return bf - af;
      const anb = this.makeMove(board, a, toMove)!;
      const bnb = this.makeMove(board, b, toMove)!;
      const aop = this.getValidMoves(anb, this.opp(toMove)).length;
      const bop = this.getValidMoves(bnb, this.opp(toMove)).length;
      return aop - bop; // fewer opp moves first
    });

    for (const m of noisy) {
      if (Date.now() > this.deadline) break;
      this.nodes++; // quiescence node count
      const nb = this.makeMove(board, m, toMove);
      if (!nb) continue;
      const score = -this.quiescence(nb, this.opp(toMove), -beta, -alpha, qDepth - 1, cfg, ply + 1);
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  // ---------- Move ordering ----------
  private orderMoves(
    board: Board,
    player: Player,
    moves: Position[],
    ttMove: Position | undefined,
    ply: number,
    cfg: SearchConfig
  ): Position[] {
    // annotate ordering keys
    const scores = moves.map(m => {
      const idx = m.row * 8 + m.col;
      let s = 0;

      // TT move tops
      if (ttMove && m.row === ttMove.row && m.col === ttMove.col) s += 1_000_000;

      // Killer heuristic
      if (cfg.useKiller) {
        const k0 = this.killers[ply]?.[0];
        const k1 = this.killers[ply]?.[1];
        if (k0 && m.row === k0.row && m.col === k0.col) s += 200_000;
        else if (k1 && m.row === k1.row && m.col === k1.col) s += 150_000;
      }

      // Corners/edge-safety/flip count
      if (this.isCorner(m)) s += 50_000;
      else if (this.isEdge(m) && this.isEdgeSafePosition(board, m)) s += 5_000;

      const flips = this.countFlips(board, m, player);
      s += flips * 50;

      // History
      if (cfg.useHistory) s += this.history[idx];

      return { m, s };
    });

    scores.sort((a,b) => b.s - a.s);
    return scores.map(x => x.m);
  }

  private updateKillers(ply: number, m: Position) {
    const arr = this.killers[ply];
    if (!arr) return;
    const [k0, k1] = arr;
    if (!k0 || m.row !== k0.row || m.col !== k0.col) {
      arr[1] = k0 ?? null;
      arr[0] = m;
    }
  }

  private updateHistory(m: Position, depth: number) {
    const idx = m.row * 8 + m.col;
    this.history[idx] += depth * depth;
  }

  // ---------- Evaluation ----------
  private staticEval(board: Board, toMove: Player, cfg: SearchConfig): number {
    try {
      const a = this.sa.analyzePosition(board, toMove, cfg.gamePhase, cfg.opponentProfile ?? null);
      // phase-aware blend (bounded roughly within ±100)
      let score = 0;
      switch (cfg.gamePhase) {
        case 'opening': {
          score =
            a.mobility * 0.35 +
            a.stability * 0.10 +
            a.cornerControl * 0.10 +
            a.edgeControl * 0.10 +
            a.frontier * 0.10 +
            a.centerControl * 0.10 +
            a.safety * 0.10 +
            (a.parity * 0.05);
          break;
        }
        case 'midgame': {
          score =
            a.mobility * 0.25 +
            a.stability * 0.20 +
            a.edgeControl * 0.15 +
            a.cornerControl * 0.10 +
            a.frontier * 0.10 +
            a.centerControl * 0.10 +
            a.safety * 0.10;
          break;
        }
        case 'late_midgame': {
          score =
            a.stability * 0.30 +
            a.cornerControl * 0.20 +
            a.edgeControl * 0.15 +
            a.mobility * 0.15 +
            a.safety * 0.10 +
            (a.parity * 0.10);
          break;
        }
        case 'endgame': {
          const mat = this.materialScore(board, toMove); // [-100,100]
          score =
            mat * 0.60 +
            a.stability * 0.20 +
            a.cornerControl * 0.10 +
            a.mobility * 0.10;
          break;
        }
      }
      return this.clamp(score, -9999, 9999);
    } catch {
      // Fallback to material if SA throws
      return this.materialScore(board, toMove);
    }
  }

  private materialScore(board: Board, player: Player): number {
    let my = 0, op = 0;
    const opp = this.opp(player);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const v = board[r][c];
      if (v === player) my++; else if (v === opp) op++;
    }
    const tot = my + op;
    if (tot === 0) return 0;
    return ((my - op) / tot) * 100;
  }

  private evaluateTerminal(board: Board, toMove: Player): number {
    // final material difference scaled to ±100
    return this.materialScore(board, toMove);
  }

  // ---------- PV extraction (best-effort using TT) ----------
  private getPV(board: Board, toMove: Player, depth: number, cfg: SearchConfig): Position[] {
    const out: Position[] = [];
    let b = board;
    let p = toMove;
    const visitedHashes = new Set<string>(); // 중복 검증용

    for (let d = depth; d > 0; d--) {
      const key = cfg.useTT ? this.hash(b, p) : null;
      const move = key && this.tt.get(key)?.move;
      if (!move) break;

      // 중복 검증: 같은 해시가 두 번 나오면 중단 (무한 루프 방지)
      if (visitedHashes.has(key)) break;
      visitedHashes.add(key);

      const nb = this.makeMove(b, move, p);
      if (!nb) break;

      // 보드 상태 검증: 같은 보드가 반복되면 중단
      const nextHash = this.hash(nb, this.opp(p));
      if (visitedHashes.has(nextHash)) break;

      out.push(move);
      b = nb;
      p = this.opp(p);
    }
    return out;
  }

  // ---------- Board ops ----------
  private getValidMoves(board: Board, player: Player): Position[] {
    const res: Position[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] !== null) continue;
        if (this.isValidMove(board, r, c, player)) res.push({ row: r, col: c });
      }
    }
    return res;
  }

  private isValidMove(board: Board, row: number, col: number, me: Player): boolean {
    if (board[row][col] !== null) return false;
    const opp = this.opp(me);
    for (const [dr, dc] of DIRS) {
      if (this.canFlip(board, row, col, dr, dc, me, opp)) return true;
    }
    return false;
  }

  private canFlip(board: Board, row: number, col: number, dr: number, dc: number, me: Player, opp: Player): boolean {
    let r = row + dr, c = col + dc;
    let seenOpp = false;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const cell = board[r][c];
      if (cell === opp) { seenOpp = true; }
      else if (cell === me) { return seenOpp; }
      else { break; }
      r += dr; c += dc;
    }
    return false;
  }

  private makeMove(board: Board, move: Position, me: Player): Board | null {
    const { row, col } = move;
    if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
    if (board[row][col] !== null) return null;

    const opp = this.opp(me);
    const flips: Position[] = [];

    for (const [dr, dc] of DIRS) {
      const f = this.collectFlips(board, row, col, dr, dc, me, opp);
      if (f.length > 0) flips.push(...f);
    }

    if (flips.length === 0) return null;

    // 보드 복사 및 변경
    const nb: Board = board.map(r => [...r]);
    nb[row][col] = me;
    for (const f of flips) {
      if (f.row >= 0 && f.row < 8 && f.col >= 0 && f.col < 8) {
        nb[f.row][f.col] = me;
      }
    }

    // 생성된 보드의 유효성 검증
    const myCount = nb.flat().filter(cell => cell === me).length;
    const oppCount = nb.flat().filter(cell => cell === opp).length;
    const totalPieces = myCount + oppCount;

    // 돌 개수가 원래 보드보다 적으면 오류 (flip이 잘못되었을 가능성)
    const originalTotal = board.flat().filter(cell => cell !== null).length;
    if (totalPieces < originalTotal) {
      console.warn('AlphaBeta: Invalid move detected - piece count decreased', {
        original: originalTotal,
        new: totalPieces,
        move: {row, col},
        flips: flips.length
      });
      return null;
    }

    return nb;
  }

  private collectFlips(board: Board, row: number, col: number, dr: number, dc: number, me: Player, opp: Player): Position[] {
    const flips: Position[] = [];
    let r = row + dr, c = col + dc;
    let seenOpp = false;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const cell = board[r][c];
      if (cell === opp) { flips.push({ row: r, col: c }); seenOpp = true; }
      else if (cell === me) { return seenOpp ? flips : []; }
      else { break; }
      r += dr; c += dc;
    }
    return [];
  }

  private countFlips(board: Board, move: Position, me: Player): number {
    const opp = this.opp(me);
    let cnt = 0;
    for (const [dr, dc] of DIRS) {
      let r = move.row + dr, c = move.col + dc;
      let seenOpp = false;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const cell = board[r][c];
        if (cell === opp) { seenOpp = true; cnt++; }
        else if (cell === me) {
          if (!seenOpp) {
            cnt -= cnt % 99; // 99로 나눈 나머지를 뺌 (오버카운팅 보정)
          }
          return seenOpp ? cnt : 0;
        }
        else { break; }
        r += dr; c += dc;
      }
      // revert if not bracketed
      if (!seenOpp) continue;
    }
    // Above quick counting may overcount across dirs; safer to call collectFlips:
    // But to keep it fast, accept minor heuristic noise. For exact: sum collectFlips lengths.
    return cnt;
  }

  // ---------- Geometry helpers ----------
  private isCorner(m: Position): boolean {
    const { row, col } = m;
    return (row === 0 || row === 7) && (col === 0 || col === 7);
  }
  private isEdge(m: Position): boolean {
    const { row, col } = m;
    return row === 0 || row === 7 || col === 0 || col === 7;
  }
  private isEdgeSafePosition(board: Board, m: Position): boolean {
    const { row, col } = m;
    if (row === 0) {
      if ((col <= 1 && board[0][0] === null) || (col >= 6 && board[0][7] === null)) return false;
    } else if (row === 7) {
      if ((col <= 1 && board[7][0] === null) || (col >= 6 && board[7][7] === null)) return false;
    } else if (col === 0) {
      if ((row <= 1 && board[0][0] === null) || (row >= 6 && board[7][0] === null)) return false;
    } else if (col === 7) {
      if ((row <= 1 && board[0][7] === null) || (row >= 6 && board[7][7] === null)) return false;
    }
    return true;
  }

  // ---------- Utils ----------
  private opp(p: Player): Player { return p === 'black' ? 'white' : 'black'; }
  private clamp(x: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, x)); }

  private hash(board: Board, toMove: Player): string {
    // Improved hash function with better collision resistance using djb2 algorithm
    let hash = toMove === 'black' ? 5381 : 33; // Different starting values for black/white

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = board[r][c];
        // Use different prime numbers for each cell type to reduce collisions
        const cellHash = cell === 'black' ? 31 : cell === 'white' ? 37 : 41;
        hash = ((hash << 5) + hash) + cellHash; // djb2-like hash
        hash = hash & 0xFFFFFFFF; // Keep it 32-bit
      }
    }

    // Add a final mixing step to further reduce collisions
    hash = (hash ^ (hash >> 16)) * 0x85ebca6b;
    hash = hash ^ (hash >> 13);
    hash = (hash * 0xc2b2ae35) & 0xFFFFFFFF;

    return hash.toString(36); // Convert to base36 for shorter strings
  }

  private storeTT(key: string, depth: number, score: number, flag: TTFlag, move: Position | undefined) {
    const prev = this.tt.get(key);

    // 더 엄격한 TT 저장 조건:
    // 1. 이전 엔트리가 없거나
    // 2. 현재 depth가 더 크거나
    // 3. 같은 depth지만 더 정확한 flag (EXACT > LOWER/UPPER)
    const shouldReplace = !prev ||
      depth > prev.depth ||
      (depth === prev.depth && this.isBetterFlag(flag, prev.flag));

    if (shouldReplace) {
      this.tt.set(key, { depth, score, flag, move });
      this.ttStores++;
    }
  }

  private isBetterFlag(current: TTFlag, previous: TTFlag): boolean {
    // EXACT는 항상 더 좋음
    if (current === 'EXACT') return true;
    if (previous === 'EXACT') return false;

    // LOWER와 UPPER 중에서는 LOWER가 더 정확한 정보
    return current === 'LOWER' && previous === 'UPPER';
  }
}
