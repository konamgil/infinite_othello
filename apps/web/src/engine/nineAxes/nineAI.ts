/*
 * NineAxesStrategy.ts — Othello/Reversi Strategic Director (先·防·惡·誘·封·犧·虛/實·連/斷·奇/偶)
 *
 * Purpose
 *   Convert high-level strategic doctrines (오델로의 9축) into concrete, engine-friendly
 *   signals for move ordering, pruning guards, and explainable guidance.
 *
 * Design
 *   - Pure TypeScript, framework-agnostic
 *   - Works with either (row,col) Board arrays or injected bitboard adapters
 *   - Zero external deps
 *   - Deterministic, side-effect free
 *
 * Integration Points (choose any)
 *   1) Move ordering prior      → getOrderingHint(board, player)
 *   2) Risk guard (filter/penal)→ guardMove(board, player, move)
 *   3) Heuristic bonus additive → evaluateMove(board, player, move)
 *   4) UI Explain panel         → explainPlan(board, player, topK)
 *
 * Minimal Types (compatible with existing codebases)
 */

export type Player = 'black' | 'white';
export interface Position { row: number; col: number; }
export type Cell = Player | null;
export type Board = Cell[][]; // 8x8 expected, but we avoid hard-coding

export type AxisKey =
  | 'SEN'   // 1) 선: 선점
  | 'BANG'  // 2) 방: 차단
  | 'AK'    // 3) 악: 악화(상대 가치 전환)
  | 'YUU'   // 4) 유: 유도(포싱)
  | 'BONG'  // 5) 봉: 봉쇄(장기 잠금)
  | 'HEE'   // 6) 희: 희생(단기 손해 → 장기 이익)
  | 'HEO'   // 7) 허: 덜 뒤집기(비움)
  | 'SIL'   // 7) 실: 채움(안정 고정)
  | 'YEON'  // 8) 연: 연결
  | 'DAN'   // 8) 단: 절단
  | 'GIU';  // 9) 기/우: 패리티

export interface AxisContribution {
  key: AxisKey;
  value: number;       // normalized contribution in [-1, 1]
  trigger?: string[];  // which sub-conditions activated
  risk?: string[];     // which risks detected
}

export interface MoveAnalysis {
  move: Position;
  total: number;                        // final normalized score in [-1, 1]
  contributions: AxisContribution[];    // per-axis details
  quickScorecard: QuickScorecardDelta;  // +1/-1 style delta
  flags: string[];                      // e.g., ["corner", "x-square", "quiet", ...]
}

export interface RankedMove extends MoveAnalysis { rank: number; }

export interface QuickScorecardDelta {
  oppMovesDelta: number;     // +1 if reduces opponent legal moves
  myFrontierDelta: number;   // +1 if reduces my frontier
  parityFavor: number;       // +1 if improves parity structure
  cornerExpect: number;      // +1 if corner/stability expectation rises
  xOrCExposure: number;      // -1 if exposes X/C dangerously
  diagOpenRisk: number;      // -1 if opens main diagonals toward empty corners
  overSealMobility: number;  // -1 if over-seal crushes own mobility
}

export interface OrderingHints {
  byMove: Map<string, number>; // key=moveKey(row,col), value=prior (higher first)
}

export interface GuardDecision {
  allow: boolean;
  penalty: number;    // 0..1 penalty applied to prior (multiply by 1-penalty)
  reasons: string[];
}

export interface NineAxesConfig {
  // Axis weights toward final total (sum doesn't need to be 1; we normalize later)
  weights: Partial<Record<AxisKey, number>>;
  // Risk multipliers (applied as (1 - riskWeight*riskLevel))
  riskWeights: {
    xSquare: number;      // punish X-square exposure when corner empty
    cSquare: number;      // punish C-square exposure when corner empty
    openDiag: number;     // opens key diagonal leading to empty corner
    overSeal: number;     // self-mobility collapse by over-sealing
  };
  // Phase thresholds by empties
  phase: {
    lateThreshold: number;   // empties <= this → endgame focus
    midThreshold: number;    // empties <= this → midgame focus
  };
  // Misc knobs
  quietFlipLimit: number;    // "quiet" if flips <= this
  inductionWidth: number;    // consider opponent reply count <= K as forced-ish
  inductionDepth: number;    // shallow lookahead depth for 유(誘) & 희(犧)
  boardSize: number;         // default 8
}

export interface RulesAdapter {
  getValidMoves: (board: Board, player: Player) => Position[];
  makeMove: (board: Board, player: Player, move: Position) => Board;
  isTerminal?: (board: Board) => boolean;
}

export interface NineAxesAdapters {
  rules?: RulesAdapter; // If omitted, a built-in portable ruleset is used
}

// Default configuration tuned for robust mid-game guidance
export const NINE_AXES_DEFAULTS: NineAxesConfig = {
  weights: {
    SEN: 1.0,
    BANG: 0.9,
    AK: 0.8,
    YUU: 0.9,
    BONG: 0.9,
    HEE: 0.7,
    HEO: 0.6,
    SIL: 0.6,
    YEON: 0.7,
    DAN: 0.7,
    GIU: 1.0,
  },
  riskWeights: {
    xSquare: 0.70,
    cSquare: 0.45,
    openDiag: 0.35,
    overSeal: 0.30,
  },
  phase: {
    lateThreshold: 14,
    midThreshold: 36,
  },
  quietFlipLimit: 2,
  inductionWidth: 2,
  inductionDepth: 2,
  boardSize: 8,
};

// Directions (8-neighborhood)
const DIRS: ReadonlyArray<[number, number]> = [
  [-1, -1], [-1, 0], [-1, 1],
  [ 0, -1],          [ 0, 1],
  [ 1, -1], [ 1, 0], [ 1, 1],
] as const;

const inBounds = (N: number, r: number, c: number) => r >= 0 && r < N && c >= 0 && c < N;
const opposite: Record<Player, Player> = { black: 'white', white: 'black' };
const keyOf = (p: Position) => `${p.row},${p.col}`;

