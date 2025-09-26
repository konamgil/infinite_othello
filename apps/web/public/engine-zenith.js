// Engine-Zenith (compat version) - fully refactored, API compatible
// Keep exports: DEFAULT_ZENITH_CONFIG, EngineZenith, default, engineZenith

// ---------- Small helpers for safe define ----------
const __def = Object.defineProperty;
const __defKey = (obj, key, val) =>
  key in obj ? __def(obj, key, { enumerable: true, configurable: true, writable: true, value: val }) : (obj[key] = val);

// ---------- Bitboard constants & directional shifts ----------
const FILE_A = 0x0101010101010101n;
const FILE_H = 0x8080808080808080n;
const ALL = 0xffffffffffffffffn;
const NOT_A = ALL ^ FILE_A;
const NOT_H = ALL ^ FILE_H;

function E_EAST(x) { return (x & NOT_H) << 1n; }
function E_WEST(x) { return (x & NOT_A) >> 1n; }
function E_NORTH(x) { return x << 8n; }
function E_SOUTH(x) { return x >> 8n; }
function E_NE(x) { return (x & NOT_H) << 9n; }
function E_NW(x) { return (x & NOT_A) << 7n; }
function E_SE(x) { return (x & NOT_A) >> 7n; }
function E_SW(x) { return (x & NOT_H) >> 9n; }

const DIRS = [E_EAST, E_WEST, E_NORTH, E_SOUTH, E_NE, E_NW, E_SE, E_SW];

// ----------
function msbIndex(b) {
  let idx = 0n, t = b;
  while (t > 1n) { t >>= 1n; idx++; }
  return Number(idx);
}

function rcToIndex(row, col) {
  // same mapping as original U(): (7-row)*8 + col
  return (7 - row) * 8 + col;
}
function indexToRC(idx) {
  if (idx < 0 || idx > 63) throw new Error("Invalid bit index: " + idx);
  const r = 7 - ((idx / 8) | 0);
  const c = idx % 8;
  return [r, c];
}
function bitListToMoves(bits) {
  const out = [];
  let t = bits;
  while (t) {
    const lsb = t & -t;
    const pos = msbIndex(lsb);
    const [row, col] = indexToRC(pos);
    out.push({ row, col });
    t ^= lsb;
  }
  return out;
}

// ---------- Board adapters (2D "black"/"white"/null <-> Uint8/bitboards) ----------
function toUint8Board(board2D) {
  const arr = new Uint8Array(64);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const v = board2D[r][c];
    arr[r * 8 + c] = v === "black" ? 1 : v === "white" ? 2 : 0;
  }
  return arr;
}
function toBitboardsFromUint8(cells) {
  let bp = 0n, wp = 0n;
  for (let i = 0; i < 64; i++) {
    const v = cells[i] | 0;
    if (v === 0) continue;
    const r = (i / 8) | 0, c = i % 8;
    const bit = 1n << BigInt(rcToIndex(r, c));
    if (v === 1) bp |= bit; else wp |= bit;
  }
  return { bp, wp };
}
function toBitboardsFrom2D(board2D) {
  return toBitboardsFromUint8(toUint8Board(board2D));
}
function to2DBoardFromBitboards(bp, wp) {
  const out = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let i = 0; i < 64; i++) {
    const [r, c] = indexToRC(i);
    const mask = 1n << BigInt(i);
    if (bp & mask) out[r][c] = "black";
    else if (wp & mask) out[r][c] = "white";
    else out[r][c] = null;
  }
  return out;
}
function playerToInt(p) { return p === "black" ? 1 : 2; }
function intToPlayer(i) { return i === 1 ? "black" : "white"; }
function opponentStr(p) { return p === "black" ? "white" : "black"; }

// ---------- Legal moves (bitboard) ----------
function flood(p, o, shift) {
  let x = shift(p) & o;
  let out = x;
  for (let i = 0; i < 5; i++) { x = shift(x) & o; out |= x; }
  return shift(out);
}
function legalMovesBitboard(player, opp) {
  const empty = ~(player | opp) & ALL;
  let moves = 0n;
  for (const dir of DIRS) moves |= flood(player, opp, dir);
  return moves & empty;
}
function getLegalMoves2D(board2D, player) {
  const { bp, wp } = toBitboardsFrom2D(board2D);
  const moves = player === "black" ? legalMovesBitboard(bp, wp) : legalMovesBitboard(wp, bp);
  return bitListToMoves(moves);
}
function isValidMove2D(board2D, player, row, col) {
  const { bp, wp } = toBitboardsFrom2D(board2D);
  const mvMask = 1n << BigInt(rcToIndex(row, col));
  const moves = player === "black" ? legalMovesBitboard(bp, wp) : legalMovesBitboard(wp, bp);
  return (moves & mvMask) !== 0n;
}

