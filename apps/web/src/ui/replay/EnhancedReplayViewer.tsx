import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GameReplay, GameMove as ReplayGameMove } from '../../types/replay';
import { OthelloEngine } from '../../utils/othelloEngine';
import { useReplaySounds } from '../../hooks/useReplaySounds';
import { analyzeMoveQuality, generateEvaluationGraph } from '../../utils/moveAnalysis';
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
type Player = -1 | 1;
type Disc = -1 | 0 | 1;
interface Position { x: number; y: number; }
type Board = Disc[][];
type Boards = Board[];

interface EnhancedReplayViewerProps {
  gameReplay: GameReplay;
  onClose: () => void;
}

/* ──────────────────────────────
   Helpers
   ────────────────────────────── */
// Convert new replay moves to legacy format for display
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

export function EnhancedReplayViewer({ gameReplay, onClose }: EnhancedReplayViewerProps) {
  // Basic state
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  // Enhanced features state
  const [autoPlay, setAutoPlay] = useState(false);
  const [showMoveAnnotations, setShowMoveAnnotations] = useState(true);
  const [criticalMoveDetection, setCriticalMoveDetection] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [highlightLastMove, setHighlightLastMove] = useState(true);
  const [showEvaluationGraph, setShowEvaluationGraph] = useState(true);

  // Sound system
  const { sounds, cleanup } = useReplaySounds({
    enabled: soundEnabled,
    volume: 0.3
  });

  // Safe empty board
  const EMPTY_BOARD: Board = useMemo(
    () => Array.from({ length: 8 }, () => Array(8).fill(0) as Disc[]),
    []
  );

  // Othello engine and game reconstruction
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

  // Current board calculation
  const hasInitialState = boardStates.length === moves.length + 1;
  const boardIdx = useMemo(() => {
    const idx = hasInitialState ? currentMoveIndex + 1 : currentMoveIndex;
    return Math.min(Math.max(idx, 0), Math.max(boardStates.length - 1, 0));
  }, [currentMoveIndex, hasInitialState, boardStates.length]);

  const board = boardStates[boardIdx] ?? EMPTY_BOARD;
  const currentMove = moves[currentMoveIndex];
  const currentGameMove = gameReplay.moves[currentMoveIndex];

  // Evaluation data for visualization
  const evaluationData = useMemo(() =>
    generateEvaluationGraph(gameReplay.moves), [gameReplay.moves]
  );

  // Auto-play effect
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

        // Play move sound
        if (soundEnabled) {
          sounds.playMove();
        }

        return next;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, currentMoveIndex, moves.length, playbackSpeed, soundEnabled, sounds]);

  // Critical move detection
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

  // Cleanup audio on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Enhanced handlers
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    if (soundEnabled) sounds.playStart();
  }, [soundEnabled, sounds]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (soundEnabled) sounds.playPause();
  }, [soundEnabled, sounds]);

  const handleStepForward = useCallback(() => {
    if (currentMoveIndex < moves.length - 1) {
      setCurrentMoveIndex(prev => prev + 1);
      setIsPlaying(false);
      if (soundEnabled) sounds.stepForward();
    }
  }, [currentMoveIndex, moves.length, soundEnabled, sounds]);

  const handleStepBackward = useCallback(() => {
    if (currentMoveIndex > 0) {
      setCurrentMoveIndex(prev => prev - 1);
      setIsPlaying(false);
      if (soundEnabled) sounds.stepBackward();
    }
  }, [currentMoveIndex, soundEnabled, sounds]);

  const handleSeek = useCallback((index: number) => {
    setCurrentMoveIndex(Math.max(0, Math.min(index, moves.length)));
    setIsPlaying(false);
  }, [moves.length]);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
  }, []);

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