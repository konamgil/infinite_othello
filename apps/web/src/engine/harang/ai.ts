
import { getWeights, type DifficultyKey, type DifficultyWeights } from './weights';

export type NumericPlayer = 1 | 2;
export type NumericCell = 0 | NumericPlayer;
export type NumericBoard = NumericCell[][];
export type NumericMove = [number, number];

type NnEvalFn = ((board: NumericBoard, player: NumericPlayer) => number) | null;

let nnEval: NnEvalFn = null;

export async function initNnEval(): Promise<void> {
  try {
    const module = await import('./nn-eval.js');
    if (typeof module.nnEvaluate === 'function') {
      nnEval = module.nnEvaluate as NnEvalFn;
    }
  } catch (e) {
    nnEval = null;
  }
}

const boardSize = 8;

type EvaluationTable = number[][];

const evaluationTable: EvaluationTable = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120],
];

let weightConfig: DifficultyWeights = getWeights('medium');
let STABLE_DISC_WEIGHT = 50;
let CORNER_WEIGHT = 30;
let X_SQUARE_PENALTY = 20;
let C_SQUARE_PENALTY = 15;
let FRONTIER_WEIGHT = 15;
let PARITY_BONUS = 10;
let EDGE_STABILITY_WEIGHT = 25;

function loadWeights(level: DifficultyKey): void {
  weightConfig = getWeights(level);
  STABLE_DISC_WEIGHT = weightConfig.STABLE_DISC_WEIGHT;
  CORNER_WEIGHT = weightConfig.CORNER_WEIGHT;
  X_SQUARE_PENALTY = weightConfig.X_SQUARE_PENALTY;
  C_SQUARE_PENALTY = weightConfig.C_SQUARE_PENALTY;
  FRONTIER_WEIGHT = weightConfig.FRONTIER_WEIGHT;
  PARITY_BONUS = weightConfig.PARITY_BONUS;
  EDGE_STABILITY_WEIGHT = weightConfig.EDGE_STABILITY_WEIGHT;
}

const globalAny = globalThis as typeof globalThis & {
  AI_LEVEL?: DifficultyKey;
  AI_DIFFICULTY?: DifficultyKey;
};

const initialLevel = globalAny.AI_LEVEL || globalAny.AI_DIFFICULTY || 'medium';
loadWeights(initialLevel);

export function setWeightLevel(level: DifficultyKey): void {
  loadWeights(level);
}

const NN_MIX_WEIGHT = 0.5;

export function isImportantMove(row: number, col: number): boolean {
  return (
    (row === 0 || row === boardSize - 1) &&
    (col === 0 || col === boardSize - 1)
  );
}

export interface ZobristKeys {
  pieces: number[][];
  turn: number;
}

export function initializeZobrist(bs: number = boardSize): ZobristKeys {
  const zobristKeys: ZobristKeys = {
    pieces: Array(3)
      .fill(0)
      .map(() => Array(bs * bs).fill(0)),
    turn: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
  };

  for (let i = 1; i <= 2; i++) {
    for (let j = 0; j < bs * bs; j++) {
      zobristKeys.pieces[i][j] = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    }
  }

  return zobristKeys;
}

export function calculateScores(currentBoard: NumericBoard): { black: number; white: number } {
  let black = 0;
  let white = 0;
  currentBoard.forEach((row) =>
    row.forEach((cell) => {
      if (cell === 1) black += 1;
      if (cell === 2) white += 1;
    }),
  );
  return { black, white };
}

export function isValidMove(row: number, col: number, player: NumericPlayer, currentBoard: NumericBoard): boolean {
  if (row < 0 || row >= boardSize || col < 0 || col >= boardSize || currentBoard[row][col] !== 0) {
    return false;
  }

  const opponent: NumericPlayer = player === 1 ? 2 : 1;
  const directions: NumericMove[] = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;
    let foundOpponent = false;

    while (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
      const cell = currentBoard[r][c];
      if (cell === opponent) {
        foundOpponent = true;
        r += dr;
        c += dc;
        continue;
      }
      if (cell === player && foundOpponent) {
        return true;
      }
      break;
    }
  }

  return false;
}

export function getValidMoves(board: NumericBoard, player: NumericPlayer): NumericMove[] {
  const moves: NumericMove[] = [];
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (isValidMove(row, col, player, board)) {
        moves.push([row, col]);
      }
    }
  }
  return moves;
}

export function flipPieces(board: NumericBoard, row: number, col: number, player: NumericPlayer): NumericBoard {
  const opponent: NumericPlayer = player === 1 ? 2 : 1;
  const newBoard = board.map((r) => [...r]);
  newBoard[row][col] = player;

  const directions: NumericMove[] = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (const [dr, dc] of directions) {
    const flips: NumericMove[] = [];
    let r = row + dr;
    let c = col + dc;

    while (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
      const cell = newBoard[r][c];
      if (cell === opponent) {
        flips.push([r, c]);
        r += dr;
        c += dc;
        continue;
      }
      if (cell === player) {
        for (const [fr, fc] of flips) {
          newBoard[fr][fc] = player;
        }
      }
      break;
    }
  }

  return newBoard;
}

