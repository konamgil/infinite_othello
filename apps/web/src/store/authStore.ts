import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase, supabaseUtils } from '../services/supabase';
import { guestAuthUtils, type GuestAuthState } from '../lib/guestAuth';
import { oauthUtils, type SupportedProvider } from '../lib/oauthProviders';
import { sessionUtils, type SessionConflictInfo } from '../lib/sessionManager';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import type { Profile } from '../types/supabase';

/**
 * @interface AuthState
 * 인증과 관련된 모든 상태의 형태를 정의합니다.
 */
export interface AuthState {
  /** @property {User | null} user - 현재 인증된 Supabase 사용자 객체. */
  user: User | null;
  /** @property {Session | null} session - 현재 Supabase 세션 객체. */
  session: Session | null;
  /** @property {Profile | null} profile - 'profiles' 테이블에서 가져온 앱 전용 사용자 프로필. */
  profile: Profile | null;

  /** @property {Profile | null} guestProfile - 현재 게스트 사용자의 프로필 (게스트 모드일 경우). */
  guestProfile: Profile | null;
  /** @property {boolean} isGuest - 현재 사용자가 게스트인지 여부를 나타내는 플래그. */
  isGuest: boolean;

  /** @property {boolean} isLoading - 초기 인증 상태를 확인하는 동안 true. */
  isLoading: boolean;
  /** @property {boolean} isAuthenticated - 사용자(게스트 또는 정식)가 현재 로그인되어 있으면 true. */
  isAuthenticated: boolean;
  /** @property {boolean} isInitialized - 초기 인증 확인이 완료되면 true. */
  isInitialized: boolean;

  /** @property {string | null} error - 인증 관련 에러 메시지를 저장. */
  error: string | null;

  /** @property {boolean} signUpLoading - 회원가입 절차가 진행 중일 때 true. */
  signUpLoading: boolean;
  /** @property {boolean} signInLoading - 로그인 절차가 진행 중일 때 true. */
  signInLoading: boolean;
  /** @property {boolean} signOutLoading - 로그아웃 절차가 진행 중일 때 true. */
  signOutLoading: boolean;
  /** @property {boolean} oauthLoading - OAuth 관련 작업이 진행 중일 때 true. */
  oauthLoading: boolean;

  /** @property {SupportedProvider | null} linkingProvider - 계정 연동에 사용 중인 OAuth 프로바이더. */
  linkingProvider: SupportedProvider | null;
  /** @property {boolean} showLinkPrompt - 계정 연동 프롬프트의 표시 여부를 제어하는 플래그. */
  showLinkPrompt: boolean;

  /** @property {SessionConflictInfo | null} sessionConflict - 감지된 세션 충돌 정보를 저장. */
  sessionConflict: SessionConflictInfo | null;
  /** @property {boolean} showSessionConflict - 세션 충돌 모달의 표시 여부를 제어하는 플래그. */
  showSessionConflict: boolean;
}

/**
 * @interface AuthActions
 * 인증 상태에 대해 수행할 수 있는 모든 액션을 정의합니다.
 */
export interface AuthActions {
  /** 인증 스토어를 초기화하고, 기존 세션을 확인하며, 인증 상태 리스너를 설정합니다. */
  initialize: () => Promise<void>;

  /** 새로운 게스트 계정을 생성합니다. */
  createGuestAccount: () => Promise<{ success: boolean; profile?: Profile; error?: string }>;
  /** 로컬 저장소에 저장된 게스트 계정이 있으면 불러옵니다. */
  loadGuestFromLocal: () => void;

  /** OAuth 프로바이더를 통한 로그인 절차를 시작합니다. */
  signInWithOAuth: (provider: SupportedProvider) => Promise<{ success: boolean; error?: string }>;
  /** OAuth 제공자로부터 성공적인 로그인 후 콜백을 처리합니다. */
  handleOAuthCallback: () => Promise<{ success: boolean; error?: string }>;

  /** 현재 게스트 계정을 OAuth 프로바이더에 연동하는 절차를 시작합니다. */
  linkAccountWithOAuth: (provider: SupportedProvider) => Promise<{ success: boolean; error?: string }>;
  /** 게스트 계정 연동 프롬프트의 표시 여부를 제어합니다. */
  showLinkingPrompt: (show: boolean, context?: string) => void;

  /** 현재 사용자를 로그아웃시킵니다. */
  signOut: () => Promise<void>;

  /** 현재 사용자의 프로필 데이터를 업데이트합니다. */
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;

