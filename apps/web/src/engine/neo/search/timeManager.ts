// Time management system for search algorithms
// Converted from search-neo.js time control logic

import type { Board } from '../../../types';

export interface TimeConfig {
  totalTime: number;      // Total time available (ms)
  increment: number;      // Time increment per move (ms)
  movesToGo?: number;     // Moves until next time control
  minThinkTime: number;   // Minimum time per move (ms)
  maxThinkTime: number;   // Maximum time per move (ms)
}

export interface TimeAllocation {
  targetTime: number;     // Target time for this move
  maxTime: number;        // Absolute maximum time
  emergencyTime: number;  // Time for emergency situations
}

/**
 * Time management for search optimization
 */
export class TimeManager {
  private config: TimeConfig;
  private moveHistory: number[] = [];
  private emergencyMoves = 0;

  constructor(config: TimeConfig) {
    this.config = config;
  }

  /**
   * Calculate time allocation for current move
   */
  allocateTime(
    board: Board,
    movesPlayed: number,
    isEndgame: boolean = false
  ): TimeAllocation {
    const empties = this.countEmptySquares(board);
    const remainingTime = this.getRemainingTime();

    if (isEndgame && empties <= 10) {
      return this.allocateEndgameTime(empties, remainingTime);
    }

    const estimatedMovesLeft = this.estimateMovesRemaining(empties, movesPlayed);
    const baseAllocation = this.calculateBaseAllocation(remainingTime, estimatedMovesLeft);

    // Apply phase-specific adjustments
    const phaseMultiplier = this.getPhaseMultiplier(empties);
    const complexityMultiplier = this.getComplexityMultiplier(board);
    const historyMultiplier = this.getHistoryMultiplier();

    const targetTime = Math.max(
      this.config.minThinkTime,
      Math.min(
        baseAllocation * phaseMultiplier * complexityMultiplier * historyMultiplier,
        this.config.maxThinkTime
      )
    );

    const maxTime = Math.min(
      targetTime * 2,
      remainingTime * 0.25 // Never use more than 25% of remaining time
    );

    const emergencyTime = Math.min(
      targetTime * 0.3,
      remainingTime * 0.05 // Emergency reserve
    );

    return {
      targetTime,
      maxTime,
      emergencyTime
    };
  }

  /**
   * Special time allocation for endgame
   */
  private allocateEndgameTime(empties: number, remainingTime: number): TimeAllocation {
    let targetTime: number;

    if (empties <= 4) {
      // Final moves - use significant time for perfect play
      targetTime = Math.min(remainingTime * 0.4, this.config.maxThinkTime);
    } else if (empties <= 8) {
      // Critical endgame - increased time
      targetTime = Math.min(remainingTime * 0.2, this.config.maxThinkTime * 0.8);
    } else {
      // Early endgame - moderate increase
      targetTime = Math.min(remainingTime * 0.15, this.config.maxThinkTime * 0.6);
    }

    return {
      targetTime: Math.max(targetTime, this.config.minThinkTime),
      maxTime: Math.min(targetTime * 3, remainingTime * 0.5),
      emergencyTime: this.config.minThinkTime
    };
  }

  /**
   * Estimate remaining moves in the game
   */
  private estimateMovesRemaining(empties: number, movesPlayed: number): number {
    if (empties <= 12) {
      // Endgame - remaining moves approximately equal to empties
      return Math.max(empties - 2, 1);
    }

    // Estimate based on typical game length (around 58-60 moves total)
    const estimatedTotalMoves = 58;
    const estimatedRemaining = Math.max(estimatedTotalMoves - movesPlayed, empties / 2);

    return estimatedRemaining;
  }

  /**
   * Calculate base time allocation
   */
  private calculateBaseAllocation(remainingTime: number, movesLeft: number): number {
    const timePerMove = remainingTime / Math.max(movesLeft, 1);
    const incrementBonus = this.config.increment * 0.8; // Don't count full increment

    return timePerMove + incrementBonus;
  }

  /**
   * Phase-based time multiplier
   */
  private getPhaseMultiplier(empties: number): number {
    if (empties >= 50) {
      // Opening - quick moves
      return 0.6;
    } else if (empties >= 30) {
      // Early midgame
      return 0.8;
    } else if (empties >= 20) {
      // Middle game - critical decisions
      return 1.2;
    } else if (empties >= 12) {
      // Late midgame - very important
      return 1.4;
    } else {
      // Endgame - handled separately
      return 1.0;
    }
  }

