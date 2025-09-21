import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GameReplay, GameMove as ReplayGameMove } from '../../../types/replay';
import { OthelloEngine } from '../../../utils/othelloEngine';
import { useReplaySounds } from '../../../hooks/useReplaySounds';
import { analyzeMoveQuality, generateEvaluationGraph } from '../../../utils/moveAnalysis';
import { ReplayControls } from './ReplayControls';
import { ReplayEvaluationGraph } from './ReplayEvaluationGraph';
import { ReplayMoveAnnotation } from './ReplayMoveAnnotation';
import {
  Play, Pause, SkipBack, SkipForward, X,
  ChevronLeft, ChevronRight, FastForward,
  Eye, Brain, TrendingUp, AlertTriangle, CheckCircle,
  Settings, Volume2, VolumeX
} from 'lucide-react';

/* ──────────────────────────────
   Local Types
   ────────────────────────────── */
/** @typedef {-1 | 1} Player - 흑돌(1) 또는 백돌(-1)을 나타내는 플레이어 타입. */
type Player = -1 | 1;
/** @typedef {-1 | 0 | 1} Disc - 보드 위의 돌 상태. 흑돌(1), 백돌(-1), 빈 칸(0). */
type Disc = -1 | 0 | 1;
/** @typedef {{x: number, y: number}} Position - 보드 위의 좌표. */
interface Position { x: number; y: number; }
/** @typedef {Disc[][]} Board - 8x8 오델로 보드 상태. */
type Board = Disc[][];
/** @typedef {Board[]} Boards - 게임의 각 수에 따른 보드 상태 배열. */
type Boards = Board[];

/**
 * @interface EnhancedReplayViewerProps
 * `EnhancedReplayViewer` 컴포넌트의 props를 정의합니다.
 */
interface EnhancedReplayViewerProps {
  /** @property {GameReplay} gameReplay - 표시할 게임 리플레이 데이터. */
  gameReplay: GameReplay;
  /** @property {() => void} onClose - 리플레이 뷰어를 닫을 때 호출될 콜백 함수. */
  onClose: () => void;
}

/* ──────────────────────────────
   Helpers
   ────────────────────────────── */
/**
 * 최신 리플레이 데이터 형식을 레거시(내부용) 형식으로 변환합니다.
 * @param {ReplayGameMove[]} replayMoves - 변환할 최신 형식의 게임 수순 배열.
 * @returns {Array} 레거시 형식의 게임 수순 배열.
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
 * 향상된 리플레이 뷰어 컴포넌트입니다.
 * 평가 그래프, 상세 수 분석, 사운드 시스템 등 통합된 분석 및 사용자 경험 기능을 제공합니다.
 * `ReplayControls`와 같은 모듈화된 컴포넌트를 사용하여 UI를 구성합니다.
 * @param {EnhancedReplayViewerProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 향상된 리플레이 뷰어 UI.
 */
