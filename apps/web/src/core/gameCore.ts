// Complete Othello game logic with unified type system
// Bridges shared-types (UI layer) ↔ bitboard (performance layer)

import type {
  GameCore,
  Board,
  Cell,
  Player,
  Position,
  Move,
  MoveResult,
  GameResult,
  Score,
  GameStatus,
  MoveFailureReason
} from '../types';

import {
  BitBoard,
  ensureBoard,
  getValidMovesBitboard,
  isValidMoveBitboard,
  flipPieces,
  undoMove,
  emptiesCount,
  computeZobristHash,
  MoveToken
} from './bitboard';

// ===== TYPE ADAPTERS =====

/**
 * Convert shared-types Board (2D Cell[][]) to BitBoard (1D Uint8Array)
 */
function boardToBitBoard(board: Board): BitBoard {
  const bitBoard = new Uint8Array(64) as BitBoard;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board[row][col];
      const index = row * 8 + col;

      if (cell === 'black') {
        bitBoard[index] = 1;
      } else if (cell === 'white') {
        bitBoard[index] = 2;
      } else {
        bitBoard[index] = 0;
      }
    }
  }

  return bitBoard;
}

/**
 * Convert BitBoard (1D Uint8Array) to shared-types Board (2D Cell[][])
 */
function bitBoardToBoard(bitBoard: BitBoard): Board {
  const board: Board = [];

  for (let row = 0; row < 8; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < 8; col++) {
      const index = row * 8 + col;
      const value = bitBoard[index];

      if (value === 1) {
        rowCells.push('black');
      } else if (value === 2) {
        rowCells.push('white');
      } else {
        rowCells.push(null);
      }
    }
    board.push(rowCells);
  }

  return board;
}

// ===== CORE GAME LOGIC =====

/**
 * Create initial Othello game state
 */
export function createInitialGameCore(gameId: string = crypto.randomUUID()): GameCore {
  // Create initial board with starting position
  const board: Board = Array.from({ length: 8 }, () => new Array<Cell>(8).fill(null));

  // Set initial pieces (center 4 squares)
  board[3][3] = 'white';
  board[3][4] = 'black';
  board[4][3] = 'black';
  board[4][4] = 'white';

  const validMoves = getValidMoves(board, 'black');

  return {
    id: gameId,
    board,
    currentPlayer: 'black',
    validMoves,
    score: { black: 2, white: 2 },
    status: 'playing',
    moveHistory: [],
    canUndo: false,
    canRedo: false
  };
}

/**
 * Get all valid moves for a player
 */
export function getValidMoves(board: Board, player: Player): Position[] {
  const bitBoard = ensureBoard(boardToBitBoard(board));
  return getValidMovesBitboard(player, bitBoard);
}

/**
 * Check if a move is valid
 */
export function isValidMove(board: Board, position: Position, player: Player): boolean {
  const bitBoard = ensureBoard(boardToBitBoard(board));
  return isValidMoveBitboard(position.row, position.col, player, bitBoard);
}

/**
 * Apply a move and return the result
 */
