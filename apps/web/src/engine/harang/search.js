import OthelloAI from './ai.js';

const {
  getValidMoves,
  flipPieces,
  undoMove,
  evaluateBoard: evaluateBoardBase,
  isImportantMove,
  computeZobristHash: computeZobristHashBase,
  initializeZobrist,
  scoreMoveForOrdering,
  killerPriority
} = OthelloAI;

/* =========================
   Config / Constants
   ========================= */
const USE_KILLER_HISTORY = (typeof globalThis !== 'undefined' && globalThis.USE_KILLER_HISTORY !== undefined)
  ? globalThis.USE_KILLER_HISTORY : true;
const USE_LMR = (typeof globalThis !== 'undefined' && globalThis.USE_LMR !== undefined)
  ? globalThis.USE_LMR : true;
// Treat slightly earlier as endgame to allow deeper exact searches sooner
// Allow runtime tuning via global overrides
const TUNING = (typeof globalThis !== 'undefined' && globalThis.SEARCH_TUNING && typeof globalThis.SEARCH_TUNING === 'object')
  ? globalThis.SEARCH_TUNING : {};
const ENDGAME_THRESHOLD = (typeof globalThis !== 'undefined' && typeof globalThis.ENDGAME_THRESHOLD_OVERRIDE === 'number')
  ? globalThis.ENDGAME_THRESHOLD_OVERRIDE : 16;
const TT_MAX = typeof TUNING.TT_MAX === 'number' ? TUNING.TT_MAX : 100_000; // transposition table size cap
const PROBCUT = Object.assign({ enabled: false, r: 2, margin: 200, minDepth: 4 }, TUNING.PROBCUT || {});
const RAZOR = Object.assign({ enabled: false, margin: 180 }, TUNING.RAZOR || {});

/* =========================
   State
   ========================= */
let killerMoves = [];
let historyTable = new Map();
let transpositionTable = new Map();
let zobristKeys;
let nodeCount = 0;

// time guard
let searchDeadline = 0;
function nowMs() { return (typeof performance !== 'undefined' ? performance.now() : Date.now()); }
function shouldAbort() { return nowMs() >= searchDeadline; }
class SearchAbort extends Error {}

// PV stability tracker (0..1)
let pvStableScore = 0;
let lastPV = null;
function updatePvStability(bestMove) {
  const same = lastPV && bestMove && lastPV[0] === bestMove[0] && lastPV[1] === bestMove[1];
  pvStableScore = same ? Math.min(1, pvStableScore * 0.85 + 0.15) : pvStableScore * 0.5;
  lastPV = bestMove ? [...bestMove] : lastPV;
  return pvStableScore || 0;
}

/* =========================
   Helpers
   ========================= */
function evaluateBoard(board, isEndgame, player, aiPlayer) {
  return evaluateBoardBase(board, isEndgame, player, aiPlayer, getValidMoves);
}

function orderMoves(moves, ply, p, board) {
  // Optional opening-book scoring hook (currently null)
  const recordScores = null;

  const killers = killerMoves[ply] || [];
  const opp = p === 1 ? 2 : 1;
  const before = ply < 2 ? getValidMoves(opp, board).length : 0;

  moves.sort((a, b) => score(b) - score(a));

  function score(move) {
    const [r, c] = move;
    let s = 0;

    if (recordScores) {
      const rec = recordScores.get(`${r},${c}`) ?? -1;
      s += rec * 1000; // dominate when book available
    }

    if (USE_KILLER_HISTORY) {
      s += killerPriority(move, killers) * 10000;
      s += historyTable.get(`${p}-${r},${c}`) || 0;
    }

    // base positional score (engine-provided)
    s += scoreMoveForOrdering(move);

    const size = board.length;
    // explicit corner bonus (reduced to avoid double-counting)
    if ((r === 0 || r === size - 1) && (c === 0 || c === size - 1)) s += 600;

    // refined X/C handling
    s += xCPenalty(board, r, c, p);

    // light mobility lookahead for shallow plies
    if (ply < 2) {
      const flipped = flipPieces(board, r, c, p);
      const after = getValidMoves(opp, board).length;
      undoMove(board, flipped, p);
      const reduce = before - after;
      s += 8 * reduce;
      if (after === 0) s += 1000; // pass-inducing move
    }

    return s;
  }
}