// --- Portable Rules (minimal, correct) --------------------------------------------------------
function builtinGetValidMoves(board: Board, player: Player): Position[] {
  const N = board.length;
  const opp = opposite[player];
  const moves: Position[] = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (board[r][c] !== null) continue;
    let ok = false;
    for (const [dr, dc] of DIRS) {
      let i = r + dr, j = c + dc, seenOpp = false;
      while (inBounds(N, i, j) && board[i][j] === opp) { i += dr; j += dc; seenOpp = true; }
      if (seenOpp && inBounds(N, i, j) && board[i][j] === player) { ok = true; break; }
    }
    if (ok) moves.push({ row: r, col: c });
  }
  return moves;
}

function builtinMakeMove(board: Board, player: Player, move: Position): Board {
  const N = board.length;
  const opp = opposite[player];
  const next = board.map(row => row.slice());
  const { row: r, col: c } = move;
  next[r][c] = player;
  for (const [dr, dc] of DIRS) {
    let i = r + dr, j = c + dc;
    const path: [number, number][] = [];
    while (inBounds(N, i, j) && next[i][j] === opp) { path.push([i, j]); i += dr; j += dc; }
    if (path.length && inBounds(N, i, j) && next[i][j] === player) {
      for (const [pr, pc] of path) next[pr][pc] = player;
    }
  }
  return next;
}

function builtinIsTerminal(board: Board): boolean {
  const empty = countEmpty(board);
  if (!empty) return true;
  // terminal if neither player has a move
  return builtinGetValidMoves(board, 'black').length === 0 &&
         builtinGetValidMoves(board, 'white').length === 0;
}

export const DefaultRules: RulesAdapter = {
  getValidMoves: builtinGetValidMoves,
  makeMove: builtinMakeMove,
  isTerminal: builtinIsTerminal,
};

// --- Utility analysis ------------------------------------------------------------------------
function countEmpty(board: Board): number {
  let n = 0; for (const row of board) for (const c of row) if (c === null) n++; return n;
}

function listCorners(N: number): Position[] {
  return [
    { row: 0, col: 0 }, { row: 0, col: N - 1 },
    { row: N - 1, col: 0 }, { row: N - 1, col: N - 1 },
  ];
}

function isCorner(N: number, p: Position): boolean {
  return (p.row === 0 && p.col === 0) || (p.row === 0 && p.col === N-1) ||
         (p.row === N-1 && p.col === 0) || (p.row === N-1 && p.col === N-1);
}

function isXSquare(N: number, p: Position): boolean {
  const xs = [ {row:1,col:1}, {row:1,col:N-2}, {row:N-2,col:1}, {row:N-2,col:N-2} ];
  return xs.some(s => s.row === p.row && s.col === p.col);
}

function isCSquare(N: number, p: Position): boolean {
  const cs = [
    {row:0,col:1}, {row:1,col:0}, {row:1,col:2}, {row:2,col:1},
    {row:0,col:N-2}, {row:1,col:N-1}, {row:1,col:N-3}, {row:2,col:N-2},
    {row:N-1,col:1}, {row:N-2,col:0}, {row:N-2,col:2}, {row:N-3,col:1},
    {row:N-1,col:N-2}, {row:N-2,col:N-1}, {row:N-2,col:N-3}, {row:N-3,col:N-2},
  ];
  return cs.some(s => s.row === p.row && s.col === p.col);
}

function frontierCount(board: Board, player: Player): number {
  const N = board.length; const opp = opposite[player];
  let cnt = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (board[r][c] !== player) continue;
    for (const [dr, dc] of DIRS) {
      const i = r + dr, j = c + dc;
      if (inBounds(N, i, j) && board[i][j] === null) { cnt++; break; }
      if (inBounds(N, i, j) && board[i][j] === opp) { /* also frontier-ish */ cnt++; break; }
    }
  }
  return cnt;
}

function legalMoves(board: Board, player: Player, rules: RulesAdapter): Position[] {
  return rules.getValidMoves(board, player);
}

function potentialMobility(board: Board, player: Player): number {
  // Count opponent-adjacent empties as potential
  const N = board.length; const opp = opposite[player];
  let s = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (board[r][c] === null) {
    for (const [dr, dc] of DIRS) {
      const i = r + dr, j = c + dc; if (!inBounds(N, i, j)) continue;
      if (board[i][j] === opp) { s++; break; }
    }
  }
  return s;
}

function stableFromCorners(board: Board, player: Player): number {
  // Very cheap approximation: scan lines from owned corners; contiguous player discs
  const N = board.length; let stable = 0;
  const corners = listCorners(N);
  for (const c of corners) {
    if (board[c.row][c.col] !== player) continue;
    // along row
    let okRow = true; for (let j = 0; j < N; j++) { if (board[c.row][j] !== player) { okRow = false; break; } }
    if (okRow) stable += N;
    // along col
    let okCol = true; for (let i = 0; i < N; i++) { if (board[i][c.col] !== player) { okCol = false; break; } }
    if (okCol) stable += N;
    // diagonals through corner (only two per corner)
    if (c.row === 0 && c.col === 0) {
      let d1 = 0; for (let k = 0; k < N; k++) if (board[k][k] === player) d1++; else break; stable += d1;
    } else if (c.row === 0 && c.col === N-1) {
      let d2 = 0; for (let k = 0; k < N; k++) if (board[k][N-1-k] === player) d2++; else break; stable += d2;
    } else if (c.row === N-1 && c.col === 0) {
      let d3 = 0; for (let k = 0; k < N; k++) if (board[N-1-k][k] === player) d3++; else break; stable += d3;
    } else if (c.row === N-1 && c.col === N-1) {
      let d4 = 0; for (let k = 0; k < N; k++) if (board[N-1-k][N-1-k] === player) d4++; else break; stable += d4;
    }
  }
  return stable;
}