export function makeMove(gameCore: GameCore, position: Position): MoveResult {
  // Validate move
  if (gameCore.status !== 'playing') {
    return {
      success: false,
      reason: 'game_finished',
      message: 'Game is not in playing state'
    };
  }

  if (gameCore.currentPlayer === 'black' || gameCore.currentPlayer === 'white') {
    // Player validation passed
  } else {
    return {
      success: false,
      reason: 'not_your_turn',
      message: 'Invalid current player'
    };
  }

  const bitBoard = ensureBoard(boardToBitBoard(gameCore.board));

  if (!isValidMoveBitboard(position.row, position.col, gameCore.currentPlayer, bitBoard)) {
    if (bitBoard[position.row * 8 + position.col] !== 0) {
      return {
        success: false,
        reason: 'occupied',
        message: 'Position is already occupied'
      };
    } else {
      return {
        success: false,
        reason: 'no_captures',
        message: 'Move would not capture any pieces'
      };
    }
  }

  // Apply the move
  const moveToken = flipPieces(bitBoard, position.row, position.col, gameCore.currentPlayer);

  if (!moveToken) {
    return {
      success: false,
      reason: 'invalid_position',
      message: 'Failed to apply move'
    };
  }

  // Convert back to Board format
  const newBoard = bitBoardToBoard(bitBoard);

  // Determine captured cells by comparing old and new boards
  const capturedCells: Position[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (gameCore.board[row][col] !== newBoard[row][col] && !(row === position.row && col === position.col)) {
        capturedCells.push({ row, col });
      }
    }
  }

  // Create the move record
  const move: Move = {
    row: position.row,
    col: position.col,
    player: gameCore.currentPlayer,
    capturedCells,
    timestamp: Date.now()
  };

  // Calculate new score
  const newScore = calculateScore(newBoard);

  // Determine next player and status
  const nextPlayer: Player = gameCore.currentPlayer === 'black' ? 'white' : 'black';
  const nextValidMoves = getValidMoves(newBoard, nextPlayer);

  // Check if next player can move
  let actualNextPlayer = nextPlayer;
  let finalValidMoves = nextValidMoves;
  let gameStatus: GameStatus = 'playing';

  if (nextValidMoves.length === 0) {
    // Next player has no moves, check if current player can move
    const currentPlayerMoves = getValidMoves(newBoard, gameCore.currentPlayer);
    if (currentPlayerMoves.length === 0) {
      // Neither player can move - game over
      gameStatus = 'finished';
      finalValidMoves = [];
    } else {
      // Current player continues (skip next player's turn)
      actualNextPlayer = gameCore.currentPlayer;
      finalValidMoves = currentPlayerMoves;
    }
  }

  // Create new game state
  const newGameCore: GameCore = {
    ...gameCore,
    board: newBoard,
    currentPlayer: actualNextPlayer,
    validMoves: finalValidMoves,
    score: newScore,
    status: gameStatus,
    moveHistory: [...gameCore.moveHistory, move],
    canUndo: true,
    canRedo: false
  };

  return {
    success: true,
    move,
    newGameCore,
    capturedCells
  };
}

/**
 * Calculate score from board
 */
export function calculateScore(board: Board): Score {
  let black = 0;
  let white = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board[row][col];
      if (cell === 'black') black++;
      else if (cell === 'white') white++;
    }
  }

  return { black, white };
}

/**
 * Check if game is over
 */
export function isGameOver(gameCore: GameCore): boolean {
  if (gameCore.status === 'finished') return true;

  // Game is over if neither player has valid moves
  const currentPlayerMoves = getValidMoves(gameCore.board, gameCore.currentPlayer);
  if (currentPlayerMoves.length > 0) return false;

  const otherPlayer: Player = gameCore.currentPlayer === 'black' ? 'white' : 'black';
  const otherPlayerMoves = getValidMoves(gameCore.board, otherPlayer);

  return otherPlayerMoves.length === 0;
}

/**
 * Get final game result
 */
export function getGameResult(gameCore: GameCore): GameResult | null {
  if (!isGameOver(gameCore)) return null;

  const score = calculateScore(gameCore.board);
  let winner: Player | 'draw';

  if (score.black > score.white) {
    winner = 'black';
  } else if (score.white > score.black) {
    winner = 'white';
  } else {
    winner = 'draw';
  }

  return {
    winner,
    score,
    endReason: 'normal',
    duration: 0, // Should be calculated from game start time
    totalMoves: gameCore.moveHistory.length
  };
}

/**
 * Get position hash for transposition tables
 */
export function getPositionHash(gameCore: GameCore): number {
  const bitBoard = ensureBoard(boardToBitBoard(gameCore.board));
  return computeZobristHash(bitBoard, gameCore.currentPlayer);
}

/**
 * Check if position is terminal (game over)
 */
export function isTerminalPosition(gameCore: GameCore): boolean {
  return isGameOver(gameCore);
}

/**
 * Get mobility count (number of valid moves)
 */
export function getMobility(board: Board, player: Player): number {
  return getValidMoves(board, player).length;
}

/**
 * Get empty squares count
 */
export function getEmptySquares(board: Board): number {
  const bitBoard = ensureBoard(boardToBitBoard(board));
  return emptiesCount(bitBoard);
}

/**
 * Convert GameCore to a format suitable for engines
 */
export function gameCoreForEngine(gameCore: GameCore): {
  board: BitBoard;
  currentPlayer: Player;
  validMoves: Position[];
  score: Score;
} {
  const bitBoard = ensureBoard(boardToBitBoard(gameCore.board));

  return {
    board: bitBoard,
    currentPlayer: gameCore.currentPlayer,
    validMoves: [...gameCore.validMoves],
    score: gameCore.score
  };
}
