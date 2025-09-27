// Adaptive Strategy System for Engine Zenith — Complete Revamp
// - Turn context 주입(beginTurn)으로 실제 보드/플레이어 기반 적응
// - X/C 위험: 코너 비었을 때만 위험 처리, 엣지 안전성 간이 체크
// - 이동성/프런티어/안정성: "모양"이 아닌 실제 변화량(delta) 반영
// - 상대 특화 조정 exploit_weakness 처리 추가
// - 가중치 클램프 + 정규화로 드리프트/음수 방지
// - 통계 NaN 가드
//
// Assumed external types:
//   Board: (Player | null)[][]
//   Player: 'black' | 'white'
//   Position: { row: number; col: number; }
//   OpponentProfile: { style: 'aggressive'|'defensive'|'balanced', preferences?: string[], weaknesses?: string[] }
//   LearningData: { patterns: Map<string, PatternData>, mistakes: string[] }

import type { Board, Player, Position } from '../../../types';
import { OpponentProfile, LearningData } from '../index';
import { StrategicAnalysisResult } from './StrategicAnalysis';

type TurnContext = {
  board: Board;
  player: Player;
  opp: Player;
  analysis: {
    mobility: number;
    frontier: number;
    stability: number;
    cornerControl: number;
    edgeControl: number;
    centerControl: number;
    safety: number;
  };
};

export class AdaptiveStrategy {
  public readonly name = 'AdaptiveStrategy';
  private strategyHistory: StrategyHistory[] = [];
  private adaptationRules: Map<string, AdaptationRule> = new Map();
  private currentStrategy: StrategyConfig;
  private ctx?: TurnContext;

  constructor() {
    this.currentStrategy = this.getDefaultStrategy();
    this.initializeAdaptationRules();
  }

  // ------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------

  /** 턴 시작 시 반드시 호출: 이후 getMoveValue가 실보드 문맥을 사용 */
  beginTurn(board: Board, player: Player, strategicAnalysis: any): void {
    this.ctx = {
      board,
      player,
      opp: player === 'black' ? 'white' : 'black',
      analysis: {
        mobility: strategicAnalysis.mobility ?? 0,
        frontier: strategicAnalysis.frontier ?? 0,
        stability: strategicAnalysis.stability ?? 0,
        cornerControl: strategicAnalysis.cornerControl ?? 0,
        edgeControl: strategicAnalysis.edgeControl ?? 0,
        centerControl: strategicAnalysis.centerControl ?? 0,
        safety: strategicAnalysis.safety ?? 0,
      },
    };
  }

  /**
   * 상황/학습 기반으로 전략 가중치 적응
   */
  adaptStrategy(
    strategicAnalysis: StrategicAnalysisResult,
    opponentProfile: OpponentProfile | null,
    learningData: LearningData
  ): AdaptiveStrategy {
    // 입력 검증
    if (!strategicAnalysis || !learningData) {
      console.warn('AdaptiveStrategy: 잘못된 입력 매개변수');
      return this;
    }
    // 1) 현재 상황 분석
    const situation = this.analyzeSituation(strategicAnalysis, opponentProfile);

    // 2) 적응 필요성 산출
    const adaptationNeeds = this.determineAdaptationNeeds(situation, learningData);

    // 3) 룰 기반 보정(선택적)
    for (const [, rule] of this.adaptationRules) {
      if (rule.condition(situation)) rule.action(this.currentStrategy);
    }

    // 4) 적용
    this.applyAdaptations(adaptationNeeds);

    // 5) 로그 저장
    this.storeStrategyChange(situation, adaptationNeeds);

    return this;
  }