function emptiesRegions(board: Board): number[] {
  // Return sizes of connected empty regions (4-neighborhood)
  const N = board.length; const vis = Array.from({length:N},()=>Array(N).fill(false));
  const sizes: number[] = [];
  const Q: [number, number][] = [];
  const D4: [number, number][] = [[-1,0],[1,0],[0,-1],[0,1]];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (board[r][c] !== null || vis[r][c]) continue;
    // BFS
    vis[r][c] = true; Q.length = 0; Q.push([r,c]); let sz = 0;
    while (Q.length) {
      const [i,j] = Q.shift()!; sz++;
      for (const [dr,dc] of D4) {
        const ni=i+dr,nj=j+dc; if(!inBounds(N,ni,nj)) continue;
        if (board[ni][nj]===null && !vis[ni][nj]) { vis[ni][nj]=true; Q.push([ni,nj]); }
      }
    }
    sizes.push(sz);
  }
  return sizes.sort((a,b)=>a-b);
}

function diagonalOpenToEmptyCorner(board: Board, p: Position): boolean {
  // Heuristic: if placing at p opens a line for opponent into an empty corner via diagonals
  const N = board.length;
  const nearCorner = (
    (p.row <= 2 && p.col <= 2) || (p.row <= 2 && p.col >= N-3) ||
    (p.row >= N-3 && p.col <= 2) || (p.row >= N-3 && p.col >= N-3)
  );
  if (!nearCorner) return false;
  // crude flag: if target corner empty AND one of adjacent diagonal squares becomes our color next move
  const cornerCoords = listCorners(N);
  for (const c of cornerCoords) {
    if (board[c.row][c.col] !== null) continue;
    // if p is on diagonal with corner
    if (Math.abs(p.row - c.row) === Math.abs(p.col - c.col)) return true;
  }
  return false;
}

// --- Core NineAxes Director ------------------------------------------------------------------
export class NineAxesDirector {
  readonly cfg: NineAxesConfig;
  private rules: RulesAdapter;

  constructor(cfg: Partial<NineAxesConfig> = {}, adapters: NineAxesAdapters = {}) {
    const merged: NineAxesConfig = { ...NINE_AXES_DEFAULTS, ...cfg,
      weights: { ...NINE_AXES_DEFAULTS.weights, ...(cfg.weights||{}) },
      riskWeights: { ...NINE_AXES_DEFAULTS.riskWeights, ...(cfg.riskWeights||{}) },
      phase: { ...NINE_AXES_DEFAULTS.phase, ...(cfg.phase||{}) },
    };
    this.cfg = merged;
    this.rules = adapters.rules || DefaultRules;
  }

  // Public API -------------------------------------------------------------------------------
  rankMoves(board: Board, player: Player): RankedMove[] {
    const moves = legalMoves(board, player, this.rules);
    const analyses = moves.map(m => this.evaluateMove(board, player, m));
    // normalize total to [-1,1] over candidates for stability
    const vals = analyses.map(a => a.total);
    const hi = Math.max(...vals, 1e-9), lo = Math.min(...vals, -1e-9);
    const span = Math.max(hi - lo, 1e-6);
    const ranked = analyses
      .map(a => ({...a, total: (a.total - lo) / span * 2 - 1 }))
      .sort((a,b)=>b.total - a.total)
      .map((a,i)=>({ ...a, rank: i+1 }));
    return ranked;
  }

  getOrderingHint(board: Board, player: Player): OrderingHints {
    const ranked = this.rankMoves(board, player);
    const map = new Map<string, number>();
    // Convert normalized total [-1,1] → prior [0, 100]
    for (const r of ranked) map.set(keyOf(r.move), Math.round((r.total + 1) * 50));
    return { byMove: map };
  }

  guardMove(board: Board, player: Player, move: Position): GuardDecision {
    const N = board.length; const empties = countEmpty(board);
    const nearEnd = empties <= this.cfg.phase.lateThreshold;
    const flags: string[] = [];
    let penalty = 0; const reasons: string[] = [];

    if (isXSquare(N, move)) {
      const cornerEmpty = this.adjacentCornerEmpty(board, move);
      if (cornerEmpty && !nearEnd) { penalty += this.cfg.riskWeights.xSquare; reasons.push('X-square near empty corner'); flags.push('x-square'); }
    }
    if (isCSquare(N, move)) {
      const cornerEmpty = this.adjacentCornerEmpty(board, move);
      if (cornerEmpty && !nearEnd) { penalty += this.cfg.riskWeights.cSquare; reasons.push('C-square near empty corner'); flags.push('c-square'); }
    }
    if (diagonalOpenToEmptyCorner(board, move)) {
      penalty += this.cfg.riskWeights.openDiag; reasons.push('opens diagonal to empty corner'); flags.push('open-diag');
    }

    // Over-seal detection: if playing move reduces my potential mobility too much
    const myBefore = potentialMobility(board, player);
    const after = this.rules.makeMove(board, player, move);
    const myAfter = potentialMobility(after, player);
    if (myAfter < Math.max(1, Math.floor(myBefore * 0.45))) {
      penalty += this.cfg.riskWeights.overSeal; reasons.push('over-seal risk (mobility collapse)'); flags.push('over-seal');
    }

    penalty = Math.max(0, Math.min(1, penalty));
    return { allow: penalty < 0.95, penalty, reasons };
  }

