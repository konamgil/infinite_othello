// Strategic Analysis System for Engine Zenith
// Analyzes board position and provides strategic insights

import type { Board, Player, Position } from '../../../types';
import { GamePhase, OpponentProfile } from '../index';

export interface StrategicAnalysisResult {
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

export class StrategicAnalysis {
  private gamePhase: GamePhase;
  private opponentProfile: OpponentProfile | null;

  constructor() {
    this.gamePhase = 'opening';
    this.opponentProfile = null;
  }

  /**
   * Analyze board position strategically
   */
  analyzePosition(
    board: Board,
    player: Player,
    gamePhase: GamePhase,
    opponentProfile: OpponentProfile | null
  ): any {
    this.gamePhase = gamePhase;
    this.opponentProfile = opponentProfile;

    const analysis: StrategicAnalysisResult = {
      mobility: this.analyzeMobility(board, player),
      frontier: this.analyzeFrontier(board, player),
      stability: this.analyzeStability(board, player),
      cornerControl: this.analyzeCornerControl(board, player),
      edgeControl: this.analyzeEdgeControl(board, player),
      centerControl: this.analyzeCenterControl(board, player),
      safety: this.analyzeSafety(board, player),
      summary: '',
      getMoveValue: (move: Position) => this.getMoveValue(move, board, player)
    };

    analysis.summary = this.generateSummary(analysis);
    return analysis;
  }

  /**
   * Analyze mobility
   */
  private analyzeMobility(board: Board, player: Player): number {
    const playerMoves = this.countValidMoves(board, player);
    const opponentMoves = this.countValidMoves(board, this.getOpponent(player));
    
    // Normalize mobility score
    const totalMoves = playerMoves + opponentMoves;
    if (totalMoves === 0) return 0;
    
    return (playerMoves - opponentMoves) / totalMoves * 100;
  }

  /**
   * Analyze frontier
   */
  private analyzeFrontier(board: Board, player: Player): number {
    const playerFrontier = this.countFrontierDiscs(board, player);
    const opponentFrontier = this.countFrontierDiscs(board, this.getOpponent(player));
    
    // Fewer frontier discs is better
    const totalFrontier = playerFrontier + opponentFrontier;
    if (totalFrontier === 0) return 0;
    
    return (opponentFrontier - playerFrontier) / totalFrontier * 100;
  }

  /**
   * Analyze stability
   */
  private analyzeStability(board: Board, player: Player): number {
    const playerStable = this.countStableDiscs(board, player);
    const opponentStable = this.countStableDiscs(board, this.getOpponent(player));
    
    const totalStable = playerStable + opponentStable;
    if (totalStable === 0) return 0;
    
    return (playerStable - opponentStable) / totalStable * 100;
  }

  /**
   * Analyze corner control
   */
  private analyzeCornerControl(board: Board, player: Player): number {
    const corners = [[0,0], [0,7], [7,0], [7,7]];
    let playerCorners = 0;
    let opponentCorners = 0;
    
    for (const [r, c] of corners) {
      if (board[r][c] === player) playerCorners++;
      else if (board[r][c] === this.getOpponent(player)) opponentCorners++;
    }
    
    const totalCorners = playerCorners + opponentCorners;
    if (totalCorners === 0) return 0;
    
    return (playerCorners - opponentCorners) / totalCorners * 100;
  }

  /**
   * Analyze edge control
   */
  private analyzeEdgeControl(board: Board, player: Player): number {
    let playerEdges = 0;
    let opponentEdges = 0;
    
    // Count edge discs
    for (let c = 0; c < 8; c++) {
      if (board[0][c] === player) playerEdges++;
      else if (board[0][c] === this.getOpponent(player)) opponentEdges++;
      if (board[7][c] === player) playerEdges++;
      else if (board[7][c] === this.getOpponent(player)) opponentEdges++;
    }
    for (let r = 0; r < 8; r++) {
      if (board[r][0] === player) playerEdges++;
      else if (board[r][0] === this.getOpponent(player)) opponentEdges++;
      if (board[r][7] === player) playerEdges++;
      else if (board[r][7] === this.getOpponent(player)) opponentEdges++;
    }
    
    const totalEdges = playerEdges + opponentEdges;
    if (totalEdges === 0) return 0;
    
    return (playerEdges - opponentEdges) / totalEdges * 100;
  }