// ---------- Make move (flip discs) ----------
function flipsForMove(player, opp, move) {
  let flipped = 0n;
  for (const dir of DIRS) {
    let x = dir(move) & opp;
    let acc = 0n;
    while (x) {
      acc |= x;
      const nx = dir(x);
      if (!nx) break;
      if (nx & player) { flipped |= acc; break; }
      if (nx & opp) { x = nx & opp; continue; }
      break;
    }
  }
  return flipped;
}
function applyMoveBitboard(bp, wp, player, row, col) {
  const move = 1n << BigInt(rcToIndex(row, col));
  if (player === "black") {
    const flips = flipsForMove(bp, wp, move);
    if (flips === 0n) return { bp, wp, ok: false };
    return { bp: bp | move | flips, wp: wp & ~flips, ok: true };
  } else {
    const flips = flipsForMove(wp, bp, move);
    if (flips === 0n) return { bp, wp, ok: false };
    return { bp: bp & ~flips, wp: wp | move | flips, ok: true };
  }
}
function applyMove2D(board2D, player, mv) {
  const { bp, wp } = toBitboardsFrom2D(board2D);
  const res = applyMoveBitboard(bp, wp, player, mv.row, mv.col);
  if (!res.ok) return null;
  return to2DBoardFromBitboards(res.bp, res.wp);
}

// ---------- Evaluator ----------
class E {
  weights;
  phaseWeights;
  constructor() {
    __defKey(this, "weights", undefined);
    __defKey(this, "phaseWeights", undefined);
    this.weights = this.getDefaultWeights();
    this.phaseWeights = this.initializePhaseWeights();
  }

  evaluateBoard(board2D, player, phase, strategic) {
    const opp = opponentStr(player);
    const r = this.phaseWeights.get(phase) || this.weights;
    let score = 0;

    score += this.evaluateMaterial(board2D, player, opp) * r.material;
    score += this.evaluatePosition(board2D, player, opp) * r.position;
    score += this.evaluateMobility(board2D, player, opp) * r.mobility;
    score += this.evaluateFrontier(board2D, player, opp) * r.frontier;
    score += this.evaluateStability(board2D, player, opp) * r.stability;
    score += this.evaluateCorners(board2D, player, opp) * r.corner;
    score += this.evaluateEdges(board2D, player, opp) * r.edge;
    score += this.evaluateCenter(board2D, player, opp) * r.center;
    score += this.evaluateSafety(board2D, player, opp) * r.safety;
    score += this.evaluateStrategic(board2D, player, strategic) * r.strategic;

    const confidence = this.calculateConfidence(board2D, player, phase);
    const depth = this.calculateDepth(phase);
    const nodes = this.calculateNodes(phase);

    return { score, depth, nodes, confidence, pv: [] };
  }

