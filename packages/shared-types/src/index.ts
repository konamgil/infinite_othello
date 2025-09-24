/**
 * 🎯 Infinite Othello - 완전 새로운 타입 시스템
 *
 * 설계 원칙:
 * - 직관적이고 명확한 네이밍
 * - 오델로 게임 도메인에 최적화
 * - 타입 안전성과 성능 모두 고려
 * - 책임 분리된 상태 아키텍처
 */

// ===== 🎮 Core Game Types =====

/** 오델로 플레이어 - 직관적인 색상 기반 */
export type Player = 'black' | 'white';

/** 보드 셀 상태 - null은 빈 칸 */
export type Cell = Player | null;

/** 8x8 오델로 보드 */
export type Board = Cell[][];

/** 보드 좌표 - 오델로 표준 (0-7) */
export interface Position {
  readonly row: number; // 0-7
  readonly col: number; // 0-7
}

/** 게임 이동 - 포지션 + 메타데이터 */
export interface Move extends Position {
  readonly player: Player;
  readonly capturedCells: readonly Position[];
  readonly timestamp: number;
}

// ===== 🧠 Game Logic Types =====

/** 게임 상태 */
export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';

/** 게임 점수 */
export interface Score {
  readonly black: number;
  readonly white: number;
}

/** 게임 모드 */
export type GameMode =
  | 'practice'    // 혼자 연습
  | 'ai'         // AI 대전
  | 'local'      // 로컬 대전
  | 'online'     // 온라인 대전
  | 'tower'      // 타워 챌린지
  | 'battle'     // 배틀 모드
  | 'tournament' // 토너먼트
  | 'ranked';    // 랭크 게임

/** AI 난이도 */
export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master';

// ===== 🏗️ Core Game State =====

/**
 * 게임 핵심 상태 - 순수 비즈니스 로직만 포함
 * UI나 세션 정보와 분리하여 테스트 용이성 확보
 */
export interface GameCore {
  readonly id: string;
  readonly board: Board;
  readonly currentPlayer: Player;
  readonly validMoves: readonly Position[];
  readonly score: Score;
  readonly status: GameStatus;
  readonly moveHistory: readonly Move[];
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

/**
 * 게임 세션 메타데이터 - 모드, AI, 타이밍 등
 * 게임 로직과 분리하여 설정 변경 용이성 확보
 */
export interface GameSession {
  readonly id: string;
  readonly mode: GameMode;
  readonly difficulty?: AIDifficulty;
  readonly timeLimit?: number; // seconds
  readonly startTime: number;
  readonly endTime?: number;

  // AI 상태 (중복 제거)
  readonly aiThinking: boolean;
  readonly aiMoveDelay: number; // ms

  // 플레이어 정보
  readonly players: {
    readonly black: PlayerInfo;
    readonly white: PlayerInfo;
  };
}

/**
 * UI 전용 상태 - 애니메이션, 테마, 시각적 효과
 * 게임 로직과 완전 분리하여 UI 변경이 로직에 영향 없음
 */
export interface GameUI {
  readonly theme: BoardTheme;
  readonly showValidMoves: boolean;
  readonly showLastMove: boolean;
  readonly animationSpeed: AnimationSpeed;

  // 현재 애니메이션 상태
  readonly animatingCells: readonly Position[];
  readonly lastMove?: Position;
  readonly highlightedCells: readonly Position[];
}

/**
 * 플레이어 프로필 - 사용자 데이터와 통계
 * 게임 세션과 분리하여 영속성 확보
 */
export interface PlayerProfile {
  readonly id: string;
  readonly name: string;
  readonly avatar?: string;
  readonly rating: number;
  readonly rank: PlayerRank;

  // 통계
  readonly stats: PlayerStats;

