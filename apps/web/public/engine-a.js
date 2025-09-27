var Q = Object.defineProperty;
var Y = (r, e, t) => e in r ? Q(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var l = (r, e, t) => Y(r, typeof e != "symbol" ? e + "" : e, t);
const ee = 0x0101010101010101n, te = 0x8080808080808080n, y = 0xffffffffffffffffn, O = y ^ ee, U = y ^ te;
function S(r) {
  return (r & U) << 1n;
}
function k(r) {
  return (r & O) >> 1n;
}
function P(r) {
  return r << 8n;
}
function B(r) {
  return r >> 8n;
}
function H(r) {
  return (r & U) << 9n;
}
function x(r) {
  return (r & O) << 7n;
}
function E(r) {
  return (r & U) >> 7n;
}
function R(r) {
  return (r & O) >> 9n;
}
const re = [
  S,
  k,
  P,
  B,
  H,
  x,
  E,
  R
];
function ne(r) {
  let e = 0, t = BigInt(r);
  for (; t; )
    e++, t &= t - 1n;
  return e;
}
function N(r) {
  let e = 0n, t = BigInt(r);
  for (; t > 1n; )
    t >>= 1n, e++;
  return Number(e);
}
function z(r, e) {
  return (7 - r) * 8 + e;
}
function se(r) {
  if (r < 0 || r > 63) throw new Error("Invalid bit index: " + r);
  const t = 7 - (r / 8 | 0), s = r % 8;
  return [t, s];
}
function $(r, e) {
  return 1n << BigInt(z(r, e));
}
function oe(r) {
  const e = [];
  let t = BigInt(r);
  for (; t; ) {
    const s = t & -t, n = N(s), [o, a] = se(n);
    e.push({ row: o, col: a }), t ^= s;
  }
  return e;
}
function L(r) {
  return r && typeof r.length == "number" && typeof r.subarray == "function";
}
function ae(r) {
  const e = new Uint8Array(64);
  for (let t = 0; t < 8; t++)
    for (let s = 0; s < 8; s++) {
      const n = r[t][s];
      e[t * 8 + s] = n === "black" ? 1 : n === "white" ? 2 : 0;
    }
  return e;
}
function ie(r) {
  let e = 0n, t = 0n;
  for (let s = 0; s < 64; s++) {
    const n = r[s] | 0;
    if (n === 0) continue;
    const o = s / 8 | 0, a = s % 8, i = z(o, a), c = 1n << BigInt(i);
    n === 1 ? e |= c : n === 2 && (t |= c);
  }
  return { bp: e, wp: t };
}
function u(r) {
  let e;
  if (L(r) ? e = r : Array.isArray(r) && Array.isArray(r[0]) ? e = ae(r) : Array.isArray(r) ? e = Uint8Array.from(r) : r && r.cells && L(r.cells) ? e = r.cells : e = new Uint8Array(64), e._bp === void 0 || e._wp === void 0) {
    const { bp: t, wp: s } = ie(e);
    e._bp = t, e._wp = s;
  }
  return e;
}
function ce(r, e, t) {
  let s = t(r) & e;
  return s |= t(s) & e, s |= t(s) & e, s |= t(s) & e, s |= t(s) & e, s |= t(s) & e, t(s);
}
function ue(r, e) {
  const t = u(e), s = r === 1 ? t._bp : t._wp, n = r === 1 ? t._wp : t._bp, o = ~(s | n) & y;
  let a = 0n;
  for (const i of re)
    a |= ce(s, n, i);
  return a & o;
}
function w(r) {
  return r === "black" ? 1 : 2;
}
function le(r, e) {
  const t = w(r), s = ue(t, e);
  return oe(s);
}
function W(r, e, t) {
  let s = 0n, n, o;
  for (n = S(t), o = 0n; n && n & e; )
    o |= n, n = S(n);
  for (n & r && (s |= o), n = k(t), o = 0n; n && n & e; )
    o |= n, n = k(n);
  for (n & r && (s |= o), n = P(t), o = 0n; n && n & e; )
    o |= n, n = P(n);
  for (n & r && (s |= o), n = B(t), o = 0n; n && n & e; )
    o |= n, n = B(n);
  for (n & r && (s |= o), n = H(t), o = 0n; n && n & e; )
    o |= n, n = H(n);
  for (n & r && (s |= o), n = x(t), o = 0n; n && n & e; )
    o |= n, n = x(n);
  for (n & r && (s |= o), n = E(t), o = 0n; n && n & e; )
    o |= n, n = E(n);
  for (n & r && (s |= o), n = R(t), o = 0n; n && n & e; )
    o |= n, n = R(n);
  return n & r && (s |= o), s;
}
function F(r, e, t, s) {
  const n = w(t), o = u(s), a = $(r, e), i = n === 1 ? o._bp : o._wp, c = n === 1 ? o._wp : o._bp;
  return (a & (i | c)) !== 0n ? !1 : W(i, c, a) !== 0n;
}
function I(r, e, t, s) {
  const n = w(s), o = u(r), a = $(e, t), i = n === 1 ? o._bp : o._wp, c = n === 1 ? o._wp : o._bp;
  if ((a & (i | c)) !== 0n) return;
  const h = W(i, c, a);
  if (!h) return;
  const _ = o._bp, p = o._wp, v = i | a | h, b = c & ~h;
  n === 1 ? (o._bp = v, o._wp = b) : (o._wp = v, o._bp = b);
  let m = h | a;
  for (; m; ) {
    const V = m & -m, K = N(V);
    o[K] = n, m ^= V;
  }
  return { __native: !0, side: n, row: e, col: t, moveMask: a, flips: h, prevBP: _, prevWP: p };
}
function he(r, e, t) {
  const s = u(r);
  if (!e || !e.__native) return;
  s._bp = e.prevBP, s._wp = e.prevWP;
  let o = e.flips | e.moveMask;
  for (; o; ) {
    const a = o & -o, i = N(a), c = 1n << BigInt(i), h = (e.prevBP & c) !== 0n, _ = (e.prevWP & c) !== 0n;
    s[i] = h ? 1 : _ ? 2 : 0, o ^= a;
  }
}
function me(r) {
  const e = u(r), t = e._bp | e._wp;
  return ne(~t & y);
}
function fe(r, e) {
  const t = w(e), s = u(r), n = 0x100000001b3n, o = 0x100000001b5n;
  let a = 0xcbf29ce484222325n;
  return a ^= s._bp * n & y, a *= o, a ^= s._wp * o & y, a *= n, a ^= BigInt(t & 3), a *= 0x100000001b7n, Number(a & 0xffffffffffffffffn);
}
function g(r) {
  const e = new Uint8Array(64);
  for (let t = 0; t < 8; t++)
    for (let s = 0; s < 8; s++) {
      const n = r[t][s], o = t * 8 + s;
      n === "black" ? e[o] = 1 : n === "white" ? e[o] = 2 : e[o] = 0;
    }
  return e;
}
function T(r) {
  const e = [];
  for (let t = 0; t < 8; t++) {
    const s = [];
    for (let n = 0; n < 8; n++) {
      const o = t * 8 + n, a = r[o];
      a === 1 ? s.push("black") : a === 2 ? s.push("white") : s.push(null);
    }
    e.push(s);
  }
  return e;
}
function A(r = crypto.randomUUID()) {
  const e = Array.from({ length: 8 }, () => new Array(8).fill(null));
  e[3][3] = "white", e[3][4] = "black", e[4][3] = "black", e[4][4] = "white";
  const t = d(e, "black");
  return {
    id: r,
    board: e,
    currentPlayer: "black",
    validMoves: t,
    score: { black: 2, white: 2 },
    status: "playing",
    moveHistory: [],
    canUndo: !1,
    canRedo: !1
  };
}
function d(r, e) {
  const t = u(g(r));
  return le(e, t);
}
function J(r, e, t) {
  const s = u(g(r));
  return F(e.row, e.col, t, s);
}
function C(r, e) {
  if (r.status !== "playing")
    return {
      success: !1,
      reason: "game_finished",
      message: "Game is not in playing state"
    };
  if (!(r.currentPlayer === "black" || r.currentPlayer === "white")) return {
    success: !1,
    reason: "not_your_turn",
    message: "Invalid current player"
  };
  const t = u(g(r.board));
  if (!F(e.row, e.col, r.currentPlayer, t))
    return t[e.row * 8 + e.col] !== 0 ? {
      success: !1,
      reason: "occupied",
      message: "Position is already occupied"
    } : {
      success: !1,
      reason: "no_captures",
      message: "Move would not capture any pieces"
    };
  if (!I(t, e.row, e.col, r.currentPlayer))
    return {
      success: !1,
      reason: "invalid_position",
      message: "Failed to apply move"
    };
  const n = T(t), o = [];
  for (let f = 0; f < 8; f++)
    for (let m = 0; m < 8; m++)
      r.board[f][m] !== n[f][m] && !(f === e.row && m === e.col) && o.push({ row: f, col: m });
  const a = {
    row: e.row,
    col: e.col,
    player: r.currentPlayer,
    capturedCells: o,
    timestamp: Date.now()
  }, i = G(n), c = r.currentPlayer === "black" ? "white" : "black", h = d(n, c);
  let _ = c, p = h, v = "playing";
  if (h.length === 0) {
    const f = d(n, r.currentPlayer);
    f.length === 0 ? (v = "finished", p = []) : (_ = r.currentPlayer, p = f);
  }
  const b = {
    ...r,
    board: n,
    currentPlayer: _,
    validMoves: p,
    score: i,
    status: v,
    moveHistory: [...r.moveHistory, a],
    canUndo: !0,
    canRedo: !1
  };
  return {
    success: !0,
    move: a,
    newGameCore: b,
    capturedCells: o
  };
}
function G(r) {
  let e = 0, t = 0;
  for (let s = 0; s < 8; s++)
    for (let n = 0; n < 8; n++) {
      const o = r[s][n];
      o === "black" ? e++ : o === "white" && t++;
    }
  return { black: e, white: t };
}
function D(r) {
  if (r.status === "finished") return !0;
  if (d(r.board, r.currentPlayer).length > 0) return !1;
  const t = r.currentPlayer === "black" ? "white" : "black";
  return d(r.board, t).length === 0;
}
function q(r) {
  if (!D(r)) return null;
  const e = G(r.board);
  let t;
  return e.black > e.white ? t = "black" : e.white > e.black ? t = "white" : t = "draw", {
    winner: t,
    score: e,
    endReason: "normal",
    duration: 0,
    // Should be calculated from game start time
    totalMoves: r.moveHistory.length
  };
}
function j(r) {
  const e = u(g(r.board));
  return fe(e, r.currentPlayer);
}
function de(r, e) {
  return d(r, e).length;
}
function ge(r) {
  const e = u(g(r));
  return me(e);
}
class _e {
  constructor(e = {}) {
    l(this, "_currentGame");
    l(this, "_gameHistory", []);
    l(this, "_redoStack", []);
    l(this, "_listeners", []);
    l(this, "_config");
    this._config = {
      maxHistorySize: e.maxHistorySize || 100,
      enableUndo: e.enableUndo ?? !0,
      enableRedo: e.enableRedo ?? !0,
      autoSave: e.autoSave ?? !1
    }, this._currentGame = A(), this._gameHistory.push({ ...this._currentGame }), this.emit({ type: "game_started", gameCore: this._currentGame });
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
    return D(this._currentGame);
  }
  /**
   * Get game result if finished
   */
  get gameResult() {
    return q(this._currentGame);
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
  makeMove(e) {
    if (this.isGameOver)
      return {
        success: !1,
        reason: "game_finished",
        message: "Game is already finished"
      };
    const t = C(this._currentGame, e);
    if (t.success) {
      if (this._currentGame = t.newGameCore, this._redoStack = [], this._gameHistory.push({ ...this._currentGame }), this._gameHistory.length > this._config.maxHistorySize && this._gameHistory.shift(), this.emit({ type: "move_made", move: t.move, gameCore: this._currentGame }), this.isGameOver) {
        const s = this.gameResult;
        s && this.emit({ type: "game_over", result: s });
      } else
        this.emit({ type: "turn_changed", player: this._currentGame.currentPlayer });
      this._config.autoSave && this.saveToStorage();
    }
    return t;
  }
  /**
   * Undo last move
   */
  undo() {
    if (!this.canUndo) return !1;
    this._redoStack.push({ ...this._currentGame }), this._gameHistory.pop();
    const e = this._gameHistory[this._gameHistory.length - 1];
    return this._currentGame = { ...e }, this.emit({ type: "move_undone", gameCore: this._currentGame }), this.emit({ type: "turn_changed", player: this._currentGame.currentPlayer }), !0;
  }
  /**
   * Redo last undone move
   */
  redo() {
    if (!this.canRedo) return !1;
    const e = this._redoStack.pop();
    return this._currentGame = e, this._gameHistory.push({ ...this._currentGame }), this.emit({ type: "move_redone", gameCore: this._currentGame }), this.emit({ type: "turn_changed", player: this._currentGame.currentPlayer }), !0;
  }
  /**
   * Reset game to initial state
   */
  reset() {
    this._currentGame = A(), this._gameHistory = [{ ...this._currentGame }], this._redoStack = [], this.emit({ type: "game_reset", gameCore: this._currentGame }), this.emit({ type: "game_started", gameCore: this._currentGame });
  }
  /**
   * Check if a move is valid
   */
  isValidMove(e) {
    return J(this._currentGame.board, e, this._currentGame.currentPlayer);
  }
  /**
   * Get all valid moves for current player
   */
  getValidMoves() {
    return d(this._currentGame.board, this._currentGame.currentPlayer);
  }
  /**
   * Set game status
   */
  setGameStatus(e) {
    this._currentGame.status !== e && (this._currentGame = {
      ...this._currentGame,
      status: e
    });
  }
  /**
   * Get position hash (for engines/caching)
   */
  getPositionHash() {
    return j(this._currentGame);
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
  addEventListener(e) {
    this._listeners.push(e);
  }
  /**
   * Remove event listener
   */
  removeEventListener(e) {
    const t = this._listeners.indexOf(e);
    t !== -1 && this._listeners.splice(t, 1);
  }
  /**
   * Remove all event listeners
   */
  removeAllEventListeners() {
    this._listeners = [];
  }
  emit(e) {
    this._listeners.forEach((t) => {
      try {
        t(e);
      } catch (s) {
        console.error("Error in game event listener:", s);
      }
    });
  }
  // ===== PERSISTENCE =====
  /**
   * Save game state to localStorage
   */
  saveToStorage(e = "othello-game-state") {
    try {
      const t = {
        currentGame: this._currentGame,
        gameHistory: this._gameHistory,
        redoStack: this._redoStack,
        timestamp: Date.now()
      };
      localStorage.setItem(e, JSON.stringify(t));
    } catch (t) {
      console.error("Failed to save game state:", t);
    }
  }
  /**
   * Load game state from localStorage
   */
  loadFromStorage(e = "othello-game-state") {
    try {
      const t = localStorage.getItem(e);
      if (!t) return !1;
      const s = JSON.parse(t);
      return this._currentGame = s.currentGame, this._gameHistory = s.gameHistory || [], this._redoStack = s.redoStack || [], this.emit({ type: "game_started", gameCore: this._currentGame }), !0;
    } catch (t) {
      return console.error("Failed to load game state:", t), !1;
    }
  }
  /**
   * Export game as PGN-like format
   */
  exportGame() {
    const e = this._currentGame.moveHistory.map((n, o) => {
      const a = Math.floor(o / 2) + 1, i = n.player === "black" ? "B" : "W", c = `${String.fromCharCode(97 + n.col)}${n.row + 1}`;
      return `${a}.${i} ${c}`;
    }), t = this.gameResult, s = t ? t.winner === "draw" ? "1/2-1/2" : t.winner === "black" ? "1-0" : "0-1" : "*";
    return [
      `[Game "${this._currentGame.id}"]`,
      '[Black "Player"]',
      '[White "Player"]',
      `[Result "${s}"]`,
      `[Score "${this._currentGame.score.black}-${this._currentGame.score.white}"]`,
      "",
      e.join(" ") + (s !== "*" ? ` ${s}` : "")
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
  simulateMoves(e) {
    let t = this.createSimulation();
    for (const s of e) {
      const n = C(t, s);
      if (n.success)
        t = n.newGameCore;
      else
        break;
    }
    return t;
  }
  /**
   * Get game state at specific move number
   */
  getGameStateAtMove(e) {
    return e < 0 || e >= this._gameHistory.length ? null : { ...this._gameHistory[e] };
  }
  /**
   * Dispose of the manager
   */
  dispose() {
    this.removeAllEventListeners(), this._gameHistory = [], this._redoStack = [];
  }
}
class ye {
  constructor() {
    l(this, "gameCore");
    l(this, "gameStateManager");
    l(this, "bitboard", null);
    this.gameCore = A(), this.gameStateManager = new _e();
  }
  // ===== 공통 게임 로직 메서드들 =====
  /**
   * 유효한 수 목록 반환
   */
  getValidMoves(e, t) {
    return d(e, t);
  }
  /**
   * 수의 유효성 검증
   */
  isValidMove(e, t, s) {
    return J(e, t, s);
  }
  /**
   * 수 시뮬레이션 (비트보드 기반 고속)
   */
  simulateMove(e, t, s) {
    try {
      const n = u(g(e));
      return I(n, t.row, t.col, s) ? T(n) : null;
    } catch (n) {
      return console.warn("SimulateMove error:", n), null;
    }
  }
  /**
   * 수 적용 (게임 상태 업데이트)
   */
  applyMove(e, t) {
    return C(e, t);
  }
  /**
   * 점수 계산
   */
  calculateScore(e) {
    return G(e);
  }
  /**
   * 빈 칸 수 계산
   */
  getEmptySquares(e) {
    return ge(e);
  }
  /**
   * 이동성 계산 (유효한 수의 개수)
   */
  getMobility(e, t) {
    return de(e, t);
  }
  /**
   * 게임 종료 여부 확인
   */
  isGameOver(e) {
    return D(e);
  }
  /**
   * 게임 결과 반환
   */
  getGameResult(e) {
    return q(e);
  }
  /**
   * 위치 해시 (트랜스포지션 테이블용)
   */
  getPositionHash(e) {
    return j(e);
  }
  // ===== 비트보드 관련 메서드들 =====
  /**
   * 보드를 비트보드로 변환
   */
  boardToBitBoard(e) {
    return u(g(e));
  }
  /**
   * 비트보드를 보드로 변환
   */
  bitBoardToBoard(e) {
    return T(e);
  }
  /**
   * 비트보드에서 수 적용
   */
  flipPiecesBitboard(e, t, s, n) {
    return I(e, t, s, n);
  }
  /**
   * 비트보드에서 수 되돌리기
   */
  undoMoveBitboard(e, t) {
    he(e, t);
  }
  // ===== 평가 관련 메서드들 =====
  /**
   * 돌 차이 계산
   */
  getStoneDifference(e, t = "black") {
    return X(e, t);
  }
  /**
   * 평가 점수를 돌 스케일로 매핑
   */
  mapEvaluationToStoneScale(e) {
    return Z(e);
  }
  /**
   * 평가 요약
   */
  summarizeEvaluation(e, t, s = "black") {
    return pe(e, t, s);
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
  updateGameCore(e) {
    this.gameCore = e;
  }
  // ===== 유틸리티 메서드들 =====
  /**
   * 상대방 플레이어 반환
   */
  getOpponent(e) {
    return e === "black" ? "white" : "black";
  }
  /**
   * 보드 복사
   */
  copyBoard(e) {
    return e.map((t) => [...t]);
  }
  /**
   * 게임 단계 분석 (빈 칸 수 기반)
   */
  analyzeGamePhase(e) {
    const t = this.getEmptySquares(e);
    return t > 50 ? "opening" : t > 20 ? "midgame" : "endgame";
  }
  /**
   * 난이도를 스킬 레벨로 변환
   */
  difficultyToSkill(e) {
    return {
      easy: 25,
      medium: 50,
      hard: 75,
      expert: 90,
      master: 100
    }[e] || 50;
  }
  /**
   * 스킬 레벨을 난이도로 변환
   */
  skillToDifficulty(e) {
    return e <= 30 ? "easy" : e <= 60 ? "medium" : e <= 80 ? "hard" : e <= 95 ? "expert" : "master";
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
  updateConfig(e) {
  }
  // ===== 공통 오류 처리 =====
  /**
   * 폴백 응답 생성
   */
  getFallbackResponse(e) {
    const t = this.getValidMoves(this.gameCore.board, this.gameCore.currentPlayer);
    return {
      bestMove: t.length > 0 ? t[Math.floor(Math.random() * t.length)] : void 0,
      evaluation: 0,
      depth: 0,
      nodes: 1,
      timeUsed: Date.now() - e
    };
  }
  /**
   * 입력 검증
   */
  validateRequest(e) {
    if (!e.gameCore)
      throw new Error("GameCore is required");
    if (!e.gameCore.board)
      throw new Error("Board is required");
    if (!e.gameCore.currentPlayer)
      throw new Error("Current player is required");
  }
}
const M = 64;
function X(r, e = "black") {
  const { black: t, white: s } = G(r);
  return e === "black" ? t - s : s - t;
}
function Z(r) {
  if (r === void 0 || Number.isNaN(r))
    return 0;
  const e = Math.tanh(r / 120), t = Math.round(e * M);
  return Math.max(-M, Math.min(M, t));
}
function pe(r, e, t = "black") {
  return {
    perspective: t,
    stoneDiff: X(r, t),
    normalizedEval: Z(e)
  };
}
function ve(r) {
  if (r.length)
    return r[Math.floor(Math.random() * r.length)];
}
class be extends ye {
  constructor() {
    super(...arguments);
    l(this, "name", "Random Engine");
    l(this, "version", "1.0.0");
    l(this, "author", "Infinite Othello");
  }
  async analyze(t) {
    const s = Date.now();
    try {
      this.validateRequest(t);
      const n = this.getValidMoves(t.gameCore.board, t.gameCore.currentPlayer), o = ve(n);
      return this.updateGameCore(t.gameCore), {
        bestMove: o,
        evaluation: 0,
        // 랜덤 엔진은 평가하지 않음
        nodes: n.length,
        depth: 1,
        timeUsed: Date.now() - s,
        pv: o ? [o] : void 0
      };
    } catch (n) {
      return console.error("Engine-A error:", n), this.getFallbackResponse(s);
    }
  }
}
const Me = new be();
export {
  be as EngineA,
  Me as default
};
