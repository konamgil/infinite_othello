// Opponent Analysis System for Engine Zenith
// Analyzes opponent patterns and creates psychological profiles

import type { Board, Player, Position } from '../../../types';
import { GameHistory, OpponentProfile } from '../index';

export class OpponentAnalysis {
  private analysisHistory: OpponentAnalysisHistory[] = [];
  private patternDatabase: Map<string, PatternData> = new Map();

  constructor() {
    this.initializePatternDatabase();
  }

  /**
   * Analyze opponent based on game history and moves
   */
  analyzeOpponent(
    gameHistory: GameHistory,
    opponentMoves: Position[]
  ): OpponentProfile {
    // 1. Analyze move patterns
    const movePatterns = this.analyzeMovePatterns(opponentMoves);
    
    // 2. Analyze strategic preferences
    const strategicPreferences = this.analyzeStrategicPreferences(opponentMoves);
    
    // 3. Analyze weaknesses
    const weaknesses = this.analyzeWeaknesses(opponentMoves, gameHistory);
    
    // 4. Determine playing style
    const style = this.determinePlayingStyle(movePatterns, strategicPreferences);
    
    // 5. Create opponent profile
    const profile: OpponentProfile = {
      style,
      preferences: strategicPreferences,
      weaknesses,
      summary: this.generateProfileSummary(style, strategicPreferences, weaknesses)
    };
    
    // 6. Store analysis for learning
    this.storeAnalysis(profile, opponentMoves);
    
    return profile;
  }

  /**
   * Analyze move patterns
   */
  private analyzeMovePatterns(moves: Position[]): MovePatternAnalysis {
    const patterns = {
      cornerPreference: 0,
      edgePreference: 0,
      centerPreference: 0,
      mobilityStyle: 0,
      riskTolerance: 0,
      consistency: 0
    };

    if (moves.length === 0) return patterns;

    // Analyze corner preference
    const cornerMoves = moves.filter(move => this.isCorner(move));
    patterns.cornerPreference = cornerMoves.length / moves.length;

    // Analyze edge preference
    const edgeMoves = moves.filter(move => this.isEdge(move));
    patterns.edgePreference = edgeMoves.length / moves.length;

    // Analyze center preference
    const centerMoves = moves.filter(move => this.isCenter(move));
    patterns.centerPreference = centerMoves.length / moves.length;

    // Analyze mobility style
    patterns.mobilityStyle = this.analyzeMobilityStyle(moves);

    // Analyze risk tolerance
    patterns.riskTolerance = this.analyzeRiskTolerance(moves);

    // Analyze consistency
    patterns.consistency = this.analyzeConsistency(moves);

    return patterns;
  }

  /**
   * Analyze strategic preferences
   */
  private analyzeStrategicPreferences(moves: Position[]): string[] {
    const preferences: string[] = [];

    // Corner strategy
    const cornerMoves = moves.filter(move => this.isCorner(move));
    if (cornerMoves.length / moves.length > 0.3) {
      preferences.push('corner_control');
    }

    // Edge strategy
    const edgeMoves = moves.filter(move => this.isEdge(move));
    if (edgeMoves.length / moves.length > 0.4) {
      preferences.push('edge_control');
    }

    // Center strategy
    const centerMoves = moves.filter(move => this.isCenter(move));
    if (centerMoves.length / moves.length > 0.2) {
      preferences.push('center_control');
    }

    // Mobility strategy
    if (this.analyzeMobilityStyle(moves) > 0.5) {
      preferences.push('mobility_focus');
    }

    // Stability strategy
    if (this.analyzeStabilityPreference(moves) > 0.5) {
      preferences.push('stability_focus');
    }

    return preferences;
  }

  /**
   * Analyze weaknesses
   */
  private analyzeWeaknesses(moves: Position[], gameHistory: GameHistory): string[] {
    const weaknesses: string[] = [];

    // Check for X-square mistakes
    const xSquareMoves = moves.filter(move => this.isXSquare(move));
    if (xSquareMoves.length > 0) {
      weaknesses.push('x_square_mistakes');
    }

    // Check for C-square mistakes
    const cSquareMoves = moves.filter(move => this.isCSquare(move));
    if (cSquareMoves.length > 0) {
      weaknesses.push('c_square_mistakes');
    }

    // Check for mobility mistakes
    if (this.analyzeMobilityMistakes(moves) > 0.3) {
      weaknesses.push('mobility_mistakes');
    }

    // Check for timing mistakes
    if (this.analyzeTimingMistakes(moves, gameHistory) > 0.3) {
      weaknesses.push('timing_mistakes');
    }

    // Check for endgame mistakes
    if (this.analyzeEndgameMistakes(moves, gameHistory) > 0.3) {
      weaknesses.push('endgame_mistakes');
    }

    return weaknesses;
  }

