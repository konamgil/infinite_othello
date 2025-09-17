import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// 앱 전체 상태 타입 정의
export interface AppState {
  // 로딩 상태
  loading: {
    global: boolean;
    page: string | null;
    operation: string | null;
  };

  // 에러 관리
  error: {
    global: Error | null;
    network: Error | null;
    game: Error | null;
  };

  // 알림 시스템
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
  }>;

  // 앱 설정
  settings: {
    language: 'ko' | 'en' | 'ja';
    timezone: string;
    debugMode: boolean;
    performanceMode: boolean;
  };

  // 디바이스 정보
  device: {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    orientation: 'portrait' | 'landscape';
    online: boolean;
  };
}

// 액션 타입 정의
export interface AppActions {
  // 로딩 관리
  setLoading: (type: keyof AppState['loading'], value: boolean | string) => void;
  clearLoading: () => void;

  // 에러 관리
  setError: (type: keyof AppState['error'], error: Error | null) => void;
  clearErrors: () => void;
  clearError: (type: keyof AppState['error']) => void;

  // 알림 관리
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // 설정 관리
  updateSettings: (settings: Partial<AppState['settings']>) => void;

  // 디바이스 정보 업데이트
  updateDevice: (device: Partial<AppState['device']>) => void;
}

export type AppStore = AppState & AppActions;

// 초기 상태
const initialState: AppState = {
  loading: {
    global: false,
    page: null,
    operation: null,
  },
  error: {
    global: null,
    network: null,
    game: null,
  },
  notifications: [],
  settings: {
    language: 'ko',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    debugMode: process.env.NODE_ENV === 'development',
    performanceMode: false,
  },
  device: {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'landscape',
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  },
};

// Zustand 스토어 생성
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // 로딩 관리
        setLoading: (type, value) =>
          set(
            (state) => ({
              loading: {
                ...state.loading,
                [type]: value,
              },
            }),
            false,
            'setLoading'
          ),

        clearLoading: () =>
          set(
            { loading: { global: false, page: null, operation: null } },
            false,
            'clearLoading'
          ),

        // 에러 관리
        setError: (type, error) =>
          set(
            (state) => ({
              error: {
                ...state.error,
                [type]: error,
              },
            }),
            false,
            'setError'
          ),

        clearErrors: () =>
          set(
            { error: { global: null, network: null, game: null } },
            false,
            'clearErrors'
          ),

        clearError: (type) =>
          set(
            (state) => ({
              error: {
                ...state.error,
                [type]: null,
              },
            }),
            false,
            'clearError'
          ),

        // 알림 관리
        addNotification: (notification) => {
          const id = Date.now().toString();
          set(
            (state) => ({
              notifications: [
                ...state.notifications,
                {
                  ...notification,
                  id,
                  timestamp: Date.now(),
                  read: false,
                },
              ],
            }),
            false,
            'addNotification'
          );
        },

        removeNotification: (id) =>
          set(
            (state) => ({
              notifications: state.notifications.filter((n) => n.id !== id),
            }),
            false,
            'removeNotification'
          ),

        markNotificationRead: (id) =>
          set(
            (state) => ({
              notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
              ),
            }),
            false,
            'markNotificationRead'
          ),

        clearNotifications: () =>
          set({ notifications: [] }, false, 'clearNotifications'),

        // 설정 관리
        updateSettings: (settingsUpdate) =>
          set(
            (state) => ({
              settings: { ...state.settings, ...settingsUpdate },
            }),
            false,
            'updateSettings'
          ),

        // 디바이스 정보 업데이트
        updateDevice: (deviceUpdate) =>
          set(
            (state) => ({
              device: { ...state.device, ...deviceUpdate },
            }),
            false,
            'updateDevice'
          ),
      }),
      {
        name: 'infinity-othello-app-store',
        partialize: (state) => ({
          settings: state.settings,
          // 디바이스 정보와 임시 상태는 persist하지 않음
        }),
      }
    ),
    {
      name: 'infinity-othello-app-store',
    }
  )
);

// 편의 훅들
export const useLoading = () => useAppStore((state) => state.loading);
export const useError = () => useAppStore((state) => state.error);
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useAppSettings = () => useAppStore((state) => state.settings);
export const useDevice = () => useAppStore((state) => state.device);

// 액션 훅들
export const useAppActions = () => useAppStore((state) => ({
  setLoading: state.setLoading,
  clearLoading: state.clearLoading,
  setError: state.setError,
  clearErrors: state.clearErrors,
  clearError: state.clearError,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  markNotificationRead: state.markNotificationRead,
  clearNotifications: state.clearNotifications,
  updateSettings: state.updateSettings,
  updateDevice: state.updateDevice,
}));