  evaluateMove(board: Board, player: Player, move: Position): MoveAnalysis {
    const N = board.length; const rules = this.rules; const opp = opposite[player];
    const empties = countEmpty(board);
    const phase = empties <= this.cfg.phase.lateThreshold ? 'late'
               : empties <= this.cfg.phase.midThreshold  ? 'mid'
               : 'early';

    const flags: string[] = [];
    if (isCorner(N, move)) flags.push('corner');
    if (isXSquare(N, move)) flags.push('x-square');
    if (isCSquare(N, move)) flags.push('c-square');

    const next = rules.makeMove(board, player, move);
    const myMovesAfter = legalMoves(next, player, rules).length;
    const oppMovesAfter = legalMoves(next, opp, rules).length;

    // Quick scorecard deltas (binary-ish signals)
    const quick: QuickScorecardDelta = {
      oppMovesDelta: sign01(legalMoves(board, opp, rules).length - oppMovesAfter), // + if reducing
      myFrontierDelta: sign01(frontierCount(board, player) - frontierCount(next, player)),
      parityFavor: sign01(this.parityFavor(next, player) - this.parityFavor(board, player)),
      cornerExpect: isCorner(N, move) ? +1 : sign01(stableFromCorners(next, player) - stableFromCorners(board, player)),
      xOrCExposure: (isXSquare(N, move) || isCSquare(N, move)) ? -1 : 0,
      diagOpenRisk: diagonalOpenToEmptyCorner(board, move) ? -1 : 0,
      overSealMobility: potentialMobility(next, player) < potentialMobility(board, player) * 0.5 ? -1 : 0,
    };

    // Axis contributions --------------------------------------------------------------------
    const contrib: AxisContribution[] = [];

    contrib.push(this.axisSEN(board, player, move, next, phase));
    contrib.push(this.axisBANG(board, player, move, next));
    contrib.push(this.axisAK(board, player, move, next));
    contrib.push(this.axisYUU(board, player, move, next));
    contrib.push(this.axisBONG(board, player, move, next));
    contrib.push(this.axisHEE(board, player, move, next));
    // 虛/實 split
    const heoSil = this.axisHEO_SIL(board, player, move, next, phase);
    contrib.push(heoSil.heo);
    contrib.push(heoSil.sil);
    // 連/斷 split
    const yeonDan = this.axisYEON_DAN(board, player, move, next);
    contrib.push(yeonDan.yeon);
    contrib.push(yeonDan.dan);
    contrib.push(this.axisGIU(board, player, move, next));

    // Weight and risk application
    let total = 0, wsum = 0; const risks: string[] = [];
    for (const a of contrib) {
      const w = this.cfg.weights[a.key] ?? 1.0; wsum += Math.abs(w);
      total += (a.value || 0) * w;
      if (a.risk && a.risk.length) risks.push(...a.risk);
    }
    total = wsum > 0 ? total / wsum : total;

    // Risk multipliers from guard
    const g = this.guardMove(board, player, move);
    if (!g.allow) risks.push('guard:blocked');
    total *= (1 - g.penalty);

    return { move, total, contributions: contrib, quickScorecard: quick, flags: Array.from(new Set([...flags, ...g.reasons])) };
  }

  explainPlan(board: Board, player: Player, topK = 3): RankedMove[] {
    return this.rankMoves(board, player).slice(0, topK);
  }

  // --- Axis implementations -----------------------------------------------------------------
  private axisSEN(board: Board, player: Player, move: Position, next: Board, phase: 'early'|'mid'|'late'): AxisContribution {
    const N = board.length; const triggers: string[] = []; const risk: string[] = [];
    let v = 0;
    // Priority squares: corners, edge-bisectors that claim edge safely, parity-winning quiets in late
    if (isCorner(N, move)) { v += 1.0; triggers.push('corner'); }
    // Edge claims that do not expose X/C (when adjacent corner owned or filled)
    if (this.safeEdgeClaim(board, player, move)) { v += 0.5; triggers.push('safe-edge-claim'); }
    // Early quiets that deny opponent key points next
    const keyPts = this.findMutualKeyPoints(board, player);
    if (keyPts.some(k => k.row===move.row && k.col===move.col)) { v += 0.4; triggers.push('mutual-key-point'); }
    if (phase === 'late') {
      // In late game, securing last move in subregion is top priority
      v += 0.2 * this.parityFavor(next, player);
    }
    v = clamp01(v);
    return { key: 'SEN', value: v, trigger: triggers, risk };
  }

  private axisBANG(board: Board, player: Player, move: Position, next: Board): AxisContribution {
    const opp = opposite[player]; const triggers: string[] = []; const risk: string[] = [];
    let v = 0;
    // If opponent had a corner access in 1, and move removes it
    const oppBefore = this.cornerThreatSquares(board, opp);
    const oppAfter  = this.cornerThreatSquares(next, opp);
    if (oppBefore.size && oppAfter.size < oppBefore.size) { v += 0.7; triggers.push('corner-access-cut'); }
    // If move reduces opponent replies substantially
    const w = legalMoves(board, opp, this.rules).length;
    const w2 = legalMoves(next, opp, this.rules).length;
    if (w2 <= Math.max(1, Math.floor(w * 0.5))) { v += 0.4; triggers.push('mobility-cut'); }
    // Avoid self-stall
    const myBefore = legalMoves(board, player, this.rules).length;
    const myAfter = legalMoves(next, player, this.rules).length;
    if (myAfter === 0 && w2 > 0) { risk.push('self-stall'); v *= 0.5; }
    v = clamp01(v);
    return { key: 'BANG', value: v, trigger: triggers, risk };
  }

  private axisAK(board: Board, player: Player, move: Position, next: Board): AxisContribution {
    const triggers: string[] = []; const risk: string[] = [];
    let v = 0;
    // Poisoning: If after move, majority of opponent replies are X/C or edge next to empty corner
    const opp = opposite[player];
    const replies = legalMoves(next, opp, this.rules);
    if (replies.length) {
      let bad = 0; const N = board.length;
      for (const r of replies) if (isXSquare(N, r) || isCSquare(N, r) || this.edgeNextToEmptyCorner(board, r)) bad++;
      const ratio = bad / replies.length;
      if (ratio >= 0.67) { v += 0.8; triggers.push('poisoned-replies'); }
    }
    // Value reversal: attack an apparently good edge that actually surrenders parity control to us
    const pf = this.parityFavor(next, player) - this.parityFavor(board, player);
    if (pf > 0.25) { v += 0.2; triggers.push('parity-reversal'); }
    v = clamp01(v);
    return { key: 'AK', value: v, trigger: triggers, risk };
  }