  evaluateMaterial(b, me, opp) {
    let m = 0, o = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const v = b[r][c];
      if (v === me) m++; else if (v === opp) o++;
    }
    return m - o;
  }

  evaluatePosition(b, me, opp) {
    const PST = [
      [120, -20, 20, 5, 5, 20, -20, 120],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [20, -5, 15, 3, 3, 15, -5, 20],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [20, -5, 15, 3, 3, 15, -5, 20],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [120, -20, 20, 5, 5, 20, -20, 120]
    ];
    let val = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const v = b[r][c];
      if (v === me) val += PST[r][c];
      else if (v === opp) val -= PST[r][c];
    }
    return val;
  }

  evaluateMobility(b, me, opp) {
    const myMoves = getLegalMoves2D(b, me).length;
    const opMoves = getLegalMoves2D(b, opp).length;
    return myMoves - opMoves;
  }

  evaluateFrontier(b, me, opp) {
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    const countFrontier = (color) => {
      let cnt = 0;
      for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (b[r][c]===color) {
        for (const [dr,dc] of dirs) {
          const nr=r+dr, nc=c+dc;
          if (nr>=0&&nr<8&&nc>=0&&nc<8&&b[nr][nc]===null) { cnt++; break; }
        }
      }
      return cnt;
    };
    const m=countFrontier(me), o=countFrontier(opp);
    // fewer frontier is better → opponentFrontier - myFrontier
    return (o - m);
  }

  evaluateStability(b, me, opp) {
    const corners = [[0,0],[0,7],[7,0],[7,7]];
    let m=0,o=0;
    for (const [r,c] of corners) { if (b[r][c]===me) m++; else if (b[r][c]===opp) o++; }
    // edge anchoring (rough)
    const edgeAdd = (color) => {
      let s = 0;
      for (let i=0;i<8;i++) {
        if (b[0][i]===color) s+=0.5;
        if (b[7][i]===color) s+=0.5;
        if (b[i][0]===color) s+=0.5;
        if (b[i][7]===color) s+=0.5;
      }
      return s;
    };
    return Math.floor((m - o) * 10 + (edgeAdd(me) - edgeAdd(opp)));
  }

  evaluateCorners(b, me, opp) {
    const cs=[[0,0],[0,7],[7,0],[7,7]];
    let v=0;
    for (const [r,c] of cs) {
      if (b[r][c]===me) v+=100;
      else if (b[r][c]===opp) v-=100;
    }
    return v;
  }

  evaluateEdges(b, me, opp) {
    let v=0;
    for (let i=0;i<8;i++) {
      if (b[0][i]===me) v+=10; else if (b[0][i]===opp) v-=10;
      if (b[7][i]===me) v+=10; else if (b[7][i]===opp) v-=10;
      if (b[i][0]===me) v+=10; else if (b[i][0]===opp) v-=10;
      if (b[i][7]===me) v+=10; else if (b[i][7]===opp) v-=10;
    }
    return v;
  }

  evaluateCenter(b, me, opp) {
    const cells=[[3,3],[3,4],[4,3],[4,4]];
    let v=0;
    for (const [r,c] of cells) {
      if (b[r][c]===me) v+=20; else if (b[r][c]===opp) v-=20;
    }
    return v;
  }

  evaluateSafety(b, me, opp) {
    // penalize owning X-squares when corner empty
    let s=0;
    const xq=[[1,1],[1,6],[6,1],[6,6]];
    for (const [r,c] of xq) if (b[r][c]===me) {
      const cr = r===1?0:7, cc = c===1?0:7;
      if (b[cr][cc]===null) s -= 50;
    }
    return s;
  }

  evaluateStrategic(_b, _me, strategic) {
    if (!strategic) return 0;
    return strategic.mobility*0.3 + strategic.frontier*0.2 + strategic.stability*0.2 +
           strategic.cornerControl*0.15 + strategic.edgeControl*0.1 + strategic.centerControl*0.05;
  }

  calculateConfidence(b, me, phase) {
    let s = 40;
    if (phase==="opening") s+=15;
    else if (phase==="midgame") s+=25;
    else if (phase==="late_midgame") s+=35;
    else if (phase==="endgame") s+=45;
    // corner bonus
    const corners=[[0,0],[0,7],[7,0],[7,7]];
    let myC=0;
    for (const [r,c] of corners) if (b[r][c]===me) myC++;
    s += myC*10;
    return Math.min(100, s);
  }

  calculateDepth(phase) {
    if (phase==="opening") return 8;
    if (phase==="midgame") return 12;
    if (phase==="late_midgame") return 16;
    if (phase==="endgame") return 20;
    return 10;
  }
  calculateNodes(phase) {
    if (phase==="opening") return 10000;
    if (phase==="midgame") return 50000;
    if (phase==="late_midgame") return 100000;
    if (phase==="endgame") return 200000;
    return 25000;
  }

  getDefaultWeights() {
    return { material:1, position:1, mobility:1, frontier:1, stability:1, corner:1, edge:1, center:1, safety:1, strategic:1 };
  }
  initializePhaseWeights() {
    const m = new Map();
    m.set("opening",      { material:0.1, position:1,   mobility:1.5, frontier:0.8, stability:0.3, corner:2,   edge:0.5, center:1.2, safety:1.5, strategic:1 });
    m.set("midgame",      { material:0.3, position:1,   mobility:1.2, frontier:1,   stability:0.8, corner:1.5, edge:0.8, center:1,   safety:1.2, strategic:1 });
    m.set("late_midgame", { material:0.5, position:1,   mobility:1,   frontier:1.2, stability:1.2, corner:1.8, edge:1,   center:0.8, safety:1,   strategic:1 });
    m.set("endgame",      { material:2,   position:0.5, mobility:0.3, frontier:0.5, stability:1.5, corner:2,   edge:1.2, center:0.5, safety:0.8, strategic:1 });
    return m;
  }
}

// ---------- Strategic Analyzer (deterministic) ----------
class _Strategic {
  gamePhase;
  opponentProfile;
  constructor() {
    __defKey(this, "gamePhase", "opening");
    __defKey(this, "opponentProfile", null);
  }

  analyzePosition(board2D, player, phase, oppProfile) {
    this.gamePhase = phase;
    this.opponentProfile = oppProfile;

    const mobility = this.analyzeMobility(board2D, player);
    const frontier = this.analyzeFrontier(board2D, player);
    const stability = this.analyzeStability(board2D, player);
    const cornerControl = this.analyzeCornerControl(board2D, player);
    const edgeControl = this.analyzeEdgeControl(board2D, player);
    const centerControl = this.analyzeCenterControl(board2D, player);
    const safety = this.analyzeSafety(board2D, player);

    const out = {
      mobility, frontier, stability, cornerControl, edgeControl, centerControl, safety,
      summary: "",
      getMoveValue: (mv) => this.getMoveValue(mv, board2D, player)
    };
    out.summary = this.generateSummary(out);
    return out;
  }