function xCPenalty(board, r, c, p) {
  const size = board.length;
  const opp = p === 1 ? 2 : 1;

  const isCorner = (rr, cc) =>
    (rr === 0 || rr === size - 1) && (cc === 0 || cc === size - 1);

  // Map X/C squares to their associated corner
  function cornerFor(rc, cc) {
    // X-squares
    if (rc === 1 && cc === 1) return [0, 0];
    if (rc === 1 && cc === size - 2) return [0, size - 1];
    if (rc === size - 2 && cc === 1) return [size - 1, 0];
    if (rc === size - 2 && cc === size - 2) return [size - 1, size - 1];
    // C-squares
    if (rc === 0 && cc === 1) return [0, 0];
    if (rc === 1 && cc === 0) return [0, 0];
    if (rc === 0 && cc === size - 2) return [0, size - 1];
    if (rc === 1 && cc === size - 1) return [0, size - 1];
    if (rc === size - 1 && cc === 1) return [size - 1, 0];
    if (rc === size - 2 && cc === 0) return [size - 1, 0];
    if (rc === size - 1 && cc === size - 2) return [size - 1, size - 1];
    if (rc === size - 2 && cc === size - 1) return [size - 1, size - 1];
    return null;
  }

  const corner = cornerFor(r, c);
  if (!corner) return 0; // not an X or C square

  // Determine game phase
  let empties = 0;
  for (let rr = 0; rr < size; rr++) {
    for (let cc = 0; cc < size; cc++) {
      if (board[rr][cc] === 0) empties++;
    }
  }
  const lateFactor = empties <= 20 ? 0.5 : 1.0;

  const owner = board[corner[0]][corner[1]];
  if (owner === p) return 200; // own corner means X/C is safe/positive
  if (owner === opp) return -600 * lateFactor; // opponent corner held → risky

  // Corner empty: simulate the move
  const flipped = flipPieces(board, r, c, p);
  const oppMoves = getValidMoves(opp, board);
  const myMovesAfter = getValidMoves(p, board).length;
  undoMove(board, flipped, p);

  // Opponent corner availability
  let oppCanCorner = false;
  for (const [mr, mc] of oppMoves) {
    if (isCorner(mr, mc)) { oppCanCorner = true; break; }
  }

  const mobilityAdj = clamp((myMovesAfter - 4) * 15, -100, 100);
  if (!oppCanCorner) {
    return (-150 * lateFactor) + mobilityAdj;
  }
  return (-800 * lateFactor) + mobilityAdj;
}

function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }

function computeZobristHash(board, p) {
  return computeZobristHashBase(board, p, zobristKeys);
}

function initZobrist() {
  zobristKeys = initializeZobrist();
}

function resetSearch() {
  transpositionTable = new Map();
  killerMoves = [];
  historyTable = new Map();
  nodeCount = 0;
  pvStableScore = 0;
  lastPV = null;
}

function getNodeCount() {
  return nodeCount;
}

// TT capped set with naive eviction
function ttSet(key, value) {
  if (transpositionTable.size >= TT_MAX) {
    const it = transpositionTable.keys().next();
    if (!it.done) transpositionTable.delete(it.value);
  }
  transpositionTable.set(key, value);
}

/* =========================
   Minimax (with AB, LMR, killers/history)
   ========================= */
