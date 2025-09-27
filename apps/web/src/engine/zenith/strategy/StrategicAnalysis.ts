// Strategic Analysis System for Engine Zenith (God-tier Revamp)
// - Accurate mobility using real legal moves
// - Edge control without corner double count
// - Parity metric
// - Better stability via corner chain propagation
// - Edge safety check improved (corner adjacency + chain continuity hint)
// - Center control redefined as INTERNAL disc control (anti-frontier)
// - Greed-Guard: frontier delta + opponent mobility burst (anti "small-eat trap")
// - Summary thresholds tuned
//
// Types assumed:
//   Board: (Player | null)[][]  // 8x8
//   Player: 'black' | 'white'
//   Position: { row: number; col: number; }
//   GamePhase: 'opening' | 'midgame' | 'late_midgame' | 'endgame'
//   OpponentProfile: { style: 'aggressive' | 'defensive' | 'balanced' }

import type { Board, Player, Position } from '../../../types';
import { GamePhase, OpponentProfile } from '../index';

export interface StrategicAnalysisResult {
  mobility: number;        // [-100,100]
  frontier: number;        // [-100,100] (opponentFrontier - myFrontier)/total
  stability: number;       // [-100,100]
  parity: number;          // [-20,+20] (simple global parity hint)
  cornerControl: number;   // [-100,100]
  edgeControl: number;     // [-100,100]
  centerControl: number;   // [-100,100] internal discs control
  safety: number;          // [-100,100]
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
   * Public: Analyze current position
   */
  analyzePosition(
    board: Board,
    player: Player,
    gamePhase: GamePhase,
    opponentProfile: OpponentProfile | null
  ): StrategicAnalysisResult {
    if (!board || !player || !gamePhase) {
      console.warn('StrategicAnalysis: 잘못된 입력 매개변수');
      return this.getDefaultAnalysisResult();
    }

    this.gamePhase = gamePhase;
    this.opponentProfile = opponentProfile;

    let mobility: number;
    try {
      mobility = this.analyzeMobility(board, player);
    } catch (error) {
      console.warn('StrategicAnalysis: mobility 분석 실패', error);
      mobility = 0;
    }

    const analysis: StrategicAnalysisResult = {
      mobility,
      frontier: this.analyzeFrontier(board, player),
      stability: this.analyzeStability(board, player),
      parity: this.analyzeParity(board, player),
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

  // ---------------------------------------------------------------------------
  // Core strategic metrics
  // ---------------------------------------------------------------------------

  /** Accurate mobility using real legal moves */
  private analyzeMobility(board: Board, player: Player): number {
    const my = this.getValidMoves(board, player).length;
    const op = this.getValidMoves(board, this.getOpponent(player)).length;
    const tot = my + op;
    return tot === 0 ? 0 : ((my - op) / tot) * 100;
  }

  /** Frontier (opponentFrontier - myFrontier)/total, fewer frontier is better */
  private analyzeFrontier(board: Board, player: Player): number {
    const my = this.countFrontierDiscs(board, player);
    const op = this.countFrontierDiscs(board, this.getOpponent(player));
    const tot = my + op;
    return tot === 0 ? 0 : ((op - my) / tot) * 100;
  }

  /** Stability: corner-chain propagation on edges (fast, robust approximation) */
  private analyzeStability(board: Board, player: Player): number {
    const my = this.countStableDiscs(board, player);
    const op = this.countStableDiscs(board, this.getOpponent(player));
    const tot = my + op;
    return tot === 0 ? 0 : ((my - op) / tot) * 100;
  }

  /** Parity: simple global parity hint (use small range to keep balanced) */
  private analyzeParity(board: Board, player: Player): number {
    let empties = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++)
      if (board[r][c] === null) empties++;
    const iAmBlack = player === 'black';
    const myParityGood = empties % 2 === (iAmBlack ? 1 : 0);
    return myParityGood ? +20 : -20; // modest impact
  }

  /** Corner control */
  private analyzeCornerControl(board: Board, player: Player): number {
    const corners: Array<[number, number]> = [[0,0],[0,7],[7,0],[7,7]];
    let p = 0, o = 0, opp = this.getOpponent(player);
    for (const [r,c] of corners) {
      if (board[r][c] === player) p++;
      else if (board[r][c] === opp) o++;
    }
    const t = p + o;
    return t === 0 ? 0 : ((p - o) / t) * 100;
  }

  /** Edge control: avoid corner double-counting */
  private analyzeEdgeControl(board: Board, player: Player): number {
    let p = 0, o = 0, opp = this.getOpponent(player);
    // top & bottom rows (corners 포함)
    for (let c = 0; c < 8; c++) {
      if (board[0][c] === player) p++; else if (board[0][c] === opp) o++;
      if (board[7][c] === player) p++; else if (board[7][c] === opp) o++;
    }
    // left & right columns (exclude corners to avoid double count)
    for (let r = 1; r <= 6; r++) {
      if (board[r][0] === player) p++; else if (board[r][0] === opp) o++;
      if (board[r][7] === player) p++; else if (board[r][7] === opp) o++;
    }
    const t = p + o;
    return t === 0 ? 0 : ((p - o) / t) * 100;
  }

  /** Center control redefined: INTERNAL discs ratio (anti-frontier) */
  private analyzeCenterControl(board: Board, player: Player): number {
    const myInternal = this.countInternalDiscs(board, player);
    const opInternal = this.countInternalDiscs(board, this.getOpponent(player));
    const tot = myInternal + opInternal;
    return tot === 0 ? 0 : ((myInternal - opInternal) / tot) * 100;
  }

  /** Safety: X/C hazards (corner empty), edge hazards, safe corners */
  private analyzeSafety(board: Board, player: Player): number {
    let score = 0;

    // corners (owned) add safety
    const corners: Array<[number, number]> = [[0,0],[0,7],[7,0],[7,7]];
    for (const [r,c] of corners) if (board[r][c] === player) score += 8;

    // own X on empty-corner diagonal: heavy risk
    const xSquares: Array<[number, number, number, number]> = [
      [1,1,0,0],[1,6,0,7],[6,1,7,0],[6,6,7,7]
    ];
    for (const [r,c,cr,cc] of xSquares) {
      if (board[r][c] === player && board[cr][cc] === null) score -= 15;
    }

    // edge near empty-corner risk
    score += this.edgeSafetyScan(board, player);

    // clamp
    if (score > 100) score = 100;
    if (score < -100) score = -100;
    return score;
  }

  // ---------------------------------------------------------------------------
  // Move scoring (with Greed-Guard)
  // ---------------------------------------------------------------------------

  getMoveValue(move: Position, board: Board, player: Player): number {
    // 불법 수 방지: 시뮬레이션 실패 시 큰 패널티
    const temp = this.simulateMove(board, move, player);
    if (!temp) return -10000;

    // Baseline positional table (robust)
    const pos = this.getPositionValue(move);

    // Phase-driven components
    const phaseScore = this.getPhaseValue(move, board, player);

    // Safety screen
    const safe = this.isSafeMove(move, board, player);
    const danger = this.isDangerousMove(move, board, player);

    // Opponent style adaptation
    const vsOpp = this.opponentProfile ? this.getOpponentSpecificValue(move, board, player) : 0;

    // Light absolute bonuses
    let feature = 0;
    if (this.isCorner(move)) feature += 40;
    if (this.isEdge(move))   feature += 8;
    if (safe)   feature += 12;
    if (danger) feature -= 20;

    // ---------- Greed-Guard (Frontier Δ + Opp. Mobility Burst) ----------
    const opp = this.getOpponent(player);
    const beforeMyF = this.countFrontierDiscs(board, player);
    const beforeOpF = this.countFrontierDiscs(board, opp);

    const afterMyF = this.countFrontierDiscs(temp, player);
    const afterOpF = this.countFrontierDiscs(temp, opp);
    const frontierDelta = (afterMyF - beforeMyF) - (afterOpF - beforeOpF);

    // 국면별 강도: 초반↑(강화), 중반↑, 후반↓, 엔드게임≈0
    const phaseK =
      this.gamePhase === 'opening'      ? 1.20 :
      this.gamePhase === 'midgame'      ? 0.85 :
      this.gamePhase === 'late_midgame' ? 0.45 : 0.00;

    // 튜닝 포인트: 6은 체감 좋은 기본값 (3~10 탐색 권장)
    const Wf = 6 * phaseK;
    let greedGuard = 0;
    if (frontierDelta > 0) greedGuard -= frontierDelta * Wf;

    // 상대 모빌리티 급증(다음 턴) 추가 감점
    const myNext  = this.getValidMoves(temp, player).length;
    const opNext  = this.getValidMoves(temp, opp).length;
    const opBurst = opNext - myNext; // 상대 턴 가동성 우위
    if (opBurst > 3) {
      // 최대 -15까지 가중
      greedGuard -= Math.min(15, (opBurst - 3) * 3);
    }

    // 코너 내주기 가드: 한 플라이 내 코너 직격 위협 시 큰 페널티
    const cornerThreatPenalty = this.cornerGiveawayPenalty(board, temp, player);

    // X 희생 정당화: 전술적으로 정당하면 보너스로 상쇄/역전
    const xJust = this.xSacrificeJustification(board, temp, move, player);

    // 극초반 X 억제 (정당화 높으면 완화/해제)
    const earlyXPenalty = this.veryEarlyXPenalty(move, board, xJust);

    // 최종 스코어
    return pos * 0.6 + phaseScore + feature + vsOpp + greedGuard + cornerThreatPenalty + xJust + earlyXPenalty;
  }

  // ===== X/Corner helpers =====
  private isXSquare(move: Position): boolean {
    const { row, col } = move;
    return (row === 1 && col === 1) || (row === 1 && col === 6) ||
           (row === 6 && col === 1) || (row === 6 && col === 6);
  }

  private cornerForX(move: Position): [number, number] | null {
    const { row, col } = move;
    if (row === 1 && col === 1) return [0,0];
    if (row === 1 && col === 6) return [0,7];
    if (row === 6 && col === 1) return [7,0];
    if (row === 6 && col === 6) return [7,7];
    return null;
  }

  private cornerGiveawayPenalty(before: Board, after: Board, player: Player): number {
    const opp = this.getOpponent(player);
    const empties: Array<[number,number]> = ([[0,0],[0,7],[7,0],[7,7]] as Array<[number,number]>).filter(([r,c]) => before[r][c] === null);
    if (empties.length === 0) return 0;
    const oppMoves = this.getValidMoves(after, opp);
    if (oppMoves.length === 0) return 0;
    let pen = 0;
    for (const [r,c] of empties) {
      if (oppMoves.some(m => m.row === r && m.col === c)) {
        const k = this.gamePhase === 'opening' ? 1.3 : this.gamePhase === 'midgame' ? 1.1 : this.gamePhase === 'late_midgame' ? 0.6 : 0.0;
        pen -= Math.round(80 * k);
      }
    }
    return pen;
  }

  private xSacrificeJustification(before: Board, after: Board, move: Position, player: Player): number {
    if (!this.isXSquare(move)) return 0;
    const corner = this.cornerForX(move);
    if (!corner) return 0;
    const [cr, cc] = corner;
    if (before[cr][cc] !== null) return 0;
    
    // X 자리에 두는 것을 더 엄격하게 제한
    let empties = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (before[r][c] === null) empties++;
      }
    }
    if (empties > 20) {
      // 초반에는 X 자리에 두는 것을 거의 금지
      return -50;
    }
    
