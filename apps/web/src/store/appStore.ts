import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * @interface AppState
 * 애플리케이션의 전역 상태의 형태를 정의합니다.
 */
export interface AppState {
  /** @property {object} loading - 앱 전체의 다양한 로딩 상태를 관리합니다. */
  loading: {
    global: boolean;
    page: string | null;
    operation: string | null;
  };

  /** @property {object} error - 발생한 에러 상태를 관리합니다. */
  error: {
    global: Error | null;
    network: Error | null;
    game: Error | null;
  };

  /** @property {Array} notifications - 사용자에게 표시될 알림 목록입니다. */
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
  }>;

  /** @property {object} settings - 사용자의 앱 설정을 관리합니다. */
  settings: {
    language: 'ko' | 'en' | 'ja';
    timezone: string;
    debugMode: boolean;
    performanceMode: boolean;
  };

  /** @property {object} device - 사용자의 디바이스 환경 정보를 관리합니다. */
  device: {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    orientation: 'portrait' | 'landscape';
    online: boolean;
  };
}

/**
 * @interface AppActions
 * 애플리케이션 전역 상태에 대해 수행할 수 있는 액션들을 정의합니다.
 */
export interface AppActions {
  /** 특정 종류의 로딩 상태를 설정합니다. */
  setLoading: (type: keyof AppState['loading'], value: boolean | string) => void;
  /** 모든 로딩 상태를 초기화합니다. */
  clearLoading: () => void;

  /** 특정 영역의 에러를 설정합니다. */
  setError: (type: keyof AppState['error'], error: Error | null) => void;
  /** 모든 에러를 초기화합니다. */
  clearErrors: () => void;
  /** 특정 종류의 에러를 초기화합니다. */
  clearError: (type: keyof AppState['error']) => void;

  /** 새로운 알림을 추가합니다. */
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  /** ID로 특정 알림을 제거합니다. */
  removeNotification: (id: string) => void;
  /** 특정 알림을 '읽음' 상태로 표시합니다. */
  markNotificationRead: (id: string) => void;
  /** 모든 알림을 제거합니다. */
  clearNotifications: () => void;

  /** 하나 이상의 앱 설정을 업데이트합니다. */
  updateSettings: (settings: Partial<AppState['settings']>) => void;

  /** 디바이스 관련 정보를 업데이트합니다. (예: 화면 방향, 온라인 상태) */
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

/**
 * 앱의 전역 상태를 관리하는 메인 Zustand 스토어입니다.
 *
 * 이 스토어는 로딩 상태, 에러 핸들링, 알림, 디바이스 정보 등 앱 전반의 상태를 다룹니다.
 * 디버깅을 위해 `devtools` 미들웨어를 사용하고, 사용자 설정을 localStorage에 저장하기 위해
 * `persist` 미들웨어를 사용합니다.
 */
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

/**
 * AppStore의 특정 부분에 쉽게 접근하기 위한 편의성 훅입니다.
 * 이 훅들을 사용하면 컴포넌트가 필요한 상태에만 구독하여 불필요한 리렌더링을 방지할 수 있습니다.
 */
export const useLoading = () => useAppStore((state) => state.loading);
export const useError = () => useAppStore((state) => state.error);
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useAppSettings = () => useAppStore((state) => state.settings);
export const useDevice = () => useAppStore((state) => state.device);

/**
 * AppStore의 모든 액션 함수에 접근할 수 있는 훅입니다.
 * 상태 변화에는 구독하지 않고 액션만 디스패치해야 하는 컴포넌트에 유용하며,
 * 상태가 변경될 때 리렌더링을 발생시키지 않습니다.
 */
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