  private axisYUU(board: Board, player: Player, move: Position, next: Board): AxisContribution {
    const triggers: string[] = []; const risk: string[] = [];
    let v = 0;
    // Forced sequence heuristic: if opponent has ≤ K replies and all are inferior by short lookahead
    const K = this.cfg.inductionWidth; const D = this.cfg.inductionDepth;
    const opp = opposite[player];
    const replies = legalMoves(next, opp, this.rules);
    if (replies.length && replies.length <= K) {
      let allInferior = true; let goodBranches = 0;
      for (const r of replies) {
        const b2 = this.rules.makeMove(next, opp, r);
        const my2 = legalMoves(b2, player, this.rules);
        let best2 = -Infinity;
        for (const m2 of my2) {
          const b3 = this.rules.makeMove(b2, player, m2);
          const s2 = this.shortBenefit(board, b3, player, D-1);
          if (s2 > best2) best2 = s2;
        }
        if (best2 <= 0) allInferior = false; else goodBranches++;
      }
      if (allInferior || goodBranches === replies.length) { v += 0.9; triggers.push('forced-sequence'); }
    }
    v = clamp01(v);
    return { key: 'YUU', value: v, trigger: triggers, risk };
  }

  private axisBONG(board: Board, player: Player, move: Position, next: Board): AxisContribution {
    const triggers: string[] = []; const risk: string[] = [];
    let v = 0;
    // Seal if frontier decreases and potential mobility remains ≥ 60%
    const f0 = frontierCount(board, player), f1 = frontierCount(next, player);
    const pm0 = potentialMobility(board, player), pm1 = potentialMobility(next, player);
    if (f1 < f0 && pm1 >= pm0 * 0.6) { v += 0.7; triggers.push('frontier-seal'); }
    // Diagonal/edge lock when adjacent corner is ours or filled
    if (this.sealsCornerLine(board, player, move)) { v += 0.3; triggers.push('corner-line-lock'); }
    v = clamp01(v);
    return { key: 'BONG', value: v, trigger: triggers, risk };
  }

  private axisHEE(board: Board, player: Player, move: Position, next: Board): AxisContribution {
    const triggers: string[] = []; const risk: string[] = [];
    let v = 0;
    // Sacrifice if immediate mobility worsens but 2-ply later we secure corner or stable edge
    const my0 = legalMoves(board, player, this.rules).length;
    const my1 = legalMoves(next, player, this.rules).length;
    if (my1 < my0) {
      const opp = opposite[player];
      const best = this.searchCornerGain(next, player, opp, 2);
      if (best.gainsCorner || best.gainsStability) { v += 0.8; triggers.push(best.gainsCorner?'corner-after-2ply':'stable-edge-after-2ply'); }
      else risk.push('sacrifice-no-reward');
    }
    v = clamp01(v);
    return { key: 'HEE', value: v, trigger: triggers, risk };
  }

  private axisHEO_SIL(board: Board, player: Player, move: Position, next: Board, phase: 'early'|'mid'|'late') {
    const triggersH: string[] = []; const triggersS: string[] = []; const riskH: string[] = []; const riskS: string[] = [];
    let vh = 0, vs = 0;
    const flips = discsFlippedByMove(board, player, move);
    const quiet = flips <= this.cfg.quietFlipLimit;
    const opp = opposite[player];

    if (quiet) {
      // 虛: reduce opponent mobility next turn
      const w0 = legalMoves(board, opp, this.rules).length;
      const w1 = legalMoves(next, opp, this.rules).length;
      if (w1 < w0) { vh += 0.7; triggersH.push('quiet-mobility-down'); }
      if (phase !== 'late' && diagonalOpenToEmptyCorner(board, move)) { riskH.push('quiet-diag-open'); vh *= 0.7; }
    } else {
      // 實: flip more only when it locks stability or secures line/corner
      const stableGain = stableFromCorners(next, player) - stableFromCorners(board, player);
      if (stableGain > 0) { vs += 0.6; triggersS.push('stability-gain'); }
      if (this.sealsCornerLine(board, player, move)) { vs += 0.2; triggersS.push('line-lock'); }
      if (phase === 'late') { vs += 0.2 * this.parityFavor(next, player); }
      if (vs === 0) { riskS.push('fill-without-stability'); }
    }

    return {
      heo: { key: 'HEO', value: clamp01(vh), trigger: triggersH, risk: riskH },
      sil: { key: 'SIL', value: clamp01(vs), trigger: triggersS, risk: riskS },
    };
  }

  private axisYEON_DAN(board: Board, player: Player, move: Position, next: Board) {
    const triggersY: string[] = []; const triggersD: string[] = []; const riskY: string[] = []; const riskD: string[] = [];
    let vy = 0, vd = 0;

    // 연결: my frontier decreases & groups become closer
    const f0 = frontierCount(board, player), f1 = frontierCount(next, player);
    if (f1 < f0) { vy += 0.6; triggersY.push('frontier-down'); }
    if (this.connectsGroups(board, player, move)) { vy += 0.2; triggersY.push('connects-groups'); }

    // 절단: opponent move count in target region decreases; empty regions split increases
    const components0 = emptiesRegions(board).length;
    const components1 = emptiesRegions(next).length;
    if (components1 > components0) { vd += 0.6; triggersD.push('split-regions'); }
    const opp = opposite[player];
    if (legalMoves(next, opp, this.rules).length < legalMoves(board, opp, this.rules).length) { vd += 0.2; triggersD.push('opp-moves-down'); }

    // risk: expose my own cut line
    if (vd>0 && !this.connectsGroups(next, player, move)) { riskD.push('counter-cut-risk'); }

    return {
      yeon: { key: 'YEON', value: clamp01(vy), trigger: triggersY, risk: riskY },
      dan:  { key: 'DAN', value: clamp01(vd), trigger: triggersD, risk: riskD },
    };
  }

  private axisGIU(board: Board, player: Player, move: Position, next: Board): AxisContribution {
    const triggers: string[] = []; const risk: string[] = [];
    let v = 0;
    const pf = this.parityFavor(next, player) - this.parityFavor(board, player);
    if (pf > 0) { v += Math.min(1, pf); triggers.push('parity-improved'); }
    // bonus if move creates odd-sized last region in our favor
    const regs = emptiesRegions(next);
    const odd = regs.filter(x => x % 2 === 1).length;
    if (odd > 0) v += 0.1 * Math.min(3, odd);
    v = clamp01(v);
    return { key: 'GIU', value: v, trigger: triggers, risk };
  }

