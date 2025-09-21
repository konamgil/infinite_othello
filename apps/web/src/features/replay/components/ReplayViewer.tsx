// components/ReplayViewer.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { GameReplay, GameMove as ReplayGameMove } from '../../../types/replay';
import { OthelloEngine } from '../../../utils/othelloEngine';
import { MobileAnalysisPanel } from './MobileAnalysisPanel';
import { FloatingMinimap } from './FloatingMinimap';
import {
  Play, Pause, SkipBack, SkipForward, X,
  ChevronLeft, ChevronRight, FastForward,
  Eye, Brain, TrendingUp, AlertTriangle, CheckCircle
} from 'lucide-react';

/* ──────────────────────────────
   Local Types
   ────────────────────────────── */
/** @typedef {-1 | 1} Player 흑돌(1) 또는 백돌(-1)을 나타내는 플레이어 타입 */
type Player = -1 | 1;
/** @typedef {-1 | 0 | 1} Disc 보드 위의 돌 상태를 나타내는 타입. 흑돌(1), 백돌(-1), 빈 칸(0) */
type Disc = -1 | 0 | 1;
/** @typedef {{x: number, y: number}} Position 보드 위의 좌표 */
interface Position { x: number; y: number; }
/** @typedef {Disc[][]} Board 8x8 오델로 보드 상태 */
type Board = Disc[][];
/** @typedef {Board[]} Boards 게임의 각 수에 따른 보드 상태 배열 */
type Boards = Board[];

/** @interface ReplayViewerProps ReplayViewer 컴포넌트의 props 타입 */
interface ReplayViewerProps {
  /** @property {GameReplay} gameReplay 표시할 게임 리플레이 데이터 */
  gameReplay: GameReplay;
  /** @property {() => void} onClose 리플레이 뷰어를 닫을 때 호출되는 콜백 함수 */
  onClose: () => void;
}

/* ──────────────────────────────
   Helpers
   ────────────────────────────── */

/**
 * 최신 리플레이 데이터 형식을 레거시(내부용) 형식으로 변환합니다.
 * 'black'/'white' 문자열을 1/-1 숫자로 변경하고, 필드 이름을 맞춥니다.
 * @param {ReplayGameMove[]} replayMoves - 변환할 최신 형식의 게임 수순 배열
 * @returns {Array<{position: Position; player: Player; timestamp: number; capturedDiscs: Position[]}>} 레거시 형식의 게임 수순 배열
 */
const convertMovesToLegacyFormat = (replayMoves: ReplayGameMove[]): Array<{
  position: Position;
  player: Player;
  timestamp: number;
  capturedDiscs: Position[];
}> => {
  return replayMoves.map(move => ({
    position: { x: move.x, y: move.y },
    player: move.player === 'black' ? 1 : -1,
    timestamp: move.timestamp,
    capturedDiscs: move.flippedDiscs
  }));
};

/**
 * 수의 평가 점수에 따라 품질 정보를 반환합니다.
 * (예: 'Excellent', 'Good', 'Mistake' 등)
 * @param {number} evaluation - 수의 평가 점수
 * @returns {{label: string, color: string, bgColor: string, icon: React.ElementType, description: string}} 수의 품질에 대한 UI 정보 객체
 */
const getMoveQualityInfo = (evaluation: number) => {
  if (evaluation >= 50) return {
    label: 'Excellent',
    color: 'text-green-400',
    bgColor: 'bg-green-400/20',
    icon: CheckCircle,
    description: '완벽한 수입니다!'
  };
  if (evaluation >= 20) return {
    label: 'Good',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/20',
    icon: TrendingUp,
    description: '좋은 수입니다.'
  };
  if (evaluation >= -10) return {
    label: 'Inaccuracy',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/20',
    icon: Eye,
    description: '부정확한 수입니다.'
  };
  if (evaluation >= -30) return {
    label: 'Mistake',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/20',
    icon: AlertTriangle,
    description: '실수입니다.'
  };
  return {
    label: 'Blunder',
    color: 'text-red-400',
    bgColor: 'bg-red-400/20',
    icon: X,
    description: '큰 실수입니다!'
  };
};

/**
 * 시드 기반의 결정론적 의사 난수를 [0, 1) 범위에서 생성합니다.
 * 서버 사이드 렌더링(SSR)과 클라이언트 사이드 렌더링(CSR) 간의 일관성을 보장합니다.
 * @param {number} seed - 난수 생성을 위한 시드 값
 * @returns {number} 0과 1 사이의 난수
 */
function seededRand(seed: number) {
  const s = Math.sin(seed) * 10000;
  return s - Math.floor(s);
}

/**
 * 게임 리플레이를 시각화하고 제어하는 메인 컴포넌트입니다.
 * 오델로 보드, 재생 컨트롤, 수순 정보, 분석 패널 등을 포함합니다.
 * @param {ReplayViewerProps} props - 컴포넌트 props
 * @returns {JSX.Element} 게임 리플레이 뷰어 UI
 */