  analyzeMobility(b, p) {
    const me = getLegalMoves2D(b, p).length;
    const op = getLegalMoves2D(b, opponentStr(p)).length;
    const tot = me + op;
    return tot===0 ? 0 : ((me - op) / tot) * 100;
  }
  analyzeFrontier(b, p) {
    const dirs=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    const countFrontier=(color)=>{
      let cnt=0;
      for(let r=0;r<8;r++)for(let c=0;c<8;c++) if (b[r][c]===color) {
        for(const[dr,dc]of dirs){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<8&&nc>=0&&nc<8&&b[nr][nc]===null){cnt++;break;}}
      }
      return cnt;
    };
    const m=countFrontier(p), o=countFrontier(opponentStr(p)), tot=m+o;
    return tot===0?0:((o-m)/tot)*100; // fewer frontier is better
  }
  analyzeStability(b, p) {
    const corners=[[0,0],[0,7],[7,0],[7,7]];
    let m=0,o=0;
    for(const [r,c] of corners){ if(b[r][c]===p)m++; else if(b[r][c]===opponentStr(p))o++; }
    const tot=m+o;
    return tot===0?0:((m-o)/tot)*100;
  }
  analyzeCornerControl(b, p) {
    const cs=[[0,0],[0,7],[7,0],[7,7]];
    let m=0,o=0; for(const [r,c] of cs){ if(b[r][c]===p)m++; else if(b[r][c]===opponentStr(p))o++; }
    const tot=m+o; return tot===0?0:((m-o)/tot)*100;
  }
  analyzeEdgeControl(b, p) {
    let m=0,o=0;
    for(let i=0;i<8;i++){
      if(b[0][i]===p)m++; else if(b[0][i]===opponentStr(p))o++;
      if(b[7][i]===p)m++; else if(b[7][i]===opponentStr(p))o++;
      if(b[i][0]===p)m++; else if(b[i][0]===opponentStr(p))o++;
      if(b[i][7]===p)m++; else if(b[i][7]===opponentStr(p))o++;
    }
    const tot=m+o; return tot===0?0:((m-o)/tot)*100;
  }
  analyzeCenterControl(b, p) {
    const cells=[[3,3],[3,4],[4,3],[4,4]];
    let m=0,o=0; for(const [r,c] of cells){ if(b[r][c]===p)m++; else if(b[r][c]===opponentStr(p))o++; }
    const tot=m+o; return tot===0?0:((m-o)/tot)*100;
  }
  analyzeSafety(b, p) {
    // X/C 위험만 반영 (deterministic)
    let s = 0;
    const xs=[[1,1],[1,6],[6,1],[6,6]];
    for(const [r,c] of xs) if (b[r][c]===p) {
      const cr=r===1?0:7, cc=c===1?0:7;
      if (b[cr][cc]===null) s -= 20;
    }
    const cs=[[0,1],[1,0],[0,6],[1,7],[6,0],[7,1],[6,7],[7,6]];
    for(const [r,c] of cs) if (b[r][c]===p) {
      const corner = (r===0&&c===1)?[0,0]:(r===1&&c===0)?[0,0]:
                     (r===0&&c===6)?[0,7]:(r===1&&c===7)?[0,7]:
                     (r===6&&c===0)?[7,0]:(r===7&&c===1)?[7,0]:
                     (r===6&&c===7)?[7,7]:[7,7];
      if (b[corner[0]][corner[1]]===null) s -= 10;
    }
    return Math.max(-100, Math.min(100, s));
  }

  getMoveValue(mv, b, p) {
    let s = 0;
    const isCorner = (r,c)=>(r===0||r===7)&&(c===0||c===7);
    const isEdge = (r,c)=> r===0||r===7||c===0||c===7;
    const isCenter = (r,c)=> r>=3 && r<=4 && c>=3 && c<=4;

    if (isCorner(mv.row, mv.col)) s += 100;
    else if (isEdge(mv.row, mv.col)) s += 20;
    else if (isCenter(mv.row, mv.col)) s += 10;

    // edge safety (adjacent to empty corner penalized)
    if (isEdge(mv.row, mv.col)) {
      const tests = [
        [0,1,[0,0]], [1,0,[0,0]], [0,6,[0,7]], [1,7,[0,7]],
        [7,1,[7,0]], [6,0,[7,0]], [7,6,[7,7]], [6,7,[7,7]]
      ];
      for (const [er,ec,[cr,cc]] of tests) {
        if (mv.row===er && mv.col===ec && b[cr][cc]===null) { s -= 30; break; }
      }
    }

    // phase bonus
    if (this.gamePhase==="opening") s += 5;
    else if (this.gamePhase==="late_midgame") s += 10;
    else if (this.gamePhase==="endgame") s += 15;

    // opponent style adjustment (deterministic)
    if (this.opponentProfile) {
      const st = this.opponentProfile.style;
      if (st==="aggressive") s += 5; else if (st==="defensive") s += 0; else s += 2;
    }

    return s;
  }

  generateSummary(s) {
    const out=[];
    if (s.mobility> 20) out.push("Strong mobility advantage");
    if (s.mobility<-20) out.push("Mobility disadvantage");
    if (s.cornerControl>50) out.push("Corner control");
    if (s.cornerControl<-50) out.push("Corner at risk");
    if (s.stability>30) out.push("Stable structure");
    if (s.stability<-30) out.push("Unstable structure");
    if (s.safety>20) out.push("Safe position");
    if (s.safety<-20) out.push("Dangerous squares");
    return out.length?out.join(", "):"Balanced position";
  }
}