    const opp = this.getOpponent(player);
    const oppMoves = this.getValidMoves(after, opp);
    if (!oppMoves.some(m => m.row === cr && m.col === cc)) return 0;
    const ocBoard = this.simulateMove(after, { row: cr, col: cc }, opp);
    if (!ocBoard) return 0;
    const myReplies = this.getValidMoves(ocBoard, player);
    if (myReplies.length === 0) return -100; // 상대방이 코너를 차지하고 우리가 수가 없으면 매우 나쁨
    
    // 더 엄격한 조건: 우리가 즉시 코너를 차지할 수 있어야 함
    const corners: Array<[number, number]> = [[0,0],[0,7],[7,0],[7,7]];
    const hasImmediateCorner = myReplies.some(m => corners.some(([r,c]) => m.row === r && m.col === c));
    if (!hasImmediateCorner) return -30; // 즉시 코너를 차지할 수 없으면 페널티
    
    let bonus = 0;
    if (hasImmediateCorner) {
      bonus += 50; // 즉시 코너 차지 보너스 (기존 70에서 감소)
    }
    
    let bestScore = -1e9;
    let bestBoard: Board | null = null;
    for (const m of myReplies.slice(0, 8)) { // 검토 수를 줄임 (12 → 8)
      const nb = this.simulateMove(ocBoard, m, player);
      if (!nb) continue;
      const myNext = this.getValidMoves(nb, player).length;
      const opNext = this.getValidMoves(nb, opp).length;
      const mobScore = (myNext - opNext) * 3; // 가중치 감소 (5 → 3)
      const myFront = this.countFrontierDiscs(nb, player);
      const opFront = this.countFrontierDiscs(nb, opp);
      const frontScore = (opFront - myFront) * 2; // 가중치 감소 (3 → 2)
      const cornerBonus = this.isCorner(m) ? 30 : 0; // 보너스 감소 (50 → 30)
      const edgeSafeBonus = (this.isEdge(m) && this.isEdgeSafe(m, nb)) ? 5 : 0; // 보너스 감소 (10 → 5)
      const s = mobScore + frontScore + cornerBonus + edgeSafeBonus;
      if (s > bestScore) { bestScore = s; bestBoard = nb; }
    }
    if (bestScore > 10) bonus += Math.min(bestScore, 40); // 최대 보너스 제한 (무제한 → 40)
    if (bestBoard) {
      const oppAfter = this.getValidMoves(bestBoard, opp).length;
      if (oppAfter === 0) bonus += 20; // 보너스 감소 (40 → 20)
    }
    
