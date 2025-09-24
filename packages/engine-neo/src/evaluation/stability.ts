// Stability analysis functions
// Converted from ai.js countStableDiscs and countEdgeStableDiscs

import type { Board, Player } from 'shared-types';
import { DIRECTIONS } from './weights';

/**
 * Count stable discs that cannot be flipped
 * Focuses on corner-based stability
 */
export function countStableDiscs(board: Board, player: Player): number {
  const stable = new Set<string>();
  const playerValue = player === 'black' ? 1 : 2;

  // Corner positions and their expansion directions
  const corners = [
    {
      pos: [0, 0] as const,
      dirs: [[0, 1], [1, 0]] as const,
    },
    {
      pos: [0, 7] as const,
      dirs: [[0, -1], [1, 0]] as const,
    },
    {
      pos: [7, 0] as const,
      dirs: [[-1, 0], [0, 1]] as const,
    },
    {
      pos: [7, 7] as const,
      dirs: [[-1, 0], [0, -1]] as const,
    },
  ];

  // Check each corner
  for (const { pos: [r, c], dirs } of corners) {
    const cell = board[r][c];
    if (cell !== player) continue;

    // Corner is stable
    stable.add(`${r},${c}`);

    // Expand stability along edges from corner
    for (const [dr, dc] of dirs) {
      let nr = r + dr;
      let nc = c + dc;

      // Continue while we find our pieces
      while (
        nr >= 0 && nr < 8 &&
        nc >= 0 && nc < 8 &&
        board[nr][nc] === player
      ) {
        stable.add(`${nr},${nc}`);
        nr += dr;
        nc += dc;
      }
    }
  }

  return stable.size;
}

/**
 * Count edge-stable discs from corners
 * More refined stability analysis for edge positions
 */
export function countEdgeStableDiscs(board: Board, player: Player): number {
  const stable = new Set<string>();

  function traverse(r: number, c: number, dr: number, dc: number) {
    while (
      r >= 0 && r < 8 &&
      c >= 0 && c < 8 &&
      board[r][c] === player
    ) {
      stable.add(`${r},${c}`);
      r += dr;
      c += dc;
    }
  }

  // Check corners and expand along edges
  const corners = [[0, 0], [0, 7], [7, 0], [7, 7]] as const;

  for (const [r, c] of corners) {
    if (board[r][c] !== player) continue;

    // Expand from each corner along its edges
    if (r === 0 && c === 0) {
      traverse(r, c, 0, 1);  // East
      traverse(r, c, 1, 0);  // South
    } else if (r === 0 && c === 7) {
      traverse(r, c, 0, -1); // West
      traverse(r, c, 1, 0);  // South
    } else if (r === 7 && c === 0) {
      traverse(r, c, -1, 0); // North
      traverse(r, c, 0, 1);  // East
    } else if (r === 7 && c === 7) {
      traverse(r, c, -1, 0); // North
      traverse(r, c, 0, -1); // West
    }
  }

  return stable.size;
}

/**
 * Count discs on the board edges (regardless of stability)
 * Used for late-game edge control evaluation
 */
export function countEdgeDiscs(board: Board, player: Player): number {
  let count = 0;

  // Top and bottom edges
  for (let c = 0; c < 8; c++) {
    if (board[0][c] === player) count++;
    if (board[7][c] === player) count++;
  }

  // Left and right edges (excluding corners already counted)
  for (let r = 1; r < 7; r++) {
    if (board[r][0] === player) count++;
    if (board[r][7] === player) count++;
  }

  return count;
}

/**
 * Count frontier discs (discs adjacent to at least one empty square)
 * Frontier discs are vulnerable as they can potentially be flanked
 */
export function countFrontierDiscs(board: Board, player: Player): number {
  let count = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] !== player) continue;

      // Check if adjacent to any empty square
      let isFrontier = false;
      for (const [dr, dc] of DIRECTIONS) {
        const nr = r + dr;
        const nc = c + dc;

        if (
          nr < 0 || nr >= 8 ||
          nc < 0 || nc >= 8 ||
          board[nr][nc] === null
        ) {
          isFrontier = true;
          break;
        }
      }

      if (isFrontier) count++;
    }
  }

  return count;
}