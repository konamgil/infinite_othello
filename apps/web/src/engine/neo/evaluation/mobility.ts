// Mobility analysis functions
// Converted from ai.js mobility and potential mobility calculations

import type { Board, Player, Position } from '../../types';
import { getValidMoves } from '../../core';
import { DIRECTIONS } from './weights';

/**
 * Count current valid moves for a player
 * Uses the optimized bitboard-based getValidMoves from core
 */
export function getCurrentMobility(board: Board, player: Player): number {
  return getValidMoves(board, player).length;
}

/**
 * Count potential mobility - empty squares adjacent to opponent discs
 * Represents potential future mobility as the game develops
 */
export function getPotentialMobility(board: Board, player: Player): number {
  const opponent: Player = player === 'black' ? 'white' : 'black';
  let count = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      // Only consider empty squares
      if (board[r][c] !== null) continue;

      // Check if this empty square is adjacent to opponent disc
      let adjacentToOpponent = false;
      for (const [dr, dc] of DIRECTIONS) {
        const nr = r + dr;
        const nc = c + dc;

        if (
          nr >= 0 && nr < 8 &&
          nc >= 0 && nc < 8 &&
          board[nr][nc] === opponent
        ) {
          adjacentToOpponent = true;
          break;
        }
      }

      if (adjacentToOpponent) count++;
    }
  }

  return count;
}

/**
 * Analyze mobility difference between players
 * Returns positive value if current player has mobility advantage
 */
export function getMobilityAdvantage(
  board: Board,
  player: Player,
  opponent: Player
): {
  currentMobility: number;
  potentialMobility: number;
  mobilityDiff: number;
  potentialMobilityDiff: number;
} {
  const currentPlayer = getCurrentMobility(board, player);
  const currentOpponent = getCurrentMobility(board, opponent);
  const potentialPlayer = getPotentialMobility(board, player);
  const potentialOpponent = getPotentialMobility(board, opponent);

  return {
    currentMobility: currentPlayer,
    potentialMobility: potentialPlayer,
    mobilityDiff: currentPlayer - currentOpponent,
    potentialMobilityDiff: potentialPlayer - potentialOpponent,
  };
}

/**
 * Check if a position is strategically important (corner)
 * Used for move prioritization
 */
export function isImportantMove(position: Position): boolean {
  const { row, col } = position;
  return (
    (row === 0 || row === 7) &&
    (col === 0 || col === 7)
  );
}

/**
 * Count empty squares on the board
 * Used for game phase detection
 */
export function countEmptySquares(board: Board): number {
  let count = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === null) count++;
    }
  }
  return count;
}

/**
 * Calculate disc count for both players
 */
export function calculateDiscCounts(board: Board): { black: number; white: number } {
  let black = 0;
  let white = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (cell === 'black') black++;
      else if (cell === 'white') white++;
    }
  }

  return { black, white };
}