// ---------- Opponent Analysis (deterministic, no randomness) ----------
class OpponentAnalysis {
  analysisHistory = [];
  patternDatabase = new Map();
  constructor() {
    this.initializePatternDatabase();
  }

  initializePatternDatabase() {
    // 패턴 데이터베이스 초기화
    this.patternDatabase.set("corner_control", { weight: 1.0, description: "Corner control patterns" });
    this.patternDatabase.set("edge_control", { weight: 0.8, description: "Edge control patterns" });
    this.patternDatabase.set("center_control", { weight: 0.6, description: "Center control patterns" });
    this.patternDatabase.set("aggressive", { weight: 1.2, description: "Aggressive playing patterns" });
    this.patternDatabase.set("defensive", { weight: 0.9, description: "Defensive playing patterns" });
  }

  analyzeOpponent(gameHistory, opponentMoves) {
    const mp = this.analyzeMovePatterns(opponentMoves);
    const prefs = this.analyzeStrategicPreferences(opponentMoves);
    const weaknesses = this.analyzeWeaknesses(opponentMoves);
    const style = this.determinePlayingStyle(mp, prefs);
    const profile = { style, preferences: prefs, weaknesses, summary: this.generateProfileSummary(style, prefs, weaknesses) };
    this.storeAnalysis(profile, opponentMoves);
    return profile;
  }

  analyzeMovePatterns(moves) {
    const out = { cornerPreference:0, edgePreference:0, centerPreference:0, riskTolerance:0, consistency:1 };
    if (moves.length===0) return out;
    const isCorner=(m)=> (m.row===0||m.row===7)&&(m.col===0||m.col===7);
    const isEdge=(m)=> m.row===0||m.row===7||m.col===0||m.col===7;
    const isCenter=(m)=> m.row>=3&&m.row<=4&&m.col>=3&&m.col<=4;

    const corners = moves.filter(isCorner).length;
    const edges = moves.filter(isEdge).length;
    const centers = moves.filter(isCenter).length;
    out.cornerPreference = corners / moves.length;
    out.edgePreference = edges / moves.length;
    out.centerPreference = centers / moves.length;

    // riskTolerance: X/C 비율이 높을수록 높음
    const isX=(m)=> [[1,1],[1,6],[6,1],[6,6]].some(([r,c])=>m.row===r&&m.col===c);
    const isC=(m)=> [[0,1],[1,0],[0,6],[1,7],[6,0],[7,1],[6,7],[7,6]].some(([r,c])=>m.row===r&&m.col===c);
    const risky = moves.filter((m)=>isX(m)||isC(m)).length;
    out.riskTolerance = risky / moves.length;

    // consistency: 패턴의 다양성이 적을수록 높음
    const pat = new Set(moves.map(m=> (isCorner(m)?'C' : isEdge(m)?'E' : isCenter(m)?'M' : 'I')));
    out.consistency = 1 - pat.size / Math.max(1, moves.length);

    return out;
  }

  analyzeStrategicPreferences(moves) {
    const prefs=[];
    const isCorner=(m)=> (m.row===0||m.row===7)&&(m.col===0||m.col===7);
    const isEdge=(m)=> m.row===0||m.row===7||m.col===0||m.col===7;
    const isCenter=(m)=> m.row>=3&&m.row<=4&&m.col>=3&&m.col<=4;

    if (moves.filter(isCorner).length / Math.max(1,moves.length) > 0.3) prefs.push("corner_control");
    if (moves.filter(isEdge).length / Math.max(1,moves.length) > 0.4) prefs.push("edge_control");
    if (moves.filter(isCenter).length / Math.max(1,moves.length) > 0.2) prefs.push("center_control");
    return prefs;
  }

