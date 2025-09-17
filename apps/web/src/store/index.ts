// 중앙화된 스토어 export
export * from './gameStore';
export * from './appStore';
export * from './othelloStore';
export * from './networkStore';
export * from './authStore';

// 스토어 타입 통합
export type {
  GameState,
  GameActions,
  GameStore,
} from './gameStore';

export type {
  AppState,
  AppActions,
  AppStore,
} from './appStore';

export type {
  OthelloState,
  OthelloActions,
  OthelloStore,
} from './othelloStore';

export type {
  NetworkState,
  NetworkActions,
  NetworkStore,
} from './networkStore';

export type {
  AuthState,
  AuthActions,
  AuthStore,
} from './authStore';