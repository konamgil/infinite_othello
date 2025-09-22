/**
 * 통합 타입 시스템 - 모든 도메인의 중앙 진입점
 * Enterprise급 TypeScript 타입 시스템
 */

// === 도메인별 타입 export ===
export * from './game';
export * from './auth';
export * from './replay';
export * from './ui';
export * from './network';

// === 기존 레거시 타입 호환성 ===
export * from './supabase';
export * from './engines.d';

// === 도메인 aliases (편의성을 위한 단축 이름) ===
export type {
  // Game domain shortcuts
  PlayerColor as Color,
  GameMode as Mode,
  GameState as State,
  GameMove as Move,
  Position as Pos,

  // Auth domain shortcuts
  UserProfile as User,
  AuthState as Auth,
  SessionInfo as Session,

  // Replay domain shortcuts
  GameRecord as Record,
  ReplayFilters as Filters,
  ReplayPlayerState as Player,

  // UI domain shortcuts
  AppSettings as Settings,
  ButtonProps as Button,
  ModalProps as Modal,

  // Network domain shortcuts
  RealtimeEvent as Event,
  ApiResponse as Response,
  ChatMessage as Chat,
} from './game';

// === 유틸리티 타입들 ===

/**
 * 객체의 특정 필드를 선택적으로 만드는 유틸리티 타입
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 객체의 특정 필드를 필수로 만드는 유틸리티 타입
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * 객체의 특정 필드만 선택하는 유틸리티 타입
 */
export type SelectFields<T, K extends keyof T> = Pick<T, K>;

/**
 * 객체의 특정 필드를 제외하는 유틸리티 타입
 */
export type OmitFields<T, K extends keyof T> = Omit<T, K>;

/**
 * 깊은 부분 객체 타입 (모든 속성을 선택적으로)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 깊은 읽기 전용 객체 타입
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 문자열 리터럴 유니온에서 키를 생성
 */
export type StringKeys<T> = Extract<keyof T, string>;

/**
 * 숫자 값만 포함하는 객체의 키들
 */
export type NumericKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

/**
 * 함수 타입만 포함하는 객체의 키들
 */
export type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

// === 도메인 간 관계 타입들 ===

/**
 * 게임과 사용자를 연결하는 타입
 */
export interface GameWithUser {
  game: import('./game').GameRecord;
  user: import('./auth').UserProfile;
  role: 'player' | 'spectator' | 'host';
}

/**
 * UI 컴포넌트와 데이터를 연결하는 타입
 */
export interface ComponentWithData<TComponent, TData> {
  component: TComponent;
  data: TData;
  loading?: boolean;
  error?: string;
}

/**
 * API 응답과 UI 상태를 연결하는 타입
 */
export interface ApiWithUIState<TData> {
  data: TData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// === 상수 타입들 ===

/**
 * 지원되는 모든 게임 모드
 */
export const SUPPORTED_GAME_MODES = [
  'single', 'local', 'online', 'ai', 'tower', 'battle',
  'casual', 'practice', 'ranked', 'quick', 'match', 'tournament'
] as const;

/**
 * 지원되는 모든 언어
 */
export const SUPPORTED_LANGUAGES = ['ko', 'en', 'ja', 'zh'] as const;

/**
 * 지원되는 모든 테마
 */
export const SUPPORTED_THEMES = ['light', 'dark', 'system', 'auto'] as const;

/**
 * API 에러 코드들
 */
export const API_ERROR_CODES = [
  'BAD_REQUEST', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND',
  'CONFLICT', 'VALIDATION_ERROR', 'RATE_LIMITED',
  'INTERNAL_ERROR', 'SERVICE_UNAVAILABLE', 'GATEWAY_TIMEOUT'
] as const;

// === 전역 타입 가드 함수들 ===

/**
 * 값이 null이나 undefined가 아닌지 확인
 */
export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

/**
 * 값이 빈 문자열이 아닌지 확인
 */
export const isNonEmptyString = (value: string | null | undefined): value is string => {
  return typeof value === 'string' && value.length > 0;
};

/**
 * 배열이 비어있지 않은지 확인
 */
export const isNonEmptyArray = <T>(value: T[] | null | undefined): value is T[] => {
  return Array.isArray(value) && value.length > 0;
};

/**
 * 객체가 비어있지 않은지 확인
 */
export const isNonEmptyObject = (value: object | null | undefined): value is object => {
  return value !== null && value !== undefined && Object.keys(value).length > 0;
};

// === 버전 정보 ===
export const TYPE_SYSTEM_VERSION = '1.0.0';
export const LAST_UPDATED = '2024-01-XX'; // 실제 날짜로 업데이트