export function undoMove(board: NumericBoard, original: NumericBoard): NumericBoard {
  return original.map((row) => [...row]);
}

export function countStableDiscs(board: NumericBoard, player: NumericPlayer): number {
  let count = 0;
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (board[row][col] === player && isImportantMove(row, col)) {
        count += 1;
      }
    }
  }
  return count;
}

export function countFrontierDiscs(board: NumericBoard, player: NumericPlayer): number {
  let count = 0;
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (board[row][col] !== player) continue;
      const directions: NumericMove[] = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ];
      for (const [dr, dc] of directions) {
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === 0) {
          count += 1;
          break;
        }
      }
    }
  }
  return count;
}

export function countEdgeStableDiscs(board: NumericBoard, player: NumericPlayer): number {
  let count = 0;
  for (let i = 0; i < boardSize; i++) {
    if (board[0][i] === player) count += 1;
    if (board[boardSize - 1][i] === player) count += 1;
    if (board[i][0] === player) count += 1;
    if (board[i][boardSize - 1] === player) count += 1;
  }
  return count;
}

export function countEdgeDiscs(board: NumericBoard, player: NumericPlayer): number {
  let count = 0;
  for (let i = 0; i < boardSize; i++) {
    if (board[0][i] === player) count += 1;
    if (board[boardSize - 1][i] === player) count += 1;
    if (board[i][0] === player) count += 1;
    if (board[i][boardSize - 1] === player) count += 1;
  }
  return count;
}

function cornerOccupancy(board: NumericBoard, player: NumericPlayer): number {
  let count = 0;
  const corners: NumericMove[] = [
    [0, 0],
    [0, boardSize - 1],
    [boardSize - 1, 0],
    [boardSize - 1, boardSize - 1],
  ];
  for (const [r, c] of corners) {
    if (board[r][c] === player) count += 1;
  }
  return count;
}

function xSquarePenalty(board: NumericBoard, player: NumericPlayer): number {
  const xSquares: NumericMove[] = [
    [1, 1],
    [1, boardSize - 2],
    [boardSize - 2, 1],
    [boardSize - 2, boardSize - 2],
  ];
  let penalty = 0;
  for (const [r, c] of xSquares) {
    if (board[r][c] === player) penalty += 1;
  }
  return penalty;
}

function cSquarePenalty(board: NumericBoard, player: NumericPlayer): number {
  const cSquares: NumericMove[] = [
    [0, 1],
    [1, 0],
    [0, boardSize - 2],
    [1, boardSize - 1],
    [boardSize - 1, 1],
    [boardSize - 2, 0],
    [boardSize - 1, boardSize - 2],
    [boardSize - 2, boardSize - 1],
  ];
  let penalty = 0;
  for (const [r, c] of cSquares) {
    if (board[r][c] === player) penalty += 1;
  }
  return penalty;
}

function frontierDiscs(board: NumericBoard, player: NumericPlayer): number {
  return countFrontierDiscs(board, player);
}

function parityScore(board: NumericBoard, player: NumericPlayer): number {
  const moves = getValidMoves(board, player);
  return moves.length % 2 === 0 ? -1 : 1;
}

function evaluateBoard(
  board: NumericBoard,
  isEndgame: boolean,
  player: NumericPlayer,
  aiPlayer: NumericPlayer,
  getValidMovesFn: (board: NumericBoard, player: NumericPlayer) => NumericMove[],
): number {
  const { black, white } = calculateScores(board);
  const discDiff = aiPlayer === 1 ? black - white : white - black;

  const cornerDiff = cornerOccupancy(board, aiPlayer) - cornerOccupancy(board, player);
  const xPenalty = xSquarePenalty(board, aiPlayer) - xSquarePenalty(board, player);
  const cPenalty = cSquarePenalty(board, aiPlayer) - cSquarePenalty(board, player);
  const stableDiff = countStableDiscs(board, aiPlayer) - countStableDiscs(board, player);
  const frontierDiff = frontierDiscs(board, aiPlayer) - frontierDiscs(board, player);
  const edgeDiff = countEdgeStableDiscs(board, aiPlayer) - countEdgeStableDiscs(board, player);
  const parityDiff = parityScore(board, aiPlayer) - parityScore(board, player);

  const positional = evaluationTable.reduce((sum, row, r) => sum + row.reduce((rowSum, value, c) => {
    const cell = board[r][c];
    if (cell === aiPlayer) return rowSum + value;
    if (cell === player) return rowSum - value;
    return rowSum;
  }, 0), 0);

  if (isEndgame) {
    return 100 * discDiff + 40 * stableDiff + 20 * cornerDiff - 15 * xPenalty - 10 * cPenalty;
  }

  return (
    positional +
    STABLE_DISC_WEIGHT * stableDiff +
    CORNER_WEIGHT * cornerDiff -
    X_SQUARE_PENALTY * xPenalty -
    C_SQUARE_PENALTY * cPenalty -
    FRONTIER_WEIGHT * frontierDiff +
    EDGE_STABILITY_WEIGHT * edgeDiff +
    PARITY_BONUS * parityDiff +
    discDiff
  );
}