  /**
   * Determine playing style
   */
  private determinePlayingStyle(
    patterns: MovePatternAnalysis,
    preferences: string[]
  ): 'aggressive' | 'defensive' | 'balanced' {
    let aggressiveScore = 0;
    let defensiveScore = 0;

    // Aggressive indicators
    if (patterns.cornerPreference > 0.4) aggressiveScore += 2;
    if (patterns.riskTolerance > 0.6) aggressiveScore += 2;
    if (preferences.includes('mobility_focus')) aggressiveScore += 1;
    if (patterns.consistency < 0.5) aggressiveScore += 1;

    // Defensive indicators
    if (patterns.edgePreference > 0.5) defensiveScore += 2;
    if (patterns.riskTolerance < 0.4) defensiveScore += 2;
    if (preferences.includes('stability_focus')) defensiveScore += 1;
    if (patterns.consistency > 0.7) defensiveScore += 1;

    if (aggressiveScore > defensiveScore + 1) return 'aggressive';
    if (defensiveScore > aggressiveScore + 1) return 'defensive';
    return 'balanced';
  }

  /**
   * Generate profile summary
   */
  private generateProfileSummary(
    style: 'aggressive' | 'defensive' | 'balanced',
    preferences: string[],
    weaknesses: string[]
  ): string {
    const parts = [];

    // Style description
    switch (style) {
      case 'aggressive':
        parts.push('Aggressive player');
        break;
      case 'defensive':
        parts.push('Defensive player');
        break;
      case 'balanced':
        parts.push('Balanced player');
        break;
    }

    // Key preferences
    if (preferences.length > 0) {
      parts.push(`Prefers: ${preferences.join(', ')}`);
    }

    // Key weaknesses
    if (weaknesses.length > 0) {
      parts.push(`Weaknesses: ${weaknesses.join(', ')}`);
    }

    return parts.join(' | ');
  }

  /**
   * Store analysis for learning
   */
  private storeAnalysis(profile: OpponentProfile, moves: Position[]): void {
    const analysis: OpponentAnalysisHistory = {
      timestamp: Date.now(),
      profile,
      moves: [...moves],
      patterns: this.extractPatterns(moves)
    };

    this.analysisHistory.push(analysis);

    // Keep only last 100 analyses
    if (this.analysisHistory.length > 100) {
      this.analysisHistory.shift();
    }
  }

  /**
   * Extract patterns from moves
   */
  private extractPatterns(moves: Position[]): string[] {
    const patterns: string[] = [];

    // Corner patterns
    if (moves.some(move => this.isCorner(move))) {
      patterns.push('corner_play');
    }

    // Edge patterns
    if (moves.some(move => this.isEdge(move))) {
      patterns.push('edge_play');
    }

    // Center patterns
    if (moves.some(move => this.isCenter(move))) {
      patterns.push('center_play');
    }

    // X-square patterns
    if (moves.some(move => this.isXSquare(move))) {
      patterns.push('x_square_play');
    }

    // C-square patterns
    if (moves.some(move => this.isCSquare(move))) {
      patterns.push('c_square_play');
    }

    return patterns;
  }

  /**
   * Check if move is corner
   */
  private isCorner(move: Position): boolean {
    const { row, col } = move;
    return (row === 0 || row === 7) && (col === 0 || col === 7);
  }

  /**
   * Check if move is edge
   */
  private isEdge(move: Position): boolean {
    const { row, col } = move;
    return row === 0 || row === 7 || col === 0 || col === 7;
  }

  /**
   * Check if move is center
   */
  private isCenter(move: Position): boolean {
    const { row, col } = move;
    return row >= 3 && row <= 4 && col >= 3 && col <= 4;
  }

  /**
   * Check if move is X-square
   */
  private isXSquare(move: Position): boolean {
    const { row, col } = move;
    const xSquares = [[1,1], [1,6], [6,1], [6,6]];
    return xSquares.some(([r, c]) => row === r && col === c);
  }

  /**
   * Check if move is C-square
   */
  private isCSquare(move: Position): boolean {
    const { row, col } = move;
    const cSquares = [
      [0,1], [1,0], [0,6], [1,7],
      [6,0], [7,1], [6,7], [7,6]
    ];
    return cSquares.some(([r, c]) => row === r && col === c);
  }

