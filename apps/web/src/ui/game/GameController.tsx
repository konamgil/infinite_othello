import React, { useState, useEffect } from 'react';
import { GameBoard, BoardState } from './GameBoard';
import { useNavigate, useLocation } from 'react-router-dom';
import { RotateCcw, Play, Pause, Home, ArrowLeft } from 'lucide-react';
import { useTowerProgress } from '../../features/tower/hooks/useTowerProgress';

interface GameControllerProps {
  title?: string;
  opponent?: 'ai' | 'human' | 'stella';
  difficulty?: 'easy' | 'medium' | 'hard' | 'nightmare';
  towerFloor?: number;
}

/**
 * Creates and returns the initial state for an Othello game board.
 * @returns {BoardState} The initial board state.
 */
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

/**
 * Checks if a given move is valid for the specified player.
 * @param {number[][]} board - The current board state.
 * @param {number} x - The x-coordinate of the move.
 * @param {number} y - The y-coordinate of the move.
 * @param {'black' | 'white'} player - The player making the move.
 * @returns {boolean} True if the move is valid.
 */
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

/**
 * Calculates all valid moves for a given player on the current board.
 * @param {number[][]} board - The current board state.
 * @param {'black' | 'white'} player - The player to calculate moves for.
 * @returns An array of valid move coordinates.
 */
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

/**
 * Calculates the current score of the game.
 * @param {number[][]} board - The current board state.
 * @returns An object with black and white scores.
 */
function calculateScore(board: number[][]): { black: number; white: number } {
  let black = 0;
  let white = 0;
  
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (board[y][x] === 1) black++;
      else if (board[y][x] === -1) white++;
    }
  }
  
  return { black, white };
}

/**
 * Executes a move for a player, returning the new board state and a list of flipped discs.
 * @param {number[][]} board - The current board state.
 * @param {number} x - The x-coordinate of the move.
 * @param {number} y - The y-coordinate of the move.
 * @param {'black' | 'white'} player - The player making the move.
 * @returns An object containing the new board state and the coordinates of the flipped discs.
 */
function makeMove(board: number[][], x: number, y: number, player: 'black' | 'white'): { newBoard: number[][], flipped: Array<{x: number, y: number}> } {
  const newBoard = board.map(row => [...row]);
  const playerValue = player === 'black' ? 1 : -1;
  const opponentValue = player === 'black' ? -1 : 1;
  const allFlipped: Array<{x: number, y: number}> = [];

  newBoard[y][x] = playerValue;

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  for (const [dx, dy] of directions) {
    const toFlip: Array<{x: number, y: number}> = [];
    let nx = x + dx;
    let ny = y + dy;

    while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
      if (newBoard[ny][nx] === 0) break;

      if (newBoard[ny][nx] === opponentValue) {
        toFlip.push({x: nx, y: ny});
      } else if (newBoard[ny][nx] === playerValue) {
        toFlip.forEach((coord) => {
          newBoard[coord.y][coord.x] = playerValue;
          allFlipped.push(coord);
        });
        break;
      } else {
        break;
      }

      nx += dx;
      ny += dy;
    }
  }

  return { newBoard, flipped: allFlipped };
}

/**
 * The main controller component for an Othello game.
 *
 * This component encapsulates the entire game screen, including the board,
 * game information display (score, turn), and game controls (reset, pause).
 * It manages the game state and contains the core Othello logic for validating
 * and making moves.
 *
 * @param {GameControllerProps} props - The component props.
 * @returns {React.ReactElement} The rendered game screen.
 */
