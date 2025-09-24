/**
 * 🎮 Othello Game - 새로운 아키텍처로 마이그레이션된 게임 컨테이너
 *
 * 개선사항:
 * - 새로운 타입 시스템 적용 (shared-types)
 * - AI 상태 중복 제거 (GameSession으로 통합)
 * - 타입 안전성 향상
 * - 성능 최적화 (불필요한 변환 제거)
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { GameBoard, type BoardState } from '../../ui/game/GameBoard';
import { useTowerGameManager } from '../../store/towerStore';

// 새로운 타입 시스템 import
import {
  type Position,
  type Player,
  type GameMode,
  type AIDifficulty,
  type GameResult,
  type MoveResult,
  getOpponent
} from 'shared-types';

// 새로운 스토어들
import { useGameCoreStore } from '../../store/core/gameCore';
import { useGameSessionStore } from '../../store/session/gameSession';

// ===== 호환성을 위한 기존 인터페이스 유지 =====

export interface OthelloGameProps {
  mode: 'single' | 'tower' | 'local' | 'ai' | 'battle';
  towerFloor?: number;
  aiEngine?: 'tower' | 'random' | 'minimax';
  onGameEnd?: (result: GameEndResult) => void;
  onStateChange?: (state: GameStateInfo) => void;
  className?: string;
  showControls?: boolean;
  disabled?: boolean;
}

export interface GameEndResult {
  winner: 'black' | 'white' | 'tie';
  score: { black: number; white: number };
  moves: number;
  duration?: number;
}

export interface GameStateInfo {
  currentPlayer: Player;
  score: { black: number; white: number };
  validMovesCount: number;
  gameStatus: 'playing' | 'finished' | 'paused';
  moves: number;
}

// ===== 내부에서 사용할 새로운 타입들 =====

interface LegacyMove {
  x: number; // col
  y: number; // row
}

// 타입 변환 유틸리티
const positionToLegacy = (pos: Position): LegacyMove => ({
  x: pos.col,
  y: pos.row
});

const legacyToPosition = (move: LegacyMove): Position => ({
  row: move.y,
  col: move.x
});

// GameMode 변환
const mapGameMode = (mode: OthelloGameProps['mode']): GameMode => {
  switch (mode) {
    case 'single': return 'practice';
    case 'tower': return 'tower';
    case 'local': return 'local';
    case 'ai': return 'ai';
    case 'battle': return 'battle';
    default: return 'practice';
  }
};

// AI 난이도 매핑
const mapDifficulty = (floor?: number): AIDifficulty => {
  if (!floor) return 'medium';
  if (floor < 50) return 'easy';
  if (floor < 100) return 'medium';
  if (floor < 150) return 'hard';
  return 'expert';
};

/**
 * 🎮 오델로 게임 메인 컨테이너 - 새로운 아키텍처 적용
 *
 * 변경사항:
 * - 기존 인터페이스 100% 호환성 유지
 * - 내부 구현을 새로운 타입 시스템으로 전환
 * - AI 상태 중복 완전 제거
 */
