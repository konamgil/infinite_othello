/**
 * 게임 액션 통합 훅
 * 상태 중복을 방지하고 일관된 게임 액션 인터페이스 제공
 */

import { useOthelloStore } from '../othelloStore';
import { useGameStore } from '../gameStore';
import type { Position, Player, GameResult } from 'shared-types';

export interface GameActions {
  // 게임 기본 액션
  makeMove: (position: Position) => Promise<boolean>;
  resetGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;

  // AI 관련 액션 (상태 통합)
  setAIThinking: (thinking: boolean) => void;
  requestAIMove: (player: Player) => Promise<Position | null>;

  // 게임 상태 조회
  getGameState: () => {
    board: any;
    currentPlayer: Player;
    isAIThinking: boolean;
    validMoves: Position[];
    gameStatus: string;
  };
}

/**
 * 통합된 게임 액션 훅
 * 로컬 상태와 글로벌 상태 간 중복을 제거하고 단일 인터페이스 제공
 */
export function useGameActions(): GameActions {
  const {
    board,
    currentPlayer,
    validMoves,
    gameStatus,
    aiThinking,
    makeMove: othelloMakeMove,
    resetGame: othelloResetGame,
    pauseGame: othelloPauseGame,
    resumeGame: othelloResumeGame,
    setAIThinking,
  } = useOthelloStore();

  const { updateUISettings } = useGameStore();

  // 통합된 makeMove 액션 - 상태 동기화 보장
  const makeMove = async (position: Position): Promise<boolean> => {
    if (aiThinking) return false;

    const success = othelloMakeMove(position.row, position.col);

    if (success) {
      // UI 피드백 업데이트
      updateUISettings({ lastMove: position });
    }

    return success;
  };

  // AI 이동 요청 - 중복 상태 제거
  const requestAIMove = async (player: Player): Promise<Position | null> => {
    if (aiThinking) return null;

    setAIThinking(true);

    try {
      // AI 엔진 호출 로직
      // TODO: Engine Registry 패턴 적용
      const move = null; // AI 로직 구현 필요
      return move;
    } finally {
      setAIThinking(false);
    }
  };

  // 통합된 게임 상태 조회
  const getGameState = () => ({
    board,
    currentPlayer,
    isAIThinking: aiThinking,
    validMoves,
    gameStatus,
  });

  return {
    makeMove,
    resetGame: othelloResetGame,
    pauseGame: othelloPauseGame,
    resumeGame: othelloResumeGame,
    setAIThinking,
    requestAIMove,
    getGameState,
  };
}