export function EnhancedReplayViewer({ gameReplay, onClose }: EnhancedReplayViewerProps) {
  // --- Basic State ---
  /** @state {number} currentMoveIndex - 현재 수의 인덱스. */
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  /** @state {boolean} isPlaying - 재생 중인지 여부. */
  const [isPlaying, setIsPlaying] = useState(false);
  /** @state {number} playbackSpeed - 재생 속도 배율. */
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  /** @state {boolean} showSettings - `ReplayControls` 내의 설정 패널 표시 여부. */
  const [showSettings, setShowSettings] = useState(false);

  // --- Enhanced Features State ---
  /** @state {boolean} autoPlay - 자동 재생 기능 활성화 여부. */
  const [autoPlay, setAutoPlay] = useState(false);
  /** @state {boolean} showMoveAnnotations - 수 해설 패널 표시 여부. */
  const [showMoveAnnotations, setShowMoveAnnotations] = useState(true);
  /** @state {boolean} criticalMoveDetection - 결정적인 수에서 자동 멈춤 기능 활성화 여부. */
  const [criticalMoveDetection, setCriticalMoveDetection] = useState(true);
  /** @state {boolean} soundEnabled - 효과음 활성화 여부. */
  const [soundEnabled, setSoundEnabled] = useState(false);
  /** @state {boolean} showCoordinates - 보드 좌표 표시 여부. */
  const [showCoordinates, setShowCoordinates] = useState(true);
  /** @state {boolean} highlightLastMove - 마지막 수 강조 표시 여부. */
  const [highlightLastMove, setHighlightLastMove] = useState(true);
  /** @state {boolean} showEvaluationGraph - 평가 그래프 표시 여부. */
  const [showEvaluationGraph, setShowEvaluationGraph] = useState(true);

  /**
   * 리플레이 사운드 효과를 관리하는 커스텀 훅입니다.
   * @type {{sounds: object, cleanup: function}}
   */
  const { sounds, cleanup } = useReplaySounds({
    enabled: soundEnabled,
    volume: 0.3
  });

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
   * @returns {{moves: Array, boardStates: Boards}} 레거시 형식의 수순 배열과 보드 상태 배열.
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
      states = [];
    }

    return { moves: legacyMoves, boardStates: states };
  }, [gameReplay]);

  /**
   * 현재 `currentMoveIndex`에 해당하는 `boardStates` 배열의 인덱스를 계산합니다.
   * @type {number}
   */
  const boardIdx = useMemo(() => {
    const idx = hasInitialState ? currentMoveIndex + 1 : currentMoveIndex;
    return Math.min(Math.max(idx, 0), Math.max(boardStates.length - 1, 0));
  }, [currentMoveIndex, hasInitialState, boardStates.length]);

  const board = boardStates[boardIdx] ?? EMPTY_BOARD;
  const currentMove = moves[currentMoveIndex];
  const currentGameMove = gameReplay.moves[currentMoveIndex]; // 원본 형식의 현재 수

  /**
   * 게임의 평가 점수 변화를 시각화하기 위한 데이터를 생성합니다.
   * @type {number[]}
   */
  const evaluationData = useMemo(() =>
    generateEvaluationGraph(gameReplay.moves), [gameReplay.moves]
  );

  /**
   * 자동 재생 기능을 처리하는 `useEffect` 훅입니다.
   * 재생 중일 때 `playbackSpeed`에 맞춰 다음 수로 이동하고 효과음을 재생합니다.
   */
  useEffect(() => {
    if (!isPlaying || moves.length === 0) return;
    if (currentMoveIndex >= moves.length - 1) {
      setIsPlaying(false);
      return;
    }

    const interval = setInterval(() => {
      setCurrentMoveIndex(prev => {
        const next = prev + 1;
        if (next >= moves.length) {
          setIsPlaying(false);
          return prev;
        }

        // 수 이동 효과음 재생
        if (soundEnabled) {
          sounds.playMove();
        }

        return next;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, currentMoveIndex, moves.length, playbackSpeed, soundEnabled, sounds]);

  /**
   * '결정적인 수에서 자동 멈춤' 기능을 처리하는 `useEffect` 훅입니다.
   * 재생 중에 결정적인 수(실수, 최적수)를 만나면 자동으로 일시정지하고 효과음을 재생합니다.
   */
  useEffect(() => {
    if (criticalMoveDetection && isPlaying && currentGameMove) {
      const analysis = analyzeMoveQuality(currentGameMove);
      if (analysis?.shouldPause) {
        setIsPlaying(false);
        if (soundEnabled) {
          sounds.criticalMove();
        }
      } else if (analysis?.quality.severity === 'excellent' && soundEnabled) {
        sounds.excellentMove();
      }
    }
  }, [currentMoveIndex, criticalMoveDetection, isPlaying, currentGameMove, soundEnabled, sounds]);

  /**
   * 컴포넌트가 언마운트될 때 오디오 컨텍스트를 정리합니다.
   */
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // --- 컨트롤 핸들러 함수들 ---

  /** 재생 버튼 클릭을 처리하고 효과음을 재생합니다. */
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    if (soundEnabled) sounds.playStart();
  }, [soundEnabled, sounds]);

  /** 일시정지 버튼 클릭을 처리하고 효과음을 재생합니다. */
  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (soundEnabled) sounds.playPause();
  }, [soundEnabled, sounds]);

  /** '다음 수' 버튼 클릭을 처리하고 효과음을 재생합니다. */
  const handleStepForward = useCallback(() => {
    if (currentMoveIndex < moves.length - 1) {
      setCurrentMoveIndex(prev => prev + 1);
      setIsPlaying(false);
      if (soundEnabled) sounds.stepForward();
    }
  }, [currentMoveIndex, moves.length, soundEnabled, sounds]);

  /** '이전 수' 버튼 클릭을 처리하고 효과음을 재생합니다. */
  const handleStepBackward = useCallback(() => {
    if (currentMoveIndex > 0) {
      setCurrentMoveIndex(prev => prev - 1);
      setIsPlaying(false);
      if (soundEnabled) sounds.stepBackward();
    }
  }, [currentMoveIndex, soundEnabled, sounds]);

  /** 프로그레스 바나 그래프를 통해 특정 수로 이동하는 것을 처리합니다. */
  const handleSeek = useCallback((index: number) => {
    setCurrentMoveIndex(Math.max(0, Math.min(index, moves.length)));
    setIsPlaying(false);
  }, [moves.length]);

  /** 재생 속도 변경을 처리합니다. */
  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
  }, []);

  /** '수 번호로 이동' 기능을 처리하고 효과음을 재생합니다. */
  const handleJumpToMove = useCallback((moveIndex: number) => {
    setCurrentMoveIndex(moveIndex);
    setIsPlaying(false);
    if (soundEnabled) sounds.jumpToMove();
  }, [soundEnabled, sounds]);

  const currentMoveNumber = moves.length > 0 ? currentMoveIndex + 1 : 0;

  return (
    <div
      className="fixed inset-0 z-50 p-2 sm:p-4 bg-black/80 backdrop-blur-sm flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-6xl h-[95vh] bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-3xl
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
                🎮 고급 리플레이 분석
              </h2>
              <p className="text-xs sm:text-sm text-white/60 font-display truncate">
                vs {gameReplay.playerBlack.name === '우주의 오델로 수호자' ? gameReplay.playerWhite.name : gameReplay.playerBlack.name}
                {' '}• {gameReplay.result.finalScore.black}-{gameReplay.result.finalScore.white}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
              title="효과음 토글"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Evaluation graph toggle */}
            <button
              onClick={() => setShowEvaluationGraph(!showEvaluationGraph)}
              className={`p-2 rounded-lg transition-colors ${
                showEvaluationGraph ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
              title="평가 그래프 토글"
            >
              <TrendingUp size={16} />
            </button>

            <div className="text-white/60 font-display text-xs sm:text-sm hidden sm:block">
              {currentMoveNumber}/{moves.length}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Game Board */}
          <div className="flex-1 min-h-0 p-3 sm:p-4 lg:p-6 flex flex-col overflow-auto">
            {/* Evaluation Graph */}
            {showEvaluationGraph && evaluationData.length > 0 && (
              <div className="mb-3 sm:mb-4">
                <ReplayEvaluationGraph
                  moves={gameReplay.moves}
                  currentMoveIndex={currentMoveIndex}
                  onMoveClick={handleJumpToMove}
                  height={60}
                  className="rounded-lg"
                />
              </div>
            )}

            {/* Board Container */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-full max-w-sm lg:max-w-md">
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
                                      flex items-center justify-center transition-all duration-300 relative
                                      ${isLastMove && highlightLastMove ? 'ring-2 ring-yellow-400 ring-opacity-80' : ''}`}
                        >
                          {/* Coordinates */}
                          {showCoordinates && (
                            <div className="absolute -top-1 -left-1 text-xs text-white/40 font-mono">
                              {y === 0 && String.fromCharCode(65 + x)}
                              {x === 0 && (y + 1)}
                            </div>
                          )}

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
          </div>

          {/* Analysis Panel */}
          {showMoveAnnotations && (
            <aside className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 p-3 sm:p-4 lg:p-6 overflow-y-auto min-h-0 max-h-60 lg:max-h-none">
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-display font-bold text-white tracking-wider flex items-center gap-2">
                  <Brain size={18} className="text-purple-400" />
                  상세 분석
                </h3>

                {/* Current Move Analysis */}
                {currentGameMove && (
                  <ReplayMoveAnnotation
                    move={currentGameMove}
                    moveIndex={currentMoveIndex}
                    isCurrentMove={true}
                    showDetails={true}
                  />
                )}

                {/* Position Info */}
                <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10">
                  <h4 className="font-display font-semibold text-white/90 mb-3">포지션 정보</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60 font-display">현재 수순</span>
                      <span className="text-white/90 font-display font-semibold">{currentMoveNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60 font-display">흑돌 개수</span>
                      <span className="text-white/90 font-display font-semibold">
                        {board && board.length > 0 ? board.flat().filter(d => d === 1).length : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60 font-display">백돌 개수</span>
                      <span className="text-white/90 font-display font-semibold">
                        {board && board.length > 0 ? board.flat().filter(d => d === -1).length : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60 font-display">게임 진행률</span>
                      <span className="text-white/90 font-display font-semibold">
                        {Math.round((currentMoveIndex / Math.max(moves.length - 1, 1)) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Enhanced Controls */}
        <div className="border-t border-white/10">
          <ReplayControls
            currentMoveIndex={currentMoveIndex}
            totalMoves={moves.length}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onPlay={handlePlay}
            onPause={handlePause}
            onStepForward={handleStepForward}
            onStepBackward={handleStepBackward}
            onSeek={handleSeek}
            onSpeedChange={handleSpeedChange}
            onToggleSettings={() => setShowSettings(!showSettings)}
            showSettings={showSettings}
            onToggleCoordinates={() => setShowCoordinates(!showCoordinates)}
            onToggleHighlight={() => setHighlightLastMove(!highlightLastMove)}
            showCoordinates={showCoordinates}
            highlightLastMove={highlightLastMove}
            // Enhanced features
            moves={gameReplay.moves}
            autoPlay={autoPlay}
            onToggleAutoPlay={() => setAutoPlay(!autoPlay)}
            onJumpToMove={handleJumpToMove}
            showMoveAnnotations={showMoveAnnotations}
            onToggleMoveAnnotations={() => setShowMoveAnnotations(!showMoveAnnotations)}
            criticalMoveDetection={criticalMoveDetection}
            onToggleCriticalMoves={() => setCriticalMoveDetection(!criticalMoveDetection)}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            evaluationData={evaluationData}
          />
        </div>
      </div>
    </div>
  );
}