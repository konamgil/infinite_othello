/**
 * 🎲 Game Session Store - 세션 메타데이터 및 AI 상태 통합
 *
 * 책임 범위:
 * - 게임 모드 및 설정
 * - AI 상태 통합 관리 (중복 제거)
 * - 타이밍 및 세션 정보
 * - 플레이어 정보
 *
 * AI 상태 중복 해결:
 * - 기존: OthelloGame (로컬) + othelloStore (글로벌) 양쪽 AI 상태
 * - 새로운: GameSession에서 AI 상태 단일 관리
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import {
  type GameSession,
  type GameMode,
  type AIDifficulty,
  type PlayerInfo,
  type EngineRequest,
  type EngineResponse,
  type Position,
  type GameCore,
  GAME_CONSTANTS
} from 'shared-types';
import { engineRegistry } from '../../engine/EngineRegistry';

// ===== Extended GameSession State =====

interface GameSessionState extends GameSession {
  // AI 상태 확장
  readonly aiEngine?: string; // 현재 사용 중인 엔진 ID
  readonly aiLastMove?: Position;
  readonly aiAnalysis?: EngineResponse;
  readonly aiError?: string;

  // 세션 진행 상태
  readonly isPaused: boolean;
  readonly isActive: boolean;

  // 타이밍
  readonly elapsedTime: number;
  readonly remainingTime?: number;
}

// ===== GameSession Actions =====

interface GameSessionActions {
  // 세션 라이프사이클
  createSession: (config: SessionConfig) => void;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;

  // AI 상태 관리 (통합)
  setAIThinking: (thinking: boolean) => void;
  setAIEngine: (engineId: string) => void;
  requestAIMove: (gameCore: GameCore) => Promise<Position | null>;
  setAIAnalysis: (analysis: EngineResponse) => void;
  clearAIState: () => void;

  // 설정 변경
  updateDifficulty: (difficulty: AIDifficulty) => void;
  updateTimeLimit: (timeLimit?: number) => void;
  updatePlayerInfo: (color: 'black' | 'white', info: Partial<PlayerInfo>) => void;

  // 타이밍 관리
  updateElapsedTime: (deltaMs: number) => void;
  resetTimer: () => void;

  // 세션 조회
  getSessionInfo: () => Readonly<Pick<GameSessionState, 'mode' | 'difficulty' | 'startTime' | 'elapsedTime'>>;
  isAITurn: (currentPlayer: 'black' | 'white') => boolean;
}

// ===== Session Configuration =====

export interface SessionConfig {
  mode: GameMode;
  difficulty?: AIDifficulty;
  timeLimit?: number;
  players: {
    black: PlayerInfo;
    white: PlayerInfo;
  };
  aiEngine?: string;
}

type GameSessionStore = GameSessionState & GameSessionActions;

// ===== Initial State Factory =====

const createInitialSession = (config?: Partial<SessionConfig>): GameSessionState => ({
  id: crypto.randomUUID(),
  mode: config?.mode || 'practice',
  difficulty: config?.difficulty || 'medium',
  timeLimit: config?.timeLimit,
  startTime: Date.now(),
  endTime: undefined,

  // AI 상태 (통합)
  aiThinking: false,
  aiMoveDelay: GAME_CONSTANTS.DEFAULT_AI_DELAY,
  aiEngine: config?.aiEngine,
  aiLastMove: undefined,
  aiAnalysis: undefined,
  aiError: undefined,

  // 플레이어 정보
  players: config?.players || {
    black: { name: 'Player', type: 'human' },
    white: { name: 'AI', type: 'ai', difficulty: 'medium' }
  },

  // 세션 상태
  isPaused: false,
  isActive: false,
  elapsedTime: 0,
  remainingTime: config?.timeLimit
});

// ===== Store Implementation =====

export const useGameSessionStore = create<GameSessionStore>()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get) => ({
          // === Initial State ===
          ...createInitialSession(),

          // === Session Lifecycle Actions ===

          createSession: (config: SessionConfig) => {
            const newSession = createInitialSession(config);
            set(newSession, false, 'createSession');
          },

          startSession: () => {
            const state = get();
            if (!state.isActive) {
              set({
                isActive: true,
                isPaused: false,
                startTime: Date.now(),
                elapsedTime: 0
              }, false, 'startSession');
            }
          },

          pauseSession: () => {
            const state = get();
            if (state.isActive && !state.isPaused) {
              set({ isPaused: true }, false, 'pauseSession');
            }
          },

          resumeSession: () => {
            const state = get();
            if (state.isActive && state.isPaused) {
              set({ isPaused: false }, false, 'resumeSession');
            }
          },

          endSession: () => {
            const state = get();
            set({
              isActive: false,
              isPaused: false,
              endTime: Date.now(),
              aiThinking: false
            }, false, 'endSession');
          },

          // === AI State Management (통합) ===

          setAIThinking: (thinking: boolean) => {
            set(
              { aiThinking: thinking, aiError: thinking ? undefined : get().aiError },
              false,
              'setAIThinking'
            );
          },

          setAIEngine: (engineId: string) => {
            if (engineRegistry.has(engineId)) {
              set({ aiEngine: engineId }, false, 'setAIEngine');
            } else {
              console.warn(`[GameSession] Engine not found: ${engineId}`);
            }
          },

          requestAIMove: async (gameCore: GameCore): Promise<Position | null> => {
            const state = get();

            // 이미 AI가 생각 중이면 무시
            if (state.aiThinking) {
              return null;
            }

            // AI 엔진 선택
            let engineId = state.aiEngine;
            if (!engineId || !engineRegistry.has(engineId)) {
              const engine = engineRegistry.getBestForDifficulty(state.difficulty || 'medium');
              if (!engine) {
                set({ aiError: 'No AI engine available' }, false, 'requestAIMove:error');
                return null;
              }
              engineId = engine.name;
            }

            // AI 생각 시작
            set({ aiThinking: true, aiError: undefined }, false, 'requestAIMove:start');

            try {
              // AI 분석 요청
              const request: EngineRequest = {
                gameCore,
                timeLimit: 5000, // 5초 제한
                skill: getDifficultySkill(state.difficulty)
              };

              // AI 딜레이 시뮬레이션
              const [analysis] = await Promise.all([
                engineRegistry.analyze(engineId, request),
                new Promise(resolve => setTimeout(resolve, state.aiMoveDelay))
              ]);

              // 결과 저장
              set({
                aiThinking: false,
                aiAnalysis: analysis,
                aiLastMove: analysis.bestMove || null
              }, false, 'requestAIMove:success');

              return analysis.bestMove || null;

            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown AI error';

              set({
                aiThinking: false,
                aiError: errorMessage,
                aiAnalysis: undefined
              }, false, 'requestAIMove:error');

              console.error('[GameSession] AI move request failed:', error);
              return null;
            }
          },

          setAIAnalysis: (analysis: EngineResponse) => {
            set({ aiAnalysis: analysis }, false, 'setAIAnalysis');
          },

          clearAIState: () => {
            set({
              aiThinking: false,
              aiLastMove: undefined,
              aiAnalysis: undefined,
              aiError: undefined
            }, false, 'clearAIState');
          },

          // === Configuration Updates ===

          updateDifficulty: (difficulty: AIDifficulty) => {
            set({ difficulty }, false, 'updateDifficulty');

            // 플레이어 정보도 업데이트
            const state = get();
            if (state.players.white.type === 'ai') {
              set({
                players: {
                  ...state.players,
                  white: { ...state.players.white, difficulty }
                }
              }, false, 'updateDifficulty:playerInfo');
            }
          },

          updateTimeLimit: (timeLimit?: number) => {
            set({
              timeLimit,
              remainingTime: timeLimit
            }, false, 'updateTimeLimit');
          },

          updatePlayerInfo: (color: 'black' | 'white', info: Partial<PlayerInfo>) => {
            const state = get();
            set({
              players: {
                ...state.players,
                [color]: { ...state.players[color], ...info }
              }
            }, false, 'updatePlayerInfo');
          },

          // === Timing Management ===

          updateElapsedTime: (deltaMs: number) => {
            const state = get();
            if (state.isActive && !state.isPaused) {
              const newElapsed = state.elapsedTime + deltaMs;
              const newRemaining = state.timeLimit
                ? Math.max(0, state.timeLimit * 1000 - newElapsed)
                : undefined;

              set({
                elapsedTime: newElapsed,
                remainingTime: newRemaining
              }, false, 'updateElapsedTime');

              // 시간 초과 체크
              if (newRemaining === 0) {
                get().endSession();
              }
            }
          },

          resetTimer: () => {
            const state = get();
            set({
              elapsedTime: 0,
              remainingTime: state.timeLimit ? state.timeLimit * 1000 : undefined
            }, false, 'resetTimer');
          },

          // === Query Methods ===

          getSessionInfo: () => {
            const state = get();
            return {
              mode: state.mode,
              difficulty: state.difficulty,
              startTime: state.startTime,
              elapsedTime: state.elapsedTime
            };
          },

          isAITurn: (currentPlayer: 'black' | 'white'): boolean => {
            const state = get();
            return state.players[currentPlayer].type === 'ai';
          }
        }),
        {
          name: 'game-session-store',
          // AI 상태는 persists하지 않음 (세션별 초기화)
          partialize: (state) => ({
            mode: state.mode,
            difficulty: state.difficulty,
            timeLimit: state.timeLimit,
            players: state.players,
            aiEngine: state.aiEngine,
            aiMoveDelay: state.aiMoveDelay
          })
        }
      ),
      {
        name: 'game-session-store'
      }
    )
  )
);

// ===== Selector Hooks (Performance Optimized) =====

export const useGameMode = () =>
  useGameSessionStore(state => state.mode);

export const useAIDifficulty = () =>
  useGameSessionStore(state => state.difficulty);

export const useAIThinking = () =>
  useGameSessionStore(state => state.aiThinking);

export const useAILastMove = () =>
  useGameSessionStore(state => state.aiLastMove);

export const useAIAnalysis = () =>
  useGameSessionStore(state => state.aiAnalysis);

export const useSessionTimer = () =>
  useGameSessionStore(state => ({
    elapsedTime: state.elapsedTime,
    remainingTime: state.remainingTime,
    isActive: state.isActive,
    isPaused: state.isPaused
  }));

export const useCurrentPlayers = () =>
  useGameSessionStore(state => state.players);

// ===== Utility Functions =====

const getDifficultySkill = (difficulty?: AIDifficulty): number => {
  switch (difficulty) {
    case 'easy': return 20;
    case 'medium': return 50;
    case 'hard': return 80;
    case 'expert': return 95;
    case 'master': return 100;
    default: return 50;
  }
};

// ===== Timer Hook =====

/**
 * 게임 세션 타이머 관리 훅
 */
export function useSessionTimer() {
  const { updateElapsedTime, isActive, isPaused } = useGameSessionStore();

  // 타이머 업데이트 (1초마다)
  React.useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      updateElapsedTime(1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused, updateElapsedTime]);
}

// ===== Development Tools =====

if (process.env.NODE_ENV === 'development') {
  // AI 상태 변화 로깅
  useGameSessionStore.subscribe(
    (state) => ({
      aiThinking: state.aiThinking,
      aiEngine: state.aiEngine,
      aiError: state.aiError
    }),
    (aiState) => {
      console.log('[GameSession] AI State:', aiState);
    }
  );
}