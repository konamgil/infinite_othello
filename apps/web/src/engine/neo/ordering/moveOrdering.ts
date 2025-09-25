// Move ordering system for search optimization
// Converted from ai.js and search-neo.js move ordering logic

import type { Position, Player, Board } from '../../../types';
import { POSITIONAL_WEIGHTS } from '../evaluation/weights';
import { isImportantMove } from '../evaluation/mobility';

/**
 * Killer moves storage - stores best moves that caused cutoffs
 */
export class KillerMoves {
  private moves: Map<number, Position[]> = new Map();
  private readonly maxKillersPerPly = 2;

  /**
   * Add a killer move for a specific ply
   */
  addKiller(ply: number, move: Position): void {
    if (!this.moves.has(ply)) {
      this.moves.set(ply, []);
    }

    const killers = this.moves.get(ply)!;

    // Remove if already exists
    const index = killers.findIndex(k => k.row === move.row && k.col === move.col);
    if (index !== -1) {
      killers.splice(index, 1);
    }

    // Add to front
    killers.unshift(move);

    // Keep only max killers
    if (killers.length > this.maxKillersPerPly) {
      killers.pop();
    }
  }

  /**
   * Get killer moves for a specific ply
   */
  getKillers(ply: number): Position[] {
    return this.moves.get(ply) || [];
  }

  /**
   * Get priority of a move based on killer heuristic
   */
  getKillerPriority(move: Position, ply: number): number {
    const killers = this.getKillers(ply);

    for (let i = 0; i < killers.length; i++) {
      const killer = killers[i];
      if (killer.row === move.row && killer.col === move.col) {
        return 2 - i; // First killer gets priority 2, second gets 1
      }
    }

    return 0;
  }

  /**
   * Clear killer moves (called between searches)
   */
  clear(): void {
    this.moves.clear();
  }
}

/**
 * History heuristic - tracks successful moves
 */
export class HistoryTable {
  private history: Map<string, number> = new Map();

  /**
   * Generate key for move and player
   */
  private getKey(move: Position, player: Player): string {
    return `${move.row},${move.col}|${player}`;
  }

  /**
   * Update history score for a move
   */
  updateHistory(move: Position, player: Player, depth: number): void {
    const key = this.getKey(move, player);
    const bonus = depth * depth; // Deeper searches get higher bonus
    const current = this.history.get(key) || 0;
    this.history.set(key, current + bonus);
  }

  /**
   * Get history score for a move
   */
  getHistoryScore(move: Position, player: Player): number {
    const key = this.getKey(move, player);
    return this.history.get(key) || 0;
  }

  /**
   * Clear history table
   */
  clear(): void {
    this.history.clear();
  }

  /**
   * Age history scores (reduce by factor to prioritize recent moves)
   */
  ageHistory(factor: number = 0.9): void {
    for (const [key, score] of this.history.entries()) {
      this.history.set(key, Math.floor(score * factor));
    }
  }
}

/**
 * Move ordering context
 */
export interface MoveOrderingContext {
  ply: number;
  player: Player;
  board: Board;
  killers: KillerMoves;
  history: HistoryTable;
  ttBestMove?: Position; // Best move from transposition table
}

/**
 * Scored move for sorting
 */
interface ScoredMove {
  move: Position;
  score: number;
}

/**
 * Order moves for optimal search performance
 * Better moves should be searched first for alpha-beta pruning efficiency
 */
export function orderMoves(
  moves: Position[],
  context: MoveOrderingContext
): Position[] {
  const { ply, player, board, killers, history, ttBestMove } = context;

  const scoredMoves: ScoredMove[] = moves.map(move => ({
    move,
    score: scoreMoveForOrdering(move, context)
  }));

  // Sort by score (higher is better)
  scoredMoves.sort((a, b) => b.score - a.score);

  return scoredMoves.map(sm => sm.move);
}

/**
 * Score a single move for ordering purposes
 */
function scoreMoveForOrdering(
  move: Position,
  context: MoveOrderingContext
): number {
  const { ply, player, killers, history, ttBestMove } = context;
  let score = 0;

  // 1. Transposition table best move gets highest priority
  if (ttBestMove &&
      ttBestMove.row === move.row &&
      ttBestMove.col === move.col) {
    score += 10000;
  }

  // 2. Corner moves are extremely valuable
  if (isImportantMove(move)) {
    score += 5000;
  }

  // 3. Positional value from evaluation table
  score += POSITIONAL_WEIGHTS[move.row][move.col];

  // 4. Killer move bonus
  const killerPriority = killers.getKillerPriority(move, ply);
  if (killerPriority > 0) {
    score += 1000 * killerPriority;
  }

  // 5. History heuristic bonus
  const historyScore = history.getHistoryScore(move, player);
  score += historyScore / 10; // Scale down history score

  // 6. Center preference (mild bonus for central squares)
  const centerDistance = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
  score += (7 - centerDistance) * 2;

  return score;
}

/**
 * Filter moves for quiescence search (tactical moves only)
 */
export function filterTacticalMoves(
  moves: Position[],
  board: Board,
  player: Player
): Position[] {
  const tactical: Position[] = [];

  for (const move of moves) {
    // Always include corner moves
    if (isImportantMove(move)) {
      tactical.push(move);
      continue;
    }

    // Include high-value positional moves
    const positionalValue = POSITIONAL_WEIGHTS[move.row][move.col];
    if (positionalValue >= 15) {
      tactical.push(move);
    }
  }

  // Limit to reasonable number for quiescence
  return tactical.slice(0, 8);
}

/**
 * Move ordering configuration
 */
export interface MoveOrderingConfig {
  useKillerHeuristic: boolean;
  useHistoryHeuristic: boolean;
  maxHistoryAge: number;
  historyAgingFactor: number;
}

export const DEFAULT_ORDERING_CONFIG: MoveOrderingConfig = {
  useKillerHeuristic: true,
  useHistoryHeuristic: true,
  maxHistoryAge: 10000,
  historyAgingFactor: 0.95,
};