  /** 감지된 세션 충돌 정보를 상태에 업데이트하여 처리합니다. */
  handleSessionConflict: (conflictInfo: SessionConflictInfo) => void;
  /** 현재 사용자의 다른 모든 세션을 강제로 종료합니다. */
  forceEndOtherSessions: () => Promise<{ success: boolean; error?: string }>;
  /** 사용자의 선택('force' 또는 'cancel')에 따라 세션 충돌을 해결합니다. */
  resolveSessionConflict: (action: 'force' | 'cancel') => Promise<void>;

  /** 게스트 사용자에게 계정 연동을 유도할지 여부를 결정합니다. */
  shouldPromptLinking: (context: string) => boolean;
  /** 게스트 계정의 제한 사항을 가져옵니다. */
  getGuestLimitations: () => ReturnType<typeof guestAuthUtils.getLimitations>;

  /** 상태에 저장된 인증 관련 에러를 초기화합니다. */
  clearError: () => void;

  /** (내부용) 인증 리스너가 사용자 및 세션 상태를 설정하기 위해 사용하는 액션. */
  setAuth: (user: User | null, session: Session | null) => void;
  /** (내부용) 프로필 상태를 설정하는 액션. */
  setProfile: (profile: Profile | null) => void;
  /** (내부용) 게스트 프로필 상태를 설정하는 액션. */
  setGuestProfile: (profile: Profile | null) => void;
  /** (내부용) 에러 상태를 설정하는 액션. */
  setError: (error: string | null) => void;
  /** (내부용) 로딩 상태를 설정하는 액션. */
  setLoading: (loading: boolean) => void;
}

export type AuthStore = AuthState & AuthActions;

// 초기 상태
const initialState: AuthState = {
  user: null,
  session: null,
  profile: null,
  guestProfile: null,
  isGuest: false,
  isLoading: true,
  isAuthenticated: false,
  isInitialized: false,
  error: null,
  signUpLoading: false,
  signInLoading: false,
  signOutLoading: false,
  oauthLoading: false,
  linkingProvider: null,
  showLinkPrompt: false,
  sessionConflict: null,
  showSessionConflict: false,
};