function minimax(currentBoard, depth, alpha, beta, isMaximizingPlayer, isEndgame, ply = 0, player = 1, aiPlayer = 2) {
  if (shouldAbort()) throw new SearchAbort();
  nodeCount++;

  const side = isMaximizingPlayer ? aiPlayer : player;
  const hash = computeZobristHash(currentBoard, side);
  const ttEntry = transpositionTable.get(hash);
  if (ttEntry && ttEntry.depth >= depth) {
    if (ttEntry.flag === 'EXACT') return ttEntry.score;
    if (ttEntry.flag === 'LOWERBOUND' && ttEntry.score > alpha) alpha = ttEntry.score;
    if (ttEntry.flag === 'UPPERBOUND' && ttEntry.score < beta) beta = ttEntry.score;
    if (alpha >= beta) return ttEntry.score;
  }

  if (depth === 0) {
    return evaluateBoard(currentBoard, isEndgame, player, aiPlayer);
  }

  // Razor pruning
  const score = evaluateBoard(currentBoard, isEndgame, player, aiPlayer);
  if (RAZOR.enabled && score + RAZOR.margin <= alpha) {
    return score;
  }

  const p = side;
  const validMoves = getValidMoves(p, currentBoard);
  if (validMoves.length === 0) {
    if (isEndgame) {
      const opponent = (p === aiPlayer) ? player : aiPlayer;
      if (getValidMoves(opponent, currentBoard).length === 0) {
        return evaluateBoard(currentBoard, true, player, aiPlayer);
      }
      return minimax(currentBoard, depth, alpha, beta, !isMaximizingPlayer, isEndgame, ply + 1, player, aiPlayer);
    }
    return minimax(currentBoard, depth - 1, alpha, beta, !isMaximizingPlayer, isEndgame, ply + 1, player, aiPlayer);
  }

  orderMoves(validMoves, ply, p, currentBoard);

  let bestScore = isMaximizingPlayer ? -Infinity : Infinity;
  const originalAlpha = alpha;

  for (let i = 0; i < validMoves.length; i++) {
    if (shouldAbort()) throw new SearchAbort();

    const [row, col] = validMoves[i];
    const flipped = flipPieces(currentBoard, row, col, p);
    let score;
    try {
      if (i === 0) {
        score = minimax(currentBoard, depth - 1, alpha, beta, !isMaximizingPlayer, isEndgame, ply + 1, player, aiPlayer);
      } else {
        // Optional ProbCut pruning (enabled via SEARCH_TUNING) for very-hard tuning
        if (!isEndgame && PROBCUT.enabled && depth >= PROBCUT.minDepth) {
          if (isMaximizingPlayer) {
            const probe = minimax(
              currentBoard,
              depth - PROBCUT.r,
              beta - PROBCUT.margin,
              beta,
              !isMaximizingPlayer,
              isEndgame,
              ply + 1,
              player,
              aiPlayer
            );
            if (probe >= beta) {
              score = probe;
            }
          } else {
            const probe = minimax(
              currentBoard,
              depth - PROBCUT.r,
              alpha,
              alpha + PROBCUT.margin,
              !isMaximizingPlayer,
              isEndgame,
              ply + 1,
              player,
              aiPlayer
            );
            if (probe <= alpha) {
              score = probe;
            }
          }
        }
        if (score === undefined) {
        const canReduce = USE_LMR && depth >= 3 && i >= 3 && !isImportantMove(row, col);
        if (isMaximizingPlayer) {
          if (canReduce) {
            score = minimax(currentBoard, depth - 2, alpha, alpha + 1, !isMaximizingPlayer, isEndgame, ply + 1, player, aiPlayer);
            if (score > alpha) {
              score = minimax(currentBoard, depth - 1, alpha, beta, !isMaximizingPlayer, isEndgame, ply + 1, player, aiPlayer);
            }
          } else {
            score = minimax(currentBoard, depth - 1, alpha, alpha + 1, !isMaximizingPlayer, isEndgame, ply + 1, player, aiPlayer);
            if (score > alpha && score < beta) {
              score = minimax(currentBoard, depth - 1, alpha, beta, !isMaximizingPlayer, isEndgame, ply + 1, player, aiPlayer);
            }
          }
        } else {
          if (canReduce) {
            score = minimax(currentBoard, depth - 2, beta - 1, beta, !isMaximizingPlayer, isEndgame, ply + 1, player, aiPlayer);
            if (score < beta) {
              score = minimax(currentBoard, depth - 1, alpha, beta, !isMaximizingPlayer, isEndgame, ply + 1, player, aiPlayer);
            }
          } else {
            score = minimax(currentBoard, depth - 1, beta - 1, beta, !isMaximizingPlayer, isEndgame, ply + 1, player, aiPlayer);
            if (score < beta && score > alpha) {
              score = minimax(currentBoard, depth - 1, alpha, beta, !isMaximizingPlayer, isEndgame, ply + 1, player, aiPlayer);
            }
          }
        }
      }
      }
    } finally {
      undoMove(currentBoard, flipped, p);
    }

    if (isMaximizingPlayer) {
      if (score > bestScore) bestScore = score;
      if (score > alpha) alpha = score;
    } else {
      if (score < bestScore) bestScore = score;
      if (score < beta) beta = score;
    }

    if (alpha >= beta) {
      if (USE_KILLER_HISTORY) {
        const killers = killerMoves[ply] || [];
        if (!killers[0] || killers[0][0] !== row || killers[0][1] !== col) {
          killers[1] = killers[0];
          killers[0] = [row, col];
          killerMoves[ply] = killers;
        }
        const histKey = `${p}-${row},${col}`;
        historyTable.set(histKey, (historyTable.get(histKey) || 0) + depth * depth);
      }
      break;
    }
  }

  let flag = 'EXACT';
  if (bestScore <= originalAlpha) flag = 'UPPERBOUND';
  else if (bestScore >= beta) flag = 'LOWERBOUND';
  ttSet(hash, { score: bestScore, depth, flag });

  return bestScore;
}