export function OthelloGame({
  mode,
  towerFloor,
  aiEngine = 'tower',
  onGameEnd,
  onStateChange,
  className = '',
  showControls = true,
  disabled = false
}: OthelloGameProps) {
  // ===== 새로운 스토어 사용 =====

  const {
    board: newBoard,
    currentPlayer,
    validMoves: newValidMoves,
    status: gameStatus,
    score,
    makeMove: newMakeMove,
    resetGame: newResetGame,
    newGame: newNewGame
  } = useGameCoreStore();

  const {
    aiThinking, // AI 상태 중복 제거! 이제 여기서만 관리
    requestAIMove,
    createSession,
    startSession,
    isAITurn
  } = useGameSessionStore();

  const towerManager = useTowerGameManager();

  // ===== 호환성을 위한 변환된 상태들 =====

  // 보드를 기존 형식으로 변환 (타입이 동일해서 그대로 사용 가능)
  const board = newBoard;

  // ValidMoves를 기존 형식으로 변환
  const validMoves = useMemo(() =>
    newValidMoves.map(pos => ({
      row: pos.row,
      col: pos.col,
      flipsCount: 0, // 기존 호환성
      flippedPositions: [] // 기존 호환성
    })),
    [newValidMoves]
  );

  // ===== 로컬 UI 상태 (기존 그대로 유지) =====
  const [flippedDiscs, setFlippedDiscs] = useState<Array<{ x: number; y: number }>>([]);
  const [lastMove, setLastMove] = useState<{ x: number; y: number } | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [gameStartTime] = useState(Date.now());

  // AI 상태는 이제 GameSession에서 관리하므로 로컬 상태 제거
  // const [isAIThinking, setIsAIThinking] = useState(false); // ❌ 제거됨

  // ===== 게임 초기화 (새로운 시스템) =====

  useEffect(() => {
    // 게임 세션 설정
    createSession({
      mode: mapGameMode(mode),
      difficulty: mapDifficulty(towerFloor),
      players: {
        black: { name: 'Player', type: 'human' },
        white: {
          name: mode === 'tower' ? 'Tower AI' : 'AI',
          type: 'ai',
          difficulty: mapDifficulty(towerFloor)
        }
      },
      aiEngine
    });

    // 새 게임 시작
    newNewGame();
    startSession();
  }, [mode, towerFloor, aiEngine]);

  // 상태 변화 알림
  useEffect(() => {
    onStateChange?.({
      currentPlayer,
      score,
      validMovesCount: validMoves.length,
      gameStatus,
      moves: moveCount
    });
  }, [currentPlayer, score, validMoves.length, gameStatus, moveCount, onStateChange]);

  // ===== AI 이동 처리 (새로운 시스템) =====

  useEffect(() => {
    // AI 턴 자동 처리
    if (gameStatus === 'playing' &&
        isAITurn(currentPlayer) &&
        !aiThinking &&
        !disabled) {
      handleAIMove();
    }
  }, [currentPlayer, gameStatus, aiThinking, disabled, isAITurn]);

  // 게임 종료 처리
  useEffect(() => {
    if (gameStatus === 'finished') {
      const winner = score.black > score.white ? 'black' :
                   score.white > score.black ? 'white' : 'tie';

      const result: GameEndResult = {
        winner,
        score,
        moves: moveCount,
        duration: Date.now() - gameStartTime
      };

      // 타워 모드 특별 처리
      if (mode === 'tower') {
        const victory = winner === 'black'; // 플레이어는 항상 검은색
        towerManager.completeChallenge(victory);
      }

      onGameEnd?.(result);
    }
  }, [gameStatus, score, mode, moveCount, gameStartTime, onGameEnd, towerManager]);

  // ===== AI 이동 처리 (새로운 시스템) =====

  const handleAIMove = useCallback(async () => {
    if (aiThinking || disabled) return;

    try {
      // GameCore 구성
      const gameCore = {
        id: crypto.randomUUID(),
        board: newBoard,
        currentPlayer,
        validMoves: newValidMoves,
        score,
        status: gameStatus,
        moveHistory: [], // TODO: get from store
        canUndo: false,  // TODO: get from store
        canRedo: false   // TODO: get from store
      };

      // 새로운 AI 시스템으로 이동 요청
      const aiPosition = await requestAIMove(gameCore);

      if (aiPosition) {
        // 새로운 시스템으로 이동 실행
        const moveResult: MoveResult = newMakeMove(aiPosition);

        if (moveResult.success) {
          // UI 업데이트 (기존 호환성)
          const legacyMove = positionToLegacy(aiPosition);
          setLastMove(legacyMove);
          setMoveCount(prev => prev + 1);

          // 뒤집힌 돌 애니메이션
          const flipped = moveResult.capturedCells.map(pos => positionToLegacy(pos));
          setFlippedDiscs(flipped);
          setTimeout(() => setFlippedDiscs([]), 500);
        }
      }
    } catch (error) {
      console.error('[OthelloGame] AI move failed:', error);
    }
  }, [aiThinking, disabled, newBoard, currentPlayer, newValidMoves, score, gameStatus, requestAIMove, newMakeMove]);

  // ===== 플레이어 이동 처리 (새로운 시스템) =====

  const handlePlayerMove = useCallback((x: number, y: number) => {
    // 기본 검증
    if (gameStatus !== 'playing' || aiThinking || disabled) return;

    // AI 턴이면 무시
    if (isAITurn(currentPlayer)) return;

    // 좌표 변환: UI(x,y) → 새로운 시스템(Position)
    const position: Position = { row: y, col: x };

    // 새로운 시스템으로 이동 실행
    const moveResult: MoveResult = newMakeMove(position);

    if (moveResult.success) {
      // UI 업데이트 (기존 호환성 유지)
      setLastMove({ x, y });
      setMoveCount(prev => prev + 1);

      // 뒤집힌 돌 애니메이션 (새로운 시스템에서 정확한 데이터 제공)
      const flipped = moveResult.capturedCells.map(pos => positionToLegacy(pos));
      setFlippedDiscs(flipped);
      setTimeout(() => setFlippedDiscs([]), 500);
    }
  }, [gameStatus, aiThinking, disabled, currentPlayer, isAITurn, newMakeMove]);

  // ===== 게임 리셋 (새로운 시스템) =====

  const handleReset = useCallback(() => {
    newResetGame(); // 새로운 시스템 리셋

    // UI 상태 리셋
    setFlippedDiscs([]);
    setLastMove(null);
    setMoveCount(0);
    // AI 상태는 GameSession에서 자동 관리됨
  }, [newResetGame]);

  // 기존 인터페이스 호환성 (외부에서 사용할 수 있도록)
  const makeMove = useCallback((row: number, col: number): boolean => {
    const position: Position = { row, col };
    const result = newMakeMove(position);
    return result.success;
  }, [newMakeMove]);

  const resetGame = handleReset;
  const initializeGame = useCallback(() => {
    newNewGame();
  }, [newNewGame]);

  // 보드 상태 변환 (우리 타입 → GameBoard 타입)
  const convertToGameBoardState = useCallback((): BoardState => {
    const numericBoard = board.map(row =>
      row.map(cell => {
        if (cell === 'black') return 1;
        if (cell === 'white') return -1;
        return 0;
      })
    );

    const convertedValidMoves = validMoves.map(move => ({
      x: move.col,
      y: move.row
    }));

    return {
      board: numericBoard,
      currentPlayer,
      validMoves: convertedValidMoves
    };
  }, [board, currentPlayer, validMoves]);

  const boardState = convertToGameBoardState();

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* 게임 보드 */}
      <GameBoard
        boardState={boardState}
        onCellClick={handlePlayerMove}
        flippedDiscs={flippedDiscs}
        showValidMoves={gameStatus === 'playing' && !disabled}
        disabled={disabled || gameStatus !== 'playing' || aiThinking ||
                 isAITurn(currentPlayer)}
        lastMove={lastMove}
      />

      {/* AI 상태 표시 (새로운 시스템 상태 사용) */}
      {aiThinking && (
        <div className="text-center">
          <div className="text-sm text-yellow-400 animate-pulse">
            AI가 생각하는 중...
          </div>
        </div>
      )}

      {/* 컨트롤 버튼 */}
      {showControls && (
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
            disabled={disabled}
          >
            새 게임
          </button>
        </div>
      )}
    </div>
  );
}

export type { OthelloGameProps, GameEndResult, GameStateInfo };