// Adaptive Strategy System for Engine Zenith
// Adapts strategy based on opponent analysis and learning data

import type { Board, Player, Position } from '../../../types';
import { OpponentProfile, LearningData } from '../index';

export class AdaptiveStrategy {
  private strategyHistory: StrategyHistory[] = [];
  private adaptationRules: Map<string, AdaptationRule> = new Map();
  private currentStrategy: StrategyConfig;

  constructor() {
    this.currentStrategy = this.getDefaultStrategy();
    this.initializeAdaptationRules();
  }

  /**
   * Adapt strategy based on analysis and learning
   */
  adaptStrategy(
    strategicAnalysis: any,
    opponentProfile: OpponentProfile | null,
    learningData: LearningData
  ): AdaptiveStrategy {
    // 1. Analyze current situation
    const situation = this.analyzeSituation(strategicAnalysis, opponentProfile);
    
    // 2. Determine adaptation needs
    const adaptationNeeds = this.determineAdaptationNeeds(situation, learningData);
    
    // 3. Apply adaptations
    this.applyAdaptations(adaptationNeeds);
    
    // 4. Store strategy change
    this.storeStrategyChange(situation, adaptationNeeds);
    
    return this;
  }

  /**
   * Get move value based on current strategy
   */
  getMoveValue(move: Position): number {
    let value = 0;
    
    // 1. Base strategy value
    value += this.getBaseStrategyValue(move);
    
    // 2. Adaptive adjustments
    value += this.getAdaptiveAdjustments(move);
    
    // 3. Learning-based adjustments
    value += this.getLearningAdjustments(move);
    
    return value;
  }

  /**
   * Analyze current situation
   */
  private analyzeSituation(
    strategicAnalysis: any,
    opponentProfile: OpponentProfile | null
  ): SituationAnalysis {
    return {
      mobility: strategicAnalysis.mobility,
      frontier: strategicAnalysis.frontier,
      stability: strategicAnalysis.stability,
      cornerControl: strategicAnalysis.cornerControl,
      edgeControl: strategicAnalysis.edgeControl,
      centerControl: strategicAnalysis.centerControl,
      safety: strategicAnalysis.safety,
      opponentStyle: opponentProfile?.style || 'balanced',
      opponentPreferences: opponentProfile?.preferences || [],
      opponentWeaknesses: opponentProfile?.weaknesses || [],
      timestamp: Date.now()
    };
  }

  /**
   * Determine adaptation needs
   */
  private determineAdaptationNeeds(
    situation: SituationAnalysis,
    learningData: LearningData
  ): AdaptationNeeds {
    const needs: AdaptationNeeds = {
      mobilityAdjustment: 0,
      frontierAdjustment: 0,
      stabilityAdjustment: 0,
      cornerAdjustment: 0,
      edgeAdjustment: 0,
      centerAdjustment: 0,
      safetyAdjustment: 0,
      opponentSpecificAdjustments: []
    };

    // 1. Mobility adjustments
    if (situation.mobility < -20) {
      needs.mobilityAdjustment = 0.3; // Increase mobility focus
    } else if (situation.mobility > 20) {
      needs.mobilityAdjustment = -0.2; // Decrease mobility focus
    }

    // 2. Frontier adjustments
    if (situation.frontier > 20) {
      needs.frontierAdjustment = 0.2; // Increase frontier focus
    }

    // 3. Stability adjustments
    if (situation.stability < -20) {
      needs.stabilityAdjustment = 0.3; // Increase stability focus
    }

    // 4. Corner adjustments
    if (situation.cornerControl < -50) {
      needs.cornerAdjustment = 0.4; // Increase corner focus
    }

    // 5. Safety adjustments
    if (situation.safety < -20) {
      needs.safetyAdjustment = 0.3; // Increase safety focus
    }

    // 6. Opponent-specific adjustments
    needs.opponentSpecificAdjustments = this.getOpponentSpecificAdjustments(situation);

    // 7. Learning-based adjustments
    this.applyLearningAdjustments(needs, learningData);

    return needs;
  }

