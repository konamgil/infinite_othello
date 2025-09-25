// Main heuristic evaluation function
// Converted and optimized from ai.js heuristicEvaluate

import type { Board, Player } from '../../../types';
import { getEvaluationWeights, POSITIONAL_WEIGHTS, CORNER_DATA } from './weights';
import {
  countStableDiscs,
  countEdgeStableDiscs,
  countEdgeDiscs,
  countFrontierDiscs
} from './stability';
import {
  getMobilityAdvantage,
  countEmptySquares,
  calculateDiscCounts,
  getPotentialMobility
} from './mobility';

/**
 * Comprehensive heuristic board evaluation
 * Combines multiple strategic factors with dynamic weighting
 */
export function evaluateBoard(
  board: Board,
  player: Player,
  isEndgame: boolean = false
): number {
  // In endgame, just count discs
  if (isEndgame) {
    const counts = calculateDiscCounts(board);
    const playerCount = counts[player];
    const opponentCount = player === 'black' ? counts.white : counts.black;
    return playerCount - opponentCount;
  }

  const opponent: Player = player === 'black' ? 'white' : 'black';
  const empties = countEmptySquares(board);
  const weights = getEvaluationWeights(empties);

  let totalScore = 0;

  // 1. Positional Score (piece-square table)
  let positionalScore = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (cell === player) {
        positionalScore += POSITIONAL_WEIGHTS[r][c];
      } else if (cell === opponent) {
        positionalScore -= POSITIONAL_WEIGHTS[r][c];
      }
    }
  }

  // 2. Mobility Scores
  const mobility = getMobilityAdvantage(board, player, opponent);
  const mobilityScore = weights.mobility * mobility.mobilityDiff;
  const potentialMobilityScore = weights.pmob * mobility.potentialMobilityDiff;

  // 3. Stability Scores
  const playerStable = countStableDiscs(board, player);
  const opponentStable = countStableDiscs(board, opponent);
  const stabilityScore = weights.stability * (playerStable - opponentStable);

  // 4. Frontier Score (fewer frontier discs is better)
  const playerFrontier = countFrontierDiscs(board, player);
  const opponentFrontier = countFrontierDiscs(board, opponent);
  const frontierScore = weights.frontier * (opponentFrontier - playerFrontier);

  // 5. Parity Score (who makes the last move)
  const parityScore = (empties % 2 === (player === 'black' ? 1 : 0))
    ? weights.parity
    : -weights.parity;

  // 6. Edge Stability Score
  const playerEdgeStable = countEdgeStableDiscs(board, player);
  const opponentEdgeStable = countEdgeStableDiscs(board, opponent);
  const edgeStabilityScore = weights.edge * (playerEdgeStable - opponentEdgeStable);

  // 7. Edge Occupancy Score
  const playerEdgeOcc = countEdgeDiscs(board, player);
  const opponentEdgeOcc = countEdgeDiscs(board, opponent);
  const edgeOccScore = weights.edgeOcc * (playerEdgeOcc - opponentEdgeOcc);

  // 8. Corner, X-square, and C-square Analysis
  let cornerScore = 0;
  let xSquareScore = 0;
  let cSquareScore = 0;

  for (const { corner, x, c } of CORNER_DATA) {
    const [cr, cc] = corner;
    const [xr, xc] = x;

    const cornerCell = board[cr][cc];

    if (cornerCell === player) {
      cornerScore += weights.corner;
    } else if (cornerCell === opponent) {
      cornerScore -= weights.corner;
    } else {
      // Corner is empty - penalize adjacent dangerous squares
      const xCell = board[xr][xc];
      if (xCell === player) {
        xSquareScore -= weights.x;
      } else if (xCell === opponent) {
        xSquareScore += weights.x;
      }

      // Check C-squares (adjacent to corner)
      for (const [pr, pc] of c) {
        const cCell = board[pr][pc];
        if (cCell === player) {
          cSquareScore -= weights.c;
        } else if (cCell === opponent) {
          cSquareScore += weights.c;
        }
      }
    }
  }

  // Combine all scores
  totalScore =
    positionalScore +
    mobilityScore +
    potentialMobilityScore +
    stabilityScore +
    frontierScore +
    parityScore +
    edgeStabilityScore +
    edgeOccScore +
    cornerScore +
    xSquareScore +
    cSquareScore;

  return totalScore;
}

/**
 * Quick evaluation for move ordering
 * Uses simplified metrics for faster computation
 */
export function quickEvaluate(board: Board, player: Player): number {
  const opponent: Player = player === 'black' ? 'white' : 'black';

  let score = 0;

  // Simple positional score
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (cell === player) {
        score += POSITIONAL_WEIGHTS[r][c];
      } else if (cell === opponent) {
        score -= POSITIONAL_WEIGHTS[r][c];
      }
    }
  }

  // Quick corner check
  const corners = [[0, 0], [0, 7], [7, 0], [7, 7]] as const;
  for (const [r, c] of corners) {
    const cell = board[r][c];
    if (cell === player) score += 100;
    else if (cell === opponent) score -= 100;
  }

  return score;
}

/**
 * Check if game is in endgame phase
 */
export function isEndgamePhase(board: Board, threshold: number = 12): boolean {
  return countEmptySquares(board) <= threshold;
}