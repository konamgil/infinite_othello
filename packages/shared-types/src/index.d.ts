/**
 * 🎯 Infinite Othello - 완전 새로운 타입 시스템
 *
 * 설계 원칙:
 * - 직관적이고 명확한 네이밍
 * - 오델로 게임 도메인에 최적화
 * - 타입 안전성과 성능 모두 고려
 * - 책임 분리된 상태 아키텍처
 */
/** 오델로 플레이어 - 직관적인 색상 기반 */
export type Player = 'black' | 'white';
/** 보드 셀 상태 - null은 빈 칸 */
export type Cell = Player | null;
/** 8x8 오델로 보드 */
export type Board = Cell[][];
/** 보드 좌표 - 오델로 표준 (0-7) */
export interface Position {
    readonly row: number;
    readonly col: number;
}
/** 게임 이동 - 포지션 + 메타데이터 */
export interface Move extends Position {
    readonly player: Player;
    readonly capturedCells: readonly Position[];
    readonly timestamp: number;
}
/** 게임 상태 */
export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';
/** 게임 점수 */
export interface Score {
    readonly black: number;
    readonly white: number;
}
/** 게임 모드 */
export type GameMode = 'practice' | 'ai' | 'local' | 'online' | 'tower' | 'battle' | 'tournament' | 'ranked';
/** AI 난이도 */
export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master';
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
    readonly timeLimit?: number;
    readonly startTime: number;
    readonly endTime?: number;
    readonly aiThinking: boolean;
    readonly aiMoveDelay: number;
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
    readonly stats: PlayerStats;
    readonly progress: PlayerProgress;
}
export type BoardTheme = 'classic' | 'dark' | 'neon' | 'wood' | 'galaxy';
export type StoneTheme = 'classic' | 'glass' | 'metal' | 'crystal' | 'minimal';
export type AnimationSpeed = 'none' | 'fast' | 'normal' | 'slow';
export interface PlayerInfo {
    readonly name: string;
    readonly type: 'human' | 'ai';
    readonly difficulty?: AIDifficulty;
    readonly avatar?: string;
}
export type PlayerRank = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Grandmaster';
export interface PlayerStats {
    readonly totalGames: number;
    readonly wins: number;
    readonly losses: number;
    readonly draws: number;
    readonly winRate: number;
    readonly bestWinStreak: number;
    readonly currentWinStreak: number;
    readonly totalPlayTime: number;
    readonly averageGameTime: number;
}
export interface PlayerProgress {
    readonly currentFloor: number;
    readonly highestFloor: number;
    readonly towerProgress: number;
    readonly unlockedThemes: readonly BoardTheme[];
    readonly achievements: readonly string[];
    readonly rp: number;
}
/**
 * 엔진 요청 - 새로운 타입 시스템 기반
 */
export interface EngineRequest {
    readonly gameCore: GameCore;
    readonly timeLimit?: number;
    readonly depth?: number;
    readonly skill?: number;
}
/**
 * 엔진 응답 - 분석 결과와 최적 수
 */
export interface EngineResponse {
    readonly bestMove?: Position;
    readonly evaluation: number;
    readonly nodes: number;
    readonly depth: number;
    readonly timeUsed: number;
    readonly pv?: readonly Position[];
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
    stop?(): void;
}
/**
 * 이동 결과 - 성공/실패와 상세 정보
 */
export type MoveResult = {
    readonly success: true;
    readonly move: Move;
    readonly newGameCore: GameCore;
    readonly capturedCells: readonly Position[];
} | {
    readonly success: false;
    readonly reason: MoveFailureReason;
    readonly message: string;
};
export type MoveFailureReason = 'invalid_position' | 'occupied' | 'no_captures' | 'not_your_turn' | 'game_finished' | 'game_paused';
/**
 * 게임 결과
 */
export interface GameResult {
    readonly winner: Player | 'draw';
    readonly score: Score;
    readonly endReason: GameEndReason;
    readonly duration: number;
    readonly totalMoves: number;
}
export type GameEndReason = 'normal' | 'resignation' | 'timeout' | 'disconnect' | 'forfeit';
/** 위치 유효성 검사 */
export declare const isValidPosition: (pos: Position) => boolean;
/** 플레이어 반전 */
export declare const getOpponent: (player: Player) => Player;
/** 위치 문자열 변환 (디버깅용) */
export declare const positionToString: (pos: Position) => string;
/** 문자열을 위치로 변환 */
export declare const stringToPosition: (str: string) => Position | null;
export declare const GAME_CONSTANTS: {
    readonly BOARD_SIZE: 8;
    readonly INITIAL_PIECES: 4;
    readonly MAX_MOVES: 60;
    readonly DEFAULT_AI_DELAY: 1000;
    readonly DEFAULT_TIME_LIMIT: 1800;
    readonly MIN_RATING: 800;
    readonly MAX_RATING: 3000;
    readonly INITIAL_RATING: 1200;
};
export type { Player, Cell, Board, Position, Move, GameCore, GameSession, GameUI, Engine, EngineRequest, EngineResponse, MoveResult, GameResult, GameMode, AIDifficulty, BoardTheme, AnimationSpeed };
