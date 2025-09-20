import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { supabase, supabaseUtils } from '../services/supabase';
import { guestAuthUtils, type GuestAuthState } from '../lib/guestAuth';
import { oauthUtils, type SupportedProvider } from '../lib/oauthProviders';
import { sessionUtils, type SessionConflictInfo } from '../lib/sessionManager';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import type { Profile } from '../types/supabase';

/**
 * Defines the shape of the authentication state.
 */
export interface AuthState {
  /** The currently authenticated Supabase user object. */
  user: User | null;
  /** The current Supabase session object. */
  session: Session | null;
  /** The application-specific user profile from the 'profiles' table. */
  profile: Profile | null;

  /** The profile for the current guest user, if any. */
  guestProfile: Profile | null;
  /** A flag indicating if the current user is a guest. */
  isGuest: boolean;

  /** True while the initial authentication state is being determined. */
  isLoading: boolean;
  /** True if a user (guest or authenticated) is currently logged in. */
  isAuthenticated: boolean;
  /** True once the initial authentication check has completed. */
  isInitialized: boolean;

  /** Stores any authentication-related error messages. */
  error: string | null;

  /** Loading state for the sign-up process. */
  signUpLoading: boolean;
  /** Loading state for the sign-in process. */
  signInLoading: boolean;
  /** Loading state for the sign-out process. */
  signOutLoading: boolean;
  /** Loading state for OAuth operations. */
  oauthLoading: boolean;

  /** The provider being used for an account linking operation. */
  linkingProvider: SupportedProvider | null;
  /** A flag to control the visibility of the account linking prompt. */
  showLinkPrompt: boolean;

  /** Stores information about a detected session conflict. */
  sessionConflict: SessionConflictInfo | null;
  /** A flag to control the visibility of the session conflict modal. */
  showSessionConflict: boolean;
}

/**
 * Defines the actions that can be performed on the authentication state.
 */
export interface AuthActions {
  /** Initializes the auth store, checks for an existing session, and sets up auth state listeners. */
  initialize: () => Promise<void>;

  /** Creates a new guest account. */
  createGuestAccount: () => Promise<{ success: boolean; profile?: Profile; error?: string }>;
  /** Loads a guest account from local storage, if one exists. */
  loadGuestFromLocal: () => void;

  /** Initiates the sign-in flow with an OAuth provider. */
  signInWithOAuth: (provider: SupportedProvider) => Promise<{ success: boolean; error?: string }>;
  /** Handles the callback from the OAuth provider after a successful sign-in. */
  handleOAuthCallback: () => Promise<{ success: boolean; error?: string }>;

  /** Initiates the flow to link the current guest account to an OAuth provider. */
  linkAccountWithOAuth: (provider: SupportedProvider) => Promise<{ success: boolean; error?: string }>;
  /** Controls the visibility of the prompt to link a guest account. */
  showLinkingPrompt: (show: boolean, context?: string) => void;

  /** Signs the current user out. */
  signOut: () => Promise<void>;

  /** Updates the current user's profile data. */
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;

  /** Handles a detected session conflict by updating the state. */
  handleSessionConflict: (conflictInfo: SessionConflictInfo) => void;
  /** Forcibly ends all other sessions for the current user. */
  forceEndOtherSessions: () => Promise<{ success: boolean; error?: string }>;
  /** Resolves a session conflict based on the user's choice ('force' or 'cancel'). */
  resolveSessionConflict: (action: 'force' | 'cancel') => Promise<void>;

  /** Determines if a guest user should be prompted to link their account. */
  shouldPromptLinking: (context: string) => boolean;
  /** Gets the limitations for a guest account. */
  getGuestLimitations: () => ReturnType<typeof guestAuthUtils.getLimitations>;

  /** Clears any authentication-related errors from the state. */
  clearError: () => void;

  /** Internal action to set the user and session state, used by the auth listener. */
  setAuth: (user: User | null, session: Session | null) => void;
  /** Internal action to set the profile state. */
  setProfile: (profile: Profile | null) => void;
  /** Internal action to set the guest profile state. */
  setGuestProfile: (profile: Profile | null) => void;
  /** Internal action to set the error state. */
  setError: (error: string | null) => void;
  /** Internal action to set the loading state. */
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
 * The main Zustand store for authentication.
 *
 * This store encapsulates all state and actions related to user authentication,
 * including user data, session management, guest accounts, and OAuth flows.
 * It uses `devtools` for debugging and `persist` middleware to keep the user
 * logged in across browser sessions.
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
 * A convenience hook that provides access to the core authentication state.
 * This hook is optimized to only re-render components when the selected state changes.
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
 * A convenience hook that provides access to the authentication actions.
 * This hook will not cause a component to re-render when state changes.
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
 * A convenience hook for accessing the various loading states related to authentication.
 */
export const useAuthLoading = () => useAuthStore((state) => ({
  signUpLoading: state.signUpLoading,
  signInLoading: state.signInLoading,
  signOutLoading: state.signOutLoading,
}));