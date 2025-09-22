/**
 * Auth Session Domain - 세션 관리와 인증 상태 관련 타입
 * 로그인 상태, 세션 충돌, OAuth 흐름 등
 */

import type { User, Session, AuthError } from '@supabase/supabase-js';
import type { UserProfile, SupportedProvider } from './user';

// === 기본 인증 상태 ===
export interface AuthState {
  // Supabase 기본 객체들
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;

  // 게스트 관련
  guestProfile: UserProfile | null;
  isGuest: boolean;

  // 상태 플래그
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;

  // 에러 상태
  error: string | null;

  // 로딩 상태들
  signUpLoading: boolean;
  signInLoading: boolean;
  signOutLoading: boolean;
  oauthLoading: boolean;

  // OAuth 연동 관련
  linkingProvider: SupportedProvider | null;
  showLinkPrompt: boolean;

  // 세션 충돌 관련
  sessionConflict: SessionConflictInfo | null;
  showSessionConflict: boolean;
}

// === 세션 관리 ===
export interface SessionInfo {
  id: string;
  userId: string;
  deviceInfo: string;
  ipAddress?: string;
  userAgent?: string;
  startedAt: string;
  lastActiveAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface SessionConflictInfo {
  deviceInfo: string;
  startedAt: string;
  lastSeen: string;
  location?: string;
  canForceEnd?: boolean;
}

export interface SessionManagerConfig {
  maxConcurrentSessions: number;
  sessionTimeoutMinutes: number;
  conflictResolution: 'force_logout' | 'allow_multiple' | 'ask_user';
  trackDeviceInfo: boolean;
  trackLocation: boolean;
}

// === 인증 액션 결과 ===
export interface AuthResult {
  success: boolean;
  error?: string;
  requiresVerification?: boolean;
  redirectTo?: string;
}

export interface SignUpResult extends AuthResult {
  userId?: string;
  verificationRequired?: boolean;
}

export interface SignInResult extends AuthResult {
  sessionConflict?: SessionConflictInfo;
  requiresMFA?: boolean;
}

export interface OAuthResult extends AuthResult {
  provider?: SupportedProvider;
  isNewUser?: boolean;
  needsLinking?: boolean;
}

// === OAuth 흐름 ===
export interface OAuthState {
  provider: SupportedProvider;
  redirectTo?: string;
  linkExistingAccount?: boolean;
  guestUserId?: string;
  state: string; // CSRF 보호를 위한 state parameter
  codeVerifier?: string; // PKCE를 위한 code verifier
}

export interface OAuthCallbackData {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

// === 인증 이벤트 ===
export type AuthEventType =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'SIGNED_UP'
  | 'PASSWORD_RECOVERY'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'MFA_CHALLENGE_VERIFIED';

export interface AuthEvent {
  type: AuthEventType;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

// === 로그인 방법들 ===
export interface EmailPasswordCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends EmailPasswordCredentials {
  username: string;
  displayName?: string;
  acceptTerms: boolean;
  newsletter?: boolean;
}

export interface ResetPasswordRequest {
  email: string;
  redirectTo?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// === 보안 관련 ===
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  trustedDevices: TrustedDevice[];
  loginNotifications: boolean;
  passwordLastChanged: string;
  failedLoginAttempts: number;
  accountLockedUntil?: string;
}

export interface TrustedDevice {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  trustedAt: string;
  lastUsedAt: string;
  isActive: boolean;
}

export interface LoginAttempt {
  id: string;
  userId?: string;
  email?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  attemptedAt: string;
  location?: {
    country: string;
    city: string;
  };
}

// === 계정 복구 ===
export interface AccountRecoveryRequest {
  type: 'email' | 'security_questions' | 'support';
  identifier: string; // email or username
  securityAnswers?: string[];
  supportTicketId?: string;
}

export interface AccountRecoverySession {
  id: string;
  userId: string;
  type: 'password_reset' | 'account_unlock' | 'email_change';
  token: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

// === 인증 제공자 설정 ===
export interface AuthProviderConfig {
  providers: {
    email: {
      enabled: boolean;
      requireVerification: boolean;
      allowSignup: boolean;
    };
    oauth: {
      [K in SupportedProvider]: {
        enabled: boolean;
        clientId: string;
        scopes: string[];
        autoLinkAccounts: boolean;
      };
    };
    guest: {
      enabled: boolean;
      maxDuration: number; // days
      autoPromptLinking: boolean;
      limitations: any;
    };
  };
  security: SecuritySettings;
  session: SessionManagerConfig;
}

// === 타입 가드 함수들 ===
export const isSignedIn = (state: AuthState): boolean => {
  return state.isAuthenticated && !!state.user;
};

export const isGuest = (state: AuthState): boolean => {
  return state.isGuest && !!state.guestProfile;
};

export const hasSessionConflict = (state: AuthState): boolean => {
  return !!state.sessionConflict && state.showSessionConflict;
};

export const isOAuthProvider = (provider: string): provider is SupportedProvider => {
  return ['google', 'apple', 'facebook'].includes(provider as SupportedProvider);
};

export const isAuthError = (error: any): error is AuthError => {
  return error && typeof error.message === 'string';
};

// === 유틸리티 타입들 ===
export type AuthStateSlice = Pick<AuthState, 'isAuthenticated' | 'isLoading' | 'user' | 'profile'>;
export type SessionUpdate = Partial<SessionInfo>;
export type SecurityUpdate = Partial<SecuritySettings>;