/* =========================
   Minimax Root (ID + aspiration)
   ========================= */
function findBestMoveWithMinimax(board, searchDepth, alpha, beta, player, aiPlayer) {
  let bestScore = -Infinity;
  let bestMove = null;
  const validMoves = getValidMoves(aiPlayer, board);
  if (validMoves.length === 0) {
    const emptySquares = board.reduce((s, row) => s + row.filter(v => v === 0).length, 0);
    const isEndgame = emptySquares <= ENDGAME_THRESHOLD;
    return { move: null, score: evaluateBoard(board, isEndgame, player, aiPlayer) };
  }

  orderMoves(validMoves, 0, aiPlayer, board);
  const emptySquares = board.reduce((s, row) => s + row.filter(v => v === 0).length, 0);
  const isEndgame = emptySquares <= ENDGAME_THRESHOLD;
  const depth = isEndgame ? emptySquares : searchDepth;

  for (const [row, col] of validMoves) {
    if (shouldAbort()) throw new SearchAbort();
    const flipped = flipPieces(board, row, col, aiPlayer);
    const score = minimax(board, depth, alpha, beta, false, isEndgame, 1, player, aiPlayer);
    undoMove(board, flipped, aiPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestMove = [row, col];
    }
    alpha = Math.max(alpha, bestScore);
    if (alpha >= beta) break;
  }
  return { move: bestMove, score: bestScore };
}