  analyzeWeaknesses(moves) {
    const ws=[];
    const isX=(m)=> [[1,1],[1,6],[6,1],[6,6]].some(([r,c])=>m.row===r&&m.col===c);
    const isC=(m)=> [[0,1],[1,0],[0,6],[1,7],[6,0],[7,1],[6,7],[7,6]].some(([r,c])=>m.row===r&&m.col===c);
    if (moves.some(isX)) ws.push("x_square_mistakes");
    if (moves.some(isC)) ws.push("c_square_mistakes");
    return ws;
  }

  determinePlayingStyle(mp, prefs) {
    let ag=0, de=0;
    if (mp.cornerPreference > 0.4) ag+=2;
    if (mp.riskTolerance   > 0.6) ag+=2;
    if (prefs.includes("edge_control")) de+=1;
    if (mp.riskTolerance   < 0.4) de+=2;
    if (mp.consistency     > 0.7) de+=1;
    if (ag > de+1) return "aggressive";
    if (de > ag+1) return "defensive";
    return "balanced";
  }

  generateProfileSummary(style, prefs, ws) {
    const a=[];
    a.push(style==="aggressive"?"Aggressive player":style==="defensive"?"Defensive player":"Balanced player");
    if (prefs.length) a.push(`Prefers: ${prefs.join(", ")}`);
    if (ws.length) a.push(`Weaknesses: ${ws.join(", ")}`);
    return a.join(" | ");
  }

  storeAnalysis(profile, moves) {
    this.analysisHistory.push({ timestamp: Date.now(), profile, moves: [...moves] });
    if (this.analysisHistory.length>100) this.analysisHistory.shift();
  }
}

// ---------- Predictive Search (beam search) ----------
class PredictiveSearch {
  beamWidth = 3;
  maxDepth = 4;
  constructor() {}

  analyzeFutureScenarios(board2D, player, depth) {
    const d = Math.max(1, Math.min(this.maxDepth, depth||this.maxDepth));
    const { bp, wp } = toBitboardsFrom2D(board2D);
    const rootPlayer = player;

    const root = { bp, wp, player: rootPlayer, moves: [], score: 0 };

    let frontier = [root];
    let totalNodes = 0;

    for (let ply=0; ply<d; ply++) {
      const next = [];
      for (const node of frontier) {
        const lm = this.legal(node.bp, node.wp, node.player);
        if (lm===0n) {
          // pass
          next.push({ ...node, player: opponentStr(node.player) });
          continue;
        }
        const mvList = bitListToMoves(lm);
        for (const mv of mvList) {
          const applied = applyMoveBitboard(node.bp, node.wp, node.player, mv.row, mv.col);
          if (!applied.ok) continue;
          // simple positional eval for ordering
          const sc = this.positionalScore(applied.bp, applied.wp, rootPlayer);
          next.push({ bp: applied.bp, wp: applied.wp, player: opponentStr(node.player), moves: [...node.moves, mv], score: sc });
          totalNodes++;
        }
      }
      // beam prune
      next.sort((a,b)=> b.score - a.score);
      frontier = next.slice(0, this.beamWidth);
      if (frontier.length===0) break;
    }

    const scenarios = frontier.map(n => to2DBoardFromBitboards(n.bp, n.wp));
    const probabilities = frontier.map(n => 1 / frontier.length); // simple uniform for now (deterministic)
    const bestPaths = frontier.map(n => n.moves);
    const summary = `Beam ${this.beamWidth}, depth ${d}, nodes ${totalNodes}, top path length ${bestPaths[0]?.length||0}`;

    return {
      scenarios, probabilities, bestPaths, summary,
      getMoveValue: (mv) => {
        let v=0;
        for (let i=0;i<bestPaths.length;i++) {
          if (bestPaths[i].some((m)=>m.row===mv.row&&m.col===mv.col)) v += probabilities[i]*100;
        }
        return v;
      }
    };
  }

  legal(bp, wp, player) {
    return player==="black" ? legalMovesBitboard(bp, wp) : legalMovesBitboard(wp, bp);
  }

  positionalScore(bp, wp, rootPlayer) {
    // simple PST-based (deterministic)
    let val = 0;
    for (let i=0;i<64;i++) {
      const [r,c] = indexToRC(i);
      const pst = [
        [120,-20, 20, 5, 5,20,-20,120],
        [-20,-40,-5,-5,-5,-5,-40,-20],
        [ 20, -5,15, 3, 3,15, -5, 20],
        [  5, -5, 3, 3, 3, 3, -5,  5],
        [  5, -5, 3, 3, 3, 3, -5,  5],
        [ 20, -5,15, 3, 3,15, -5, 20],
        [-20,-40,-5,-5,-5,-5,-40,-20],
        [120,-20, 20, 5, 5,20,-20,120]
      ][r][c];
      const mask = 1n << BigInt(i);
      if (rootPlayer==="black") {
        if (bp & mask) val += pst;
        if (wp & mask) val -= pst;
      } else {
        if (wp & mask) val += pst;
        if (bp & mask) val -= pst;
      }
    }
    return val;
  }
}