  /**
   * 현재 전략으로 주어진 수의 가치 평가 (턴 컨텍스트 필요)
   */
  getMoveValue(move: Position): number {
    if (!this.ctx) return 0; // beginTurn 누락 방지
    const { board, player, opp } = this.ctx;

    // 불법 수 방지: 간이 합법성 검사(뒤집기 포함)
    const after = this.simulateMove(board, move, player);
    if (!after) return -1e6;

    // 이동성 델타
    const myMoves = this.getValidMoves(after, player).length;
    const opMoves = this.getValidMoves(after, opp).length;
    const mobilityDelta = myMoves - opMoves;

    // 프런티어 델타 (opFront - myFront 증가 = 유리)
    const myFrontB = this.countFrontierDiscs(board, player);
    const opFrontB = this.countFrontierDiscs(board, opp);
    const myFrontA = this.countFrontierDiscs(after, player);
    const opFrontA = this.countFrontierDiscs(after, opp);
    const frontierDelta = (opFrontA - myFrontA) - (opFrontB - myFrontB);

    // 안정성 힌트(코너/엣지 안전)
    const stabilityHint = this.isCorner(move) ? 4 : (this.isEdgeSafe(move, board) ? 1 : 0);

    // 1) 기저 전략: 코너/엣지/센터/안전
    let v = 0;
    v += (this.isCorner(move) ? 100 : 0) * this.currentStrategy.cornerWeight;
    v += (this.isEdge(move)   ?  20 : 0) * this.currentStrategy.edgeWeight;
    v += (this.isCenter(move) ?  15 : 0) * this.currentStrategy.centerWeight;
    v += (this.isSafeMove(move, board) ? 30 : 0) * this.currentStrategy.safetyWeight;

    // 2) 적응 항목: 실제 변화량 기반
    v += (mobilityDelta * 10) * this.currentStrategy.mobilityWeight;
    v += (frontierDelta *  6) * this.currentStrategy.frontierWeight;
    v += (stabilityHint * 12) * this.currentStrategy.stabilityWeight;

    // 3) 학습 패턴
    const key = `${move.row}-${move.col}`;
    const pat = this.currentStrategy.learnedPatterns.get(key);
    if (pat) v += pat.value * pat.confidence;

    return v;
  }

  // ------------------------------------------------------------
  // Situation & Adaptation
  // ------------------------------------------------------------

  private analyzeSituation(
    strategicAnalysis: any,
    opponentProfile: OpponentProfile | null
  ): SituationAnalysis {
    return {
      mobility: strategicAnalysis.mobility ?? 0,
      frontier: strategicAnalysis.frontier ?? 0,
      stability: strategicAnalysis.stability ?? 0,
      cornerControl: strategicAnalysis.cornerControl ?? 0,
      edgeControl: strategicAnalysis.edgeControl ?? 0,
      centerControl: strategicAnalysis.centerControl ?? 0,
      safety: strategicAnalysis.safety ?? 0,
      opponentStyle: opponentProfile?.style || 'balanced',
      opponentPreferences: opponentProfile?.preferences || [],
      opponentWeaknesses: opponentProfile?.weaknesses || [],
      timestamp: Date.now()
    };
  }

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

    // Mobility: 열세면 ↑, 과도 우위면 ↓
    if (situation.mobility < -20) needs.mobilityAdjustment = +0.30;
    else if (situation.mobility >  20) needs.mobilityAdjustment = -0.20;

    // Frontier: (opFront - myFront) 기준 가정 → 음수면 나쁜 상태(내 외곽 과다)
    if (situation.frontier < -20) needs.frontierAdjustment = +0.20;

    // Stability: 불안정하면 ↑
    if (situation.stability < -20) needs.stabilityAdjustment = +0.30;

    // Corner: 코너 열세면 ↑
    if (situation.cornerControl < -50) needs.cornerAdjustment = +0.40;

    // Edge: 변 열세면 약간 ↑
    if (situation.edgeControl < -10) needs.edgeAdjustment = +0.15;

    // Center/Internal: 내부 약하면 약간 ↑
    if (situation.centerControl < -10) needs.centerAdjustment = +0.10;