function iterativeDeepening(board, maxDepth, timeLimitMs, isMaximizing, isEndgame, player, aiPlayer) {
  resetSearch();
  if (!zobristKeys) initZobrist();
  searchDeadline = nowMs() + timeLimitMs;
  pvStableScore = 0; lastPV = null;

  let bestMove = null;
  let lastScore = 0;

  for (let depth = 1; depth <= maxDepth; depth++) {
    if (shouldAbort()) break;

    const margin = 64;
    let alpha = lastScore - margin;
    let beta = lastScore + margin;

    let result;
    if (isMaximizing) {
      result = findBestMoveWithMinimax(board, depth, alpha, beta, player, aiPlayer);
      if (result.score <= alpha || result.score >= beta) {
        result = findBestMoveWithMinimax(board, depth, -Infinity, Infinity, player, aiPlayer);
      }
      if (result.move) bestMove = result.move;
    } else {
      let score = minimax(board, depth, alpha, beta, false, isEndgame, 0, player, aiPlayer);
      if (score <= alpha || score >= beta) {
        score = minimax(board, depth, -Infinity, Infinity, false, isEndgame, 0, player, aiPlayer);
      }
      result = { move: null, score };
    }
    lastScore = result.score;
    updatePvStability(result.move);
  }

  const emptySquares = board.reduce((s, row) => s + row.filter(v => v === 0).length, 0);
  const effDepth = Math.min(maxDepth, isEndgame ? emptySquares : maxDepth);
  return { move: bestMove, score: lastScore, depth: effDepth, nodes: nodeCount, pvStability: pvStableScore };
}

/* =========================
   PVS Core
   ========================= */
function pvs(currentBoard, depth, alpha, beta, isMaximizing, isEndgame, ply, player = 1, aiPlayer = 2) {
  if (shouldAbort()) throw new SearchAbort();
  nodeCount++;

  const side = isMaximizing ? aiPlayer : player;
  const hash = computeZobristHash(currentBoard, side);
  const ttEntry = transpositionTable.get(hash);
  if (ttEntry && ttEntry.depth >= depth) {
    if (ttEntry.flag === 'EXACT') return ttEntry.score;
    if (ttEntry.flag === 'LOWERBOUND' && ttEntry.score > alpha) alpha = ttEntry.score;
    if (ttEntry.flag === 'UPPERBOUND' && ttEntry.score < beta) beta = ttEntry.score;
    if (alpha >= beta) return ttEntry.score;
  }

  if (depth === 0) {
    return evaluateBoard(currentBoard, isEndgame, player, aiPlayer);
  }

  const p = side;
  let moves = getValidMoves(p, currentBoard);

  if (moves.length === 0) {
    if (isEndgame) {
      const opp = (p === aiPlayer) ? player : aiPlayer;
      if (getValidMoves(opp, currentBoard).length === 0) {
        return evaluateBoard(currentBoard, true, player, aiPlayer);
      }
      return pvs(currentBoard, depth, alpha, beta, !isMaximizing, isEndgame, ply + 1, player, aiPlayer);
    }
    return pvs(currentBoard, depth - 1, alpha, beta, !isMaximizing, isEndgame, ply + 1, player, aiPlayer);
  }

  orderMoves(moves, ply, p, currentBoard);
  moves = ttBestMoveFirst(moves, ply, p, currentBoard);

  let bestScore = isMaximizing ? -Infinity : Infinity;
  const originalAlpha = alpha;
  let bestMove = null;
  let first = true;

  for (let i = 0; i < moves.length; i++) {
    if (shouldAbort()) throw new SearchAbort();

    const [r, c] = moves[i];
    const flipped = flipPieces(currentBoard, r, c, p);
    let score;
    try {
      if (first) {
        score = pvs(currentBoard, depth - 1, alpha, beta, !isMaximizing, isEndgame, ply + 1, player, aiPlayer);
        first = false;
      } else {
        // Optional ProbCut pruning at interior nodes when enabled
        if (!isEndgame && PROBCUT.enabled && depth >= PROBCUT.minDepth) {
          if (isMaximizing) {
            const probe = pvs(
              currentBoard,
              depth - PROBCUT.r,
              beta - PROBCUT.margin,
              beta,
              !isMaximizing,
              isEndgame,
              ply + 1,
              player,
              aiPlayer
            );
            if (probe >= beta) {
              score = probe;
            }
          } else {
            const probe = pvs(
              currentBoard,
              depth - PROBCUT.r,
              alpha,
              alpha + PROBCUT.margin,
              !isMaximizing,
              isEndgame,
              ply + 1,
              player,
              aiPlayer
            );
            if (probe <= alpha) {
              score = probe;
            }
          }
        }
        if (score === undefined) {
        const canReduce = USE_LMR && depth >= 3 && i >= 3 && !isImportantMove(r, c);
        if (isMaximizing) {
          const narrowA = alpha;
          const narrowB = alpha + 1;
          score = pvs(currentBoard, depth - (canReduce ? 2 : 1), narrowA, narrowB, !isMaximizing, isEndgame, ply + 1, player, aiPlayer);
          if (score > alpha && score < beta) {
            score = pvs(currentBoard, depth - 1, alpha, beta, !isMaximizing, isEndgame, ply + 1, player, aiPlayer);
          }
        } else {
          const narrowA = beta - 1;
          const narrowB = beta;
          score = pvs(currentBoard, depth - (canReduce ? 2 : 1), narrowA, narrowB, !isMaximizing, isEndgame, ply + 1, player, aiPlayer);
          if (score < beta && score > alpha) {
            score = pvs(currentBoard, depth - 1, alpha, beta, !isMaximizing, isEndgame, ply + 1, player, aiPlayer);
          }
        }
        }
      }
    } finally {
      undoMove(currentBoard, flipped, p);
    }

    if (isMaximizing) {
      if (score > bestScore) { bestScore = score; bestMove = [r, c]; }
      if (score > alpha) alpha = score;
    } else {
      if (score < bestScore) { bestScore = score; bestMove = [r, c]; }
      if (score < beta) beta = score;
    }

    if (alpha >= beta) {
      if (USE_KILLER_HISTORY) {
        const killers = killerMoves[ply] || [];
        if (!killers[0] || killers[0][0] !== r || killers[0][1] !== c) {
          killers[1] = killers[0];
          killers[0] = [r, c];
          killerMoves[ply] = killers;
        }
        const histKey = `${p}-${r},${c}`;
        historyTable.set(histKey, (historyTable.get(histKey) || 0) + depth * depth);
      }
      break;
    }
  }

  let flag = 'EXACT';
  if (bestScore <= originalAlpha) flag = 'UPPERBOUND';
  else if (bestScore >= beta) flag = 'LOWERBOUND';
  ttSet(hash, { score: bestScore, depth, flag, best: bestMove });

  return bestScore;
}