    // 페이즈별 가중치를 더 보수적으로 설정
    const k = this.gamePhase === 'opening' ? 0.3 : this.gamePhase === 'midgame' ? 0.7 : this.gamePhase === 'late_midgame' ? 1.0 : 0.5;
    bonus = Math.max(-50, Math.min(30, Math.round(bonus * k))); // 범위를 더 제한적으로 설정
    
    return bonus;
  }

  private veryEarlyXPenalty(move: Position, board: Board, justification: number): number {
    if (!this.isXSquare(move)) return 0;
    const corner = this.cornerForX(move);
    if (!corner) return 0;
    const [cr, cc] = corner;
    if (board[cr][cc] !== null) return 0;
    let empties = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (board[r][c] === null) empties++;
    if (empties < 50) return 0;
    const base = -80; // -25에서 -80으로 강화
    if (justification >= 50) return 0;
    if (justification > 0) return Math.floor(base / 2);
    return base;
  }

  // ---------------------------------------------------------------------------
  // Helpers: geometric categories
  // ---------------------------------------------------------------------------

  private isCorner(move: Position): boolean {
    const { row, col } = move;
    return (row === 0 || row === 7) && (col === 0 || col === 7);
  }

  private isEdge(move: Position): boolean {
    const { row, col } = move;
    return row === 0 || row === 7 || col === 0 || col === 7;
  }

  private isCenter4(move: Position): boolean {
    const { row, col } = move;
    return row >= 3 && row <= 4 && col >= 3 && col <= 4;
  }

  // ---------------------------------------------------------------------------
  // Safety / danger
  // ---------------------------------------------------------------------------

  private isSafeMove(move: Position, board: Board, _player: Player): boolean {
    if (this.isCorner(move)) return true; // corners always safe
    if (this.isDangerousSquare(move, board)) return false;
    if (this.isEdge(move) && !this.isEdgeSafe(move, board)) return false;
    return true;
  }

  private isDangerousMove(move: Position, board: Board, _player: Player): boolean {
    return this.isDangerousSquare(move, board);
  }

  /** X/C if corner empty */
  private isDangerousSquare(move: Position, board: Board): boolean {
    const { row, col } = move;

    // X-squares
    const x: Array<[number, number, number, number]> = [
      [1,1,0,0],[1,6,0,7],[6,1,7,0],[6,6,7,7]
    ];
    for (const [r,c,cr,cc] of x) {
      if (row === r && col === c && board[cr][cc] === null) return true;
    }

    // C-squares (two adjacent to each corner)
    const cGroups: Array<{ corner:[number,number]; cells:[number,number][] }> = [
      { corner:[0,0], cells:[[0,1],[1,0]] },
      { corner:[0,7], cells:[[0,6],[1,7]] },
      { corner:[7,0], cells:[[6,0],[7,1]] },
      { corner:[7,7], cells:[[6,7],[7,6]] },
    ];
    for (const g of cGroups) {
      const [cr,cc] = g.corner;
      if (board[cr][cc] !== null) continue;
      for (const [r,c] of g.cells) if (row === r && col === c) return true;
    }
    return false;
  }

  /** Edge move safety quick test: avoid playing next to an empty corner on same edge */
  private isEdgeSafe(move: Position, board: Board): boolean {
    const { row, col } = move;
    if (row === 0) { if ((col <= 1 && board[0][0] === null) || (col >= 6 && board[0][7] === null)) return false; }
    if (row === 7) { if ((col <= 1 && board[7][0] === null) || (col >= 6 && board[7][7] === null)) return false; }
    if (col === 0) { if ((row <= 1 && board[0][0] === null) || (row >= 6 && board[7][0] === null)) return false; }
    if (col === 7) { if ((row <= 1 && board[0][7] === null) || (row >= 6 && board[7][7] === null)) return false; }
    return true;
  }

  /** Aggregate safety scan for analyzeSafety (small weights) */
  private edgeSafetyScan(board: Board, player: Player): number {
    let s = 0;
    const mine = player;
    // top
    if (board[0][0] === null) {
      if (board[0][1] === mine) s -= 4;
      if (board[1][0] === mine) s -= 4;
    }
    if (board[0][7] === null) {
      if (board[0][6] === mine) s -= 4;
      if (board[1][7] === mine) s -= 4;
    }
    // bottom
    if (board[7][0] === null) {
      if (board[7][1] === mine) s -= 4;
      if (board[6][0] === mine) s -= 4;
    }
    if (board[7][7] === null) {
      if (board[7][6] === mine) s -= 4;
      if (board[6][7] === mine) s -= 4;
    }
    return s;
  }

  // ---------------------------------------------------------------------------
  // Phase & opponent adaptation
  // ---------------------------------------------------------------------------

  private getPhaseValue(move: Position, board: Board, player: Player): number {
    const mobility = this.getMobilityValue(move, board, player);       // relative mobility after move
    const stability = this.getStabilityValue(move, board, player);     // corner/edge safe hints
    const material  = this.getMaterialValue(move, board, player);      // endgame only meaningful
    const posBase   = this.getPositionValue(move);                     // positional table

    switch (this.gamePhase) {
      case 'opening':
        {
          // 초반 모빌리티 과가중 방지: clamp 후 기여 축소
          const m = Math.max(-50, Math.min(50, mobility));
          return m * 0.5 + posBase * 0.4;
        }
      case 'midgame':
        return mobility * 0.5 + posBase * 0.3 + stability * 0.6;
      case 'late_midgame':
        return stability * 0.9 + (this.getCornerValue(move) * 0.6) + posBase * 0.2;
      case 'endgame':
        return material * 0.8 + stability * 0.4 + posBase * 0.1;
      default:
        return 0;
    }
  }

  private getOpponentSpecificValue(move: Position, board: Board, player: Player): number {
    if (!this.opponentProfile) return 0;
    const st = this.getStabilityValue(move, board, player);
    const mob = this.getMobilityValue(move, board, player);
    switch (this.opponentProfile.style) {
      case 'aggressive': return st * 0.3;
      case 'defensive':  return mob * 0.3;
      case 'balanced':   return (st + mob) * 0.15;
      default: return 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Micro evaluators used by phase/adaptation
  // ---------------------------------------------------------------------------

  /** Mobility delta after the move (myMoves - oppMoves) * 10 */
  private getMobilityValue(move: Position, board: Board, player: Player): number {
    const temp = this.simulateMove(board, move, player);
    if (!temp) return -1000;
    const my = this.getValidMoves(temp, player).length;
    const op = this.getValidMoves(temp, this.getOpponent(player)).length;
    return (my - op) * 10;
  }

  /** Positional weights (classic, symmetric) */
  private getPositionValue(move: Position): number {
    const w = [
      [120, -20,  20,   5,   5,  20, -20, 120],
      [-20, -60,  -5,  -5,  -5,  -5, -60, -20], // X-squares: -40 → -60
      [ 20,  -5,  15,   3,   3,  15,  -5,  20],
      [  5,  -5,   3,   3,   3,   3,  -5,   5],
      [  5,  -5,   3,   3,   3,   3,  -5,   5],
      [ 20,  -5,  15,   3,   3,  15,  -5,  20],
      [-20, -60,  -5,  -5,  -5,  -5, -60, -20], // X-squares: -40 → -60
      [120, -20,  20,   5,   5,  20, -20, 120],
    ];
    return w[move.row][move.col];
  }

  private getStabilityValue(move: Position, board: Board, _player: Player): number {
    if (this.isCorner(move)) return 100;
    if (this.isCenter4(move)) return 6;
    if (this.isEdge(move) && this.isEdgeSafe(move, board)) return 24;
    return 0;
  }

  private getCornerValue(move: Position): number {
    return this.isCorner(move) ? 100 : 0;
  }

  /** Material delta (myPieces - oppPieces) * 5 after the move */
  private getMaterialValue(move: Position, board: Board, player: Player): number {
    const temp = this.simulateMove(board, move, player);
    if (!temp) return -1000;
    const my = this.countPieces(temp, player);
    const op = this.countPieces(temp, this.getOpponent(player));
    return (my - op) * 5;
  }

  // ---------------------------------------------------------------------------
  // Board ops (reference 2D version; replace with bitboards for perf later)
  // ---------------------------------------------------------------------------

  private simulateMove(board: Board, move: Position, player: Player): Board | null {
    const { row, col } = move;
    if (board[row][col] !== null) return null;
    const newBoard: Board = board.map(r => [...r]);

    const opp = this.getOpponent(player);
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    let flipped = 0;

    newBoard[row][col] = player;

    for (const [dr, dc] of dirs) {
      const flips = this.getFlipsInDirection(newBoard, row, col, dr, dc, player, opp);
      if (flips.length) {
        for (const {row: fr, col: fc} of flips) {
          newBoard[fr][fc] = player;
          flipped++;
        }
      }
    }

    if (flipped === 0) return null; // invalid move
    return newBoard;
  }

  private getFlipsInDirection(
    board: Board,
    row: number,
    col: number,
    dr: number,
    dc: number,
    me: Player,
    opp: Player
  ): Position[] {
    const flips: Position[] = [];
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const cell = board[r][c];
      if (cell === opp) {
        flips.push({ row: r, col: c });
      } else if (cell === me) {
        return flips.length ? flips : [];
      } else {
        break; // empty
      }
      r += dr; c += dc;
    }
    return [];
  }

  private getValidMoves(board: Board, player: Player): Position[] {
    const moves: Position[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] !== null) continue;
        if (this.isValidMove(board, {row:r, col:c}, player)) moves.push({row:r, col:c});
      }
    }
    return moves;
  }

  private isValidMove(board: Board, move: Position, player: Player): boolean {
    const { row, col } = move;
    if (board[row][col] !== null) return false;
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    const opp = this.getOpponent(player);
    for (const [dr, dc] of dirs) {
      if (this.canFlipInDirection(board, row, col, dr, dc, player, opp)) return true;
    }
    return false;
  }

  private canFlipInDirection(
    board: Board,
    row: number,
    col: number,
    dr: number,
    dc: number,
    me: Player,
    opp: Player
  ): boolean {
    let r = row + dr, c = col + dc;
    let seenOpp = false;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const cell = board[r][c];
      if (cell === opp) seenOpp = true;
      else if (cell === me) return seenOpp;
      else break;
      r += dr; c += dc;
    }
    return false;
  }

  private countPieces(board: Board, player: Player): number {
    let count = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++)
      if (board[r][c] === player) count++;
    return count;
  }

  private getOpponent(player: Player): Player {
    return player === 'black' ? 'white' : 'black';
  }

  // ---------------------------------------------------------------------------
  // Advanced counters
  // ---------------------------------------------------------------------------

  /** Frontier discs: adjacent to at least one empty square */
  private countFrontierDiscs(board: Board, player: Player): number {
    let count = 0;
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] !== player) continue;
        let frontier = false;
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
          if (board[nr][nc] === null) { frontier = true; break; }
        }
        if (frontier) count++;
      }
    }
    return count;
  }

  /** Internal discs: not adjacent to any empty square (anti-frontier) */
  private countInternalDiscs(board: Board, player: Player): number {
    let count = 0;
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] !== player) continue;
        let internal = true;
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
          if (board[nr][nc] === null) { internal = false; break; }
        }
        if (internal) count++;
      }
    }
    return count;
  }

  /** Stable discs via corner-driven chain along edges (fast, decent proxy) */
  private countStableDiscs(board: Board, player: Player): number {
    const stable = new Set<string>();
    const corners = [
      { r:0, c:0, dirs:[[0,1],[1,0]] },
      { r:0, c:7, dirs:[[0,-1],[1,0]] },
      { r:7, c:0, dirs:[[-1,0],[0,1]] },
      { r:7, c:7, dirs:[[-1,0],[0,-1]] },
    ];
    for (const {r,c,dirs} of corners) {
      if (board[r][c] !== player) continue;
      stable.add(`${r},${c}`);
      for (const [dr,dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === player) {
          stable.add(`${nr},${nc}`);
          nr += dr; nc += dc;
        }
      }
    }
    return stable.size;
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------

  private generateSummary(a: StrategicAnalysisResult): string {
    const parts: string[] = [];

    // Mobility
    if (a.mobility > 25) parts.push('모빌리티 우위');
    else if (a.mobility < -25) parts.push('모빌리티 열위');

    // Corners
    if (a.cornerControl > 50) parts.push('코너 컨트롤 우세');
    else if (a.cornerControl < -50) parts.push('코너 불리');

    // Stability
    if (a.stability > 25) parts.push('형태 안정적');
    else if (a.stability < -25) parts.push('형태 불안정');

    // Frontier/Center
    if (a.frontier > 20) parts.push('상대 외곽 증가 유도 성공');
    else if (a.frontier < -20) parts.push('내 외곽 과다');

    if (a.centerControl > 20) parts.push('내부 디스크 우세');
    else if (a.centerControl < -20) parts.push('내부 디스크 열세');

    // Parity (small hint)
    if (a.parity > 0) parts.push('패리티 유리');
    else parts.push('패리티 불리');

    // Safety
    if (a.safety > 20) parts.push('안전한 국면');
    else if (a.safety < -20) parts.push('위험한 국면');

    return parts.length ? parts.join(', ') : '균형 상태';
  }

  private getDefaultAnalysisResult(): StrategicAnalysisResult {
    return {
      mobility: 0,
      frontier: 0,
      stability: 0,
      parity: 0,
      cornerControl: 0,
      edgeControl: 0,
      centerControl: 0,
      safety: 0,
      summary: '분석 실패',
      getMoveValue: () => 0
    };
  }
}
