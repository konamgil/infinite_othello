
import {
  type NumericBoard,
  type NumericMove,
  type NumericCell,
  type NumericPlayer,
  initializeZobrist,
  computeZobristHash,
  getValidMoves,
  flipPieces,
  orderMoves,
  evaluateBoardWithNN,
  killerPriority,
} from './ai';

export interface SearchOptions {
  maxDepth?: number;
  timeLimitMs?: number;
  isMaximizing?: boolean;
  isEndgame?: boolean;
  player?: NumericPlayer;
  aiPlayer?: NumericPlayer;
  algorithm?: 'negamax' | 'pvs';
}

export interface SearchResult {
  move: NumericMove | null;
  score: number;
  depth: number;
  nodes: number;
}

interface TranspositionEntry {
  depth: number;
  score: number;
  flag: 'exact' | 'alpha' | 'beta';
}

const DEFAULT_OPTIONS: Required<Pick<SearchOptions, 'maxDepth' | 'timeLimitMs' | 'isMaximizing' | 'player' | 'aiPlayer'>> = {
  maxDepth: 6,
  timeLimitMs: 5000,
  isMaximizing: true,
  player: 1,
  aiPlayer: 2,
};

const USE_KILLER_HISTORY = true;
const MAX_KILLERS = 2;

class SearchAbort extends Error {}

export function searchBestMove(board: NumericBoard, options: SearchOptions = {}): SearchResult {
  const merged: Required<SearchOptions> = {
    ...DEFAULT_OPTIONS,
    algorithm: 'negamax',
    isEndgame: options.isEndgame ?? false,
    ...options,
  };

  const start = performance.now();
  const zobrist = initializeZobrist();
  const killerMoves: NumericMove[][] = [];
  const historyTable = new Map<string, number>();
  const tt = new Map<number, TranspositionEntry>();

  let bestMove: NumericMove | null = null;
  let bestScore = -Infinity;
  let effectiveDepth = 0;
  let nodes = 0;

  const emptySquares = board.reduce((sum, row) => sum + row.filter((cell) => cell === 0).length, 0);
  const maxDepth = merged.isEndgame ? Math.max(emptySquares, 4) : merged.maxDepth;

  try {
    for (let depth = 1; depth <= maxDepth; depth += 1) {
      const result = negamax(
        board,
        depth,
        -Infinity,
        Infinity,
        merged.aiPlayer,
        merged.aiPlayer,
        merged.player === merged.aiPlayer,
        start,
        merged.timeLimitMs,
        killerMoves,
        historyTable,
        zobrist,
        tt,
        merged.isEndgame ?? false,
        0,
      );

      nodes += result.nodes;

      if (typeof result.score === 'number') {
        bestScore = result.score;
        bestMove = result.move ?? bestMove;
        effectiveDepth = depth;
      }
    }
  } catch (error) {
    if (!(error instanceof SearchAbort)) {
      throw error;
    }
  }

  return {
    move: bestMove,
    score: bestScore,
    depth: effectiveDepth,
    nodes,
  };
}

type NegamaxResult = { score: number; move: NumericMove | null; nodes: number };

type KillerMoves = NumericMove[][];

type TimeInfo = { start: number; limit: number };

function negamax(
  board: NumericBoard,
  depth: number,
  alpha: number,
  beta: number,
  currentPlayer: NumericPlayer,
  aiPlayer: NumericPlayer,
  maximizing: boolean,
  startTime: number,
  timeLimit: number,
  killerMoves: KillerMoves,
  historyTable: Map<string, number>,
  zobrist: ReturnType<typeof initializeZobrist>,
  tt: Map<number, TranspositionEntry>,
  isForcedEndgame: boolean,
  ply: number,
): NegamaxResult {
  const now = performance.now();
  if (now - startTime > timeLimit) {
    throw new SearchAbort('Timed out');
  }

  const nodesVisited = { count: 0 };

  const hash = computeZobristHash(board, currentPlayer, zobrist);
  const ttEntry = tt.get(hash);
  if (ttEntry && ttEntry.depth >= depth) {
    if (ttEntry.flag === 'exact') {
      return { score: ttEntry.score, move: null, nodes: 1 };
    }
    if (ttEntry.flag === 'alpha') {
      alpha = Math.max(alpha, ttEntry.score);
    } else if (ttEntry.flag === 'beta') {
      beta = Math.min(beta, ttEntry.score);
    }
    if (alpha >= beta) {
      return { score: ttEntry.score, move: null, nodes: 1 };
    }
  }

  const opponent: NumericPlayer = currentPlayer === 1 ? 2 : 1;
  const moves = getValidMoves(board, currentPlayer);
  const isEndgame = isForcedEndgame || board.every((row) => row.every((cell) => cell !== 0));

  if (depth === 0 || moves.length === 0) {
    const score = evaluateBoardWithNN(board, opponent, aiPlayer, getValidMoves);
    return { score: maximizing ? score : -score, move: null, nodes: 1 };
  }

  orderMoves(moves, ply, currentPlayer, killerMoves, historyTable, USE_KILLER_HISTORY);

  let bestScore = -Infinity;
  let bestMove: NumericMove | null = null;

  for (const move of moves) {
    const [row, col] = move;
    const originalBoard = board.map((r) => [...r]);
    const nextBoard = flipPieces(board, row, col, currentPlayer);

    const result = negamax(
      nextBoard,
      depth - 1,
      -beta,
      -alpha,
      opponent,
      aiPlayer,
      !maximizing,
      startTime,
      timeLimit,
      killerMoves,
      historyTable,
      zobrist,
      tt,
      isForcedEndgame,
      ply + 1,
    );

    const score = -result.score;
    nodesVisited.count += result.nodes + 1;

    // Restore board
    for (let r = 0; r < board.length; r++) {
      board[r] = [...originalBoard[r]] as NumericCell[];
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }

    alpha = Math.max(alpha, score);
    if (alpha >= beta) {
      if (!killerMoves[ply]) killerMoves[ply] = [];
      if (killerMoves[ply].length < MAX_KILLERS) {
        killerMoves[ply].push(move);
      }
      const key = `${currentPlayer}-${row},${col}`;
      historyTable.set(key, (historyTable.get(key) || 0) + depth * depth);
      break;
    }
  }

  const flag: TranspositionEntry['flag'] = bestScore <= alpha ? 'beta' : bestScore >= beta ? 'alpha' : 'exact';
  tt.set(hash, { depth, score: bestScore, flag });

  return { score: bestScore, move: bestMove, nodes: nodesVisited.count + 1 };
}

export default {
  searchBestMove,
};
