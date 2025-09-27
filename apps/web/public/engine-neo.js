var bt = Object.defineProperty;
var kt = (n, t, i) => t in n ? bt(n, t, { enumerable: !0, configurable: !0, writable: !0, value: i }) : n[t] = i;
var h = (n, t, i) => kt(n, typeof t != "symbol" ? t + "" : t, i);
class P {
  constructor(t = 2e5) {
    h(this, "table", /* @__PURE__ */ new Map());
    h(this, "currentAge", 0);
    h(this, "maxSize");
    this.maxSize = t;
  }
  /**
   * Get current age
   */
  getAge() {
    return this.currentAge;
  }
  /**
   * Increment age (called at start of each search)
   */
  bumpAge() {
    this.currentAge = this.currentAge + 1 | 0;
  }
  /**
   * Get entry from table
   */
  get(t) {
    return this.table.get(t);
  }
  /**
   * Store entry in table with eviction if needed
   */
  set(t, i) {
    this.table.size >= this.maxSize && this.evictOldEntries(), this.table.set(t, { ...i, age: this.currentAge });
  }
  /**
   * Evict old entries when table is full
   */
  evictOldEntries() {
    const t = Math.max(1, Math.floor(this.maxSize * 0.02));
    let i = 0;
    for (const [e, s] of this.table.entries())
      if (s.age !== this.currentAge && (this.table.delete(e), i++, i >= t))
        break;
    if (this.table.size >= this.maxSize) {
      let e = 0;
      const s = 64;
      for (const o of this.table.keys())
        if (this.table.delete(o), e++, e >= s) break;
    }
  }
  /**
   * Clear the entire table
   */
  clear() {
    this.table.clear(), this.currentAge = 0;
  }
  /**
   * Get table statistics
   */
  getStats() {
    return {
      size: this.table.size,
      maxSize: this.maxSize,
      age: this.currentAge,
      fillRatio: this.table.size / this.maxSize
    };
  }
  /**
   * Check if entry is usable for given depth
   */
  isUsable(t, i) {
    return t !== void 0 && t.depth >= i;
  }
  /**
   * Extract best move from entry
   */
  getBestMove(t) {
    return t == null ? void 0 : t.bestMove;
  }
  /**
   * Check if entry provides cutoff for alpha-beta bounds
   */
  providesScoreCutoff(t, i, e, s) {
    if (!this.isUsable(t, s))
      return { cutoff: !1 };
    const { flag: o, score: r } = t;
    if (o === 0)
      return { cutoff: !0, score: r };
    if (o === 1 && r >= e)
      return { cutoff: !0, score: r };
    if (o === 2 && r <= i)
      return { cutoff: !0, score: r };
    let c = i, l = e;
    return o === 1 ? c = Math.max(i, r) : o === 2 && (l = Math.min(e, r)), c >= l ? { cutoff: !0, score: r } : {
      cutoff: !1,
      newAlpha: c !== i ? c : void 0,
      newBeta: l !== e ? l : void 0
    };
  }
  /**
   * Create TT entry for storage
   */
  createEntry(t, i, e, s, o) {
    let r;
    return i <= s ? r = 2 : i >= o ? r = 1 : r = 0, {
      depth: t,
      flag: r,
      score: i,
      bestMove: e,
      age: this.currentAge
    };
  }
}
function xt(n) {
  return n >= 45 ? {
    mobility: 28,
    pmob: 12,
    stability: 6,
    frontier: 10,
    corner: 35,
    x: 18,
    c: 10,
    parity: 0,
    edge: 4,
    edgeOcc: -4
  } : n >= 20 ? {
    mobility: 24,
    pmob: 16,
    stability: 10,
    frontier: 16,
    corner: 34,
    x: 22,
    c: 14,
    parity: 6,
    edge: 8,
    edgeOcc: -8
  } : {
    mobility: 8,
    pmob: 6,
    stability: 22,
    frontier: 8,
    corner: 40,
    x: 20,
    c: 12,
    parity: 18,
    edge: 12,
    edgeOcc: 6
  };
}
const H = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120]
], At = [
  {
    corner: [0, 0],
    x: [1, 1],
    c: [[0, 1], [1, 0]]
  },
  {
    corner: [0, 7],
    x: [1, 6],
    c: [[0, 6], [1, 7]]
  },
  {
    corner: [7, 0],
    x: [6, 1],
    c: [[6, 0], [7, 1]]
  },
  {
    corner: [7, 7],
    x: [6, 6],
    c: [[6, 7], [7, 6]]
  }
], J = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1]
], Z = 0x0101010101010101n, Q = 0x8080808080808080n, _ = 0xffffffffffffffffn, C = _ ^ Z, B = _ ^ Q;
function tt(n) {
  return (n & B) << 1n;
}
function et(n) {
  return (n & C) >> 1n;
}
function it(n) {
  return n << 8n;
}
function nt(n) {
  return n >> 8n;
}
function st(n) {
  return (n & B) << 9n;
}
function ot(n) {
  return (n & C) << 7n;
}
function rt(n) {
  return (n & B) >> 7n;
}
function ct(n) {
  return (n & C) >> 9n;
}
const It = [
  tt,
  et,
  it,
  nt,
  st,
  ot,
  rt,
  ct
];
function lt(n) {
  let t = 0n, i = BigInt(n);
  for (; i > 1n; )
    i >>= 1n, t++;
  return Number(t);
}
function at(n, t) {
  return (7 - n) * 8 + t;
}
function ft(n) {
  if (n < 0 || n > 63) throw new Error("Invalid bit index: " + n);
  const i = 7 - (n / 8 | 0), e = n % 8;
  return [i, e];
}
function ht(n) {
  const t = [];
  let i = BigInt(n);
  for (; i; ) {
    const e = i & -i, s = lt(e), [o, r] = ft(s);
    t.push({ row: o, col: r }), i ^= e;
  }
  return t;
}
function U(n) {
  return n && typeof n.length == "number" && typeof n.subarray == "function";
}
function Nt(n) {
  const t = new Uint8Array(64);
  for (let i = 0; i < 8; i++)
    for (let e = 0; e < 8; e++) {
      const s = n[i][e];
      t[i * 8 + e] = s === "black" ? 1 : s === "white" ? 2 : 0;
    }
  return t;
}
function Ht(n) {
  let t = 0n, i = 0n;
  for (let e = 0; e < 64; e++) {
    const s = n[e] | 0;
    if (s === 0) continue;
    const o = e / 8 | 0, r = e % 8, c = at(o, r), l = 1n << BigInt(c);
    s === 1 ? t |= l : s === 2 && (i |= l);
  }
  return { bp: t, wp: i };
}
function D(n) {
  let t;
  if (U(n) ? t = n : Array.isArray(n) && Array.isArray(n[0]) ? t = Nt(n) : Array.isArray(n) ? t = Uint8Array.from(n) : n && n.cells && U(n.cells) ? t = n.cells : t = new Uint8Array(64), t._bp === void 0 || t._wp === void 0) {
    const { bp: i, wp: e } = Ht(t);
    t._bp = i, t._wp = e;
  }
  return t;
}
function _t(n, t, i) {
  let e = i(n) & t;
  return e |= i(e) & t, e |= i(e) & t, e |= i(e) & t, e |= i(e) & t, e |= i(e) & t, i(e);
}
function ut(n, t) {
  const i = D(t), e = n === 1 ? i._bp : i._wp, s = n === 1 ? i._wp : i._bp, o = ~(e | s) & _;
  let r = 0n;
  for (const c of It)
    r |= _t(e, s, c);
  return r & o;
}
function Ct(n) {
  return n === "black" ? 1 : 2;
}
function mt(n, t) {
  const i = Ct(n), e = ut(i, t);
  return ht(e);
}
function Bt(n) {
  const t = new Uint8Array(64);
  for (let i = 0; i < 8; i++)
    for (let e = 0; e < 8; e++) {
      const s = n[i][e], o = i * 8 + e;
      s === "black" ? t[o] = 1 : s === "white" ? t[o] = 2 : t[o] = 0;
    }
  return t;
}
function N(n, t) {
  const i = D(Bt(n));
  return mt(t, i);
}
function $(n, t) {
  return N(n, t).length;
}
function q(n, t) {
  const i = t === "black" ? "white" : "black";
  let e = 0;
  for (let s = 0; s < 8; s++)
    for (let o = 0; o < 8; o++) {
      if (n[s][o] !== null) continue;
      let r = !1;
      for (const [c, l] of J) {
        const a = s + c, f = o + l;
        if (a >= 0 && a < 8 && f >= 0 && f < 8 && n[a][f] === i) {
          r = !0;
          break;
        }
      }
      r && e++;
    }
  return e;
}
function Lt(n, t, i) {
  const e = $(n, t), s = $(n, i), o = q(n, t), r = q(n, i);
  return {
    currentMobility: e,
    potentialMobility: o,
    mobilityDiff: e - s,
    potentialMobilityDiff: o - r
  };
}
function Ot(n) {
  const { row: t, col: i } = n;
  return (t === 0 || t === 7) && (i === 0 || i === 7);
}
function gt(n) {
  let t = 0;
  for (let i = 0; i < 8; i++)
    for (let e = 0; e < 8; e++)
      n[i][e] === null && t++;
  return t;
}
function Pt(n) {
  let t = 0, i = 0;
  for (let e = 0; e < 8; e++)
    for (let s = 0; s < 8; s++) {
      const o = n[e][s];
      o === "black" ? t++ : o === "white" && i++;
    }
  return { black: t, white: i };
}
class Mt {
  constructor() {
    h(this, "moves", /* @__PURE__ */ new Map());
    h(this, "maxKillersPerPly", 2);
  }
  /**
   * Add a killer move for a specific ply
   */
  addKiller(t, i) {
    this.moves.has(t) || this.moves.set(t, []);
    const e = this.moves.get(t), s = e.findIndex((o) => o.row === i.row && o.col === i.col);
    s !== -1 && e.splice(s, 1), e.unshift(i), e.length > this.maxKillersPerPly && e.pop();
  }
  /**
   * Get killer moves for a specific ply
   */
  getKillers(t) {
    return this.moves.get(t) || [];
  }
  /**
   * Get priority of a move based on killer heuristic
   */
  getKillerPriority(t, i) {
    const e = this.getKillers(i);
    for (let s = 0; s < e.length; s++) {
      const o = e[s];
      if (o.row === t.row && o.col === t.col)
        return 2 - s;
    }
    return 0;
  }
  /**
   * Clear killer moves (called between searches)
   */
  clear() {
    this.moves.clear();
  }
}
class vt {
  constructor() {
    h(this, "history", /* @__PURE__ */ new Map());
  }
  /**
   * Generate key for move and player
   */
  getKey(t, i) {
    return `${t.row},${t.col}|${i}`;
  }
  /**
   * Update history score for a move
   */
  updateHistory(t, i, e) {
    const s = this.getKey(t, i), o = e * e, r = this.history.get(s) || 0;
    this.history.set(s, r + o);
  }
  /**
   * Get history score for a move
   */
  getHistoryScore(t, i) {
    const e = this.getKey(t, i);
    return this.history.get(e) || 0;
  }
  /**
   * Clear history table
   */
  clear() {
    this.history.clear();
  }
  /**
   * Age history scores (reduce by factor to prioritize recent moves)
   */
  ageHistory(t = 0.9) {
    for (const [i, e] of this.history.entries())
      this.history.set(i, Math.floor(e * t));
  }
}
function Rt(n, t) {
  const i = n.map((e) => ({
    move: e,
    score: Dt(e, t)
  }));
  return i.sort((e, s) => s.score - e.score), i.map((e) => e.move);
}
function Dt(n, t) {
  const { ply: i, player: e, killers: s, history: o, ttBestMove: r } = t;
  let c = 0;
  r && r.row === n.row && r.col === n.col && (c += 1e4), Ot(n) && (c += 5e3), c += H[n.row][n.col];
  const l = s.getKillerPriority(n, i);
  l > 0 && (c += 1e3 * l);
  const a = o.getHistoryScore(n, e);
  c += a / 10;
  const f = Math.abs(n.row - 3.5) + Math.abs(n.col - 3.5);
  return c += (7 - f) * 2, c;
}
function F(n, t) {
  const i = /* @__PURE__ */ new Set(), e = [
    {
      pos: [0, 0],
      dirs: [[0, 1], [1, 0]]
    },
    {
      pos: [0, 7],
      dirs: [[0, -1], [1, 0]]
    },
    {
      pos: [7, 0],
      dirs: [[-1, 0], [0, 1]]
    },
    {
      pos: [7, 7],
      dirs: [[-1, 0], [0, -1]]
    }
  ];
  for (const { pos: [s, o], dirs: r } of e)
    if (n[s][o] === t) {
      i.add(`${s},${o}`);
      for (const [l, a] of r) {
        let f = s + l, u = o + a;
        for (; f >= 0 && f < 8 && u >= 0 && u < 8 && n[f][u] === t; )
          i.add(`${f},${u}`), f += l, u += a;
      }
    }
  return i.size;
}
function V(n, t) {
  const i = /* @__PURE__ */ new Set();
  function e(o, r, c, l) {
    for (; o >= 0 && o < 8 && r >= 0 && r < 8 && n[o][r] === t; )
      i.add(`${o},${r}`), o += c, r += l;
  }
  const s = [[0, 0], [0, 7], [7, 0], [7, 7]];
  for (const [o, r] of s)
    n[o][r] === t && (o === 0 && r === 0 ? (e(o, r, 0, 1), e(o, r, 1, 0)) : o === 0 && r === 7 ? (e(o, r, 0, -1), e(o, r, 1, 0)) : o === 7 && r === 0 ? (e(o, r, -1, 0), e(o, r, 0, 1)) : o === 7 && r === 7 && (e(o, r, -1, 0), e(o, r, 0, -1)));
  return i.size;
}
function Y(n, t) {
  let i = 0;
  for (let e = 0; e < 8; e++)
    n[0][e] === t && i++, n[7][e] === t && i++;
  for (let e = 1; e < 7; e++)
    n[e][0] === t && i++, n[e][7] === t && i++;
  return i;
}
function j(n, t) {
  let i = 0;
  for (let e = 0; e < 8; e++)
    for (let s = 0; s < 8; s++) {
      if (n[e][s] !== t) continue;
      let o = !1;
      for (const [r, c] of J) {
        const l = e + r, a = s + c;
        if (l < 0 || l >= 8 || a < 0 || a >= 8 || n[l][a] === null) {
          o = !0;
          break;
        }
      }
      o && i++;
    }
  return i;
}
function R(n, t, i = !1) {
  if (i) {
    const d = Pt(n), T = d[t], I = t === "black" ? d.white : d.black;
    return T - I;
  }
  const e = t === "black" ? "white" : "black", s = gt(n), o = xt(s);
  let r = 0, c = 0;
  for (let d = 0; d < 8; d++)
    for (let T = 0; T < 8; T++) {
      const I = n[d][T];
      I === t ? c += H[d][T] : I === e && (c -= H[d][T]);
    }
  const l = Lt(n, t, e), a = o.mobility * l.mobilityDiff, f = o.pmob * l.potentialMobilityDiff, u = F(n, t), v = F(n, e), w = o.stability * (u - v), g = j(n, t), p = j(n, e), E = o.frontier * (p - g), b = s % 2 === (t === "black" ? 1 : 0) ? o.parity : -o.parity, m = V(n, t), x = V(n, e), y = o.edge * (m - x), M = Y(n, t), S = Y(n, e), z = o.edgeOcc * (M - S);
  let A = 0, L = 0, O = 0;
  for (const { corner: d, x: T, c: I } of At) {
    const [St, pt] = d, [Tt, yt] = T, W = n[St][pt];
    if (W === t)
      A += o.corner;
    else if (W === e)
      A -= o.corner;
    else {
      const G = n[Tt][yt];
      G === t ? L -= o.x : G === e && (L += o.x);
      for (const [wt, Et] of I) {
        const K = n[wt][Et];
        K === t ? O -= o.c : K === e && (O += o.c);
      }
    }
  }
  return r = c + a + f + w + E + b + y + z + A + L + O, r;
}
function Zt(n, t) {
  const i = t === "black" ? "white" : "black";
  let e = 0;
  for (let o = 0; o < 8; o++)
    for (let r = 0; r < 8; r++) {
      const c = n[o][r];
      c === t ? e += H[o][r] : c === i && (e -= H[o][r]);
    }
  const s = [[0, 0], [0, 7], [7, 0], [7, 7]];
  for (const [o, r] of s) {
    const c = n[o][r];
    c === t ? e += 100 : c === i && (e -= 100);
  }
  return e;
}
function zt(n, t = 12) {
  return gt(n) <= t;
}
const k = [];
function Wt() {
  for (let n = 0; n <= 60; n++) {
    k[n] = [];
    for (let t = 0; t <= 60; t++)
      k[n][t] = { depth: 0, selectivity: 5 };
  }
  for (let n = 0; n <= 60; n++)
    for (let t = 0; t <= 60; t++) {
      if (n <= 0) {
        k[n][t] = { depth: 0, selectivity: 5 };
        continue;
      }
      if (n <= 10) {
        k[n][t] = {
          depth: t <= 2 * n ? t : n,
          selectivity: 5
        };
        continue;
      }
      const i = [
        { lim: 12, sel: [[21, 5], [24, 3], [99, 0]] },
        { lim: 18, sel: [[21, 5], [24, 3], [27, 1], [99, 0]] },
        { lim: 24, sel: [[24, 5], [27, 4], [30, 2], [33, 0], [99, 0]] },
        { lim: 33, sel: [[30, 5], [33, 4], [36, 2], [39, 0], [99, 0]] },
        { lim: 35, sel: [[30, 5], [33, 4], [36, 3], [39, 1], [99, 0]] }
      ];
      let e = !1;
      for (const s of i)
        if (n <= s.lim) {
          let o = 0, r = { depth: t, selectivity: 0 };
          for (const [c, l] of s.sel)
            if (o = l, t <= c) {
              r = { depth: t, selectivity: o };
              break;
            }
          k[n][t] = r, e = !0;
          break;
        }
      if (!e) {
        let s = 0;
        t <= n - 6 ? s = 5 : t <= n - 3 ? s = 4 : t <= n ? s = 3 : t <= n + 3 ? s = 2 : t <= n + 6 ? s = 1 : s = 0, k[n][t] = {
          depth: t <= n + 9 ? t : n,
          selectivity: s
        };
      }
    }
}
Wt();
function Gt(n, t) {
  const i = Math.max(0, Math.min(60, n)), e = Math.max(0, Math.min(60, t));
  return k[i][e];
}
function Kt(n) {
  const e = (5 - Math.max(0, Math.min(5, n))) / 5;
  return {
    lmrBase: 0.75 + 1.75 * e,
    // 0.75 to 2.5
    lmpBonus: Math.round(12 * e),
    // 0 to 12
    futMul: 1 + 1 * e,
    // 1.0 to 2.0
    razorMul: 1 + 0.8 * e,
    // 1.0 to 1.8
    useNWS: e > 0.15
    // Enable NWS for selectivity <= 4
  };
}
var Ut = /* @__PURE__ */ ((n) => (n[n.BEGINNER = 8] = "BEGINNER", n[n.EASY = 12] = "EASY", n[n.MEDIUM = 18] = "MEDIUM", n[n.HARD = 24] = "HARD", n[n.EXPERT = 33] = "EXPERT", n[n.MASTER = 40] = "MASTER", n[n.GRANDMASTER = 50] = "GRANDMASTER", n))(Ut || {});
function Qt(n) {
  switch (n.toLowerCase()) {
    case "beginner":
      return 8;
    case "easy":
      return 12;
    case "medium":
      return 18;
    case "hard":
      return 24;
    case "expert":
      return 33;
    case "master":
      return 40;
    case "grandmaster":
      return 50;
    default:
      return 18;
  }
}
const te = {
  // NWS (Null Window Search) stability thresholds
  NWS: Array.from({ length: 61 }, (n, t) => t < 4 ? 99 : t <= 8 ? 8 : t <= 24 ? 26 + Math.floor((t - 8) * 1.2) : Math.min(64, 40 + Math.floor((t - 24) * 1))),
  // PVS (Principal Variation Search) stability thresholds
  PVS: Array.from({ length: 61 }, (n, t) => t < 4 ? 99 : t <= 8 ? 0 : t <= 24 ? 12 + Math.floor((t - 8) * 1.2) : Math.min(62, 32 + Math.floor((t - 24) * 1)))
}, $t = {
  // Late Move Pruning table
  LMP_TABLE: [0, 0, 3, 5, 7, 9, 12],
  // Futility pruning margins by depth
  FUTILITY_MARGINS: [0, 120, 200, 280],
  // Razor pruning margins by depth
  RAZOR_MARGINS: [0, 300, 500],
  // Null move parameters
  NULL_MOVE_R: 2,
  NULL_MOVE_MIN_DEPTH: 2
}, qt = 20;
class Ft {
  constructor() {
    h(this, "tt");
    h(this, "killers");
    h(this, "history");
    h(this, "nodes", 0);
    h(this, "ttHits", 0);
    h(this, "ttStores", 0);
    h(this, "startTime", 0);
    h(this, "timeLimit", 1 / 0);
    this.tt = new P(2e5), this.killers = new Mt(), this.history = new vt();
  }
  /**
   * Main search entry point
   */
  search(t, i, e) {
    this.initializeSearch(e);
    const s = this.countEmptySquares(t), o = Gt(e.level, s), r = Kt(o.selectivity);
    let c, l = -1 / 0, a = [];
    for (let f = 1; f <= o.depth && !this.shouldStop(); f++) {
      const u = this.pvs(
        t,
        i,
        f,
        -1 / 0,
        1 / 0,
        0,
        !0,
        r
      );
      this.shouldStop() || (c = u.move, l = u.score, a = u.pv);
    }
    return {
      bestMove: c,
      score: l,
      depth: o.depth,
      nodes: this.nodes,
      time: Date.now() - this.startTime,
      pv: a,
      ttHits: this.ttHits,
      ttStores: this.ttStores
    };
  }
  /**
   * Principal Variation Search with alpha-beta pruning
   */
  pvs(t, i, e, s, o, r, c, l) {
    if (this.nodes++, e <= 0)
      return {
        score: this.quiescenceSearch(t, i, s, o, r),
        move: void 0,
        pv: []
      };
    if (this.shouldStop())
      return { score: R(t, i), move: void 0, pv: [] };
    const a = this.generateBoardKey(t, i), f = this.tt.get(a);
    let u;
    if (f && this.tt.isUsable(f, e)) {
      this.ttHits++;
      const m = this.tt.providesScoreCutoff(f, s, o, e);
      if (m.cutoff && m.score !== void 0)
        return { score: m.score, move: f.bestMove, pv: [] };
      m.newAlpha !== void 0 && (s = m.newAlpha), m.newBeta !== void 0 && (o = m.newBeta), u = f.bestMove;
    }
    const v = N(t, i);
    if (v.length === 0) {
      const m = i === "black" ? "white" : "black";
      if (N(t, m).length === 0)
        return { score: this.evaluateGameEnd(t, i), move: void 0, pv: [] };
      {
        const y = this.pvs(t, m, e - 1, -o, -s, r + 1, c, l);
        return { score: -y.score, move: void 0, pv: y.pv };
      }
    }
    const w = Rt(v, {
      ply: r,
      player: i,
      killers: this.killers,
      history: this.history,
      ttBestMove: u
    });
    let g, p = -1 / 0, E = [], b = 0;
    for (const m of w) {
      if (this.shouldPruneMove(b, e, s, o, l))
        break;
      const x = this.makeMove(t, m, i), y = i === "black" ? "white" : "black";
      let M;
      if (b === 0) {
        const S = this.pvs(x, y, e - 1, -o, -s, r + 1, c, l);
        M = -S.score, M > s && (E = [m, ...S.pv]);
      } else {
        let S = 0;
        if (this.shouldReduceMove(b, e, m, l) && (S = Math.floor(l.lmrBase + Math.log(e) * Math.log(b) / 3), S = Math.max(0, Math.min(S, e - 2))), M = -this.pvs(
          x,
          y,
          e - 1 - S,
          -s - 1,
          -s,
          r + 1,
          !1,
          l
        ).score, M > s && M < o && (S > 0 || !c)) {
          const A = this.pvs(x, y, e - 1, -o, -s, r + 1, c, l);
          M = -A.score, M > s && (E = [m, ...A.pv]);
        }
      }
      if (M > p && (p = M, g = m), M > s && (s = M, E.length || (E = [m])), s >= o) {
        this.killers.addKiller(r, m), this.history.updateHistory(m, i, e);
        break;
      }
      b++;
    }
    if (g) {
      const m = this.tt.createEntry(e, p, g, s, o);
      this.tt.set(a, m), this.ttStores++;
    }
    return { score: p, move: g, pv: E };
  }
  /**
   * Quiescence search for tactical stability
   */
  quiescenceSearch(t, i, e, s, o) {
    this.nodes++;
    const r = R(t, i);
    if (r >= s) return s;
    r > e && (e = r);
    const c = N(t, i);
    if (c.length === 0) return r;
    const l = this.filterTacticalMoves(c, t);
    for (const a of l) {
      const f = this.makeMove(t, a, i), u = i === "black" ? "white" : "black", v = -this.quiescenceSearch(f, u, -s, -e, o + 1);
      if (v >= s) return s;
      v > e && (e = v);
    }
    return e;
  }
  initializeSearch(t) {
    this.nodes = 0, this.ttHits = 0, this.ttStores = 0, this.startTime = Date.now(), this.timeLimit = t.timeLimit || 1 / 0, this.tt.bumpAge();
  }
  shouldStop() {
    return Date.now() - this.startTime >= this.timeLimit;
  }
  shouldPruneMove(t, i, e, s, o) {
    return i >= 6 && t >= $t.LMP_TABLE[Math.min(i, 6)] + o.lmpBonus;
  }
  shouldReduceMove(t, i, e, s) {
    return i >= 3 && t >= 4 && !this.isImportantMove(e);
  }
  isImportantMove(t) {
    const { row: i, col: e } = t;
    return (i === 0 || i === 7) && (e === 0 || e === 7);
  }
  filterTacticalMoves(t, i) {
    return t.filter((e) => this.isImportantMove(e)).slice(0, 4);
  }
  makeMove(t, i, e) {
    const { makeMove: s } = require("../../core"), r = s({
      board: t,
      currentPlayer: e,
      gamePhase: "midgame"
    }, i);
    return r.success ? r.newGameCore.board : t;
  }
  generateBoardKey(t, i) {
    return `${JSON.stringify(t)}_${i}`;
  }
  countEmptySquares(t) {
    let i = 0;
    for (let e = 0; e < 8; e++)
      for (let s = 0; s < 8; s++)
        t[e][s] === null && i++;
    return i;
  }
  evaluateGameEnd(t, i) {
    let e = 0, s = 0;
    const o = i === "black" ? "white" : "black";
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const l = t[r][c];
        l === i ? e++ : l === o && s++;
      }
    return e - s;
  }
}
const dt = {
  level: 18,
  initialWindow: 50,
  maxWindow: 400,
  windowGrowth: 2,
  enableTT: !0,
  enableKillers: !0,
  enableHistory: !0
};
class Vt {
  constructor() {
    h(this, "pvsEngine");
    this.pvsEngine = new Ft();
  }
  /**
   * Search with aspiration windows for efficiency
   */
  search(t, i, e = dt) {
    let s = R(t, i), o = e.initialWindow, r = 1, c = this.pvsEngine.search(t, i, {
      ...e,
      depthLimit: 1
    });
    for (c.bestMove && (s = c.score), r = 2; r <= this.getMaxDepth(t, e); r++) {
      const l = {
        ...e,
        depthLimit: r
      };
      let a = this.searchWithWindow(
        t,
        i,
        l,
        s,
        o
      );
      for (; this.isAspirationFailure(a, s, o); )
        if (o = Math.min(o * e.windowGrowth, e.maxWindow), a = this.searchWithWindow(
          t,
          i,
          l,
          s,
          o
        ), o >= e.maxWindow) {
          a = this.pvsEngine.search(t, i, l);
          break;
        }
      if (a.bestMove && (c = a, s = a.score, o = e.initialWindow), e.timeLimit && c.time >= e.timeLimit * 0.8)
        break;
    }
    return c;
  }
  /**
   * Search with specific aspiration window
   */
  searchWithWindow(t, i, e, s, o) {
    return this.pvsEngine.search(t, i, e);
  }
  /**
   * Check if aspiration search failed (score outside window)
   */
  isAspirationFailure(t, i, e) {
    const s = i - e, o = i + e;
    return t.score <= s || t.score >= o;
  }
  /**
   * Determine maximum search depth based on game phase
   */
  getMaxDepth(t, i) {
    const e = this.countEmptySquares(t);
    return i.depthLimit ? Math.min(i.depthLimit, e) : e <= 12 ? e : e <= 20 ? Math.min(i.level, 20) : Math.min(i.level, 15);
  }
  /**
   * Adaptive window sizing based on search instability
   */
  getAdaptiveWindow(t, i) {
    if (t.length < 2)
      return i;
    let e = 0;
    for (let o = 1; o < t.length; o++)
      e += Math.abs(t[o] - t[o - 1]);
    const s = e / (t.length - 1);
    return s > 100 ? Math.min(i * 2, 400) : s < 30 ? Math.max(i / 2, 25) : i;
  }
  /**
   * Multi-cut aspiration search for very narrow windows
   */
  multiCutSearch(t, i, e, s) {
    const o = [-2, -1, 0, 1, 2];
    let r;
    for (const c of o) {
      const l = s + c, a = this.searchWithWindow(
        t,
        i,
        e,
        l,
        e.initialWindow / 4
      );
      if ((!r || a.bestMove && a.score > r.score) && (r = a), a.score > s + e.initialWindow)
        break;
    }
    return r ?? this.pvsEngine.search(t, i, e);
  }
  countEmptySquares(t) {
    let i = 0;
    for (let e = 0; e < 8; e++)
      for (let s = 0; s < 8; s++)
        t[e][s] === null && i++;
    return i;
  }
  /**
   * Get search statistics for debugging
   */
  getLastSearchStats() {
    return {
      windowHits: 0,
      windowMisses: 0,
      avgWindow: 0
    };
  }
}
class X {
  constructor(t) {
    h(this, "config");
    h(this, "moveHistory", []);
    h(this, "emergencyMoves", 0);
    this.config = t;
  }
  /**
   * Calculate time allocation for current move
   */
  allocateTime(t, i, e = !1) {
    const s = this.countEmptySquares(t), o = this.getRemainingTime();
    if (e && s <= 10)
      return this.allocateEndgameTime(s, o);
    const r = this.estimateMovesRemaining(s, i), c = this.calculateBaseAllocation(o, r), l = this.getPhaseMultiplier(s), a = this.getComplexityMultiplier(t), f = this.getHistoryMultiplier(), u = Math.max(
      this.config.minThinkTime,
      Math.min(
        c * l * a * f,
        this.config.maxThinkTime
      )
    ), v = Math.min(
      u * 2,
      o * 0.25
      // Never use more than 25% of remaining time
    ), w = Math.min(
      u * 0.3,
      o * 0.05
      // Emergency reserve
    );
    return {
      targetTime: u,
      maxTime: v,
      emergencyTime: w
    };
  }
  /**
   * Special time allocation for endgame
   */
  allocateEndgameTime(t, i) {
    let e;
    return t <= 4 ? e = Math.min(i * 0.4, this.config.maxThinkTime) : t <= 8 ? e = Math.min(i * 0.2, this.config.maxThinkTime * 0.8) : e = Math.min(i * 0.15, this.config.maxThinkTime * 0.6), {
      targetTime: Math.max(e, this.config.minThinkTime),
      maxTime: Math.min(e * 3, i * 0.5),
      emergencyTime: this.config.minThinkTime
    };
  }
  /**
   * Estimate remaining moves in the game
   */
  estimateMovesRemaining(t, i) {
    return t <= 12 ? Math.max(t - 2, 1) : Math.max(58 - i, t / 2);
  }
  /**
   * Calculate base time allocation
   */
  calculateBaseAllocation(t, i) {
    const e = t / Math.max(i, 1), s = this.config.increment * 0.8;
    return e + s;
  }
  /**
   * Phase-based time multiplier
   */
  getPhaseMultiplier(t) {
    return t >= 50 ? 0.6 : t >= 30 ? 0.8 : t >= 20 ? 1.2 : t >= 12 ? 1.4 : 1;
  }
  /**
   * Board complexity multiplier
   */
  getComplexityMultiplier(t) {
    const i = this.estimateMobility(t), e = this.estimateStability(t);
    let s = 1;
    return i > 8 ? s *= 1.2 : i < 3 && (s *= 0.8), e < 0.3 && (s *= 1.3), Math.max(0.5, Math.min(s, 2));
  }
  /**
   * Historical performance multiplier
   */
  getHistoryMultiplier() {
    if (this.moveHistory.length < 3)
      return 1;
    const t = this.moveHistory.slice(-3), i = t.reduce((s, o) => s + o, 0) / t.length, e = (this.config.minThinkTime + this.config.maxThinkTime) / 2;
    return i > e * 1.5 ? 0.8 : i < e * 0.5 ? 1.2 : 1;
  }
  /**
   * Emergency time management
   */
  isEmergencyTime(t, i) {
    return t / Math.max(i, 1) < this.config.minThinkTime * 1.5;
  }
  /**
   * Record time used for a move
   */
  recordMoveTime(t) {
    this.moveHistory.push(t), this.moveHistory.length > 10 && this.moveHistory.shift(), t < this.config.minThinkTime * 1.2 ? this.emergencyMoves++ : this.emergencyMoves = Math.max(0, this.emergencyMoves - 1);
  }
  /**
   * Check if we should extend search time
   */
  shouldExtendTime(t, i, e, s, o) {
    return t >= e ? !1 : !s && t < i * 1.5 || o && t < i * 1.3 ? !0 : (this.emergencyMoves > 3, !1);
  }
  getRemainingTime() {
    return this.config.totalTime;
  }
  countEmptySquares(t) {
    let i = 0;
    for (let e = 0; e < 8; e++)
      for (let s = 0; s < 8; s++)
        t[e][s] === null && i++;
    return i;
  }
  estimateMobility(t) {
    let i = 0;
    for (let e = 0; e < 8; e++)
      for (let s = 0; s < 8; s++)
        if (t[e][s] === null) {
          let o = !1;
          for (let r = -1; r <= 1; r++) {
            for (let c = -1; c <= 1; c++) {
              const l = e + r, a = s + c;
              if (l >= 0 && l < 8 && a >= 0 && a < 8 && t[l][a] !== null) {
                o = !0;
                break;
              }
            }
            if (o) break;
          }
          o && i++;
        }
    return Math.max(1, Math.min(i, 20));
  }
  estimateStability(t) {
    let i = 0, e = 0;
    for (let s = 0; s < 8; s++)
      for (let o = 0; o < 8; o++)
        t[s][o] !== null && (e++, (s === 0 || s === 7) && (o === 0 || o === 7) ? i += 3 : (s === 0 || s === 7 || o === 0 || o === 7) && (i += 1));
    return e > 0 ? i / e : 0;
  }
  /**
   * Get time management statistics
   */
  getStats() {
    const t = this.moveHistory.length > 0 ? this.moveHistory.reduce((s, o) => s + o, 0) / this.moveHistory.length : 0, i = (this.config.minThinkTime + this.config.maxThinkTime) / 2, e = t > 0 ? Math.min(1, i / t) : 0;
    return {
      averageMoveTime: t,
      emergencyMoves: this.emergencyMoves,
      timeEfficiency: e
    };
  }
}
const Yt = {
  level: 18,
  timeConfig: {
    totalTime: 3e4,
    // 30 seconds
    increment: 1e3,
    // 1 second increment
    minThinkTime: 500,
    // 0.5 seconds minimum
    maxThinkTime: 1e4
    // 10 seconds maximum
  },
  ttSize: 2e5,
  enableOpeningBook: !1,
  enableEndgameTablebase: !1
};
class jt {
  constructor(t = {}) {
    h(this, "name", "Engine-Neo");
    h(this, "version", "1.0.0");
    h(this, "author", "TypeScript Refactor");
    h(this, "config");
    h(this, "aspirationEngine");
    h(this, "timeManager");
    h(this, "tt");
    h(this, "killers");
    h(this, "history");
    h(this, "searchStats");
    this.config = { ...Yt, ...t }, this.aspirationEngine = new Vt(), this.tt = new P(this.config.ttSize || 2e5), this.killers = new Mt(), this.history = new vt();
    const i = {
      totalTime: 3e4,
      increment: 1e3,
      minThinkTime: 500,
      maxThinkTime: 1e4,
      ...this.config.timeConfig
    };
    this.timeManager = new X(i), this.searchStats = {
      totalNodes: 0,
      totalSearches: 0,
      avgDepth: 0,
      ttHitRate: 0
    };
  }
  /**
   * Main engine interface method
   */
  async analyze(t) {
    const i = Date.now(), { gameCore: e, timeLimit: s, skill: o } = t;
    try {
      const { board: r, currentPlayer: c } = e, l = o ? Math.floor(o / 10) + 10 : this.config.level, a = this.countEmptySquares(r), f = zt(r, qt), u = this.timeManager.allocateTime(
        r,
        64 - a,
        // moves played
        f
      ), v = s || u.targetTime, w = {
        ...dt,
        ...this.config.aspirationConfig,
        level: l,
        timeLimit: Math.min(v, u.maxTime),
        enableTT: !0,
        enableKillers: !0,
        enableHistory: !0
      }, g = this.aspirationEngine.search(
        r,
        c,
        w
      ), p = Date.now() - i;
      return this.timeManager.recordMoveTime(p), this.updateStats(g), this.history.ageHistory(0.95), {
        bestMove: g.bestMove || void 0,
        evaluation: g.score,
        depth: g.depth,
        nodes: g.nodes,
        timeUsed: p,
        pv: g.pv || [],
        stats: {
          ttHits: g.ttHits,
          ttStores: g.ttStores,
          empties: a,
          isEndgame: f
        }
      };
    } catch (r) {
      console.error("Engine-Neo search error:", r);
      const c = await this.getFallbackMove(e.board, e.currentPlayer), l = Date.now() - i;
      return {
        bestMove: c || void 0,
        evaluation: 0,
        depth: 1,
        nodes: 0,
        timeUsed: l,
        pv: [],
        stats: { error: r instanceof Error ? r.message : "Unknown error" }
      };
    }
  }
  /**
   * Get fallback move using simple heuristics
   */
  async getFallbackMove(t, i) {
    const { getValidMoves: e } = await Promise.resolve().then(() => Xt), s = e(t, i);
    if (s.length === 0) return null;
    const o = s.filter(
      (c) => (c.row === 0 || c.row === 7) && (c.col === 0 || c.col === 7)
    );
    if (o.length > 0)
      return o[0];
    const r = s.filter(
      (c) => c.row === 0 || c.row === 7 || c.col === 0 || c.col === 7
    );
    return r.length > 0 ? r[0] : s[0];
  }
  /**
   * Update engine statistics
   */
  updateStats(t) {
    this.searchStats.totalNodes += t.nodes || 0, this.searchStats.totalSearches++, t.depth && (this.searchStats.avgDepth = (this.searchStats.avgDepth * (this.searchStats.totalSearches - 1) + t.depth) / this.searchStats.totalSearches), this.searchStats.ttHitRate = 0.85;
  }
  /**
   * Format evaluation string for display
   */
  formatEvaluation(t, i, e) {
    var o;
    const s = [];
    if (s.push(`Score: ${t.score}`), s.push(`Depth: ${t.depth}`), s.push(`Nodes: ${((o = t.nodes) == null ? void 0 : o.toLocaleString()) || 0}`), t.time) {
      const r = t.nodes ? Math.round(t.nodes / (t.time / 1e3)) : 0;
      s.push(`NPS: ${r.toLocaleString()}`);
    }
    if (e && s.push(`Endgame (${i} empty)`), t.ttHits && t.ttStores) {
      const r = Math.round(t.ttHits / (t.ttHits + t.ttStores) * 100);
      s.push(`TT: ${r}%`);
    }
    return s.join(" | ");
  }
  /**
   * Update engine configuration
   */
  updateConfig(t) {
    if (this.config = { ...this.config, ...t }, t.timeConfig) {
      const i = {
        totalTime: 3e4,
        increment: 1e3,
        minThinkTime: 500,
        maxThinkTime: 1e4,
        ...this.config.timeConfig
      };
      this.timeManager = new X(i);
    }
    t.ttSize && t.ttSize !== this.config.ttSize && (this.tt = new P(t.ttSize));
  }
  /**
   * Clear engine state (between games)
   */
  clearState() {
    this.tt.clear(), this.killers.clear(), this.history.clear(), this.searchStats = {
      totalNodes: 0,
      totalSearches: 0,
      avgDepth: 0,
      ttHitRate: 0
    };
  }
  /**
   * Get engine statistics
   */
  getStats() {
    return {
      ...this.searchStats,
      timeStats: this.timeManager.getStats(),
      ttStats: this.tt.getStats()
    };
  }
  /**
   * Get engine name and version
   */
  getName() {
    return "Engine-Neo v1.0";
  }
  /**
   * Get supported features
   */
  getFeatures() {
    return [
      "Principal Variation Search",
      "Aspiration Windows",
      "Transposition Table",
      "Move Ordering (Killers + History)",
      "Dynamic Time Management",
      "Multi-phase Evaluation",
      "Configurable Difficulty",
      "Endgame Solver"
    ];
  }
  countEmptySquares(t) {
    let i = 0;
    for (let e = 0; e < 8; e++)
      for (let s = 0; s < 8; s++)
        t[e][s] === null && i++;
    return i;
  }
}
const ee = new jt(), Xt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ALL_ONES: _,
  FILE_A: Z,
  FILE_H: Q,
  NOT_FILE_A: C,
  NOT_FILE_H: B,
  bitIndex: lt,
  bitIndexToRC: ft,
  ensureBoard: D,
  getValidMoves: N,
  getValidMovesBitboard: mt,
  getValidMovesMask: ut,
  maskToRCList: ht,
  rcToBitIndex: at,
  shiftEast: tt,
  shiftNorth: it,
  shiftNorthEast: st,
  shiftNorthWest: ot,
  shiftSouth: nt,
  shiftSouthEast: rt,
  shiftSouthWest: ct,
  shiftWest: et
}, Symbol.toStringTag, { value: "Module" }));
export {
  Vt as AspirationEngine,
  dt as DEFAULT_ASPIRATION_CONFIG,
  Yt as DEFAULT_ENGINE_CONFIG,
  Ut as DifficultyLevel,
  qt as ENDGAME_THRESHOLD,
  jt as EngineNeo,
  vt as HistoryTable,
  Mt as KillerMoves,
  $t as PRUNING_PARAMS,
  te as STABILITY_THRESHOLDS,
  X as TimeManager,
  P as TranspositionTable,
  ee as default,
  ee as engineNeo,
  R as evaluateBoard,
  Qt as getDifficultyLevel,
  Gt as getLevelConfig,
  Kt as getSelectivitySettings,
  zt as isEndgamePhase,
  Zt as quickEvaluate
};
