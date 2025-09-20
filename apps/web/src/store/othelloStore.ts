import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Defines the shape of the core Othello game state.
 */
export interface OthelloState {
  /** The 2D array representing the game board. */
  board: Array<Array<'black' | 'white' | null>>;
  /** The size of the board (e.g., 8 for a standard 8x8 board). */
  boardSize: number;

  /** The current status of the game. */
  gameStatus: 'waiting' | 'playing' | 'paused' | 'finished';
  /** The player whose turn it is. */
  currentPlayer: 'black' | 'white';
  /** An array of coordinates representing valid moves for the current player. */
  validMoves: Array<{ row: number; col: number }>;

  /** A record of all moves made in the current game. */
  history: Array<{
    board: Array<Array<'black' | 'white' | null>>;
    player: 'black' | 'white';
    move: { row: number; col: number };
    timestamp: number;
  }>;

  /** The current score of the game. */
  score: {
    black: number;
    white: number;
  };

  /** Settings related to the current game mode. */
  gameMode: 'single' | 'local' | 'online' | 'ai';
  /** The difficulty level for an AI opponent. */
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  /** The time limit for the game in seconds (null for no limit). */
  timeLimit: number | null;

  /** A flag indicating if the AI is currently calculating its move. */
  aiThinking: boolean;
  /** A delay in milliseconds to simulate AI thinking time. */
  aiMoveDelay: number;

  /** Statistics for the current game. */
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
 * Defines the actions that can be performed on the Othello game state.
 */
export interface OthelloActions {
  /** Initializes a new game with a given board size. */
  initializeGame: (size?: number) => void;
  /** Resets the game to its initial state. */
  resetGame: () => void;

  /** Attempts to make a move on the board for the current player. */
  makeMove: (row: number, col: number) => boolean;
  /** Reverts the last move made. */
  undoMove: () => boolean;

  /** Pauses the game. */
  pauseGame: () => void;
  /** Resumes a paused game. */
  resumeGame: () => void;
  /** Sets the game status to 'finished'. */
  finishGame: () => void;

  /** Calculates and updates the list of valid moves for a given player. */
  calculateValidMoves: (player: 'black' | 'white') => Array<{ row: number; col: number }>;

  /** Sets the AI's thinking status. */
  setAIThinking: (thinking: boolean) => void;
  /** Triggers the AI to calculate and make its next move. */
  makeAIMove: () => Promise<void>;

  /** Updates various game settings. */
  updateGameSettings: (settings: Partial<Pick<OthelloState, 'gameMode' | 'difficulty' | 'timeLimit' | 'aiMoveDelay'>>) => void;

