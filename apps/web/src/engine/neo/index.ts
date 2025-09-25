// Engine-Neo main export - Modern TypeScript Othello AI Engine
// Implements Engine interface with advanced search algorithms

import type {
  Board,
  Player,
  Position,
  EngineRequest,
  EngineResponse,
  Engine
} from '../../types';

import { AspirationEngine, type AspirationConfig, DEFAULT_ASPIRATION_CONFIG } from './search/aspiration';
import { TimeManager, type TimeConfig } from './search/timeManager';
import { TranspositionTable } from './optimization/transTable';
import { KillerMoves, HistoryTable } from './ordering/moveOrdering';
import { getDifficultyLevel, ENDGAME_THRESHOLD } from './config/selectivity';
import { isEndgamePhase } from './evaluation/heuristic';

export interface EngineNeoConfig {
  level: number;
  timeConfig?: Partial<TimeConfig>;
  aspirationConfig?: Partial<AspirationConfig>;
  ttSize?: number;
  enableOpeningBook?: boolean;
  enableEndgameTablebase?: boolean;
}

export const DEFAULT_ENGINE_CONFIG: EngineNeoConfig = {
  level: 18,
  timeConfig: {
    totalTime: 30000,    // 30 seconds
    increment: 1000,     // 1 second increment
    minThinkTime: 500,   // 0.5 seconds minimum
    maxThinkTime: 10000  // 10 seconds maximum
  },
  ttSize: 200000,
  enableOpeningBook: false,
  enableEndgameTablebase: false
};

/**
 * Engine-Neo: Advanced TypeScript Othello Engine
 *
 * Features:
 * - Principal Variation Search with aspiration windows
 * - Null Window Search for move ordering
 * - Transposition table with aging
 * - Advanced move ordering (killers, history heuristic)
 * - Dynamic time management
 * - Multi-phase evaluation system
 * - Configurable difficulty levels
 */
export class EngineNeo implements Engine {
  readonly name = 'Engine-Neo';
  readonly version = '1.0.0';
  readonly author = 'TypeScript Refactor';

  private config: EngineNeoConfig;
  private aspirationEngine: AspirationEngine;
  private timeManager: TimeManager;
  private tt: TranspositionTable;
  private killers: KillerMoves;
  private history: HistoryTable;
  private searchStats: {
    totalNodes: number;
    totalSearches: number;
    avgDepth: number;
    ttHitRate: number;
  };