// ---------- Config ----------
const ne = {
  level: 18,
  enableLearning: true,
  enableOpponentAnalysis: true,
  enablePredictiveSearch: true,
  enableAdaptiveStrategy: true,
  timeConfig: { totalTime: 30000, increment: 1000, minThinkTime: 500, maxThinkTime: 10000 }
};

// ---------- Engine ----------
class se {
  name = "Engine-Zenith";
  version = "1.1.0";
  author = "Zenith Research Team";
  config;
  evaluation;
  strategy;
  opponentAnalysis;
  predictiveSearch;
  gameHistory = [];
  opponentProfile = null;
  learningData = { wins:0, losses:0, totalMoves:0, positiveMoves:0, patterns:new Map(), mistakes: [] };

  constructor(cfg = {}) {
    this.config = { ...ne, ...cfg };
    this.evaluation = new E();
    this.strategy = new _Strategic();
    this.opponentAnalysis = new OpponentAnalysis();
    this.predictiveSearch = new PredictiveSearch();
  }

  async analyze(req) {
    const start = Date.now();
    const { gameCore, skill } = req;
    try {
      const { board, currentPlayer } = gameCore;
      const level = skill ? Math.floor(skill/5) + 10 : this.config.level;

      const phase = this.analyzeGamePhase(board);

      if (this.config.enableOpponentAnalysis) {
        this.opponentProfile = this.opponentAnalysis.analyzeOpponent(this.gameHistory, req.opponentMoves || []);
      }

      const strategic = this.strategy.analyzePosition(board, currentPlayer, phase, this.opponentProfile);
      const evalNow = this.evaluation.evaluateBoard(board, currentPlayer, phase, strategic);

      let predictive = null;
      if (this.config.enablePredictiveSearch) {
        predictive = this.predictiveSearch.analyzeFutureScenarios(board, currentPlayer, 4);
      }

      const bestMove = this.selectBestMove(board, currentPlayer, evalNow, strategic, predictive, null);

      if (this.config.enableLearning) this.updateLearningData(bestMove, evalNow, strategic);
      this.updateGameHistory(gameCore, bestMove);

      const timeUsed = Date.now() - start;
      return {
        bestMove,
        evaluation: evalNow.score,
        depth: evalNow.depth,
        nodes: evalNow.nodes,
        timeUsed,
        pv: [], // could be predictive.bestPaths[0]
        stats: {
          gamePhase: phase,
          strategicAnalysis: strategic.summary,
          opponentProfile: this.opponentProfile?.summary,
          predictiveInsights: predictive?.summary,
          adaptiveStrategy: null,
          confidence: evalNow.confidence,
          learningProgress: this.getLearningProgress(),
          level
        }
      };
    } catch (err) {
      console.error("Engine-Zenith analysis error:", err);
      const fb = await this.getFallbackMove(req.gameCore.board, req.gameCore.currentPlayer);
      const timeUsed = Date.now() - start;
      return {
        bestMove: fb,
        evaluation: 0, depth: 1, nodes: 0, timeUsed,
        pv: [],
        stats: { error: err?.message || "Unknown error", fallback: true }
      };
    }
  }

  analyzeGamePhase(b) {
    const empty = this.countEmptySquares(b);
    if (empty >= 45) return "opening";
    if (empty >= 20) return "midgame";
    if (empty >= 10) return "late_midgame";
    return "endgame";
  }

  selectBestMove(board, player, evalNow, strategic, predictive, _adaptive) {
    const moves = getLegalMoves2D(board, player);
    if (moves.length===0) return undefined;

    const scored = moves.map(mv => ({
      move: mv,
      score: this.calculateMoveScore(mv, board, player, evalNow, strategic, predictive)
    }));
    scored.sort((a,b)=> b.score - a.score);
    return scored[0].move;
  }

