/**
 * 타워 게임 전용 스토어
 * 300층 타워 시스템과 AI 엔진 관리
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createTowerAI, getTowerAIInfo, type TowerAIEngine, type TowerAIConfig } from '../utils/towerAI';
import type { Board, Player } from '../utils/othelloLogic';

// === 타워 상태 인터페이스 ===
export interface TowerState {
  // 현재 도전 정보
  currentFloor: number; // 현재 도전하는 층
  maxReachedFloor: number; // 최고 도달 층
  currentAI: TowerAIConfig | null; // 현재 상대 AI 정보

  // 게임 진행 상태
  isInTowerGame: boolean; // 타워 게임 진행 중
  towerGameStatus: 'waiting' | 'playing' | 'paused' | 'victory' | 'defeat';

  // 에너지 시스템
  energy: number; // 현재 에너지 (최대 5)
  maxEnergy: number; // 최대 에너지
  energyRegenTime: number; // 다음 에너지 회복까지 시간 (초)
  lastEnergyUpdate: number; // 마지막 에너지 업데이트 시간

  // 도전 기록
  floorAttempts: { [floor: number]: number }; // 각 층별 도전 횟수
  floorVictories: { [floor: number]: boolean }; // 각 층별 승리 여부
  totalGamesPlayed: number; // 총 게임 수
  totalVictories: number; // 총 승리 수

  // 보상 시스템
  unclaimedRewards: FloorReward[]; // 미수령 보상
  totalRP: number; // 총 Research Point
  totalCoins: number; // 총 코인

  // 특별 이벤트
  dailyChallenge: DailyChallenge | null; // 일일 도전
  weeklyBonus: WeeklyBonus | null; // 주간 보너스
  specialEvents: SpecialEvent[]; // 특별 이벤트들
}

export interface FloorReward {
  floor: number;
  type: 'RP' | 'coins' | 'energy' | 'title' | 'theme' | 'achievement';
  amount: number;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  targetFloor: number;
  reward: FloorReward;
  progress: number;
  maxProgress: number;
  completed: boolean;
  expiresAt: Date;
}

export interface WeeklyBonus {
  multiplier: number; // RP 획득 배율
  floorsCleared: number; // 이번 주 클리어한 층 수
  bonusThreshold: number; // 보너스 받을 층 수
  claimed: boolean;
  expiresAt: Date;
}

export interface SpecialEvent {
  id: string;
  name: string;
  description: string;
  type: 'double_rp' | 'free_energy' | 'boss_rush' | 'time_limited';
  active: boolean;
  startTime: Date;
  endTime: Date;
  rewards: FloorReward[];
}

// === 타워 액션 인터페이스 ===
export interface TowerActions {
  // 층 도전
  startFloorChallenge: (floor: number) => Promise<boolean>;
  completeFloorChallenge: (victory: boolean) => void;
  abandonFloorChallenge: () => void;

  // AI 관리
  getCurrentAI: () => TowerAIEngine | null;
  getAIMove: (board: Board, player: Player) => Promise<{ row: number; col: number } | null>;

  // 에너지 시스템
  consumeEnergy: (amount?: number) => boolean;
  regenEnergy: () => void;
  buyEnergy: (amount: number) => boolean;

  // 진행 상태 관리
  updateProgress: (floor: number, victory: boolean) => void;
  resetProgress: () => void;

  // 보상 시스템
  claimReward: (reward: FloorReward) => void;
  claimAllRewards: () => void;
  calculateFloorReward: (floor: number, victory: boolean) => FloorReward[];

  // 특별 기능
  skipFloor: (floor: number) => boolean; // 스킵 아이템 사용
  retryFloor: (floor: number) => boolean; // 재시도 (추가 에너지 소모)

  // 통계 및 정보
  getFloorStats: (floor: number) => FloorStats | null;
  getTowerOverview: () => TowerOverview;

  // 데이일리/위클리
  updateDailyChallenge: () => void;
  claimDailyReward: () => void;
  updateWeeklyBonus: () => void;
  claimWeeklyBonus: () => void;
}

export interface FloorStats {
  floor: number;
  attempts: number;
  victories: number;
  bestTime: number; // 최단 클리어 시간
  winRate: number;
  averageMovesWhenWon: number;
  lastPlayed: Date | null;
}

export interface TowerOverview {
  currentFloor: number;
  maxReached: number;
  totalFloorsCleared: number;
  totalAttempts: number;
  overallWinRate: number;
  totalPlayTime: number; // seconds
  ranking: {
    global: number;
    regional: number;
  } | null;
}

export type TowerStore = TowerState & TowerActions;

// === 에너지 시스템 상수 ===
const ENERGY_CONSTANTS = {
  MAX_ENERGY: 5,
  ENERGY_REGEN_TIME: 30 * 60, // 30분 (초)
  ENERGY_PER_GAME: 1,
  ENERGY_COST_RETRY: 2,
  ENERGY_COST_SKIP: 3,
} as const;

// === 보상 계산 로직 ===
const calculateBaseReward = (floor: number, victory: boolean): FloorReward[] => {
  const rewards: FloorReward[] = [];

  if (!victory) {
    // 패배 시 소량의 RP만
    rewards.push({
      floor,
      type: 'RP',
      amount: Math.floor(floor * 0.1),
      name: '도전 보상',
      description: '도전한 용기에 대한 소량의 RP',
      rarity: 'common'
    });
    return rewards;
  }

  // 승리 시 보상 계산
  const baseRP = Math.floor(floor * 1.5 + Math.random() * floor * 0.5);
  const baseCoins = Math.floor(floor * 0.8);

  rewards.push({
    floor,
    type: 'RP',
    amount: baseRP,
    name: '승리 보상',
    description: `${floor}층 클리어 보상`,
    rarity: floor > 250 ? 'legendary' : floor > 150 ? 'epic' : floor > 50 ? 'rare' : 'common'
  });

  rewards.push({
    floor,
    type: 'coins',
    amount: baseCoins,
    name: '코인 보상',
    description: `${floor}층 클리어 코인`,
    rarity: 'common'
  });

  // 특별 층 보상 (50층마다)
  if (floor % 50 === 0) {
    rewards.push({
      floor,
      type: 'energy',
      amount: 1,
      name: '에너지 보상',
      description: '특별 층 달성 보너스 에너지',
      rarity: 'rare'
    });
  }

  // 레전더리 층 보상 (100층마다)
  if (floor % 100 === 0) {
    rewards.push({
      floor,
      type: 'title',
      amount: 1,
      name: `${floor}층 정복자`,
      description: `${floor}층을 정복한 증표`,
      rarity: 'legendary'
    });
  }

  return rewards;
};

// === 초기 상태 ===
const initialState: TowerState = {
  currentFloor: 1,
  maxReachedFloor: 1,
  currentAI: null,
  isInTowerGame: false,
  towerGameStatus: 'waiting',

  energy: ENERGY_CONSTANTS.MAX_ENERGY,
  maxEnergy: ENERGY_CONSTANTS.MAX_ENERGY,
  energyRegenTime: 0,
  lastEnergyUpdate: Date.now(),

  floorAttempts: {},
  floorVictories: {},
  totalGamesPlayed: 0,
  totalVictories: 0,

  unclaimedRewards: [],
  totalRP: 0,
  totalCoins: 0,

  dailyChallenge: null,
  weeklyBonus: null,
  specialEvents: [],
};

// === 현재 활성 AI 엔진 ===
let currentAIEngine: TowerAIEngine | null = null;

/**
 * 타워 게임 전용 Zustand 스토어
 */
