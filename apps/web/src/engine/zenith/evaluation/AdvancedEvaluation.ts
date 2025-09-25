// Advanced Evaluation System for Engine Zenith
// Implements multi-factor evaluation with strategic insights

import type { Board, Player, Position } from '../../../types';
import { GamePhase, EvaluationResult } from '../index';

export interface StrategicAnalysis {
  mobility: number;
  frontier: number;
  stability: number;
  cornerControl: number;
  edgeControl: number;
  centerControl: number;
  safety: number;
  summary: string;
  getMoveValue(move: Position): number;
}

export class AdvancedEvaluation {
  private weights: EvaluationWeights;
  private phaseWeights: Map<GamePhase, EvaluationWeights>;

  constructor() {
    this.weights = this.getDefaultWeights();
    this.phaseWeights = this.initializePhaseWeights();
  }

  /**
   * Main evaluation function
   */
  evaluateBoard(
    board: Board,
    player: Player,
    gamePhase: GamePhase,
    strategicAnalysis: StrategicAnalysis
  ): EvaluationResult {
    const opponent: Player = player === 'black' ? 'white' : 'black';
    const weights = this.phaseWeights.get(gamePhase) || this.weights;
    
    let totalScore = 0;
    let confidence = 0;
    let depth = 0;
    let nodes = 0;

    // 1. Material count (endgame focus)
    const materialScore = this.evaluateMaterial(board, player, opponent);
    totalScore += materialScore * weights.material;

    // 2. Positional evaluation
    const positionalScore = this.evaluatePosition(board, player, opponent);
    totalScore += positionalScore * weights.position;

    // 3. Mobility evaluation
    const mobilityScore = this.evaluateMobility(board, player, opponent);
    totalScore += mobilityScore * weights.mobility;

    // 4. Frontier evaluation
    const frontierScore = this.evaluateFrontier(board, player, opponent);
    totalScore += frontierScore * weights.frontier;

    // 5. Stability evaluation
    const stabilityScore = this.evaluateStability(board, player, opponent);
    totalScore += stabilityScore * weights.stability;

    // 6. Corner evaluation
    const cornerScore = this.evaluateCorners(board, player, opponent);
    totalScore += cornerScore * weights.corner;

    // 7. Edge evaluation
    const edgeScore = this.evaluateEdges(board, player, opponent);
    totalScore += edgeScore * weights.edge;

    // 8. Center evaluation
    const centerScore = this.evaluateCenter(board, player, opponent);
    totalScore += centerScore * weights.center;

    // 9. Safety evaluation
    const safetyScore = this.evaluateSafety(board, player, opponent);
    totalScore += safetyScore * weights.safety;

    // 10. Strategic evaluation
    const strategicScore = this.evaluateStrategic(board, player, strategicAnalysis);
    totalScore += strategicScore * weights.strategic;

    // Calculate confidence based on evaluation factors
    confidence = this.calculateConfidence(board, player, gamePhase);
    
    // Calculate depth and nodes (simplified)
    depth = this.calculateDepth(gamePhase);
    nodes = this.calculateNodes(gamePhase);

    return {
      score: totalScore,
      depth,
      nodes,
      confidence,
      pv: this.calculatePV(board, player)
    };
  }

