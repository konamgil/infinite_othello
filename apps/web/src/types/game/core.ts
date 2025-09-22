/**
 * Game Core Domain - 오델로 게임의 핵심 타입 정의
 * 게임 로직, 보드 상태, 이동 규칙 등 게임의 본질적인 요소들
 */

// === 기본 게임 요소 ===
export type Disc = -1 | 0 | 1; // -1: White, 1: Black, 0: Empty
export type Player = -1 | 1;
export type PlayerColor = 'black' | 'white';

// === 보드와 위치 ===
export interface Position {
  x: number; // 0..7
  y: number; // 0..7
}

export interface Move {
  x: number;
  y: number;
}

export type Board = Disc[][]; // 8x8 표준 오델로 보드

// === 게임 상태 ===
export interface GameState {
  board: Board;
  current: Player; // 현재 턴 플레이어
}

export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';

// === 게임 모드 ===
export type GameMode =
  | 'single'     // 혼자 연습
  | 'local'      // 로컬 대전
  | 'online'     // 온라인 대전
  | 'ai'         // AI 대전
  | 'tower'      // 타워 모드
  | 'battle'     // 배틀 모드
  | 'casual'     // 캐주얼 게임
  | 'practice'   // 연습 모드
  | 'ranked'     // 랭크 게임
  | 'quick'      // 빠른 게임
  | 'match'      // 매치 게임
  | 'tournament'; // 토너먼트

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

// === 게임 결과 ===
export interface GameResult {
  winner: PlayerColor | 'draw' | null;
  blackScore: number;
  whiteScore: number;
  endReason: 'normal' | 'forfeit' | 'timeout' | 'resignation' | 'disconnect';
}

// === 플레이어 정보 ===
export interface PlayerInfo {
  name: string;
  rating?: number;
  isAI: boolean;
  aiLevel?: Difficulty;
  rank?: string;
  color?: PlayerColor;
}

// === 게임 이동과 기록 ===
export interface GameMove {
  position: Position;
  player: PlayerColor;
  timestamp: number;
  capturedDiscs: Position[]; // 뒤집힌 돌들의 위치
  moveNumber?: number;
}

// === 게임 통계 ===
export interface GameStats {
  totalMoves: number;
  captures: {
    black: number;
    white: number;
  };
  gameStartTime: number | null;
  gameEndTime: number | null;
  duration?: number; // seconds
}

// === 유효한 이동 계산 ===
export interface ValidMove {
  row: number;
  col: number;
  captureCount?: number; // 이 이동으로 뒤집을 수 있는 돌의 개수
}

// === 게임 설정 ===
export interface GameSettings {
  boardSize: number; // 기본 8
  timeLimit: number | null; // seconds, null이면 무제한
  aiMoveDelay: number; // AI 이동 지연 시간 (ms)
  showValidMoves: boolean;
  showMoveHints: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
}

// === 상수와 제한값 ===
export const GAME_CONSTANTS = {
  BOARD_SIZE: 8,
  MIN_BOARD_SIZE: 4,
  MAX_BOARD_SIZE: 10,
  INITIAL_PIECES: 4,
  MAX_MOVES: 60,
  DEFAULT_TIME_LIMIT: 1800, // 30분
  MIN_AI_DELAY: 100,
  MAX_AI_DELAY: 5000,
} as const;

// === 타입 가드 함수들 ===
export const isValidPosition = (pos: Position): boolean => {
  return pos.x >= 0 && pos.x < 8 && pos.y >= 0 && pos.y < 8;
};

export const isValidPlayerColor = (color: string): color is PlayerColor => {
  return color === 'black' || color === 'white';
};

export const isValidGameMode = (mode: string): mode is GameMode => {
  const validModes: GameMode[] = [
    'single', 'local', 'online', 'ai', 'tower', 'battle',
    'casual', 'practice', 'ranked', 'quick', 'match', 'tournament'
  ];
  return validModes.includes(mode as GameMode);
};

export const isValidDifficulty = (difficulty: string): difficulty is Difficulty => {
  return ['easy', 'medium', 'hard', 'expert'].includes(difficulty as Difficulty);
};

// === 유틸리티 함수 타입들 ===
export type PositionCalculator = (board: Board, position: Position, player: Player) => Position[];
export type MoveValidator = (board: Board, move: Move, player: Player) => boolean;
export type ScoreCalculator = (board: Board) => { black: number; white: number };
export type GameEndChecker = (board: Board, validMoves: ValidMove[]) => boolean;