export const useTowerStore = create<TowerStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // === 층 도전 관리 ===
        startFloorChallenge: async (floor: number) => {
          const state = get();

          // 에너지 체크
          if (state.energy < ENERGY_CONSTANTS.ENERGY_PER_GAME) {
            return false;
          }

          // 층 유효성 체크
          if (floor < 1 || floor > 300 || floor > state.maxReachedFloor + 1) {
            return false;
          }

          try {
            // AI 엔진 생성
            currentAIEngine = createTowerAI(floor);
            const aiInfo = getTowerAIInfo(floor);

            // 에너지 소모
            get().consumeEnergy();

            // 상태 업데이트
            set({
              currentFloor: floor,
              currentAI: aiInfo,
              isInTowerGame: true,
              towerGameStatus: 'playing',
              floorAttempts: {
                ...state.floorAttempts,
                [floor]: (state.floorAttempts[floor] || 0) + 1
              }
            });

            return true;
          } catch (error) {
            console.error('Failed to start floor challenge:', error);
            return false;
          }
        },

        completeFloorChallenge: (victory: boolean) => {
          const state = get();
          if (!state.isInTowerGame) return;

          const floor = state.currentFloor;
          const rewards = get().calculateFloorReward(floor, victory);

          set({
            isInTowerGame: false,
            towerGameStatus: victory ? 'victory' : 'defeat',
            maxReachedFloor: victory ? Math.max(state.maxReachedFloor, floor + 1) : state.maxReachedFloor,
            floorVictories: {
              ...state.floorVictories,
              [floor]: victory
            },
            totalGamesPlayed: state.totalGamesPlayed + 1,
            totalVictories: state.totalVictories + (victory ? 1 : 0),
            unclaimedRewards: [...state.unclaimedRewards, ...rewards]
          });

          // AI 엔진 정리
          currentAIEngine = null;

          // 일일/주간 도전 업데이트
          get().updateDailyChallenge();
          get().updateWeeklyBonus();
        },

        abandonFloorChallenge: () => {
          set({
            isInTowerGame: false,
            towerGameStatus: 'waiting',
            currentAI: null
          });
          currentAIEngine = null;
        },

        // === AI 관리 ===
        getCurrentAI: () => {
          return currentAIEngine;
        },

        getAIMove: async (board: Board, player: Player) => {
          if (!currentAIEngine) return null;

          try {
            const move = await currentAIEngine.calculateMove(board, player);
            return move ? { row: move.row, col: move.col } : null;
          } catch (error) {
            console.error('AI move calculation failed:', error);
            return null;
          }
        },

        // === 에너지 시스템 ===
        consumeEnergy: (amount = ENERGY_CONSTANTS.ENERGY_PER_GAME) => {
          const state = get();
          if (state.energy < amount) return false;

          set({ energy: state.energy - amount });
          return true;
        },

        regenEnergy: () => {
          const state = get();
          const now = Date.now();
          const timeSinceLastUpdate = Math.floor((now - state.lastEnergyUpdate) / 1000);
          const energyToRegen = Math.floor(timeSinceLastUpdate / ENERGY_CONSTANTS.ENERGY_REGEN_TIME);

          if (energyToRegen > 0 && state.energy < state.maxEnergy) {
            const newEnergy = Math.min(state.maxEnergy, state.energy + energyToRegen);
            const timeUsed = energyToRegen * ENERGY_CONSTANTS.ENERGY_REGEN_TIME;

            set({
              energy: newEnergy,
              lastEnergyUpdate: state.lastEnergyUpdate + (timeUsed * 1000),
              energyRegenTime: newEnergy < state.maxEnergy ?
                ENERGY_CONSTANTS.ENERGY_REGEN_TIME - (timeSinceLastUpdate - timeUsed) : 0
            });
          } else {
            // 시간 업데이트
            const remainingTime = ENERGY_CONSTANTS.ENERGY_REGEN_TIME - (timeSinceLastUpdate % ENERGY_CONSTANTS.ENERGY_REGEN_TIME);
            set({
              energyRegenTime: state.energy < state.maxEnergy ? remainingTime : 0
            });
          }
        },

        buyEnergy: (amount: number) => {
          const state = get();
          const cost = amount * 10; // 에너지 1개당 10코인

          if (state.totalCoins < cost) return false;

          set({
            energy: Math.min(state.maxEnergy, state.energy + amount),
            totalCoins: state.totalCoins - cost
          });
          return true;
        },

        // === 진행 상태 관리 ===
        updateProgress: (floor: number, victory: boolean) => {
          const state = get();
          set({
            maxReachedFloor: victory ? Math.max(state.maxReachedFloor, floor + 1) : state.maxReachedFloor,
            floorVictories: {
              ...state.floorVictories,
              [floor]: victory
            }
          });
        },

        resetProgress: () => {
          set({
            currentFloor: 1,
            maxReachedFloor: 1,
            floorAttempts: {},
            floorVictories: {},
            totalGamesPlayed: 0,
            totalVictories: 0,
            unclaimedRewards: [],
          });
        },

        // === 보상 시스템 ===
        calculateFloorReward: (floor: number, victory: boolean) => {
          return calculateBaseReward(floor, victory);
        },

        claimReward: (reward: FloorReward) => {
          const state = get();

          set({
            unclaimedRewards: state.unclaimedRewards.filter(r => r !== reward),
            totalRP: state.totalRP + (reward.type === 'RP' ? reward.amount : 0),
            totalCoins: state.totalCoins + (reward.type === 'coins' ? reward.amount : 0),
            energy: reward.type === 'energy' ?
              Math.min(state.maxEnergy, state.energy + reward.amount) : state.energy,
          });
        },

        claimAllRewards: () => {
          const state = get();
          let totalRP = 0;
          let totalCoins = 0;
          let totalEnergy = 0;

          state.unclaimedRewards.forEach(reward => {
            if (reward.type === 'RP') totalRP += reward.amount;
            if (reward.type === 'coins') totalCoins += reward.amount;
            if (reward.type === 'energy') totalEnergy += reward.amount;
          });

          set({
            unclaimedRewards: [],
            totalRP: state.totalRP + totalRP,
            totalCoins: state.totalCoins + totalCoins,
            energy: Math.min(state.maxEnergy, state.energy + totalEnergy),
          });
        },

        // === 특별 기능 ===
        skipFloor: (floor: number) => {
          const state = get();
          if (state.energy < ENERGY_CONSTANTS.ENERGY_COST_SKIP) return false;

          set({
            energy: state.energy - ENERGY_CONSTANTS.ENERGY_COST_SKIP,
            maxReachedFloor: Math.max(state.maxReachedFloor, floor + 1),
            floorVictories: {
              ...state.floorVictories,
              [floor]: true
            }
          });
          return true;
        },

        retryFloor: (floor: number) => {
          const state = get();
          if (state.energy < ENERGY_CONSTANTS.ENERGY_COST_RETRY) return false;

          return get().startFloorChallenge(floor);
        },

        // === 통계 및 정보 ===
        getFloorStats: (floor: number) => {
          const state = get();
          const attempts = state.floorAttempts[floor] || 0;
          const victories = state.floorVictories[floor] ? 1 : 0;

          return {
            floor,
            attempts,
            victories,
            bestTime: 0, // TODO: 구현 필요
            winRate: attempts > 0 ? victories / attempts : 0,
            averageMovesWhenWon: 0, // TODO: 구현 필요
            lastPlayed: null, // TODO: 구현 필요
          };
        },

        getTowerOverview: () => {
          const state = get();
          const clearedFloors = Object.values(state.floorVictories).filter(Boolean).length;

          return {
            currentFloor: state.currentFloor,
            maxReached: state.maxReachedFloor,
            totalFloorsCleared: clearedFloors,
            totalAttempts: state.totalGamesPlayed,
            overallWinRate: state.totalGamesPlayed > 0 ? state.totalVictories / state.totalGamesPlayed : 0,
            totalPlayTime: 0, // TODO: 구현 필요
            ranking: null, // TODO: 구현 필요
          };
        },

        // === 일일/주간 시스템 ===
        updateDailyChallenge: () => {
          const state = get();
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // 새로운 일일 도전 생성 (매일 자정 갱신)
          if (!state.dailyChallenge || state.dailyChallenge.expiresAt < today) {
            const targetFloor = Math.min(state.maxReachedFloor + Math.floor(Math.random() * 5), 300);
            const newChallenge: DailyChallenge = {
              id: `daily_${today.getTime()}`,
              title: '일일 도전',
              description: `${targetFloor}층에 도전하여 승리하세요!`,
              targetFloor,
              reward: {
                floor: targetFloor,
                type: 'RP',
                amount: targetFloor * 2,
                name: '일일 도전 보상',
                description: '일일 도전 완료 보상',
                rarity: 'rare'
              },
              progress: 0,
              maxProgress: 1,
              completed: false,
              expiresAt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            };

            set({ dailyChallenge: newChallenge });
          }
        },

        claimDailyReward: () => {
          const state = get();
          if (state.dailyChallenge && state.dailyChallenge.completed) {
            get().claimReward(state.dailyChallenge.reward);
            set({
              dailyChallenge: {
                ...state.dailyChallenge,
                completed: false,
                progress: 0
              }
            });
          }
        },

        updateWeeklyBonus: () => {
          const state = get();
          const now = new Date();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);

          if (!state.weeklyBonus || state.weeklyBonus.expiresAt < startOfWeek) {
            const newWeeklyBonus: WeeklyBonus = {
              multiplier: 1.5,
              floorsCleared: 0,
              bonusThreshold: 10,
              claimed: false,
              expiresAt: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
            };

            set({ weeklyBonus: newWeeklyBonus });
          }

          // 이번 주 클리어한 층 수 계산
          const clearedThisWeek = Object.keys(state.floorVictories)
            .filter(floor => state.floorVictories[parseInt(floor)])
            .length;

          if (state.weeklyBonus) {
            set({
              weeklyBonus: {
                ...state.weeklyBonus,
                floorsCleared: clearedThisWeek
              }
            });
          }
        },

        claimWeeklyBonus: () => {
          const state = get();
          if (state.weeklyBonus &&
              state.weeklyBonus.floorsCleared >= state.weeklyBonus.bonusThreshold &&
              !state.weeklyBonus.claimed) {

            const bonusRP = state.weeklyBonus.floorsCleared * 50;
            const bonusReward: FloorReward = {
              floor: 0,
              type: 'RP',
              amount: bonusRP,
              name: '주간 보너스',
              description: `${state.weeklyBonus.floorsCleared}층 클리어 주간 보너스`,
              rarity: 'epic'
            };

            get().claimReward(bonusReward);
            set({
              weeklyBonus: {
                ...state.weeklyBonus,
                claimed: true
              }
            });
          }
        },
      }),
      {
        name: 'infinity-othello-tower-store',
        partialize: (state) => ({
          // 게임 상태는 제외하고 진행도만 저장
          maxReachedFloor: state.maxReachedFloor,
          floorAttempts: state.floorAttempts,
          floorVictories: state.floorVictories,
          totalGamesPlayed: state.totalGamesPlayed,
          totalVictories: state.totalVictories,
          totalRP: state.totalRP,
          totalCoins: state.totalCoins,
          energy: state.energy,
          lastEnergyUpdate: state.lastEnergyUpdate,
        }),
      }
    ),
    {
      name: 'TowerStore',
    }
  )
);

