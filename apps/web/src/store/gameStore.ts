import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * @interface GameState
 * 게임의 UI 및 사용자 선호도와 관련된 상태의 형태를 정의합니다.
 */
export interface GameState {
  /** @property {string} activeTab - 하단 네비게이션에서 현재 활성화된 메인 탭. */
  activeTab: 'home' | 'tower' | 'battle' | 'stella' | 'more';

  /** @property {object} player - 플레이어의 프로필 및 진행 상황 정보. */
  player: {
    name: string;
    rating: number;
    rank: string;
    currentFloor: number;
    towerProgress: number;
    wins: number;
    losses: number;
    winStreak: number;
    rp: number;
  };

  /** @property {object} theme - 시각적 테마 설정. */
  theme: {
    board: 'classic' | 'dark' | 'galaxy' | 'magic' | 'seasons';
    stone: 'classic' | 'ruby-sapphire' | 'sun-moon' | 'fire-ice' | 'techno';
  };

  /** @property {object} ui - 일반적인 UI 관련 설정. */
  ui: {
    fontSize: 'small' | 'medium' | 'large';
    animations: boolean;
    soundEnabled: boolean;
  };
}

/**
 * @interface GameActions
 * 게임 상태에 대해 수행할 수 있는 액션들을 정의합니다.
 */
export interface GameActions {
  /** 현재 활성화된 탭을 설정합니다. */
  setActiveTab: (tab: GameState['activeTab']) => void;
  /** 플레이어 프로필의 하나 이상의 속성을 업데이트합니다. */
  updatePlayer: (player: Partial<GameState['player']>) => void;
  /** 시각적 테마 설정을 업데이트합니다. */
  setTheme: (theme: Partial<GameState['theme']>) => void;
  /** 일반 UI 설정을 업데이트합니다. */
  updateUISettings: (settings: Partial<GameState['ui']>) => void;
}

export type GameStore = GameState & GameActions;

/**
 * 현재 URL 경로를 기반으로 초기 활성 탭을 계산합니다.
 * 이를 통해 앱이 특정 페이지에서 로드될 때 올바른 탭이 강조 표시됩니다.
 * @returns {GameState['activeTab']} 활성화할 초기 탭.
 */
const getInitialTab = (): GameState['activeTab'] => {
  if (typeof window === 'undefined') return 'home';

  const path = window.location.pathname;
  if (path === '/' || path === '/home') return 'home';
  if (path === '/tower') return 'tower';
  if (path === '/battle') return 'battle';
  if (path === '/stella') return 'stella';
  if (path === '/more' || path === '/replay') return 'more'; // /replay는 '더보기' 탭에 매핑됨
  return 'home';
};

// 초기 상태
const initialState: GameState = {
  activeTab: getInitialTab(),
  player: {
    name: 'Stella',
    rating: 1500,
    rank: 'Bronze',
    currentFloor: 1,
    towerProgress: 1, // 1층으로 초기화
    wins: 45,
    losses: 12,
    winStreak: 3,
    rp: 1750,
  },
  theme: {
    board: 'classic',
    stone: 'classic',
  },
  ui: {
    fontSize: 'medium',
    animations: true,
    soundEnabled: true,
  },
};

/**
 * 일반적인 게임 UI 상태와 사용자 선호도를 관리하는 Zustand 스토어입니다.
 *
 * 이 스토어는 활성 UI 탭, 플레이어 통계, 시각/음향 설정에 대한 정보를 관리합니다.
 * 핵심 오델로 게임 로직은 `othelloStore`에서 처리하며, 이 스토어에서는 다루지 않습니다.
 */
export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setActiveTab: (tab) =>
        set({ activeTab: tab }, false, 'setActiveTab'),

      updatePlayer: (playerUpdate) =>
        set(
          (state) => ({
            player: { ...state.player, ...playerUpdate }
          }),
          false,
          'updatePlayer'
        ),

      setTheme: (themeUpdate) =>
        set(
          (state) => ({
            theme: { ...state.theme, ...themeUpdate }
          }),
          false,
          'setTheme'
        ),

      updateUISettings: (settingsUpdate) =>
        set(
          (state) => ({
            ui: { ...state.ui, ...settingsUpdate }
          }),
          false,
          'updateUISettings'
        ),
    }),
    {
      name: 'infinity-othello-game-store', // DevTools에서 표시될 이름
    }
  )
);

/**
 * GameStore의 특정 부분에 쉽게 접근하기 위한 편의성 훅입니다.
 */
export const useActiveTab = () => useGameStore((state) => state.activeTab);
export const usePlayer = () => useGameStore((state) => state.player);
export const useTheme = () => useGameStore((state) => state.theme);
export const useUISettings = () => useGameStore((state) => state.ui);



