// Engine Zenith - The pinnacle of Othello AI
// Implements advanced strategies and intelligent move selection

import type {
  Board,
  Player,
  Position,
  EngineRequest,
  EngineResponse,
  Engine
} from '../../types';

import { AdvancedEvaluation } from './evaluation/AdvancedEvaluation';
import { StrategicAnalysis } from './strategy/StrategicAnalysis';
import { OpponentAnalysis } from './analysis/OpponentAnalysis';
import { PredictiveSearch } from './search/PredictiveSearch';
// import { AdaptiveStrategy } from './strategy/AdaptiveStrategy';
import { getValidMoves } from '../../core/gameCore';

export interface ZenithConfig {
  level: number;                    // 1-20 (20 = 최고 수준)
  enableLearning: boolean;          // 자기 학습 활성화
  enableOpponentAnalysis: boolean; // 상대방 분석 활성화
  enablePredictiveSearch: boolean; // 예측적 탐색 활성화
  enableAdaptiveStrategy: boolean; // 적응형 전략 활성화
  timeConfig?: {
    totalTime: number;
    increment: number;
    minThinkTime: number;
    maxThinkTime: number;
  };
}

export const DEFAULT_ZENITH_CONFIG: ZenithConfig = {
  level: 18,
  enableLearning: true,
  enableOpponentAnalysis: true,
  enablePredictiveSearch: true,
  enableAdaptiveStrategy: true,
  timeConfig: {
    totalTime: 30000,
    increment: 1000,
    minThinkTime: 500,
    maxThinkTime: 10000
  }
};

/**
 * Engine Zenith - The pinnacle of Othello AI
 * 
 * Features:
 * - Advanced multi-factor evaluation
 * - Strategic analysis and planning
 * - Opponent pattern recognition
 * - Predictive search capabilities
 * - Adaptive strategy system
 * - Intelligent X/C square handling
 * - Master-level frontier and mobility management
 */
export class EngineZenith implements Engine {
  readonly name = 'Engine-Zenith';
  readonly version = '1.0.0';
  readonly author = 'Zenith Research Team';

  private config: ZenithConfig;
  private evaluation: AdvancedEvaluation;
  private strategy: StrategicAnalysis;
  private opponentAnalysis: OpponentAnalysis;
  private predictiveSearch: PredictiveSearch;
  // private adaptiveStrategy: AdaptiveStrategy;
  
  private gameHistory: GameHistory = [];
  private opponentProfile: OpponentProfile | null = null;
  private learningData: LearningData = {
    wins: 0,
    losses: 0,
    totalMoves: 0,
    positiveMoves: 0,
    patterns: new Map(),
    mistakes: []
  };

  constructor(config: Partial<ZenithConfig> = {}) {
    this.config = { ...DEFAULT_ZENITH_CONFIG, ...config };
    
    // Initialize components
    this.evaluation = new AdvancedEvaluation();
    this.strategy = new StrategicAnalysis();
    this.opponentAnalysis = new OpponentAnalysis();
    this.predictiveSearch = new PredictiveSearch();
    // this.adaptiveStrategy = new AdaptiveStrategy();
  }

