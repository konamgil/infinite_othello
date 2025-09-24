/**
 * 🎮 Game Controller - 새로운 아키텍처의 최상위 게임 오케스트레이터
 *
 * 책임:
 * - 게임 생명주기 관리
 * - 상태 동기화 (GameCore ↔ GameSession ↔ GameUI)
 * - AI 이동 처리
 * - 사용자 인터랙션 조정
 *
 * 기존 문제 해결:
 * - Props explosion (14개 → 구조화된 config)
 * - 상태 중복 (AI 상태 통합)
 * - 책임 혼재 (명확한 분리)
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import {
  type GameMode,
  type AIDifficulty,
  type Position,
  type Player,
  type GameResult,
  type MoveResult,
  getOpponent
} from 'shared-types';

import { GameBoard } from './GameBoard';
import { GameStatus } from './GameStatus';
import { GameControls } from './GameControls';

import { useGameCoreStore } from '../../store/core/gameCore';
import { useGameSessionStore } from '../../store/session/gameSession';

// ===== Game Configuration =====

export interface GameConfig {
  /** 게임 모드 */
  mode: GameMode;

  /** AI 설정 (mode가 'ai', 'tower' 등일 때) */
  ai?: {
    difficulty: AIDifficulty;
    engine?: string;
    color: Player; // AI가 어떤 색인지
  };

  /** 시간 제한 (초, undefined면 무제한) */
  timeLimit?: number;

  /** 특별 설정 */
  special?: {
    towerFloor?: number;
    allowUndo?: boolean;
    showValidMoves?: boolean;
  };
}

export interface GameEventHandlers {
  /** 게임 종료 시 호출 */
  onGameEnd?: (result: GameResult) => void;

  /** 게임 상태 변화 시 호출 */
  onStateChange?: (state: GameStateSnapshot) => void;

  /** 이동 완료 시 호출 */
  onMove?: (move: { position: Position; player: Player }) => void;

  /** 에러 발생 시 호출 */
  onError?: (error: GameError) => void;
}

export interface GameStateSnapshot {
  readonly currentPlayer: Player;
  readonly score: { black: number; white: number };
  readonly validMovesCount: number;
  readonly status: string;
  readonly moveCount: number;
  readonly isAIThinking: boolean;
}

export interface GameError {
  readonly type: 'ai_error' | 'move_error' | 'session_error';
  readonly message: string;
  readonly details?: unknown;
}

// ===== Main Component =====

export interface GameControllerProps {
  /** 게임 설정 */
  config: GameConfig;

  /** 이벤트 핸들러 */
  events?: GameEventHandlers;

  /** UI 설정 */
  ui?: {
    className?: string;
    showControls?: boolean;
    disabled?: boolean;
  };
}

/**
 * 게임 컨트롤러 - 모든 게임 로직을 조정하는 최상위 컴포넌트
 */