export function ReplayViewer({ gameReplay, onClose }: ReplayViewerProps) {
  // 현재 보고 있는 수의 인덱스 (0부터 시작)
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  // 자동 재생 상태 (true: 재생 중, false: 일시정지)
  const [isPlaying, setIsPlaying] = useState(false);
  // 자동 재생 속도 (1x, 2x, 4x 등)
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  // 모바일 분석 패널 표시 여부
  const [showMobileAnalysis, setShowMobileAnalysis] = useState(false);
  // 플로팅 미니맵 표시 여부
  const [showMinimap, setShowMinimap] = useState(false);

  /**
   * 렌더링 시 사용할 안전한 8x8 빈 보드 상태를 memoization합니다.
   * @type {Board}
   */
  const EMPTY_BOARD: Board = useMemo(
    () => Array.from({ length: 8 }, () => Array(8).fill(0) as Disc[]),
    []
  );

  /**
   * 오델로 엔진을 사용하여 게임 리플레이 데이터로부터 수순과 각 수 이후의 보드 상태를 재구성합니다.
   * 이 계산은 gameReplay 데이터가 변경될 때만 다시 실행됩니다.
   * @returns {{moves: Array, boardStates: Boards}} 레거시 형식의 수순 배열과 보드 상태 배열
   */
  const { moves, boardStates } = useMemo<{
    moves: Array<{ position: Position; player: Player; timestamp: number; capturedDiscs: Position[] }>;
    boardStates: Boards;
  }>(() => {
    const legacyMoves = convertMovesToLegacyFormat(gameReplay.moves);
    const engine = new OthelloEngine();

    const engineMoves = legacyMoves.map(m => ({
      position: m.position,
      player: m.player
    }));

    let states: Boards = [];
    try {
      const s = (engine.reconstructGameFromMoves(engineMoves) || []) as Boards;
      states = Array.isArray(s) && s.length ? s : [];
    } catch {
      // 엔진 재구성 중 오류 발생 시 빈 상태로 대체
      states = [];
    }

    return { moves: legacyMoves, boardStates: states };
  }, [gameReplay]);

  /**
   * `boardStates` 배열이 초기 보드 상태(0번째 수 이전)를 포함하는지 여부를 확인합니다.
   * @type {boolean}
   */
  const hasInitialState = boardStates.length === moves.length + 1;

  /**
   * 현재 `currentMoveIndex`에 해당하는 `boardStates` 배열의 인덱스를 계산합니다.
   * `hasInitialState` 값에 따라 인덱스를 조정합니다.
   * @type {number}
   */
  const boardIdx = useMemo(() => {
    const idx = hasInitialState ? currentMoveIndex + 1 : currentMoveIndex;
    return Math.min(Math.max(idx, 0), Math.max(boardStates.length - 1, 0));
  }, [currentMoveIndex, hasInitialState, boardStates.length]);

  /**
   * 현재 표시할 보드 상태입니다. `boardStates`가 비어있을 경우 `EMPTY_BOARD`를 사용합니다.
   * @type {Board}
   */
  const board = boardStates[boardIdx] ?? EMPTY_BOARD;
  /**
   * 현재 수에 대한 정보입니다.
   * @type {{position: Position; player: Player; timestamp: number; capturedDiscs: Position[]}}
   */
  const currentMove = moves[currentMoveIndex];

  /**
   * 모바일 분석 패널에 전달할 현재 수의 분석 데이터를 생성합니다.
   * 데이터에는 평가 점수, 최적의 수 여부, 대안 수 등이 포함됩니다.
   * 평가는 `seededRand`를 사용하여 결정론적으로 생성되어, 렌더링 간 일관성을 유지합니다.
   * @returns {ReplayGameMove | null} 현재 수의 분석 데이터 또는 null
   */
  const currentAnalysisMove = useMemo(() => {
    if (!currentMove) return null;

    // 현재 수 정보를 기반으로 고유한 시드 값을 생성합니다.
    const seedBase =
      (currentMove.position.x + 1) * 31 +
      (currentMove.position.y + 1) * 131 +
      (currentMove.player === 1 ? 997 : 499) +
      currentMoveIndex * 17;

    // 시드 기반의 결정론적 난수를 사용하여 평가 점수를 생성합니다.
    const evalVal = Math.floor(seededRand(seedBase) * 100) - 50;
    const isOptimal = evalVal >= 30;

    // 대안 수도 결정론적으로 생성합니다.
    const alt1 = {
      x: Math.floor(seededRand(seedBase + 1) * 8),
      y: Math.floor(seededRand(seedBase + 2) * 8),
      score: Math.floor(seededRand(seedBase + 3) * 40) + 20
    };
    const alt2 = {
      x: Math.floor(seededRand(seedBase + 4) * 8),
      y: Math.floor(seededRand(seedBase + 5) * 8),
      score: Math.floor(seededRand(seedBase + 6) * 30) + 10
    };

    // 분석 데이터를 ReplayGameMove 형식으로 변환하여 반환합니다.
    return {
      x: currentMove.position.x,
      y: currentMove.position.y,
      player: currentMove.player === 1 ? 'black' : 'white',
      moveNumber: currentMoveIndex + 1,
      timestamp: currentMove.timestamp,
      flippedDiscs: currentMove.capturedDiscs,
      evaluationScore: evalVal,
      isOptimal,
      alternativeMoves: [alt1, alt2]
    } as ReplayGameMove;
  }, [currentMoveIndex, currentMove]);

  /**
   * 자동 재생(Auto-play) 기능을 처리하는 `useEffect` 훅입니다.
   * `isPlaying` 상태가 true일 때, `playbackSpeed`에 맞춰 다음 수로 자동으로 넘어갑니다.
   */
  useEffect(() => {
    if (!isPlaying || moves.length === 0) return;
    if (currentMoveIndex >= moves.length - 1) {
      setIsPlaying(false); // 마지막 수에 도달하면 재생 중지
      return;
    }

    const interval = setInterval(() => {
      setCurrentMoveIndex(prev => {
        if (prev >= moves.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    // 컴포넌트 언마운트 또는 의존성 변경 시 인터벌 정리
    return () => clearInterval(interval);
  }, [isPlaying, currentMoveIndex, moves.length, playbackSpeed]);

  // --- 컨트롤 핸들러 함수들 ---

  /** 재생/일시정지 상태를 토글합니다. */
  const handlePlayPause = () => setIsPlaying(p => !p);

  /** 한 수 뒤로 이동하고, 재생을 중지합니다. */
  const handleStepBackward = () => {
    setCurrentMoveIndex(v => Math.max(0, v - 1));
    setIsPlaying(false);
  };

  /** 한 수 앞으로 이동하고, 재생을 중지합니다. */
  const handleStepForward = () => {
    setCurrentMoveIndex(v => Math.min(moves.length - 1, v + 1));
    setIsPlaying(false);
  };

  /** 게임의 가장 처음으로 이동하고, 재생을 중지합니다. */
  const handleGoToStart = () => {
    setCurrentMoveIndex(0);
    setIsPlaying(false);
  };

  /** 게임의 가장 마지막으로 이동하고, 재생을 중지합니다. */
  const handleGoToEnd = () => {
    setCurrentMoveIndex(Math.max(0, moves.length - 1));
    setIsPlaying(false);
  };

  // UI 렌더링에 필요한 계산된 값들
  const currentMoveNumber = moves.length > 0 ? currentMoveIndex + 1 : 0;
  const progressPercent = moves.length > 0 ? ((currentMoveIndex + 1) / moves.length) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 p-2 sm:p-4 bg-black/80 backdrop-blur-sm flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-5xl h-[95vh] bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-3xl
                      flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl
                       flex items-center justify-center hover:bg-white/20 transition-all flex-shrink-0"
            >
              <ChevronLeft size={20} className="text-white/90" />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-display font-bold text-white tracking-wider truncate">
                🎮 게임 리플레이
              </h2>
              <p className="text-xs sm:text-sm text-white/60 font-display truncate">
                vs {gameReplay.playerBlack.name === '우주의 오델로 수호자' ? gameReplay.playerWhite.name : gameReplay.playerBlack.name}
                {' '}• {gameReplay.result.finalScore.black}-{gameReplay.result.finalScore.white}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/60 font-display text-xs sm:text-sm flex-shrink-0">
            <span>{currentMoveNumber}/{moves.length}</span>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
          {/* Game Board */}
          <div className="relative w-full max-w-sm lg:max-w-md p-2 sm:p-4 lg:p-6">
            {/* Board */}
            <div className="grid grid-cols-8 gap-1 p-3 sm:p-4
                            bg-gradient-to-br from-green-800/20 to-green-600/20
                            rounded-xl sm:rounded-2xl border border-white/10 aspect-square">
              {board && board.length > 0 ? board.map((row, y) =>
                row.map((disc, x) => {
                  const isLastMove = !!currentMove && currentMove.position.x === x && currentMove.position.y === y;
                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`aspect-square bg-green-600/30 border border-green-400/20 rounded-md sm:rounded-lg
                                  flex items-center justify-center transition-all duration-300
                                  ${isLastMove ? 'ring-2 ring-yellow-400 ring-opacity-80' : ''}`}
                    >
                      {disc !== 0 && (
                        <div
                          className={`w-[70%] h-[70%] rounded-full border-2 transition-all duration-500
                                      ${disc === 1 ? 'bg-black border-white/30 shadow-lg' : 'bg-white border-gray-300 shadow-lg'}
                                      ${isLastMove ? 'scale-110 shadow-yellow-400/50' : ''}`}
                        />
                      )}
                    </div>
                  );
                })
              ) : (
                // Fallback empty board
                Array.from({ length: 8 }).map((_, y) =>
                  Array.from({ length: 8 }).map((_, x) => (
                    <div
                      key={`${x}-${y}`}
                      className="aspect-square bg-green-600/30 border border-green-400/20 rounded-md sm:rounded-lg
                                flex items-center justify-center transition-all duration-300"
                    />
                  ))
                )
              )}
            </div>

            {/* Move indicator */}
            {currentMove && (
              <div className="absolute -bottom-8 sm:-bottom-10 left-1/2 -translate-x-1/2">
                <div className="px-2 sm:px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
                  <span className="text-xs text-white/80 font-display whitespace-nowrap">
                    {currentMove.player === 1 ? '⚫ 흑돌' : '⚪ 백돌'}
                    ({String.fromCharCode(65 + currentMove.position.x)}{currentMove.position.y + 1})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="border-t border-white/10 p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
            {/* Playback Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleGoToStart}
                className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl
                         flex items-center justify-center hover:bg-white/20 transition-all"
                disabled={currentMoveIndex === 0}
                aria-label="go-to-start"
                title="처음으로"
              >
                <SkipBack size={16} className="text-white/80" />
              </button>

              <button
                onClick={handleStepBackward}
                className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl
                         flex items-center justify-center hover:bg-white/20 transition-all"
                disabled={currentMoveIndex === 0}
                aria-label="step-backward"
                title="한 수 뒤로"
              >
                <ChevronLeft size={16} className="text-white/80" />
              </button>

              <button
                onClick={handlePlayPause}
                className="w-12 h-12 bg-purple-400/20 backdrop-blur-sm border border-purple-400/30 rounded-xl
                         flex items-center justify-center hover:bg-purple-400/30 transition-all"
                aria-label="play-pause"
                title={isPlaying ? '일시정지' : '재생'}
              >
                {isPlaying ? (
                  <Pause size={20} className="text-purple-300" />
                ) : (
                  <Play size={20} className="text-purple-300 ml-0.5" />
                )}
              </button>

              <button
                onClick={handleStepForward}
                className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl
                         flex items-center justify-center hover:bg-white/20 transition-all"
                disabled={currentMoveIndex >= Math.max(0, moves.length - 1)}
                aria-label="step-forward"
                title="한 수 앞으로"
              >
                <ChevronRight size={16} className="text-white/80" />
              </button>

              <button
                onClick={handleGoToEnd}
                className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl
                         flex items-center justify-center hover:bg-white/20 transition-all"
                disabled={currentMoveIndex >= Math.max(0, moves.length - 1)}
                aria-label="go-to-end"
                title="마지막으로"
              >
                <SkipForward size={16} className="text-white/80" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex-1 mx-3 sm:mx-6 w-full sm:w-auto">
              <div className="bg-white/10 rounded-full h-2">
                <div
                  className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-1 sm:gap-2">
              <FastForward size={14} className="text-white/60" />
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 sm:px-3 py-1 text-white/90 font-display text-xs sm:text-sm"
                aria-label="playback-speed"
                title="재생 속도"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Analysis Button */}
      <button
        onClick={() => {
          setShowMobileAnalysis(true);
          setShowMinimap(true);
        }}
        className="fixed bottom-24 right-4 w-14 h-14 bg-purple-500/20 backdrop-blur-md border border-purple-400/30
                   rounded-full flex items-center justify-center hover:bg-purple-500/30 transition-all z-40
                   shadow-lg shadow-purple-500/20"
      >
        <Brain size={24} className="text-purple-300" />
      </button>

      {/* Mobile Analysis Panel */}
      <MobileAnalysisPanel
        currentMove={currentAnalysisMove || undefined}
        currentMoveIndex={currentMoveIndex}
        totalMoves={moves.length}
        isVisible={showMobileAnalysis}
        showMinimap={showMinimap}
        onMinimapToggle={() => setShowMinimap(!showMinimap)}
        onToggle={() => {
          setShowMobileAnalysis(!showMobileAnalysis);
          // 분석 패널이 닫히면 미니맵도 함께 닫기
          if (showMobileAnalysis) {
            setShowMinimap(false);
          }
        }}
      />

      {/* Floating Minimap */}
      {showMinimap && (
        <FloatingMinimap
          gameReplay={gameReplay}
          currentMoveIndex={currentMoveIndex}
          onMoveSelect={(moveIndex) => {
            setCurrentMoveIndex(moveIndex);
            setIsPlaying(false);
          }}
        />
      )}
    </div>
  );
}
