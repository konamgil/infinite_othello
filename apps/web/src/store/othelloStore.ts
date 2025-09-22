import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  createInitialBoard,
  getValidMoves,
  makeMove as makeOthelloMove,
  calculateScore as calcScore,
  isGameFinished as checkGameFinished,
  getWinner as determineWinner,
  shouldPass,
  type ValidMove,
  type Board,
  type Player
} from '../utils/othelloLogic';

/**
 * @interface OthelloState
 * 핵심 오델로 게임 상태의 형태를 정의합니다.
 */
export interface OthelloState {
  /** @property {Board} board - 게임 보드를 나타내는 2차원 배열. */
  board: Board;
  /** @property {number} boardSize - 보드의 크기 (예: 표준 8x8 보드의 경우 8). */
  boardSize: number;

  /** @property {'waiting' | 'playing' | 'paused' | 'finished'} gameStatus - 현재 게임의 상태. */
  gameStatus: 'waiting' | 'playing' | 'paused' | 'finished';
  /** @property {Player} currentPlayer - 현재 턴인 플레이어. */
  currentPlayer: Player;
  /** @property {ValidMove[]} validMoves - 현재 플레이어가 둘 수 있는 유효한 수의 배열. */
  validMoves: ValidMove[];
  /** @property {boolean} mustPass - 현재 플레이어가 패스해야 하는지 여부. */
  mustPass: boolean;

  /** @property {Array} history - 현재 게임에서 이루어진 모든 수의 기록. */
  history: Array<{
    board: Board;
    player: Player;
    move: { row: number; col: number };
    flippedCount: number;
    timestamp: number;
  }>;

  /** @property {{ black: number; white: number }} score - 현재 게임의 점수. */
  score: {
    black: number;
    white: number;
  };

  /** @property {'single' | 'local' | 'online' | 'ai'} gameMode - 현재 게임 모드 관련 설정. */
  gameMode: 'single' | 'local' | 'online' | 'ai';
  /** @property {'easy' | 'medium' | 'hard' | 'expert'} difficulty - AI 상대의 난이도. */
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  /** @property {number | null} timeLimit - 게임의 시간 제한 (초). null이면 무제한. */
  timeLimit: number | null;

  /** @property {boolean} aiThinking - AI가 현재 수를 계산 중인지 여부를 나타내는 플래그. */
  aiThinking: boolean;
  /** @property {number} aiMoveDelay - AI의 생각하는 시간을 시뮬레이션하기 위한 딜레이 (밀리초). */
  aiMoveDelay: number;

  /** @property {object} stats - 현재 게임에 대한 통계. */
  stats: {
    totalMoves: number;
    captures: {
      black: number;
      white: number;
    };
    gameStartTime: number | null;
    gameEndTime: number | null;
  };
}

/**
 * @interface OthelloActions
 * 오델로 게임 상태에 대해 수행할 수 있는 액션들을 정의합니다.
 */
export interface OthelloActions {
  /** 주어진 크기로 새 게임을 초기화합니다. */
  initializeGame: (size?: number) => void;
  /** 게임을 초기 상태로 리셋합니다. */
  resetGame: () => void;

  /** 현재 플레이어를 위해 보드에 수를 두려고 시도합니다. */
  makeMove: (row: number, col: number) => boolean;
  /** 마지막으로 둔 수를 무릅니다. */
  undoMove: () => boolean;

  /** 게임을 일시정지합니다. */
  pauseGame: () => void;
  /** 일시정지된 게임을 재개합니다. */
  resumeGame: () => void;
  /** 게임 상태를 'finished'로 설정합니다. */
  finishGame: () => void;

  /** 주어진 플레이어에 대한 유효한 수의 목록을 계산하고 업데이트합니다. */
  calculateValidMoves: (player: Player) => ValidMove[];
  /** 현재 플레이어가 패스합니다. */
  passMove: () => void;

  /** AI의 생각 중 상태를 설정합니다. */
  setAIThinking: (thinking: boolean) => void;
  /** AI가 다음 수를 계산하고 두도록 트리거합니다. */
  makeAIMove: () => Promise<void>;

  /** 다양한 게임 설정을 업데이트합니다. */
  updateGameSettings: (settings: Partial<Pick<OthelloState, 'gameMode' | 'difficulty' | 'timeLimit' | 'aiMoveDelay'>>) => void;

  /** 현재 점수를 계산하고 업데이트합니다. */
  calculateScore: () => { black: number; white: number };
  /** 게임이 끝났는지 확인합니다. */
  isGameFinished: () => boolean;
  /** 게임이 끝났을 경우 승자를 결정합니다. */
  getWinner: () => 'black' | 'white' | 'tie' | null;
}

export type OthelloStore = OthelloState & OthelloActions;

/**
 * 주어진 크기의 새 오델로 보드를 표준 초기 설정으로 생성합니다.
 * @param {number} [size=8] - 보드의 크기 (예: 8x8 보드의 경우 8).
 * @returns {Array<Array<'black' | 'white' | null>>} 새 보드를 나타내는 2차원 배열.
 */
