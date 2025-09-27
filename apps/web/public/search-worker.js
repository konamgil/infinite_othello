function ensureCryptoRandomUUID() {
  const g = globalThis;
  const c = g.crypto ?? void 0;
  if (!c) return;
  if (typeof c.randomUUID === "function") {
    if (typeof g.cryptoRandomUUID !== "function") g.cryptoRandomUUID = c.randomUUID.bind(c);
    return;
  }
  const poly = function randomUUID() {
    const rnds = new Uint8Array(16);
    if (typeof c.getRandomValues === "function") c.getRandomValues(rnds);
    else for (let i = 0; i < 16; i++) rnds[i] = Math.floor(Math.random() * 256);
    rnds[6] = rnds[6] & 15 | 64;
    rnds[8] = rnds[8] & 63 | 128;
    const hex = Array.from(rnds).map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  };
  try {
    Object.defineProperty(c, "randomUUID", { value: poly, configurable: true, writable: true });
  } catch {
  }
  try {
    const proto = Object.getPrototypeOf(c);
    if (proto && !("randomUUID" in proto)) {
      Object.defineProperty(proto, "randomUUID", { value: poly, configurable: true, writable: true });
    }
  } catch {
  }
  if (typeof g.cryptoRandomUUID !== "function") g.cryptoRandomUUID = poly;
}
ensureCryptoRandomUUID();
let cachedModuleURL;
let cachedExportName;
let cachedEngineFn = null;
async function getEngineSearchFn(opts) {
  const url = opts.engineModuleURL;
  const name = opts.engineExportName;
  if (url && name && url === cachedModuleURL && name === cachedExportName && cachedEngineFn) {
    return cachedEngineFn;
  }
  if (url && name) {
    try {
      const mod = await import(
        /* @vite-ignore */
        url
      );
      const fn = mod[name];
      if (typeof fn === "function") {
        cachedModuleURL = url;
        cachedExportName = name;
        cachedEngineFn = fn;
        return cachedEngineFn;
      }
    } catch (e) {
      console.warn("[worker] engine import failed, using fallback.", e);
    }
  }
  return fallbackEngineSearch;
}
const workerId = Math.floor(Math.random() * 1e9);
self.onmessage = (ev) => {
  const { type, payload } = ev.data || {};
  if (type !== "search" || !payload) return;
  if (payload.mode === "single") {
    runSingle(payload);
  } else {
    runDistributed(payload);
  }
};
async function runSingle(req) {
  const t0 = performance.now();
  try {
    const engine = await getEngineSearchFn(req.options);
    const total = Math.max(0, req.options.timeLimit ?? 0);
    const bufferRatio = 0.08;
    const budget = total > 0 ? Math.floor(total * (1 - bufferRatio)) : 0;
    const deadline = total > 0 ? t0 + budget : void 0;
    const result = await engine(req.gameCore, req.player, { ...req.options, deadline });
    const t1 = performance.now();
    postMessage({
      id: req.id,
      workerId,
      success: true,
      mode: req.mode,
      player: req.player,
      bestMove: result.bestMove,
      evaluation: result.evaluation,
      nodes: result.nodes ?? 0,
      pv: result.pv ?? [],
      elapsed: t1 - t0
    });
  } catch (err) {
    const t1 = performance.now();
    postMessage({
      id: req.id,
      workerId,
      success: false,
      mode: req.mode,
      player: req.player,
      error: err?.message ?? String(err),
      elapsed: t1 - t0
    });
  }
}
async function runDistributed(req) {
  const t0 = performance.now();
  let roots = Array.isArray(req.rootMoves) && req.rootMoves.length ? req.rootMoves : deriveRootMoves(req.gameCore, req.player) ?? [];
  let bestEval = -Infinity;
  let bestMove;
  let bestPV = [];
  let totalNodes = 0;
  let tried = 0;
  try {
    const engine = await getEngineSearchFn(req.options);
    const total = Math.max(0, req.options.timeLimit ?? 0);
    const bufferRatio = 0.08;
    let remaining = total > 0 ? Math.floor(total * (1 - bufferRatio)) : 0;
    const globalDeadline = total > 0 ? t0 + remaining : void 0;
    const fairShare = req.options.distributedFairShare ?? false;
    const minSlice = Math.max(1, Math.floor(req.options.minSliceMs ?? 40));
    const maxSingleShare = clamp(req.options.maxSingleShare ?? 0.45, 0.1, 0.9);
    const warmShare = clamp(req.options.warmupShare ?? 0.15, 0.05, 0.3);
    const topK = Math.max(
      1,
      Math.min(req.options.distributedTopK ?? 3, roots.length)
    );
    const noTotalBudget = total <= 0;
    if (fairShare) {
      const timePerMove = Math.max(
        minSlice,
        Math.floor((remaining > 0 ? remaining : minSlice * roots.length) / Math.max(1, roots.length))
      );
      for (const mv of roots) {
        const tMoveStart = performance.now();
        const moveDeadline = globalDeadline ?? tMoveStart + timePerMove;
        const moveOpts = {
          ...req.options,
          timeLimit: timePerMove,
          deadline: moveDeadline,
          rootMove: mv
        };
        const result = await engine(req.gameCore, req.player, moveOpts);
        tried += 1;
        totalNodes += result.nodes ?? 0;
        if (typeof result.evaluation === "number" && result.evaluation > bestEval) {
          bestEval = result.evaluation;
          bestMove = result.bestMove ?? mv;
          bestPV = result.pv ?? [];
        }
        const moveSpent = performance.now() - tMoveStart;
        if (remaining > 0) remaining = Math.max(0, remaining - moveSpent);
        if (globalDeadline && performance.now() >= globalDeadline || remaining <= 0 && !noTotalBudget) break;
      }
      const t12 = performance.now();
      postMessage({
        id: req.id,
        workerId,
        success: isFinite(bestEval),
        mode: req.mode,
        player: req.player,
        bestMove,
        evaluation: isFinite(bestEval) ? bestEval : void 0,
        nodes: totalNodes,
        pv: bestPV,
        elapsed: t12 - t0,
        rootsTried: tried,
        rootBest: bestMove
      });
      return;
    }
    const warmBudget = remaining > 0 ? Math.floor(remaining * warmShare) : minSlice * roots.length;
    const warmSlice = Math.max(minSlice, Math.floor(warmBudget / Math.max(1, roots.length)));
    const warmResults = [];
    for (const mv of roots) {
      const tMoveStart = performance.now();
      const moveDeadline = globalDeadline && remaining > 0 ? Math.min(globalDeadline, tMoveStart + warmSlice) : tMoveStart + warmSlice;
      const moveOpts = {
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
      if (typeof result.evaluation === "number" && result.evaluation > bestEval) {
        bestEval = result.evaluation;
        bestMove = result.bestMove ?? mv;
        bestPV = result.pv ?? [];
      }
      const moveSpent = performance.now() - tMoveStart;
      if (remaining > 0) remaining = Math.max(0, remaining - moveSpent);
      if (globalDeadline && performance.now() >= globalDeadline || remaining <= 0 && !noTotalBudget) break;
    }
    if (globalDeadline && performance.now() < globalDeadline || (remaining > 0 || noTotalBudget)) {
      const picked = pickTopK(warmResults, topK);
      const afterWarm = remaining > 0 ? remaining : minSlice * picked.length;
      const maxSingle = total > 0 ? Math.floor(total * maxSingleShare) : minSlice * 6;
      const slice = Math.max(minSlice, Math.floor(afterWarm / Math.max(1, picked.length)));
      for (const it of picked) {
        const per = Math.min(maxSingle, slice);
        const tMoveStart = performance.now();
        const moveDeadline = globalDeadline && remaining > 0 ? Math.min(globalDeadline, tMoveStart + per) : tMoveStart + per;
        const moveOpts = {
          ...req.options,
          timeLimit: per,
          deadline: moveDeadline,
          rootMove: it.move,
          initialGuess: it.evaluation
        };
        const deep = await engine(req.gameCore, req.player, moveOpts);
        totalNodes += deep.nodes ?? 0;
        if (typeof deep.evaluation === "number" && deep.evaluation > bestEval) {
          bestEval = deep.evaluation;
          bestMove = deep.bestMove ?? it.move;
          bestPV = deep.pv ?? [];
        }
        const moveSpent = performance.now() - tMoveStart;
        if (remaining > 0) remaining = Math.max(0, remaining - moveSpent);
        if (globalDeadline && performance.now() >= globalDeadline || remaining <= 0 && !noTotalBudget) break;
      }
    }
    const t1 = performance.now();
    postMessage({
      id: req.id,
      workerId,
      success: isFinite(bestEval),
      mode: req.mode,
      player: req.player,
      bestMove,
      evaluation: isFinite(bestEval) ? bestEval : void 0,
      nodes: totalNodes,
      pv: bestPV,
      elapsed: t1 - t0,
      rootsTried: tried,
      rootBest: bestMove
    });
  } catch (err) {
    const t1 = performance.now();
    postMessage({
      id: req.id,
      workerId,
      success: false,
      mode: req.mode,
      player: req.player,
      error: err?.message ?? String(err),
      elapsed: t1 - t0,
      rootsTried: tried,
      rootBest: bestMove
    });
  }
}
async function fallbackEngineSearch(gameCore, player, options) {
  const board = gameCore?.board ?? createBoardFromCore(gameCore);
  const getMoves = gameCore?.getValidMoves ?? ((b, p) => listValidMoves(b, p));
  const apply = gameCore?.applyMove ?? ((b, m, p) => applyMove(b, m, p));
  let moves = [];
  if (options.rootMove) {
    moves = [options.rootMove];
  } else {
    moves = getMoves(board, player) ?? [];
  }
  if (moves.length === 0) {
    return { evaluation: 0, nodes: 1, pv: [] };
  }
  let best = moves[0];
  let bestScore = -Infinity;
  let nodes = 0;
  for (const m of moves) {
    nodes++;
    let s = 0;
    if (isX(m)) s -= 100;
    if (isC(m)) s -= 50;
    if ((m.row === 3 || m.row === 4) && (m.col === 3 || m.col === 4)) s += 12;
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
    pv: [best]
  };
}
const DIRS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1]
];
function opponent(p) {
  return p === "black" ? "white" : "black";
}
function listValidMoves(board, player) {
  const opp = opponent(player);
  const out = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c] !== null) continue;
    for (const [dr, dc] of DIRS) {
      let y = r + dr, x = c + dc, seenOpp = false;
      while (y >= 0 && y < 8 && x >= 0 && x < 8) {
        const v = board[y][x];
        if (v === opp) {
          seenOpp = true;
          y += dr;
          x += dc;
          continue;
        }
        if (v === player && seenOpp) {
          out.push({ row: r, col: c });
          y = 999;
          x = 999;
          break;
        }
        break;
      }
    }
  }
  return out;
}
function applyMove(board, move, player) {
  const b = board.map((row) => row.slice());
  if (b[move.row][move.col] !== null) return b;
  b[move.row][move.col] = player;
  const opp = opponent(player);
  for (const [dr, dc] of DIRS) {
    const flips = [];
    let y = move.row + dr, x = move.col + dc;
    while (y >= 0 && y < 8 && x >= 0 && x < 8 && b[y][x] === opp) {
      flips.push([y, x]);
      y += dr;
      x += dc;
    }
    if (y >= 0 && y < 8 && x >= 0 && x < 8 && b[y][x] === player && flips.length) {
      for (const [fy, fx] of flips) b[fy][fx] = player;
    }
  }
  return b;
}
function discDiff(board, me) {
  let my = 0, op = 0;
  const opp = opponent(me);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c] === me) my++;
    else if (board[r][c] === opp) op++;
  }
  return my - op;
}
function isX(p) {
  return (p.row === 1 || p.row === 6) && (p.col === 1 || p.col === 6);
}
function isC(p) {
  const set = /* @__PURE__ */ new Set(["0,1", "1,0", "0,6", "1,7", "6,0", "7,1", "6,7", "7,6"]);
  return set.has(`${p.row},${p.col}`);
}
function createBoardFromCore(core) {
  if (Array.isArray(core)) return core;
  if (Array.isArray(core?.board)) return core.board;
  const B = Array.from({ length: 8 }, () => Array(8).fill(null));
  B[3][3] = "white";
  B[3][4] = "black";
  B[4][3] = "black";
  B[4][4] = "white";
  return B;
}
function deriveRootMoves(gameCore, player) {
  const board = gameCore?.board ?? createBoardFromCore(gameCore);
  const getMoves = gameCore?.getValidMoves ?? ((b, p) => listValidMoves(b, p));
  return getMoves(board, player) ?? [];
}
function pickTopK(list, k) {
  const sorted = [...list].sort((a, b) => (b.evaluation ?? -Infinity) - (a.evaluation ?? -Infinity));
  return sorted.slice(0, Math.min(k, sorted.length));
}
function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}