// TT best move first at root
function ttBestMoveFirst(validMoves, ply, side, board) {
  const hash = computeZobristHash(board, side);
  const ttEntry = transpositionTable.get(hash);
  if (!ttEntry || !ttEntry.best) return validMoves;
  const [br, bc] = ttEntry.best;
  const idx = validMoves.findIndex(([r, c]) => r === br && c === bc);
  if (idx > 0) {
    const m = validMoves[idx];
    validMoves.splice(idx, 1);
    validMoves.unshift(m);
  }
  return validMoves;
}

/* =========================
   PVS Root (ID + aspiration)
   ========================= */
function findBestMoveWithPVS(board, depth, alpha, beta, player = 1, aiPlayer = 2, isEndgame = false) {
  const p = aiPlayer;
  let moves = getValidMoves(p, board);
  if (moves.length === 0) return { move: null, score: evaluateBoard(board, isEndgame, player, aiPlayer) };

  orderMoves(moves, 0, p, board);
  moves = ttBestMoveFirst(moves, 0, p, board);

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (let i = 0; i < moves.length; i++) {
    if (shouldAbort()) throw new SearchAbort();

    const [r, c] = moves[i];
    const flipped = flipPieces(board, r, c, p);
    let score;
    try {
      if (i === 0) {
        score = pvs(board, depth - 1, alpha, beta, false, isEndgame, 1, player, aiPlayer);
      } else {
        score = pvs(board, depth - 1, alpha, alpha + 1, false, isEndgame, 1, player, aiPlayer);
        if (score > alpha && score < beta) {
          score = pvs(board, depth - 1, alpha, beta, false, isEndgame, 1, player, aiPlayer);
        }
      }
    } finally {
      undoMove(board, flipped, p);
    }
    if (score > bestScore) { bestScore = score; bestMove = [r, c]; }
    if (score > alpha) alpha = score;
  }

  return { move: bestMove, score: bestScore };
}

