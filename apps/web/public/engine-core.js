var re = Object.defineProperty;
var se = (n, e, t) => e in n ? re(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var g = (n, e, t) => se(n, typeof e != "symbol" ? e + "" : e, t);
const ne = 0x0101010101010101n, oe = 0x8080808080808080n, _ = 0xffffffffffffffffn, N = _ ^ ne, O = _ ^ oe;
function E(n) {
  return (n & O) << 1n;
}
function A(n) {
  return (n & N) >> 1n;
}
function H(n) {
  return n << 8n;
}
function R(n) {
  return n >> 8n;
}
function J(n) {
  return (n & O) << 9n;
}
function $(n) {
  return (n & N) << 7n;
}
function I(n) {
  return (n & O) >> 7n;
}
function D(n) {
  return (n & N) >> 9n;
}
const ie = [
  E,
  A,
  H,
  R,
  J,
  $,
  I,
  D
];
function ae(n) {
  let e = 0, t = BigInt(n);
  for (; t; )
    e++, t &= t - 1n;
  return e;
}
function C(n) {
  let e = 0n, t = BigInt(n);
  for (; t > 1n; )
    t >>= 1n, e++;
  return Number(e);
}
function F(n, e) {
  return (7 - n) * 8 + e;
}
function ce(n) {
  if (n < 0 || n > 63) throw new Error("Invalid bit index: " + n);
  const t = 7 - (n / 8 | 0), r = n % 8;
  return [t, r];
}
function q(n, e) {
  return 1n << BigInt(F(n, e));
}
function le(n) {
  const e = [];
  let t = BigInt(n);
  for (; t; ) {
    const r = t & -t, s = C(r), [o, i] = ce(s);
    e.push({ row: o, col: i }), t ^= r;
  }
  return e;
}
function V(n) {
  return n && typeof n.length == "number" && typeof n.subarray == "function";
}
function ue(n) {
  const e = new Uint8Array(64);
  for (let t = 0; t < 8; t++)
    for (let r = 0; r < 8; r++) {
      const s = n[t][r];
      e[t * 8 + r] = s === "black" ? 1 : s === "white" ? 2 : 0;
    }
  return e;
}
function he(n) {
  let e = 0n, t = 0n;
  for (let r = 0; r < 64; r++) {
    const s = n[r] | 0;
    if (s === 0) continue;
    const o = r / 8 | 0, i = r % 8, a = F(o, i), c = 1n << BigInt(a);
    s === 1 ? e |= c : s === 2 && (t |= c);
  }
  return { bp: e, wp: t };
}
function d(n) {
  let e;
  if (V(n) ? e = n : Array.isArray(n) && Array.isArray(n[0]) ? e = ue(n) : Array.isArray(n) ? e = Uint8Array.from(n) : n && n.cells && V(n.cells) ? e = n.cells : e = new Uint8Array(64), e._bp === void 0 || e._wp === void 0) {
    const { bp: t, wp: r } = he(e);
    e._bp = t, e._wp = r;
  }
  return e;
}
function fe(n, e, t) {
  let r = t(n) & e;
  return r |= t(r) & e, r |= t(r) & e, r |= t(r) & e, r |= t(r) & e, r |= t(r) & e, t(r);
}
function me(n, e) {
  const t = d(e), r = n === 1 ? t._bp : t._wp, s = n === 1 ? t._wp : t._bp, o = ~(r | s) & _;
  let i = 0n;
  for (const a of ie)
    i |= fe(r, s, a);
  return i & o;
}
function B(n) {
  return n === "black" ? 1 : 2;
}
function de(n, e) {
  const t = B(n), r = me(t, e);
  return le(r);
}
function X(n, e, t) {
  let r = 0n, s, o;
  for (s = E(t), o = 0n; s && s & e; )
    o |= s, s = E(s);
  for (s & n && (r |= o), s = A(t), o = 0n; s && s & e; )
    o |= s, s = A(s);
  for (s & n && (r |= o), s = H(t), o = 0n; s && s & e; )
    o |= s, s = H(s);
  for (s & n && (r |= o), s = R(t), o = 0n; s && s & e; )
    o |= s, s = R(s);
  for (s & n && (r |= o), s = J(t), o = 0n; s && s & e; )
    o |= s, s = J(s);
  for (s & n && (r |= o), s = $(t), o = 0n; s && s & e; )
    o |= s, s = $(s);
  for (s & n && (r |= o), s = I(t), o = 0n; s && s & e; )
    o |= s, s = I(s);
  for (s & n && (r |= o), s = D(t), o = 0n; s && s & e; )
    o |= s, s = D(s);
  return s & n && (r |= o), r;
}
function Z(n, e, t, r) {
  const s = B(t), o = d(r), i = q(n, e), a = s === 1 ? o._bp : o._wp, c = s === 1 ? o._wp : o._bp;
  return (i & (a | c)) !== 0n ? !1 : X(a, c, i) !== 0n;
}
function U(n, e, t, r) {
  const s = B(r), o = d(n), i = q(e, t), a = s === 1 ? o._bp : o._wp, c = s === 1 ? o._wp : o._bp;
  if ((i & (a | c)) !== 0n) return;
  const h = X(a, c, i);
  if (!h) return;
  const b = o._bp, l = o._wp, f = a | i | h, p = c & ~h;
  s === 1 ? (o._bp = f, o._wp = p) : (o._wp = f, o._bp = p);
  let u = h | i;
  for (; u; ) {
    const v = u & -u, T = C(v);
    o[T] = s, u ^= v;
  }
  return { __native: !0, side: s, row: e, col: t, moveMask: i, flips: h, prevBP: b, prevWP: l };
}
function ge(n, e, t) {
  const r = d(n);
  if (!e || !e.__native) return;
  r._bp = e.prevBP, r._wp = e.prevWP;
  let o = e.flips | e.moveMask;
  for (; o; ) {
    const i = o & -o, a = C(i), c = 1n << BigInt(a), h = (e.prevBP & c) !== 0n, b = (e.prevWP & c) !== 0n;
    r[a] = h ? 1 : b ? 2 : 0, o ^= i;
  }
}
function be(n) {
  const e = d(n), t = e._bp | e._wp;
  return ae(~t & _);
}
function pe(n, e) {
  const t = B(e), r = d(n), s = 0x100000001b3n, o = 0x100000001b5n;
  let i = 0xcbf29ce484222325n;
  return i ^= r._bp * s & _, i *= o, i ^= r._wp * o & _, i *= s, i ^= BigInt(t & 3), i *= 0x100000001b7n, Number(i & 0xffffffffffffffffn);
}
function y(n) {
  const e = new Uint8Array(64);
  for (let t = 0; t < 8; t++)
    for (let r = 0; r < 8; r++) {
      const s = n[t][r], o = t * 8 + r;
      s === "black" ? e[o] = 1 : s === "white" ? e[o] = 2 : e[o] = 0;
    }
  return e;
}
function G(n) {
  const e = [];
  for (let t = 0; t < 8; t++) {
    const r = [];
    for (let s = 0; s < 8; s++) {
      const o = t * 8 + s, i = n[o];
      i === 1 ? r.push("black") : i === 2 ? r.push("white") : r.push(null);
    }
    e.push(r);
  }
  return e;
}
function P(n = crypto.randomUUID()) {
  const e = Array.from({ length: 8 }, () => new Array(8).fill(null));
  e[3][3] = "white", e[3][4] = "black", e[4][3] = "black", e[4][4] = "white";
  const t = k(e, "black");
  return {
    id: n,
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
function k(n, e) {
  const t = d(y(n));
  return de(e, t);
}
function j(n, e, t) {
  const r = d(y(n));
  return Z(e.row, e.col, t, r);
}
function W(n, e) {
  if (n.status !== "playing")
    return {
      success: !1,
      reason: "game_finished",
      message: "Game is not in playing state"
    };
  if (!(n.currentPlayer === "black" || n.currentPlayer === "white")) return {
    success: !1,
    reason: "not_your_turn",
    message: "Invalid current player"
  };
  const t = d(y(n.board));
  if (!Z(e.row, e.col, n.currentPlayer, t))
    return t[e.row * 8 + e.col] !== 0 ? {
      success: !1,
      reason: "occupied",
      message: "Position is already occupied"
    } : {
      success: !1,
      reason: "no_captures",
      message: "Move would not capture any pieces"
    };
  if (!U(t, e.row, e.col, n.currentPlayer))
    return {
      success: !1,
      reason: "invalid_position",
      message: "Failed to apply move"
    };
  const s = G(t), o = [];
  for (let m = 0; m < 8; m++)
    for (let u = 0; u < 8; u++)
      n.board[m][u] !== s[m][u] && !(m === e.row && u === e.col) && o.push({ row: m, col: u });
  const i = {
    row: e.row,
    col: e.col,
    player: n.currentPlayer,
    capturedCells: o,
    timestamp: Date.now()
  }, a = M(s), c = n.currentPlayer === "black" ? "white" : "black", h = k(s, c);
  let b = c, l = h, f = "playing";
  if (h.length === 0) {
    const m = k(s, n.currentPlayer);
    m.length === 0 ? (f = "finished", l = []) : (b = n.currentPlayer, l = m);
  }
  const p = {
    ...n,
    board: s,
    currentPlayer: b,
    validMoves: l,
    score: a,
    status: f,
    moveHistory: [...n.moveHistory, i],
    canUndo: !0,
    canRedo: !1
  };
  return {
    success: !0,
    move: i,
    newGameCore: p,
    capturedCells: o
  };
}
function M(n) {
  let e = 0, t = 0;
  for (let r = 0; r < 8; r++)
    for (let s = 0; s < 8; s++) {
      const o = n[r][s];
      o === "black" ? e++ : o === "white" && t++;
    }
  return { black: e, white: t };
}
function S(n) {
  if (n.status === "finished") return !0;
  if (k(n.board, n.currentPlayer).length > 0) return !1;
  const t = n.currentPlayer === "black" ? "white" : "black";
  return k(n.board, t).length === 0;
}
function z(n) {
  if (!S(n)) return null;
  const e = M(n.board);
  let t;
  return e.black > e.white ? t = "black" : e.white > e.black ? t = "white" : t = "draw", {
    winner: t,
    score: e,
    endReason: "normal",
    duration: 0,
    // Should be calculated from game start time
    totalMoves: n.moveHistory.length
  };
}
function L(n) {
  const e = d(y(n.board));
  return pe(e, n.currentPlayer);
}
function we(n) {
  return S(n);
}
function K(n, e) {
  return k(n, e).length;
}
function Q(n) {
  const e = d(y(n));
  return be(e);
}
function ye(n) {
  return {
    board: d(y(n.board)),
    currentPlayer: n.currentPlayer,
    validMoves: [...n.validMoves],
    score: n.score
  };
}
const ke = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bitBoardToBoard: G,
  boardToBitBoard: y,
  calculateScore: M,
  createInitialGameCore: P,
  gameCoreForEngine: ye,
  getEmptySquares: Q,
  getGameResult: z,
  getMobility: K,
  getPositionHash: L,
  getValidMoves: k,
  isGameOver: S,
  isTerminalPosition: we,
  isValidMove: j,
  makeMove: W
}, Symbol.toStringTag, { value: "Module" }));
class ve {
  constructor(e = {}) {
    g(this, "_currentGame");
    g(this, "_gameHistory", []);
    g(this, "_redoStack", []);
    g(this, "_listeners", []);
    g(this, "_config");
    this._config = {
      maxHistorySize: e.maxHistorySize || 100,
      enableUndo: e.enableUndo ?? !0,
      enableRedo: e.enableRedo ?? !0,
      autoSave: e.autoSave ?? !1
    }, this._currentGame = P(), this._gameHistory.push({ ...this._currentGame }), this.emit({ type: "game_started", gameCore: this._currentGame });
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
    return S(this._currentGame);
  }
  /**
   * Get game result if finished
   */
  get gameResult() {
    return z(this._currentGame);
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
    const t = W(this._currentGame, e);
    if (t.success) {
      if (this._currentGame = t.newGameCore, this._redoStack = [], this._gameHistory.push({ ...this._currentGame }), this._gameHistory.length > this._config.maxHistorySize && this._gameHistory.shift(), this.emit({ type: "move_made", move: t.move, gameCore: this._currentGame }), this.isGameOver) {
        const r = this.gameResult;
        r && this.emit({ type: "game_over", result: r });
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
    this._currentGame = P(), this._gameHistory = [{ ...this._currentGame }], this._redoStack = [], this.emit({ type: "game_reset", gameCore: this._currentGame }), this.emit({ type: "game_started", gameCore: this._currentGame });
  }
  /**
   * Check if a move is valid
   */
  isValidMove(e) {
    return j(this._currentGame.board, e, this._currentGame.currentPlayer);
  }
  /**
   * Get all valid moves for current player
   */
  getValidMoves() {
    return k(this._currentGame.board, this._currentGame.currentPlayer);
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
    return L(this._currentGame);
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
      } catch (r) {
        console.error("Error in game event listener:", r);
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
      const r = JSON.parse(t);
      return this._currentGame = r.currentGame, this._gameHistory = r.gameHistory || [], this._redoStack = r.redoStack || [], this.emit({ type: "game_started", gameCore: this._currentGame }), !0;
    } catch (t) {
      return console.error("Failed to load game state:", t), !1;
    }
  }
  /**
   * Export game as PGN-like format
   */
  exportGame() {
    const e = this._currentGame.moveHistory.map((s, o) => {
      const i = Math.floor(o / 2) + 1, a = s.player === "black" ? "B" : "W", c = `${String.fromCharCode(97 + s.col)}${s.row + 1}`;
      return `${i}.${a} ${c}`;
    }), t = this.gameResult, r = t ? t.winner === "draw" ? "1/2-1/2" : t.winner === "black" ? "1-0" : "0-1" : "*";
    return [
      `[Game "${this._currentGame.id}"]`,
      '[Black "Player"]',
      '[White "Player"]',
      `[Result "${r}"]`,
      `[Score "${this._currentGame.score.black}-${this._currentGame.score.white}"]`,
      "",
      e.join(" ") + (r !== "*" ? ` ${r}` : "")
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
    for (const r of e) {
      const s = W(t, r);
      if (s.success)
        t = s.newGameCore;
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
class Se {
  constructor(e = {}) {
    g(this, "workers", /* @__PURE__ */ new Map());
    g(this, "pendingJobs", /* @__PURE__ */ new Map());
    g(this, "config");
    g(this, "nextJobId", 1);
    this.config = {
      maxWorkers: e.maxWorkers || Math.max(1, Math.floor(navigator.hardwareConcurrency / 2)),
      workerTimeout: e.workerTimeout || 3e4,
      enableDistributedSearch: e.enableDistributedSearch ?? !0,
      fallbackToSingleWorker: e.fallbackToSingleWorker ?? !0
    }, this.initializeWorkers();
  }
  initializeWorkers() {
    for (let e = 0; e < this.config.maxWorkers; e++) {
      const t = `worker-${e}`, r = this.spawnWorker(t);
      r.onmessage = (s) => this.handleWorkerMessage(t, s.data), r.onerror = (s) => this.handleWorkerError(t, s), this.workers.set(t, {
        worker: r,
        busy: !1,
        jobId: null,
        startTime: 0
      });
    }
  }
  async search(e, t, r = {}) {
    const s = `job-${this.nextJobId++}`, o = performance.now(), i = await this.getValidMoves(e, t);
    return new Promise((a, c) => {
      const h = setTimeout(() => {
        const l = this.pendingJobs.get(s);
        if (l && l.results.size > 0) {
          console.warn(`[SearchWorkerManager] Timeout reached with ${l.results.size}/${l.expectedResponses} results; resolving with best partial.`);
          try {
            const f = Array.from(l.results.values()), p = this.selectBestResult(f), m = {
              bestMove: p.bestMove,
              evaluation: p.evaluation,
              nodes: f.reduce((u, w) => u + w.nodes, 0),
              depth: Math.max(...f.map((u) => u.depth)),
              timeUsed: performance.now() - l.startTime,
              workersUsed: f.length,
              distributionStrategy: f.length > 1 ? "distributed" : "single"
            };
            for (const u of l.workersAssigned) {
              const w = this.workers.get(u);
              w && (w.busy = !1, w.jobId = null);
            }
            this.pendingJobs.delete(s), a(m);
          } catch (f) {
            this.cancelJob(s), c(new Error(`Search timeout and aggregation failed: ${f.message}`));
          }
        } else
          this.cancelJob(s), c(new Error(`Search timeout after ${this.config.workerTimeout}ms`));
      }, r.timeLimit || this.config.workerTimeout);
      this.config.enableDistributedSearch && i.length >= 4 && this.getAvailableWorkerCount() >= 2 ? this.startDistributedSearch(s, e, t, r, i, a, c, h, o) : this.startSingleWorkerSearch(s, e, t, r, a, c, h, o);
    });
  }
  startSingleWorkerSearch(e, t, r, s, o, i, a, c) {
    const h = this.getAvailableWorker();
    if (!h) {
      clearTimeout(a), i(new Error("No workers available"));
      return;
    }
    const [b, l] = h;
    l.busy = !0, l.jobId = e, l.startTime = performance.now(), this.pendingJobs.set(e, {
      id: e,
      resolve: o,
      reject: i,
      timeout: a,
      startTime: c,
      workersAssigned: [b],
      results: /* @__PURE__ */ new Map(),
      expectedResponses: 1
    });
    const f = {
      id: e,
      gameCore: t,
      player: r,
      options: s
    };
    l.worker.postMessage(f);
  }
  startDistributedSearch(e, t, r, s, o, i, a, c, h) {
    const b = this.getAvailableWorkers(), l = Math.min(b.length, o.length);
    if (l === 0) {
      clearTimeout(c), a(new Error("No workers available for distributed search"));
      return;
    }
    const f = this.distributeMoves(o, l), p = [];
    this.pendingJobs.set(e, {
      id: e,
      resolve: i,
      reject: a,
      timeout: c,
      startTime: h,
      workersAssigned: [],
      results: /* @__PURE__ */ new Map(),
      expectedResponses: l
    });
    for (let u = 0; u < l; u++) {
      const [w, v] = b[u], T = f[u];
      v.busy = !0, v.jobId = e, v.startTime = performance.now(), p.push(w);
      const te = {
        id: `${e}-${w}`,
        gameCore: t,
        player: r,
        options: {
          ...s,
          // Give each worker the full time budget; wall-clock remains bounded by timeout
          timeLimit: s.timeLimit
        },
        rootMoves: T
      };
      v.worker.postMessage(te);
    }
    const m = this.pendingJobs.get(e);
    m.workersAssigned = p;
  }
  handleWorkerMessage(e, t) {
    console.log(`[SearchWorkerManager] Received message from worker ${e}:`, t);
    const r = this.workers.get(e);
    if (!r) {
      console.warn(`[SearchWorkerManager] No worker data found for ${e}`);
      return;
    }
    const s = t.id.includes("-worker-") ? t.id.split("-worker-")[0] : t.id, o = this.pendingJobs.get(s);
    if (!o) {
      console.warn(`[SearchWorkerManager] Received result for unknown job: ${t.id}`);
      return;
    }
    if (r.busy = !1, r.jobId = null, t.success)
      o.results.set(t.id, t), o.results.size >= o.expectedResponses && this.completeJob(s);
    else {
      const i = new Error(t.error);
      this.failJob(s, i);
    }
  }
  handleWorkerError(e, t) {
    console.error(`[SearchWorkerManager] Worker ${e} error:`, t), console.error("[SearchWorkerManager] Error details:", {
      message: t.message,
      filename: t.filename,
      lineno: t.lineno,
      colno: t.colno
    });
    const r = this.workers.get(e);
    r && r.jobId && this.pendingJobs.get(r.jobId) && this.failJob(r.jobId, new Error(`Worker error: ${t.message}`)), this.restartWorker(e);
  }
  completeJob(e) {
    const t = this.pendingJobs.get(e);
    if (t) {
      clearTimeout(t.timeout);
      try {
        const r = Array.from(t.results.values()), s = this.selectBestResult(r), o = {
          bestMove: s.bestMove,
          evaluation: s.evaluation,
          nodes: r.reduce((i, a) => i + a.nodes, 0),
          depth: Math.max(...r.map((i) => i.depth)),
          timeUsed: performance.now() - t.startTime,
          workersUsed: r.length,
          distributionStrategy: r.length > 1 ? "distributed" : "single"
        };
        t.resolve(o);
      } catch (r) {
        t.reject(r);
      } finally {
        this.pendingJobs.delete(e);
      }
    }
  }
  failJob(e, t) {
    const r = this.pendingJobs.get(e);
    if (r) {
      clearTimeout(r.timeout);
      for (const s of r.workersAssigned) {
        const o = this.workers.get(s);
        o && (o.busy = !1, o.jobId = null);
      }
      r.reject(t), this.pendingJobs.delete(e);
    }
  }
  cancelJob(e) {
    const t = this.pendingJobs.get(e);
    if (t) {
      for (const r of t.workersAssigned) {
        const s = this.workers.get(r);
        s && (s.busy = !1, s.jobId = null);
      }
      this.pendingJobs.delete(e);
    }
  }
  selectBestResult(e) {
    return e.reduce(
      (t, r) => r.evaluation > t.evaluation ? r : t
    );
  }
  distributeMoves(e, t) {
    const r = Array.from({ length: t }, () => []);
    return e.forEach((s, o) => {
      r[o % t].push(s);
    }), r;
  }
  async getValidMoves(e, t) {
    const { getValidMoves: r } = await Promise.resolve().then(() => ke);
    return r(e.board, t);
  }
  getAvailableWorker() {
    for (const [e, t] of this.workers)
      if (!t.busy)
        return [e, t];
    return null;
  }
  getAvailableWorkers() {
    return Array.from(this.workers.entries()).filter(([e, t]) => !t.busy);
  }
  getAvailableWorkerCount() {
    return Array.from(this.workers.values()).filter((e) => !e.busy).length;
  }
  restartWorker(e) {
    const t = this.workers.get(e);
    t && t.worker.terminate();
    const r = this.spawnWorker(e);
    r.onmessage = (s) => this.handleWorkerMessage(e, s.data), r.onerror = (s) => this.handleWorkerError(e, s), this.workers.set(e, {
      worker: r,
      busy: !1,
      jobId: null,
      startTime: 0
    });
  }
  spawnWorker(e) {
    const t = new URL("./search-worker.js", import.meta.url);
    console.log(`[SearchWorkerManager] Creating worker ${e} with URL:`, t.href);
    try {
      const r = new Worker(t, {
        type: "module",
        name: e
      });
      return console.log(`[SearchWorkerManager] Worker ${e} created successfully`), r;
    } catch (r) {
      throw console.error(`[SearchWorkerManager] Failed to create worker ${e}:`, r), r;
    }
  }
  // Public methods
  getStatus() {
    const e = Array.from(this.workers.values());
    return {
      totalWorkers: e.length,
      busyWorkers: e.filter((t) => t.busy).length,
      availableWorkers: e.filter((t) => !t.busy).length,
      pendingJobs: this.pendingJobs.size,
      config: this.config
    };
  }
  async terminate() {
    for (const t of this.pendingJobs.keys())
      this.cancelJob(t);
    const e = Array.from(this.workers.values()).map(
      (t) => new Promise((r) => {
        t.worker.onmessage = null, t.worker.onerror = null, t.worker.terminate(), r();
      })
    );
    await Promise.all(e), this.workers.clear(), this.pendingJobs.clear();
  }
}
class Ge {
  constructor() {
    g(this, "gameCore");
    g(this, "gameStateManager");
    g(this, "bitboard", null);
    this.gameCore = P(), this.gameStateManager = new ve();
  }
  // ===== 공통 게임 로직 메서드들 =====
  /**
   * 유효한 수 목록 반환
   */
  getValidMoves(e, t) {
    return k(e, t);
  }
  /**
   * 수의 유효성 검증
   */
  isValidMove(e, t, r) {
    return j(e, t, r);
  }
  /**
   * 수 시뮬레이션 (비트보드 기반 고속)
   */
  simulateMove(e, t, r) {
    try {
      const s = d(y(e));
      return U(s, t.row, t.col, r) ? G(s) : null;
    } catch (s) {
      return console.warn("SimulateMove error:", s), null;
    }
  }
  /**
   * 수 적용 (게임 상태 업데이트)
   */
  applyMove(e, t) {
    return W(e, t);
  }
  /**
   * 점수 계산
   */
  calculateScore(e) {
    return M(e);
  }
  /**
   * 빈 칸 수 계산
   */
  getEmptySquares(e) {
    return Q(e);
  }
  /**
   * 이동성 계산 (유효한 수의 개수)
   */
  getMobility(e, t) {
    return K(e, t);
  }
  /**
   * 게임 종료 여부 확인
   */
  isGameOver(e) {
    return S(e);
  }
  /**
   * 게임 결과 반환
   */
  getGameResult(e) {
    return z(e);
  }
  /**
   * 위치 해시 (트랜스포지션 테이블용)
   */
  getPositionHash(e) {
    return L(e);
  }
  // ===== 비트보드 관련 메서드들 =====
  /**
   * 보드를 비트보드로 변환
   */
  boardToBitBoard(e) {
    return d(y(e));
  }
  /**
   * 비트보드를 보드로 변환
   */
  bitBoardToBoard(e) {
    return G(e);
  }
  /**
   * 비트보드에서 수 적용
   */
  flipPiecesBitboard(e, t, r, s) {
    return U(e, t, r, s);
  }
  /**
   * 비트보드에서 수 되돌리기
   */
  undoMoveBitboard(e, t) {
    ge(e, t);
  }
  // ===== 평가 관련 메서드들 =====
  /**
   * 돌 차이 계산
   */
  getStoneDifference(e, t = "black") {
    return Y(e, t);
  }
  /**
   * 평가 점수를 돌 스케일로 매핑
   */
  mapEvaluationToStoneScale(e) {
    return ee(e);
  }
  /**
   * 평가 요약
   */
  summarizeEvaluation(e, t, r = "black") {
    return _e(e, t, r);
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
const x = 64;
function Y(n, e = "black") {
  const { black: t, white: r } = M(n);
  return e === "black" ? t - r : r - t;
}
function ee(n) {
  if (n === void 0 || Number.isNaN(n))
    return 0;
  const e = Math.tanh(n / 120), t = Math.round(e * x);
  return Math.max(-x, Math.min(x, t));
}
function _e(n, e, t = "black") {
  return {
    perspective: t,
    stoneDiff: Y(n, t),
    normalizedEval: ee(e)
  };
}
export {
  _ as ALL_ONES,
  Ge as EngineBase,
  ne as FILE_A,
  oe as FILE_H,
  ve as GameStateManager,
  N as NOT_FILE_A,
  O as NOT_FILE_H,
  Se as SearchWorkerManager,
  G as bitBoardToBoard,
  ae as bitCount,
  C as bitIndex,
  ce as bitIndexToRC,
  y as boardToBitBoard,
  M as calculateScore,
  pe as computeZobristHash,
  P as createInitialGameCore,
  be as emptiesCount,
  d as ensureBoard,
  U as flipPieces,
  ye as gameCoreForEngine,
  Q as getEmptySquares,
  z as getGameResult,
  K as getMobility,
  L as getPositionHash,
  Y as getStoneDifference,
  k as getValidMoves,
  de as getValidMovesBitboard,
  me as getValidMovesMask,
  S as isGameOver,
  we as isTerminalPosition,
  j as isValidMove,
  Z as isValidMoveBitboard,
  W as makeMove,
  ee as mapEvaluationToStoneScale,
  le as maskToRCList,
  F as rcToBitIndex,
  q as rcToMask,
  E as shiftEast,
  H as shiftNorth,
  J as shiftNorthEast,
  $ as shiftNorthWest,
  R as shiftSouth,
  I as shiftSouthEast,
  D as shiftSouthWest,
  A as shiftWest,
  _e as summarizeEvaluation,
  ge as undoMove
};