  /** Calculates and updates the current score. */
  calculateScore: () => { black: number; white: number };
  /** Checks if the game has ended. */
  isGameFinished: () => boolean;
  /** Determines the winner of the game, if it has finished. */
  getWinner: () => 'black' | 'white' | 'tie' | null;
}

export type OthelloStore = OthelloState & OthelloActions;

/**
 * Creates a new Othello board of a given size with the standard initial setup.
 * @param {number} [size=8] - The size of the board (e.g., 8 for an 8x8 board).
 * @returns A 2D array representing the new board.
 */
const createEmptyBoard = (size: number = 8): Array<Array<'black' | 'white' | null>> => {
  const board = Array(size).fill(null).map(() => Array(size).fill(null));

  // 초기 돌 배치 (가운데 4개)
  const center = Math.floor(size / 2);
  board[center - 1][center - 1] = 'white';
  board[center - 1][center] = 'black';
  board[center][center - 1] = 'black';
  board[center][center] = 'white';

  return board;
};

// 초기 상태
const initialState: OthelloState = {
  board: createEmptyBoard(8),
  boardSize: 8,
  gameStatus: 'waiting',
  currentPlayer: 'black',
  validMoves: [],
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
 * The Zustand store for managing the core Othello game logic and state.
 *
 * This store contains the game board, player turn, move history, and all the actions
 * required to play a game of Othello.
 */
export const useOthelloStore = create<OthelloStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 게임 초기화
      initializeGame: (size = 8) => {
        const board = createEmptyBoard(size);
        set(
          {
            board,
            boardSize: size,
            gameStatus: 'playing',
            currentPlayer: 'black',
            validMoves: [],
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

        // 초기 유효 이동 계산
        get().calculateValidMoves('black');
      },

      resetGame: () => {
        get().initializeGame(get().boardSize);
      },

      // 게임 진행
      makeMove: (row, col) => {
        const state = get();

        if (state.gameStatus !== 'playing') return false;
        if (state.board[row][col] !== null) return false;

        // 유효한 이동인지 확인
        const isValidMove = state.validMoves.some(move => move.row === row && move.col === col);
        if (!isValidMove) return false;

        // 이동 실행 로직 (실제 오셀로 규칙 구현 필요)
        const newBoard = state.board.map(row => [...row]);
        newBoard[row][col] = state.currentPlayer;

        // 히스토리 추가
        const newHistory = [
          ...state.history,
          {
            board: state.board.map(row => [...row]),
            player: state.currentPlayer,
            move: { row, col },
            timestamp: Date.now(),
          }
        ];

        // 다음 플레이어로 전환
        const nextPlayer = state.currentPlayer === 'black' ? 'white' : 'black';

        set(
          {
            board: newBoard,
            currentPlayer: nextPlayer,
            history: newHistory,
            stats: {
              ...state.stats,
              totalMoves: state.stats.totalMoves + 1,
            },
          },
          false,
          'makeMove'
        );

        // 점수 계산
        get().calculateScore();

        // 다음 플레이어의 유효 이동 계산
        get().calculateValidMoves(nextPlayer);

        // 게임 종료 체크
        if (get().isGameFinished()) {
          get().finishGame();
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

      // 유효한 이동 계산 (간단한 구현, 실제로는 더 복잡한 로직 필요)
      calculateValidMoves: (player) => {
        const state = get();
        const validMoves: Array<{ row: number; col: number }> = [];

        // TODO: 실제 오셀로 규칙에 따른 유효 이동 계산 로직 구현
        for (let row = 0; row < state.boardSize; row++) {
          for (let col = 0; col < state.boardSize; col++) {
            if (state.board[row][col] === null) {
              // 임시로 모든 빈 칸을 유효한 이동으로 처리
              validMoves.push({ row, col });
            }
          }
        }

        set({ validMoves }, false, 'calculateValidMoves');
        return validMoves;
      },

      // AI 관련
      setAIThinking: (thinking) => set({ aiThinking: thinking }, false, 'setAIThinking'),

      makeAIMove: async () => {
        const state = get();
        if (state.gameStatus !== 'playing' || state.aiThinking) return;

        set({ aiThinking: true }, false, 'makeAIMove');

        // AI 이동 지연 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, state.aiMoveDelay));

        // 간단한 AI 로직 (랜덤 이동)
        const validMoves = state.validMoves;
        if (validMoves.length > 0) {
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          get().makeMove(randomMove.row, randomMove.col);
        }

        set({ aiThinking: false }, false, 'makeAIMove');
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
        let black = 0;
        let white = 0;

        for (let row = 0; row < state.boardSize; row++) {
          for (let col = 0; col < state.boardSize; col++) {
            if (state.board[row][col] === 'black') black++;
            else if (state.board[row][col] === 'white') white++;
          }
        }

        const score = { black, white };
        set({ score }, false, 'calculateScore');
        return score;
      },

      isGameFinished: () => {
        const state = get();

        // 보드가 꽉 찬 경우
        const isBoardFull = state.board.every(row =>
          row.every(cell => cell !== null)
        );

        // 양쪽 플레이어 모두 이동할 수 없는 경우 (간단한 체크)
        const hasValidMoves = state.validMoves.length > 0;

        return isBoardFull || !hasValidMoves;
      },

      getWinner: () => {
        const state = get();
        const score = state.score;

        if (score.black > score.white) return 'black';
        if (score.white > score.black) return 'white';
        return 'tie';
      },
    }),
    {
      name: 'infinity-othello-othello-store',
    }
  )
);

/**
 * Convenience hooks for accessing specific parts of the OthelloStore.
 */
export const useBoard = () => useOthelloStore((state) => state.board);
export const useGameStatus = () => useOthelloStore((state) => state.gameStatus);
export const useCurrentPlayer = () => useOthelloStore((state) => state.currentPlayer);
export const useValidMoves = () => useOthelloStore((state) => state.validMoves);
export const useScore = () => useOthelloStore((state) => state.score);
export const useGameStats = () => useOthelloStore((state) => state.stats);

/**
 * A convenience hook that provides access to all the action functions of the OthelloStore.
 */
export const useOthelloActions = () => useOthelloStore((state) => ({
  initializeGame: state.initializeGame,
  resetGame: state.resetGame,
  makeMove: state.makeMove,
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