  // --- Subroutines ---------------------------------------------------------------------------
  private parityFavor(board: Board, player: Player): number {
    // +1 if more odd regions we can control (very rough proxy): odd-regions minus even-regions sign
    const regs = emptiesRegions(board);
    if (regs.length === 0) return 0;
    const odd = regs.filter(x => x % 2 === 1).length;
    const even = regs.length - odd;
    return clamp11((odd - even) / regs.length);
  }

  private adjacentCornerEmpty(board: Board, p: Position): boolean {
    const N = board.length;
    const nearTL = p.row <= 1 && p.col <= 1 && board[0][0] === null;
    const nearTR = p.row <= 1 && p.col >= N-2 && board[0][N-1] === null;
    const nearBL = p.row >= N-2 && p.col <= 1 && board[N-1][0] === null;
    const nearBR = p.row >= N-2 && p.col >= N-2 && board[N-1][N-1] === null;
    return nearTL || nearTR || nearBL || nearBR;
  }

  private edgeNextToEmptyCorner(board: Board, p: Position): boolean {
    const N = board.length;
    const near = (
      (p.row === 0 && (p.col === 1 || p.col === N-2)) ||
      (p.row === N-1 && (p.col === 1 || p.col === N-2)) ||
      (p.col === 0 && (p.row === 1 || p.row === N-2)) ||
      (p.col === N-1 && (p.row === 1 || p.row === N-2))
    );
    if (!near) return false;
    const corners = listCorners(N);
    return corners.some(c => board[c.row][c.col] === null);
  }

  private sealsCornerLine(board: Board, player: Player, move: Position): boolean {
    // If move lies on an edge or diagonal towards a corner we already own or that is filled, mark as partial seal
    const N = board.length; const corners = listCorners(N);
    for (const c of corners) {
      const cornerOwner = board[c.row][c.col];
      if (cornerOwner === null) continue;
      // Same line row
      if (move.row === c.row) {
        const min = Math.min(move.col, c.col), max = Math.max(move.col, c.col);
        let solid = true;
        for (let j = min; j <= max; j++) if (board[c.row][j] !== cornerOwner && !(j===move.col && board[move.row][move.col]===null)) { solid = false; break; }
        if (solid) return true;
      }
      // Same line col
      if (move.col === c.col) {
        const min = Math.min(move.row, c.row), max = Math.max(move.row, c.row);
        let solid = true;
        for (let i = min; i <= max; i++) if (board[i][c.col] !== cornerOwner && !(i===move.row && board[move.row][move.col]===null)) { solid = false; break; }
        if (solid) return true;
      }
      // Diagonal lock heuristic
      if (Math.abs(move.row - c.row) === Math.abs(move.col - c.col)) return true;
    }
    return false;
  }

  private connectsGroups(board: Board, player: Player, move: Position): boolean {
    // Compare connected components of player's stones before and after; if decreases → connected
    const before = this.countGroups(board, player);
    const after = this.countGroups(this.rules.makeMove(board, player, move), player);
    return after < before;
  }

  private countGroups(board: Board, player: Player): number {
    const N = board.length; const vis = Array.from({length:N},()=>Array(N).fill(false));
    const D4: [number, number][] = [[-1,0],[1,0],[0,-1],[0,1]]; let groups = 0;
    const Q: [number, number][] = [];
    for (let r=0;r<N;r++) for (let c=0;c<N;c++) if (board[r][c]===player && !vis[r][c]) {
      vis[r][c]=true; Q.length=0; Q.push([r,c]); groups++;
      while(Q.length){ const [i,j]=Q.shift()!;
        for(const[dr,dc]of D4){ const ni=i+dr,nj=j+dc; if(!inBounds(N,ni,nj))continue;
          if(board[ni][nj]===player && !vis[ni][nj]){ vis[ni][nj]=true; Q.push([ni,nj]); }
        }
      }
    }
    return groups;
  }

  private shortBenefit(root: Board, leaf: Board, player: Player, depth: number): number {
    // Lightweight eval: parity + mobility + frontier + corner ownership delta
    if (depth <= 0) return this.parityFavor(leaf, player) + 0.1 * (
      legalMoves(leaf, player, this.rules).length - legalMoves(leaf, opposite[player], this.rules).length
    ) - 0.05 * (frontierCount(leaf, player) - frontierCount(leaf, opposite[player]));
    // single-ply extension for tactical sharpness
    const M = legalMoves(leaf, player, this.rules);
    let best = -Infinity;
    for (const m of M) {
      const b2 = this.rules.makeMove(leaf, player, m);
      const s = this.shortBenefit(root, b2, player, depth-1);
      if (s > best) best = s;
    }
    return best === -Infinity ? 0 : best;
  }

  private searchCornerGain(next: Board, me: Player, opp: Player, depth: number): { gainsCorner: boolean; gainsStability: boolean; } {
    // Mini search to check if any line leads me to a corner or significant stability within depth
    const myMoves = legalMoves(next, me, this.rules);
    for (const m of myMoves) {
      const b2 = this.rules.makeMove(next, me, m);
      if (isCorner(b2.length, m)) return { gainsCorner: true, gainsStability: true };
      if (stableFromCorners(b2, me) > stableFromCorners(next, me)) return { gainsCorner: false, gainsStability: true };
      if (depth > 1) {
        const oppMoves = legalMoves(b2, opp, this.rules);
        for (const om of oppMoves) {
          const b3 = this.rules.makeMove(b2, opp, om);
          const rec = this.searchCornerGain(b3, me, opp, depth-1);
          if (rec.gainsCorner || rec.gainsStability) return rec;
        }
      }
    }
    return { gainsCorner: false, gainsStability: false };
  }

