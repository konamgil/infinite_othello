import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Defines the shape of the application's global state.
 */
export interface AppState {
  /** Manages different types of loading indicators across the app. */
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

/**
 * Defines the actions that can be performed on the application's global state.
 */
export interface AppActions {
  /** Sets the state for a specific type of loading indicator. */
  setLoading: (type: keyof AppState['loading'], value: boolean | string) => void;
  /** Resets all loading indicators to their initial state. */
  clearLoading: () => void;

  /** Sets an error for a specific domain. */
  setError: (type: keyof AppState['error'], error: Error | null) => void;
  /** Clears all errors. */
  clearErrors: () => void;
  /** Clears a specific error by its type. */
  clearError: (type: keyof AppState['error']) => void;

  /** Adds a new notification to be displayed to the user. */
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  /** Removes a notification by its ID. */
  removeNotification: (id: string) => void;
  /** Marks a specific notification as read. */
  markNotificationRead: (id: string) => void;
  /** Clears all notifications. */
  clearNotifications: () => void;

  /** Updates one or more application settings. */
  updateSettings: (settings: Partial<AppState['settings']>) => void;

  /** Updates device-specific information, like orientation or online status. */
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
 * The main Zustand store for global application state.
 *
 * This store manages application-wide concerns such as loading states, error handling,
 * notifications, and device information. It uses `devtools` for debugging and `persist`
 * middleware to save user settings to localStorage.
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
 * Convenience hooks for accessing specific parts of the AppStore.
 * These allow components to subscribe to only the state they need, preventing
 * unnecessary re-renders.
 */
export const useLoading = () => useAppStore((state) => state.loading);
export const useError = () => useAppStore((state) => state.error);
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useAppSettings = () => useAppStore((state) => state.settings);
export const useDevice = () => useAppStore((state) => state.device);

/**
 * A hook that provides access to all the action functions of the AppStore.
 * This is useful for components that need to dispatch actions but don't need to
 * subscribe to any state changes, as it won't cause re-renders when state changes.
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