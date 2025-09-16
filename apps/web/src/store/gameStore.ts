import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// 게임 상태 타입 정의
export interface GameState {
  // 현재 활성 탭
  activeTab: 'home' | 'tower' | 'battle' | 'stella' | 'more';

  // 플레이어 정보
  player: {
    rating: number;
    rank: string;
    currentFloor: number;
    towerProgress: number;
    wins: number;
    losses: number;
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

// 액션 타입 정의
export interface GameActions {
  setActiveTab: (tab: GameState['activeTab']) => void;
  updatePlayer: (player: Partial<GameState['player']>) => void;
  setTheme: (theme: Partial<GameState['theme']>) => void;
  updateUISettings: (settings: Partial<GameState['ui']>) => void;
}

export type GameStore = GameState & GameActions;

// URL 기반 초기 탭 계산
const getInitialTab = (): GameState['activeTab'] => {
  if (typeof window === 'undefined') return 'home';

  const path = window.location.pathname;
  if (path === '/' || path === '/home') return 'home';
  if (path === '/tower') return 'tower';
  if (path === '/battle') return 'battle';
  if (path === '/stella') return 'stella';
  if (path === '/more') return 'more';
  return 'home';
};

// 초기 상태
const initialState: GameState = {
  activeTab: getInitialTab(),
  player: {
    rating: 1500,
    rank: 'Bronze',
    currentFloor: 1,
    towerProgress: 1, // 1층으로 초기화
    wins: 45,
    losses: 12,
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

// Zustand 스토어 생성
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

// 편의 훅들
export const useActiveTab = () => useGameStore((state) => state.activeTab);
export const usePlayer = () => useGameStore((state) => state.player);
export const useTheme = () => useGameStore((state) => state.theme);
export const useUISettings = () => useGameStore((state) => state.ui);