/**
 * 인증을 위한 메인 Zustand 스토어입니다.
 *
 * 이 스토어는 사용자 데이터, 세션 관리, 게스트 계정, OAuth 흐름 등
 * 사용자 인증과 관련된 모든 상태와 액션을 캡슐화합니다.
 * 디버깅을 위해 `devtools`를 사용하고, 사용자가 브라우저 세션 간에 로그인 상태를
 * 유지할 수 있도록 `persist` 미들웨어를 사용합니다.
 */
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // 초기화
        initialize: async () => {
          try {
            set({ isLoading: true, error: null });

            if (typeof window !== 'undefined' && !(window as any).__infinitySessionConflictListener) {
              const handleConflictEvent = async (event: Event) => {
                const custom = event as CustomEvent<{ message?: string }>;
                const { user } = get();

                if (user) {
                  const activeSession = await sessionUtils.getActive(user.id);
                  if (activeSession) {
                    get().handleSessionConflict({
                      deviceInfo: activeSession.current_device_info ?? '알 수 없는 기기',
                      startedAt: activeSession.session_started_at ?? new Date().toISOString(),
                      lastSeen: activeSession.last_seen ?? new Date().toISOString(),
                    });
                    return;
                  }
                }

                get().handleSessionConflict({
                  deviceInfo: custom.detail?.message ?? '알 수 없는 기기',
                  startedAt: new Date().toISOString(),
                  lastSeen: new Date().toISOString(),
                });
              };

              window.addEventListener('session-conflict', handleConflictEvent);
              (window as any).__infinitySessionConflictListener = true;
            }

            // 현재 세션 가져오기
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
              console.error('Session error:', sessionError);
              set({ error: supabaseUtils.translateError(sessionError) });
              return;
            }

            if (session?.user) {
              // 프로필 정보 가져오기
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profileError && profileError.code !== 'PGRST116') {
                console.error('Profile fetch error:', profileError);
              }

              set({
                user: session.user,
                session,
                profile: profile || null,
                isAuthenticated: true,
              });

              const sessionStart = await sessionUtils.start(session.user.id);
              if (!sessionStart.success && sessionStart.conflictInfo) {
                const info = sessionStart.conflictInfo as { deviceInfo?: string; startedAt?: string; lastSeen?: string };
                set({
                  sessionConflict: {
                    deviceInfo: info.deviceInfo ?? '알 수 없는 기기',
                    startedAt: info.startedAt ?? new Date().toISOString(),
                    lastSeen: info.lastSeen ?? new Date().toISOString(),
                  },
                  showSessionConflict: true,
                });
              }
            }

            // 인증 상태 변경 리스너 설정
            supabase.auth.onAuthStateChange(async (event, session) => {
              console.log('Auth state changed:', event, session?.user?.id);

              if (event === 'SIGNED_IN' && session?.user) {
                // 프로필 정보 가져오기
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();

                get().setAuth(session.user, session);
                get().setProfile(profile || null);

                const sessionStart = await sessionUtils.start(session.user.id);
                if (!sessionStart.success && sessionStart.conflictInfo) {
                  const info = sessionStart.conflictInfo as { deviceInfo?: string; startedAt?: string; lastSeen?: string };
                  set({
                    sessionConflict: {
                      deviceInfo: info.deviceInfo ?? '알 수 없는 기기',
                      startedAt: info.startedAt ?? new Date().toISOString(),
                      lastSeen: info.lastSeen ?? new Date().toISOString(),
                    },
                    showSessionConflict: true,
                  });
                }
              } else if (event === 'SIGNED_OUT') {
                await sessionUtils.end();
                get().setAuth(null, null);
                get().setProfile(null);
                set({ sessionConflict: null, showSessionConflict: false });
              }
            });

          } catch (error) {
            console.error('Auth initialization error:', error);
            set({ error: '인증 초기화 중 오류가 발생했습니다.' });
          } finally {
            set({ isLoading: false, isInitialized: true });
          }
        },

        // 회원가입
        signUp: async (email, password, username, displayName) => {
          try {
            set({ signUpLoading: true, error: null });

            // 사용자 생성
            const { data, error: signUpError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  username,
                  display_name: displayName || username,
                },
              },
            });

            if (signUpError) {
              const errorMessage = supabaseUtils.translateError(signUpError);
              set({ error: errorMessage });
              return { success: false, error: errorMessage };
            }

            if (data.user) {
              // 프로필 생성
              const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                  id: data.user.id,
                  email,
                  username,
                  display_name: displayName || username,
                  rating: 1500,
                  rank: 'Bronze',
                  total_games: 0,
                  wins: 0,
                  losses: 0,
                  draws: 0,
                });

              if (profileError) {
                console.error('Profile creation error:', profileError);
                // 프로필 생성 실패해도 가입은 성공으로 처리
              }

              return { success: true };
            }

            return { success: false, error: '회원가입에 실패했습니다.' };

          } catch (error) {
            const errorMessage = '회원가입 중 오류가 발생했습니다.';
            set({ error: errorMessage });
            return { success: false, error: errorMessage };
          } finally {
            set({ signUpLoading: false });
          }
        },

        // 로그인
        signIn: async (email, password) => {
          try {
            set({ signInLoading: true, error: null });

            const { data, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (signInError) {
              const errorMessage = supabaseUtils.translateError(signInError);
              set({ error: errorMessage });
              return { success: false, error: errorMessage };
            }

            if (data.user && data.session) {
              // 프로필 정보 가져오기
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

              // 마지막 접속 시간 업데이트
              if (profile) {
                await supabase
                  .from('profiles')
                  .update({ last_seen: new Date().toISOString() })
                  .eq('id', data.user.id);
              }

              set({
                user: data.user,
                session: data.session,
                profile: profile || null,
                isAuthenticated: true,
              });

              const sessionStart = await sessionUtils.start(data.user.id);
              if (!sessionStart.success && sessionStart.conflictInfo) {
                const info = sessionStart.conflictInfo as { deviceInfo?: string; startedAt?: string; lastSeen?: string };
                set({
                  sessionConflict: {
                    deviceInfo: info.deviceInfo ?? '알 수 없는 기기',
                    startedAt: info.startedAt ?? new Date().toISOString(),
                    lastSeen: info.lastSeen ?? new Date().toISOString(),
                  },
                  showSessionConflict: true,
                });
                return { success: false, error: sessionStart.error ?? '다른 기기에서 이미 로그인되어 있습니다.' };
              }

              return { success: true };
            }

            return { success: false, error: '로그인에 실패했습니다.' };

          } catch (error) {
            const errorMessage = '로그인 중 오류가 발생했습니다.';
            set({ error: errorMessage });
            return { success: false, error: errorMessage };
          } finally {
            set({ signInLoading: false });
          }
        },

        // 로그아웃
        signOut: async () => {
          try {
            set({ signOutLoading: true, error: null });

            const { error } = await supabase.auth.signOut();

            if (error) {
              const errorMessage = supabaseUtils.translateError(error);
              set({ error: errorMessage });
              return;
            }

            await sessionUtils.end();
            set({ sessionConflict: null, showSessionConflict: false });

            // 상태 초기화는 onAuthStateChange에서 처리됨

          } catch (error) {
            set({ error: '로그아웃 중 오류가 발생했습니다.' });
          } finally {
            set({ signOutLoading: false });
          }
        },

        // 프로필 업데이트
        updateProfile: async (updates) => {
          try {
            const { user } = get();
            if (!user) {
              return { success: false, error: '로그인이 필요합니다.' };
            }

            const { error } = await supabase
              .from('profiles')
              .update({
                ...updates,
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id);

            if (error) {
              const errorMessage = supabaseUtils.translateError(error);
              set({ error: errorMessage });
              return { success: false, error: errorMessage };
            }

            // 로컬 상태 업데이트
            set((state) => ({
              profile: state.profile ? { ...state.profile, ...updates } : null,
            }));

            return { success: true };

          } catch (error) {
            const errorMessage = '프로필 업데이트 중 오류가 발생했습니다.';
            set({ error: errorMessage });
            return { success: false, error: errorMessage };
          }
        },

        // 세션 관리
        handleSessionConflict: (conflictInfo) => {
          set({ sessionConflict: conflictInfo, showSessionConflict: true });
        },

        forceEndOtherSessions: async () => {
          const { user } = get();
          if (!user) {
            return { success: false, error: '로그인이 필요합니다.' };
          }

          const result = await sessionUtils.forceEnd(user.id);
          if (!result.success && result.error) {
            set({ error: result.error });
            return result;
          }

          set({ sessionConflict: null, showSessionConflict: false });

          const restart = await sessionUtils.start(user.id);
          if (!restart.success && restart.conflictInfo) {
            const info = restart.conflictInfo as { deviceInfo?: string; startedAt?: string; lastSeen?: string };
            set({
              sessionConflict: {
                deviceInfo: info.deviceInfo ?? '알 수 없는 기기',
                startedAt: info.startedAt ?? new Date().toISOString(),
                lastSeen: info.lastSeen ?? new Date().toISOString(),
              },
              showSessionConflict: true,
            });
          }

          return result;
        },

        resolveSessionConflict: async (action) => {
          if (action === 'force') {
            const result = await get().forceEndOtherSessions();
            if (!result.success) {
              return;
            }
          } else {
            set({ sessionConflict: null, showSessionConflict: false });
            return;
          }

          set({ sessionConflict: null, showSessionConflict: false });
        },

        // 비밀번호 재설정
        resetPassword: async (email) => {
          try {
            set({ error: null });

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
              const errorMessage = supabaseUtils.translateError(error);
              set({ error: errorMessage });
              return { success: false, error: errorMessage };
            }

            return { success: true };

          } catch (error) {
            const errorMessage = '비밀번호 재설정 중 오류가 발생했습니다.';
            set({ error: errorMessage });
            return { success: false, error: errorMessage };
          }
        },

        // 에러 초기화
        clearError: () => set({ error: null }),

        // 내부 상태 업데이트 함수들
        setAuth: (user, session) => set({
          user,
          session,
          isAuthenticated: !!user && !!session,
        }),

        setProfile: (profile) => set({ profile }),

        setError: (error) => set({ error }),

        setLoading: (isLoading) => set({ isLoading }),
      }),
      {
        name: 'infinity-othello-auth-store',
        partialize: (state) => ({
          // 민감한 정보는 저장하지 않음
          profile: state.profile,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'AuthStore',
    }
  )
);