export function GameController({
  config,
  events = {},
  ui = {}
}: GameControllerProps) {
  // ===== Store State =====

  const {
    // Game Core
    board,
    currentPlayer,
    validMoves,
    score,
    status: gameStatus,
    moveHistory,
    winner,
    canUndo,

    // Game Core Actions
    newGame,
    makeMove,
    undoMove,
    pauseGame,
    resumeGame
  } = useGameCoreStore();

  const {
    // Session State
    isActive,
    aiThinking,
    aiLastMove,
    aiError,
    elapsedTime,

    // Session Actions
    createSession,
    startSession,
    setAIThinking,
    requestAIMove,
    isAITurn,
    endSession
  } = useGameSessionStore();

  // ===== Game Initialization =====

  useEffect(() => {
    // 세션 설정
    const sessionConfig = {
      mode: config.mode,
      difficulty: config.ai?.difficulty || 'medium',
      timeLimit: config.timeLimit,
      players: {
        black: {
          name: config.ai?.color === 'black' ? 'AI' : 'Player',
          type: config.ai?.color === 'black' ? 'ai' as const : 'human' as const,
          difficulty: config.ai?.difficulty
        },
        white: {
          name: config.ai?.color === 'white' ? 'AI' : 'Player',
          type: config.ai?.color === 'white' ? 'ai' as const : 'human' as const,
          difficulty: config.ai?.difficulty
        }
      },
      aiEngine: config.ai?.engine
    };

    createSession(sessionConfig);
    newGame();
    startSession();

    return () => endSession();
  }, [config.mode, config.ai, config.timeLimit]);

  // ===== AI Move Handling =====

  const handleAIMove = useCallback(async () => {
    if (
      gameStatus !== 'playing' ||
      !isAITurn(currentPlayer) ||
      aiThinking ||
      ui.disabled
    ) {
      return;
    }

    try {
      const gameCore = {
        id: crypto.randomUUID(), // TODO: get from store
        board,
        currentPlayer,
        validMoves,
        score,
        status: gameStatus,
        moveHistory,
        canUndo,
        canRedo: false // TODO: get from store
      };

      const aiMove = await requestAIMove(gameCore);

      if (aiMove) {
        // AI 이동 실행
        const moveResult = makeMove(aiMove);

        if (moveResult.success) {
          events.onMove?.({
            position: aiMove,
            player: currentPlayer
          });
        } else {
          events.onError?.({
            type: 'ai_error',
            message: `AI move failed: ${moveResult.reason}`,
            details: moveResult
          });
        }
      }

    } catch (error) {
      events.onError?.({
        type: 'ai_error',
        message: 'AI move request failed',
        details: error
      });
    }
  }, [
    gameStatus,
    currentPlayer,
    isAITurn,
    aiThinking,
    ui.disabled,
    board,
    validMoves,
    score,
    moveHistory,
    canUndo,
    makeMove,
    requestAIMove,
    events.onMove,
    events.onError
  ]);

  // AI 턴일 때 자동 이동
  useEffect(() => {
    if (isAITurn(currentPlayer)) {
      const timeout = setTimeout(() => {
        handleAIMove();
      }, 500); // 0.5초 딜레이로 자연스러움 연출

      return () => clearTimeout(timeout);
    }
  }, [currentPlayer, isAITurn, handleAIMove]);

  // ===== Human Move Handling =====

  const handleCellClick = useCallback((position: Position) => {
    if (
      gameStatus !== 'playing' ||
      isAITurn(currentPlayer) ||
      aiThinking ||
      ui.disabled
    ) {
      return;
    }

    const moveResult = makeMove(position);

    if (moveResult.success) {
      events.onMove?.({
        position,
        player: currentPlayer
      });
    } else {
      events.onError?.({
        type: 'move_error',
        message: `Invalid move: ${moveResult.reason}`,
        details: moveResult
      });
    }
  }, [
    gameStatus,
    currentPlayer,
    isAITurn,
    aiThinking,
    ui.disabled,
    makeMove,
    events.onMove,
    events.onError
  ]);

  // ===== Game State Monitoring =====

  const gameStateSnapshot: GameStateSnapshot = useMemo(() => ({
    currentPlayer,
    score,
    validMovesCount: validMoves.length,
    status: gameStatus,
    moveCount: moveHistory.length,
    isAIThinking: aiThinking
  }), [currentPlayer, score, validMoves.length, gameStatus, moveHistory.length, aiThinking]);

  // 상태 변화 알림
  useEffect(() => {
    events.onStateChange?.(gameStateSnapshot);
  }, [gameStateSnapshot, events.onStateChange]);

  // 게임 종료 처리
  useEffect(() => {
    if (gameStatus === 'finished' && winner !== null) {
      const gameResult: GameResult = {
        winner,
        score,
        endReason: 'normal',
        duration: Math.floor(elapsedTime / 1000),
        totalMoves: moveHistory.length
      };

      events.onGameEnd?.(gameResult);
    }
  }, [gameStatus, winner, score, elapsedTime, moveHistory.length, events.onGameEnd]);

  // ===== Control Actions =====

  const handleNewGame = useCallback(() => {
    newGame();
    startSession();
  }, [newGame, startSession]);

  const handleUndo = useCallback(() => {
    if (config.special?.allowUndo !== false) {
      undoMove();
    }
  }, [config.special?.allowUndo, undoMove]);

  const handlePause = useCallback(() => {
    pauseGame();
  }, [pauseGame]);

  const handleResume = useCallback(() => {
    resumeGame();
  }, [resumeGame]);

  // ===== Error Handling =====

  useEffect(() => {
    if (aiError) {
      events.onError?.({
        type: 'ai_error',
        message: aiError,
        details: { currentPlayer, gameStatus }
      });
    }
  }, [aiError, currentPlayer, gameStatus, events.onError]);

  // ===== Render =====

  return (
    <div className={`game-controller ${ui.className || ''}`}>
      <div className="game-board-container">
        <GameBoard
          board={board}
          validMoves={config.special?.showValidMoves !== false ? validMoves : []}
          lastMove={aiLastMove}
          currentPlayer={currentPlayer}
          disabled={ui.disabled || aiThinking || gameStatus !== 'playing'}
          onCellClick={handleCellClick}
        />
      </div>

      <div className="game-info-container">
        <GameStatus
          score={score}
          currentPlayer={currentPlayer}
          gameStatus={gameStatus}
          winner={winner}
          isAIThinking={aiThinking}
          elapsedTime={elapsedTime}
        />

        {ui.showControls !== false && (
          <GameControls
            canUndo={canUndo && config.special?.allowUndo !== false}
            canPause={gameStatus === 'playing'}
            canResume={gameStatus === 'paused'}
            onNewGame={handleNewGame}
            onUndo={handleUndo}
            onPause={handlePause}
            onResume={handleResume}
            disabled={ui.disabled}
          />
        )}
      </div>

      {/* Debug Information (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="game-debug-info">
          <small>
            Mode: {config.mode} |
            Moves: {moveHistory.length} |
            Valid: {validMoves.length} |
            AI: {aiThinking ? 'thinking' : 'idle'}
            {aiError && ` | Error: ${aiError}`}
          </small>
        </div>
      )}
    </div>
  );
}

// ===== Convenience Wrapper Components =====

/**
 * AI 대전 게임
 */
export const AIGameController = React.forwardRef<
  HTMLDivElement,
  {
    difficulty?: AIDifficulty;
    aiColor?: Player;
    timeLimit?: number;
    events?: GameEventHandlers;
    ui?: GameControllerProps['ui'];
  }
>(({ difficulty = 'medium', aiColor = 'white', timeLimit, events, ui }, ref) => (
  <div ref={ref}>
    <GameController
      config={{
        mode: 'ai',
        ai: { difficulty, color: aiColor },
        timeLimit
      }}
      events={events}
      ui={ui}
    />
  </div>
));

/**
 * 타워 모드 게임
 */
export const TowerGameController = React.forwardRef<
  HTMLDivElement,
  {
    floor: number;
    events?: GameEventHandlers;
    ui?: GameControllerProps['ui'];
  }
>(({ floor, events, ui }, ref) => {
  const difficulty: AIDifficulty = floor < 50 ? 'easy' :
                                  floor < 100 ? 'medium' :
                                  floor < 150 ? 'hard' : 'expert';

  return (
    <div ref={ref}>
      <GameController
        config={{
          mode: 'tower',
          ai: { difficulty, color: 'white' },
          special: { towerFloor: floor }
        }}
        events={events}
        ui={ui}
      />
    </div>
  );
});

/**
 * 연습 모드 게임
 */
export const PracticeGameController = React.forwardRef<
  HTMLDivElement,
  {
    allowUndo?: boolean;
    events?: GameEventHandlers;
    ui?: GameControllerProps['ui'];
  }
>(({ allowUndo = true, events, ui }, ref) => (
  <div ref={ref}>
    <GameController
      config={{
        mode: 'practice',
        special: { allowUndo, showValidMoves: true }
      }}
      events={events}
      ui={ui}
    />
  </div>
));

AIGameController.displayName = 'AIGameController';
TowerGameController.displayName = 'TowerGameController';
PracticeGameController.displayName = 'PracticeGameController';