  private safeEdgeClaim(board: Board, player: Player, move: Position): boolean {
    const N = board.length;
    const onEdge = move.row===0 || move.row===N-1 || move.col===0 || move.col===N-1;
    if (!onEdge) return false;
    // Safe if adjacent corner is mine or filled, and not an immediate C/X trap
    const nearCornerEmpty = this.adjacentCornerEmpty(board, move);
    if (nearCornerEmpty) return false;
    return !isXSquare(N, move) && !isCSquare(N, move);
  }

  private cornerThreatSquares(board: Board, player: Player): Set<string> {
    // Squares that give immediate access to an empty corner next move
    const N = board.length; const res = new Set<string>();
    const corners = listCorners(N).filter(c => board[c.row][c.col] === null);
    if (corners.length === 0) return res;
    const moves = legalMoves(board, player, this.rules);
    for (const m of moves) {
      const b2 = this.rules.makeMove(board, player, m);
      for (const c of corners) {
        // If next we can take corner
        const my2 = legalMoves(b2, player, this.rules);
        if (my2.some(n => n.row===c.row && n.col===c.col)) res.add(keyOf(m));
      }
    }
    return res;
  }

  private findMutualKeyPoints(board: Board, player: Player): Position[] {
    // Points both sides value highly now: corners empty, stable-creating edges, parity-closing quiets
    const N = board.length; const opp = opposite[player];
    const my = legalMoves(board, player, this.rules);
    const op = legalMoves(board, opp, this.rules);
    const setOp = new Set(op.map(keyOf));
    const points: Position[] = [];
    for (const m of my) {
      if (isCorner(N, m)) points.push(m);
      else if (setOp.has(keyOf(m))) points.push(m);
      else if (this.safeEdgeClaim(board, player, m)) points.push(m);
      else if (discsFlippedByMove(board, player, m) <= this.cfg.quietFlipLimit && this.parityFavor(this.rules.makeMove(board, player, m), player) > this.parityFavor(board, player)) points.push(m);
    }
    return dedupPositions(points);
  }
}

// --- Helpers ---------------------------------------------------------------------------------
function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }
function clamp11(x: number) { return Math.max(-1, Math.min(1, x)); }
function sign01(delta: number): number { return delta > 0 ? +1 : delta < 0 ? -1 : 0; }

function dedupPositions(xs: Position[]): Position[] { const seen = new Set<string>(); const out: Position[] = []; for (const p of xs) { const k = keyOf(p); if (!seen.has(k)) { seen.add(k); out.push(p); } } return out; }

function discsFlippedByMove(board: Board, player: Player, move: Position): number {
  // Count how many discs would flip if move is applied
  const N = board.length; const opp = opposite[player];
  let flips = 0;
  for (const [dr,dc] of DIRS) {
    let i=move.row+dr, j=move.col+dc; let streak = 0;
    while (inBounds(N,i,j) && board[i][j]===opp) { streak++; i+=dr; j+=dc; }
    if (streak && inBounds(N,i,j) && board[i][j]===player) flips += streak;
  }
  return flips;
}

// ---------------------------------------------------------------------------------------------
// Example glue for external engines
// ---------------------------------------------------------------------------------------------
export interface OrderingIntegration {
  // Provide a per-move prior to your move ordering
  getPrior: (board: Board, player: Player) => Map<string, number>;
  // For pruning guards: check if a move is too risky early
  guard: (board: Board, player: Player, move: Position) => GuardDecision;
}

export function createNineAxesIntegration(cfg: Partial<NineAxesConfig> = {}, adapters: NineAxesAdapters = {}): OrderingIntegration {
  const director = new NineAxesDirector(cfg, adapters);
  return {
    getPrior: (board, player) => director.getOrderingHint(board, player).byMove,
    guard: (board, player, move) => director.guardMove(board, player, move),
  };
}

// ---------------------------------------------------------------------------------------------
// Lightweight demo usage (remove in production)
// ---------------------------------------------------------------------------------------------
export function demoPlan(board: Board, player: Player, topK = 5) {
  const d = new NineAxesDirector();
  return d.explainPlan(board, player, topK);
}


/* *******************************************************************************************
 * CosmicOthelloAI — A new AI built on Nine Axes + Entropy-Regularized Soft Minimax
 * ---------------------------------------------------------------------------------
 * 목표: 전통적 알파베타/북 의존에서 벗어나, 9축(전략장) + 정보엔트로피(상대 가능성장)
 *       의 이중장(field)을 최소 자유에너지로 정렬하는 우주적 에이전트.
 * 핵심 아이디어
 *   - Soft Minimax (log-sum-exp)로 부드러운 최적화: 탐색이 매끄럽고 분기 노이즈에 강함
 *   - 9축 Director의 prior/guard를 정책/가드/리프평가에 전면 활용
 *   - 엔트로피 항(H): 상대 합법수의 불확실성을 줄이는 방향(誘·封와 상응)
 *   - 패리티/안정/프론티어를 축약 지표로 병합
 * 사용법
 *   const agent = new CosmicAgent();
 *   const choice = agent.chooseMove(board, toPlay, { maxDepth: 4 });
 *   choice.move → 착수, choice.explain → 축별/에너지 기반 해설
 *********************************************************************************************/

export interface CosmicConfig {
  maxDepth: number;        // soft minimax depth (plies)
  topK: number;            // expand only top-K by axes prior at each node
  lambdaAxes: number;      // axes total blending weight in leaf eval [0..1]
  betaEntropy: number;     // entropy regularization weight (reduce opponent H)
  tauEarly: number;        // softmax temperature by phase
  tauMid: number;
  tauLate: number;
}

export const COSMIC_DEFAULTS: CosmicConfig = {
  maxDepth: 4,
  topK: 6,
  lambdaAxes: 0.25,
  betaEntropy: 0.35,
  tauEarly: 1.20,
  tauMid: 0.95,
  tauLate: 0.60,
};

export interface MoveChoice {
  move: Position | null;
  value: number;          // expected value from root player's perspective in [-1,1]
  candidates: Array<{
    move: Position; prior: number; softValue: number; guardPenalty: number;
    axesTotal: number; reasons: string[];
  }>;
}