export function GameController({ title = "게임", opponent = 'ai', difficulty = 'medium', towerFloor }: GameControllerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearFloor, failFloor } = useTowerProgress();
  
  // 타워 모드인지 확인
  const isTowerMode = location.pathname.includes('/tower/') && towerFloor;
  
  const [gameState, setGameState] = useState<BoardState>(() => createInitialBoard());
  const [gameStatus, setGameStatus] = useState<'playing' | 'paused' | 'finished'>('playing');
  const [moveHistory, setMoveHistory] = useState<Array<{ x: number; y: number; player: 'black' | 'white' }>>([]);
  const [lastFlippedDiscs, setLastFlippedDiscs] = useState<Array<{x: number, y: number}>>([]);

  // 게임 상태 업데이트
  useEffect(() => {
    const validMoves = getValidMoves(gameState.board, gameState.currentPlayer);
    setGameState(prev => ({ ...prev, validMoves }));
    
    // 게임 종료 체크
    if (validMoves.length === 0) {
      const oppositePlayer = gameState.currentPlayer === 'black' ? 'white' : 'black';
      const oppositeValidMoves = getValidMoves(gameState.board, oppositePlayer);
      
      if (oppositeValidMoves.length === 0) {
        // 게임 종료
        setGameStatus('finished');
        
        // 타워 모드에서 게임 종료 시 진행도 업데이트
        if (isTowerMode && towerFloor) {
          const score = calculateScore(gameState.board);
          const isVictory = score.black > score.white; // 플레이어는 항상 흑돌
          
          setTimeout(() => {
            if (isVictory) {
              const result = clearFloor(towerFloor, true);
              console.log('🏆 타워 층 클리어!', result);
              // 승리 시 타워 메인으로 돌아가기
              setTimeout(() => navigate('/tower'), 2000);
            } else {
              const result = failFloor(towerFloor);
              console.log('💀 타워 도전 실패!', result);
              // 패배 시 타워 메인으로 돌아가기
              setTimeout(() => navigate('/tower'), 2000);
            }
          }, 1000);
        }
      }
    }
  }, [gameState.board, gameState.currentPlayer, isTowerMode, towerFloor, clearFloor, failFloor, navigate]);

  // 셀 클릭 핸들러
  const handleCellClick = (x: number, y: number) => {
    if (gameStatus !== 'playing') return;

    const isValid = gameState.validMoves.some(move => move.x === x && move.y === y);
    if (!isValid) return;

    const { newBoard, flipped } = makeMove(gameState.board, x, y, gameState.currentPlayer);
    const nextPlayer = gameState.currentPlayer === 'black' ? 'white' : 'black';

    setLastFlippedDiscs(flipped);
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
    setLastFlippedDiscs([]);
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
    <div className="h-full w-full overflow-hidden relative bg-black/90">
      {/* 신비로운 배경 이팩트 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-blue-900/20"></div>

        {/* 미니멀한 별빛 효과 */}
        <div className="absolute top-10 left-20 w-1 h-1 bg-white/60 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-16 w-0.5 h-0.5 bg-blue-300/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-12 w-1.5 h-1.5 bg-purple-300/50 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-60 right-24 w-0.5 h-0.5 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* 컴팩한 상단 헤더 */}
      <div className="relative z-20 flex items-center justify-between p-3 bg-black/30 backdrop-blur-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm
                   text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300"
        >
          <ArrowLeft size={18} />
          <span className="font-smooth text-sm">돌아가기</span>
        </button>

        <h1 className="font-smooth font-semibold text-white/90">{title}</h1>

        <button
          onClick={togglePause}
          className="p-2 rounded-xl bg-white/10 backdrop-blur-sm
                   text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300"
          aria-label={gameStatus === 'playing' ? '일시정지' : '재개'}
        >
          {gameStatus === 'playing' ? (
            <Pause size={18} />
          ) : (
            <Play size={18} />
          )}
        </button>
      </div>

      {/* 메인 게임 영역 */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-1 py-2">
        {/* 컴팩한 게임 정보 - 상단에 한 줄로 */}
        <div className="w-full flex items-center justify-between mb-2 px-4 py-2 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
          {/* 흑돌 점수 */}
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 bg-gray-800 rounded-full transition-all duration-300 ${
              gameState.currentPlayer === 'black' ? 'ring-2 ring-orange-400 ring-opacity-60' : ''
            }`}></div>
            <div className="text-white/90 font-smooth font-semibold">{score.black}</div>
          </div>

          {/* 턴 인디케이터 */}
          <div className="text-center">
            <div className="text-xs text-white/60 font-smooth">{moveHistory.length}번째 수</div>
            <div className="text-sm font-smooth font-semibold text-orange-400">
              {gameState.currentPlayer === 'black' ? '흑돌' : '백돌'} 차례
            </div>
          </div>

          {/* 백돌 점수 */}
          <div className="flex items-center gap-2">
            <div className="text-white/90 font-smooth font-semibold">{score.white}</div>
            <div className={`w-6 h-6 bg-gray-200 rounded-full transition-all duration-300 ${
              gameState.currentPlayer === 'white' ? 'ring-2 ring-orange-400 ring-opacity-60' : ''
            }`}></div>
          </div>
        </div>

        {/* 게임 보드 - 화면에 거의 근접하게 */}
        <div className="w-full mb-2">
          <GameBoard
            boardState={gameState}
            onCellClick={handleCellClick}
            disabled={gameStatus !== 'playing'}
            flippedDiscs={lastFlippedDiscs}
          />
        </div>

        {/* 컴팩한 게임 컨트롤 */}
        <div className="w-full">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={resetGame}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl
                       bg-white/10 backdrop-blur-sm border border-white/20
                       text-white/80 font-smooth text-sm hover:bg-white/20 hover:text-white
                       active:scale-95 transition-all duration-300"
            >
              <RotateCcw size={14} />
              다시 시작
            </button>

            <button className="py-2.5 px-3 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-500/30
                             text-red-300 font-smooth text-sm hover:bg-red-500/30 hover:text-red-200
                             active:scale-95 transition-all duration-300">
              항복하기
            </button>
          </div>
        </div>

        {/* 상태 메시지 - 컴팩하고 우아하게 */}
        {gameStatus === 'paused' && (
          <div className="mt-4 p-4 rounded-2xl bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 text-center">
            <p className="text-yellow-300 font-smooth">게임이 일시정지되었습니다</p>
          </div>
        )}

        {gameState.validMoves.length === 0 && gameStatus === 'playing' && (
          <div className="mt-4 p-4 rounded-2xl bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 text-center">
            <p className="text-blue-300 font-smooth">
              {gameState.currentPlayer === 'black' ? '흑돌' : '백돌'} 플레이어가 둡 수 없는 상황입니다.
            </p>
            <p className="text-xs text-blue-400 mt-1 font-smooth">턴이 자동으로 넘어갑니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}