// === 편의성 훅들 ===
export const useTowerProgress = () => useTowerStore((state) => ({
  currentFloor: state.currentFloor,
  maxReachedFloor: state.maxReachedFloor,
  totalVictories: state.totalVictories,
}));

export const useTowerEnergy = () => useTowerStore((state) => ({
  energy: state.energy,
  maxEnergy: state.maxEnergy,
  energyRegenTime: state.energyRegenTime,
}));

export const useTowerRewards = () => useTowerStore((state) => ({
  unclaimedRewards: state.unclaimedRewards,
  totalRP: state.totalRP,
  totalCoins: state.totalCoins,
}));

export const useTowerActions = () => useTowerStore((state) => ({
  startFloorChallenge: state.startFloorChallenge,
  completeFloorChallenge: state.completeFloorChallenge,
  getAIMove: state.getAIMove,
  claimReward: state.claimReward,
  claimAllRewards: state.claimAllRewards,
  regenEnergy: state.regenEnergy,
}));

export const useCurrentTowerGame = () => useTowerStore((state) => ({
  isInGame: state.isInTowerGame,
  status: state.towerGameStatus,
  currentAI: state.currentAI,
  floor: state.currentFloor,
}));

export const useTowerStats = () => useTowerStore((state) => ({
  totalGamesPlayed: state.totalGamesPlayed,
  totalVictories: state.totalVictories,
  winRate: state.totalGamesPlayed > 0 ? state.totalVictories / state.totalGamesPlayed : 0,
  maxReachedFloor: state.maxReachedFloor,
  getFloorStats: state.getFloorStats,
  getTowerOverview: state.getTowerOverview,
}));