  /**
   * Apply adaptations
   */
  private applyAdaptations(needs: AdaptationNeeds): void {
    // Update strategy configuration
    this.currentStrategy.mobilityWeight += needs.mobilityAdjustment;
    this.currentStrategy.frontierWeight += needs.frontierAdjustment;
    this.currentStrategy.stabilityWeight += needs.stabilityAdjustment;
    this.currentStrategy.cornerWeight += needs.cornerAdjustment;
    this.currentStrategy.edgeWeight += needs.edgeAdjustment;
    this.currentStrategy.centerWeight += needs.centerAdjustment;
    this.currentStrategy.safetyWeight += needs.safetyAdjustment;

    // Apply opponent-specific adjustments
    for (const adjustment of needs.opponentSpecificAdjustments) {
      this.applyOpponentAdjustment(adjustment);
    }

    // Normalize weights
    this.normalizeWeights();
  }

  /**
   * Get base strategy value
   */
  private getBaseStrategyValue(move: Position): number {
    let value = 0;
    
    // Corner value
    if (this.isCorner(move)) {
      value += 100 * this.currentStrategy.cornerWeight;
    }
    
    // Edge value
    if (this.isEdge(move)) {
      value += 20 * this.currentStrategy.edgeWeight;
    }
    
    // Center value
    if (this.isCenter(move)) {
      value += 15 * this.currentStrategy.centerWeight;
    }
    
    // Safety value
    if (this.isSafeMove(move)) {
      value += 30 * this.currentStrategy.safetyWeight;
    }
    
    return value;
  }

  /**
   * Get adaptive adjustments
   */
  private getAdaptiveAdjustments(move: Position): number {
    let adjustment = 0;
    
    // Mobility adjustments
    if (this.isMobilityMove(move)) {
      adjustment += 20 * this.currentStrategy.mobilityWeight;
    }
    
    // Frontier adjustments
    if (this.isFrontierMove(move)) {
      adjustment += 15 * this.currentStrategy.frontierWeight;
    }
    
    // Stability adjustments
    if (this.isStabilityMove(move)) {
      adjustment += 25 * this.currentStrategy.stabilityWeight;
    }
    
    return adjustment;
  }

  /**
   * Get learning adjustments
   */
  private getLearningAdjustments(move: Position): number {
    let adjustment = 0;
    
    // Check if move matches learned patterns
    const moveKey = `${move.row}-${move.col}`;
    const pattern = this.currentStrategy.learnedPatterns.get(moveKey);
    
    if (pattern) {
      adjustment += pattern.value * pattern.confidence;
    }
    
    return adjustment;
  }

  /**
   * Get opponent-specific adjustments
   */
  private getOpponentSpecificAdjustments(situation: SituationAnalysis): OpponentAdjustment[] {
    const adjustments: OpponentAdjustment[] = [];
    
    switch (situation.opponentStyle) {
      case 'aggressive':
        // Against aggressive opponents, focus on stability
        adjustments.push({
          type: 'stability',
          value: 0.3,
          reason: 'Opponent is aggressive'
        });
        break;
        
      case 'defensive':
        // Against defensive opponents, focus on mobility
        adjustments.push({
          type: 'mobility',
          value: 0.3,
          reason: 'Opponent is defensive'
        });
        break;
        
      case 'balanced':
        // Against balanced opponents, use balanced approach
        adjustments.push({
          type: 'balanced',
          value: 0.1,
          reason: 'Opponent is balanced'
        });
        break;
    }
    
    // Exploit opponent weaknesses
    for (const weakness of situation.opponentWeaknesses) {
      adjustments.push({
        type: 'exploit_weakness',
        value: 0.2,
        reason: `Exploit weakness: ${weakness}`
      });
    }
    
    return adjustments;
  }

  /**
   * Apply learning adjustments
   */
  private applyLearningAdjustments(needs: AdaptationNeeds, learningData: LearningData): void {
    // Analyze learning data for patterns
    const positivePatterns = this.analyzePositivePatterns(learningData);
    const negativePatterns = this.analyzeNegativePatterns(learningData);
    
    // Adjust strategy based on learning
    for (const pattern of positivePatterns) {
      needs.mobilityAdjustment += pattern.mobilityImpact * 0.1;
      needs.stabilityAdjustment += pattern.stabilityImpact * 0.1;
      needs.cornerAdjustment += pattern.cornerImpact * 0.1;
    }
    
    for (const pattern of negativePatterns) {
      needs.mobilityAdjustment -= pattern.mobilityImpact * 0.1;
      needs.stabilityAdjustment -= pattern.stabilityImpact * 0.1;
      needs.cornerAdjustment -= pattern.cornerImpact * 0.1;
    }
  }