/**
 * 핵심 인증 상태에 쉽게 접근하기 위한 편의성 훅입니다.
 * 이 훅은 선택된 상태가 변경될 때만 컴포넌트를 리렌더링하도록 최적화되어 있습니다.
 */
export const useAuth = () => useAuthStore((state) => ({
  user: state.user,
  session: state.session,
  profile: state.profile,
  isLoading: state.isLoading,
  isAuthenticated: state.isAuthenticated,
  isInitialized: state.isInitialized,
  error: state.error,
  sessionConflict: state.sessionConflict,
  showSessionConflict: state.showSessionConflict,
}));

/**
 * 인증 관련 액션에 쉽게 접근하기 위한 편의성 훅입니다.
 * 이 훅은 상태가 변경되어도 컴포넌트를 리렌더링하지 않습니다.
 */
export const useAuthActions = () => useAuthStore((state) => ({
  initialize: state.initialize,
  signUp: state.signUp,
  signIn: state.signIn,
  signOut: state.signOut,
  updateProfile: state.updateProfile,
  resetPassword: state.resetPassword,
  clearError: state.clearError,
  handleSessionConflict: state.handleSessionConflict,
  forceEndOtherSessions: state.forceEndOtherSessions,
  resolveSessionConflict: state.resolveSessionConflict,
}));

/**
 * 인증과 관련된 다양한 로딩 상태에 접근하기 위한 편의성 훅입니다.
 */
export const useAuthLoading = () => useAuthStore((state) => ({
  signUpLoading: state.signUpLoading,
  signInLoading: state.signInLoading,
  signOutLoading: state.signOutLoading,
}));