import type { GameCore, Board, Player, Position, MoveResult, GameResult, Score } from '../types';
import { BitBoard } from './bitboard';
/**
 * Create initial Othello game state
 */
export declare function createInitialGameCore(gameId?: string): GameCore;
/**
 * Get all valid moves for a player
 */
export declare function getValidMoves(board: Board, player: Player): Position[];
/**
 * Check if a move is valid
 */
export declare function isValidMove(board: Board, position: Position, player: Player): boolean;
/**
 * Apply a move and return the result
 */
export declare function makeMove(gameCore: GameCore, position: Position): MoveResult;
/**
 * Calculate score from board
 */
export declare function calculateScore(board: Board): Score;
/**
 * Check if game is over
 */
export declare function isGameOver(gameCore: GameCore): boolean;
/**
 * Get final game result
 */
export declare function getGameResult(gameCore: GameCore): GameResult | null;
/**
 * Get position hash for transposition tables
 */
export declare function getPositionHash(gameCore: GameCore): number;
/**
 * Check if position is terminal (game over)
 */
export declare function isTerminalPosition(gameCore: GameCore): boolean;
/**
 * Get mobility count (number of valid moves)
 */
export declare function getMobility(board: Board, player: Player): number;
/**
 * Get empty squares count
 */
export declare function getEmptySquares(board: Board): number;
/**
 * Convert GameCore to a format suitable for engines
 */
export declare function gameCoreForEngine(gameCore: GameCore): {
    board: BitBoard;
    currentPlayer: Player;
    validMoves: Position[];
    score: Score;
};
