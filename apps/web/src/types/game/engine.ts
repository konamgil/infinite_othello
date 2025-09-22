/**
 * Game Engine Domain - AI 엔진과 게임 분석 관련 타입
 * 게임 AI, 분석 엔진, 평가 함수 등
 */

import { GameState, Move, Position, PlayerColor } from './core';

// === 엔진 요청/응답 ===
export interface EngineRequest {
  state: GameState;
  timeLimitMs?: number;
  skill?: number; // 1-100 스킬 레벨
  searchDepth?: number;
}

export interface EngineResponse {
  move?: Move; // 최선의 수
  nodes?: number; // 탐색한 노드 수
  evaluation?: number; // 위치 평가 점수 (+ 흑에게 유리, - 백에게 유리)
  pv?: Move[]; // Principal Variation (최선 수순)
  stats?: EngineStats;
  searchTime?: number; // 탐색 시간 (ms)
}

export interface EngineStats {
  nodesPerSecond?: number;
  cacheHits?: number;
  cacheMisses?: number;
  maxDepth?: number;
  timeUsed?: number;
}

// === 엔진 인터페이스 ===
export interface Engine {
  analyze(req: EngineRequest): Promise<EngineResponse>;
  getName(): string;
  getVersion(): string;
  setSkillLevel?(level: number): void;
  stop?(): void;
}

// === 이동 분석 ===
export interface MoveEvaluation {
  move: Move;
  score: number; // -100 ~ +100
  category: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  depth?: number;
  nodes?: number;
}

export interface MoveAnalysis {
  position: Position;
  evaluation: number;
  category: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  alternatives: {
    move: Position;
    evaluation: number;
    reason: string;
  }[];
  comment: string;
  engineLine?: Move[]; // 엔진이 제안하는 최선 수순
}

// === 게임 분석 ===
export interface GameAnalysis {
  accuracy: {
    black: number; // 0-100%
    white: number; // 0-100%
  };
  turningPoints: TurningPoint[];
  openingName?: string;
  gamePhases: GamePhases;
  bestMoves: number[]; // 최선 수였던 이동 번호들
  blunders: number[]; // 실수였던 이동 번호들
  timeAnalysis?: TimeAnalysis;
  evaluationHistory: number[]; // 각 수마다의 평가값
}

export interface TurningPoint {
  moveNumber: number;
  previousEvaluation: number;
  newEvaluation: number;
  significance: 'minor' | 'major' | 'critical';
  description: string;
  lostAdvantage?: number; // 잃은 이점 (점수)
}

export interface GamePhases {
  opening: GamePhase;
  midgame: GamePhase;
  endgame: GamePhase;
}

export interface GamePhase {
  startMove: number;
  endMove: number;
  evaluation: string;
  keyMoments?: string[];
  averageAccuracy?: {
    black: number;
    white: number;
  };
}

export interface TimeAnalysis {
  averageThinkTime: {
    black: number;
    white: number;
  };
  longestThink: {
    moveNumber: number;
    player: PlayerColor;
    duration: number;
  };
  timeDistribution: 'even' | 'frontloaded' | 'backloaded';
  timePerPhase?: {
    opening: number;
    midgame: number;
    endgame: number;
  };
}

// === 엔진 설정 ===
export interface EngineConfig {
  name: string;
  maxSearchTime: number; // ms
  maxSearchDepth: number;
  skillLevel: number; // 1-100
  useBook: boolean; // 오프닝 북 사용 여부
  threads?: number;
  hashSize?: number; // MB
}

// === 오프닝 북 ===
export interface OpeningMove {
  move: Move;
  frequency: number; // 사용 빈도
  winRate: number; // 승률
  games: number; // 게임 수
}

export interface OpeningBook {
  positions: Map<string, OpeningMove[]>; // 보드 상태 → 가능한 수들
  getName(): string;
  getMovesForPosition(state: GameState): OpeningMove[];
}

// === 평가 함수 관련 ===
export interface EvaluationWeights {
  material: number; // 돌 개수
  mobility: number; // 가능한 수의 개수
  corner: number; // 모서리 점유
  edge: number; // 가장자리 점유
  stability: number; // 안정된 돌
  parity: number; // 홀짝성
}

export interface PositionEvaluation {
  totalScore: number;
  components: {
    material: number;
    mobility: number;
    corner: number;
    edge: number;
    stability: number;
    parity: number;
  };
  phase: 'opening' | 'midgame' | 'endgame';
}

// === 엔진 성능 메트릭 ===
export interface EnginePerformance {
  totalAnalysisTime: number;
  totalPositions: number;
  averageTimePerPosition: number;
  nodesPerSecond: number;
  accuracy: number; // 다른 강한 엔진과 비교한 일치율
  strength: number; // ELO 추정치
}

// === 다중 엔진 분석 ===
export interface MultiEngineAnalysis {
  engines: string[]; // 사용된 엔진들
  consensus: MoveEvaluation; // 엔진들의 합의
  disagreements: {
    move: Move;
    evaluations: { engine: string; score: number }[];
  }[];
  averageDepth: number;
  totalTime: number;
}

// === 타입 가드와 유틸리티 ===
export const isValidScore = (score: number): boolean => {
  return score >= -100 && score <= 100;
};

export const isBlunder = (evaluation: MoveEvaluation): boolean => {
  return evaluation.category === 'blunder';
};

export const isCriticalTurningPoint = (tp: TurningPoint): boolean => {
  return tp.significance === 'critical';
};