export class CosmicAgent {
  private director: NineAxesDirector;
  private rules: RulesAdapter;
  private cfg: CosmicConfig;

  constructor(cfg: Partial<CosmicConfig> = {}, rules?: RulesAdapter) {
    this.director = new NineAxesDirector();
    this.rules = rules || DefaultRules;
    this.cfg = { ...COSMIC_DEFAULTS, ...cfg };
  }

  chooseMove(board: Board, player: Player, cfg: Partial<CosmicConfig> = {}): MoveChoice {
    const C = { ...this.cfg, ...cfg };
    const empties = countEmpty(board);
    const tau = this.pickTau(empties);

    // Rank by axes and cut to topK for soft-minimax expansion
    const ranked = this.director.rankMoves(board, player).slice(0, C.topK);
    if (ranked.length === 0) {
      // pass or terminal
      if (this.rules.isTerminal && this.rules.isTerminal(board)) {
        return { move: null, value: this.scoreTerminal(board, player), candidates: [] };
      }
      // no move → pass (value = negate opponent's best)
      const opp = opposite[player];
      const val = -this.softValue(board, opp, player, C.maxDepth - 1, tau, C);
      return { move: null, value: val, candidates: [] };
    }

    // Evaluate soft values for each top candidate
    const opp = opposite[player];
    const cands = ranked.map(r => {
      const g = this.director.guardMove(board, player, r.move);
      const after = this.rules.makeMove(board, player, r.move);
      const soft = this.softValue(after, opp, player, C.maxDepth - 1, tau, C);
      const axesTotal = r.total; // already normalized [-1,1]
      const value = (1 - g.penalty) * soft; // guard as multiplicative dampener
      return {
        move: r.move,
        prior: Math.round((r.total + 1) * 50),
        softValue: value,
        guardPenalty: +g.penalty.toFixed(3),
        axesTotal,
        reasons: r.flags,
      };
    });

    // Choose by highest soft value; if tie, higher prior
    cands.sort((a,b)=> (b.softValue - a.softValue) || (b.prior - a.prior));
    const best = cands[0];
    return { move: best.move, value: best.softValue, candidates: cands };
  }

  // --- Soft Minimax with Entropy Regularization ---------------------------------------------
  private softValue(board: Board, toPlay: Player, root: Player, depth: number, tau: number, C: CosmicConfig): number {
    if (this.rules.isTerminal && this.rules.isTerminal(board)) return this.scoreTerminal(board, root);
    if (depth <= 0) return this.leafEval(board, root, C);

    const moves = this.rules.getValidMoves(board, toPlay);
    if (moves.length === 0) return -this.softValue(board, opposite[toPlay], root, depth-1, tau, C);

    // Use axes prior to select promising children (policy prior)
    const ranked = this.director.rankMoves(board, toPlay).slice(0, C.topK);
    if (ranked.length === 0) return this.leafEval(board, root, C);

    const values = ranked.map(r => {
      const after = this.rules.makeMove(board, toPlay, r.move);
      const v = this.softValue(after, opposite[toPlay], root, depth-1, tau, C);
      // Blend with axes total to stabilize shallow horizons
      return (1 - C.lambdaAxes) * v + C.lambdaAxes * r.total; // both in [-1,1]
    });

    // Soft aggregation: max for root side, min for opponent side
    const agg = (player: Player, xs: number[]) => {
      if (player === root) return tau * Math.log(sumExp(xs.map(x => x / tau)));
      // soft-min
      return -tau * Math.log(sumExp(xs.map(x => -x / tau)));
    };

    return clamp11( agg(toPlay, values) );
  }

  private leafEval(board: Board, root: Player, C: CosmicConfig): number {
    // Parity/Frontier/Stability proxy + Entropy regularization (reduce opponent H)
    const opp = opposite[root];
    const pf = this.director["parityFavor"].call(this.director, board, root) as number;
    const frontierDelta = frontierCount(board, root) - frontierCount(board, opp);
    const stableDelta = stableFromCorners(board, root) - stableFromCorners(board, opp);
    const Hopp = normalizedEntropyMoves(board, opp, this.rules); // [0,1]

    // Axes snapshot: average of top-3 axes totals from root perspective (policy-look eval)
    const top = this.director.rankMoves(board, root).slice(0, 3);
    const axesAvg = top.length ? top.reduce((s,a)=>s+a.total,0)/top.length : 0;

    const base = clamp11( 0.55*pf - 0.10*sign(frontierDelta) + 0.20*tanh01(stableDelta/16) );
    const val = clamp11( (1 - C.lambdaAxes) * base + C.lambdaAxes * axesAvg - C.betaEntropy * Hopp );
    return val;
  }

  private pickTau(empties: number): number {
    const { midThreshold, lateThreshold } = this.director.cfg.phase;
    if (empties <= lateThreshold) return this.cfg.tauLate;
    if (empties <= midThreshold) return this.cfg.tauMid;
    return this.cfg.tauEarly;
  }

  private scoreTerminal(board: Board, root: Player): number {
    // Normalize disc diff to [-1,1]
    let my=0, op=0; const opp = opposite[root];
    for (const row of board) for (const c of row) { if (c===root) my++; else if (c===opp) op++; }
    return clamp11((my - op)/64);
  }
}

// --- Information-theoretic utilities ---------------------------------------------------------
function normalizedEntropyMoves(board: Board, player: Player, rules: RulesAdapter): number {
  const k = rules.getValidMoves(board, player).length;
  if (k <= 1) return 0; // no uncertainty
  const H = Math.log(k);        // natural log
  const Hmax = Math.log(32);    // practical cap (rarely >32 moves)
  return Math.min(1, H / Hmax);
}

function sumExp(xs: number[]): number { let m = -Infinity; for (const x of xs) if (x>m) m=x; let s=0; for (const x of xs) s+=Math.exp(x-m); return s*Math.exp(m); }
function tanh01(x: number): number { const t = Math.tanh(x); return (t+1)/2*2-1; }
function sign(x: number): number { return x>0?1:x<0?-1:0; }