  /**
   * Evaluate material count
   */
  private evaluateMaterial(board: Board, player: Player, opponent: Player): number {
    let playerCount = 0;
    let opponentCount = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === player) playerCount++;
        else if (board[r][c] === opponent) opponentCount++;
      }
    }

    return playerCount - opponentCount;
  }

  /**
   * Evaluate positional value
   */
  private evaluatePosition(board: Board, player: Player, opponent: Player): number {
    const POSITIONAL_WEIGHTS = [
      [120, -20, 20, 5, 5, 20, -20, 120],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [20, -5, 15, 3, 3, 15, -5, 20],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [20, -5, 15, 3, 3, 15, -5, 20],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [120, -20, 20, 5, 5, 20, -20, 120],
    ];

    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === player) {
          score += POSITIONAL_WEIGHTS[r][c];
        } else if (board[r][c] === opponent) {
          score -= POSITIONAL_WEIGHTS[r][c];
        }
      }
    }

    return score;
  }

  /**
   * Evaluate mobility
   */
  private evaluateMobility(board: Board, player: Player, opponent: Player): number {
    const playerMoves = this.countValidMoves(board, player);
    const opponentMoves = this.countValidMoves(board, opponent);
    
    return playerMoves - opponentMoves;
  }

  /**
   * Evaluate frontier discs
   */
  private evaluateFrontier(board: Board, player: Player, opponent: Player): number {
    const playerFrontier = this.countFrontierDiscs(board, player);
    const opponentFrontier = this.countFrontierDiscs(board, opponent);
    
    // Fewer frontier discs is better
    return opponentFrontier - playerFrontier;
  }

  /**
   * Evaluate stability
   */
  private evaluateStability(board: Board, player: Player, opponent: Player): number {
    const playerStable = this.countStableDiscs(board, player);
    const opponentStable = this.countStableDiscs(board, opponent);
    
    return playerStable - opponentStable;
  }

  /**
   * Evaluate corners
   */
  private evaluateCorners(board: Board, player: Player, opponent: Player): number {
    const corners = [[0,0], [0,7], [7,0], [7,7]];
    let score = 0;

    for (const [r, c] of corners) {
      if (board[r][c] === player) score += 100;
      else if (board[r][c] === opponent) score -= 100;
    }

    return score;
  }

  /**
   * Evaluate edges
   */
  private evaluateEdges(board: Board, player: Player, opponent: Player): number {
    let score = 0;
    
    // Top and bottom edges
    for (let c = 0; c < 8; c++) {
      if (board[0][c] === player) score += 10;
      else if (board[0][c] === opponent) score -= 10;
      if (board[7][c] === player) score += 10;
      else if (board[7][c] === opponent) score -= 10;
    }
    
    // Left and right edges
    for (let r = 0; r < 8; r++) {
      if (board[r][0] === player) score += 10;
      else if (board[r][0] === opponent) score -= 10;
      if (board[r][7] === player) score += 10;
      else if (board[r][7] === opponent) score -= 10;
    }

    return score;
  }

  /**
   * Evaluate center control
   */
  private evaluateCenter(board: Board, player: Player, opponent: Player): number {
    const center = [[3,3], [3,4], [4,3], [4,4]];
    let score = 0;

    for (const [r, c] of center) {
      if (board[r][c] === player) score += 20;
      else if (board[r][c] === opponent) score -= 20;
    }

    return score;
  }

  /**
   * Evaluate safety
   */
  private evaluateSafety(board: Board, player: Player, opponent: Player): number {
    let score = 0;
    
    // Check for dangerous X-squares
    const xSquares = [[1,1], [1,6], [6,1], [6,6]];
    for (const [r, c] of xSquares) {
      if (board[r][c] === player) {
        // Check if corresponding corner is empty
        const cornerRow = r === 1 ? 0 : 7;
        const cornerCol = c === 1 ? 0 : 7;
        if (board[cornerRow][cornerCol] === null) {
          score -= 50; // Penalty for dangerous X-square
        }
      }
    }

    return score;
  }

  /**
   * Evaluate strategic factors
   */
  private evaluateStrategic(board: Board, player: Player, strategicAnalysis: StrategicAnalysis): number {
    return strategicAnalysis.mobility * 0.3 +
           strategicAnalysis.frontier * 0.2 +
           strategicAnalysis.stability * 0.2 +
           strategicAnalysis.cornerControl * 0.15 +
           strategicAnalysis.edgeControl * 0.1 +
           strategicAnalysis.centerControl * 0.05;
  }

  /**
   * Count valid moves
   */
  private countValidMoves(board: Board, player: Player): number {
    // Simplified move counting
    let count = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === null && this.isValidMove(board, { row: r, col: c }, player)) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Check if move is valid (simplified)
   */
  private isValidMove(board: Board, move: Position, player: Player): boolean {
    // This is a simplified version - in real implementation,
    // you would use the actual game logic
    return true;
  }

  /**
   * Count frontier discs
   */
  private countFrontierDiscs(board: Board, player: Player): number {
    let count = 0;
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === player) {
          // Check if adjacent to empty square
          let isFrontier = false;
          for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === null) {
              isFrontier = true;
              break;
            }
          }
          if (isFrontier) count++;
        }
      }
    }

    return count;
  }

  /**
   * Count stable discs
   */
  private countStableDiscs(board: Board, player: Player): number {
    let count = 0;
    
    // Corners are always stable
    const corners = [[0,0], [0,7], [7,0], [7,7]];
    for (const [r, c] of corners) {
      if (board[r][c] === player) count++;
    }
    
    // Edges can be stable if properly controlled
    // This is simplified - real implementation would be more complex
    for (let c = 0; c < 8; c++) {
      if (board[0][c] === player) count += 0.5;
      if (board[7][c] === player) count += 0.5;
    }
    for (let r = 0; r < 8; r++) {
      if (board[r][0] === player) count += 0.5;
      if (board[r][7] === player) count += 0.5;
    }

    return Math.floor(count);
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(board: Board, player: Player, gamePhase: GamePhase): number {
    let confidence = 50; // Base confidence
    
    // Increase confidence based on game phase
    switch (gamePhase) {
      case 'opening':
        confidence += 20;
        break;
      case 'midgame':
        confidence += 30;
        break;
      case 'late_midgame':
        confidence += 40;
        break;
      case 'endgame':
        confidence += 50;
        break;
    }
    
    // Increase confidence based on board control
    const cornerControl = this.countCorners(board, player);
    confidence += cornerControl * 10;
    
    return Math.min(100, confidence);
  }

  /**
   * Count corners controlled
   */
  private countCorners(board: Board, player: Player): number {
    const corners = [[0,0], [0,7], [7,0], [7,7]];
    let count = 0;
    
    for (const [r, c] of corners) {
      if (board[r][c] === player) count++;
    }
    
    return count;
  }

  /**
   * Calculate depth
   */
  private calculateDepth(gamePhase: GamePhase): number {
    switch (gamePhase) {
      case 'opening': return 8;
      case 'midgame': return 12;
      case 'late_midgame': return 16;
      case 'endgame': return 20;
      default: return 10;
    }
  }

  /**
   * Calculate nodes
   */
  private calculateNodes(gamePhase: GamePhase): number {
    switch (gamePhase) {
      case 'opening': return 10000;
      case 'midgame': return 50000;
      case 'late_midgame': return 100000;
      case 'endgame': return 200000;
      default: return 25000;
    }
  }

  /**
   * Calculate principal variation
   */
  private calculatePV(board: Board, player: Player): Position[] {
    // Simplified PV calculation
    // In real implementation, this would be calculated during search
    return [];
  }

  /**
   * Get default weights
   */
  private getDefaultWeights(): EvaluationWeights {
    return {
      material: 1.0,
      position: 1.0,
      mobility: 1.0,
      frontier: 1.0,
      stability: 1.0,
      corner: 1.0,
      edge: 1.0,
      center: 1.0,
      safety: 1.0,
      strategic: 1.0
    };
  }

  /**
   * Initialize phase-specific weights
   */
  private initializePhaseWeights(): Map<GamePhase, EvaluationWeights> {
    const weights = new Map<GamePhase, EvaluationWeights>();
    
    // Opening weights
    weights.set('opening', {
      material: 0.1,
      position: 1.0,
      mobility: 1.5,
      frontier: 0.8,
      stability: 0.3,
      corner: 2.0,
      edge: 0.5,
      center: 1.2,
      safety: 1.5,
      strategic: 1.0
    });
    
    // Midgame weights
    weights.set('midgame', {
      material: 0.3,
      position: 1.0,
      mobility: 1.2,
      frontier: 1.0,
      stability: 0.8,
      corner: 1.5,
      edge: 0.8,
      center: 1.0,
      safety: 1.2,
      strategic: 1.0
    });
    
    // Late midgame weights
    weights.set('late_midgame', {
      material: 0.5,
      position: 1.0,
      mobility: 1.0,
      frontier: 1.2,
      stability: 1.2,
      corner: 1.8,
      edge: 1.0,
      center: 0.8,
      safety: 1.0,
      strategic: 1.0
    });
    
    // Endgame weights
    weights.set('endgame', {
      material: 2.0,
      position: 0.5,
      mobility: 0.3,
      frontier: 0.5,
      stability: 1.5,
      corner: 2.0,
      edge: 1.2,
      center: 0.5,
      safety: 0.8,
      strategic: 1.0
    });
    
    return weights;
  }
}

export interface EvaluationWeights {
  material: number;
  position: number;
  mobility: number;
  frontier: number;
  stability: number;
  corner: number;
  edge: number;
  center: number;
  safety: number;
  strategic: number;
}
