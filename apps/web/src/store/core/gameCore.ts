/**
 * 🎮 Game Core Store - 순수 게임 로직 전용 스토어
 *
 * 책임 범위:
 * - 보드 상태 관리
 * - 플레이어 턴 관리
 * - 유효한 수 계산
 * - 점수 계산
 * - 이동 히스토리
 *
 * 책임 밖:
 * - UI 상태 (GameUI 스토어)
 * - AI 상태 (GameSession 스토어)
 * - 사용자 데이터 (PlayerProfile 스토어)
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import {
  type GameCore,
  type Player,
  type Position,
  type Move,
  type MoveResult,
  type Board,
  type Cell,
  type Score,
  type GameStatus,
  getOpponent,
  isValidPosition,
  GAME_CONSTANTS
} from 'shared-types';
import { OthelloEngine } from '../../engine/OthelloEngine';

// ===== Game Core State Interface =====

interface GameCoreState extends GameCore {
  // 내부 상태
  readonly redoStack: readonly Move[];

  // 계산된 속성들
  readonly isGameFinished: boolean;
  readonly winner: Player | 'draw' | null;
  readonly canPass: boolean;
}

// ===== Game Core Actions =====

interface GameCoreActions {
  // 게임 라이프사이클
  newGame: () => void;
  resetGame: () => void;

  // 게임 플레이
  makeMove: (position: Position) => MoveResult;
  undoMove: () => boolean;
  redoMove: () => boolean;
  passMove: () => boolean;

  // 게임 제어
  pauseGame: () => void;
  resumeGame: () => void;
  finishGame: () => void;

  // 상태 조회 (최적화된)
  getValidMovesFor: (player: Player) => readonly Position[];
  getCellOwner: (position: Position) => Cell;
  isValidMove: (position: Position) => boolean;

  // 디버그/개발 전용
  setBoardState: (board: Board) => void; // 테스트용
}

type GameCoreStore = GameCoreState & GameCoreActions;

// ===== Initial State Factory =====

const createInitialGameCore = (id: string = crypto.randomUUID()): GameCoreState => {
  const engine = new OthelloEngine();
  const board = engine.createInitialBoard();
  const validMoves = engine.getValidMoves(board, 'black');

  return {
    id,
    board,
    currentPlayer: 'black',
    validMoves,
    score: engine.calculateScore(board),
    status: 'waiting' as GameStatus,
    moveHistory: [],
    canUndo: false,
    canRedo: false,
    redoStack: [],
    isGameFinished: false,
    winner: null,
    canPass: false
  };
};

// ===== Core Game Engine Integration =====

const engine = new OthelloEngine();

// ===== Store Implementation =====

export const useGameCoreStore = create<GameCoreStore>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
        // === Initial State ===
        ...createInitialGameCore(),

        // === Game Lifecycle Actions ===

        newGame: () => {
          const newGameCore = createInitialGameCore();
          set(
            { ...newGameCore, status: 'playing' },
            false,
            'newGame'
          );
        },

        resetGame: () => {
          const current = get();
          const resetGameCore = createInitialGameCore(current.id);
          set(
            { ...resetGameCore },
            false,
            'resetGame'
          );
        },

        // === Core Game Actions ===

        makeMove: (position: Position): MoveResult => {
          const state = get();

          // 유효성 검사
          if (state.status !== 'playing') {
            return {
              success: false,
              reason: state.status === 'finished' ? 'game_finished' : 'game_paused',
              message: `Cannot move when game is ${state.status}`
            };
          }

          if (!isValidPosition(position)) {
            return {
              success: false,
              reason: 'invalid_position',
              message: `Position (${position.row}, ${position.col}) is out of bounds`
            };
          }

          if (state.board[position.row][position.col] !== null) {
            return {
              success: false,
              reason: 'occupied',
              message: `Position (${position.row}, ${position.col}) is already occupied`
            };
          }

          // 이동 실행 시도
          const moveResult = engine.makeMove(
            state.board,
            position,
            state.currentPlayer
          );

          if (!moveResult.success) {
            return {
              success: false,
              reason: 'no_captures',
              message: 'This move would not capture any opponent pieces'
            };
          }

          // 성공적인 이동 - 상태 업데이트
          const move: Move = {
            ...position,
            player: state.currentPlayer,
            capturedCells: moveResult.capturedCells,
            timestamp: Date.now()
          };

          const newBoard = moveResult.newBoard;
          const nextPlayer = getOpponent(state.currentPlayer);
          const validMoves = engine.getValidMoves(newBoard, nextPlayer);
          const score = engine.calculateScore(newBoard);
          const isGameFinished = engine.isGameFinished(newBoard, validMoves);
          const winner = isGameFinished ? engine.getWinner(score) : null;

          const newGameCore: GameCoreState = {
            ...state,
            board: newBoard,
            currentPlayer: nextPlayer,
            validMoves,
            score,
            moveHistory: [...state.moveHistory, move],
            canUndo: true,
            canRedo: false,
            redoStack: [],
            isGameFinished,
            status: isGameFinished ? 'finished' : 'playing',
            winner,
            canPass: validMoves.length === 0
          };

          set(newGameCore, false, 'makeMove');

          return {
            success: true,
            move,
            newGameCore,
            capturedCells: moveResult.capturedCells
          };
        },

        undoMove: (): boolean => {
          const state = get();

          if (!state.canUndo || state.moveHistory.length === 0) {
            return false;
          }

          const previousMoves = state.moveHistory.slice(0, -1);
          const lastMove = state.moveHistory[state.moveHistory.length - 1];

          // 보드를 처음부터 재구성
          const newBoard = engine.createInitialBoard();
          let currentPlayer: Player = 'black';

          for (const move of previousMoves) {
            engine.makeMove(newBoard, move, move.player);
            currentPlayer = getOpponent(move.player);
          }

          const validMoves = engine.getValidMoves(newBoard, currentPlayer);
          const score = engine.calculateScore(newBoard);

          set({
            board: newBoard,
            currentPlayer,
            validMoves,
            score,
            moveHistory: previousMoves,
            canUndo: previousMoves.length > 0,
            canRedo: true,
            redoStack: [...state.redoStack, lastMove],
            isGameFinished: false,
            status: 'playing',
            winner: null,
            canPass: validMoves.length === 0
          }, false, 'undoMove');

          return true;
        },

        redoMove: (): boolean => {
          const state = get();

          if (!state.canRedo || state.redoStack.length === 0) {
            return false;
          }

          const moveToRedo = state.redoStack[state.redoStack.length - 1];
          const newRedoStack = state.redoStack.slice(0, -1);

          // makeMove를 통해 재실행
          const result = get().makeMove(moveToRedo);

          if (result.success) {
            // redoStack 상태 복원
            set({
              redoStack: newRedoStack,
              canRedo: newRedoStack.length > 0
            }, false, 'redoMove');
            return true;
          }

          return false;
        },

        passMove: (): boolean => {
          const state = get();

          if (!state.canPass || state.validMoves.length > 0) {
            return false;
          }

          const nextPlayer = getOpponent(state.currentPlayer);
          const validMoves = engine.getValidMoves(state.board, nextPlayer);
          const isGameFinished = validMoves.length === 0;
          const winner = isGameFinished ? engine.getWinner(state.score) : null;

          set({
            currentPlayer: nextPlayer,
            validMoves,
            isGameFinished,
            status: isGameFinished ? 'finished' : 'playing',
            winner,
            canPass: validMoves.length === 0
          }, false, 'passMove');

          return true;
        },

        // === Game Control Actions ===

        pauseGame: () => {
          const state = get();
          if (state.status === 'playing') {
            set({ status: 'paused' }, false, 'pauseGame');
          }
        },

        resumeGame: () => {
          const state = get();
          if (state.status === 'paused') {
            set({ status: 'playing' }, false, 'resumeGame');
          }
        },

        finishGame: () => {
          const state = get();
          if (state.status !== 'finished') {
            const winner = engine.getWinner(state.score);
            set({
              status: 'finished',
              winner,
              isGameFinished: true
            }, false, 'finishGame');
          }
        },

        // === Query Actions (Optimized) ===

        getValidMovesFor: (player: Player): readonly Position[] => {
          const state = get();
          return engine.getValidMoves(state.board, player);
        },

        getCellOwner: (position: Position): Cell => {
          const state = get();
          if (!isValidPosition(position)) return null;
          return state.board[position.row][position.col];
        },

        isValidMove: (position: Position): boolean => {
          const state = get();
          return state.validMoves.some(
            move => move.row === position.row && move.col === position.col
          );
        },

        // === Debug/Development Actions ===

        setBoardState: (board: Board) => {
          const currentPlayer = get().currentPlayer;
          const validMoves = engine.getValidMoves(board, currentPlayer);
          const score = engine.calculateScore(board);

          set({
            board: [...board.map(row => [...row])], // deep copy
            validMoves,
            score
          }, false, 'setBoardState');
        }
      }),
      {
        name: 'game-core-store'
      }
    )
  )
);

// ===== Selector Hooks (Performance Optimized) =====

export const useGameBoard = () =>
  useGameCoreStore(state => state.board);

export const useCurrentPlayer = () =>
  useGameCoreStore(state => state.currentPlayer);

export const useGameScore = () =>
  useGameCoreStore(state => state.score);

export const useValidMoves = () =>
  useGameCoreStore(state => state.validMoves);

export const useGameStatus = () =>
  useGameCoreStore(state => state.status);

export const useGameWinner = () =>
  useGameCoreStore(state => state.winner);

export const useCanUndo = () =>
  useGameCoreStore(state => state.canUndo);

export const useCanRedo = () =>
  useGameCoreStore(state => state.canRedo);

export const useMoveHistory = () =>
  useGameCoreStore(state => state.moveHistory);

// ===== Performance Tracking =====

if (process.env.NODE_ENV === 'development') {
  useGameCoreStore.subscribe(
    (state) => state.moveHistory.length,
    (moveCount) => {
      console.log(`[GameCore] Move count: ${moveCount}`);
    }
  );
}