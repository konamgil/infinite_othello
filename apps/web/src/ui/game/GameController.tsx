import React, { useState, useEffect } from 'react';
import { GameBoard, BoardState } from './GameBoard';
import { Layout } from '../common/Layout';
import { RotateCcw, Play, Pause, Settings } from 'lucide-react';

interface GameControllerProps {
  title?: string;
  opponent?: 'ai' | 'human' | 'stella';
  difficulty?: 'easy' | 'medium' | 'hard' | 'nightmare';
}

// 초기 오델로 보드 상태 생성
function createInitialBoard(): BoardState {
  const board = Array(8).fill(null).map(() => Array(8).fill(0));

  // 초기 4개 돌 배치
  board[3][3] = -1; // 백돌
  board[3][4] = 1;  // 흑돌
  board[4][3] = 1;  // 흑돌
  board[4][4] = -1; // 백돌

  return {
    board,
    currentPlayer: 'black',
    validMoves: [
      { x: 2, y: 3 },
      { x: 3, y: 2 },
      { x: 4, y: 5 },
      { x: 5, y: 4 }
    ]
  };
}

// 유효한 수인지 확인
function isValidMove(board: number[][], x: number, y: number, player: 'black' | 'white'): boolean {
  if (board[y][x] !== 0) return false;

  const playerValue = player === 'black' ? 1 : -1;
  const opponentValue = player === 'black' ? -1 : 1;

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  for (const [dx, dy] of directions) {
    let nx = x + dx;
    let ny = y + dy;
    let hasOpponentBetween = false;

    while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
      if (board[ny][nx] === 0) break;

      if (board[ny][nx] === opponentValue) {
        hasOpponentBetween = true;
      } else if (board[ny][nx] === playerValue && hasOpponentBetween) {
        return true;
      } else {
        break;
      }

      nx += dx;
      ny += dy;
    }
  }

  return false;
}

// 유효한 수들 찾기
function getValidMoves(board: number[][], player: 'black' | 'white'): Array<{ x: number; y: number }> {
  const moves = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (isValidMove(board, x, y, player)) {
        moves.push({ x, y });
      }
    }
  }
  return moves;
}

// 수를 두고 돌 뒤집기
function makeMove(board: number[][], x: number, y: number, player: 'black' | 'white'): number[][] {
  const newBoard = board.map(row => [...row]);
  const playerValue = player === 'black' ? 1 : -1;
  const opponentValue = player === 'black' ? -1 : 1;

  newBoard[y][x] = playerValue;

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  for (const [dx, dy] of directions) {
    const toFlip = [];
    let nx = x + dx;
    let ny = y + dy;

    while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
      if (newBoard[ny][nx] === 0) break;

      if (newBoard[ny][nx] === opponentValue) {
        toFlip.push([nx, ny]);
      } else if (newBoard[ny][nx] === playerValue) {
        toFlip.forEach(([fx, fy]) => {
          newBoard[fy][fx] = playerValue;
        });
        break;
      } else {
        break;
      }

      nx += dx;
      ny += dy;
    }
  }

  return newBoard;
}