  /**
   * Board complexity multiplier
   */
  private getComplexityMultiplier(board: Board): number {
    const mobility = this.estimateMobility(board);
    const stability = this.estimateStability(board);

    let multiplier = 1.0;

    // High mobility positions need more time
    if (mobility > 8) {
      multiplier *= 1.2;
    } else if (mobility < 3) {
      multiplier *= 0.8;
    }

    // Low stability (tactical) positions need more time
    if (stability < 0.3) {
      multiplier *= 1.3;
    }

    return Math.max(0.5, Math.min(multiplier, 2.0));
  }

  /**
   * Historical performance multiplier
   */
  private getHistoryMultiplier(): number {
    if (this.moveHistory.length < 3) {
      return 1.0;
    }

    const recentMoves = this.moveHistory.slice(-3);
    const avgTime = recentMoves.reduce((a, b) => a + b, 0) / recentMoves.length;
    const targetAvg = (this.config.minThinkTime + this.config.maxThinkTime) / 2;

    if (avgTime > targetAvg * 1.5) {
      // Been using too much time - reduce
      return 0.8;
    } else if (avgTime < targetAvg * 0.5) {
      // Been moving too fast - can afford more time
      return 1.2;
    }

    return 1.0;
  }

  /**
   * Emergency time management
   */
  isEmergencyTime(remainingTime: number, movesLeft: number): boolean {
    const timePerMove = remainingTime / Math.max(movesLeft, 1);
    return timePerMove < this.config.minThinkTime * 1.5;
  }

  /**
   * Record time used for a move
   */
  recordMoveTime(timeUsed: number): void {
    this.moveHistory.push(timeUsed);

    // Keep only recent history
    if (this.moveHistory.length > 10) {
      this.moveHistory.shift();
    }

    // Track emergency moves
    if (timeUsed < this.config.minThinkTime * 1.2) {
      this.emergencyMoves++;
    } else {
      this.emergencyMoves = Math.max(0, this.emergencyMoves - 1);
    }
  }

  /**
   * Check if we should extend search time
   */
  shouldExtendTime(
    currentTime: number,
    targetTime: number,
    maxTime: number,
    bestMoveStable: boolean,
    scoreImproving: boolean
  ): boolean {
    if (currentTime >= maxTime) {
      return false;
    }

    // Extend if we haven't found a stable best move
    if (!bestMoveStable && currentTime < targetTime * 1.5) {
      return true;
    }

    // Extend if score is still improving rapidly
    if (scoreImproving && currentTime < targetTime * 1.3) {
      return true;
    }

    // Don't extend if we're in emergency time mode
    if (this.emergencyMoves > 3) {
      return false;
    }

    return false;
  }

  private getRemainingTime(): number {
    return this.config.totalTime;
  }

  private countEmptySquares(board: Board): number {
    let count = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === null) count++;
      }
    }
    return count;
  }

  private estimateMobility(board: Board): number {
    let emptyCount = 0;
    let borderCount = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === null) {
          emptyCount++;

          // Check if adjacent to occupied square
          let isBorder = false;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                if (board[nr][nc] !== null) {
                  isBorder = true;
                  break;
                }
              }
            }
            if (isBorder) break;
          }

          if (isBorder) borderCount++;
        }
      }
    }

    // Estimate mobility based on frontier squares
    return Math.max(1, Math.min(borderCount, 20));
  }

  private estimateStability(board: Board): number {
    let stableCount = 0;
    let totalPieces = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] !== null) {
          totalPieces++;

          // Very rough stability estimate - corners and edges
          if ((r === 0 || r === 7) && (c === 0 || c === 7)) {
            stableCount += 3; // Corners are very stable
          } else if (r === 0 || r === 7 || c === 0 || c === 7) {
            stableCount += 1; // Edges are somewhat stable
          }
        }
      }
    }

    return totalPieces > 0 ? stableCount / totalPieces : 0;
  }

  /**
   * Get time management statistics
   */
  getStats(): {
    averageMoveTime: number;
    emergencyMoves: number;
    timeEfficiency: number;
  } {
    const avgTime = this.moveHistory.length > 0
      ? this.moveHistory.reduce((a, b) => a + b, 0) / this.moveHistory.length
      : 0;

    const targetTime = (this.config.minThinkTime + this.config.maxThinkTime) / 2;
    const efficiency = avgTime > 0 ? Math.min(1.0, targetTime / avgTime) : 0;

    return {
      averageMoveTime: avgTime,
      emergencyMoves: this.emergencyMoves,
      timeEfficiency: efficiency
    };
  }
}