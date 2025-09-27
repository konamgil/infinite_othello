var Jt = Object.defineProperty;
var Kt = (f, t, e) => t in f ? Jt(f, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : f[t] = e;
var x = (f, t, e) => Kt(f, typeof t != "symbol" ? t + "" : t, e);
const Yt = 0x0101010101010101n, Qt = 0x8080808080808080n, st = 0xffffffffffffffffn, xt = st ^ Yt, Dt = st ^ Qt;
function dt(f) {
  return (f & Dt) << 1n;
}
function wt(f) {
  return (f & xt) >> 1n;
}
function Mt(f) {
  return f << 8n;
}
function vt(f) {
  return f >> 8n;
}
function St(f) {
  return (f & Dt) << 9n;
}
function bt(f) {
  return (f & xt) << 7n;
}
function kt(f) {
  return (f & Dt) >> 7n;
}
function _t(f) {
  return (f & xt) >> 9n;
}
const te = [
  dt,
  wt,
  Mt,
  vt,
  St,
  bt,
  kt,
  _t
];
function U(f) {
  let t = 0, e = BigInt(f);
  for (; e; )
    t++, e &= e - 1n;
  return t;
}
function Et(f) {
  let t = 0n, e = BigInt(f);
  for (; e > 1n; )
    e >>= 1n, t++;
  return Number(t);
}
function At(f, t) {
  return (7 - f) * 8 + t;
}
function ee(f) {
  if (f < 0 || f > 63) throw new Error("Invalid bit index: " + f);
  const e = 7 - (f / 8 | 0), n = f % 8;
  return [e, n];
}
function Rt(f, t) {
  return 1n << BigInt(At(f, t));
}
function lt(f) {
  const t = [];
  let e = BigInt(f);
  for (; e; ) {
    const n = e & -e, r = Et(n), [s, i] = ee(r);
    t.push({ row: s, col: i }), e ^= n;
  }
  return t;
}
function Ot(f) {
  return f && typeof f.length == "number" && typeof f.subarray == "function";
}
function ne(f) {
  const t = new Uint8Array(64);
  for (let e = 0; e < 8; e++)
    for (let n = 0; n < 8; n++) {
      const r = f[e][n];
      t[e * 8 + n] = r === "black" ? 1 : r === "white" ? 2 : 0;
    }
  return t;
}
function re(f) {
  let t = 0n, e = 0n;
  for (let n = 0; n < 64; n++) {
    const r = f[n] | 0;
    if (r === 0) continue;
    const s = n / 8 | 0, i = n % 8, o = At(s, i), c = 1n << BigInt(o);
    r === 1 ? t |= c : r === 2 && (e |= c);
  }
  return { bp: t, wp: e };
}
function N(f) {
  let t;
  if (Ot(f) ? t = f : Array.isArray(f) && Array.isArray(f[0]) ? t = ne(f) : Array.isArray(f) ? t = Uint8Array.from(f) : f && f.cells && Ot(f.cells) ? t = f.cells : t = new Uint8Array(64), t._bp === void 0 || t._wp === void 0) {
    const { bp: e, wp: n } = re(t);
    t._bp = e, t._wp = n;
  }
  return t;
}
function se(f, t, e) {
  let n = e(f) & t;
  return n |= e(n) & t, n |= e(n) & t, n |= e(n) & t, n |= e(n) & t, n |= e(n) & t, e(n);
}
function rt(f, t) {
  const e = N(t), n = f === 1 ? e._bp : e._wp, r = f === 1 ? e._wp : e._bp, s = ~(n | r) & st;
  let i = 0n;
  for (const o of te)
    i |= se(n, r, o);
  return i & s;
}
function ft(f) {
  return f === "black" ? 1 : 2;
}
function ie(f, t) {
  const e = ft(f), n = rt(e, t);
  return lt(n);
}
function Tt(f, t, e) {
  let n = 0n, r, s;
  for (r = dt(e), s = 0n; r && r & t; )
    s |= r, r = dt(r);
  for (r & f && (n |= s), r = wt(e), s = 0n; r && r & t; )
    s |= r, r = wt(r);
  for (r & f && (n |= s), r = Mt(e), s = 0n; r && r & t; )
    s |= r, r = Mt(r);
  for (r & f && (n |= s), r = vt(e), s = 0n; r && r & t; )
    s |= r, r = vt(r);
  for (r & f && (n |= s), r = St(e), s = 0n; r && r & t; )
    s |= r, r = St(r);
  for (r & f && (n |= s), r = bt(e), s = 0n; r && r & t; )
    s |= r, r = bt(r);
  for (r & f && (n |= s), r = kt(e), s = 0n; r && r & t; )
    s |= r, r = kt(r);
  for (r & f && (n |= s), r = _t(e), s = 0n; r && r & t; )
    s |= r, r = _t(r);
  return r & f && (n |= s), n;
}
function Ht(f, t, e, n) {
  const r = ft(e), s = N(n), i = Rt(f, t), o = r === 1 ? s._bp : s._wp, c = r === 1 ? s._wp : s._bp;
  return (i & (o | c)) !== 0n ? !1 : Tt(o, c, i) !== 0n;
}
function ct(f, t, e, n) {
  const r = ft(n), s = N(f), i = Rt(t, e), o = r === 1 ? s._bp : s._wp, c = r === 1 ? s._wp : s._bp;
  if ((i & (o | c)) !== 0n) return;
  const l = Tt(o, c, i);
  if (!l) return;
  const a = s._bp, u = s._wp, h = o | i | l, y = c & ~l;
  r === 1 ? (s._bp = h, s._wp = y) : (s._wp = h, s._bp = y);
  let m = l | i;
  for (; m; ) {
    const d = m & -m, E = Et(d);
    s[E] = r, m ^= d;
  }
  return { __native: !0, side: r, row: t, col: e, moveMask: i, flips: l, prevBP: a, prevWP: u };
}
function at(f, t, e) {
  const n = N(f);
  if (!t || !t.__native) return;
  n._bp = t.prevBP, n._wp = t.prevWP;
  let s = t.flips | t.moveMask;
  for (; s; ) {
    const i = s & -s, o = Et(i), c = 1n << BigInt(o), l = (t.prevBP & c) !== 0n, a = (t.prevWP & c) !== 0n;
    n[o] = l ? 1 : a ? 2 : 0, s ^= i;
  }
}
function It(f) {
  const t = N(f), e = t._bp | t._wp;
  return U(~e & st);
}
function Nt(f, t) {
  const e = ft(t), n = N(f), r = 0x100000001b3n, s = 0x100000001b5n;
  let i = 0xcbf29ce484222325n;
  return i ^= n._bp * r & st, i *= s, i ^= n._wp * s & st, i *= r, i ^= BigInt(e & 3), i *= 0x100000001b7n, Number(i & 0xffffffffffffffffn);
}
function Q(f) {
  const t = new Uint8Array(64);
  for (let e = 0; e < 8; e++)
    for (let n = 0; n < 8; n++) {
      const r = f[e][n], s = e * 8 + n;
      r === "black" ? t[s] = 1 : r === "white" ? t[s] = 2 : t[s] = 0;
    }
  return t;
}
function Ct(f) {
  const t = [];
  for (let e = 0; e < 8; e++) {
    const n = [];
    for (let r = 0; r < 8; r++) {
      const s = e * 8 + r, i = f[s];
      i === 1 ? n.push("black") : i === 2 ? n.push("white") : n.push(null);
    }
    t.push(n);
  }
  return t;
}
function Pt(f = crypto.randomUUID()) {
  const t = Array.from({ length: 8 }, () => new Array(8).fill(null));
  t[3][3] = "white", t[3][4] = "black", t[4][3] = "black", t[4][4] = "white";
  const e = Z(t, "black");
  return {
    id: f,
    board: t,
    currentPlayer: "black",
    validMoves: e,
    score: { black: 2, white: 2 },
    status: "playing",
    moveHistory: [],
    canUndo: !1,
    canRedo: !1
  };
}
function Z(f, t) {
  const e = N(Q(f));
  return ie(t, e);
}
function qt(f, t, e) {
  const n = N(Q(f));
  return Ht(t.row, t.col, e, n);
}
function ut(f, t) {
  if (f.status !== "playing")
    return {
      success: !1,
      reason: "game_finished",
      message: "Game is not in playing state"
    };
  if (!(f.currentPlayer === "black" || f.currentPlayer === "white")) return {
    success: !1,
    reason: "not_your_turn",
    message: "Invalid current player"
  };
  const e = N(Q(f.board));
  if (!Ht(t.row, t.col, f.currentPlayer, e))
    return e[t.row * 8 + t.col] !== 0 ? {
      success: !1,
      reason: "occupied",
      message: "Position is already occupied"
    } : {
      success: !1,
      reason: "no_captures",
      message: "Move would not capture any pieces"
    };
  if (!ct(e, t.row, t.col, f.currentPlayer))
    return {
      success: !1,
      reason: "invalid_position",
      message: "Failed to apply move"
    };
  const r = Ct(e), s = [];
  for (let M = 0; M < 8; M++)
    for (let m = 0; m < 8; m++)
      f.board[M][m] !== r[M][m] && !(M === t.row && m === t.col) && s.push({ row: M, col: m });
  const i = {
    row: t.row,
    col: t.col,
    player: f.currentPlayer,
    capturedCells: s,
    timestamp: Date.now()
  }, o = ht(r), c = f.currentPlayer === "black" ? "white" : "black", l = Z(r, c);
  let a = c, u = l, h = "playing";
  if (l.length === 0) {
    const M = Z(r, f.currentPlayer);
    M.length === 0 ? (h = "finished", u = []) : (a = f.currentPlayer, u = M);
  }
  const y = {
    ...f,
    board: r,
    currentPlayer: a,
    validMoves: u,
    score: o,
    status: h,
    moveHistory: [...f.moveHistory, i],
    canUndo: !0,
    canRedo: !1
  };
  return {
    success: !0,
    move: i,
    newGameCore: y,
    capturedCells: s
  };
}
function ht(f) {
  let t = 0, e = 0;
  for (let n = 0; n < 8; n++)
    for (let r = 0; r < 8; r++) {
      const s = f[n][r];
      s === "black" ? t++ : s === "white" && e++;
    }
  return { black: t, white: e };
}
function zt(f) {
  if (f.status === "finished") return !0;
  if (Z(f.board, f.currentPlayer).length > 0) return !1;
  const e = f.currentPlayer === "black" ? "white" : "black";
  return Z(f.board, e).length === 0;
}
function Lt(f) {
  if (!zt(f)) return null;
  const t = ht(f.board);
  let e;
  return t.black > t.white ? e = "black" : t.white > t.black ? e = "white" : e = "draw", {
    winner: e,
    score: t,
    endReason: "normal",
    duration: 0,
    // Should be calculated from game start time
    totalMoves: f.moveHistory.length
  };
}
function jt(f) {
  const t = N(Q(f.board));
  return Nt(t, f.currentPlayer);
}
function oe(f, t) {
  return Z(f, t).length;
}
function ce(f) {
  const t = N(Q(f));
  return It(t);
}
class le {
  constructor(t = {}) {
    x(this, "_currentGame");
    x(this, "_gameHistory", []);
    x(this, "_redoStack", []);
    x(this, "_listeners", []);
    x(this, "_config");
    this._config = {
      maxHistorySize: t.maxHistorySize || 100,
      enableUndo: t.enableUndo ?? !0,
      enableRedo: t.enableRedo ?? !0,
      autoSave: t.autoSave ?? !1
    }, this._currentGame = Pt(), this._gameHistory.push({ ...this._currentGame }), this.emit({ type: "game_started", gameCore: this._currentGame });
  }
  // ===== PUBLIC API =====
  /**
   * Get current game state (immutable)
   */
  get currentGame() {
    return this._currentGame;
  }
  /**
   * Get current player
   */
  get currentPlayer() {
    return this._currentGame.currentPlayer;
  }
  /**
   * Get valid moves for current player
   */
  get validMoves() {
    return this._currentGame.validMoves;
  }
  /**
   * Get current score
   */
  get score() {
    return this._currentGame.score;
  }
  /**
   * Check if game is over
   */
  get isGameOver() {
    return zt(this._currentGame);
  }
  /**
   * Get game result if finished
   */
  get gameResult() {
    return Lt(this._currentGame);
  }
  /**
   * Can undo last move
   */
  get canUndo() {
    return this._config.enableUndo && this._gameHistory.length > 1;
  }
  /**
   * Can redo last undone move
   */
  get canRedo() {
    return this._config.enableRedo && this._redoStack.length > 0;
  }
  /**
   * Make a move
   */
  makeMove(t) {
    if (this.isGameOver)
      return {
        success: !1,
        reason: "game_finished",
        message: "Game is already finished"
      };
    const e = ut(this._currentGame, t);
    if (e.success) {
      if (this._currentGame = e.newGameCore, this._redoStack = [], this._gameHistory.push({ ...this._currentGame }), this._gameHistory.length > this._config.maxHistorySize && this._gameHistory.shift(), this.emit({ type: "move_made", move: e.move, gameCore: this._currentGame }), this.isGameOver) {
        const n = this.gameResult;
        n && this.emit({ type: "game_over", result: n });
      } else
        this.emit({ type: "turn_changed", player: this._currentGame.currentPlayer });
      this._config.autoSave && this.saveToStorage();
    }
    return e;
  }
  /**
   * Undo last move
   */
  undo() {
    if (!this.canUndo) return !1;
    this._redoStack.push({ ...this._currentGame }), this._gameHistory.pop();
    const t = this._gameHistory[this._gameHistory.length - 1];
    return this._currentGame = { ...t }, this.emit({ type: "move_undone", gameCore: this._currentGame }), this.emit({ type: "turn_changed", player: this._currentGame.currentPlayer }), !0;
  }
  /**
   * Redo last undone move
   */
  redo() {
    if (!this.canRedo) return !1;
    const t = this._redoStack.pop();
    return this._currentGame = t, this._gameHistory.push({ ...this._currentGame }), this.emit({ type: "move_redone", gameCore: this._currentGame }), this.emit({ type: "turn_changed", player: this._currentGame.currentPlayer }), !0;
  }
  /**
   * Reset game to initial state
   */
  reset() {
    this._currentGame = Pt(), this._gameHistory = [{ ...this._currentGame }], this._redoStack = [], this.emit({ type: "game_reset", gameCore: this._currentGame }), this.emit({ type: "game_started", gameCore: this._currentGame });
  }
  /**
   * Check if a move is valid
   */
  isValidMove(t) {
    return qt(this._currentGame.board, t, this._currentGame.currentPlayer);
  }
  /**
   * Get all valid moves for current player
   */
  getValidMoves() {
    return Z(this._currentGame.board, this._currentGame.currentPlayer);
  }
  /**
   * Set game status
   */
  setGameStatus(t) {
    this._currentGame.status !== t && (this._currentGame = {
      ...this._currentGame,
      status: t
    });
  }
  /**
   * Get position hash (for engines/caching)
   */
  getPositionHash() {
    return jt(this._currentGame);
  }
  /**
   * Get move history
   */
  getMoveHistory() {
    return this._currentGame.moveHistory;
  }
  /**
   * Get game statistics
   */
  getGameStats() {
    return {
      totalMoves: this._currentGame.moveHistory.length,
      score: this._currentGame.score,
      gameId: this._currentGame.id,
      currentPlayer: this._currentGame.currentPlayer,
      status: this._currentGame.status,
      canUndo: this.canUndo,
      canRedo: this.canRedo,
      validMovesCount: this._currentGame.validMoves.length,
      historySize: this._gameHistory.length
    };
  }
  // ===== EVENT SYSTEM =====
  /**
   * Add event listener
   */
  addEventListener(t) {
    this._listeners.push(t);
  }
  /**
   * Remove event listener
   */
  removeEventListener(t) {
    const e = this._listeners.indexOf(t);
    e !== -1 && this._listeners.splice(e, 1);
  }
  /**
   * Remove all event listeners
   */
  removeAllEventListeners() {
    this._listeners = [];
  }
  emit(t) {
    this._listeners.forEach((e) => {
      try {
        e(t);
      } catch (n) {
        console.error("Error in game event listener:", n);
      }
    });
  }
  // ===== PERSISTENCE =====
  /**
   * Save game state to localStorage
   */
  saveToStorage(t = "othello-game-state") {
    try {
      const e = {
        currentGame: this._currentGame,
        gameHistory: this._gameHistory,
        redoStack: this._redoStack,
        timestamp: Date.now()
      };
      localStorage.setItem(t, JSON.stringify(e));
    } catch (e) {
      console.error("Failed to save game state:", e);
    }
  }
  /**
   * Load game state from localStorage
   */
  loadFromStorage(t = "othello-game-state") {
    try {
      const e = localStorage.getItem(t);
      if (!e) return !1;
      const n = JSON.parse(e);
      return this._currentGame = n.currentGame, this._gameHistory = n.gameHistory || [], this._redoStack = n.redoStack || [], this.emit({ type: "game_started", gameCore: this._currentGame }), !0;
    } catch (e) {
      return console.error("Failed to load game state:", e), !1;
    }
  }
  /**
   * Export game as PGN-like format
   */
  exportGame() {
    const t = this._currentGame.moveHistory.map((r, s) => {
      const i = Math.floor(s / 2) + 1, o = r.player === "black" ? "B" : "W", c = `${String.fromCharCode(97 + r.col)}${r.row + 1}`;
      return `${i}.${o} ${c}`;
    }), e = this.gameResult, n = e ? e.winner === "draw" ? "1/2-1/2" : e.winner === "black" ? "1-0" : "0-1" : "*";
    return [
      `[Game "${this._currentGame.id}"]`,
      '[Black "Player"]',
      '[White "Player"]',
      `[Result "${n}"]`,
      `[Score "${this._currentGame.score.black}-${this._currentGame.score.white}"]`,
      "",
      t.join(" ") + (n !== "*" ? ` ${n}` : "")
    ].join(`
`);
  }
  // ===== ADVANCED FEATURES =====
  /**
   * Create a copy of the current game for simulation
   */
  createSimulation() {
    return JSON.parse(JSON.stringify(this._currentGame));
  }
  /**
   * Apply multiple moves for analysis
   */
  simulateMoves(t) {
    let e = this.createSimulation();
    for (const n of t) {
      const r = ut(e, n);
      if (r.success)
        e = r.newGameCore;
      else
        break;
    }
    return e;
  }
  /**
   * Get game state at specific move number
   */
  getGameStateAtMove(t) {
    return t < 0 || t >= this._gameHistory.length ? null : { ...this._gameHistory[t] };
  }
  /**
   * Dispose of the manager
   */
  dispose() {
    this.removeAllEventListeners(), this._gameHistory = [], this._redoStack = [];
  }
}
const yt = 64;
function $t(f, t = "black") {
  const { black: e, white: n } = ht(f);
  return t === "black" ? e - n : n - e;
}
function Ut(f) {
  if (f === void 0 || Number.isNaN(f))
    return 0;
  const t = Math.tanh(f / 120), e = Math.round(t * yt);
  return Math.max(-yt, Math.min(yt, e));
}
function ae(f, t, e = "black") {
  return {
    perspective: e,
    stoneDiff: $t(f, e),
    normalizedEval: Ut(t)
  };
}
class ue {
  constructor() {
    x(this, "gameCore");
    x(this, "gameStateManager");
    x(this, "bitboard", null);
    this.gameCore = Pt(), this.gameStateManager = new le();
  }
  // ===== 공통 게임 로직 메서드들 =====
  /**
   * 유효한 수 목록 반환
   */
  getValidMoves(t, e) {
    return Z(t, e);
  }
  /**
   * 수의 유효성 검증
   */
  isValidMove(t, e, n) {
    return qt(t, e, n);
  }
  /**
   * 수 시뮬레이션 (비트보드 기반 고속)
   */
  simulateMove(t, e, n) {
    try {
      const r = N(Q(t));
      return ct(r, e.row, e.col, n) ? Ct(r) : null;
    } catch (r) {
      return console.warn("SimulateMove error:", r), null;
    }
  }
  /**
   * 수 적용 (게임 상태 업데이트)
   */
  applyMove(t, e) {
    return ut(t, e);
  }
  /**
   * 점수 계산
   */
  calculateScore(t) {
    return ht(t);
  }
  /**
   * 빈 칸 수 계산
   */
  getEmptySquares(t) {
    return ce(t);
  }
  /**
   * 이동성 계산 (유효한 수의 개수)
   */
  getMobility(t, e) {
    return oe(t, e);
  }
  /**
   * 게임 종료 여부 확인
   */
  isGameOver(t) {
    return zt(t);
  }
  /**
   * 게임 결과 반환
   */
  getGameResult(t) {
    return Lt(t);
  }
  /**
   * 위치 해시 (트랜스포지션 테이블용)
   */
  getPositionHash(t) {
    return jt(t);
  }
  // ===== 비트보드 관련 메서드들 =====
  /**
   * 보드를 비트보드로 변환
   */
  boardToBitBoard(t) {
    return N(Q(t));
  }
  /**
   * 비트보드를 보드로 변환
   */
  bitBoardToBoard(t) {
    return Ct(t);
  }
  /**
   * 비트보드에서 수 적용
   */
  flipPiecesBitboard(t, e, n, r) {
    return ct(t, e, n, r);
  }
  /**
   * 비트보드에서 수 되돌리기
   */
  undoMoveBitboard(t, e) {
    at(t, e);
  }
  // ===== 평가 관련 메서드들 =====
  /**
   * 돌 차이 계산
   */
  getStoneDifference(t, e = "black") {
    return $t(t, e);
  }
  /**
   * 평가 점수를 돌 스케일로 매핑
   */
  mapEvaluationToStoneScale(t) {
    return Ut(t);
  }
  /**
   * 평가 요약
   */
  summarizeEvaluation(t, e, n = "black") {
    return ae(t, e, n);
  }
  // ===== 게임 상태 관리 =====
  /**
   * 게임 상태 관리자 반환
   */
  getGameStateManager() {
    return this.gameStateManager;
  }
  /**
   * 현재 게임 상태 반환
   */
  getCurrentGameCore() {
    return this.gameCore;
  }
  /**
   * 게임 상태 업데이트
   */
  updateGameCore(t) {
    this.gameCore = t;
  }
  // ===== 유틸리티 메서드들 =====
  /**
   * 상대방 플레이어 반환
   */
  getOpponent(t) {
    return t === "black" ? "white" : "black";
  }
  /**
   * 보드 복사
   */
  copyBoard(t) {
    return t.map((e) => [...e]);
  }
  /**
   * 게임 단계 분석 (빈 칸 수 기반)
   */
  analyzeGamePhase(t) {
    const e = this.getEmptySquares(t);
    return e > 50 ? "opening" : e > 20 ? "midgame" : "endgame";
  }
  /**
   * 난이도를 스킬 레벨로 변환
   */
  difficultyToSkill(t) {
    return {
      easy: 25,
      medium: 50,
      hard: 75,
      expert: 90,
      master: 100
    }[t] || 50;
  }
  /**
   * 스킬 레벨을 난이도로 변환
   */
  skillToDifficulty(t) {
    return t <= 30 ? "easy" : t <= 60 ? "medium" : t <= 80 ? "hard" : t <= 95 ? "expert" : "master";
  }
  // ===== 선택적 오버라이드 메서드들 =====
  /**
   * 엔진 초기화 (필요시 오버라이드)
   */
  initialize() {
  }
  /**
   * 엔진 정리 (필요시 오버라이드)
   */
  cleanup() {
  }
  /**
   * 설정 업데이트 (필요시 오버라이드)
   */
  updateConfig(t) {
  }
  // ===== 공통 오류 처리 =====
  /**
   * 폴백 응답 생성
   */
  getFallbackResponse(t) {
    const e = this.getValidMoves(this.gameCore.board, this.gameCore.currentPlayer);
    return {
      bestMove: e.length > 0 ? e[Math.floor(Math.random() * e.length)] : void 0,
      evaluation: 0,
      depth: 0,
      nodes: 1,
      timeUsed: Date.now() - t
    };
  }
  /**
   * 입력 검증
   */
  validateRequest(t) {
    if (!t.gameCore)
      throw new Error("GameCore is required");
    if (!t.gameCore.board)
      throw new Error("Board is required");
    if (!t.gameCore.currentPlayer)
      throw new Error("Current player is required");
  }
}
const nt = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1]
], Wt = [
  [120, -25, 20, 8, 8, 20, -25, 120],
  // 코너: 120 (가장 중요한 전략점)
  [-25, -45, -8, -6, -6, -8, -45, -25],
  // X 자리: -25→-45 (더 위험하게)
  [20, -8, 15, 4, 4, 15, -8, 20],
  // C 자리: 20 (코너 수비)
  [8, -6, 4, 3, 3, 4, -6, 8],
  // 중앙 접근: 8 (중앙 제어보다 약간 높게)
  [8, -6, 4, 3, 3, 4, -6, 8],
  // 대칭
  [20, -8, 15, 4, 4, 15, -8, 20],
  // 대칭
  [-25, -45, -8, -6, -6, -8, -45, -25],
  // X 자리 대칭
  [120, -25, 20, 8, 8, 20, -25, 120]
  // 코너 대칭
];
class fe {
  constructor() {
    // 전략 폴라리티 가드: 외부 전략 신호가 일관되게 뒤집힐 때 완화(ON 권장)
    x(this, "STRATEGIC_POLARITY_GUARD", !0);
    x(this, "weights");
    x(this, "phaseWeights");
    this.weights = this.getDefaultWeights(), this.phaseWeights = this.initializePhaseWeights();
  }
  evaluateBoard(t, e, n, r) {
    var D;
    if (!t || !e || !n)
      return this.getDefaultEvaluationResult();
    const s = this.getOpponent(e), i = this.scanBoard(t, e), o = this.getBlendedWeights(t) ?? (this.phaseWeights.get(n) || this.weights), c = (i.myCount - i.opCount) * o.material, l = (i.posMy - i.posOp) * o.position, a = this.evaluateMobilityComplexFromCache(i) * o.mobility, u = this.normalizeDiff(
      i.frontierMy,
      i.frontierOp,
      /*invert*/
      !0
    ) * o.frontier, h = this.countStableDiscs(t, e), y = this.countStableDiscs(t, s), M = this.normalizeDiff(h, y) * o.stability, m = (i.myCorners - i.opCorners) * 95 + // 코너 1개 차 ≈ 95
    this.evaluateCornerPotential(t, e, s), b = this.clamp(m, -400, 400) * o.corner, d = (i.myEdgeNoCorner - i.opEdgeNoCorner) * 5 + this.evaluateEdgeStructure(t, e, s), E = this.clamp(d, -140, 140) * o.edge, C = this.evaluateCenter(t, e, s) * o.center, k = this.evaluateSafety(t, e) * o.safety;
    let v = this.evaluateStrategic(r) * o.strategic;
    if (this.STRATEGIC_POLARITY_GUARD) {
      const T = Math.abs(v) > 50, P = a >= 0 ? 1 : -1, O = v >= 0 ? 1 : -1;
      if (T && P !== O) {
        v *= 0.7;
        const W = c >= 0 ? 1 : -1, F = b >= 0 ? 1 : -1;
        O !== W && O !== F && (v *= 0.5);
      }
    }
    const S = i.emptyCount, G = S <= 12 ? 1 : S <= 20 ? 0.8 : S <= 28 ? 0.5 : 0, z = S <= 44 && S >= 16 ? 0.35 : 0.1, R = S >= 28 ? 0.55 : 0.2, A = this.parityHeuristic(t, e) * G, V = this.badMovePressure(t, e) * z, L = this.internalDiscRatio(t, e) * R, B = c + l + a + u + M + b + E + C + k + v + A + V + L, g = Math.max(-200, Math.min(200, B));
    typeof process < "u" && ((D = process.env) == null ? void 0 : D.NODE_ENV) === "development" && Math.abs(g) > 150 && console.warn("Zenith: 극단적인 평가 점수 감지", {
      totalScore: B,
      finalScore: g,
      materialScore: c,
      mobilityScore: a,
      strategicScore: v,
      cornerScore: b,
      safetyScore: k,
      player: e,
      empties: i.emptyCount
    });
    const p = this.calculateConfidenceFromCache(i, t, e, a), w = this.calculateDepthByEmpties(S), _ = this.calculateNodesByEmpties(S, i.legalMy);
    return { score: g, depth: w, nodes: _, confidence: p, pv: this.calculatePV(t, e) };
  }
  // ------------------------------------------------------------------
  // Caching scan
  // ------------------------------------------------------------------
  scanBoard(t, e) {
    const n = this.getOpponent(e);
    let r = 0, s = 0, i = 0, o = 0, c = 0, l = 0, a = 0, u = 0, h = 0, y = 0, M = 0;
    const m = /* @__PURE__ */ new Set(), b = /* @__PURE__ */ new Set(), d = (v, S) => (v === 0 || v === 7) && (S === 0 || S === 7), E = (v, S) => (v === 0 || v === 7 || S === 0 || S === 7) && !d(v, S);
    for (let v = 0; v < 8; v++) for (let S = 0; S < 8; S++) {
      const G = t[v][S];
      if (G === e) {
        r++, o += Wt[v][S], d(v, S) ? l++ : E(v, S) && u++, this.adjacentEmpty(t, v, S) && y++;
        for (const [z, R] of nt) {
          const A = v + z, V = S + R;
          A >= 0 && A < 8 && V >= 0 && V < 8 && t[A][V] === null && b.add(A + "," + V);
        }
      } else if (G === n) {
        s++, c += Wt[v][S], d(v, S) ? a++ : E(v, S) && h++, this.adjacentEmpty(t, v, S) && M++;
        for (const [z, R] of nt) {
          const A = v + z, V = S + R;
          A >= 0 && A < 8 && V >= 0 && V < 8 && t[A][V] === null && m.add(A + "," + V);
        }
      } else
        i++;
    }
    let C = 0, k = 0;
    for (let v = 0; v < 8; v++) for (let S = 0; S < 8; S++)
      t[v][S] === null && (this.isValidMove(t, { row: v, col: S }, e) && C++, this.isValidMove(t, { row: v, col: S }, n) && k++);
    return {
      myCount: r,
      opCount: s,
      emptyCount: i,
      posMy: o,
      posOp: c,
      myCorners: l,
      opCorners: a,
      myEdgeNoCorner: u,
      opEdgeNoCorner: h,
      frontierMy: y,
      frontierOp: M,
      potMy: m.size,
      potOp: b.size,
      legalMy: C,
      legalOp: k
    };
  }
  adjacentEmpty(t, e, n) {
    for (const [r, s] of nt) {
      const i = e + r, o = n + s;
      if (i >= 0 && i < 8 && o >= 0 && o < 8 && t[i][o] === null) return !0;
    }
    return !1;
  }
  // ------------------------------------------------------------------
  // Components
  // ------------------------------------------------------------------
  /** Mobility: Actual & Potential 블렌딩(초반 Potential↑, 후반 Actual↑); frontier 보정 제거 */
  evaluateMobilityComplexFromCache(t) {
    const e = this.normalizeDiff(t.legalMy, t.legalOp), n = this.normalizeDiff(t.potMy, t.potOp), r = t.emptyCount;
    let s;
    r >= 44 ? s = 0.35 : r >= 32 ? s = 0.5 : r >= 20 ? s = 0.68 : r >= 12 ? s = 0.8 : s = 0.9;
    const i = e * s + n * (1 - s);
    return this.clamp(i, -100, 100);
  }
  /** Frontier normalized (opponent frontier > mine ⇒ good) */
  normalizeDiff(t, e, n = !1) {
    const r = t + e;
    if (!r) return 0;
    const s = (t - e) / r * 100;
    return n ? -s : s;
  }
  /** Center: 중앙 4칸 + 주변 8칸 제어 (페이즈별 가중치 적용) */
  evaluateCenter(t, e, n) {
    const s = this.countEmptySquares(t) > 35, i = [[3, 3], [3, 4], [4, 3], [4, 4]], o = [[2, 2], [2, 3], [2, 4], [2, 5], [3, 2], [3, 5], [4, 2], [4, 5], [5, 2], [5, 3], [5, 4], [5, 5]];
    let c = 0;
    for (const [a, u] of i)
      t[a][u] === e ? c += s ? 25 : 20 : t[a][u] === n && (c -= s ? 25 : 20);
    for (const [a, u] of o)
      t[a][u] === e ? c += s ? 12 : 8 : t[a][u] === n && (c -= s ? 12 : 8);
    const l = i.filter(([a, u]) => t[a][u] === e).length;
    return l === 4 ? c += s ? 30 : 20 : l >= 3 && (c += s ? 15 : 10), c;
  }
  /** Safety: X/C + 빈 코너 인접 엣지 경계 (게임 페이즈별 강화) */
  evaluateSafety(t, e) {
    let n = 0;
    const r = this.getOpponent(e), i = this.countEmptySquares(t) > 35, o = [
      [1, 1, 0, 0],
      [1, 6, 0, 7],
      [6, 1, 7, 0],
      [6, 6, 7, 7]
    ];
    for (const [u, h, y, M] of o) {
      if (t[y][M] !== null) continue;
      const m = this.opensCornerNext(t, [y, M], e), b = this.opensCornerNext(t, [y, M], r);
      i ? (t[u][h] === e && (n -= b ? 120 : 80), t[u][h] === r && (n += m ? 100 : 60)) : (t[u][h] === e && (n -= b ? 60 : 35), t[u][h] === r && (n += m ? 45 : 25));
    }
    const c = [
      { corner: [0, 0], cells: [[0, 1], [1, 0]] },
      { corner: [0, 7], cells: [[0, 6], [1, 7]] },
      { corner: [7, 0], cells: [[6, 0], [7, 1]] },
      { corner: [7, 7], cells: [[6, 7], [7, 6]] }
    ];
    for (const u of c) {
      const [h, y] = u.corner;
      if (t[h][y] !== null) continue;
      const M = this.opensCornerNext(t, [h, y], e), m = this.opensCornerNext(t, [h, y], r);
      for (const [b, d] of u.cells)
        i ? t[b][d] === e ? n -= m ? 90 : 60 : t[b][d] === r && (n += M ? 75 : 45) : t[b][d] === e ? n -= m ? 45 : 25 : t[b][d] === r && (n += M ? 35 : 18);
    }
    const l = (u, h) => t[u][h] === null, a = (u, h) => !!(u === 0 && (h <= 1 && l(0, 0) || h >= 6 && l(0, 7)) || u === 7 && (h <= 1 && l(7, 0) || h >= 6 && l(7, 7)) || h === 0 && (u <= 1 && l(0, 0) || u >= 6 && l(7, 0)) || h === 7 && (u <= 1 && l(0, 7) || u >= 6 && l(7, 7)));
    for (let u = 0; u < 8; u++) for (let h = 0; h < 8; h++)
      (u === 0 || u === 7 || h === 0 || h === 7) && t[u][h] === e && a(u, h) && (n -= 6);
    return n;
  }
  opensCornerNext(t, e, n) {
    const [r, s] = e;
    if (t[r][s] !== null) return !1;
    const i = this.getOpponent(n);
    for (const [o, c] of nt) {
      let l = r + o, a = s + c, u = !1;
      for (; l >= 0 && l < 8 && a >= 0 && a < 8; ) {
        const h = t[l][a];
        if (h === i) {
          u = !0, l += o, a += c;
          continue;
        }
        if (h === n && u) return !0;
        break;
      }
    }
    return !1;
  }
  /** Strategic layer: mix normalized factors (±100 기대) */
  evaluateStrategic(t) {
    return t ? 0.3 * (t.mobility ?? 0) + 0.2 * (t.frontier ?? 0) + 0.2 * (t.stability ?? 0) + 0.15 * (t.cornerControl ?? 0) + 0.1 * (t.edgeControl ?? 0) + 0.05 * (t.centerControl ?? 0) : 0;
  }
  // ------------------------------------------------------------------
  // Legal moves / helpers
  // ------------------------------------------------------------------
  isValidMove(t, e, n) {
    const { row: r, col: s } = e;
    if (r < 0 || r >= 8 || s < 0 || s >= 8 || t[r][s] !== null) return !1;
    const i = this.getOpponent(n);
    for (const [o, c] of nt) {
      let l = r + o, a = s + c, u = !1;
      for (; l >= 0 && l < 8 && a >= 0 && a < 8; ) {
        const h = t[l][a];
        if (h === i) {
          u = !0, l += o, a += c;
          continue;
        }
        if (h === n && u) return !0;
        break;
      }
    }
    return !1;
  }
  listValidMoves(t, e) {
    const n = [];
    for (let r = 0; r < 8; r++) for (let s = 0; s < 8; s++)
      this.isValidMove(t, { row: r, col: s }, e) && n.push({ row: r, col: s });
    return n;
  }
  isX(t) {
    const { row: e, col: n } = t;
    return (e === 1 || e === 6) && (n === 1 || n === 6);
  }
  isC(t) {
    const { row: e, col: n } = t;
    return (/* @__PURE__ */ new Set(["0,1", "1,0", "0,6", "1,7", "6,0", "7,1", "6,7", "7,6"])).has(`${e},${n}`);
  }
  // ------------------------------------------------------------------
  // Stability (normalized)
  // ------------------------------------------------------------------
  countStableDiscs(t, e) {
    const n = Array.from({ length: 8 }, () => Array(8).fill(!1)), r = [[0, 0], [0, 7], [7, 0], [7, 7]];
    for (const [c, l] of r) t[c][l] === e && (n[c][l] = !0);
    let s = !0, i = 0;
    for (; s && i++ < 3; ) {
      s = !1;
      for (let c = 0; c < 8; c++) for (let l = 0; l < 8; l++)
        t[c][l] !== e || n[c][l] || this.isDiscStable(t, c, l, e, n) && (n[c][l] = !0, s = !0);
    }
    let o = 0;
    for (let c = 0; c < 8; c++) for (let l = 0; l < 8; l++) n[c][l] && o++;
    return o;
  }
  isDiscStable(t, e, n, r, s) {
    const i = [
      [[0, 1], [0, -1]],
      [[1, 0], [-1, 0]],
      [[1, 1], [-1, -1]],
      [[1, -1], [-1, 1]]
    ];
    for (const [o, c] of i) {
      const l = this.directionSecure(t, e, n, r, s, o[0], o[1]), a = this.directionSecure(t, e, n, r, s, c[0], c[1]);
      if (!(l && a)) return !1;
    }
    return !0;
  }
  directionSecure(t, e, n, r, s, i, o) {
    let c = e + i, l = n + o;
    for (; c >= 0 && c < 8 && l >= 0 && l < 8; ) {
      if (t[c][l] === r) {
        if (s[c][l]) return !0;
        c += i, l += o;
        continue;
      }
      return !1;
    }
    return !0;
  }
  // ------------------------------------------------------------------
  // Advanced nerves
  // ------------------------------------------------------------------
  parityHeuristic(t, e) {
    const n = Array.from({ length: 8 }, () => Array(8).fill(!1)), r = [-1, 1, 0, 0], s = [0, 0, -1, 1], i = [];
    for (let c = 0; c < 8; c++) for (let l = 0; l < 8; l++) {
      if (t[c][l] !== null || n[c][l]) continue;
      const a = [[c, l]];
      let u = 0, h = 0;
      for (n[c][l] = !0; u < a.length; ) {
        const [y, M] = a[u++];
        h++;
        for (let m = 0; m < 4; m++) {
          const b = y + r[m], d = M + s[m];
          b >= 0 && b < 8 && d >= 0 && d < 8 && !n[b][d] && t[b][d] === null && (n[b][d] = !0, a.push([b, d]));
        }
      }
      i.push(h);
    }
    let o = 0;
    for (const c of i) o += c % 2 === 1 ? 8 : -8;
    return this.clamp(o, -100, 100);
  }
  badMovePressure(t, e) {
    const n = this.getOpponent(e), r = this.listValidMoves(t, n);
    if (r.length === 0) return 28;
    let s = 0;
    for (const o of r) (this.isX(o) || this.isC(o)) && s++;
    return (s / r.length * 2 - 1) * 36;
  }
  internalDiscRatio(t, e) {
    let n = 0, r = 0;
    for (let s = 0; s < 8; s++) for (let i = 0; i < 8; i++) {
      if (t[s][i] !== e) continue;
      n++;
      let o = !0;
      for (const [c, l] of nt) {
        const a = s + c, u = i + l;
        if (a >= 0 && a < 8 && u >= 0 && u < 8 && t[a][u] === null) {
          o = !1;
          break;
        }
      }
      o && r++;
    }
    return n ? (r / n * 2 - 1) * 48 : 0;
  }
  // ------------------------------------------------------------------
  // Meta (confidence / depth / nodes)
  // ------------------------------------------------------------------
  calculateConfidenceFromCache(t, e, n, r) {
    const s = t.emptyCount <= 12 ? 70 : t.emptyCount <= 20 ? 62 : t.emptyCount <= 28 ? 58 : t.emptyCount <= 44 ? 54 : 50, i = this.getOpponent(n), o = this.countCorners(e, n) - this.countCorners(e, i), c = r * 0.12 + o * 5;
    return Math.max(10, Math.min(95, s + c));
  }
  calculateDepthByEmpties(t) {
    return t <= 12 ? 20 : t <= 20 ? 16 : t <= 32 ? 12 : 8;
  }
  calculateNodesByEmpties(t, e) {
    const n = t >= 44 ? 8e3 : t >= 28 ? 18e3 : t >= 12 ? 3e4 : 42e3;
    return Math.round(n * (1 + t / 64 * 0.4 + Math.min(e / 20, 1) * 0.3));
  }
  countCorners(t, e) {
    const n = [[0, 0], [0, 7], [7, 0], [7, 7]];
    let r = 0;
    for (const [s, i] of n) t[s][i] === e && r++;
    return r;
  }
  calculatePV(t, e) {
    return [];
  }
  // ------------------------------------------------------------------
  // Corner/Edge helpers (structured & clamped)
  // ------------------------------------------------------------------
  evaluateCornerPotential(t, e, n) {
    const r = [[0, 0], [0, 7], [7, 0], [7, 7]];
    let s = 0, i = 0, o = 0, c = 0;
    for (const [u, h] of r)
      t[u][h] === null && (this.isValidMove(t, { row: u, col: h }, e) && (s += 1), this.isValidMove(t, { row: u, col: h }, n) && (i += 1), this.opensCornerNext(t, [u, h], e) && (o += 1), this.opensCornerNext(t, [u, h], n) && (c += 1));
    const l = (s - i) * 40, a = (o - c) * 20;
    return l + a;
  }
  evaluateEdgeStructure(t, e, n) {
    const r = [
      Array.from({ length: 8 }, (i, o) => t[0][o]),
      Array.from({ length: 8 }, (i, o) => t[7][o]),
      Array.from({ length: 8 }, (i, o) => t[o][0]),
      Array.from({ length: 8 }, (i, o) => t[o][7])
    ];
    let s = 0;
    for (const i of r) {
      const o = new Array(8).fill(!1);
      if (i[0] === null)
        i[1] === e ? s -= 8 : i[1] === n && (s += 6);
      else if (i[0] === e)
        for (let l = 1; l <= 6 && i[l] === e; l++)
          s += 9, o[l] = !0;
      else if (i[0] === n)
        for (let l = 1; l <= 6 && i[l] === n; l++)
          s -= 9, o[l] = !0;
      if (i[7] === null)
        i[6] === e ? s -= 8 : i[6] === n && (s += 6);
      else if (i[7] === e)
        for (let l = 6; l >= 1 && i[l] === e; l--)
          o[l] || (s += 9, o[l] = !0);
      else if (i[7] === n)
        for (let l = 6; l >= 1 && i[l] === n; l--)
          o[l] || (s -= 9, o[l] = !0);
      let c = 1;
      for (; c <= 6; ) {
        if (o[c] || i[c] === null) {
          c += 1;
          continue;
        }
        const l = i[c];
        let a = c;
        for (; c <= 6 && !o[c] && i[c] === l; ) c += 1;
        const u = c - 1, h = i[a - 1], y = i[u + 1], M = u - a + 1, m = h === null, b = y === null, d = m && b;
        l === e ? d ? s -= M * 4 : m || b ? s -= M * 3 : s += M * 3 : l === n && (d || m || b ? s += M * 3 : s -= M * 3);
      }
    }
    return s;
  }
  // ------------------------------------------------------------------
  // Phase weights & blending
  // ------------------------------------------------------------------
  getDefaultWeights() {
    return {
      material: 1,
      position: 0.9,
      // 포지션 과스택 방지
      mobility: 1,
      frontier: 1,
      stability: 1,
      corner: 0.5,
      // 코너 영향 소폭 상향(클램프 확대와 균형)
      edge: 0.45,
      center: 0.3,
      safety: 1,
      strategic: 1
    };
  }
  initializePhaseWeights() {
    const t = /* @__PURE__ */ new Map();
    return t.set("opening", {
      material: 0.1,
      position: 1.1,
      mobility: 1.45,
      frontier: 1,
      stability: 0.6,
      corner: 0.45,
      edge: 0.3,
      center: 0.35,
      safety: 1.15,
      strategic: 1
    }), t.set("midgame", {
      material: 0.3,
      position: 1.05,
      mobility: 1.2,
      frontier: 1,
      stability: 0.9,
      corner: 0.55,
      edge: 0.4,
      center: 0.3,
      safety: 1,
      strategic: 1
    }), t.set("late_midgame", {
      material: 0.55,
      position: 0.95,
      mobility: 1,
      frontier: 1.05,
      stability: 1.2,
      corner: 0.6,
      edge: 0.5,
      center: 0.28,
      safety: 0.9,
      strategic: 1
    }), t.set("endgame", {
      material: 2,
      position: 0.55,
      mobility: 0.4,
      frontier: 0.5,
      stability: 1.5,
      corner: 0.95,
      edge: 0.8,
      center: 0.2,
      safety: 0.7,
      strategic: 1
    }), t;
  }
  getBlendedWeights(t) {
    const e = this.countEmptySquares(t), n = (l, a, u) => l + (a - l) * u, r = (l, a, u) => ({
      material: n(l.material, a.material, u),
      position: n(l.position, a.position, u),
      mobility: n(l.mobility, a.mobility, u),
      frontier: n(l.frontier, a.frontier, u),
      stability: n(l.stability, a.stability, u),
      corner: n(l.corner, a.corner, u),
      edge: n(l.edge, a.edge, u),
      center: n(l.center, a.center, u),
      safety: n(l.safety, a.safety, u),
      strategic: n(l.strategic, a.strategic, u)
    }), s = this.phaseWeights.get("opening"), i = this.phaseWeights.get("midgame"), o = this.phaseWeights.get("late_midgame"), c = this.phaseWeights.get("endgame");
    if (e >= 44) {
      const l = Math.max(0, Math.min(1, (64 - e) / 20));
      return r(s, i, l);
    } else if (e >= 28) {
      const l = Math.max(0, Math.min(1, (44 - e) / 16));
      return r(i, o, l);
    } else if (e >= 12) {
      const l = Math.max(0, Math.min(1, (28 - e) / 16));
      return r(o, c, l);
    } else
      return c;
  }
  countEmptySquares(t) {
    let e = 0;
    for (let n = 0; n < 8; n++) for (let r = 0; r < 8; r++) t[n][r] === null && e++;
    return e;
  }
  // ------------------------------------------------------------------
  // Utils
  // ------------------------------------------------------------------
  clamp(t, e, n) {
    return t < e ? e : t > n ? n : t;
  }
  getOpponent(t) {
    return t === "black" ? "white" : "black";
  }
  getDefaultEvaluationResult() {
    return {
      score: 0,
      depth: 0,
      nodes: 0,
      confidence: 50,
      pv: []
    };
  }
}
class he {
  constructor() {
    x(this, "gamePhase");
    x(this, "opponentProfile");
    this.gamePhase = "opening", this.opponentProfile = null;
  }
  /**
   * Public: Analyze current position
   */
  analyzePosition(t, e, n, r) {
    if (!t || !e || !n)
      return console.warn("StrategicAnalysis: 잘못된 입력 매개변수"), this.getDefaultAnalysisResult();
    this.gamePhase = n, this.opponentProfile = r;
    let s;
    try {
      s = this.analyzeMobility(t, e);
    } catch (o) {
      console.warn("StrategicAnalysis: mobility 분석 실패", o), s = 0;
    }
    const i = {
      mobility: s,
      frontier: this.analyzeFrontier(t, e),
      stability: this.analyzeStability(t, e),
      parity: this.analyzeParity(t, e),
      cornerControl: this.analyzeCornerControl(t, e),
      edgeControl: this.analyzeEdgeControl(t, e),
      centerControl: this.analyzeCenterControl(t, e),
      safety: this.analyzeSafety(t, e),
      summary: "",
      getMoveValue: (o) => this.getMoveValue(o, t, e)
    };
    return i.summary = this.generateSummary(i), i;
  }
  // ---------------------------------------------------------------------------
  // Core strategic metrics
  // ---------------------------------------------------------------------------
  /** Accurate mobility using real legal moves */
  analyzeMobility(t, e) {
    const n = this.getValidMoves(t, e).length, r = this.getValidMoves(t, this.getOpponent(e)).length, s = n + r;
    return s === 0 ? 0 : (n - r) / s * 100;
  }
  /** Frontier (opponentFrontier - myFrontier)/total, fewer frontier is better */
  analyzeFrontier(t, e) {
    const n = this.countFrontierDiscs(t, e), r = this.countFrontierDiscs(t, this.getOpponent(e)), s = n + r;
    return s === 0 ? 0 : (r - n) / s * 100;
  }
  /** Stability: corner-chain propagation on edges (fast, robust approximation) */
  analyzeStability(t, e) {
    const n = this.countStableDiscs(t, e), r = this.countStableDiscs(t, this.getOpponent(e)), s = n + r;
    return s === 0 ? 0 : (n - r) / s * 100;
  }
  /** Parity: simple global parity hint (use small range to keep balanced) */
  analyzeParity(t, e) {
    let n = 0;
    for (let i = 0; i < 8; i++) for (let o = 0; o < 8; o++)
      t[i][o] === null && n++;
    const r = e === "black";
    return n % 2 === (r ? 1 : 0) ? 20 : -20;
  }
  /** Corner control */
  analyzeCornerControl(t, e) {
    const n = [[0, 0], [0, 7], [7, 0], [7, 7]];
    let r = 0, s = 0, i = this.getOpponent(e);
    for (const [c, l] of n)
      t[c][l] === e ? r++ : t[c][l] === i && s++;
    const o = r + s;
    return o === 0 ? 0 : (r - s) / o * 100;
  }
  /** Edge control: avoid corner double-counting */
  analyzeEdgeControl(t, e) {
    let n = 0, r = 0, s = this.getOpponent(e);
    for (let o = 0; o < 8; o++)
      t[0][o] === e ? n++ : t[0][o] === s && r++, t[7][o] === e ? n++ : t[7][o] === s && r++;
    for (let o = 1; o <= 6; o++)
      t[o][0] === e ? n++ : t[o][0] === s && r++, t[o][7] === e ? n++ : t[o][7] === s && r++;
    const i = n + r;
    return i === 0 ? 0 : (n - r) / i * 100;
  }
  /** Center control redefined: INTERNAL discs ratio (anti-frontier) */
  analyzeCenterControl(t, e) {
    const n = this.countInternalDiscs(t, e), r = this.countInternalDiscs(t, this.getOpponent(e)), s = n + r;
    return s === 0 ? 0 : (n - r) / s * 100;
  }
  /** Safety: X/C hazards (corner empty), edge hazards, safe corners */
  analyzeSafety(t, e) {
    let n = 0;
    const r = [[0, 0], [0, 7], [7, 0], [7, 7]];
    for (const [i, o] of r) t[i][o] === e && (n += 8);
    const s = [
      [1, 1, 0, 0],
      [1, 6, 0, 7],
      [6, 1, 7, 0],
      [6, 6, 7, 7]
    ];
    for (const [i, o, c, l] of s)
      t[i][o] === e && t[c][l] === null && (n -= 15);
    return n += this.edgeSafetyScan(t, e), n > 100 && (n = 100), n < -100 && (n = -100), n;
  }
  // ---------------------------------------------------------------------------
  // Move scoring (with Greed-Guard)
  // ---------------------------------------------------------------------------
  getMoveValue(t, e, n) {
    const r = this.simulateMove(e, t, n);
    if (!r) return -1e4;
    const s = this.getPositionValue(t), i = this.getPhaseValue(t, e, n), o = this.isSafeMove(t, e, n), c = this.isDangerousMove(t, e, n), l = this.opponentProfile ? this.getOpponentSpecificValue(t, e, n) : 0;
    let a = 0;
    this.isCorner(t) && (a += 40), this.isEdge(t) && (a += 8), o && (a += 12), c && (a -= 20);
    const u = this.getOpponent(n), h = this.countFrontierDiscs(e, n), y = this.countFrontierDiscs(e, u), M = this.countFrontierDiscs(r, n), m = this.countFrontierDiscs(r, u), b = M - h - (m - y), E = 6 * (this.gamePhase === "opening" ? 1.2 : this.gamePhase === "midgame" ? 0.85 : this.gamePhase === "late_midgame" ? 0.45 : 0);
    let C = 0;
    b > 0 && (C -= b * E);
    const k = this.getValidMoves(r, n).length, S = this.getValidMoves(r, u).length - k;
    S > 3 && (C -= Math.min(15, (S - 3) * 3));
    const G = this.cornerGiveawayPenalty(e, r, n), z = this.xSacrificeJustification(e, r, t, n), R = this.veryEarlyXPenalty(t, e, z);
    return s * 0.6 + i + a + l + C + G + z + R;
  }
  // ===== X/Corner helpers =====
  isXSquare(t) {
    const { row: e, col: n } = t;
    return e === 1 && n === 1 || e === 1 && n === 6 || e === 6 && n === 1 || e === 6 && n === 6;
  }
  cornerForX(t) {
    const { row: e, col: n } = t;
    return e === 1 && n === 1 ? [0, 0] : e === 1 && n === 6 ? [0, 7] : e === 6 && n === 1 ? [7, 0] : e === 6 && n === 6 ? [7, 7] : null;
  }
  cornerGiveawayPenalty(t, e, n) {
    const r = this.getOpponent(n), s = [[0, 0], [0, 7], [7, 0], [7, 7]].filter(([c, l]) => t[c][l] === null);
    if (s.length === 0) return 0;
    const i = this.getValidMoves(e, r);
    if (i.length === 0) return 0;
    let o = 0;
    for (const [c, l] of s)
      if (i.some((a) => a.row === c && a.col === l)) {
        const a = this.gamePhase === "opening" ? 1.3 : this.gamePhase === "midgame" ? 1.1 : this.gamePhase === "late_midgame" ? 0.6 : 0;
        o -= Math.round(80 * a);
      }
    return o;
  }
  xSacrificeJustification(t, e, n, r) {
    if (!this.isXSquare(n)) return 0;
    const s = this.cornerForX(n);
    if (!s) return 0;
    const [i, o] = s;
    if (t[i][o] !== null) return 0;
    let c = 0;
    for (let C = 0; C < 8; C++)
      for (let k = 0; k < 8; k++)
        t[C][k] === null && c++;
    if (c > 20)
      return -50;
    const l = this.getOpponent(r);
    if (!this.getValidMoves(e, l).some((C) => C.row === i && C.col === o)) return 0;
    const u = this.simulateMove(e, { row: i, col: o }, l);
    if (!u) return 0;
    const h = this.getValidMoves(u, r);
    if (h.length === 0) return -100;
    const y = [[0, 0], [0, 7], [7, 0], [7, 7]], M = h.some((C) => y.some(([k, v]) => C.row === k && C.col === v));
    if (!M) return -30;
    let m = 0;
    M && (m += 50);
    let b = -1e9, d = null;
    for (const C of h.slice(0, 8)) {
      const k = this.simulateMove(u, C, r);
      if (!k) continue;
      const v = this.getValidMoves(k, r).length, S = this.getValidMoves(k, l).length, G = (v - S) * 3, z = this.countFrontierDiscs(k, r), A = (this.countFrontierDiscs(k, l) - z) * 2, V = this.isCorner(C) ? 30 : 0, L = this.isEdge(C) && this.isEdgeSafe(C, k) ? 5 : 0, B = G + A + V + L;
      B > b && (b = B, d = k);
    }
    b > 10 && (m += Math.min(b, 40)), d && this.getValidMoves(d, l).length === 0 && (m += 20);
    const E = this.gamePhase === "opening" ? 0.3 : this.gamePhase === "midgame" ? 0.7 : this.gamePhase === "late_midgame" ? 1 : 0.5;
    return m = Math.max(-50, Math.min(30, Math.round(m * E))), m;
  }
  veryEarlyXPenalty(t, e, n) {
    if (!this.isXSquare(t)) return 0;
    const r = this.cornerForX(t);
    if (!r) return 0;
    const [s, i] = r;
    if (e[s][i] !== null) return 0;
    let o = 0;
    for (let l = 0; l < 8; l++) for (let a = 0; a < 8; a++) e[l][a] === null && o++;
    if (o < 50) return 0;
    const c = -80;
    return n >= 50 ? 0 : n > 0 ? Math.floor(c / 2) : c;
  }
  // ---------------------------------------------------------------------------
  // Helpers: geometric categories
  // ---------------------------------------------------------------------------
  isCorner(t) {
    const { row: e, col: n } = t;
    return (e === 0 || e === 7) && (n === 0 || n === 7);
  }
  isEdge(t) {
    const { row: e, col: n } = t;
    return e === 0 || e === 7 || n === 0 || n === 7;
  }
  isCenter4(t) {
    const { row: e, col: n } = t;
    return e >= 3 && e <= 4 && n >= 3 && n <= 4;
  }
  // ---------------------------------------------------------------------------
  // Safety / danger
  // ---------------------------------------------------------------------------
  isSafeMove(t, e, n) {
    return this.isCorner(t) ? !0 : !(this.isDangerousSquare(t, e) || this.isEdge(t) && !this.isEdgeSafe(t, e));
  }
  isDangerousMove(t, e, n) {
    return this.isDangerousSquare(t, e);
  }
  /** X/C if corner empty */
  isDangerousSquare(t, e) {
    const { row: n, col: r } = t, s = [
      [1, 1, 0, 0],
      [1, 6, 0, 7],
      [6, 1, 7, 0],
      [6, 6, 7, 7]
    ];
    for (const [o, c, l, a] of s)
      if (n === o && r === c && e[l][a] === null) return !0;
    const i = [
      { corner: [0, 0], cells: [[0, 1], [1, 0]] },
      { corner: [0, 7], cells: [[0, 6], [1, 7]] },
      { corner: [7, 0], cells: [[6, 0], [7, 1]] },
      { corner: [7, 7], cells: [[6, 7], [7, 6]] }
    ];
    for (const o of i) {
      const [c, l] = o.corner;
      if (e[c][l] === null) {
        for (const [a, u] of o.cells) if (n === a && r === u) return !0;
      }
    }
    return !1;
  }
  /** Edge move safety quick test: avoid playing next to an empty corner on same edge */
  isEdgeSafe(t, e) {
    const { row: n, col: r } = t;
    return !(n === 0 && (r <= 1 && e[0][0] === null || r >= 6 && e[0][7] === null) || n === 7 && (r <= 1 && e[7][0] === null || r >= 6 && e[7][7] === null) || r === 0 && (n <= 1 && e[0][0] === null || n >= 6 && e[7][0] === null) || r === 7 && (n <= 1 && e[0][7] === null || n >= 6 && e[7][7] === null));
  }
  /** Aggregate safety scan for analyzeSafety (small weights) */
  edgeSafetyScan(t, e) {
    let n = 0;
    const r = e;
    return t[0][0] === null && (t[0][1] === r && (n -= 4), t[1][0] === r && (n -= 4)), t[0][7] === null && (t[0][6] === r && (n -= 4), t[1][7] === r && (n -= 4)), t[7][0] === null && (t[7][1] === r && (n -= 4), t[6][0] === r && (n -= 4)), t[7][7] === null && (t[7][6] === r && (n -= 4), t[6][7] === r && (n -= 4)), n;
  }
  // ---------------------------------------------------------------------------
  // Phase & opponent adaptation
  // ---------------------------------------------------------------------------
  getPhaseValue(t, e, n) {
    const r = this.getMobilityValue(t, e, n), s = this.getStabilityValue(t, e, n), i = this.getMaterialValue(t, e, n), o = this.getPositionValue(t);
    switch (this.gamePhase) {
      case "opening":
        return Math.max(-50, Math.min(50, r)) * 0.5 + o * 0.4;
      case "midgame":
        return r * 0.5 + o * 0.3 + s * 0.6;
      case "late_midgame":
        return s * 0.9 + this.getCornerValue(t) * 0.6 + o * 0.2;
      case "endgame":
        return i * 0.8 + s * 0.4 + o * 0.1;
      default:
        return 0;
    }
  }
  getOpponentSpecificValue(t, e, n) {
    if (!this.opponentProfile) return 0;
    const r = this.getStabilityValue(t, e, n), s = this.getMobilityValue(t, e, n);
    switch (this.opponentProfile.style) {
      case "aggressive":
        return r * 0.3;
      case "defensive":
        return s * 0.3;
      case "balanced":
        return (r + s) * 0.15;
      default:
        return 0;
    }
  }
  // ---------------------------------------------------------------------------
  // Micro evaluators used by phase/adaptation
  // ---------------------------------------------------------------------------
  /** Mobility delta after the move (myMoves - oppMoves) * 10 */
  getMobilityValue(t, e, n) {
    const r = this.simulateMove(e, t, n);
    if (!r) return -1e3;
    const s = this.getValidMoves(r, n).length, i = this.getValidMoves(r, this.getOpponent(n)).length;
    return (s - i) * 10;
  }
  /** Positional weights (classic, symmetric) */
  getPositionValue(t) {
    return [
      [120, -20, 20, 5, 5, 20, -20, 120],
      [-20, -60, -5, -5, -5, -5, -60, -20],
      // X-squares: -40 → -60
      [20, -5, 15, 3, 3, 15, -5, 20],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [20, -5, 15, 3, 3, 15, -5, 20],
      [-20, -60, -5, -5, -5, -5, -60, -20],
      // X-squares: -40 → -60
      [120, -20, 20, 5, 5, 20, -20, 120]
    ][t.row][t.col];
  }
  getStabilityValue(t, e, n) {
    return this.isCorner(t) ? 100 : this.isCenter4(t) ? 6 : this.isEdge(t) && this.isEdgeSafe(t, e) ? 24 : 0;
  }
  getCornerValue(t) {
    return this.isCorner(t) ? 100 : 0;
  }
  /** Material delta (myPieces - oppPieces) * 5 after the move */
  getMaterialValue(t, e, n) {
    const r = this.simulateMove(e, t, n);
    if (!r) return -1e3;
    const s = this.countPieces(r, n), i = this.countPieces(r, this.getOpponent(n));
    return (s - i) * 5;
  }
  // ---------------------------------------------------------------------------
  // Board ops (reference 2D version; replace with bitboards for perf later)
  // ---------------------------------------------------------------------------
  simulateMove(t, e, n) {
    const { row: r, col: s } = e;
    if (t[r][s] !== null) return null;
    const i = t.map((a) => [...a]), o = this.getOpponent(n), c = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    let l = 0;
    i[r][s] = n;
    for (const [a, u] of c) {
      const h = this.getFlipsInDirection(i, r, s, a, u, n, o);
      if (h.length)
        for (const { row: y, col: M } of h)
          i[y][M] = n, l++;
    }
    return l === 0 ? null : i;
  }
  getFlipsInDirection(t, e, n, r, s, i, o) {
    const c = [];
    let l = e + r, a = n + s;
    for (; l >= 0 && l < 8 && a >= 0 && a < 8; ) {
      const u = t[l][a];
      if (u === o)
        c.push({ row: l, col: a });
      else {
        if (u === i)
          return c.length ? c : [];
        break;
      }
      l += r, a += s;
    }
    return [];
  }
  getValidMoves(t, e) {
    const n = [];
    for (let r = 0; r < 8; r++)
      for (let s = 0; s < 8; s++)
        t[r][s] === null && this.isValidMove(t, { row: r, col: s }, e) && n.push({ row: r, col: s });
    return n;
  }
  isValidMove(t, e, n) {
    const { row: r, col: s } = e;
    if (t[r][s] !== null) return !1;
    const i = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]], o = this.getOpponent(n);
    for (const [c, l] of i)
      if (this.canFlipInDirection(t, r, s, c, l, n, o)) return !0;
    return !1;
  }
  canFlipInDirection(t, e, n, r, s, i, o) {
    let c = e + r, l = n + s, a = !1;
    for (; c >= 0 && c < 8 && l >= 0 && l < 8; ) {
      const u = t[c][l];
      if (u === o) a = !0;
      else {
        if (u === i) return a;
        break;
      }
      c += r, l += s;
    }
    return !1;
  }
  countPieces(t, e) {
    let n = 0;
    for (let r = 0; r < 8; r++) for (let s = 0; s < 8; s++)
      t[r][s] === e && n++;
    return n;
  }
  getOpponent(t) {
    return t === "black" ? "white" : "black";
  }
  // ---------------------------------------------------------------------------
  // Advanced counters
  // ---------------------------------------------------------------------------
  /** Frontier discs: adjacent to at least one empty square */
  countFrontierDiscs(t, e) {
    let n = 0;
    const r = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    for (let s = 0; s < 8; s++)
      for (let i = 0; i < 8; i++) {
        if (t[s][i] !== e) continue;
        let o = !1;
        for (const [c, l] of r) {
          const a = s + c, u = i + l;
          if (!(a < 0 || a > 7 || u < 0 || u > 7) && t[a][u] === null) {
            o = !0;
            break;
          }
        }
        o && n++;
      }
    return n;
  }
  /** Internal discs: not adjacent to any empty square (anti-frontier) */
  countInternalDiscs(t, e) {
    let n = 0;
    const r = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    for (let s = 0; s < 8; s++)
      for (let i = 0; i < 8; i++) {
        if (t[s][i] !== e) continue;
        let o = !0;
        for (const [c, l] of r) {
          const a = s + c, u = i + l;
          if (!(a < 0 || a > 7 || u < 0 || u > 7) && t[a][u] === null) {
            o = !1;
            break;
          }
        }
        o && n++;
      }
    return n;
  }
  /** Stable discs via corner-driven chain along edges (fast, decent proxy) */
  countStableDiscs(t, e) {
    const n = /* @__PURE__ */ new Set(), r = [
      { r: 0, c: 0, dirs: [[0, 1], [1, 0]] },
      { r: 0, c: 7, dirs: [[0, -1], [1, 0]] },
      { r: 7, c: 0, dirs: [[-1, 0], [0, 1]] },
      { r: 7, c: 7, dirs: [[-1, 0], [0, -1]] }
    ];
    for (const { r: s, c: i, dirs: o } of r)
      if (t[s][i] === e) {
        n.add(`${s},${i}`);
        for (const [c, l] of o) {
          let a = s + c, u = i + l;
          for (; a >= 0 && a < 8 && u >= 0 && u < 8 && t[a][u] === e; )
            n.add(`${a},${u}`), a += c, u += l;
        }
      }
    return n.size;
  }
  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  generateSummary(t) {
    const e = [];
    return t.mobility > 25 ? e.push("모빌리티 우위") : t.mobility < -25 && e.push("모빌리티 열위"), t.cornerControl > 50 ? e.push("코너 컨트롤 우세") : t.cornerControl < -50 && e.push("코너 불리"), t.stability > 25 ? e.push("형태 안정적") : t.stability < -25 && e.push("형태 불안정"), t.frontier > 20 ? e.push("상대 외곽 증가 유도 성공") : t.frontier < -20 && e.push("내 외곽 과다"), t.centerControl > 20 ? e.push("내부 디스크 우세") : t.centerControl < -20 && e.push("내부 디스크 열세"), t.parity > 0 ? e.push("패리티 유리") : e.push("패리티 불리"), t.safety > 20 ? e.push("안전한 국면") : t.safety < -20 && e.push("위험한 국면"), e.length ? e.join(", ") : "균형 상태";
  }
  getDefaultAnalysisResult() {
    return {
      mobility: 0,
      frontier: 0,
      stability: 0,
      parity: 0,
      cornerControl: 0,
      edgeControl: 0,
      centerControl: 0,
      safety: 0,
      summary: "분석 실패",
      getMoveValue: () => 0
    };
  }
}
class ge {
  constructor() {
    x(this, "analysisHistory", []);
    x(this, "patternDatabase", /* @__PURE__ */ new Map());
    this.initializePatternDatabase();
  }
  // ------------------------------------------------------------------
  // PUBLIC API
  // ------------------------------------------------------------------
  /**
   * Fallback: Analyze opponent from moves only (no board context).
   * If possible, prefer analyzeOpponentWithContext for higher fidelity.
   */
  analyzeOpponent(t, e) {
    if (!t || !e || !Array.isArray(e))
      return console.warn("OpponentAnalysis: 잘못된 입력 매개변수"), this.getDefaultProfile();
    const n = this.analyzeMovePatternsFallback(e), r = this.analyzeStrategicPreferencesFallback(e), s = this.analyzeWeaknessTendenciesFallback(e, t), i = this.determinePlayingStyle(n, r), o = {
      style: i,
      preferences: r,
      weaknesses: s,
      summary: this.generateProfileSummary(i, r, s)
    };
    return this.storeAnalysis(o, e), o;
  }
  /**
   * Preferred: Analyze opponent using per-move board context.
   * events: array ordered in time (earliest -> latest).
   */
  analyzeOpponentWithContext(t, e) {
    const n = e.map((l) => l.move), r = this.analyzeMovePatternsCtx(e), s = this.analyzeStrategicPreferencesCtx(e), i = this.analyzeWeaknessTendenciesCtx(e, t), o = this.determinePlayingStyle(r, s), c = {
      style: o,
      preferences: s,
      weaknesses: i,
      summary: this.generateProfileSummary(o, s, i)
    };
    return this.storeAnalysis(c, n), c;
  }
  /** Stats with NaN guards */
  getAnalysisStats() {
    const t = this.analysisHistory.length || 1;
    return {
      totalAnalyses: this.analysisHistory.length,
      // If a real opponentId exists, prefer it. Fallback to summary signature.
      uniqueOpponents: new Set(
        this.analysisHistory.map((e) => e.opponentId ?? e.profile.summary)
      ).size,
      averageMoves: this.analysisHistory.reduce((e, n) => e + n.moves.length, 0) / t,
      patternCount: this.patternDatabase.size
    };
  }
  // ------------------------------------------------------------------
  // MOVE PATTERN ANALYSIS
  // ------------------------------------------------------------------
  /** Fallback (no board): geometry-based ratios */
  analyzeMovePatternsFallback(t) {
    const e = {
      cornerPreference: 0,
      edgePreference: 0,
      centerPreference: 0,
      mobilityStyle: 0.5,
      riskTolerance: 0.5,
      consistency: 1
    };
    if (t.length === 0) return e;
    const n = t.filter((i) => this.isCorner(i)).length, r = t.filter((i) => this.isEdge(i)).length, s = t.filter((i) => this.isCenter(i)).length;
    return e.cornerPreference = n / t.length, e.edgePreference = r / t.length, e.centerPreference = s / t.length, e.mobilityStyle = this.analyzeMobilityStyleFallback(t), e.riskTolerance = this.analyzeRiskToleranceFallback(t), e.consistency = this.analyzeConsistency(t), e;
  }
  /** Context-aware: mobility/risk/stability with boardBefore */
  analyzeMovePatternsCtx(t) {
    const e = t.map((r) => r.move), n = this.analyzeMovePatternsFallback(e);
    return n.mobilityStyle = this.analyzeMobilityStyleCtx(t), n.riskTolerance = this.analyzeRiskToleranceCtx(t), n.consistency = this.analyzeConsistency(e), n;
  }
  // ------------------------------------------------------------------
  // STRATEGIC PREFERENCES
  // ------------------------------------------------------------------
  analyzeStrategicPreferencesFallback(t) {
    const e = [];
    if (t.length === 0) return e;
    const n = t.filter((c) => this.isCorner(c)).length / t.length, r = t.filter((c) => this.isEdge(c)).length / t.length, s = t.filter((c) => this.isCenter(c)).length / t.length;
    return n > 0.3 && e.push("corner_control"), r > 0.4 && e.push("edge_control"), s > 0.2 && e.push("center_control"), this.analyzeMobilityStyleFallback(t) > 0.55 && e.push("mobility_focus"), this.analyzeStabilityPreferenceFallback(t) > 0.55 && e.push("stability_focus"), e;
  }
  analyzeStrategicPreferencesCtx(t) {
    const e = t.map((i) => i.move);
    if (e.length === 0) return [];
    const n = this.analyzeStrategicPreferencesFallback(e), r = this.analyzeStabilityPreferenceCtx(t), s = n.indexOf("stability_focus");
    return r > 0.55 ? s === -1 && n.push("stability_focus") : s !== -1 && n.splice(s, 1), n;
  }
  // ------------------------------------------------------------------
  // WEAKNESS / TENDENCY ANALYSIS
  // ------------------------------------------------------------------
  /** Fallback: do not label "mistake" strongly without context */
  analyzeWeaknessTendenciesFallback(t, e) {
    const n = [];
    return t.length === 0 || (t.some((o) => this.isXSquare(o)) && n.push("x_square_risky_tendency"), t.some((o) => this.isCSquare(o)) && n.push("c_square_risky_tendency"), this.analyzeMobilityRiskFallback(t) > 0.3 && n.push("mobility_risky_tendency"), this.analyzeTimingTendencyFallback(t) > 0.3 && n.push("timing_tendency"), this.analyzeEndgameTendencyFallback(t) > 0.3 && n.push("endgame_risky_tendency")), n;
  }
  analyzeWeaknessTendenciesCtx(t, e) {
    const n = [];
    if (t.length === 0) return n;
    const r = t.map((c) => c.move);
    return t.some((c) => this.isDangerousSquareOn(c.boardBefore, c.move)) && n.push("x_or_c_empty_corner_risk"), this.analyzeMobilityRiskCtx(t) > 0.3 && n.push("mobility_risky_tendency"), this.analyzeTimingTendencyCtx(t) > 0.3 && n.push("timing_tendency"), this.analyzeEndgameTendencyCtx(t) > 0.3 && n.push("endgame_risky_tendency"), r.some((c) => this.isXSquare(c)) && n.push("x_square_usage"), r.some((c) => this.isCSquare(c)) && n.push("c_square_usage"), n;
  }
  // ------------------------------------------------------------------
  // STYLE DETERMINATION
  // ------------------------------------------------------------------
  determinePlayingStyle(t, e) {
    let n = 0, r = 0;
    return t.riskTolerance > 0.6 && (n += 2), e.includes("mobility_focus") && (n += 1), t.consistency < 0.5 && (n += 1), t.edgePreference > 0.5 && (r += 1), t.centerPreference < 0.2 && t.cornerPreference > 0.25 && (r += 2), e.includes("stability_focus") && (r += 2), t.consistency > 0.7 && (r += 1), n > r + 1 ? "aggressive" : r > n + 1 ? "defensive" : "balanced";
  }
  generateProfileSummary(t, e, n) {
    const r = [];
    return r.push(t === "aggressive" ? "Aggressive player" : t === "defensive" ? "Defensive player" : "Balanced player"), e.length && r.push(`Prefers: ${e.join(", ")}`), n.length && r.push(`Tendencies: ${n.join(", ")}`), r.join(" | ");
  }
  storeAnalysis(t, e) {
    const n = {
      timestamp: Date.now(),
      profile: t,
      moves: [...e],
      patterns: this.extractPatterns(e)
    };
    this.analysisHistory.push(n), this.analysisHistory.length > 100 && this.analysisHistory.shift();
  }
  // ------------------------------------------------------------------
  // SUPPORT: PATTERN EXTRACTION (geometric)
  // ------------------------------------------------------------------
  extractPatterns(t) {
    const e = [];
    return t.some((n) => this.isCorner(n)) && e.push("corner_play"), t.some((n) => this.isEdge(n)) && e.push("edge_play"), t.some((n) => this.isCenter(n)) && e.push("center_play"), t.some((n) => this.isXSquare(n)) && e.push("x_square_play"), t.some((n) => this.isCSquare(n)) && e.push("c_square_play"), e;
  }
  // ------------------------------------------------------------------
  // GEOMETRY HELPERS
  // ------------------------------------------------------------------
  isCorner(t) {
    const { row: e, col: n } = t;
    return (e === 0 || e === 7) && (n === 0 || n === 7);
  }
  isEdge(t) {
    const { row: e, col: n } = t;
    return e === 0 || e === 7 || n === 0 || n === 7;
  }
  isCenter(t) {
    const { row: e, col: n } = t;
    return e >= 3 && e <= 4 && n >= 3 && n <= 4;
  }
  isXSquare(t) {
    const { row: e, col: n } = t;
    return e === 1 && n === 1 || e === 1 && n === 6 || e === 6 && n === 1 || e === 6 && n === 6;
  }
  isCSquare(t) {
    const { row: e, col: n } = t;
    return e === 0 && (n === 1 || n === 6) || e === 1 && (n === 0 || n === 7) || e === 6 && (n === 0 || n === 7) || e === 7 && (n === 1 || n === 6);
  }
  // ------------------------------------------------------------------
  // CONSISTENCY (FIXED)
  // ------------------------------------------------------------------
  analyzeConsistency(t) {
    if (t.length < 2) return 1;
    const e = (s) => this.isCorner(s) ? "corner" : this.isXSquare(s) ? "x" : this.isCSquare(s) ? "c" : this.isEdge(s) ? "edge" : this.isCenter(s) ? "center" : "other";
    let n = 0, r = e(t[0]);
    for (let s = 1; s < t.length; s++) {
      const i = e(t[s]);
      i !== r && n++, r = i;
    }
    return 1 - n / (t.length - 1);
  }
  // ------------------------------------------------------------------
  // MOBILITY STYLE
  // ------------------------------------------------------------------
  analyzeMobilityStyleFallback(t) {
    if (t.length === 0) return 0.5;
    const e = new Set(t.map((i) => i.row)).size, n = new Set(t.map((i) => i.col)).size, r = (e + n) / (Math.min(8, t.length) * 2), s = t.filter((i) => i.row >= 2 && i.row <= 5 && i.col >= 2 && i.col <= 5).length / t.length;
    return Math.min(1, r * 0.6 + s * 0.4);
  }
  analyzeMobilityStyleCtx(t) {
    if (t.length === 0) return 0.5;
    let e = 0, n = 0;
    for (const s of t) {
      const i = this.getOpponent(s.player), o = this.getValidMoves(s.boardBefore, s.player).length, c = this.getValidMoves(s.boardBefore, i).length, l = this.simulateMove(s.boardBefore, s.move, s.player);
      if (!l) continue;
      const a = this.getValidMoves(l, s.player).length, u = this.getValidMoves(l, i).length, h = a - o - (u - c);
      e += h, n++;
    }
    if (!n) return this.analyzeMobilityStyleFallback(t.map((s) => s.move));
    const r = e / n;
    return Math.max(0, Math.min(1, 0.5 + r / 12));
  }
  // ------------------------------------------------------------------
  // RISK TOLERANCE
  // ------------------------------------------------------------------
  analyzeRiskToleranceFallback(t) {
    if (t.length === 0) return 0.5;
    let e = 0;
    return e += t.filter((n) => this.isXSquare(n)).length * 0.3, e += t.filter((n) => this.isCSquare(n)).length * 0.2, e -= t.filter((n) => this.isCorner(n)).length * 0.1, Math.max(0, Math.min(1, 0.5 + e / t.length));
  }
  analyzeRiskToleranceCtx(t) {
    if (t.length === 0) return 0.5;
    let e = 0;
    for (const n of t)
      this.isCorner(n.move) ? e -= 0.25 : this.isDangerousSquareOn(n.boardBefore, n.move) ? e += 0.6 : (this.isCSquare(n.move) || this.isXSquare(n.move)) && (e += 0.2);
    return Math.max(0, Math.min(1, 0.5 + e / (t.length * 1.2)));
  }
  // ------------------------------------------------------------------
  // STABILITY PREFERENCE
  // ------------------------------------------------------------------
  analyzeStabilityPreferenceFallback(t) {
    const e = t.filter((n) => this.isCorner(n) || this.isEdge(n)).length;
    return t.length ? e / t.length : 0.5;
  }
  analyzeStabilityPreferenceCtx(t) {
    if (t.length === 0) return 0.5;
    let e = 0;
    for (const n of t) {
      if (this.isCorner(n.move)) {
        e++;
        continue;
      }
      this.isEdge(n.move) && this.isEdgeSafeOn(n.boardBefore, n.move) && e++;
    }
    return e / t.length;
  }
  // ------------------------------------------------------------------
  // WEAKNESS-LIKE TENDENCIES (DETAILS)
  // ------------------------------------------------------------------
  analyzeMobilityRiskFallback(t) {
    if (t.length === 0) return 0;
    let e = 0;
    const n = t.filter((r) => this.isXSquare(r) || this.isCSquare(r)).length;
    return e += n * 0.3, e += this.findClusteredPairs(t) * 0.05, Math.min(1, e / Math.max(1, t.length));
  }
  analyzeMobilityRiskCtx(t) {
    if (t.length === 0) return 0;
    let e = 0, n = 0;
    for (const r of t) {
      const s = this.getOpponent(r.player), i = this.getValidMoves(r.boardBefore, r.player).length, o = this.getValidMoves(r.boardBefore, s).length, c = this.simulateMove(r.boardBefore, r.move, r.player);
      if (!c) continue;
      const l = this.getValidMoves(c, r.player).length, a = this.getValidMoves(c, s).length;
      l - i < 0 && a - o > 0 && e++, n++;
    }
    return n ? e / n : 0;
  }
  analyzeTimingTendencyFallback(t) {
    if (t.length === 0) return 0;
    const e = t.slice(0, Math.min(10, t.length)), n = t.slice(-Math.min(10, t.length));
    let r = 0;
    return r += e.filter((s) => this.isCorner(s)).length * 0.1, r += n.filter((s) => this.isXSquare(s) || this.isCSquare(s)).length * 0.2, Math.min(1, r / Math.max(1, t.length));
  }
  analyzeTimingTendencyCtx(t) {
    if (t.length === 0) return 0;
    const e = Math.min(10, t.length), n = t.slice(0, e), r = t.slice(-e);
    let s = 0;
    s += n.filter((o) => this.isDangerousSquareOn(o.boardBefore, o.move)).length * 0.2;
    const i = r.filter(
      (o) => this.isDangerousSquareOn(o.boardBefore, o.move) || this.isXSquare(o.move) || this.isCSquare(o.move)
    ).length;
    return s += i * 0.25, Math.min(1, s / Math.max(1, t.length));
  }
  analyzeEndgameTendencyFallback(t) {
    if (t.length === 0) return 0;
    const e = Math.min(20, t.length), n = t.slice(-e);
    let r = 0;
    return n.filter((i) => this.isCorner(i)).length / e < 0.3 && (r += 0.4), r += n.filter((i) => this.isXSquare(i) || this.isCSquare(i)).length * 0.2, Math.min(1, r);
  }
  analyzeEndgameTendencyCtx(t) {
    if (t.length === 0) return 0;
    const e = Math.min(20, t.length), n = t.slice(-e);
    let r = 0;
    n.filter((o) => this.isCorner(o.move)).length / e < 0.3 && (r += 0.35);
    const i = n.filter((o) => this.isDangerousSquareOn(o.boardBefore, o.move) || this.isXSquare(o.move) || this.isCSquare(o.move)).length;
    return r += i * 0.25, Math.min(1, r);
  }
  // ------------------------------------------------------------------
  // CLUSTERING
  // ------------------------------------------------------------------
  findClusteredPairs(t) {
    if (t.length < 3) return 0;
    let e = 0;
    for (let n = 0; n < t.length - 1; n++)
      for (let r = n + 1; r < t.length; r++)
        Math.abs(t[n].row - t[r].row) + Math.abs(t[n].col - t[r].col) <= 2 && e++;
    return e;
  }
  // ------------------------------------------------------------------
  // X/C RISK & EDGE SAFETY (BOARD-AWARE)
  // ------------------------------------------------------------------
  isDangerousSquareOn(t, e) {
    const { row: n, col: r } = e, s = [
      [1, 1, 0, 0],
      [1, 6, 0, 7],
      [6, 1, 7, 0],
      [6, 6, 7, 7]
    ];
    for (const [o, c, l, a] of s)
      if (n === o && r === c && t[l][a] === null) return !0;
    const i = [
      { corner: [0, 0], cells: [[0, 1], [1, 0]] },
      { corner: [0, 7], cells: [[0, 6], [1, 7]] },
      { corner: [7, 0], cells: [[6, 0], [7, 1]] },
      { corner: [7, 7], cells: [[6, 7], [7, 6]] }
    ];
    for (const o of i) {
      const [c, l] = o.corner;
      if (t[c][l] === null) {
        for (const [a, u] of o.cells) if (n === a && r === u) return !0;
      }
    }
    return !1;
  }
  isEdgeSafeOn(t, e) {
    const { row: n, col: r } = e;
    return !(n === 0 && (r <= 1 && t[0][0] === null || r >= 6 && t[0][7] === null) || n === 7 && (r <= 1 && t[7][0] === null || r >= 6 && t[7][7] === null) || r === 0 && (n <= 1 && t[0][0] === null || n >= 6 && t[7][0] === null) || r === 7 && (n <= 1 && t[0][7] === null || n >= 6 && t[7][7] === null));
  }
  // ------------------------------------------------------------------
  // MINIMAL OTHELLO OPS (2D) — can be replaced by engine bitboards
  // ------------------------------------------------------------------
  getOpponent(t) {
    return t === "black" ? "white" : "black";
  }
  simulateMove(t, e, n) {
    if (t[e.row][e.col] !== null) return null;
    const r = t.map((c) => [...c]), s = this.getOpponent(n), i = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    let o = 0;
    r[e.row][e.col] = n;
    for (const [c, l] of i) {
      const a = [];
      let u = e.row + c, h = e.col + l;
      for (; u >= 0 && u < 8 && h >= 0 && h < 8 && r[u][h] === s; )
        a.push({ row: u, col: h }), u += c, h += l;
      if (u >= 0 && u < 8 && h >= 0 && h < 8 && r[u][h] === n && a.length)
        for (const y of a)
          r[y.row][y.col] = n, o++;
    }
    return o ? r : null;
  }
  getValidMoves(t, e) {
    const n = [];
    for (let r = 0; r < 8; r++) for (let s = 0; s < 8; s++)
      t[r][s] === null && this.isValidMove(t, { row: r, col: s }, e) && n.push({ row: r, col: s });
    return n;
  }
  isValidMove(t, e, n) {
    if (t[e.row][e.col] !== null) return !1;
    const r = this.getOpponent(n), s = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    for (const [i, o] of s)
      if (this.canFlip(t, e.row, e.col, i, o, n, r)) return !0;
    return !1;
  }
  canFlip(t, e, n, r, s, i, o) {
    let c = e + r, l = n + s, a = !1;
    for (; c >= 0 && c < 8 && l >= 0 && l < 8; ) {
      const u = t[c][l];
      if (u === o) a = !0;
      else {
        if (u === i) return a;
        break;
      }
      c += r, l += s;
    }
    return !1;
  }
  // ------------------------------------------------------------------
  // PATTERN DB (simple reference)
  // ------------------------------------------------------------------
  initializePatternDatabase() {
    this.patternDatabase.set("corner_control", {
      name: "Corner Control",
      description: "Focuses on controlling corners",
      strength: 0.8,
      weakness: 0.2
    }), this.patternDatabase.set("edge_control", {
      name: "Edge Control",
      description: "Focuses on controlling edges",
      strength: 0.6,
      weakness: 0.4
    }), this.patternDatabase.set("mobility_focus", {
      name: "Mobility Focus",
      description: "Focuses on maintaining mobility",
      strength: 0.7,
      weakness: 0.3
    });
  }
  getDefaultProfile() {
    return {
      style: "balanced",
      preferences: [],
      weaknesses: [],
      summary: "분석 실패"
    };
  }
}
const Gt = 0xffffffffffffffffn;
function pe(f, t) {
  return (7 - f) * 8 + t;
}
function Vt(f) {
  return f && typeof f.length == "number" && typeof f.subarray == "function";
}
function me(f) {
  const t = new Uint8Array(64);
  for (let e = 0; e < 8; e++)
    for (let n = 0; n < 8; n++) {
      const r = f[e][n];
      t[e * 8 + n] = r === "black" ? 1 : r === "white" ? 2 : 0;
    }
  return t;
}
function ye(f) {
  let t = 0n, e = 0n;
  for (let n = 0; n < 64; n++) {
    const r = f[n] | 0;
    if (r === 0) continue;
    const s = n / 8 | 0, i = n % 8, o = pe(s, i), c = 1n << BigInt(o);
    r === 1 ? t |= c : r === 2 && (e |= c);
  }
  return { bp: t, wp: e };
}
function Xt(f) {
  let t;
  if (Vt(f) ? t = f : Array.isArray(f) && Array.isArray(f[0]) ? t = me(f) : Array.isArray(f) ? t = Uint8Array.from(f) : f && f.cells && Vt(f.cells) ? t = f.cells : t = new Uint8Array(64), t._bp === void 0 || t._wp === void 0) {
    const { bp: e, wp: n } = ye(t);
    t._bp = e, t._wp = n;
  }
  return t;
}
function de(f) {
  return f === "black" ? 1 : 2;
}
function we(f, t) {
  const e = de(t), n = Xt(f), r = 0x100000001b3n, s = 0x100000001b5n;
  let i = 0xcbf29ce484222325n;
  return i ^= n._bp * r & Gt, i *= s, i ^= n._wp * s & Gt, i *= r, i ^= BigInt(e & 3), i *= 0x100000001b7n, Number(i & 0xffffffffffffffffn);
}
class Me {
  // ε-greedy
  constructor() {
    x(this, "scenarioCache", /* @__PURE__ */ new Map());
    x(this, "predictionHistory", []);
    // playout params
    x(this, "SCENARIOS", 24);
    // number of rollouts
    x(this, "MAX_DEPTH", 16);
    // playout depth cap (in plies)
    x(this, "EPSILON", 0.25);
    this.initializePredictionModels();
  }
  analyzeFutureScenarios(t, e, n) {
    if (!t || !e || typeof n != "number" || n < 0)
      return console.warn("PredictiveSearch: 잘못된 입력 매개변수"), this.getDefaultInsights();
    const r = Math.min(n, this.MAX_DEPTH), s = this.generateScenarios(t, e, r), i = this.softmax(s.map((h) => h.score));
    s.forEach((h, y) => h.probability = i[y]);
    const o = s.map((h) => h.board), c = s.map((h) => h.probability), a = [...s].sort((h, y) => y.score - h.score).map((h) => h.moves), u = {
      scenarios: o,
      probabilities: c,
      bestPaths: a,
      summary: this.generateSummary(o, c, a),
      getMoveValue: (h) => this.getMoveValue(h, s)
    };
    return this.storePrediction(u, t, e), u;
  }
  // ---------------------------------------------------------------------
  // Scenario generation (MC rollouts with ε-greedy)
  // ---------------------------------------------------------------------
  generateScenarios(t, e, n) {
    const r = this.generateCacheKey(t, e, n), s = this.scenarioCache.get(r);
    if (s) return s;
    const i = [];
    for (let o = 0; o < this.SCENARIOS; o++)
      i.push(this.simulateGame(t, e, n));
    return this.scenarioCache.set(r, i), i;
  }
  simulateGame(t, e, n) {
    let r = this.copyBoard(t), s = e;
    const i = [];
    let o = 0, c = 0;
    for (; o < n; ) {
      const a = this.getValidMoves(r, s);
      if (a.length === 0) {
        if (c++, c === 2) break;
        s = this.getOpponent(s), o++;
        continue;
      }
      c = 0;
      const u = this.selectMoveEpsilonGreedy(r, s, a), h = this.makeMove(r, u, s);
      if (!h)
        break;
      r = h, i.push(u), s = this.getOpponent(s), o++;
    }
    const l = this.evaluateBoard(r, e);
    return {
      board: r,
      moves: i,
      score: l,
      depth: i.length,
      probability: 0
    };
  }
  // ε-greedy: with prob ε random; else pick best by quick heuristic
  selectMoveEpsilonGreedy(t, e, n) {
    if (Math.random() < this.EPSILON)
      return n[Math.floor(Math.random() * n.length)];
    let r = n[0], s = -1 / 0;
    for (const i of n) {
      const o = this.quickMoveHeuristic(t, e, i);
      o > s && (s = o, r = i);
    }
    return r;
  }
  // quick heuristic for playout policy (cheap but Othello-aware)
  quickMoveHeuristic(t, e, n) {
    const r = this.getPositionalWeight(n.row, n.col), s = this.xcRisk(n, t), i = this.makeMove(t, n, e);
    if (!i) return -999;
    const o = this.getValidMoves(i, e).length, c = this.getValidMoves(i, this.getOpponent(e)).length;
    return r - s + (o - c) * 2;
  }
  xcRisk(t, e) {
    const { row: n, col: r } = t, s = [[1, 1, 0, 0], [1, 6, 0, 7], [6, 1, 7, 0], [6, 6, 7, 7]];
    for (const [o, c, l, a] of s)
      if (n === o && r === c && e[l][a] === null) return 30;
    const i = [
      { corner: [0, 0], cells: [[0, 1], [1, 0]] },
      { corner: [0, 7], cells: [[0, 6], [1, 7]] },
      { corner: [7, 0], cells: [[6, 0], [7, 1]] },
      { corner: [7, 7], cells: [[6, 7], [7, 6]] }
    ];
    for (const o of i) {
      const [c, l] = o.corner;
      if (e[c][l] === null) {
        for (const [a, u] of o.cells) if (n === a && r === u) return 18;
      }
    }
    return 0;
  }
  // ---------------------------------------------------------------------
  // Scenario probability & value
  // ---------------------------------------------------------------------
  softmax(t) {
    if (t.length === 0) return [];
    const e = Math.max(...t), n = t.map((s) => Math.exp((s - e) / 100)), r = n.reduce((s, i) => s + i, 0);
    return n.map((s) => s / (r || 1));
  }
  getMoveValue(t, e) {
    let n = 0;
    for (const r of e)
      if (r.moves.length > 0) {
        const s = r.moves[0];
        s.row === t.row && s.col === t.col ? n += r.probability * 100 : r.moves.some((i) => i.row === t.row && i.col === t.col) && (n += r.probability * 20);
      }
    return n;
  }
  generateSummary(t, e, n) {
    const r = t.length || 1, s = e.reduce((o, c) => o + c, 0) / r, i = n.reduce((o, c) => o + c.length, 0) / r;
    return `Scenarios=${r}, avgP=${(s * 100).toFixed(1)}%, avgLen=${i.toFixed(1)}`;
  }
  storePrediction(t, e, n) {
    const r = {
      timestamp: Date.now(),
      board: this.copyBoard(e),
      player: n,
      insights: t,
      accuracy: 0
    };
    this.predictionHistory.push(r), this.predictionHistory.length > 200 && this.predictionHistory.shift();
  }
  getPredictionStats() {
    const t = this.predictionHistory.length || 1;
    return {
      totalPredictions: this.predictionHistory.length,
      averageAccuracy: this.predictionHistory.reduce((e, n) => e + n.accuracy, 0) / t,
      cacheSize: this.scenarioCache.size,
      averageScenarios: this.predictionHistory.reduce((e, n) => e + n.insights.scenarios.length, 0) / t
    };
  }
  initializePredictionModels() {
  }
  getDefaultInsights() {
    return {
      scenarios: [],
      probabilities: [],
      bestPaths: [],
      summary: "예측 실패",
      getMoveValue: () => 0
    };
  }
  // ---------------------------------------------------------------------
  // Real Othello mechanics (2D; swap to bitboards later)
  // ---------------------------------------------------------------------
  getValidMoves(t, e) {
    const n = [];
    for (let r = 0; r < 8; r++) for (let s = 0; s < 8; s++)
      t[r][s] === null && this.isValidMove(t, { row: r, col: s }, e) && n.push({ row: r, col: s });
    return n;
  }
  isValidMove(t, e, n) {
    const { row: r, col: s } = e;
    if (t[r][s] !== null) return !1;
    const i = this.getOpponent(n), o = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    for (const [c, l] of o) if (this.canFlip(t, r, s, c, l, n, i)) return !0;
    return !1;
  }
  canFlip(t, e, n, r, s, i, o) {
    let c = e + r, l = n + s, a = !1;
    for (; c >= 0 && c < 8 && l >= 0 && l < 8; ) {
      const u = t[c][l];
      if (u === o) a = !0;
      else {
        if (u === i) return a;
        break;
      }
      c += r, l += s;
    }
    return !1;
  }
  makeMove(t, e, n) {
    if (!this.isValidMove(t, e, n)) return null;
    const r = this.copyBoard(t);
    r[e.row][e.col] = n;
    const s = this.getOpponent(n), i = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    for (const [o, c] of i) {
      const l = this.collectFlips(r, e.row, e.col, o, c, n, s);
      for (const a of l) r[a.row][a.col] = n;
    }
    return r;
  }
  collectFlips(t, e, n, r, s, i, o) {
    const c = [];
    let l = e + r, a = n + s;
    for (; l >= 0 && l < 8 && a >= 0 && a < 8; ) {
      const u = t[l][a];
      if (u === o)
        c.push({ row: l, col: a });
      else {
        if (u === i)
          return c.length ? c : [];
        break;
      }
      l += r, a += s;
    }
    return [];
  }
  evaluateBoard(t, e) {
    const n = this.getOpponent(e);
    let r = 0, s = 0, i = 0;
    for (let u = 0; u < 8; u++) for (let h = 0; h < 8; h++) {
      const y = t[u][h];
      y === e ? (r += this.getPositionalWeight(u, h), s++) : y === n && (r -= this.getPositionalWeight(u, h), i++);
    }
    const o = this.getValidMoves(t, e).length, c = this.getValidMoves(t, n).length, l = s - i, a = (o - c) * 4;
    return r + a + l * 1.5;
  }
  getPositionalWeight(t, e) {
    return [
      [120, -20, 20, 5, 5, 20, -20, 120],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [20, -5, 15, 3, 3, 15, -5, 20],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [20, -5, 15, 3, 3, 15, -5, 20],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [120, -20, 20, 5, 5, 20, -20, 120]
    ][t][e];
  }
  copyBoard(t) {
    return t.map((e) => [...e]);
  }
  generateCacheKey(t, e, n) {
    const r = Xt(t), s = we(r, e);
    return `${e}_${n}_${s}`;
  }
  getOpponent(t) {
    return t === "black" ? "white" : "black";
  }
}
class ve {
  constructor() {
    x(this, "name", "AdaptiveStrategy");
    x(this, "strategyHistory", []);
    x(this, "adaptationRules", /* @__PURE__ */ new Map());
    x(this, "currentStrategy");
    x(this, "ctx");
    this.currentStrategy = this.getDefaultStrategy(), this.initializeAdaptationRules();
  }
  // ------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------
  /** 턴 시작 시 반드시 호출: 이후 getMoveValue가 실보드 문맥을 사용 */
  beginTurn(t, e, n) {
    this.ctx = {
      board: t,
      player: e,
      opp: e === "black" ? "white" : "black",
      analysis: {
        mobility: n.mobility ?? 0,
        frontier: n.frontier ?? 0,
        stability: n.stability ?? 0,
        cornerControl: n.cornerControl ?? 0,
        edgeControl: n.edgeControl ?? 0,
        centerControl: n.centerControl ?? 0,
        safety: n.safety ?? 0
      }
    };
  }
  /**
   * 상황/학습 기반으로 전략 가중치 적응
   */
  adaptStrategy(t, e, n) {
    if (!t || !n)
      return console.warn("AdaptiveStrategy: 잘못된 입력 매개변수"), this;
    const r = this.analyzeSituation(t, e), s = this.determineAdaptationNeeds(r, n);
    for (const [, i] of this.adaptationRules)
      i.condition(r) && i.action(this.currentStrategy);
    return this.applyAdaptations(s), this.storeStrategyChange(r, s), this;
  }
  /**
   * 현재 전략으로 주어진 수의 가치 평가 (턴 컨텍스트 필요)
   */
  getMoveValue(t) {
    if (!this.ctx) return 0;
    const { board: e, player: n, opp: r } = this.ctx, s = this.simulateMove(e, t, n);
    if (!s) return -1e6;
    const i = this.getValidMoves(s, n).length, o = this.getValidMoves(s, r).length, c = i - o, l = this.countFrontierDiscs(e, n), a = this.countFrontierDiscs(e, r), u = this.countFrontierDiscs(s, n), y = this.countFrontierDiscs(s, r) - u - (a - l), M = this.isCorner(t) ? 4 : this.isEdgeSafe(t, e) ? 1 : 0;
    let m = 0;
    m += (this.isCorner(t) ? 100 : 0) * this.currentStrategy.cornerWeight, m += (this.isEdge(t) ? 20 : 0) * this.currentStrategy.edgeWeight, m += (this.isCenter(t) ? 15 : 0) * this.currentStrategy.centerWeight, m += (this.isSafeMove(t, e) ? 30 : 0) * this.currentStrategy.safetyWeight, m += c * 10 * this.currentStrategy.mobilityWeight, m += y * 6 * this.currentStrategy.frontierWeight, m += M * 12 * this.currentStrategy.stabilityWeight;
    const b = `${t.row}-${t.col}`, d = this.currentStrategy.learnedPatterns.get(b);
    return d && (m += d.value * d.confidence), m;
  }
  // ------------------------------------------------------------
  // Situation & Adaptation
  // ------------------------------------------------------------
  analyzeSituation(t, e) {
    return {
      mobility: t.mobility ?? 0,
      frontier: t.frontier ?? 0,
      stability: t.stability ?? 0,
      cornerControl: t.cornerControl ?? 0,
      edgeControl: t.edgeControl ?? 0,
      centerControl: t.centerControl ?? 0,
      safety: t.safety ?? 0,
      opponentStyle: (e == null ? void 0 : e.style) || "balanced",
      opponentPreferences: (e == null ? void 0 : e.preferences) || [],
      opponentWeaknesses: (e == null ? void 0 : e.weaknesses) || [],
      timestamp: Date.now()
    };
  }
  determineAdaptationNeeds(t, e) {
    const n = {
      mobilityAdjustment: 0,
      frontierAdjustment: 0,
      stabilityAdjustment: 0,
      cornerAdjustment: 0,
      edgeAdjustment: 0,
      centerAdjustment: 0,
      safetyAdjustment: 0,
      opponentSpecificAdjustments: []
    };
    return t.mobility < -20 ? n.mobilityAdjustment = 0.3 : t.mobility > 20 && (n.mobilityAdjustment = -0.2), t.frontier < -20 && (n.frontierAdjustment = 0.2), t.stability < -20 && (n.stabilityAdjustment = 0.3), t.cornerControl < -50 && (n.cornerAdjustment = 0.4), t.edgeControl < -10 && (n.edgeAdjustment = 0.15), t.centerControl < -10 && (n.centerAdjustment = 0.1), t.safety < -20 && (n.safetyAdjustment = 0.3), n.opponentSpecificAdjustments = this.getOpponentSpecificAdjustments(t), this.applyLearningAdjustments(n, e), n;
  }
  applyAdaptations(t) {
    const e = this.currentStrategy;
    e.mobilityWeight += t.mobilityAdjustment, e.frontierWeight += t.frontierAdjustment, e.stabilityWeight += t.stabilityAdjustment, e.cornerWeight += t.cornerAdjustment, e.edgeWeight += t.edgeAdjustment, e.centerWeight += t.centerAdjustment, e.safetyWeight += t.safetyAdjustment;
    for (const n of t.opponentSpecificAdjustments)
      this.applyOpponentAdjustment(n);
    this.clampAndNormalize();
  }
  getOpponentSpecificAdjustments(t) {
    const e = [];
    switch (t.opponentStyle) {
      case "aggressive":
        e.push({ type: "stability", value: 0.3, reason: "Opponent is aggressive" });
        break;
      case "defensive":
        e.push({ type: "mobility", value: 0.3, reason: "Opponent is defensive" });
        break;
      case "balanced":
        e.push({ type: "balanced", value: 0.1, reason: "Opponent is balanced" });
        break;
    }
    for (const n of t.opponentWeaknesses)
      e.push({ type: "exploit_weakness", value: 0.2, reason: `Exploit weakness: ${n}` });
    return e;
  }
  applyLearningAdjustments(t, e) {
    const n = this.analyzePositivePatterns(e), r = this.analyzeNegativePatterns(e);
    for (const s of n)
      t.mobilityAdjustment += s.mobilityImpact * 0.1, t.stabilityAdjustment += s.stabilityImpact * 0.1, t.cornerAdjustment += s.cornerImpact * 0.1;
    for (const s of r)
      t.mobilityAdjustment -= s.mobilityImpact * 0.1, t.stabilityAdjustment -= s.stabilityImpact * 0.1, t.cornerAdjustment -= s.cornerImpact * 0.1;
  }
  applyOpponentAdjustment(t) {
    const e = this.currentStrategy;
    switch (t.type) {
      case "mobility":
        e.mobilityWeight += t.value;
        break;
      case "stability":
        e.stabilityWeight += t.value;
        break;
      case "corner":
        e.cornerWeight += t.value;
        break;
      case "balanced":
        e.mobilityWeight += t.value * 0.5, e.stabilityWeight += t.value * 0.5;
        break;
      case "exploit_weakness":
        e.mobilityWeight += t.value * 0.5, e.safetyWeight += t.value * 0.5;
        break;
    }
  }
  clampAndNormalize() {
    const t = this.currentStrategy, e = (r) => Math.max(0, Math.min(r, 3));
    t.mobilityWeight = e(t.mobilityWeight), t.frontierWeight = e(t.frontierWeight), t.stabilityWeight = e(t.stabilityWeight), t.cornerWeight = e(t.cornerWeight), t.edgeWeight = e(t.edgeWeight), t.centerWeight = e(t.centerWeight), t.safetyWeight = e(t.safetyWeight);
    const n = t.mobilityWeight + t.frontierWeight + t.stabilityWeight + t.cornerWeight + t.edgeWeight + t.centerWeight + t.safetyWeight;
    n > 0 && (t.mobilityWeight /= n, t.frontierWeight /= n, t.stabilityWeight /= n, t.cornerWeight /= n, t.edgeWeight /= n, t.centerWeight /= n, t.safetyWeight /= n);
  }
  storeStrategyChange(t, e) {
    const n = {
      timestamp: Date.now(),
      situation: t,
      adaptationNeeds: e,
      strategy: { ...this.currentStrategy },
      effectiveness: 0
    };
    this.strategyHistory.push(n), this.strategyHistory.length > 100 && this.strategyHistory.shift();
  }
  // ------------------------------------------------------------
  // Defaults & Rules
  // ------------------------------------------------------------
  getDefaultStrategy() {
    return {
      mobilityWeight: 1,
      frontierWeight: 1,
      stabilityWeight: 1,
      cornerWeight: 1,
      edgeWeight: 1,
      centerWeight: 1,
      safetyWeight: 1,
      learnedPatterns: /* @__PURE__ */ new Map(),
      adaptationRules: /* @__PURE__ */ new Map()
      // (사용하지 않지만 호환 유지)
    };
  }
  initializeAdaptationRules() {
    this.adaptationRules.set("mobility_low", {
      condition: (t) => t.mobility < -20,
      action: (t) => {
        t.mobilityWeight += 0.3;
      },
      description: "Mobility is low → focus on mobility"
    }), this.adaptationRules.set("stability_low", {
      condition: (t) => t.stability < -20,
      action: (t) => {
        t.stabilityWeight += 0.3;
      },
      description: "Stability is low → focus on stability"
    }), this.adaptationRules.set("corner_low", {
      condition: (t) => t.cornerControl < -50,
      action: (t) => {
        t.cornerWeight += 0.4;
      },
      description: "Corner control is low → focus on corners"
    });
  }
  analyzePositivePatterns(t) {
    const e = [];
    for (const [n, r] of t.patterns)
      r.score > 0 && e.push({
        key: n,
        mobilityImpact: 0.1,
        stabilityImpact: 0.1,
        cornerImpact: 0.1,
        confidence: 0.8
      });
    return e;
  }
  analyzeNegativePatterns(t) {
    const e = [];
    for (const n of t.mistakes)
      e.push({
        key: n,
        mobilityImpact: -0.1,
        stabilityImpact: -0.1,
        cornerImpact: -0.1,
        confidence: 0.8
      });
    return e;
  }
  // ------------------------------------------------------------
  // Geometry / Safety
  // ------------------------------------------------------------
  isCorner(t) {
    const { row: e, col: n } = t;
    return (e === 0 || e === 7) && (n === 0 || n === 7);
  }
  isEdge(t) {
    const { row: e, col: n } = t;
    return e === 0 || e === 7 || n === 0 || n === 7;
  }
  isCenter(t) {
    const { row: e, col: n } = t;
    return e >= 3 && e <= 4 && n >= 3 && n <= 4;
  }
  isSafeMove(t, e) {
    return this.isCorner(t) ? !0 : !(this.isDangerousSquare(t, e) || this.isEdge(t) && !this.isEdgeSafe(t, e));
  }
  isDangerousSquare(t, e) {
    const { row: n, col: r } = t, s = [
      [1, 1, 0, 0],
      [1, 6, 0, 7],
      [6, 1, 7, 0],
      [6, 6, 7, 7]
    ];
    for (const [o, c, l, a] of s)
      if (n === o && r === c && e[l][a] === null) return !0;
    const i = [
      { corner: [0, 0], cells: [[0, 1], [1, 0]] },
      { corner: [0, 7], cells: [[0, 6], [1, 7]] },
      { corner: [7, 0], cells: [[6, 0], [7, 1]] },
      { corner: [7, 7], cells: [[6, 7], [7, 6]] }
    ];
    for (const o of i) {
      const [c, l] = o.corner;
      if (e[c][l] === null) {
        for (const [a, u] of o.cells) if (n === a && r === u) return !0;
      }
    }
    return !1;
  }
  isEdgeSafe(t, e) {
    const { row: n, col: r } = t;
    return !(n === 0 && (r <= 1 && e[0][0] === null || r >= 6 && e[0][7] === null) || n === 7 && (r <= 1 && e[7][0] === null || r >= 6 && e[7][7] === null) || r === 0 && (n <= 1 && e[0][0] === null || n >= 6 && e[7][0] === null) || r === 7 && (n <= 1 && e[0][7] === null || n >= 6 && e[7][7] === null));
  }
  // ------------------------------------------------------------
  // Minimal Othello ops (2D). 엔진 공용/비트보드 있으면 그걸로 교체 가능.
  // ------------------------------------------------------------
  simulateMove(t, e, n) {
    if (t[e.row][e.col] !== null) return null;
    const r = t.map((c) => [...c]), s = n === "black" ? "white" : "black", i = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    let o = 0;
    r[e.row][e.col] = n;
    for (const [c, l] of i) {
      const a = [];
      let u = e.row + c, h = e.col + l;
      for (; u >= 0 && u < 8 && h >= 0 && h < 8 && r[u][h] === s; )
        a.push({ row: u, col: h }), u += c, h += l;
      if (u >= 0 && u < 8 && h >= 0 && h < 8 && r[u][h] === n && a.length)
        for (const y of a)
          r[y.row][y.col] = n, o++;
    }
    return o ? r : null;
  }
  getValidMoves(t, e) {
    const n = [];
    for (let r = 0; r < 8; r++) for (let s = 0; s < 8; s++)
      t[r][s] === null && this.simulateMove(t, { row: r, col: s }, e) && n.push({ row: r, col: s });
    return n;
  }
  countFrontierDiscs(t, e) {
    const n = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    let r = 0;
    for (let s = 0; s < 8; s++) for (let i = 0; i < 8; i++) if (t[s][i] === e) {
      let o = !1;
      for (const [c, l] of n) {
        const a = s + c, u = i + l;
        if (a >= 0 && a < 8 && u >= 0 && u < 8 && t[a][u] === null) {
          o = !0;
          break;
        }
      }
      o && r++;
    }
    return r;
  }
  // ------------------------------------------------------------
  // Stats
  // ------------------------------------------------------------
  getStrategyStats() {
    const t = this.strategyHistory.length || 1;
    return {
      totalChanges: this.strategyHistory.length,
      averageEffectiveness: this.strategyHistory.reduce((e, n) => e + n.effectiveness, 0) / t,
      currentWeights: { ...this.currentStrategy },
      adaptationRules: this.adaptationRules.size
    };
  }
}
const Bt = !1, Se = {
  level: 18,
  enableLearning: !0,
  enableOpponentAnalysis: !0,
  enablePredictiveSearch: !0,
  enableAdaptiveStrategy: !0,
  enableAlphaBetaSearch: !0,
  search: {
    depthLimit: 10,
    timeLimitMs: 1200,
    aspirationWindow: 64,
    useLMR: !0,
    useAspiration: !0
  },
  timeConfig: {
    totalTime: 3e4,
    increment: 1e3,
    minThinkTime: 500,
    maxThinkTime: 1e4
  }
};
class be extends ue {
  constructor(e = {}) {
    super();
    x(this, "name", "Engine-Zenith");
    x(this, "version", "1.1.0");
    x(this, "author", "Zenith Research Team");
    x(this, "config");
    x(this, "evaluation");
    x(this, "strategy");
    x(this, "opponentAnalysis");
    x(this, "predictiveSearch");
    x(this, "adaptiveStrategy");
    x(this, "gameHistory", []);
    x(this, "opponentProfile", null);
    x(this, "learningData", {
      wins: 0,
      losses: 0,
      totalMoves: 0,
      positiveMoves: 0,
      patterns: /* @__PURE__ */ new Map(),
      mistakes: []
    });
    // 안정성을 위한 추가 상태 관리
    x(this, "isAnalyzing", !1);
    x(this, "lastAnalysisTime", 0);
    x(this, "analysisCache", /* @__PURE__ */ new Map());
    this.config = { ...Se, ...e }, this.evaluation = new fe(), this.strategy = new he(), this.opponentAnalysis = new ge(), this.predictiveSearch = new Me(), this.adaptiveStrategy = new ve();
  }
  // -------------------- Public API --------------------
  async analyze(e) {
    var r, s, i, o;
    const n = Date.now();
    if (this.isAnalyzing)
      return console.warn("Zenith: 이미 분석 중입니다. 요청을 무시합니다."), this.getFallbackResponse(n);
    this.isAnalyzing = !0;
    try {
      const { gameCore: c, timeLimit: l, skill: a } = e;
      this.validateRequest(e);
      const { board: u, currentPlayer: h } = e.gameCore, y = this.getValidMoves(u, h);
      if (!y || y.length === 0) {
        const p = Date.now() - n;
        return this.isAnalyzing = !1, {
          bestMove: void 0,
          evaluation: 0,
          depth: 0,
          nodes: 0,
          timeUsed: p,
          pv: []
        };
      }
      const M = this.resolveLevel(a, this.config.level), m = this.analyzeGamePhase(u);
      this.config.enableOpponentAnalysis && (this.opponentProfile = this.opponentAnalysis.analyzeOpponent(
        this.gameHistory,
        e.opponentMoves || []
      ));
      const b = this.strategy.analyzePosition(
        u,
        h,
        m,
        this.opponentProfile
      ), d = this.evaluation.evaluateBoard(
        u,
        h,
        m,
        b
      ), E = typeof l == "number" ? l : ((r = this.config.search) == null ? void 0 : r.timeLimitMs) ?? 1200, C = this.getEmptySquares(u);
      let k = null;
      if (this.config.enablePredictiveSearch && E >= 1200 && C <= 56) {
        const p = E >= 5e3 ? C <= 20 ? 6 : 5 : E >= 2500 ? 4 : 3;
        k = this.predictiveSearch.analyzeFutureScenarios(
          u,
          h,
          p
        );
      }
      const G = this.config.enableAdaptiveStrategy && E >= 800 ? this.adaptiveStrategy.adaptStrategy(
        b,
        this.opponentProfile,
        this.learningData
      ) : null;
      if (this.getEmptySquares(u) <= 17) {
        const p = Date.now(), w = this.solveEndgame(u, h, l), _ = Date.now() - p;
        return this.updateGameHistory(e.gameCore, w.bestMove), {
          bestMove: w.bestMove,
          evaluation: w.evaluation,
          depth: w.depth,
          nodes: w.nodes,
          timeUsed: _,
          pv: w.pv
        };
      }
      const R = this.computeSearchBudget(M, l), A = this.runAlphaBetaBit(N(u), h, R), V = this.heuristicBestMove(
        u,
        h,
        d,
        b,
        k,
        G
      );
      this.config.enableLearning && this.updateLearningData(V, d, b), this.updateGameHistory(e.gameCore, V);
      const L = Date.now() - n;
      this.lastAnalysisTime = L;
      const B = A ? {
        score: A.score,
        depth: A.depth,
        nodes: A.nodes,
        confidence: this.estimateConfidence(A.depth, A.nodes),
        pv: A.pv
      } : {
        score: d.score,
        depth: d.depth ?? 0,
        nodes: d.nodes ?? 0,
        confidence: d.confidence ?? 0.5,
        pv: d.pv || []
      };
      return {
        bestMove: V,
        evaluation: Number.isFinite(B.score) ? B.score : 0,
        depth: B.depth,
        nodes: B.nodes,
        timeUsed: L,
        pv: B.pv || [],
        stats: {
          gamePhase: m,
          strategicAnalysis: (b == null ? void 0 : b.summary) || "분석 실패",
          opponentProfile: ((s = this.opponentProfile) == null ? void 0 : s.summary) || "프로필 없음",
          predictiveInsights: (k == null ? void 0 : k.summary) || "예측 없음",
          adaptiveStrategy: (G == null ? void 0 : G.name) || "적응 없음",
          confidence: B.confidence,
          learningProgress: this.getLearningProgress(),
          ...A ? { ttHits: A.ttHits, ttStores: A.ttStores } : {}
        }
      };
    } catch (c) {
      console.error("Engine-Zenith analysis error:", c);
      const l = await this.getFallbackMove(
        (i = e == null ? void 0 : e.gameCore) == null ? void 0 : i.board,
        (o = e == null ? void 0 : e.gameCore) == null ? void 0 : o.currentPlayer
      ), a = Date.now() - n;
      return {
        bestMove: l,
        evaluation: 0,
        depth: 1,
        nodes: 0,
        timeUsed: a,
        pv: [],
        stats: {
          error: c instanceof Error ? c.message : "Unknown error",
          fallback: !0
        }
      };
    } finally {
      this.isAnalyzing = !1;
    }
  }
  // -------------------- Search Core --------------------
  // AlphaBeta 메인 서치
  runAlphaBetaBit(e, n, r) {
    const i = Date.now() + Math.max(100, Math.floor(r.timeLimitMs));
    let o = 0, c = 0, l = 0;
    const a = /* @__PURE__ */ new Map(), u = new Array(128), h = new Array(128), y = new Array(64).fill(0), M = (g, p) => Nt(g, p), m = (g, p, w, _) => {
      const D = (P) => {
        let O = 0;
        w && P.row === w.row && P.col === w.col && (O += 1e4);
        const W = u[_], F = h[_];
        W && P.row === W.row && P.col === W.col ? O += 5e3 : F && P.row === F.row && P.col === F.col && (O += 3e3);
        const I = P.row * 8 + P.col;
        O += y[I] | 0, O += this.isCorner(P) ? 200 : 0;
        const j = P.row === 0 || P.row === 7 || P.col === 0 || P.col === 7 ? 1 : 0;
        return O += j ? 50 : 0, O;
      }, T = g.slice();
      return T.sort((P, O) => D(O) - D(P)), T;
    }, b = (g, p) => {
      const w = p === "black" ? g._bp : g._wp, _ = p === "black" ? g._wp : g._bp, D = U(w) - U(_), T = rt(p === "black" ? 1 : 2, g), P = rt(p === "black" ? 2 : 1, g), O = Number(U(T)), W = Number(U(P)), F = O + W, I = F > 0 ? (O - W) / F * 100 : 0, j = [0, 7, 56, 63];
      let it = 0, $ = 0;
      for (const Y of j) {
        const q = 1n << BigInt(Y);
        (w & q) !== 0n ? it++ : (_ & q) !== 0n && $++;
      }
      const tt = it - $, J = It(g), gt = J >= 44 ? 2 : J >= 28 ? 1.5 : J >= 12 ? 1.2 : 1, ot = J <= 20 ? 1.5 : 1, et = D * ot + I * 0.5 + tt * 50, X = gt * et;
      return Math.max(-999, Math.min(999, X));
    }, d = 4, E = (g) => (g.row === 0 || g.row === 7) && (g.col === 0 || g.col === 7), C = (g, p, w) => {
      const _ = At(p, w), D = 1n << BigInt(_);
      return ((BigInt(g._bp) | BigInt(g._wp)) & D) === 0n;
    }, k = (g) => g.row === 1 && g.col === 1 || g.row === 1 && g.col === 6 || g.row === 6 && g.col === 1 || g.row === 6 && g.col === 6, v = (g) => g.row === 0 && g.col === 1 || g.row === 1 && g.col === 0 || g.row === 0 && g.col === 6 || g.row === 1 && g.col === 7 || g.row === 7 && g.col === 1 || g.row === 6 && g.col === 0 || g.row === 7 && g.col === 6 || g.row === 6 && g.col === 7, S = (g, p) => {
      if (E(p)) return !0;
      if (k(p)) {
        const w = p.row === 1 && p.col === 1 ? [0, 0] : p.row === 1 && p.col === 6 ? [0, 7] : p.row === 6 && p.col === 1 ? [7, 0] : [7, 7];
        return C(g, w[0], w[1]);
      }
      if (v(p)) {
        const w = { "0,1": [0, 0], "1,0": [0, 0], "0,6": [0, 7], "1,7": [0, 7], "7,1": [7, 0], "6,0": [7, 0], "7,6": [7, 7], "6,7": [7, 7] }, _ = `${p.row},${p.col}`, D = w[_];
        if (D) return C(g, D[0], D[1]);
      }
      return (p.row === 0 || p.row === 7 || p.col === 0 || p.col === 7) && (p.row === 0 && (p.col <= 1 || p.col >= 6) || p.row === 7 && (p.col <= 1 || p.col >= 6) || p.col === 0 && (p.row <= 1 || p.row >= 6) || p.col === 7 && (p.row <= 1 || p.row >= 6));
    }, G = (g, p, w, _, D, T) => {
      const P = b(g, p);
      if (P >= _) return _;
      if (w < P && (w = P), D <= 0) return P;
      const O = lt(rt(p === "black" ? 1 : 2, g)).filter((F) => S(g, F));
      if (O.length === 0) return P;
      const W = p === "black" ? "white" : "black";
      for (const F of O) {
        const I = ct(g, F.row, F.col, p);
        if (!I) continue;
        const j = -G(g, W, -_, -w, D - 1);
        if (at(g, I), j >= _) return _;
        j > w && (w = j);
      }
      return w;
    }, z = (g, p, w, _, D, T, P) => {
      if (Date.now() > i) throw new Error("ab_timeout");
      const O = M(g, p), W = a.get(O);
      if (W && W.depth >= w && (c++, W.flag === "exact" || (W.flag === "lower" ? _ = Math.max(_, W.value) : W.flag === "upper" && (D = Math.min(D, W.value)), _ >= D)))
        return W.value;
      const F = lt(rt(p === "black" ? 1 : 2, g)), I = p === "black" ? "white" : "black", j = b(g, p);
      if (w <= 2 && j >= D) return j;
      if (w === 0 || F.length === 0) {
        if (F.length === 0) {
          if (lt(rt(I === "black" ? 1 : 2, g)).length === 0)
            return p === "black" ? U(g._bp) - U(g._wp) : U(g._wp) - U(g._bp);
          const H = [];
          return -z(g, I, w, -D, -_, H, P + 1);
        }
        return G(g, p, _, D, d);
      }
      let it, $ = -1 / 0;
      const tt = W == null ? void 0 : W.best, J = m(F, g, tt, P), gt = _;
      for (let K = 0; K < J.length; K++) {
        const H = J[K], et = ct(g, H.row, H.col, p);
        if (!et) continue;
        o++;
        const X = [];
        let Y = w - 1, q;
        const Zt = tt && H.row === tt.row && H.col === tt.col;
        if (w === 1 && j + 2 <= _ && !this.isCorner(H)) {
          at(g, et);
          continue;
        }
        if (K === 0)
          if (r.useLMR && w >= 3 && K >= 3 && !Zt) {
            const pt = Math.max(1, Y - 1);
            q = -z(g, I, pt, -D, -_, X, P + 1), q > _ && (q = -z(g, I, Y, -D, -_, X, P + 1));
          } else
            q = -z(g, I, Y, -D, -_, X, P + 1);
        else
          q = -z(g, I, Y, -(_ + 1), -_, X, P + 1), q > _ && q < D && (q = -z(g, I, Y, -D, -_, X, P + 1));
        if (at(g, et), q > $ && ($ = q, it = H, T.length = 0, T.push(H, ...X)), $ > _ && (_ = $), _ >= D) {
          const pt = H.row * 8 + H.col;
          y[pt] += w * w;
          const mt = u[P];
          (!mt || mt.row !== H.row || mt.col !== H.col) && (h[P] = u[P], u[P] = H);
          break;
        }
      }
      let ot = "exact";
      return $ <= gt ? ot = "upper" : $ >= D && (ot = "lower"), a.set(O, { depth: w, value: $, flag: ot, best: it }), l++, l % 8192 === 0 && a.size > 15e4 && a.clear(), $;
    };
    let R, A = -1 / 0, V = 0, L = [], B = 0;
    for (let g = 4; g <= Math.max(4, r.depthLimit); g++) {
      const p = [];
      try {
        if (r.useAspiration && g > 4) {
          let w = Math.max(4, r.aspirationWindow ?? 16), _ = B - w, D = B + w;
          for (let T = 0; T < 3; T++) {
            const P = z(e, n, g, _, D, p, 0);
            if (P <= _)
              _ -= w, w *= 2;
            else if (P >= D)
              D += w, w *= 2;
            else {
              B = P;
              break;
            }
          }
          A = B;
        } else {
          const w = z(e, n, g, -1 / 0, 1 / 0, p, 0);
          A = w, B = w;
        }
        R = p[0], V = g, L = p.slice();
      } catch (w) {
        if (w.message === "ab_timeout") break;
        throw w;
      }
    }
    return { bestMove: R, score: A, depth: V, nodes: o, pv: L, ttHits: c, ttStores: l };
  }
  solveEndgame(e, n, r) {
    const s = n, i = this.getEmptySquares(e), o = typeof r == "number" && r > 0 ? Date.now() + Math.max(100, Math.floor(r * 0.95)) : Number.POSITIVE_INFINITY;
    let c = 0;
    const l = /* @__PURE__ */ new Map(), a = (d, E) => {
      let C = E === "black" ? "b|" : "w|";
      for (let k = 0; k < 8; k++)
        for (let v = 0; v < 8; v++) {
          const S = d[k][v];
          C += S === null ? "0" : S === "black" ? "1" : "2";
        }
      return C;
    }, u = (d, E) => d.slice().sort((C, k) => {
      const v = this.isCorner(C) ? 1 : 0, S = this.isCorner(k) ? 1 : 0;
      if (v !== S) return S - v;
      const G = C.row === 0 || C.row === 7 || C.col === 0 || C.col === 7 ? 1 : 0;
      return (k.row === 0 || k.row === 7 || k.col === 0 || k.col === 7 ? 1 : 0) - G;
    }), h = (d) => {
      const E = this.calculateScore(d);
      return s === "black" ? E.black - E.white : E.white - E.black;
    }, y = (d, E, C, k, v, S) => {
      if (Date.now() > o)
        throw new Error("endgame_timeout");
      const G = a(d, E), z = l.get(G);
      if (z && z.depth >= C && (z.flag === "exact" || (z.flag === "lower" ? k = Math.max(k, z.value) : z.flag === "upper" && (v = Math.min(v, z.value)), k >= v)))
        return z.value;
      const R = this.getValidMoves(d, E), A = E === "black" ? "white" : "black", V = this.getValidMoves(d, A), L = R.length === 0, B = V.length === 0;
      if (L && B || C === 0) {
        const _ = h(d);
        return l.set(G, { depth: C, value: _, flag: "exact" }), _;
      }
      let g, p = -1 / 0;
      if (L) {
        const _ = [];
        p = -y(d, A, C, -v, -k, _);
      } else {
        const _ = u(R);
        for (const D of _) {
          const T = this.simulateMove(d, D, E);
          if (!T) continue;
          c++;
          const P = [], O = -y(T, A, C - 1, -v, -k, P);
          if (O > p && (p = O, g = D, S.length = 0, S.push(D, ...P)), k = Math.max(k, p), k >= v) break;
        }
      }
      let w = "exact";
      return p <= k ? w = "upper" : p >= v && (w = "lower"), l.set(G, { depth: C, value: p, best: g, flag: w }), p;
    }, M = [];
    let m = 0;
    try {
      m = y(e, n, i, -1 / 0, 1 / 0, M);
    } catch (d) {
      if (d.message !== "endgame_timeout") throw d;
      if (M.length === 0) {
        const E = this.calculateScore(e);
        m = s === "black" ? E.black - E.white : E.white - E.black;
      }
    }
    return { bestMove: M[0], evaluation: m, depth: i, nodes: c, pv: M };
  }
  // Search용 빠른 평가(전략 분석 생략, 단계 블렌딩은 AdvancedEvaluation 내부에서 처리)
  evalForSearch(e, n) {
    const r = this.getEmptySquares(e), s = r >= 45 ? "opening" : r >= 20 ? "midgame" : r >= 10 ? "late_midgame" : "endgame", i = this.strategy.analyzePosition(
      e,
      n,
      s,
      this.opponentProfile
    ), { score: o } = this.evaluation.evaluateBoard(e, n, s, i);
    return o;
  }
  computeSearchBudget(e, n) {
    const r = this.config.search || {}, s = this.config.timeConfig, i = (M, m, b) => Math.max(m, Math.min(b, M)), o = r.depthLimit ?? Math.round(10 + Math.min(10, Math.max(1, e))), c = i(o, 12, 20), l = typeof n == "number" ? n : r.timeLimitMs ?? 1200, a = i(Math.floor(l * 0.95), s.minThinkTime, s.maxThinkTime), u = r.useLMR ?? e >= 8, h = r.useAspiration ?? e >= 6, y = r.aspirationWindow ?? (e >= 14 ? 48 : 64);
    return { depthLimit: c, timeLimitMs: a, aspirationWindow: y, useLMR: u, useAspiration: h };
  }
  estimateConfidence(e, n) {
    const r = Math.min(14, Math.max(3, e)), s = Math.log10(Math.max(1e3, n)), i = 0.45 + (r - 3) * 0.03 + (s - 3) * 0.025;
    return Math.max(0.55, Math.min(0.98, i));
  }
  // -------------------- Heuristic Fallback --------------------
  heuristicBestMove(e, n, r, s, i, o) {
    const c = this.getValidMoves(e, n);
    return c.length === 0 ? void 0 : c.map((a) => ({
      move: a,
      score: this.calculateMoveScore(
        a,
        e,
        n,
        r,
        s,
        i,
        o
      )
    })).sort((a, u) => u.score - a.score)[0].move;
  }
  calculateMoveScore(e, n, r, s, i, o, c) {
    var M, m;
    const l = (s.score ?? 0) * 0.15, a = ((M = i.getMoveValue) == null ? void 0 : M.call(i, e)) ?? 0, u = (o == null ? void 0 : o.getMoveValue(e)) ?? 0, h = ((m = c == null ? void 0 : c.getMoveValue) == null ? void 0 : m.call(c, e)) ?? 0, y = this.assessMoveSafety(e, n, r) * 0.15;
    return l + a * 0.35 + u * 0.25 + h * 0.15 + y;
  }
  // -------------------- Safety / Helpers --------------------
  assessMoveSafety(e, n, r) {
    return this.isDangerousSquare(e, n) ? -100 : this.isCorner(e) ? 100 : this.isEdgeSafe(e, n) ? 50 : 0;
  }
  isDangerousSquare(e, n) {
    const { row: r, col: s } = e, o = this.getEmptySquares(n) > 30, c = [[1, 1], [1, 6], [6, 1], [6, 6]];
    for (const [a, u] of c)
      if (r === a && s === u) {
        const h = a === 1 ? 0 : 7, y = u === 1 ? 0 : 7;
        if (n[h][y] === null)
          return o || this.countOpponentCorners(n) > 0, !0;
      }
    const l = [
      [[0, 0], [0, 1], [1, 0]],
      [[0, 7], [0, 6], [1, 7]],
      [[7, 0], [6, 0], [7, 1]],
      [[7, 7], [6, 7], [7, 6]]
    ];
    for (const a of l) {
      const [u, h, y] = a;
      if (n[u[0]][u[1]] === null && (r === h[0] && s === h[1] || r === y[0] && s === y[1]))
        return !!(o || this.countOpponentCorners(n) >= 2);
    }
    return !1;
  }
  countOpponentCorners(e) {
    const n = [[0, 0], [0, 7], [7, 0], [7, 7]];
    let r = 0;
    for (const [s, i] of n)
      e[s][i] !== null && r++;
    return r;
  }
  isCorner(e) {
    const { row: n, col: r } = e;
    return (n === 0 || n === 7) && (r === 0 || r === 7);
  }
  isEdgeSafe(e, n) {
    const { row: r, col: s } = e;
    if (!(r === 0 || r === 7 || s === 0 || s === 7)) return !1;
    const o = [];
    r === 0 && (s === 1 && o.push([0, 0]), s === 6 && o.push([0, 7])), r === 7 && (s === 1 && o.push([7, 0]), s === 6 && o.push([7, 7])), s === 0 && (r === 1 && o.push([0, 0]), r === 6 && o.push([7, 0])), s === 7 && (r === 1 && o.push([0, 7]), r === 6 && o.push([7, 7]));
    for (const [c, l] of o)
      if (n[c][l] === null) return !1;
    return !0;
  }
  async getFallbackMove(e, n) {
    const r = this.getValidMoves(e, n);
    if (r.length === 0) return;
    const s = r.filter((c) => this.isCorner(c));
    if (s.length) return s[0];
    const i = r.filter((c) => this.isEdgeSafe(c, e));
    if (i.length) return i[0];
    const o = r.filter((c) => !this.isDangerousSquare(c, e));
    return o.length ? o[0] : r[0];
  }
  // -------------------- Phase / Learning / State --------------------
  analyzeGamePhase(e) {
    const n = this.getEmptySquares(e);
    return n >= 45 ? "opening" : n >= 20 ? "midgame" : "endgame";
  }
  resolveLevel(e, n) {
    return typeof e == "number" && e >= 1 ? Math.max(1, Math.min(20, Math.floor(e / 5) + 10)) : Math.max(1, Math.min(20, n ?? 16));
  }
  updateLearningData(e, n, r) {
    if (!e) return;
    const s = this.extractMovePattern(e, n, r);
    this.learningData.patterns.set(s.key, s), this.learningData.totalMoves++, n.score > 0 && this.learningData.positiveMoves++;
  }
  extractMovePattern(e, n, r) {
    var s;
    return {
      key: `${e.row}-${e.col}`,
      move: e,
      score: n.score,
      strategicValue: ((s = r.getMoveValue) == null ? void 0 : s.call(r, e)) ?? 0,
      timestamp: Date.now()
    };
  }
  updateGameHistory(e, n) {
    e && (this.gameHistory.push({
      board: e.board,
      move: n,
      timestamp: Date.now()
    }), this.gameHistory.length > 50 && this.gameHistory.shift());
  }
  getLearningProgress() {
    const e = this.learningData.wins + this.learningData.losses;
    return {
      totalMoves: this.learningData.totalMoves,
      positiveMoves: this.learningData.positiveMoves,
      patternsLearned: this.learningData.patterns.size,
      winRate: e ? this.learningData.wins / e : 0
    };
  }
  // countEmptySquares 메서드는 EngineBase의 getEmptySquares로 대체됨
  updateConfig(e) {
    this.config = { ...this.config, ...e };
  }
  clearState() {
    this.gameHistory = [], this.opponentProfile = null, this.learningData = {
      wins: 0,
      losses: 0,
      totalMoves: 0,
      positiveMoves: 0,
      patterns: /* @__PURE__ */ new Map(),
      mistakes: []
    };
  }
  getStats() {
    return {
      name: this.name,
      version: this.version,
      config: this.config,
      learningProgress: this.getLearningProgress(),
      gameHistory: this.gameHistory.length,
      opponentProfile: this.opponentProfile
    };
  }
  // -------------------- 안전성 및 유틸리티 메서드 --------------------
  getFallbackResponse(e) {
    return {
      bestMove: void 0,
      evaluation: 0,
      depth: 0,
      nodes: 0,
      timeUsed: Date.now() - e,
      pv: [],
      stats: {
        error: "분석 중복 요청",
        fallback: !0
      }
    };
  }
  validateBoard(e) {
    if (!e || !Array.isArray(e) || e.length !== 8)
      return !1;
    for (let n = 0; n < 8; n++) {
      if (!Array.isArray(e[n]) || e[n].length !== 8)
        return !1;
      for (let r = 0; r < 8; r++) {
        const s = e[n][r];
        if (s !== null && s !== "black" && s !== "white")
          return !1;
      }
    }
    return !0;
  }
  cleanupCache() {
    this.analysisCache.size > 1e3 && Array.from(this.analysisCache.entries()).slice(0, 200).forEach(([n]) => {
      this.analysisCache.delete(n);
    });
  }
  getCacheKey(e, n) {
    let r = "";
    for (let s = 0; s < 8; s++)
      for (let i = 0; i < 8; i++) {
        const o = e[s][i];
        r += o === null ? "0" : o === "black" ? "1" : "2";
      }
    return `${n}_${r}`;
  }
}
const Ft = new be();
async function _e(f, t, e) {
  if (e.rootMove) {
    const { row: s, col: i } = e.rootMove;
    if (f.board[s][i] !== null)
      return {
        bestMove: e.rootMove,
        evaluation: -1 / 0,
        nodes: 1,
        pv: [e.rootMove]
      };
    const o = { ...f }, c = ut(o, e.rootMove);
    if (!c.success)
      return {
        bestMove: e.rootMove,
        evaluation: -1 / 0,
        nodes: 1,
        pv: [e.rootMove]
      };
    const l = {
      gameCore: c.newGameCore,
      timeLimit: e.timeLimit,
      skill: 18
    }, a = await Ft.analyze(l);
    return {
      bestMove: e.rootMove,
      evaluation: a.evaluation,
      // 부호 반전 제거 - 이미 올바른 관점
      nodes: a.nodes,
      pv: [e.rootMove, ...a.pv || []]
    };
  }
  const n = {
    gameCore: f,
    timeLimit: e.timeLimit,
    skill: 18
  }, r = await Ft.analyze(n);
  return {
    bestMove: r.bestMove,
    evaluation: r.evaluation,
    nodes: r.nodes,
    pv: r.pv ? [...r.pv] : void 0
  };
}
export {
  Se as DEFAULT_ZENITH_CONFIG,
  be as EngineZenith,
  _e as alphaBetaSearch,
  Ft as default,
  Ft as engineZenith
};