  calculateMoveScore(mv, board, player, evalNow, strategic, predictive) {
    let score = 0;

    // ΔEval after move
    const nextBoard = applyMove2D(board, player, mv);
    if (!nextBoard) return -1e9; // illegal
    const phaseNext = this.analyzeGamePhase(nextBoard);
    const evalNext = this.evaluation.evaluateBoard(nextBoard, player, phaseNext, this.strategy.analyzePosition(nextBoard, player, phaseNext, this.opponentProfile));
    const deltaEval = evalNext.score - evalNow.score;

    // Opponent mobility reduction
    const opp = opponentStr(player);
    const oppNow = getLegalMoves2D(board, opp).length;
    const oppAfter = getLegalMoves2D(nextBoard, opp).length;
    const oppMobGain = oppNow - oppAfter; // positive is good

    // Strategic local value
    const stratVal = strategic.getMoveValue(mv);

    // Safety
    const dangerPenalty = this.isDangerousSquare(mv, board) ? -60 : 0;
    const cornerBonus = this.isCorner(mv) ? 80 : 0;
    const edgeSafeBonus = this.isEdgeSafe(mv, board) ? 30 : 0;

    // Predictive hint
    let pred = 0;
    if (predictive?.getMoveValue) pred = predictive.getMoveValue(mv);

    score += 0.40 * deltaEval;
    score += 0.20 * stratVal;
    score += 0.20 * oppMobGain * 10; // scale
    score += 0.10 * (cornerBonus + edgeSafeBonus + dangerPenalty);
    score += 0.10 * pred;

    return score;
  }

  isDangerousSquare(mv, board) {
    const {row:n, col:s} = mv;
    const xq=[[1,1],[1,6],[6,1],[6,6]];
    for (const [r,c] of xq) if (n===r&&s===c) {
      const cr=r===1?0:7, cc=c===1?0:7;
      if (board[cr][cc]===null) return true;
    }
    const nearC=[[[0,1],[1,0]],[[0,6],[1,7]],[[6,0],[7,1]],[[6,7],[7,6]]];
    for (let i=0;i<4;i++){
      const corner=[[0,0],[0,7],[7,0],[7,7]][i];
      const group=nearC[i];
      if (board[corner[0]][corner[1]]===null){
        for (const [r,c] of group) if (n===r&&s===c) return true;
      }
    }
    return false;
  }
  isCorner(mv) { const {row,col}=mv; return (row===0||row===7)&&(col===0||col===7); }
  isEdgeSafe(mv, board) {
    const {row,col}=mv;
    if (row!==0&&row!==7&&col!==0&&col!==7) return false;
    const checks = [
      [0,1,[0,0]],[1,0,[0,0]],[0,6,[0,7]],[1,7,[0,7]],
      [7,1,[7,0]],[6,0,[7,0]],[7,6,[7,7]],[6,7,[7,7]]
    ];
    for (const [er,ec,[cr,cc]] of checks) if (row===er&&col===ec && board[cr][cc]===null) return false;
    return true;
  }

  async getFallbackMove(board, player) {
    const moves = getLegalMoves2D(board, player);
    if (moves.length===0) return undefined;
    const corners = moves.filter(m=>this.isCorner(m));
    if (corners.length) return corners[0];
    const safeEdges = moves.filter(m=>this.isEdgeSafe(m, board));
    if (safeEdges.length) return safeEdges[0];
    const safe = moves.filter(m=>!this.isDangerousSquare(m, board));
    if (safe.length) return safe[0];
    return moves[0];
  }

  updateLearningData(mv, evalNow, strategic) {
    if (!mv) return;
    const key = `${mv.row}-${mv.col}`;
    this.learningData.patterns.set(key, { move: mv, score: evalNow.score, strategicValue: strategic.getMoveValue(mv), timestamp: Date.now() });
    this.learningData.totalMoves++;
    if (evalNow.score > 0) this.learningData.positiveMoves++;
  }

  updateGameHistory(core, mv) {
    this.gameHistory.push({ board: core.board, move: mv, timestamp: Date.now() });
    if (this.gameHistory.length>50) this.gameHistory.shift();
  }

  getLearningProgress() {
    const { wins, losses, totalMoves, positiveMoves, patterns } = this.learningData;
    return {
      totalMoves, positiveMoves, patternsLearned: patterns.size,
      winRate: wins / (wins + losses) || 0
    };
  }

  countEmptySquares(b) {
    let t=0; for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (b[r][c]===null) t++;
    return t;
  }

  updateConfig(cfg) { this.config = { ...this.config, ...cfg }; }
  clearState() {
    this.gameHistory = [];
    this.opponentProfile = null;
    this.learningData = { wins:0, losses:0, totalMoves:0, positiveMoves:0, patterns:new Map(), mistakes: [] };
  }
  getStats() {
    return { name:this.name, version:this.version, config:this.config, learningProgress:this.getLearningProgress(), gameHistory:this.gameHistory.length, opponentProfile:this.opponentProfile };
  }
}

// Singleton instance and exports (keep compatibility)
const re = new se();

export {
  ne as DEFAULT_ZENITH_CONFIG,
  se as EngineZenith,
  re as default,
  re as engineZenith
};