  /**
   * Apply opponent adjustment
   */
  private applyOpponentAdjustment(adjustment: OpponentAdjustment): void {
    switch (adjustment.type) {
      case 'mobility':
        this.currentStrategy.mobilityWeight += adjustment.value;
        break;
      case 'stability':
        this.currentStrategy.stabilityWeight += adjustment.value;
        break;
      case 'corner':
        this.currentStrategy.cornerWeight += adjustment.value;
        break;
      case 'balanced':
        // Apply balanced adjustments
        this.currentStrategy.mobilityWeight += adjustment.value * 0.5;
        this.currentStrategy.stabilityWeight += adjustment.value * 0.5;
        break;
    }
  }

  /**
   * Normalize weights
   */
  private normalizeWeights(): void {
    const total = this.currentStrategy.mobilityWeight +
                  this.currentStrategy.frontierWeight +
                  this.currentStrategy.stabilityWeight +
                  this.currentStrategy.cornerWeight +
                  this.currentStrategy.edgeWeight +
                  this.currentStrategy.centerWeight +
                  this.currentStrategy.safetyWeight;
    
    if (total > 0) {
      this.currentStrategy.mobilityWeight /= total;
      this.currentStrategy.frontierWeight /= total;
      this.currentStrategy.stabilityWeight /= total;
      this.currentStrategy.cornerWeight /= total;
      this.currentStrategy.edgeWeight /= total;
      this.currentStrategy.centerWeight /= total;
      this.currentStrategy.safetyWeight /= total;
    }
  }

  /**
   * Store strategy change
   */
  private storeStrategyChange(
    situation: SituationAnalysis,
    adaptationNeeds: AdaptationNeeds
  ): void {
    const change: StrategyHistory = {
      timestamp: Date.now(),
      situation,
      adaptationNeeds,
      strategy: { ...this.currentStrategy },
      effectiveness: 0 // Will be updated based on results
    };
    
    this.strategyHistory.push(change);
    
    // Keep only last 100 changes
    if (this.strategyHistory.length > 100) {
      this.strategyHistory.shift();
    }
  }

  /**
   * Get default strategy
   */
  private getDefaultStrategy(): StrategyConfig {
    return {
      mobilityWeight: 1.0,
      frontierWeight: 1.0,
      stabilityWeight: 1.0,
      cornerWeight: 1.0,
      edgeWeight: 1.0,
      centerWeight: 1.0,
      safetyWeight: 1.0,
      learnedPatterns: new Map(),
      adaptationRules: new Map()
    };
  }

  /**
   * Initialize adaptation rules
   */
  private initializeAdaptationRules(): void {
    // Initialize adaptation rules
    this.adaptationRules.set('mobility_low', {
      condition: (situation: SituationAnalysis) => situation.mobility < -20,
      action: (strategy: StrategyConfig) => {
        strategy.mobilityWeight += 0.3;
      },
      description: 'Increase mobility focus when mobility is low'
    });
    
    this.adaptationRules.set('stability_low', {
      condition: (situation: SituationAnalysis) => situation.stability < -20,
      action: (strategy: StrategyConfig) => {
        strategy.stabilityWeight += 0.3;
      },
      description: 'Increase stability focus when stability is low'
    });
    
    this.adaptationRules.set('corner_low', {
      condition: (situation: SituationAnalysis) => situation.cornerControl < -50,
      action: (strategy: StrategyConfig) => {
        strategy.cornerWeight += 0.4;
      },
      description: 'Increase corner focus when corner control is low'
    });
  }

  /**
   * Analyze positive patterns
   */
  private analyzePositivePatterns(learningData: LearningData): PatternAnalysis[] {
    const patterns: PatternAnalysis[] = [];
    
    // Analyze patterns from learning data
    for (const [key, pattern] of learningData.patterns) {
      if (pattern.score > 0) {
        patterns.push({
          key,
          mobilityImpact: 0.1,
          stabilityImpact: 0.1,
          cornerImpact: 0.1,
          confidence: 0.8
        });
      }
    }
    
    return patterns;
  }

