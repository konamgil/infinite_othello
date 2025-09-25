var q = Object.defineProperty;
var V = (a, e, t) => e in a ? q(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t;
var f = (a, e, t) => V(a, typeof e != "symbol" ? e + "" : e, t);
class E {
  constructor() {
    f(this, "weights");
    f(this, "phaseWeights");
    this.weights = this.getDefaultWeights(), this.phaseWeights = this.initializePhaseWeights();
  }
  /**
   * Main evaluation function
   */
  evaluateBoard(e, t, n, s) {
    const i = t === "black" ? "white" : "black", r = this.phaseWeights.get(n) || this.weights;
    let o = 0, c = 0, l = 0, u = 0;
    const h = this.evaluateMaterial(e, t, i);
    o += h * r.material;
    const g = this.evaluatePosition(e, t, i);
    o += g * r.position;
    const p = this.evaluateMobility(e, t, i);
    o += p * r.mobility;
    const y = this.evaluateFrontier(e, t, i);
    o += y * r.frontier;
    const S = this.evaluateStability(e, t, i);
    o += S * r.stability;
    const m = this.evaluateCorners(e, t, i);
    o += m * r.corner;
    const b = this.evaluateEdges(e, t, i);
    o += b * r.edge;
    const k = this.evaluateCenter(e, t, i);
    o += k * r.center;
    const D = this.evaluateSafety(e, t, i);
    o += D * r.safety;
    const z = this.evaluateStrategic(e, t, s);
    return o += z * r.strategic, c = this.calculateConfidence(e, t, n), l = this.calculateDepth(n), u = this.calculateNodes(n), {
      score: o,
      depth: l,
      nodes: u,
      confidence: c,
      pv: this.calculatePV(e, t)
    };
  }
  /**
   * Evaluate material count
   */
  evaluateMaterial(e, t, n) {
    let s = 0, i = 0;
    for (let r = 0; r < 8; r++)
      for (let o = 0; o < 8; o++)
        e[r][o] === t ? s++ : e[r][o] === n && i++;
    return s - i;
  }
  /**
   * Evaluate positional value
   */
  evaluatePosition(e, t, n) {
    const s = [
      [120, -20, 20, 5, 5, 20, -20, 120],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [20, -5, 15, 3, 3, 15, -5, 20],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [20, -5, 15, 3, 3, 15, -5, 20],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [120, -20, 20, 5, 5, 20, -20, 120]
    ];
    let i = 0;
    for (let r = 0; r < 8; r++)
      for (let o = 0; o < 8; o++)
        e[r][o] === t ? i += s[r][o] : e[r][o] === n && (i -= s[r][o]);
    return i;
  }
  /**
   * Evaluate mobility
   */
  evaluateMobility(e, t, n) {
    const s = this.countValidMoves(e, t), i = this.countValidMoves(e, n);
    return s - i;
  }
  /**
   * Evaluate frontier discs
   */
  evaluateFrontier(e, t, n) {
    const s = this.countFrontierDiscs(e, t);
    return this.countFrontierDiscs(e, n) - s;
  }
  /**
   * Evaluate stability
   */
  evaluateStability(e, t, n) {
    const s = this.countStableDiscs(e, t), i = this.countStableDiscs(e, n);
    return s - i;
  }
  /**
   * Evaluate corners
   */
  evaluateCorners(e, t, n) {
    const s = [[0, 0], [0, 7], [7, 0], [7, 7]];
    let i = 0;
    for (const [r, o] of s)
      e[r][o] === t ? i += 100 : e[r][o] === n && (i -= 100);
    return i;
  }
  /**
   * Evaluate edges
   */
  evaluateEdges(e, t, n) {
    let s = 0;
    for (let i = 0; i < 8; i++)
      e[0][i] === t ? s += 10 : e[0][i] === n && (s -= 10), e[7][i] === t ? s += 10 : e[7][i] === n && (s -= 10);
    for (let i = 0; i < 8; i++)
      e[i][0] === t ? s += 10 : e[i][0] === n && (s -= 10), e[i][7] === t ? s += 10 : e[i][7] === n && (s -= 10);
    return s;
  }
  /**
   * Evaluate center control
   */
  evaluateCenter(e, t, n) {
    const s = [[3, 3], [3, 4], [4, 3], [4, 4]];
    let i = 0;
    for (const [r, o] of s)
      e[r][o] === t ? i += 20 : e[r][o] === n && (i -= 20);
    return i;
  }
  /**
   * Evaluate safety
   */
  evaluateSafety(e, t, n) {
    let s = 0;
    const i = [[1, 1], [1, 6], [6, 1], [6, 6]];
    for (const [r, o] of i)
      if (e[r][o] === t) {
        const c = r === 1 ? 0 : 7, l = o === 1 ? 0 : 7;
        e[c][l] === null && (s -= 50);
      }
    return s;
  }
  /**
   * Evaluate strategic factors
   */
  evaluateStrategic(e, t, n) {
    return n.mobility * 0.3 + n.frontier * 0.2 + n.stability * 0.2 + n.cornerControl * 0.15 + n.edgeControl * 0.1 + n.centerControl * 0.05;
  }
  /**
   * Count valid moves
   */
  countValidMoves(e, t) {
    let n = 0;
    for (let s = 0; s < 8; s++)
      for (let i = 0; i < 8; i++)
        e[s][i] === null && this.isValidMove(e, { row: s, col: i }, t) && n++;
    return n;
  }
  /**
   * Check if move is valid (simplified)
   */
  isValidMove(e, t, n) {
    return !0;
  }
  /**
   * Count frontier discs
   */
  countFrontierDiscs(e, t) {
    let n = 0;
    const s = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1]
    ];
    for (let i = 0; i < 8; i++)
      for (let r = 0; r < 8; r++)
        if (e[i][r] === t) {
          let o = !1;
          for (const [c, l] of s) {
            const u = i + c, h = r + l;
            if (u >= 0 && u < 8 && h >= 0 && h < 8 && e[u][h] === null) {
              o = !0;
              break;
            }
          }
          o && n++;
        }
    return n;
  }
  /**
   * Count stable discs
   */
  countStableDiscs(e, t) {
    let n = 0;
    const s = [[0, 0], [0, 7], [7, 0], [7, 7]];
    for (const [i, r] of s)
      e[i][r] === t && n++;
    for (let i = 0; i < 8; i++)
      e[0][i] === t && (n += 0.5), e[7][i] === t && (n += 0.5);
    for (let i = 0; i < 8; i++)
      e[i][0] === t && (n += 0.5), e[i][7] === t && (n += 0.5);
    return Math.floor(n);
  }
  /**
   * Calculate confidence
   */
  calculateConfidence(e, t, n) {
    let s = 50;
    switch (n) {
      case "opening":
        s += 20;
        break;
      case "midgame":
        s += 30;
        break;
      case "late_midgame":
        s += 40;
        break;
      case "endgame":
        s += 50;
        break;
    }
    const i = this.countCorners(e, t);
    return s += i * 10, Math.min(100, s);
  }
  /**
   * Count corners controlled
   */
  countCorners(e, t) {
    const n = [[0, 0], [0, 7], [7, 0], [7, 7]];
    let s = 0;
    for (const [i, r] of n)
      e[i][r] === t && s++;
    return s;
  }
  /**
   * Calculate depth
   */
  calculateDepth(e) {
    switch (e) {
      case "opening":
        return 8;
      case "midgame":
        return 12;
      case "late_midgame":
        return 16;
      case "endgame":
        return 20;
      default:
        return 10;
    }
  }
  /**
   * Calculate nodes
   */
  calculateNodes(e) {
    switch (e) {
      case "opening":
        return 1e4;
      case "midgame":
        return 5e4;
      case "late_midgame":
        return 1e5;
      case "endgame":
        return 2e5;
      default:
        return 25e3;
    }
  }
  /**
   * Calculate principal variation
   */
  calculatePV(e, t) {
    return [];
  }
  /**
   * Get default weights
   */
  getDefaultWeights() {
    return {
      material: 1,
      position: 1,
      mobility: 1,
      frontier: 1,
      stability: 1,
      corner: 1,
      edge: 1,
      center: 1,
      safety: 1,
      strategic: 1
    };
  }
  /**
   * Initialize phase-specific weights
   */
  initializePhaseWeights() {
    const e = /* @__PURE__ */ new Map();
    return e.set("opening", {
      material: 0.1,
      position: 1,
      mobility: 1.5,
      frontier: 0.8,
      stability: 0.3,
      corner: 2,
      edge: 0.5,
      center: 1.2,
      safety: 1.5,
      strategic: 1
    }), e.set("midgame", {
      material: 0.3,
      position: 1,
      mobility: 1.2,
      frontier: 1,
      stability: 0.8,
      corner: 1.5,
      edge: 0.8,
      center: 1,
      safety: 1.2,
      strategic: 1
    }), e.set("late_midgame", {
      material: 0.5,
      position: 1,
      mobility: 1,
      frontier: 1.2,
      stability: 1.2,
      corner: 1.8,
      edge: 1,
      center: 0.8,
      safety: 1,
      strategic: 1
    }), e.set("endgame", {
      material: 2,
      position: 0.5,
      mobility: 0.3,
      frontier: 0.5,
      stability: 1.5,
      corner: 2,
      edge: 1.2,
      center: 0.5,
      safety: 0.8,
      strategic: 1
    }), e;
  }
}
class _ {
  constructor() {
    f(this, "gamePhase");
    f(this, "opponentProfile");
    this.gamePhase = "opening", this.opponentProfile = null;
  }
  /**
   * Analyze board position strategically
   */
  analyzePosition(e, t, n, s) {
    this.gamePhase = n, this.opponentProfile = s;
    const i = {
      mobility: this.analyzeMobility(e, t),
      frontier: this.analyzeFrontier(e, t),
      stability: this.analyzeStability(e, t),
      cornerControl: this.analyzeCornerControl(e, t),
      edgeControl: this.analyzeEdgeControl(e, t),
      centerControl: this.analyzeCenterControl(e, t),
      safety: this.analyzeSafety(e, t),
      summary: "",
      getMoveValue: (r) => this.getMoveValue(r, e, t)
    };
    return i.summary = this.generateSummary(i), i;
  }
  /**
   * Analyze mobility
   */
  analyzeMobility(e, t) {
    const n = this.countValidMoves(e, t), s = this.countValidMoves(e, this.getOpponent(t)), i = n + s;
    return i === 0 ? 0 : (n - s) / i * 100;
  }
  /**
   * Analyze frontier
   */
  analyzeFrontier(e, t) {
    const n = this.countFrontierDiscs(e, t), s = this.countFrontierDiscs(e, this.getOpponent(t)), i = n + s;
    return i === 0 ? 0 : (s - n) / i * 100;
  }
  /**
   * Analyze stability
   */
  analyzeStability(e, t) {
    const n = this.countStableDiscs(e, t), s = this.countStableDiscs(e, this.getOpponent(t)), i = n + s;
    return i === 0 ? 0 : (n - s) / i * 100;
  }
  /**
   * Analyze corner control
   */
  analyzeCornerControl(e, t) {
    const n = [[0, 0], [0, 7], [7, 0], [7, 7]];
    let s = 0, i = 0;
    for (const [o, c] of n)
      e[o][c] === t ? s++ : e[o][c] === this.getOpponent(t) && i++;
    const r = s + i;
    return r === 0 ? 0 : (s - i) / r * 100;
  }
  /**
   * Analyze edge control
   */
  analyzeEdgeControl(e, t) {
    let n = 0, s = 0;
    for (let r = 0; r < 8; r++)
      e[0][r] === t ? n++ : e[0][r] === this.getOpponent(t) && s++, e[7][r] === t ? n++ : e[7][r] === this.getOpponent(t) && s++;
    for (let r = 0; r < 8; r++)
      e[r][0] === t ? n++ : e[r][0] === this.getOpponent(t) && s++, e[r][7] === t ? n++ : e[r][7] === this.getOpponent(t) && s++;
    const i = n + s;
    return i === 0 ? 0 : (n - s) / i * 100;
  }
  /**
   * Analyze center control
   */
  analyzeCenterControl(e, t) {
    const n = [[3, 3], [3, 4], [4, 3], [4, 4]];
    let s = 0, i = 0;
    for (const [o, c] of n)
      e[o][c] === t ? s++ : e[o][c] === this.getOpponent(t) && i++;
    const r = s + i;
    return r === 0 ? 0 : (s - i) / r * 100;
  }
  /**
   * Analyze safety
   */
  analyzeSafety(e, t) {
    let n = 0;
    const s = this.getDangerousSquares(e, t);
    n -= s.length * 20;
    const i = this.getSafeSquares(e, t);
    return n += i.length * 10, Math.max(-100, Math.min(100, n));
  }
  /**
   * Get move value based on strategic analysis
   */
  getMoveValue(e, t, n) {
    let s = 0;
    return this.isCorner(e) && (s += 100), this.isEdge(e) && (s += 20), this.isCenter(e) && (s += 15), this.isSafeMove(e, t, n) ? s += 30 : this.isDangerousMove(e, t, n) && (s -= 50), s += this.getPhaseValue(e, t, n), this.opponentProfile && (s += this.getOpponentSpecificValue(e, t, n)), s;
  }
  /**
   * Check if move is corner
   */
  isCorner(e) {
    const { row: t, col: n } = e;
    return (t === 0 || t === 7) && (n === 0 || n === 7);
  }
  /**
   * Check if move is edge
   */
  isEdge(e) {
    const { row: t, col: n } = e;
    return t === 0 || t === 7 || n === 0 || n === 7;
  }
  /**
   * Check if move is center
   */
  isCenter(e) {
    const { row: t, col: n } = e;
    return t >= 3 && t <= 4 && n >= 3 && n <= 4;
  }
  /**
   * Check if move is safe
   */
  isSafeMove(e, t, n) {
    return this.isDangerousSquare(e, t) ? !1 : this.isCorner(e) ? !0 : this.isEdge(e) ? this.isEdgeSafe(e, t) : !0;
  }
  /**
   * Check if move is dangerous
   */
  isDangerousMove(e, t, n) {
    return this.isDangerousSquare(e, t);
  }
  /**
   * Check if square is dangerous
   */
  isDangerousSquare(e, t) {
    const { row: n, col: s } = e, i = [[1, 1], [1, 6], [6, 1], [6, 6]];
    for (const [o, c] of i)
      if (n === o && s === c) {
        const l = o === 1 ? 0 : 7, u = c === 1 ? 0 : 7;
        if (t[l][u] === null)
          return !0;
      }
    const r = [
      [[0, 1], [1, 0]],
      [[0, 6], [1, 7]],
      [[6, 0], [7, 1]],
      [[6, 7], [7, 6]]
    ];
    for (let o = 0; o < 4; o++) {
      const l = [[0, 0], [0, 7], [7, 0], [7, 7]][o], u = r[o];
      if (t[l[0]][l[1]] === null) {
        for (const [h, g] of u)
          if (n === h && s === g)
            return !0;
      }
    }
    return !1;
  }
  /**
   * Check if edge move is safe
   */
  isEdgeSafe(e, t) {
    const { row: n, col: s } = e, i = [];
    n === 0 && (s === 1 && i.push([0, 0]), s === 6 && i.push([0, 7])), n === 7 && (s === 1 && i.push([7, 0]), s === 6 && i.push([7, 7])), s === 0 && (n === 1 && i.push([0, 0]), n === 6 && i.push([7, 0])), s === 7 && (n === 1 && i.push([0, 7]), n === 6 && i.push([7, 7]));
    for (const [r, o] of i)
      if (t[r][o] === null)
        return !1;
    return !0;
  }
  /**
   * Get phase-specific value
   */
  getPhaseValue(e, t, n) {
    switch (this.gamePhase) {
      case "opening":
        return this.getMobilityValue(e, t, n) * 0.5 + this.getPositionValue(e) * 0.5;
      case "midgame":
        return this.getMobilityValue(e, t, n) * 0.3 + this.getPositionValue(e) * 0.3 + this.getStabilityValue(e, t, n) * 0.4;
      case "late_midgame":
        return this.getStabilityValue(e, t, n) * 0.4 + this.getCornerValue(e) * 0.6;
      case "endgame":
        return this.getMaterialValue(e, t, n) * 0.6 + this.getStabilityValue(e, t, n) * 0.4;
      default:
        return 0;
    }
  }
  /**
   * Get opponent-specific value
   */
  getOpponentSpecificValue(e, t, n) {
    if (!this.opponentProfile) return 0;
    let s = 0;
    switch (this.opponentProfile.style) {
      case "aggressive":
        s += this.getStabilityValue(e, t, n) * 0.3;
        break;
      case "defensive":
        s += this.getMobilityValue(e, t, n) * 0.3;
        break;
      case "balanced":
        s += (this.getMobilityValue(e, t, n) + this.getStabilityValue(e, t, n)) * 0.15;
        break;
    }
    return s;
  }
  /**
   * Get mobility value
   */
  getMobilityValue(e, t, n) {
    return 10;
  }
  /**
   * Get position value
   */
  getPositionValue(e) {
    const { row: t, col: n } = e;
    return [
      [120, -20, 20, 5, 5, 20, -20, 120],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [20, -5, 15, 3, 3, 15, -5, 20],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [20, -5, 15, 3, 3, 15, -5, 20],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [120, -20, 20, 5, 5, 20, -20, 120]
    ][t][n];
  }
  /**
   * Get stability value
   */
  getStabilityValue(e, t, n) {
    return this.isCorner(e) ? 100 : this.isEdge(e) && this.isEdgeSafe(e, t) ? 50 : 0;
  }
  /**
   * Get corner value
   */
  getCornerValue(e) {
    return this.isCorner(e) ? 100 : 0;
  }
  /**
   * Get material value
   */
  getMaterialValue(e, t, n) {
    return 10;
  }
  /**
   * Generate strategic summary
   */
  generateSummary(e) {
    const t = [];
    return e.mobility > 20 ? t.push("Strong mobility advantage") : e.mobility < -20 && t.push("Mobility disadvantage"), e.cornerControl > 50 ? t.push("Corner control") : e.cornerControl < -50 && t.push("Corner disadvantage"), e.stability > 30 ? t.push("Stable position") : e.stability < -30 && t.push("Unstable position"), e.safety > 20 ? t.push("Safe position") : e.safety < -20 && t.push("Dangerous position"), t.length > 0 ? t.join(", ") : "Balanced position";
  }
  /**
   * Count valid moves
   */
  countValidMoves(e, t) {
    let n = 0;
    for (let s = 0; s < 8; s++)
      for (let i = 0; i < 8; i++)
        e[s][i] === null && n++;
    return n;
  }
  /**
   * Count frontier discs
   */
  countFrontierDiscs(e, t) {
    let n = 0;
    const s = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1]
    ];
    for (let i = 0; i < 8; i++)
      for (let r = 0; r < 8; r++)
        if (e[i][r] === t) {
          let o = !1;
          for (const [c, l] of s) {
            const u = i + c, h = r + l;
            if (u >= 0 && u < 8 && h >= 0 && h < 8 && e[u][h] === null) {
              o = !0;
              break;
            }
          }
          o && n++;
        }
    return n;
  }
  /**
   * Count stable discs
   */
  countStableDiscs(e, t) {
    let n = 0;
    const s = [[0, 0], [0, 7], [7, 0], [7, 7]];
    for (const [i, r] of s)
      e[i][r] === t && n++;
    for (let i = 0; i < 8; i++)
      e[0][i] === t && (n += 0.5), e[7][i] === t && (n += 0.5);
    for (let i = 0; i < 8; i++)
      e[i][0] === t && (n += 0.5), e[i][7] === t && (n += 0.5);
    return Math.floor(n);
  }
  /**
   * Get dangerous squares
   */
  getDangerousSquares(e, t) {
    const n = [], s = [[1, 1], [1, 6], [6, 1], [6, 6]];
    for (const [i, r] of s)
      if (e[i][r] === t) {
        const o = i === 1 ? 0 : 7, c = r === 1 ? 0 : 7;
        e[o][c] === null && n.push({ row: i, col: r });
      }
    return n;
  }
  /**
   * Get safe squares
   */
  getSafeSquares(e, t) {
    const n = [], s = [[0, 0], [0, 7], [7, 0], [7, 7]];
    for (const [i, r] of s)
      e[i][r] === t && n.push({ row: i, col: r });
    return n;
  }
  /**
   * Get opponent
   */
  getOpponent(e) {
    return e === "black" ? "white" : "black";
  }
}
class x {
  constructor() {
    f(this, "analysisHistory", []);
    f(this, "patternDatabase", /* @__PURE__ */ new Map());
    this.initializePatternDatabase();
  }
  /**
   * Analyze opponent based on game history and moves
   */
  analyzeOpponent(e, t) {
    const n = this.analyzeMovePatterns(t), s = this.analyzeStrategicPreferences(t), i = this.analyzeWeaknesses(t, e), r = this.determinePlayingStyle(n, s), o = {
      style: r,
      preferences: s,
      weaknesses: i,
      summary: this.generateProfileSummary(r, s, i)
    };
    return this.storeAnalysis(o, t), o;
  }
  /**
   * Analyze move patterns
   */
  analyzeMovePatterns(e) {
    const t = {
      cornerPreference: 0,
      edgePreference: 0,
      centerPreference: 0,
      mobilityStyle: 0,
      riskTolerance: 0,
      consistency: 0
    };
    if (e.length === 0) return t;
    const n = e.filter((r) => this.isCorner(r));
    t.cornerPreference = n.length / e.length;
    const s = e.filter((r) => this.isEdge(r));
    t.edgePreference = s.length / e.length;
    const i = e.filter((r) => this.isCenter(r));
    return t.centerPreference = i.length / e.length, t.mobilityStyle = this.analyzeMobilityStyle(e), t.riskTolerance = this.analyzeRiskTolerance(e), t.consistency = this.analyzeConsistency(e), t;
  }
  /**
   * Analyze strategic preferences
   */
  analyzeStrategicPreferences(e) {
    const t = [];
    return e.filter((r) => this.isCorner(r)).length / e.length > 0.3 && t.push("corner_control"), e.filter((r) => this.isEdge(r)).length / e.length > 0.4 && t.push("edge_control"), e.filter((r) => this.isCenter(r)).length / e.length > 0.2 && t.push("center_control"), this.analyzeMobilityStyle(e) > 0.5 && t.push("mobility_focus"), this.analyzeStabilityPreference(e) > 0.5 && t.push("stability_focus"), t;
  }
  /**
   * Analyze weaknesses
   */
  analyzeWeaknesses(e, t) {
    const n = [];
    return e.filter((r) => this.isXSquare(r)).length > 0 && n.push("x_square_mistakes"), e.filter((r) => this.isCSquare(r)).length > 0 && n.push("c_square_mistakes"), this.analyzeMobilityMistakes(e) > 0.3 && n.push("mobility_mistakes"), this.analyzeTimingMistakes(e, t) > 0.3 && n.push("timing_mistakes"), this.analyzeEndgameMistakes(e, t) > 0.3 && n.push("endgame_mistakes"), n;
  }
  /**
   * Determine playing style
   */
  determinePlayingStyle(e, t) {
    let n = 0, s = 0;
    return e.cornerPreference > 0.4 && (n += 2), e.riskTolerance > 0.6 && (n += 2), t.includes("mobility_focus") && (n += 1), e.consistency < 0.5 && (n += 1), e.edgePreference > 0.5 && (s += 2), e.riskTolerance < 0.4 && (s += 2), t.includes("stability_focus") && (s += 1), e.consistency > 0.7 && (s += 1), n > s + 1 ? "aggressive" : s > n + 1 ? "defensive" : "balanced";
  }
  /**
   * Generate profile summary
   */
  generateProfileSummary(e, t, n) {
    const s = [];
    switch (e) {
      case "aggressive":
        s.push("Aggressive player");
        break;
      case "defensive":
        s.push("Defensive player");
        break;
      case "balanced":
        s.push("Balanced player");
        break;
    }
    return t.length > 0 && s.push(`Prefers: ${t.join(", ")}`), n.length > 0 && s.push(`Weaknesses: ${n.join(", ")}`), s.join(" | ");
  }
  /**
   * Store analysis for learning
   */
  storeAnalysis(e, t) {
    const n = {
      timestamp: Date.now(),
      profile: e,
      moves: [...t],
      patterns: this.extractPatterns(t)
    };
    this.analysisHistory.push(n), this.analysisHistory.length > 100 && this.analysisHistory.shift();
  }
  /**
   * Extract patterns from moves
   */
  extractPatterns(e) {
    const t = [];
    return e.some((n) => this.isCorner(n)) && t.push("corner_play"), e.some((n) => this.isEdge(n)) && t.push("edge_play"), e.some((n) => this.isCenter(n)) && t.push("center_play"), e.some((n) => this.isXSquare(n)) && t.push("x_square_play"), e.some((n) => this.isCSquare(n)) && t.push("c_square_play"), t;
  }
  /**
   * Check if move is corner
   */
  isCorner(e) {
    const { row: t, col: n } = e;
    return (t === 0 || t === 7) && (n === 0 || n === 7);
  }
  /**
   * Check if move is edge
   */
  isEdge(e) {
    const { row: t, col: n } = e;
    return t === 0 || t === 7 || n === 0 || n === 7;
  }
  /**
   * Check if move is center
   */
  isCenter(e) {
    const { row: t, col: n } = e;
    return t >= 3 && t <= 4 && n >= 3 && n <= 4;
  }
  /**
   * Check if move is X-square
   */
  isXSquare(e) {
    const { row: t, col: n } = e;
    return [[1, 1], [1, 6], [6, 1], [6, 6]].some(([i, r]) => t === i && n === r);
  }
  /**
   * Check if move is C-square
   */
  isCSquare(e) {
    const { row: t, col: n } = e;
    return [
      [0, 1],
      [1, 0],
      [0, 6],
      [1, 7],
      [6, 0],
      [7, 1],
      [6, 7],
      [7, 6]
    ].some(([i, r]) => t === i && n === r);
  }
  /**
   * Analyze mobility style
   */
  analyzeMobilityStyle(e) {
    return Math.random() * 0.5 + 0.25;
  }
  /**
   * Analyze risk tolerance
   */
  analyzeRiskTolerance(e) {
    let t = 0;
    const n = e.filter((r) => this.isXSquare(r));
    t += n.length * 0.3;
    const s = e.filter((r) => this.isCSquare(r));
    t += s.length * 0.2;
    const i = e.filter((r) => this.isCorner(r));
    return t -= i.length * 0.1, Math.max(0, Math.min(1, t / e.length));
  }
  /**
   * Analyze consistency
   */
  analyzeConsistency(e) {
    if (e.length < 3) return 1;
    const t = this.extractPatterns(e);
    return 1 - new Set(t).size / t.length;
  }
  /**
   * Analyze stability preference
   */
  analyzeStabilityPreference(e) {
    return e.filter(
      (n) => this.isCorner(n) || this.isEdge(n) && this.isEdgeSafe(n)
    ).length / e.length;
  }
  /**
   * Check if edge move is safe
   */
  isEdgeSafe(e) {
    return !0;
  }
  /**
   * Analyze mobility mistakes
   */
  analyzeMobilityMistakes(e) {
    return Math.random() * 0.5;
  }
  /**
   * Analyze timing mistakes
   */
  analyzeTimingMistakes(e, t) {
    return Math.random() * 0.5;
  }
  /**
   * Analyze endgame mistakes
   */
  analyzeEndgameMistakes(e, t) {
    return Math.random() * 0.5;
  }
  /**
   * Initialize pattern database
   */
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
  /**
   * Get analysis statistics
   */
  getAnalysisStats() {
    return {
      totalAnalyses: this.analysisHistory.length,
      uniqueOpponents: new Set(this.analysisHistory.map((e) => e.profile.style)).size,
      averageMoves: this.analysisHistory.reduce((e, t) => e + t.moves.length, 0) / this.analysisHistory.length,
      patternCount: this.patternDatabase.size
    };
  }
}
class H {
  constructor() {
    f(this, "scenarioCache", /* @__PURE__ */ new Map());
    f(this, "predictionHistory", []);
    this.initializePredictionModels();
  }
  /**
   * Analyze future scenarios
   */
  analyzeFutureScenarios(e, t, n) {
    const s = [], i = [], r = [], o = this.generateScenarios(e, t, n);
    for (const l of o) {
      const u = this.calculateScenarioProbability(l, e, t);
      s.push(l.board), i.push(u);
    }
    for (const l of o) {
      const u = this.findBestPath(l, t);
      r.push(u);
    }
    const c = {
      scenarios: s,
      probabilities: i,
      bestPaths: r,
      summary: this.generateSummary(s, i, r),
      getMoveValue: (l) => this.getMoveValue(l, s, i, r)
    };
    return this.storePrediction(c, e, t), c;
  }
  /**
   * Generate possible scenarios
   */
  generateScenarios(e, t, n) {
    const s = [], i = this.generateCacheKey(e, t, n);
    if (this.scenarioCache.has(i))
      return [this.scenarioCache.get(i)];
    for (let r = 0; r < 10; r++) {
      const o = this.simulateGame(e, t, n);
      s.push(o);
    }
    return this.scenarioCache.set(i, s[0]), s;
  }
  /**
   * Simulate game from current position
   */
  simulateGame(e, t, n) {
    let s = this.copyBoard(e), i = t, r = [], o = 0;
    for (let c = 0; c < n; c++) {
      const l = this.getValidMoves(s, i);
      if (l.length === 0)
        break;
      const u = this.selectMove(s, i, l);
      r.push(u), s = this.makeMove(s, u, i), i = this.getOpponent(i), o += this.calculatePositionScore(s, t);
    }
    return {
      board: s,
      moves: r,
      score: o,
      depth: r.length,
      probability: 1
    };
  }
  /**
   * Calculate scenario probability
   */
  calculateScenarioProbability(e, t, n) {
    let s = 1;
    for (const r of e.moves) {
      const o = this.assessMoveQuality(r, t, n);
      s *= o;
    }
    const i = this.calculateBoardSimilarity(t, e.board);
    return s *= i, Math.max(0.1, Math.min(1, s));
  }
  /**
   * Find best path for scenario
   */
  findBestPath(e, t) {
    return e.moves;
  }
  /**
   * Get move value based on predictive analysis
   */
  getMoveValue(e, t, n, s) {
    let i = 0;
    for (let r = 0; r < s.length; r++) {
      const o = s[r], c = n[r];
      o.some((l) => l.row === e.row && l.col === e.col) && (i += c * 100);
    }
    for (let r = 0; r < t.length; r++) {
      const o = t[r], c = n[r], l = this.assessMoveQuality(e, o, "black");
      i += l * c * 50;
    }
    return i;
  }
  /**
   * Generate summary
   */
  generateSummary(e, t, n) {
    const s = t.reduce((o, c) => o + c, 0) / t.length, i = n.length, r = n.reduce((o, c) => o + c.length, 0) / i;
    return `Generated ${e.length} scenarios with ${(s * 100).toFixed(1)}% avg probability, ${r.toFixed(1)} avg path length`;
  }
  /**
   * Store prediction for learning
   */
  storePrediction(e, t, n) {
    const s = {
      timestamp: Date.now(),
      board: this.copyBoard(t),
      player: n,
      insights: e,
      accuracy: 0
      // Will be updated when actual moves are made
    };
    this.predictionHistory.push(s), this.predictionHistory.length > 100 && this.predictionHistory.shift();
  }
  /**
   * Copy board
   */
  copyBoard(e) {
    return e.map((t) => [...t]);
  }
  /**
   * Generate cache key
   */
  generateCacheKey(e, t, n) {
    return `${JSON.stringify(e)}_${t}_${n}`;
  }
  /**
   * Get valid moves (simplified)
   */
  getValidMoves(e, t) {
    const n = [];
    for (let s = 0; s < 8; s++)
      for (let i = 0; i < 8; i++)
        e[s][i] === null && n.push({ row: s, col: i });
    return n;
  }
  /**
   * Select move using simplified strategy
   */
  selectMove(e, t, n) {
    const s = n.filter((r) => this.isCorner(r));
    if (s.length > 0) return s[0];
    const i = n.filter((r) => this.isEdge(r));
    return i.length > 0 ? i[0] : n[Math.floor(Math.random() * n.length)];
  }
  /**
   * Make move (simplified)
   */
  makeMove(e, t, n) {
    const s = this.copyBoard(e);
    return s[t.row][t.col] = n, s;
  }
  /**
   * Get opponent
   */
  getOpponent(e) {
    return e === "black" ? "white" : "black";
  }
  /**
   * Calculate position score
   */
  calculatePositionScore(e, t) {
    let n = 0;
    for (let s = 0; s < 8; s++)
      for (let i = 0; i < 8; i++)
        e[s][i] === t ? n += this.getPositionValue(s, i) : e[s][i] === this.getOpponent(t) && (n -= this.getPositionValue(s, i));
    return n;
  }
  /**
   * Get position value
   */
  getPositionValue(e, t) {
    return [
      [120, -20, 20, 5, 5, 20, -20, 120],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [20, -5, 15, 3, 3, 15, -5, 20],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [20, -5, 15, 3, 3, 15, -5, 20],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [120, -20, 20, 5, 5, 20, -20, 120]
    ][e][t];
  }
  /**
   * Assess move quality
   */
  assessMoveQuality(e, t, n) {
    let s = 0.5;
    return this.isCorner(e) && (s += 0.4), this.isEdge(e) && (s += 0.2), this.isCenter(e) && (s -= 0.1), this.isXSquare(e) && (s -= 0.3), this.isCSquare(e) && (s -= 0.2), Math.max(0.1, Math.min(1, s));
  }
  /**
   * Calculate board similarity
   */
  calculateBoardSimilarity(e, t) {
    let n = 0, s = 0;
    for (let i = 0; i < 8; i++)
      for (let r = 0; r < 8; r++)
        e[i][r] === t[i][r] && n++, s++;
    return n / s;
  }
  /**
   * Check if move is corner
   */
  isCorner(e) {
    const { row: t, col: n } = e;
    return (t === 0 || t === 7) && (n === 0 || n === 7);
  }
  /**
   * Check if move is edge
   */
  isEdge(e) {
    const { row: t, col: n } = e;
    return t === 0 || t === 7 || n === 0 || n === 7;
  }
  /**
   * Check if move is center
   */
  isCenter(e) {
    const { row: t, col: n } = e;
    return t >= 3 && t <= 4 && n >= 3 && n <= 4;
  }
  /**
   * Check if move is X-square
   */
  isXSquare(e) {
    const { row: t, col: n } = e;
    return [[1, 1], [1, 6], [6, 1], [6, 6]].some(([i, r]) => t === i && n === r);
  }
  /**
   * Check if move is C-square
   */
  isCSquare(e) {
    const { row: t, col: n } = e;
    return [
      [0, 1],
      [1, 0],
      [0, 6],
      [1, 7],
      [6, 0],
      [7, 1],
      [6, 7],
      [7, 6]
    ].some(([i, r]) => t === i && n === r);
  }
  /**
   * Initialize prediction models
   */
  initializePredictionModels() {
  }
  /**
   * Get prediction statistics
   */
  getPredictionStats() {
    return {
      totalPredictions: this.predictionHistory.length,
      averageAccuracy: this.predictionHistory.reduce((e, t) => e + t.accuracy, 0) / this.predictionHistory.length,
      cacheSize: this.scenarioCache.size,
      averageScenarios: this.predictionHistory.reduce((e, t) => e + t.insights.scenarios.length, 0) / this.predictionHistory.length
    };
  }
}
const F = 0x0101010101010101n, A = 0x8080808080808080n, d = 0xffffffffffffffffn, M = d ^ F, v = d ^ A;
function B(a) {
  return (a & v) << 1n;
}
function O(a) {
  return (a & M) >> 1n;
}
function T(a) {
  return a << 8n;
}
function L(a) {
  return a >> 8n;
}
function I(a) {
  return (a & v) << 9n;
}
function W(a) {
  return (a & M) << 7n;
}
function N(a) {
  return (a & v) >> 7n;
}
function R(a) {
  return (a & M) >> 9n;
}
const G = [
  B,
  O,
  T,
  L,
  I,
  W,
  N,
  R
];
function $(a) {
  let e = 0n, t = BigInt(a);
  for (; t > 1n; )
    t >>= 1n, e++;
  return Number(e);
}
function U(a, e) {
  return (7 - a) * 8 + e;
}
function j(a) {
  if (a < 0 || a > 63) throw new Error("Invalid bit index: " + a);
  const t = 7 - (a / 8 | 0), n = a % 8;
  return [t, n];
}
function X(a) {
  const e = [];
  let t = BigInt(a);
  for (; t; ) {
    const n = t & -t, s = $(n), [i, r] = j(s);
    e.push({ row: i, col: r }), t ^= n;
  }
  return e;
}
function w(a) {
  return a && typeof a.length == "number" && typeof a.subarray == "function";
}
function Z(a) {
  const e = new Uint8Array(64);
  for (let t = 0; t < 8; t++)
    for (let n = 0; n < 8; n++) {
      const s = a[t][n];
      e[t * 8 + n] = s === "black" ? 1 : s === "white" ? 2 : 0;
    }
  return e;
}
function Q(a) {
  let e = 0n, t = 0n;
  for (let n = 0; n < 64; n++) {
    const s = a[n] | 0;
    if (s === 0) continue;
    const i = n / 8 | 0, r = n % 8, o = U(i, r), c = 1n << BigInt(o);
    s === 1 ? e |= c : s === 2 && (t |= c);
  }
  return { bp: e, wp: t };
}
function P(a) {
  let e;
  if (w(a) ? e = a : Array.isArray(a) && Array.isArray(a[0]) ? e = Z(a) : Array.isArray(a) ? e = Uint8Array.from(a) : a && a.cells && w(a.cells) ? e = a.cells : e = new Uint8Array(64), e._bp === void 0 || e._wp === void 0) {
    const { bp: t, wp: n } = Q(e);
    e._bp = t, e._wp = n;
  }
  return e;
}
function K(a, e, t) {
  let n = t(a) & e;
  return n |= t(n) & e, n |= t(n) & e, n |= t(n) & e, n |= t(n) & e, n |= t(n) & e, t(n);
}
function J(a, e) {
  const t = P(e), n = a === 1 ? t._bp : t._wp, s = a === 1 ? t._wp : t._bp, i = ~(n | s) & d;
  let r = 0n;
  for (const o of G)
    r |= K(n, s, o);
  return r & i;
}
function Y(a) {
  return a === "black" ? 1 : 2;
}
function ee(a, e) {
  const t = Y(a), n = J(t, e);
  return X(n);
}
function te(a) {
  const e = new Uint8Array(64);
  for (let t = 0; t < 8; t++)
    for (let n = 0; n < 8; n++) {
      const s = a[t][n], i = t * 8 + n;
      s === "black" ? e[i] = 1 : s === "white" ? e[i] = 2 : e[i] = 0;
    }
  return e;
}
function C(a, e) {
  const t = P(te(a));
  return ee(e, t);
}
const ne = {
  level: 18,
  enableLearning: !0,
  enableOpponentAnalysis: !0,
  enablePredictiveSearch: !0,
  enableAdaptiveStrategy: !0,
  timeConfig: {
    totalTime: 3e4,
    increment: 1e3,
    minThinkTime: 500,
    maxThinkTime: 1e4
  }
};
class se {
  constructor(e = {}) {
    f(this, "name", "Engine-Zenith");
    f(this, "version", "1.0.0");
    f(this, "author", "Zenith Research Team");
    f(this, "config");
    f(this, "evaluation");
    f(this, "strategy");
    f(this, "opponentAnalysis");
    f(this, "predictiveSearch");
    // private adaptiveStrategy: AdaptiveStrategy;
    f(this, "gameHistory", []);
    f(this, "opponentProfile", null);
    f(this, "learningData", {
      wins: 0,
      losses: 0,
      totalMoves: 0,
      positiveMoves: 0,
      patterns: /* @__PURE__ */ new Map(),
      mistakes: []
    });
    this.config = { ...ne, ...e }, this.evaluation = new E(), this.strategy = new _(), this.opponentAnalysis = new x(), this.predictiveSearch = new H();
  }
  /**
   * Main engine interface method
   */
  async analyze(e) {
    var r;
    const t = Date.now(), { gameCore: n, timeLimit: s, skill: i } = e;
    try {
      const { board: o, currentPlayer: c } = n, l = i ? Math.floor(i / 5) + 10 : this.config.level, u = this.analyzeGamePhase(o);
      this.config.enableOpponentAnalysis && (this.opponentProfile = this.opponentAnalysis.analyzeOpponent(
        this.gameHistory,
        e.opponentMoves || []
      ));
      const h = this.strategy.analyzePosition(
        o,
        c,
        u,
        this.opponentProfile
      ), g = this.evaluation.evaluateBoard(
        o,
        c,
        u,
        h
      );
      let p = null;
      this.config.enablePredictiveSearch && (p = this.predictiveSearch.analyzeFutureScenarios(
        o,
        c,
        5
        // 5 moves ahead
      ));
      let y = null;
      this.config.enableAdaptiveStrategy;
      const S = this.selectBestMove(
        o,
        c,
        g,
        h,
        p,
        y
      );
      this.config.enableLearning && this.updateLearningData(S, g, h), this.updateGameHistory(n, S);
      const m = Date.now() - t;
      return {
        bestMove: S,
        evaluation: g.score,
        depth: g.depth,
        nodes: g.nodes,
        timeUsed: m,
        pv: g.pv || [],
        stats: {
          gamePhase: u,
          strategicAnalysis: h.summary,
          opponentProfile: (r = this.opponentProfile) == null ? void 0 : r.summary,
          predictiveInsights: p == null ? void 0 : p.summary,
          adaptiveStrategy: y == null ? void 0 : y.name,
          confidence: g.confidence,
          learningProgress: this.getLearningProgress()
        }
      };
    } catch (o) {
      console.error("Engine-Zenith analysis error:", o);
      const c = await this.getFallbackMove(n.board, n.currentPlayer), l = Date.now() - t;
      return {
        bestMove: c,
        evaluation: 0,
        depth: 1,
        nodes: 0,
        timeUsed: l,
        pv: [],
        stats: {
          error: o instanceof Error ? o.message : "Unknown error",
          fallback: !0
        }
      };
    }
  }
  /**
   * Analyze game phase
   */
  analyzeGamePhase(e) {
    const t = this.countEmptySquares(e);
    return t >= 45 ? "opening" : t >= 20 ? "midgame" : t >= 10 ? "late_midgame" : "endgame";
  }
  /**
   * Select best move using all analysis
   */
  selectBestMove(e, t, n, s, i, r) {
    const o = C(e, t);
    if (o.length === 0) return;
    const c = o.map((l) => ({
      move: l,
      score: this.calculateMoveScore(
        l,
        e,
        t,
        n,
        s,
        i,
        r
      )
    }));
    return c.sort((l, u) => u.score - l.score), c[0].move;
  }
  /**
   * Calculate comprehensive move score
   */
  calculateMoveScore(e, t, n, s, i, r, o) {
    let c = 0;
    return c += s.score * 0.3, c += i.getMoveValue(e) * 0.25, r && (c += r.getMoveValue(e) * 0.2), o && (c += o.getMoveValue(e) * 0.15), c += this.assessMoveSafety(e, t, n) * 0.1, c;
  }
  /**
   * Assess move safety and risk
   */
  assessMoveSafety(e, t, n) {
    return this.isDangerousSquare(e, t) ? -100 : this.isCorner(e) ? 100 : this.isEdgeSafe(e, t) ? 50 : 0;
  }
  /**
   * Check if move is on dangerous X/C square
   */
  isDangerousSquare(e, t) {
    const { row: n, col: s } = e, i = [[1, 1], [1, 6], [6, 1], [6, 6]];
    for (const [o, c] of i)
      if (n === o && s === c) {
        const l = o === 1 ? 0 : 7, u = c === 1 ? 0 : 7;
        if (t[l][u] === null)
          return !0;
      }
    const r = [
      [[0, 1], [1, 0]],
      [[0, 6], [1, 7]],
      [[6, 0], [7, 1]],
      [[6, 7], [7, 6]]
    ];
    for (let o = 0; o < 4; o++) {
      const l = [[0, 0], [0, 7], [7, 0], [7, 7]][o], u = r[o];
      if (t[l[0]][l[1]] === null) {
        for (const [h, g] of u)
          if (n === h && s === g)
            return !0;
      }
    }
    return !1;
  }
  /**
   * Check if move is corner
   */
  isCorner(e) {
    const { row: t, col: n } = e;
    return (t === 0 || t === 7) && (n === 0 || n === 7);
  }
  /**
   * Check if move is safe on edge
   */
  isEdgeSafe(e, t) {
    const { row: n, col: s } = e;
    if (n !== 0 && n !== 7 && s !== 0 && s !== 7)
      return !1;
    const i = [];
    n === 0 && (s === 1 && i.push([0, 0]), s === 6 && i.push([0, 7])), n === 7 && (s === 1 && i.push([7, 0]), s === 6 && i.push([7, 7])), s === 0 && (n === 1 && i.push([0, 0]), n === 6 && i.push([7, 0])), s === 7 && (n === 1 && i.push([0, 7]), n === 6 && i.push([7, 7]));
    for (const [r, o] of i)
      if (t[r][o] === null)
        return !1;
    return !0;
  }
  /**
   * Get fallback move when analysis fails
   */
  async getFallbackMove(e, t) {
    const n = C(e, t);
    if (n.length === 0) return;
    const s = n.filter((o) => this.isCorner(o));
    if (s.length > 0) return s[0];
    const i = n.filter((o) => this.isEdgeSafe(o, e));
    if (i.length > 0) return i[0];
    const r = n.filter((o) => !this.isDangerousSquare(o, e));
    return r.length > 0 ? r[0] : n[0];
  }
  /**
   * Update learning data
   */
  updateLearningData(e, t, n) {
    if (!e) return;
    const s = this.extractMovePattern(e, t, n);
    this.learningData.patterns.set(s.key, s), this.learningData.totalMoves++, t.score > 0 && this.learningData.positiveMoves++;
  }
  /**
   * Extract move pattern for learning
   */
  extractMovePattern(e, t, n) {
    return {
      key: `${e.row}-${e.col}`,
      move: e,
      score: t.score,
      strategicValue: n.getMoveValue(e),
      timestamp: Date.now()
    };
  }
  /**
   * Update game history
   */
  updateGameHistory(e, t) {
    this.gameHistory.push({
      board: e.board,
      move: t,
      timestamp: Date.now()
    }), this.gameHistory.length > 50 && this.gameHistory.shift();
  }
  /**
   * Get learning progress
   */
  getLearningProgress() {
    return {
      totalMoves: this.learningData.totalMoves,
      positiveMoves: this.learningData.positiveMoves,
      patternsLearned: this.learningData.patterns.size,
      winRate: this.learningData.wins / (this.learningData.wins + this.learningData.losses) || 0
    };
  }
  /**
   * Count empty squares
   */
  countEmptySquares(e) {
    let t = 0;
    for (let n = 0; n < 8; n++)
      for (let s = 0; s < 8; s++)
        e[n][s] === null && t++;
    return t;
  }
  /**
   * Update engine configuration
   */
  updateConfig(e) {
    this.config = { ...this.config, ...e };
  }
  /**
   * Clear engine state
   */
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
  /**
   * Get engine statistics
   */
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
}
const re = new se();
export {
  ne as DEFAULT_ZENITH_CONFIG,
  se as EngineZenith,
  re as default,
  re as engineZenith
};
