/**
 * 올바른 아키텍처: 상태(store)와 UI(GameBoard)를 연결하는 컨테이너
 * 비즈니스 로직은 utils/에서, 상태 관리는 store/에서 가져옴
 */

import React, { useEffect, useState, useCallback } from 'react';
import { GameBoard, type BoardState } from '../../ui/game/GameBoard';
import { useOthelloStore } from '../../store/othelloStore';
import { useTowerGameManager } from '../../store/towerStore';
import type { Board, Player } from '../../utils/othelloLogic';

interface OthelloGameProps {
  mode: 'single' | 'tower' | 'local' | 'ai' | 'battle';
  towerFloor?: number;
  aiEngine?: 'tower' | 'random' | 'minimax';
  onGameEnd?: (result: GameEndResult) => void;
  onStateChange?: (state: GameStateInfo) => void;
  className?: string;
  showControls?: boolean;
  disabled?: boolean;
}

interface GameEndResult {
  winner: 'black' | 'white' | 'tie';
  score: { black: number; white: number };
  moves: number;
  duration?: number;
}

interface GameStateInfo {
  currentPlayer: Player;
  score: { black: number; white: number };
  validMovesCount: number;
  gameStatus: 'playing' | 'finished' | 'paused';
  moves: number;
}

/**
 * 오델로 게임 메인 컨테이너 컴포넌트
 * 모든 feature에서 재사용 가능한 게임 로직 통합체
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
  // Store 상태
  const {
    board,
    currentPlayer,
    validMoves,
    gameStatus,
    score,
    makeMove,
    resetGame,
    initializeGame
  } = useOthelloStore();

  const towerManager = useTowerGameManager();

  // 로컬 UI 상태
  const [flippedDiscs, setFlippedDiscs] = useState<Array<{ x: number; y: number }>>([]);
  const [lastMove, setLastMove] = useState<{ x: number; y: number } | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [gameStartTime] = useState(Date.now());

  // 게임 초기화
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

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

  // AI 이동 처리 (타워 모드)
  useEffect(() => {
    if (mode === 'tower' &&
        currentPlayer === 'white' &&
        gameStatus === 'playing' &&
        !isAIThinking &&
        !disabled) {
      handleAIMove();
    }
  }, [mode, currentPlayer, gameStatus, board, disabled]);

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

  // AI 이동 처리
  const handleAIMove = useCallback(async () => {
    if (isAIThinking || disabled) return;

    setIsAIThinking(true);

    try {
      let aiMove: { row: number; col: number } | null = null;

      // AI 엔진 선택
      if (mode === 'tower' && aiEngine === 'tower') {
        aiMove = await towerManager.getAIMove(board, 'white');
      }
      // 다른 AI 엔진들 추가 가능

      if (aiMove) {
        // AI 생각 시간 시뮬레이션
        const thinkingTime = Math.random() * 1000 + 500; // 0.5-1.5초

        setTimeout(() => {
          const success = makeMove(aiMove.row, aiMove.col);
          if (success) {
            setLastMove({ x: aiMove.col, y: aiMove.row });
            setMoveCount(prev => prev + 1);

            // 뒤집힌 돌 애니메이션
            const flipped = validMoves
              .find(move => move.row === aiMove.row && move.col === aiMove.col)
              ?.flippedPositions.map(pos => ({ x: pos.col, y: pos.row })) || [];

            setFlippedDiscs(flipped);
            setTimeout(() => setFlippedDiscs([]), 500);
          }
          setIsAIThinking(false);
        }, thinkingTime);
      } else {
        setIsAIThinking(false);
      }
    } catch (error) {
      console.error('AI move failed:', error);
      setIsAIThinking(false);
    }
  }, [isAIThinking, disabled, mode, aiEngine, board, makeMove, validMoves, towerManager]);

  // 플레이어 이동 처리
  const handlePlayerMove = useCallback((x: number, y: number) => {
    if (gameStatus !== 'playing' || isAIThinking || disabled) return;

    // 타워 모드에서는 플레이어가 항상 검은색
    if (mode === 'tower' && currentPlayer !== 'black') return;

    // 다른 모드에서는 현재 플레이어만 이동 가능
    if (mode !== 'tower' && mode !== 'single' && isAIThinking) return;

    const success = makeMove(y, x); // GameBoard는 x,y 좌표, 로직은 row,col

    if (success) {
      setLastMove({ x, y });
      setMoveCount(prev => prev + 1);

      // 뒤집힌 돌 애니메이션
      const flipped = validMoves
        .find(move => move.row === y && move.col === x)
        ?.flippedPositions.map(pos => ({ x: pos.col, y: pos.row })) || [];

      setFlippedDiscs(flipped);
      setTimeout(() => setFlippedDiscs([]), 500);
    }
  }, [gameStatus, isAIThinking, disabled, mode, currentPlayer, makeMove, validMoves]);

  // 게임 리셋
  const handleReset = useCallback(() => {
    resetGame();
    setFlippedDiscs([]);
    setLastMove(null);
    setMoveCount(0);
    setIsAIThinking(false);
  }, [resetGame]);

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
        disabled={disabled || gameStatus !== 'playing' || isAIThinking ||
                 (mode === 'tower' && currentPlayer === 'white')}
        lastMove={lastMove}
      />

      {/* AI 상태 표시 */}
      {isAIThinking && (
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