  /**
   * Analyze mobility style
   */
  private analyzeMobilityStyle(moves: Position[]): number {
    // Simplified mobility analysis
    // In real implementation, this would analyze actual mobility patterns
    return Math.random() * 0.5 + 0.25; // Placeholder
  }

  /**
   * Analyze risk tolerance
   */
  private analyzeRiskTolerance(moves: Position[]): number {
    let riskScore = 0;
    
    // X-squares indicate high risk tolerance
    const xSquareMoves = moves.filter(move => this.isXSquare(move));
    riskScore += xSquareMoves.length * 0.3;
    
    // C-squares indicate medium risk tolerance
    const cSquareMoves = moves.filter(move => this.isCSquare(move));
    riskScore += cSquareMoves.length * 0.2;
    
    // Corners indicate low risk tolerance
    const cornerMoves = moves.filter(move => this.isCorner(move));
    riskScore -= cornerMoves.length * 0.1;
    
    return Math.max(0, Math.min(1, riskScore / moves.length));
  }

  /**
   * Analyze consistency
   */
  private analyzeConsistency(moves: Position[]): number {
    if (moves.length < 3) return 1;
    
    // Analyze move pattern consistency
    const patterns = this.extractPatterns(moves);
    const uniquePatterns = new Set(patterns);
    
    // More unique patterns = less consistent
    return 1 - (uniquePatterns.size / patterns.length);
  }

  /**
   * Analyze stability preference
   */
  private analyzeStabilityPreference(moves: Position[]): number {
    // Corners and safe edges indicate stability preference
    const stableMoves = moves.filter(move => 
      this.isCorner(move) || (this.isEdge(move) && this.isEdgeSafe(move))
    );
    
    return stableMoves.length / moves.length;
  }

  /**
   * Check if edge move is safe
   */
  private isEdgeSafe(move: Position): boolean {
    // Simplified edge safety check
    return true; // Placeholder
  }

  /**
   * Analyze mobility mistakes
   */
  private analyzeMobilityMistakes(moves: Position[]): number {
    // Simplified mobility mistake analysis
    return Math.random() * 0.5; // Placeholder
  }

  /**
   * Analyze timing mistakes
   */
  private analyzeTimingMistakes(moves: Position[], gameHistory: GameHistory): number {
    // Simplified timing mistake analysis
    return Math.random() * 0.5; // Placeholder
  }

  /**
   * Analyze endgame mistakes
   */
  private analyzeEndgameMistakes(moves: Position[], gameHistory: GameHistory): number {
    // Simplified endgame mistake analysis
    return Math.random() * 0.5; // Placeholder
  }

  /**
   * Initialize pattern database
   */
  private initializePatternDatabase(): void {
    // Initialize with common patterns
    this.patternDatabase.set('corner_control', {
      name: 'Corner Control',
      description: 'Focuses on controlling corners',
      strength: 0.8,
      weakness: 0.2
    });
    
    this.patternDatabase.set('edge_control', {
      name: 'Edge Control',
      description: 'Focuses on controlling edges',
      strength: 0.6,
      weakness: 0.4
    });
    
    this.patternDatabase.set('mobility_focus', {
      name: 'Mobility Focus',
      description: 'Focuses on maintaining mobility',
      strength: 0.7,
      weakness: 0.3
    });
  }

  /**
   * Get analysis statistics
   */
  getAnalysisStats(): OpponentAnalysisStats {
    return {
      totalAnalyses: this.analysisHistory.length,
      uniqueOpponents: new Set(this.analysisHistory.map(a => a.profile.style)).size,
      averageMoves: this.analysisHistory.reduce((sum, a) => sum + a.moves.length, 0) / this.analysisHistory.length,
      patternCount: this.patternDatabase.size
    };
  }
}

export interface MovePatternAnalysis {
  cornerPreference: number;
  edgePreference: number;
  centerPreference: number;
  mobilityStyle: number;
  riskTolerance: number;
  consistency: number;
}

export interface OpponentAnalysisHistory {
  timestamp: number;
  profile: OpponentProfile;
  moves: Position[];
  patterns: string[];
}

export interface PatternData {
  name: string;
  description: string;
  strength: number;
  weakness: number;
}

export interface OpponentAnalysisStats {
  totalAnalyses: number;
  uniqueOpponents: number;
  averageMoves: number;
  patternCount: number;
}