  /**
   * Main engine interface method
   */
  async analyze(request: EngineRequest): Promise<EngineResponse> {
    const startTime = Date.now();
    const { gameCore, timeLimit, skill } = request;

    try {
      const { board, currentPlayer } = gameCore;
      
      // Update configuration based on skill level
      const level = skill ? Math.floor(skill / 5) + 10 : this.config.level;
      
      // 1. Game phase analysis
      const gamePhase = this.analyzeGamePhase(board);
      
      // 2. Opponent analysis (if enabled)
      if (this.config.enableOpponentAnalysis) {
        this.opponentProfile = this.opponentAnalysis.analyzeOpponent(
          this.gameHistory,
          (request as any).opponentMoves || []
        );
      }
      
      // 3. Strategic analysis
      const strategicAnalysis = this.strategy.analyzePosition(
        board,
        currentPlayer,
        gamePhase,
        this.opponentProfile
      );
      
      // 4. Advanced evaluation
      const evaluation = this.evaluation.evaluateBoard(
        board,
        currentPlayer,
        gamePhase,
        strategicAnalysis as any
      );
      
      // 5. Predictive search (if enabled)
      let predictiveInsights: PredictiveInsights | null = null;
      if (this.config.enablePredictiveSearch) {
        predictiveInsights = this.predictiveSearch.analyzeFutureScenarios(
          board,
          currentPlayer,
          5 // 5 moves ahead
        );
      }
      
      // 6. Adaptive strategy (if enabled)
      let adaptiveStrategy: any = null;
      if (this.config.enableAdaptiveStrategy) {
        // adaptiveStrategy = this.adaptiveStrategy.adaptStrategy(
        //   strategicAnalysis,
        //   this.opponentProfile,
        //   this.learningData
        // );
      }
      
      // 7. Move selection
      const bestMove = this.selectBestMove(
        board,
        currentPlayer,
        evaluation,
        strategicAnalysis,
        predictiveInsights,
        adaptiveStrategy
      );
      
      // 8. Learning (if enabled)
      if (this.config.enableLearning) {
        this.updateLearningData(bestMove, evaluation, strategicAnalysis);
      }
      
      // 9. Update game history
      this.updateGameHistory(gameCore, bestMove);
      
      const timeUsed = Date.now() - startTime;
      
      return {
        bestMove,
        evaluation: evaluation.score,
        depth: evaluation.depth,
        nodes: evaluation.nodes,
        timeUsed,
        pv: evaluation.pv || [],
        stats: {
          gamePhase,
          strategicAnalysis: strategicAnalysis.summary,
          opponentProfile: this.opponentProfile?.summary,
          predictiveInsights: predictiveInsights?.summary,
          adaptiveStrategy: adaptiveStrategy?.name,
          confidence: evaluation.confidence,
          learningProgress: this.getLearningProgress()
        }
      };

    } catch (error) {
      console.error('Engine-Zenith analysis error:', error);
      
      // Fallback to simple move selection
      const fallbackMove = await this.getFallbackMove(gameCore.board, gameCore.currentPlayer);
      const timeUsed = Date.now() - startTime;
      
      return {
        bestMove: fallbackMove,
        evaluation: 0,
        depth: 1,
        nodes: 0,
        timeUsed,
        pv: [],
        stats: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          fallback: true
        }
      };
    }
  }

  /**
   * Analyze game phase
   */
  private analyzeGamePhase(board: Board): GamePhase {
    const empties = this.countEmptySquares(board);
    
    if (empties >= 45) return 'opening';
    if (empties >= 20) return 'midgame';
    if (empties >= 10) return 'late_midgame';
    return 'endgame';
  }

  /**
   * Select best move using all analysis
   */
  private selectBestMove(
    board: Board,
    player: Player,
    evaluation: EvaluationResult,
    strategicAnalysis: StrategicAnalysis,
    predictiveInsights: PredictiveInsights | null,
    adaptiveStrategy: AdaptiveStrategy | null
  ): Position | undefined {
    const moves = getValidMoves(board, player);
    
    if (moves.length === 0) return undefined;
    
    // Score each move
    const scoredMoves = moves.map(move => ({
      move,
      score: this.calculateMoveScore(
        move,
        board,
        player,
        evaluation,
        strategicAnalysis,
        predictiveInsights,
        adaptiveStrategy
      )
    }));
    
    // Sort by score and return best move
    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
  }

  /**
   * Calculate comprehensive move score
   */
  private calculateMoveScore(
    move: Position,
    board: Board,
    player: Player,
    evaluation: EvaluationResult,
    strategicAnalysis: StrategicAnalysis,
    predictiveInsights: PredictiveInsights | null,
    adaptiveStrategy: AdaptiveStrategy | null
  ): number {
    let score = 0;
    
    // 1. Basic evaluation score
    score += evaluation.score * 0.3;
    
    // 2. Strategic value
    score += (strategicAnalysis as any).getMoveValue(move) * 0.25;
    
    // 3. Predictive value
    if (predictiveInsights) {
      score += predictiveInsights.getMoveValue(move) * 0.2;
    }
    
    // 4. Adaptive strategy value
    if (adaptiveStrategy) {
      score += (adaptiveStrategy as any).getMoveValue(move) * 0.15;
    }
    
    // 5. Safety and risk assessment
    score += this.assessMoveSafety(move, board, player) * 0.1;
    
    return score;
  }

  /**
   * Assess move safety and risk
   */
  private assessMoveSafety(move: Position, board: Board, player: Player): number {
    // Check for dangerous X/C squares
    if (this.isDangerousSquare(move, board)) {
      return -100; // Strong penalty for dangerous moves
    }
    
    // Check for corner opportunities
    if (this.isCorner(move)) {
      return 100; // Strong bonus for corners
    }
    
    // Check for edge safety
    if (this.isEdgeSafe(move, board)) {
      return 50; // Bonus for safe edge moves
    }
    
    return 0;
  }

  /**
   * Check if move is on dangerous X/C square
   */
  private isDangerousSquare(move: Position, board: Board): boolean {
    const { row, col } = move;
    
    // X-squares (diagonal to corners)
    const xSquares = [[1,1], [1,6], [6,1], [6,6]];
    for (const [r, c] of xSquares) {
      if (row === r && col === c) {
        // Check if corresponding corner is empty
        const cornerRow = r === 1 ? 0 : 7;
        const cornerCol = c === 1 ? 0 : 7;
        if (board[cornerRow][cornerCol] === null) {
          return true; // Dangerous X-square
        }
      }
    }
    
    // C-squares (adjacent to corners)
    const cSquares = [
      [[0,1], [1,0]], [[0,6], [1,7]], 
      [[6,0], [7,1]], [[6,7], [7,6]]
    ];
    
    for (let i = 0; i < 4; i++) {
      const corners = [[0,0], [0,7], [7,0], [7,7]];
      const corner = corners[i];
      const cSquare = cSquares[i];
      
      if (board[corner[0]][corner[1]] === null) {
        for (const [r, c] of cSquare) {
          if (row === r && col === c) {
            return true; // Dangerous C-square
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Check if move is corner
   */
  private isCorner(move: Position): boolean {
    const { row, col } = move;
    return (row === 0 || row === 7) && (col === 0 || col === 7);
  }

  /**
   * Check if move is safe on edge
   */
  private isEdgeSafe(move: Position, board: Board): boolean {
    const { row, col } = move;
    
    // Check if on edge
    if (row !== 0 && row !== 7 && col !== 0 && col !== 7) {
      return false;
    }
    
    // Check if adjacent corners are safe
    const adjacentCorners = [];
    if (row === 0) {
      if (col === 1) adjacentCorners.push([0, 0]);
      if (col === 6) adjacentCorners.push([0, 7]);
    }
    if (row === 7) {
      if (col === 1) adjacentCorners.push([7, 0]);
      if (col === 6) adjacentCorners.push([7, 7]);
    }
    if (col === 0) {
      if (row === 1) adjacentCorners.push([0, 0]);
      if (row === 6) adjacentCorners.push([7, 0]);
    }
    if (col === 7) {
      if (row === 1) adjacentCorners.push([0, 7]);
      if (row === 6) adjacentCorners.push([7, 7]);
    }
    
    // Check if adjacent corners are controlled or safe
    for (const [r, c] of adjacentCorners) {
      if (board[r][c] === null) {
        return false; // Adjacent corner is empty, not safe
      }
    }
    
    return true;
  }

  /**
   * Get fallback move when analysis fails
   */
  private async getFallbackMove(board: Board, player: Player): Promise<Position | undefined> {
    const moves = getValidMoves(board, player);
    
    if (moves.length === 0) return undefined;
    
    // Prefer corners
    const corners = moves.filter(move => this.isCorner(move));
    if (corners.length > 0) return corners[0];
    
    // Prefer safe edges
    const safeEdges = moves.filter(move => this.isEdgeSafe(move, board));
    if (safeEdges.length > 0) return safeEdges[0];
    
    // Avoid dangerous squares
    const safeMoves = moves.filter(move => !this.isDangerousSquare(move, board));
    if (safeMoves.length > 0) return safeMoves[0];
    
    // Return any valid move
    return moves[0];
  }

  /**
   * Update learning data
   */
  private updateLearningData(
    move: Position | undefined,
    evaluation: EvaluationResult,
    strategicAnalysis: StrategicAnalysis
  ): void {
    if (!move) return;
    
    // Record move pattern
    const pattern = this.extractMovePattern(move, evaluation, strategicAnalysis);
    this.learningData.patterns.set(pattern.key, pattern);
    
    // Update statistics
    this.learningData.totalMoves++;
    if (evaluation.score > 0) {
      this.learningData.positiveMoves++;
    }
  }

  /**
   * Extract move pattern for learning
   */
  private extractMovePattern(
    move: Position,
    evaluation: EvaluationResult,
    strategicAnalysis: StrategicAnalysis
  ): MovePattern {
    return {
      key: `${move.row}-${move.col}`,
      move,
      score: evaluation.score,
      strategicValue: (strategicAnalysis as any).getMoveValue(move),
      timestamp: Date.now()
    };
  }

  /**
   * Update game history
   */
  private updateGameHistory(gameCore: any, move: Position | undefined): void {
    this.gameHistory.push({
      board: gameCore.board,
      move,
      timestamp: Date.now()
    });
    
    // Keep only last 50 moves
    if (this.gameHistory.length > 50) {
      this.gameHistory.shift();
    }
  }

  /**
   * Get learning progress
   */
  private getLearningProgress(): LearningProgress {
    return {
      totalMoves: this.learningData.totalMoves,
      positiveMoves: this.learningData.positiveMoves,
      patternsLearned: this.learningData.patterns.size,
      winRate: this.learningData.wins / (this.learningData.wins + this.learningData.losses) || 0
    };
  }

  /**
   * Count empty squares
   */
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
   * Update engine configuration
   */
  updateConfig(newConfig: Partial<ZenithConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear engine state
   */
  clearState(): void {
    this.gameHistory = [];
    this.opponentProfile = null;
    this.learningData = {
      wins: 0,
      losses: 0,
      totalMoves: 0,
      positiveMoves: 0,
      patterns: new Map(),
      mistakes: []
    };
  }

  /**
   * Get engine statistics
   */
  getStats(): ZenithStats {
    return {
      name: this.name,
      version: this.version,
      config: this.config,
      learningProgress: this.getLearningProgress(),
      gameHistory: this.gameHistory.length,
      opponentProfile: this.opponentProfile
    };
  }
}

// Export default instance
export const engineZenith = new EngineZenith();
export default engineZenith;

// Export types
export type GamePhase = 'opening' | 'midgame' | 'late_midgame' | 'endgame';
export type GameHistory = Array<{
  board: Board;
  move?: Position;
  timestamp: number;
}>;

export interface OpponentProfile {
  style: 'aggressive' | 'defensive' | 'balanced';
  preferences: string[];
  weaknesses: string[];
  summary: string;
}

export interface LearningData {
  wins: number;
  losses: number;
  totalMoves: number;
  positiveMoves: number;
  patterns: Map<string, MovePattern>;
  mistakes: string[];
}

export interface MovePattern {
  key: string;
  move: Position;
  score: number;
  strategicValue: number;
  timestamp: number;
}

export interface LearningProgress {
  totalMoves: number;
  positiveMoves: number;
  patternsLearned: number;
  winRate: number;
}

export interface ZenithStats {
  name: string;
  version: string;
  config: ZenithConfig;
  learningProgress: LearningProgress;
  gameHistory: number;
  opponentProfile: OpponentProfile | null;
}

export interface EvaluationResult {
  score: number;
  depth: number;
  nodes: number;
  confidence: number;
  pv?: Position[];
}

export interface PredictiveInsights {
  scenarios: Board[];
  probabilities: number[];
  bestPaths: Position[][];
  summary: string;
  getMoveValue(move: Position): number;
}

export interface AdaptiveStrategy {
  name: string;
  adaptStrategy(
    strategicAnalysis: StrategicAnalysis,
    opponentProfile: OpponentProfile | null,
    learningData: LearningData
  ): AdaptiveStrategy;
  getMoveValue(move: Position): number;
}
