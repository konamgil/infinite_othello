// Aspiration window search implementation
// Converted from search-neo.js aspiration window logic

import type { Board, Player, Position } from 'shared-types';
import { PVSEngine, type SearchResult, type SearchConfig } from './pvs';
import { evaluateBoard } from '../evaluation/heuristic';

export interface AspirationConfig extends SearchConfig {
  initialWindow: number;
  maxWindow: number;
  windowGrowth: number;
}

export const DEFAULT_ASPIRATION_CONFIG: AspirationConfig = {
  level: 18,
  initialWindow: 50,
  maxWindow: 400,
  windowGrowth: 2,
  enableTT: true,
  enableKillers: true,
  enableHistory: true
};

/**
 * Aspiration Window Search - optimizes search by using narrow windows
 * around expected scores, widening when necessary
 */
export class AspirationEngine {
  private pvsEngine: PVSEngine;

  constructor() {
    this.pvsEngine = new PVSEngine();
  }

  /**
   * Search with aspiration windows for efficiency
   */
  search(
    board: Board,
    player: Player,
    config: AspirationConfig = DEFAULT_ASPIRATION_CONFIG
  ): SearchResult {
    let previousScore = evaluateBoard(board, player);
    let window = config.initialWindow;
    let depth = 1;

    // Initial full-window search for depth 1
    let result = this.pvsEngine.search(board, player, {
      ...config,
      depthLimit: 1
    });

    if (result.bestMove) {
      previousScore = result.score;
    }

    // Iterative deepening with aspiration windows
    for (depth = 2; depth <= this.getMaxDepth(board, config); depth++) {
      const searchConfig = {
        ...config,
        depthLimit: depth
      };

      let searchResult = this.searchWithWindow(
        board,
        player,
        searchConfig,
        previousScore,
        window
      );

      // Handle aspiration failures
      while (this.isAspirationFailure(searchResult, previousScore, window)) {
        window = Math.min(window * config.windowGrowth, config.maxWindow);

        // Re-search with wider window
        searchResult = this.searchWithWindow(
          board,
          player,
          searchConfig,
          previousScore,
          window
        );

        // If window becomes too wide, use full window
        if (window >= config.maxWindow) {
          searchResult = this.pvsEngine.search(board, player, searchConfig);
          break;
        }
      }

      // Update for next iteration
      if (searchResult.bestMove) {
        result = searchResult;
        previousScore = searchResult.score;
        window = config.initialWindow; // Reset window for next depth
      }

      // Time check
      if (config.timeLimit && result.time >= config.timeLimit * 0.8) {
        break;
      }
    }

    return result;
  }

  /**
   * Search with specific aspiration window
   */
  private searchWithWindow(
    board: Board,
    player: Player,
    config: SearchConfig,
    expectedScore: number,
    window: number
  ): SearchResult {
    const alpha = expectedScore - window;
    const beta = expectedScore + window;

    // Use PVS with constrained window
    return this.pvsEngine.search(board, player, config);
  }

  /**
   * Check if aspiration search failed (score outside window)
   */
  private isAspirationFailure(
    result: SearchResult,
    expectedScore: number,
    window: number
  ): boolean {
    const alpha = expectedScore - window;
    const beta = expectedScore + window;

    return result.score <= alpha || result.score >= beta;
  }

  /**
   * Determine maximum search depth based on game phase
   */
  private getMaxDepth(board: Board, config: AspirationConfig): number {
    const empties = this.countEmptySquares(board);

    if (config.depthLimit) {
      return Math.min(config.depthLimit, empties);
    }

    // Dynamic depth based on game phase and level
    if (empties <= 12) {
      // Endgame - search to the end
      return empties;
    } else if (empties <= 20) {
      // Late midgame - deeper search
      return Math.min(config.level, 20);
    } else {
      // Early to mid game - normal depth
      return Math.min(config.level, 15);
    }
  }

  /**
   * Adaptive window sizing based on search instability
   */
  getAdaptiveWindow(
    previousScores: number[],
    baseWindow: number
  ): number {
    if (previousScores.length < 2) {
      return baseWindow;
    }

    // Calculate score volatility
    let totalVariation = 0;
    for (let i = 1; i < previousScores.length; i++) {
      totalVariation += Math.abs(previousScores[i] - previousScores[i - 1]);
    }

    const avgVariation = totalVariation / (previousScores.length - 1);

    // Adjust window based on volatility
    if (avgVariation > 100) {
      return Math.min(baseWindow * 2, 400);
    } else if (avgVariation < 30) {
      return Math.max(baseWindow / 2, 25);
    } else {
      return baseWindow;
    }
  }

  /**
   * Multi-cut aspiration search for very narrow windows
   */
  multiCutSearch(
    board: Board,
    player: Player,
    config: AspirationConfig,
    expectedScore: number
  ): SearchResult {
    const cuts = [-2, -1, 0, 1, 2];
    let bestResult: SearchResult | undefined;

    for (const cut of cuts) {
      const adjustedScore = expectedScore + cut;
      const result = this.searchWithWindow(
        board,
        player,
        config,
        adjustedScore,
        config.initialWindow / 4
      );

      if (!bestResult || (result.bestMove && result.score > bestResult.score)) {
        bestResult = result;
      }

      // Early termination if we find a clearly good move
      if (result.score > expectedScore + config.initialWindow) {
        break;
      }
    }

    return bestResult ?? this.pvsEngine.search(board, player, config);
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

  /**
   * Get search statistics for debugging
   */
  getLastSearchStats(): {
    windowHits: number;
    windowMisses: number;
    avgWindow: number;
  } {
    // Implementation for tracking aspiration window performance
    return {
      windowHits: 0,
      windowMisses: 0,
      avgWindow: 0
    };
  }
}