  // 진행상황
  readonly progress: PlayerProgress;
}

// ===== 🎨 UI & Theme Types =====

export type BoardTheme = 'classic' | 'dark' | 'neon' | 'wood' | 'galaxy';
export type StoneTheme = 'classic' | 'glass' | 'metal' | 'crystal' | 'minimal';
export type AnimationSpeed = 'none' | 'fast' | 'normal' | 'slow';

// ===== 👤 Player Types =====

export interface PlayerInfo {
  readonly name: string;
  readonly type: 'human' | 'ai';
  readonly difficulty?: AIDifficulty;
  readonly avatar?: string;
}

export type PlayerRank =
  | 'Bronze' | 'Silver' | 'Gold'
  | 'Platinum' | 'Diamond' | 'Master' | 'Grandmaster';

export interface PlayerStats {
  readonly totalGames: number;
  readonly wins: number;
  readonly losses: number;
  readonly draws: number;
  readonly winRate: number;
  readonly bestWinStreak: number;
  readonly currentWinStreak: number;
  readonly totalPlayTime: number; // seconds
  readonly averageGameTime: number; // seconds
}

export interface PlayerProgress {
  readonly currentFloor: number;
  readonly highestFloor: number;
  readonly towerProgress: number; // 0-100%
  readonly unlockedThemes: readonly BoardTheme[];
  readonly achievements: readonly string[];
  readonly rp: number; // Ranking Points
}

// ===== 🤖 Engine System =====

/**
 * 엔진 요청 - 새로운 타입 시스템 기반
 */
export interface EngineRequest {
  readonly gameCore: GameCore;
  readonly timeLimit?: number; // ms
  readonly depth?: number;
  readonly skill?: number; // 0-100
}

/**
 * 엔진 응답 - 분석 결과와 최적 수
 */
export interface EngineResponse {
  readonly bestMove?: Position;
  readonly evaluation: number; // + black 유리, - white 유리
  readonly nodes: number;
  readonly depth: number;
  readonly timeUsed: number; // ms
  readonly pv?: readonly Position[]; // 최선 변화
  readonly stats?: Record<string, unknown>;
}

/**
 * 엔진 인터페이스 - 타입 안전한 AI 시스템
 */
export interface Engine {
  readonly name: string;
  readonly version: string;
  readonly author: string;
  analyze(request: EngineRequest): Promise<EngineResponse>;
  stop?(): void; // 분석 중단
}

// ===== ⚡ Action Result Types =====

/**
 * 이동 결과 - 성공/실패와 상세 정보
 */
export type MoveResult =
  | {
      readonly success: true;
      readonly move: Move;
      readonly newGameCore: GameCore;
      readonly capturedCells: readonly Position[];
    }
  | {
      readonly success: false;
      readonly reason: MoveFailureReason;
      readonly message: string;
    };

export type MoveFailureReason =
  | 'invalid_position'  // 잘못된 좌표
  | 'occupied'         // 이미 돌이 있음
  | 'no_captures'      // 뒤집을 수 없음
  | 'not_your_turn'    // 차례가 아님
  | 'game_finished'    // 게임 종료
  | 'game_paused';     // 게임 일시정지

/**
 * 게임 결과
 */
export interface GameResult {
  readonly winner: Player | 'draw';
  readonly score: Score;
  readonly endReason: GameEndReason;
  readonly duration: number; // seconds
  readonly totalMoves: number;
}

export type GameEndReason =
  | 'normal'      // 정상 종료
  | 'resignation' // 기권
  | 'timeout'     // 시간 초과
  | 'disconnect'  // 연결 끊김
  | 'forfeit';    // 몰수

// ===== 🔧 Utility Types =====

/** 위치 유효성 검사 */
export const isValidPosition = (pos: Position): boolean =>
  pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;

/** 플레이어 반전 */
export const getOpponent = (player: Player): Player =>
  player === 'black' ? 'white' : 'black';

/** 위치 문자열 변환 (디버깅용) */
export const positionToString = (pos: Position): string =>
  `${String.fromCharCode(97 + pos.col)}${pos.row + 1}`; // a1, b2, etc.

/** 문자열을 위치로 변환 */
export const stringToPosition = (str: string): Position | null => {
  if (str.length !== 2) return null;
  const col = str.charCodeAt(0) - 97; // a=0, b=1, etc.
  const row = parseInt(str[1]) - 1;   // 1=0, 2=1, etc.
  return isValidPosition({ row, col }) ? { row, col } : null;
};

// ===== 📊 Constants =====

export const GAME_CONSTANTS = {
  BOARD_SIZE: 8,
  INITIAL_PIECES: 4,
  MAX_MOVES: 60,
  DEFAULT_AI_DELAY: 1000, // ms
  DEFAULT_TIME_LIMIT: 1800, // 30분
  MIN_RATING: 800,
  MAX_RATING: 3000,
  INITIAL_RATING: 1200
} as const;

