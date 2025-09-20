import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Defines the shape of the game's UI and user preference state.
 */
export interface GameState {
  /** The currently active main tab in the bottom navigation. */
  activeTab: 'home' | 'tower' | 'battle' | 'stella' | 'more';

  // 플레이어 정보
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

  // 테마 설정
  theme: {
    board: 'classic' | 'dark' | 'galaxy' | 'magic' | 'seasons';
    stone: 'classic' | 'ruby-sapphire' | 'sun-moon' | 'fire-ice' | 'techno';
  };

  // UI 설정
  ui: {
    fontSize: 'small' | 'medium' | 'large';
    animations: boolean;
    soundEnabled: boolean;
  };
}

/**
 * Defines the actions that can be performed on the game state.
 */
export interface GameActions {
  /** Sets the currently active tab. */
  setActiveTab: (tab: GameState['activeTab']) => void;
  /** Updates one or more properties of the player's profile. */
  updatePlayer: (player: Partial<GameState['player']>) => void;
  /** Updates the visual theme settings. */
  setTheme: (theme: Partial<GameState['theme']>) => void;
  /** Updates the general UI settings. */
  updateUISettings: (settings: Partial<GameState['ui']>) => void;
}

export type GameStore = GameState & GameActions;

/**
 * Calculates the initial active tab based on the current URL path.
 * This ensures the correct tab is highlighted when the app loads on a specific page.
 * @returns {GameState['activeTab']} The initial tab to be activated.
 */
const getInitialTab = (): GameState['activeTab'] => {
  if (typeof window === 'undefined') return 'home';

  const path = window.location.pathname;
  if (path === '/' || path === '/home') return 'home';
  if (path === '/tower') return 'tower';
  if (path === '/battle') return 'battle';
  if (path === '/stella') return 'stella';
  if (path === '/more' || path === '/replay') return 'more'; // /replay maps to more tab
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
 * The Zustand store for managing general game UI state and user preferences.
 *
 * This store holds information about the active UI tab, player stats,
 * and visual/audio settings. It does not manage the core Othello game logic,
 * which is handled by `othelloStore`.
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
 * Convenience hooks for accessing specific parts of the GameStore.
 */
export const useActiveTab = () => useGameStore((state) => state.activeTab);
export const usePlayer = () => useGameStore((state) => state.player);
export const useTheme = () => useGameStore((state) => state.theme);
export const useUISettings = () => useGameStore((state) => state.ui);