  /**
   * Analyze negative patterns
   */
  private analyzeNegativePatterns(learningData: LearningData): PatternAnalysis[] {
    const patterns: PatternAnalysis[] = [];
    
    // Analyze negative patterns from learning data
    for (const mistake of learningData.mistakes) {
      patterns.push({
        key: mistake,
        mobilityImpact: -0.1,
        stabilityImpact: -0.1,
        cornerImpact: -0.1,
        confidence: 0.8
      });
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
   * Check if move is safe
   */
  private isSafeMove(move: Position): boolean {
    // Simplified safety check
    return !this.isDangerousSquare(move);
  }

  /**
   * Check if square is dangerous
   */
  private isDangerousSquare(move: Position): boolean {
    const { row, col } = move;
    
    // X-squares
    const xSquares = [[1,1], [1,6], [6,1], [6,6]];
    if (xSquares.some(([r, c]) => row === r && col === c)) {
      return true;
    }
    
    // C-squares
    const cSquares = [
      [0,1], [1,0], [0,6], [1,7],
      [6,0], [7,1], [6,7], [7,6]
    ];
    if (cSquares.some(([r, c]) => row === r && col === c)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if move is mobility move
   */
  private isMobilityMove(move: Position): boolean {
    // Simplified mobility check
    return this.isCenter(move);
  }

  /**
   * Check if move is frontier move
   */
  private isFrontierMove(move: Position): boolean {
    // Simplified frontier check
    return this.isEdge(move);
  }

  /**
   * Check if move is stability move
   */
  private isStabilityMove(move: Position): boolean {
    // Simplified stability check
    return this.isCorner(move);
  }

  /**
   * Get strategy statistics
   */
  getStrategyStats(): StrategyStats {
    return {
      totalChanges: this.strategyHistory.length,
      averageEffectiveness: this.strategyHistory.reduce((sum, h) => sum + h.effectiveness, 0) / this.strategyHistory.length,
      currentWeights: { ...this.currentStrategy },
      adaptationRules: this.adaptationRules.size
    };
  }
}

export interface StrategyConfig {
  mobilityWeight: number;
  frontierWeight: number;
  stabilityWeight: number;
  cornerWeight: number;
  edgeWeight: number;
  centerWeight: number;
  safetyWeight: number;
  learnedPatterns: Map<string, PatternData>;
  adaptationRules: Map<string, AdaptationRule>;
}

export interface SituationAnalysis {
  mobility: number;
  frontier: number;
  stability: number;
  cornerControl: number;
  edgeControl: number;
  centerControl: number;
  safety: number;
  opponentStyle: 'aggressive' | 'defensive' | 'balanced';
  opponentPreferences: string[];
  opponentWeaknesses: string[];
  timestamp: number;
}

export interface AdaptationNeeds {
  mobilityAdjustment: number;
  frontierAdjustment: number;
  stabilityAdjustment: number;
  cornerAdjustment: number;
  edgeAdjustment: number;
  centerAdjustment: number;
  safetyAdjustment: number;
  opponentSpecificAdjustments: OpponentAdjustment[];
}

export interface OpponentAdjustment {
  type: string;
  value: number;
  reason: string;
}

export interface PatternAnalysis {
  key: string;
  mobilityImpact: number;
  stabilityImpact: number;
  cornerImpact: number;
  confidence: number;
}

export interface PatternData {
  value: number;
  confidence: number;
  timestamp: number;
}

export interface AdaptationRule {
  condition: (situation: SituationAnalysis) => boolean;
  action: (strategy: StrategyConfig) => void;
  description: string;
}

export interface StrategyHistory {
  timestamp: number;
  situation: SituationAnalysis;
  adaptationNeeds: AdaptationNeeds;
  strategy: StrategyConfig;
  effectiveness: number;
}

export interface StrategyStats {
  totalChanges: number;
  averageEffectiveness: number;
  currentWeights: StrategyConfig;
  adaptationRules: number;
}