  /**
   * Analyze center control
   */
  private analyzeCenterControl(board: Board, player: Player): number {
    const center = [[3,3], [3,4], [4,3], [4,4]];
    let playerCenter = 0;
    let opponentCenter = 0;
    
    for (const [r, c] of center) {
      if (board[r][c] === player) playerCenter++;
      else if (board[r][c] === this.getOpponent(player)) opponentCenter++;
    }
    
    const totalCenter = playerCenter + opponentCenter;
    if (totalCenter === 0) return 0;
    
    return (playerCenter - opponentCenter) / totalCenter * 100;
  }

  /**
   * Analyze safety
   */
  private analyzeSafety(board: Board, player: Player): number {
    let safetyScore = 0;
    
    // Check for dangerous positions
    const dangerousSquares = this.getDangerousSquares(board, player);
    safetyScore -= dangerousSquares.length * 20;
    
    // Check for safe positions
    const safeSquares = this.getSafeSquares(board, player);
    safetyScore += safeSquares.length * 10;
    
    return Math.max(-100, Math.min(100, safetyScore));
  }

  /**
   * Get move value based on strategic analysis
   */
  getMoveValue(move: Position, board: Board, player: Player): number {
    let value = 0;
    
    // 1. Corner value
    if (this.isCorner(move)) {
      value += 100;
    }
    
    // 2. Edge value
    if (this.isEdge(move)) {
      value += 20;
    }
    
    // 3. Center value
    if (this.isCenter(move)) {
      value += 15;
    }
    
    // 4. Safety value
    if (this.isSafeMove(move, board, player)) {
      value += 30;
    } else if (this.isDangerousMove(move, board, player)) {
      value -= 50;
    }
    
    // 5. Strategic value based on game phase
    value += this.getPhaseValue(move, board, player);
    
    // 6. Opponent-specific value
    if (this.opponentProfile) {
      value += this.getOpponentSpecificValue(move, board, player);
    }
    
    return value;
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
  private isSafeMove(move: Position, board: Board, player: Player): boolean {
    // Check for dangerous X/C squares
    if (this.isDangerousSquare(move, board)) {
      return false;
    }
    
    // Check for corner safety
    if (this.isCorner(move)) {
      return true; // Corners are always safe
    }
    
    // Check for edge safety
    if (this.isEdge(move)) {
      return this.isEdgeSafe(move, board);
    }
    
    return true;
  }

  /**
   * Check if move is dangerous
   */
  private isDangerousMove(move: Position, board: Board, player: Player): boolean {
    return this.isDangerousSquare(move, board);
  }

  /**
   * Check if square is dangerous
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
   * Check if edge move is safe
   */
  private isEdgeSafe(move: Position, board: Board): boolean {
    const { row, col } = move;
    
    // Check adjacent corners
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
    
    // Check if adjacent corners are controlled
    for (const [r, c] of adjacentCorners) {
      if (board[r][c] === null) {
        return false; // Adjacent corner is empty, not safe
      }
    }
    
    return true;
  }

  /**
   * Get phase-specific value
   */
  private getPhaseValue(move: Position, board: Board, player: Player): number {
    switch (this.gamePhase) {
      case 'opening':
        // Opening: prefer mobility and position
        return (this.getMobilityValue(move, board, player) * 0.5 +
               this.getPositionValue(move) * 0.5);
      
      case 'midgame':
        // Midgame: balanced approach
        return (this.getMobilityValue(move, board, player) * 0.3 +
               this.getPositionValue(move) * 0.3 +
               this.getStabilityValue(move, board, player) * 0.4);
      
      case 'late_midgame':
        // Late midgame: focus on stability and corners
        return (this.getStabilityValue(move, board, player) * 0.4 +
               this.getCornerValue(move) * 0.6);
      
      case 'endgame':
        // Endgame: focus on material and stability
        return (this.getMaterialValue(move, board, player) * 0.6 +
               this.getStabilityValue(move, board, player) * 0.4);
      
      default:
        return 0;
    }
  }

  /**
   * Get opponent-specific value
   */
  private getOpponentSpecificValue(move: Position, board: Board, player: Player): number {
    if (!this.opponentProfile) return 0;
    
    let value = 0;
    
    // Adjust strategy based on opponent style
    switch (this.opponentProfile.style) {
      case 'aggressive':
        // Against aggressive opponents, focus on stability
        value += this.getStabilityValue(move, board, player) * 0.3;
        break;
      
      case 'defensive':
        // Against defensive opponents, focus on mobility
        value += this.getMobilityValue(move, board, player) * 0.3;
        break;
      
      case 'balanced':
        // Against balanced opponents, use balanced approach
        value += ((this.getMobilityValue(move, board, player) + 
                 this.getStabilityValue(move, board, player)) * 0.15);
        break;
    }
    
    return value;
  }

  /**
   * Get mobility value
   */
  private getMobilityValue(move: Position, board: Board, player: Player): number {
    // Simplified mobility calculation
    return 10; // Placeholder
  }

  /**
   * Get position value
   */
  private getPositionValue(move: Position): number {
    const { row, col } = move;
    
    // Positional weights
    const weights = [
      [120, -20, 20, 5, 5, 20, -20, 120],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [20, -5, 15, 3, 3, 15, -5, 20],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [5, -5, 3, 3, 3, 3, -5, 5],
      [20, -5, 15, 3, 3, 15, -5, 20],
      [-20, -40, -5, -5, -5, -5, -40, -20],
      [120, -20, 20, 5, 5, 20, -20, 120],
    ];
    
    return weights[row][col];
  }

  /**
   * Get stability value
   */
  private getStabilityValue(move: Position, board: Board, player: Player): number {
    if (this.isCorner(move)) return 100;
    if (this.isEdge(move) && this.isEdgeSafe(move, board)) return 50;
    return 0;
  }

  /**
   * Get corner value
   */
  private getCornerValue(move: Position): number {
    return this.isCorner(move) ? 100 : 0;
  }

  /**
   * Get material value
   */
  private getMaterialValue(move: Position, board: Board, player: Player): number {
    // Simplified material calculation
    return 10; // Placeholder
  }

  /**
   * Generate strategic summary
   */
  private generateSummary(analysis: StrategicAnalysisResult): string {
    const parts = [];
    
    if (analysis.mobility > 20) parts.push('Strong mobility advantage');
    else if (analysis.mobility < -20) parts.push('Mobility disadvantage');
    
    if (analysis.cornerControl > 50) parts.push('Corner control');
    else if (analysis.cornerControl < -50) parts.push('Corner disadvantage');
    
    if (analysis.stability > 30) parts.push('Stable position');
    else if (analysis.stability < -30) parts.push('Unstable position');
    
    if (analysis.safety > 20) parts.push('Safe position');
    else if (analysis.safety < -20) parts.push('Dangerous position');
    
    return parts.length > 0 ? parts.join(', ') : 'Balanced position';
  }

  /**
   * Count valid moves
   */
  private countValidMoves(board: Board, player: Player): number {
    // Simplified move counting
    let count = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === null) {
          count++; // Simplified - in real implementation, check actual validity
        }
      }
    }
    return count;
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
   * Get dangerous squares
   */
  private getDangerousSquares(board: Board, player: Player): Position[] {
    const dangerous = [];
    
    // Check X-squares
    const xSquares = [[1,1], [1,6], [6,1], [6,6]];
    for (const [r, c] of xSquares) {
      if (board[r][c] === player) {
        const cornerRow = r === 1 ? 0 : 7;
        const cornerCol = c === 1 ? 0 : 7;
        if (board[cornerRow][cornerCol] === null) {
          dangerous.push({ row: r, col: c });
        }
      }
    }
    
    return dangerous;
  }

  /**
   * Get safe squares
   */
  private getSafeSquares(board: Board, player: Player): Position[] {
    const safe = [];
    
    // Corners are always safe
    const corners = [[0,0], [0,7], [7,0], [7,7]];
    for (const [r, c] of corners) {
      if (board[r][c] === player) {
        safe.push({ row: r, col: c });
      }
    }
    
    return safe;
  }

  /**
   * Get opponent
   */
  private getOpponent(player: Player): Player {
    return player === 'black' ? 'white' : 'black';
  }
}