export function evaluateBoardWithNN(
  board: NumericBoard,
  player: NumericPlayer,
  aiPlayer: NumericPlayer,
  getValidMovesFn: (board: NumericBoard, player: NumericPlayer) => NumericMove[],
): number {
  const emptySquares = board.reduce((sum, row) => sum + row.filter((cell) => cell === 0).length, 0);
  const isEndgame = emptySquares <= 10;

  const level = (globalAny.AI_LEVEL || globalAny.AI_DIFFICULTY || 'medium') as DifficultyKey;
  const useNN = level === 'nn' || level === 'mixed';
  const mixNN = level === 'mixed';

  let nnScore: number | undefined;
  if (useNN && !isEndgame && typeof nnEval === 'function') {
    try {
      nnScore = nnEval(board, aiPlayer);
      if (!mixNN && typeof nnScore === 'number') {
        return nnScore;
      }
    } catch {
      nnScore = undefined;
    }
  }

  const heuristic = evaluateBoard(board, isEndgame, player, aiPlayer, getValidMovesFn);

  if (mixNN && typeof nnScore === 'number') {
    return heuristic * (1 - NN_MIX_WEIGHT) + nnScore * NN_MIX_WEIGHT;
  }

  return heuristic;
}

export function scoreMoveForOrdering(move: NumericMove): number {
  const [r, c] = move;
  return evaluationTable[r][c];
}

export function killerPriority(move: NumericMove, killers: NumericMove[]): number {
  if (killers[0] && killers[0][0] === move[0] && killers[0][1] === move[1]) {
    return 2;
  }
  if (killers[1] && killers[1][0] === move[0] && killers[1][1] === move[1]) {
    return 1;
  }
  return 0;
}

export function orderMoves(
  moves: NumericMove[],
  ply: number,
  player: NumericPlayer,
  killerMoves: NumericMove[][],
  historyTable: Map<string, number>,
  useKillerHistory: boolean,
): void {
  if (!useKillerHistory) {
    moves.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));
    return;
  }

  const killers = killerMoves[ply] || [];
  moves.sort((a, b) => {
    const aKill = killerPriority(a, killers);
    const bKill = killerPriority(b, killers);
    if (aKill !== bKill) return bKill - aKill;

    const aHist = historyTable.get(`${player}-${a[0]},${a[1]}`) || 0;
    const bHist = historyTable.get(`${player}-${b[0]},${b[1]}`) || 0;
    if (aHist !== bHist) return bHist - aHist;

    return scoreMoveForOrdering(b) - scoreMoveForOrdering(a);
  });
}

export function computeZobristHash(board: NumericBoard, player: NumericPlayer, zobristKeys: ZobristKeys): number {
  let hash = 0;
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const piece = board[r][c];
      if (piece !== 0) {
        hash ^= zobristKeys.pieces[piece][r * boardSize + c];
      }
    }
  }
  if (player === 2) {
    hash ^= zobristKeys.turn;
  }
  return hash;
}

const api = {
  boardSize,
  evaluationTable,
  get STABLE_DISC_WEIGHT() {
    return STABLE_DISC_WEIGHT;
  },
  get CORNER_WEIGHT() {
    return CORNER_WEIGHT;
  },
  get X_SQUARE_PENALTY() {
    return X_SQUARE_PENALTY;
  },
  get C_SQUARE_PENALTY() {
    return C_SQUARE_PENALTY;
  },
  get FRONTIER_WEIGHT() {
    return FRONTIER_WEIGHT;
  },
  get PARITY_BONUS() {
    return PARITY_BONUS;
  },
  get EDGE_STABILITY_WEIGHT() {
    return EDGE_STABILITY_WEIGHT;
  },
  isImportantMove,
  initializeZobrist,
  calculateScores,
  isValidMove,
  getValidMoves,
  flipPieces,
  undoMove,
  countStableDiscs,
  countFrontierDiscs,
  countEdgeStableDiscs,
  countEdgeDiscs,
  evaluateBoard,
  scoreMoveForOrdering,
  killerPriority,
  orderMoves,
  computeZobristHash,
  setWeightLevel,
  scoreMovesFromRecords: null as null,
  evaluateBoardWithNN,
};

export default api;