// createEmptyBoard 함수는 이제 othelloLogic.ts의 createInitialBoard를 사용

// 초기 상태
const initialState: OthelloState = {
  board: createInitialBoard(),
  boardSize: 8,
  gameStatus: 'waiting',
  currentPlayer: 'black',
  validMoves: [],
  mustPass: false,
  history: [],
  score: { black: 2, white: 2 },
  gameMode: 'single',
  difficulty: 'medium',
  timeLimit: null,
  aiThinking: false,
  aiMoveDelay: 1000,
  stats: {
    totalMoves: 0,
    captures: { black: 0, white: 0 },
    gameStartTime: null,
    gameEndTime: null,
  },
};

/**
 * 핵심 오델로 게임 로직과 상태를 관리하는 Zustand 스토어입니다.
 *
 * 이 스토어는 게임 보드, 플레이어 턴, 수 기록 및 오델로 게임을 플레이하는 데
 * 필요한 모든 액션을 포함합니다.
 */
export const useOthelloStore = create<OthelloStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 게임 초기화
      initializeGame: (size = 8) => {
        const board = createInitialBoard();
        const validMoves = getValidMoves(board, 'black');

        set(
          {
            board,
            boardSize: size,
            gameStatus: 'playing',
            currentPlayer: 'black',
            validMoves,
            mustPass: validMoves.length === 0,
            history: [],
            score: { black: 2, white: 2 },
            aiThinking: false,
            stats: {
              totalMoves: 0,
              captures: { black: 0, white: 0 },
              gameStartTime: Date.now(),
              gameEndTime: null,
            },
          },
          false,
          'initializeGame'
        );
      },

      resetGame: () => {
        get().initializeGame(get().boardSize);
      },

      // 게임 진행
      makeMove: (row, col) => {
        const state = get();

        if (state.gameStatus !== 'playing') return false;
        if (state.aiThinking) return false;

        // 유효한 이동인지 확인
        const validMove = state.validMoves.find(move => move.row === row && move.col === col);
        if (!validMove) return false;

        // 실제 오델로 로직으로 돌 놓기
        const newBoard = makeOthelloMove(state.board, row, col, state.currentPlayer);
        if (!newBoard) return false;

        // 히스토리 추가
        const newHistory = [
          ...state.history,
          {
            board: state.board,
            player: state.currentPlayer,
            move: { row, col },
            flippedCount: validMove.flipsCount,
            timestamp: Date.now(),
          }
        ];

        // 점수 계산
        const newScore = calcScore(newBoard);

        // 다음 플레이어로 전환
        const nextPlayer = state.currentPlayer === 'black' ? 'white' : 'black';
        const nextValidMoves = getValidMoves(newBoard, nextPlayer);
        const nextMustPass = nextValidMoves.length === 0;

        set(
          {
            board: newBoard,
            currentPlayer: nextPlayer,
            validMoves: nextValidMoves,
            mustPass: nextMustPass,
            history: newHistory,
            score: newScore,
            stats: {
              ...state.stats,
              totalMoves: state.stats.totalMoves + 1,
              captures: {
                black: newScore.black - 2, // 초기 2개 제외
                white: newScore.white - 2,
              },
            },
          },
          false,
          'makeMove'
        );

        // 게임 종료 체크
        if (checkGameFinished(newBoard)) {
          get().finishGame();
        } else if (nextMustPass) {
          // 상대가 패스해야 하는 경우, 다시 현재 플레이어 턴
          const currentPlayerMoves = getValidMoves(newBoard, state.currentPlayer);
          if (currentPlayerMoves.length === 0) {
            // 양쪽 모두 패스 -> 게임 종료
            get().finishGame();
          } else {
            // 상대 패스, 현재 플레이어 다시 턴
            set({
              currentPlayer: state.currentPlayer,
              validMoves: currentPlayerMoves,
              mustPass: false,
            });
          }
        }

        return true;
      },

      undoMove: () => {
        const state = get();
        if (state.history.length === 0) return false;

        const lastMove = state.history[state.history.length - 1];
        const newHistory = state.history.slice(0, -1);

        set(
          {
            board: lastMove.board,
            currentPlayer: lastMove.player,
            history: newHistory,
            stats: {
              ...state.stats,
              totalMoves: Math.max(0, state.stats.totalMoves - 1),
            },
          },
          false,
          'undoMove'
        );

        get().calculateScore();
        get().calculateValidMoves(lastMove.player);

        return true;
      },

      // 게임 상태 제어
      pauseGame: () => set({ gameStatus: 'paused' }, false, 'pauseGame'),
      resumeGame: () => set({ gameStatus: 'playing' }, false, 'resumeGame'),

      finishGame: () => set(
        (state) => ({
          gameStatus: 'finished',
          stats: {
            ...state.stats,
            gameEndTime: Date.now(),
          },
        }),
        false,
        'finishGame'
      ),

      // 유효한 이동 계산
      calculateValidMoves: (player) => {
        const state = get();
        const validMoves = getValidMoves(state.board, player);
        const mustPass = validMoves.length === 0;

        set({ validMoves, mustPass }, false, 'calculateValidMoves');
        return validMoves;
      },

      // 패스 처리
      passMove: () => {
        const state = get();
        if (!state.mustPass) return;

        const nextPlayer = state.currentPlayer === 'black' ? 'white' : 'black';
        const nextValidMoves = getValidMoves(state.board, nextPlayer);

        if (nextValidMoves.length === 0) {
          // 양쪽 모두 패스 -> 게임 종료
          get().finishGame();
        } else {
          // 상대방 턴
          set({
            currentPlayer: nextPlayer,
            validMoves: nextValidMoves,
            mustPass: false,
          });
        }
      },

      // AI 관련
      setAIThinking: (thinking) => set({ aiThinking: thinking }, false, 'setAIThinking'),

      makeAIMove: async () => {
        const state = get();
        if (state.gameStatus !== 'playing' || state.aiThinking) return;

        set({ aiThinking: true }, false, 'makeAIMove');

        // AI 이동 지연 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, state.aiMoveDelay));

        try {
          // 패스해야 하는 경우
          if (state.mustPass) {
            get().passMove();
            return;
          }

          // 간단한 AI 로직 (가장 많이 뒤집는 수 선택)
          const validMoves = state.validMoves;
          if (validMoves.length > 0) {
            // 난이도에 따른 AI 전략
            let selectedMove: ValidMove;

            switch (state.difficulty) {
              case 'easy':
                // 랜덤 이동
                selectedMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                break;
              case 'medium':
                // 가장 많이 뒤집는 수
                selectedMove = validMoves.reduce((best, current) =>
                  current.flipsCount > best.flipsCount ? current : best
                );
                break;
              case 'hard':
              case 'expert':
                // 모서리 우선, 그 다음 많이 뒤집는 수
                const cornerMoves = validMoves.filter(move =>
                  (move.row === 0 || move.row === 7) && (move.col === 0 || move.col === 7)
                );
                if (cornerMoves.length > 0) {
                  selectedMove = cornerMoves[0];
                } else {
                  selectedMove = validMoves.reduce((best, current) =>
                    current.flipsCount > best.flipsCount ? current : best
                  );
                }
                break;
              default:
                selectedMove = validMoves[0];
            }

            get().makeMove(selectedMove.row, selectedMove.col);
          }
        } finally {
          set({ aiThinking: false }, false, 'makeAIMove');
        }
      },

      // 설정 업데이트
      updateGameSettings: (settings) =>
        set(
          (state) => ({ ...state, ...settings }),
          false,
          'updateGameSettings'
        ),

      // 보드 상태 계산
      calculateScore: () => {
        const state = get();
        const score = calcScore(state.board);
        set({ score }, false, 'calculateScore');
        return score;
      },

      isGameFinished: () => {
        const state = get();
        return checkGameFinished(state.board);
      },

      getWinner: () => {
        const state = get();
        if (!checkGameFinished(state.board)) return null;
        return determineWinner(state.board);
      },
    }),
    {
      name: 'infinity-othello-othello-store',
    }
  )
);

