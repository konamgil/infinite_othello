/**
 * Game Domain - 게임 관련 모든 타입의 중앙 집중화
 * 게임 코어와 엔진 타입들을 하나로 모음
 */

// Core game types
export * from './core';
export * from './engine';

// Re-export commonly used types with aliases for convenience
export type {
  PlayerColor as Color,
  GameMode as Mode,
  GameStatus as Status,
  Position as Coordinate,
} from './core';

export type {
  EngineResponse as AIResponse,
  MoveAnalysis as Analysis,
  GameAnalysis as FullAnalysis,
} from './engine';