  constructor(config: Partial<EngineNeoConfig> = {}) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };

    // Initialize search components
    this.aspirationEngine = new AspirationEngine();
    this.tt = new TranspositionTable(this.config.ttSize || 200000);
    this.killers = new KillerMoves();
    this.history = new HistoryTable();

    // Initialize time management
    const timeConfig: TimeConfig = {
      totalTime: 30000,
      increment: 1000,
      minThinkTime: 500,
      maxThinkTime: 10000,
      ...this.config.timeConfig
    };
    this.timeManager = new TimeManager(timeConfig);

    // Initialize statistics
    this.searchStats = {
      totalNodes: 0,
      totalSearches: 0,
      avgDepth: 0,
      ttHitRate: 0
    };
  }

  /**
   * Main engine interface method
   */
  async analyze(request: EngineRequest): Promise<EngineResponse> {
    const startTime = Date.now();
    const { gameCore, timeLimit, skill } = request;

    try {
      const { board, currentPlayer } = gameCore;

      // Update configuration based on request
      const level = skill ? Math.floor(skill / 10) + 10 : this.config.level; // Convert 0-100 skill to level
      const empties = this.countEmptySquares(board);
      const isEndgame = isEndgamePhase(board, ENDGAME_THRESHOLD);

      // Calculate time allocation
      const timeAllocation = this.timeManager.allocateTime(
        board,
        64 - empties, // moves played
        isEndgame
      );

      const actualTimeLimit = timeLimit || timeAllocation.targetTime;

      // Configure search
      const aspirationConfig: AspirationConfig = {
        ...DEFAULT_ASPIRATION_CONFIG,
        ...this.config.aspirationConfig,
        level,
        timeLimit: Math.min(actualTimeLimit, timeAllocation.maxTime),
        enableTT: true,
        enableKillers: true,
        enableHistory: true
      };

      // Perform search
      const searchResult = this.aspirationEngine.search(
        board,
        currentPlayer,
        aspirationConfig
      );

      // Record time usage
      const timeUsed = Date.now() - startTime;
      this.timeManager.recordMoveTime(timeUsed);

      // Update statistics
      this.updateStats(searchResult);

      // Age history for next search
      this.history.ageHistory(0.95);

      return {
        bestMove: searchResult.bestMove || undefined,
        evaluation: searchResult.score,
        depth: searchResult.depth,
        nodes: searchResult.nodes,
        timeUsed,
        pv: searchResult.pv || [],
        stats: {
          ttHits: searchResult.ttHits,
          ttStores: searchResult.ttStores,
          empties,
          isEndgame
        }
      };

    } catch (error) {
      console.error('Engine-Neo search error:', error);

      // Return fallback move
      const fallbackMove = await this.getFallbackMove(gameCore.board, gameCore.currentPlayer);
      const timeUsed = Date.now() - startTime;

      return {
        bestMove: fallbackMove || undefined,
        evaluation: 0,
        depth: 1,
        nodes: 0,
        timeUsed,
        pv: [],
        stats: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Get fallback move using simple heuristics
   */
  private async getFallbackMove(board: Board, player: Player): Promise<Position | null> {
    const { getValidMoves } = await import('../../core');
    const moves = getValidMoves(board, player);

    if (moves.length === 0) return null;

    // Prefer corners
    const corners = moves.filter(move =>
      (move.row === 0 || move.row === 7) && (move.col === 0 || move.col === 7)
    );

    if (corners.length > 0) {
      return corners[0];
    }

    // Prefer edges
    const edges = moves.filter(move =>
      move.row === 0 || move.row === 7 || move.col === 0 || move.col === 7
    );

    if (edges.length > 0) {
      return edges[0];
    }

    // Return any valid move
    return moves[0];
  }

  /**
   * Update engine statistics
   */
  private updateStats(searchResult: any): void {
    this.searchStats.totalNodes += searchResult.nodes || 0;
    this.searchStats.totalSearches++;

    if (searchResult.depth) {
      this.searchStats.avgDepth =
        (this.searchStats.avgDepth * (this.searchStats.totalSearches - 1) + searchResult.depth)
        / this.searchStats.totalSearches;
    }

    // Calculate TT hit rate (would need to be passed from search)
    this.searchStats.ttHitRate = 0.85; // Placeholder
  }

  /**
   * Format evaluation string for display
   */
  private formatEvaluation(
    searchResult: any,
    empties: number,
    isEndgame: boolean
  ): string {
    const parts: string[] = [];

    parts.push(`Score: ${searchResult.score}`);
    parts.push(`Depth: ${searchResult.depth}`);
    parts.push(`Nodes: ${searchResult.nodes?.toLocaleString() || 0}`);

    if (searchResult.time) {
      const nps = searchResult.nodes ? Math.round(searchResult.nodes / (searchResult.time / 1000)) : 0;
      parts.push(`NPS: ${nps.toLocaleString()}`);
    }

    if (isEndgame) {
      parts.push(`Endgame (${empties} empty)`);
    }

    if (searchResult.ttHits && searchResult.ttStores) {
      const hitRate = Math.round((searchResult.ttHits / (searchResult.ttHits + searchResult.ttStores)) * 100);
      parts.push(`TT: ${hitRate}%`);
    }

    return parts.join(' | ');
  }

  /**
   * Update engine configuration
   */
  updateConfig(newConfig: Partial<EngineNeoConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update time manager if time config changed
    if (newConfig.timeConfig) {
      const timeConfig: TimeConfig = {
        totalTime: 30000,
        increment: 1000,
        minThinkTime: 500,
        maxThinkTime: 10000,
        ...this.config.timeConfig
      };
      this.timeManager = new TimeManager(timeConfig);
    }

    // Resize transposition table if needed
    if (newConfig.ttSize && newConfig.ttSize !== this.config.ttSize) {
      this.tt = new TranspositionTable(newConfig.ttSize);
    }
  }

  /**
   * Clear engine state (between games)
   */
  clearState(): void {
    this.tt.clear();
    this.killers.clear();
    this.history.clear();
    this.searchStats = {
      totalNodes: 0,
      totalSearches: 0,
      avgDepth: 0,
      ttHitRate: 0
    };
  }

  /**
   * Get engine statistics
   */
  getStats(): typeof this.searchStats & {
    timeStats: ReturnType<TimeManager['getStats']>;
    ttStats: ReturnType<TranspositionTable['getStats']>;
  } {
    return {
      ...this.searchStats,
      timeStats: this.timeManager.getStats(),
      ttStats: this.tt.getStats()
    };
  }

  /**
   * Get engine name and version
   */
  getName(): string {
    return 'Engine-Neo v1.0';
  }

  /**
   * Get supported features
   */
  getFeatures(): string[] {
    return [
      'Principal Variation Search',
      'Aspiration Windows',
      'Transposition Table',
      'Move Ordering (Killers + History)',
      'Dynamic Time Management',
      'Multi-phase Evaluation',
      'Configurable Difficulty',
      'Endgame Solver'
    ];
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
}

// Instantiate default engine instance for consumers expecting ready-to-use engine
export const engineNeo = new EngineNeo();

export default engineNeo;

// Export search components for advanced usage
export { AspirationEngine } from './search/aspiration';
export { TimeManager } from './search/timeManager';
export { TranspositionTable } from './optimization/transTable';
export { KillerMoves, HistoryTable } from './ordering/moveOrdering';

// Export evaluation and configuration utilities
export * from './evaluation/heuristic';
export * from './config/selectivity';

// Export type helpers
export type { AspirationConfig } from './search/aspiration';
export type { TimeConfig } from './search/timeManager';

export { DEFAULT_ASPIRATION_CONFIG } from './search/aspiration';