/**
 * OthelloStore의 특정 부분에 쉽게 접근하기 위한 편의성 훅입니다.
 */
export const useBoard = () => useOthelloStore((state) => state.board);
export const useGameStatus = () => useOthelloStore((state) => state.gameStatus);
export const useCurrentPlayer = () => useOthelloStore((state) => state.currentPlayer);
export const useValidMoves = () => useOthelloStore((state) => state.validMoves);
export const useScore = () => useOthelloStore((state) => state.score);
export const useGameStats = () => useOthelloStore((state) => state.stats);

/**
 * OthelloStore의 모든 액션 함수에 접근할 수 있는 편의성 훅입니다.
 */
export const useOthelloActions = () => useOthelloStore((state) => ({
  initializeGame: state.initializeGame,
  resetGame: state.resetGame,
  makeMove: state.makeMove,
  passMove: state.passMove,
  undoMove: state.undoMove,
  pauseGame: state.pauseGame,
  resumeGame: state.resumeGame,
  finishGame: state.finishGame,
  calculateValidMoves: state.calculateValidMoves,
  setAIThinking: state.setAIThinking,
  makeAIMove: state.makeAIMove,
  updateGameSettings: state.updateGameSettings,
  calculateScore: state.calculateScore,
  isGameFinished: state.isGameFinished,
  getWinner: state.getWinner,
}));

// 추가 편의 훅들
export const useMustPass = () => useOthelloStore((state) => state.mustPass);
export const useLastMove = () => useOthelloStore((state) =>
  state.history.length > 0 ? state.history[state.history.length - 1] : null
);
export const useCanUndo = () => useOthelloStore((state) => state.history.length > 0);
export const useAIThinking = () => useOthelloStore((state) => state.aiThinking);