    // Safety: 위험하면 ↑
    if (situation.safety < -20) needs.safetyAdjustment = +0.30;

    // Opponent-style 특화
    needs.opponentSpecificAdjustments = this.getOpponentSpecificAdjustments(situation);

    // 학습 반영
    this.applyLearningAdjustments(needs, learningData);

    return needs;
  }

  private applyAdaptations(needs: AdaptationNeeds): void {
    const s = this.currentStrategy;

    s.mobilityWeight  += needs.mobilityAdjustment;
    s.frontierWeight  += needs.frontierAdjustment;
    s.stabilityWeight += needs.stabilityAdjustment;
    s.cornerWeight    += needs.cornerAdjustment;
    s.edgeWeight      += needs.edgeAdjustment;
    s.centerWeight    += needs.centerAdjustment;
    s.safetyWeight    += needs.safetyAdjustment;

    for (const adj of needs.opponentSpecificAdjustments) {
      this.applyOpponentAdjustment(adj);
    }

    this.clampAndNormalize();
  }

  private getOpponentSpecificAdjustments(situation: SituationAnalysis): OpponentAdjustment[] {
    const adjustments: OpponentAdjustment[] = [];

    switch (situation.opponentStyle) {
      case 'aggressive':
        adjustments.push({ type: 'stability', value: 0.30, reason: 'Opponent is aggressive' });
        break;
      case 'defensive':
        adjustments.push({ type: 'mobility', value: 0.30, reason: 'Opponent is defensive' });
        break;
      case 'balanced':
        adjustments.push({ type: 'balanced', value: 0.10, reason: 'Opponent is balanced' });
        break;
    }

    for (const weakness of situation.opponentWeaknesses) {
      adjustments.push({ type: 'exploit_weakness', value: 0.20, reason: `Exploit weakness: ${weakness}` });
    }

    return adjustments;
  }

  private applyLearningAdjustments(needs: AdaptationNeeds, learningData: LearningData): void {
    const positives = this.analyzePositivePatterns(learningData);
    const negatives = this.analyzeNegativePatterns(learningData);

    for (const p of positives) {
      needs.mobilityAdjustment  += p.mobilityImpact  * 0.10;
      needs.stabilityAdjustment += p.stabilityImpact * 0.10;
      needs.cornerAdjustment    += p.cornerImpact    * 0.10;
    }
    for (const n of negatives) {
      needs.mobilityAdjustment  -= n.mobilityImpact  * 0.10;
      needs.stabilityAdjustment -= n.stabilityImpact * 0.10;
      needs.cornerAdjustment    -= n.cornerImpact    * 0.10;
    }
  }

  private applyOpponentAdjustment(adj: OpponentAdjustment): void {
    const s = this.currentStrategy;
    switch (adj.type) {
      case 'mobility':   s.mobilityWeight  += adj.value; break;
      case 'stability':  s.stabilityWeight += adj.value; break;
      case 'corner':     s.cornerWeight    += adj.value; break;
      case 'balanced':
        s.mobilityWeight  += adj.value * 0.5;
        s.stabilityWeight += adj.value * 0.5;
        break;
      case 'exploit_weakness': // 새로 반영
        s.mobilityWeight += adj.value * 0.5;
        s.safetyWeight   += adj.value * 0.5;
        break;
    }
  }

  private clampAndNormalize(): void {
    const s = this.currentStrategy;
    const clamp = (x: number) => Math.max(0, Math.min(x, 3)); // 0..3
    s.mobilityWeight  = clamp(s.mobilityWeight);
    s.frontierWeight  = clamp(s.frontierWeight);
    s.stabilityWeight = clamp(s.stabilityWeight);
    s.cornerWeight    = clamp(s.cornerWeight);
    s.edgeWeight      = clamp(s.edgeWeight);
    s.centerWeight    = clamp(s.centerWeight);
    s.safetyWeight    = clamp(s.safetyWeight);

    const tot = s.mobilityWeight + s.frontierWeight + s.stabilityWeight +
                s.cornerWeight + s.edgeWeight + s.centerWeight + s.safetyWeight;
    if (tot > 0) {
      s.mobilityWeight  /= tot; s.frontierWeight  /= tot; s.stabilityWeight /= tot;
      s.cornerWeight    /= tot; s.edgeWeight      /= tot; s.centerWeight   /= tot;
      s.safetyWeight    /= tot;
    }
  }

  private storeStrategyChange(
    situation: SituationAnalysis,
    adaptationNeeds: AdaptationNeeds
  ): void {
    const change: StrategyHistory = {
      timestamp: Date.now(),
      situation,
      adaptationNeeds,
      strategy: { ...this.currentStrategy },
      effectiveness: 0
    };
    this.strategyHistory.push(change);
    if (this.strategyHistory.length > 100) this.strategyHistory.shift();
  }

  // ------------------------------------------------------------
  // Defaults & Rules
  // ------------------------------------------------------------

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
      adaptationRules: new Map(), // (사용하지 않지만 호환 유지)
    };
  }

  private initializeAdaptationRules(): void {
    this.adaptationRules.set('mobility_low', {
      condition: (s) => s.mobility < -20,
      action: (st) => { st.mobilityWeight += 0.3; },
      description: 'Mobility is low → focus on mobility'
    });
    this.adaptationRules.set('stability_low', {
      condition: (s) => s.stability < -20,
      action: (st) => { st.stabilityWeight += 0.3; },
      description: 'Stability is low → focus on stability'
    });
    this.adaptationRules.set('corner_low', {
      condition: (s) => s.cornerControl < -50,
      action: (st) => { st.cornerWeight += 0.4; },
      description: 'Corner control is low → focus on corners'
    });
  }

  private analyzePositivePatterns(learningData: LearningData): PatternAnalysis[] {
    const out: PatternAnalysis[] = [];
    for (const [key, pattern] of learningData.patterns) {
      if (pattern.score > 0) {
        out.push({
          key,
          mobilityImpact: 0.1,
          stabilityImpact: 0.1,
          cornerImpact: 0.1,
          confidence: 0.8
        });
      }
    }
    return out;
  }

  private analyzeNegativePatterns(learningData: LearningData): PatternAnalysis[] {
    const out: PatternAnalysis[] = [];
    for (const mistake of learningData.mistakes) {
      out.push({
        key: mistake,
        mobilityImpact: -0.1,
        stabilityImpact: -0.1,
        cornerImpact: -0.1,
        confidence: 0.8
      });
    }
    return out;
  }

  // ------------------------------------------------------------
  // Geometry / Safety
  // ------------------------------------------------------------

  private isCorner(move: Position): boolean {
    const { row, col } = move;
    return (row === 0 || row === 7) && (col === 0 || col === 7);
  }

  private isEdge(move: Position): boolean {
    const { row, col } = move;
    return row === 0 || row === 7 || col === 0 || col === 7;
  }

  private isCenter(move: Position): boolean {
    const { row, col } = move;
    return row >= 3 && row <= 4 && col >= 3 && col <= 4;
  }

  private isSafeMove(move: Position, board: Board): boolean {
    if (this.isCorner(move)) return true;
    if (this.isDangerousSquare(move, board)) return false;
    if (this.isEdge(move) && !this.isEdgeSafe(move, board)) return false;
    return true;
  }

  private isDangerousSquare(move: Position, board: Board): boolean {
    const { row, col } = move;
    const x: Array<[number,number,number,number]> = [
      [1,1,0,0],[1,6,0,7],[6,1,7,0],[6,6,7,7],
    ];
    for (const [r,c,cr,cc] of x) {
      if (row===r && col===c && board[cr][cc]===null) return true;
    }
    const cgs = [
      { corner:[0,0], cells:[[0,1],[1,0]] },
      { corner:[0,7], cells:[[0,6],[1,7]] },
      { corner:[7,0], cells:[[6,0],[7,1]] },
      { corner:[7,7], cells:[[6,7],[7,6]] },
    ];
    for (const g of cgs) {
      const [cr,cc] = g.corner as [number,number];
      if (board[cr][cc] !== null) continue;
      for (const [r,c] of g.cells) if (row===r && col===c) return true;
    }
    return false;
  }

  private isEdgeSafe(move: Position, board: Board): boolean {
    const { row, col } = move;
    if (row === 0) { if ((col<=1 && board[0][0]===null) || (col>=6 && board[0][7]===null)) return false; }
    if (row === 7) { if ((col<=1 && board[7][0]===null) || (col>=6 && board[7][7]===null)) return false; }
    if (col === 0) { if ((row<=1 && board[0][0]===null) || (row>=6 && board[7][0]===null)) return false; }
    if (col === 7) { if ((row<=1 && board[0][7]===null) || (row>=6 && board[7][7]===null)) return false; }
    return true;
  }

  // ------------------------------------------------------------
  // Minimal Othello ops (2D). 엔진 공용/비트보드 있으면 그걸로 교체 가능.
  // ------------------------------------------------------------

  private simulateMove(board: Board, move: Position, player: Player): Board | null {
    if (board[move.row][move.col] !== null) return null;
    const nb: Board = board.map(r => [...r]);
    const opp = (player === 'black' ? 'white' : 'black');
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    let flipped = 0;

    nb[move.row][move.col] = player;

    for (const [dr,dc] of dirs) {
      const flips: Position[] = [];
      let r = move.row + dr, c = move.col + dc;
      while (r>=0&&r<8&&c>=0&&c<8 && nb[r][c]===opp) { flips.push({row:r,col:c}); r+=dr; c+=dc; }
      if (r>=0&&r<8&&c>=0&&c<8 && nb[r][c]===player && flips.length) {
        for (const f of flips) { nb[f.row][f.col] = player; flipped++; }
      }
    }
    return flipped ? nb : null;
  }

  private getValidMoves(board: Board, player: Player): Position[] {
    const ms: Position[] = [];
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
      if (board[r][c]!==null) continue;
      if (this.simulateMove(board, {row:r,col:c}, player)) ms.push({row:r,col:c});
    }
    return ms;
  }

  private countFrontierDiscs(board: Board, player: Player): number {
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    let cnt = 0;
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (board[r][c]===player) {
      let frontier = false;
      for (const [dr,dc] of dirs) {
        const nr=r+dr, nc=c+dc;
        if (nr>=0&&nr<8&&nc>=0&&nc<8 && board[nr][nc]===null) { frontier=true; break; }
      }
      if (frontier) cnt++;
    }
    return cnt;
  }

  // ------------------------------------------------------------
  // Stats
  // ------------------------------------------------------------

  getStrategyStats(): StrategyStats {
    const n = this.strategyHistory.length || 1;
    return {
      totalChanges: this.strategyHistory.length,
      averageEffectiveness: this.strategyHistory.reduce((sum, h) => sum + h.effectiveness, 0) / n,
      currentWeights: { ...this.currentStrategy },
      adaptationRules: this.adaptationRules.size
    };
  }
}

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

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
  type: string;   // 'mobility' | 'stability' | 'corner' | 'balanced' | 'exploit_weakness' ...
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
  value: number;       // positive/negative impact
  confidence: number;  // 0..1
  timestamp: number;
  // (선택) score 등 확장 필드가 LearningData에 있을 수 있음
  score?: number;
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
  effectiveness: number; // 사후 업데이트용
}

export interface StrategyStats {
  totalChanges: number;
  averageEffectiveness: number;
  currentWeights: StrategyConfig;
  adaptationRules: number;
}