export const useTowerChallenges = () => useTowerStore((state) => ({
  dailyChallenge: state.dailyChallenge,
  weeklyBonus: state.weeklyBonus,
  specialEvents: state.specialEvents,
  updateDailyChallenge: state.updateDailyChallenge,
  claimDailyReward: state.claimDailyReward,
  updateWeeklyBonus: state.updateWeeklyBonus,
  claimWeeklyBonus: state.claimWeeklyBonus,
}));

/**
 * 타워 게임 전체 상태를 관리하는 종합 훅
 * 게임 컴포넌트에서 사용하기 좋음
 */
export const useTowerGameManager = () => {
  const store = useTowerStore();

  return {
    // 기본 정보
    currentFloor: store.currentFloor,
    maxReachedFloor: store.maxReachedFloor,
    isInGame: store.isInTowerGame,
    gameStatus: store.towerGameStatus,
    currentAI: store.currentAI,

    // 에너지 시스템
    energy: store.energy,
    maxEnergy: store.maxEnergy,
    energyRegenTime: store.energyRegenTime,
    canPlay: store.energy >= 1,

    // 보상 시스템
    unclaimedRewards: store.unclaimedRewards,
    totalRP: store.totalRP,
    totalCoins: store.totalCoins,
    hasUnclaimedRewards: store.unclaimedRewards.length > 0,

    // 액션들
    startChallenge: store.startFloorChallenge,
    completeChallenge: store.completeFloorChallenge,
    abandonChallenge: store.abandonFloorChallenge,
    getAIMove: store.getAIMove,
    claimReward: store.claimReward,
    claimAllRewards: store.claimAllRewards,
    regenEnergy: store.regenEnergy,

    // 통계
    winRate: store.totalGamesPlayed > 0 ? store.totalVictories / store.totalGamesPlayed : 0,
    totalGames: store.totalGamesPlayed,
    totalWins: store.totalVictories,

    // 도전 상태 차크
    canChallengeFloor: (floor: number) => {
      return floor >= 1 && floor <= 300 &&
             floor <= store.maxReachedFloor + 1 &&
             store.energy >= 1;
    },

    // AI 정보 가져오기
    getAIInfo: (floor: number) => getTowerAIInfo(floor),
  };
};