function iterativeDeepeningPVS(board, maxDepth, timeLimitMs, isMaximizing, isEndgame, player, aiPlayer) {
  resetSearch();
  if (!zobristKeys) initZobrist();
  searchDeadline = nowMs() + timeLimitMs;
  pvStableScore = 0; lastPV = null;

  let bestMove = null;
  let lastScore = 0;
  let alpha = -Infinity, beta = Infinity;

  for (let depth = 1; depth <= maxDepth; depth++) {
    if (shouldAbort()) break;

    const margin = Math.max(24, Math.floor(Math.abs(lastScore) * 0.15) + 12);
    alpha = Math.max(-Infinity, lastScore - margin);
    beta = Math.min(Infinity, lastScore + margin);

    try {
      const result = isMaximizing
        ? findBestMoveWithPVS(board, depth, alpha, beta, player, aiPlayer, isEndgame)
        : { move: null, score: pvs(board, depth, alpha, beta, false, isEndgame, 0, player, aiPlayer) };

      if (result.move) bestMove = result.move;
      lastScore = result.score;
      if (lastScore <= alpha || lastScore >= beta) {
        const retry = isMaximizing
          ? findBestMoveWithPVS(board, depth, -Infinity, Infinity, player, aiPlayer, isEndgame)
          : { move: null, score: pvs(board, depth, -Infinity, Infinity, false, isEndgame, 0, player, aiPlayer) };
        if (retry.move) bestMove = retry.move;
        lastScore = retry.score;
      }
      updatePvStability(result.move);
    } catch (e) {
      if (e instanceof SearchAbort) break;
      throw e;
    }
  }

  const emptySquares = board.reduce((s, row) => s + row.filter(v => v === 0).length, 0);
  const effDepth = Math.min(maxDepth, isEndgame ? emptySquares : maxDepth);
  return { move: bestMove, score: lastScore, depth: effDepth, nodes: nodeCount, pvStability: pvStableScore };
}

/* =========================
   Public API
   ========================= */
function searchBestMove(board, options = {}) {
  const {
    maxDepth = 4,
    timeLimitMs = 200,
    isMaximizing = true,
    isEndgame: forceEndgame = false,
    player = 1,
    aiPlayer = 2,
    algorithm = 'pvs'
  } = options;

  const emptySquares = board.reduce((s, row) => s + row.filter(v => v === 0).length, 0);
  const isEndgame = forceEndgame || emptySquares <= ENDGAME_THRESHOLD;
  const depth = isEndgame ? emptySquares : maxDepth;

  if (!zobristKeys) initZobrist();

  switch (algorithm) {
    case 'pvs':
    case 'negascout': // alias
      return iterativeDeepeningPVS(board, depth, timeLimitMs, isMaximizing, isEndgame, player, aiPlayer);
    case 'minimax':
    default:
      return iterativeDeepening(board, depth, timeLimitMs, isMaximizing, isEndgame, player, aiPlayer);
  }
}

const api = {
  searchBestMove,
  minimax: (board, depth, alpha, beta, isMaximizing, isEndgame, ply, player, aiPlayer) =>
    minimax(board, depth, alpha, beta, isMaximizing, isEndgame, ply, player, aiPlayer),
  resetSearch,
  getNodeCount
};

export default api;