export function GameController({ title = "게임", opponent = 'ai', difficulty = 'medium' }: GameControllerProps) {
  const [gameState, setGameState] = useState<BoardState>(() => createInitialBoard());
  const [gameStatus, setGameStatus] = useState<'playing' | 'paused' | 'finished'>('playing');
  const [moveHistory, setMoveHistory] = useState<Array<{ x: number; y: number; player: 'black' | 'white' }>>([]);

  // 게임 상태 업데이트
  useEffect(() => {
    const validMoves = getValidMoves(gameState.board, gameState.currentPlayer);
    setGameState(prev => ({ ...prev, validMoves }));
  }, [gameState.board, gameState.currentPlayer]);

  // 셀 클릭 핸들러
  const handleCellClick = (x: number, y: number) => {
    if (gameStatus !== 'playing') return;

    const isValid = gameState.validMoves.some(move => move.x === x && move.y === y);
    if (!isValid) return;

    // 수 두기
    const newBoard = makeMove(gameState.board, x, y, gameState.currentPlayer);
    const nextPlayer = gameState.currentPlayer === 'black' ? 'white' : 'black';

    setGameState({
      board: newBoard,
      currentPlayer: nextPlayer,
      validMoves: []
    });

    setMoveHistory(prev => [...prev, { x, y, player: gameState.currentPlayer }]);
  };

  // 게임 리셋
  const resetGame = () => {
    setGameState(createInitialBoard());
    setGameStatus('playing');
    setMoveHistory([]);
  };

  // 게임 일시정지/재개
  const togglePause = () => {
    setGameStatus(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  // 점수 계산
  const getScore = () => {
    let black = 0, white = 0;
    gameState.board.forEach(row => {
      row.forEach(cell => {
        if (cell === 1) black++;
        if (cell === -1) white++;
      });
    });
    return { black, white };
  };

  const score = getScore();

  return (
    <Layout
      title={title}
      showBackButton
      rightAction={
        <button
          onClick={togglePause}
          className="touch-target hover:bg-tower-deep-50 rounded-lg transition-colors"
          aria-label={gameStatus === 'playing' ? '일시정지' : '재개'}
        >
          {gameStatus === 'playing' ? (
            <Pause size={20} className="text-tower-silver-300" />
          ) : (
            <Play size={20} className="text-tower-silver-300" />
          )}
        </button>
      }
    >
      <div className="flex flex-col items-center content-padding section-spacing">
        {/* 게임 정보 */}
        <div className="w-full grid grid-cols-3 gap-4 mb-6">
          {/* 흑돌 점수 */}
          <div className="card text-center">
            <div className="w-8 h-8 bg-gray-800 rounded-full mx-auto mb-2"></div>
            <div className="text-lg font-bold text-tower-silver-200">{score.black}</div>
            <div className="text-xs text-tower-silver-400">Black</div>
            {gameState.currentPlayer === 'black' && (
              <div className="w-2 h-2 bg-tower-gold-400 rounded-full mx-auto mt-1"></div>
            )}
          </div>

          {/* 현재 턴 */}
          <div className="card text-center">
            <div className="text-sm text-tower-silver-400 mb-1">현재 턴</div>
            <div className="text-lg font-bold text-tower-gold-400">
              {gameState.currentPlayer === 'black' ? 'Black' : 'White'}
            </div>
            <div className="text-xs text-tower-silver-500">
              {moveHistory.length}수
            </div>
          </div>

          {/* 백돌 점수 */}
          <div className="card text-center">
            <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-2"></div>
            <div className="text-lg font-bold text-tower-silver-200">{score.white}</div>
            <div className="text-xs text-tower-silver-400">White</div>
            {gameState.currentPlayer === 'white' && (
              <div className="w-2 h-2 bg-tower-gold-400 rounded-full mx-auto mt-1"></div>
            )}
          </div>
        </div>

        {/* 게임 보드 */}
        <div className="mb-6">
          <GameBoard
            boardState={gameState}
            onCellClick={handleCellClick}
            disabled={gameStatus !== 'playing'}
          />
        </div>

        {/* 게임 컨트롤 */}
        <div className="w-full">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={resetGame}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              다시 시작
            </button>

            <button className="btn-primary">
              항복하기
            </button>
          </div>
        </div>

        {/* 상태 메시지 */}
        {gameStatus === 'paused' && (
          <div className="card mt-4 text-center bg-tower-deep-50">
            <p className="text-tower-silver-300">게임이 일시정지되었습니다</p>
          </div>
        )}

        {gameState.validMoves.length === 0 && gameStatus === 'playing' && (
          <div className="card mt-4 text-center bg-yellow-900/20">
            <p className="text-yellow-300">
              {gameState.currentPlayer === 'black' ? 'Black' : 'White'} 플레이어가 둘 수 있는 곳이 없습니다.
            </p>
            <p className="text-xs text-yellow-400 mt-1">턴이 자동으로 넘어갑니다.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}