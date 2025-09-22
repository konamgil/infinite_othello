/**
 * Auth Domain - 인증과 사용자 관련 모든 타입의 중앙 집중화
 * 사용자 프로필, 세션 관리, OAuth 등
 */

// User and profile types
export * from './user';
export * from './session';

// Re-export commonly used types with aliases
export type {
  UserProfile as Profile,
  GuestProfile as Guest,
  AccountType as Account,
  SupportedProvider as Provider,
} from './user';

export type {
  AuthState as Auth,
  SessionInfo as Session,
  AuthResult as Result,
} from './session';