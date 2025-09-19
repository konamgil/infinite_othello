import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GameReplay, GameMove as ReplayGameMove } from '../../types/replay';
import { OthelloEngine } from '../../utils/othelloEngine';
import { AdvancedAnalysisSystem, AnalysisData } from './AdvancedAnalysisSystem';
import { BoardOverlaySystem } from './BoardOverlaySystem';
import {
  Play, Pause, SkipBack, SkipForward, X, ChevronLeft, ChevronRight,
  FastForward, Maximize2, Minimize2, RotateCcw, Settings,
  Volume2, VolumeX, Download, Share2, BookOpen
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────────────
   Types & Interfaces
   ────────────────────────────────────────────────────────────────── */

type Player = -1 | 1;
type Disc = -1 | 0 | 1;
interface Position { x: number; y: number; }
type Board = Disc[][];

interface AdvancedReplayViewerProps {
  gameReplay: GameReplay;
  onClose: () => void;
}

interface ViewerSettings {
  autoPlay: boolean;
  playbackSpeed: number;
  soundEnabled: boolean;
  showCoordinates: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  boardTheme: 'classic' | 'cosmic' | 'minimal';
}

/* ──────────────────────────────────────────────────────────────────
   Advanced Replay Viewer Component
   ────────────────────────────────────────────────────────────────── */

export function AdvancedReplayViewer({ gameReplay, onClose }: AdvancedReplayViewerProps) {
  // Core State
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Analysis State
  const [overlayMode, setOverlayMode] = useState<'scores' | 'heatmap' | 'mobility' | 'frontier' | null>(null);
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulationMove, setSimulationMove] = useState<Position | null>(null);

  // Settings
  const [settings, setSettings] = useState<ViewerSettings>({
    autoPlay: false,
    playbackSpeed: 1,
    soundEnabled: true,
    showCoordinates: false,
    animationSpeed: 'normal',
    boardTheme: 'cosmic'
  });

  // Convert replay moves to legacy format
  const moves = useMemo(() => {
    return gameReplay.moves.map(move => ({
      position: { x: move.x, y: move.y },
      player: move.player === 'black' ? 1 : -1,
      timestamp: move.timestamp,
      capturedDiscs: move.flippedDiscs
    }));
  }, [gameReplay.moves]);

  // Reconstruct board states
  const boardStates = useMemo<Board[]>(() => {
    const engine = new OthelloEngine();
    const engineMoves = moves.map(m => ({
      position: m.position,
      player: m.player as Player
    }));

    try {
      const states = engine.reconstructGameFromMoves(engineMoves) as Board[];
      return Array.isArray(states) && states.length ? states : [];
    } catch {
      return [];
    }
  }, [moves]);

  // Current board and move
  const hasInitialState = boardStates.length === moves.length + 1;
  const boardIndex = hasInitialState ? currentMoveIndex + 1 : currentMoveIndex;
  const currentBoard = boardStates[Math.min(Math.max(boardIndex, 0), boardStates.length - 1)] ||
                       Array.from({ length: 8 }, () => Array(8).fill(0) as Disc[]);
  const currentMove = moves[currentMoveIndex];

  // Generate analysis data (enhanced mock data for demonstration)
  const analysisData = useMemo<AnalysisData | null>(() => {
    if (!currentMove) return null;

    const seedBase = (currentMove.position.x + 1) * 31 + (currentMove.position.y + 1) * 131 +
                     (currentMove.player === 1 ? 997 : 499) + currentMoveIndex * 17;

    const seededRand = (seed: number) => {
      const s = Math.sin(seed) * 10000;
      return s - Math.floor(s);
    };

    const evaluation = Math.floor(seededRand(seedBase) * 100) - 50;

    // Generate legal moves with scores
    const legalMoves = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (currentBoard[y][x] === 0 && Math.random() > 0.7) {
          const score = Math.floor(seededRand(seedBase + x * 8 + y) * 80) - 40;
          let category: 'best' | 'good' | 'neutral' | 'bad' | 'terrible';
          if (score > 30) category = 'best';
          else if (score > 10) category = 'good';
          else if (score > -10) category = 'neutral';
          else if (score > -30) category = 'bad';
          else category = 'terrible';

          legalMoves.push({
            x, y, score, category,
            reasoning: `${String.fromCharCode(65 + x)}${y + 1} 위치 분석`
          });
        }
      }
    }

    return {
      moveNumber: currentMoveIndex + 1,
      evaluation,
      mobility: {
        current: Math.floor(seededRand(seedBase + 1) * 15) + 5,
        potential: Math.floor(seededRand(seedBase + 2) * 20) + 10,
        restricted: Math.floor(seededRand(seedBase + 3) * 8) + 2
      },
      frontier: {
        edgeCount: Math.floor(seededRand(seedBase + 4) * 12) + 4,
        stability: Math.floor(seededRand(seedBase + 5) * 40) + 60,
        weakSpots: [
          { x: 2, y: 3, risk: 75 },
          { x: 5, y: 1, risk: 60 },
          { x: 1, y: 6, risk: 45 }
        ]
      },
      parity: {
        currentParity: (currentMoveIndex % 2 === 0) ? 'even' : 'odd',
        parityAdvantage: Math.floor(seededRand(seedBase + 6) * 20) - 10,
        tempoControl: Math.floor(seededRand(seedBase + 7) * 60) + 40
      },
      legalMoves: legalMoves.sort((a, b) => b.score - a.score),
      whatIf: simulationMove ? {
        alternativeMove: simulationMove,
        projectedOutcome: Math.floor(seededRand(seedBase + simulationMove.x + simulationMove.y) * 60) - 30,
        explanation: `${String.fromCharCode(65 + simulationMove.x)}${simulationMove.y + 1}에 두면 게임의 흐름이 바뀔 수 있습니다.`
      } : undefined
    };
  }, [currentMoveIndex, currentMove, currentBoard, simulationMove]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || moves.length === 0) return;
    if (currentMoveIndex >= moves.length - 1) {
      setIsPlaying(false);
      return;
    }

    const interval = setInterval(() => {
      setCurrentMoveIndex(prev => {
        if (prev >= moves.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / settings.playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, currentMoveIndex, moves.length, settings.playbackSpeed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentMoveIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCurrentMoveIndex(prev => Math.min(moves.length - 1, prev + 1));
          break;
        case 'Home':
          e.preventDefault();
          setCurrentMoveIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setCurrentMoveIndex(moves.length - 1);
          break;
        case 'Escape':
          e.preventDefault();
          if (isFullscreen) setIsFullscreen(false);
          else onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [moves.length, isFullscreen, onClose]);

  // Control handlers
  const handlePlayPause = useCallback(() => setIsPlaying(prev => !prev), []);
  const handleStepBackward = useCallback(() => {
    setCurrentMoveIndex(prev => Math.max(0, prev - 1));
    setIsPlaying(false);
  }, []);
  const handleStepForward = useCallback(() => {
    setCurrentMoveIndex(prev => Math.min(moves.length - 1, prev + 1));
    setIsPlaying(false);
  }, [moves.length]);
  const handleGoToStart = useCallback(() => {
    setCurrentMoveIndex(0);
    setIsPlaying(false);
  }, []);
  const handleGoToEnd = useCallback(() => {
    setCurrentMoveIndex(Math.max(0, moves.length - 1));
    setIsPlaying(false);
  }, [moves.length]);

  const handleBoardOverlay = useCallback((mode: string | null) => {
    setOverlayMode(mode as any);
  }, []);

  const handleSimulationToggle = useCallback((active: boolean) => {
    setSimulationMode(active);
    if (!active) setSimulationMove(null);
  }, []);

  const handleSimulationMove = useCallback((x: number, y: number) => {
    setSimulationMove({ x, y });
  }, []);

  // Progress calculation
  const currentMoveNumber = moves.length > 0 ? currentMoveIndex + 1 : 0;
  const progressPercent = moves.length > 0 ? ((currentMoveIndex + 1) / moves.length) * 100 : 0;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full bg-black/40 backdrop-blur-md border border-white/20 flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'h-full rounded-none max-w-none'
            : 'h-[95vh] max-w-6xl rounded-2xl sm:rounded-3xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-black/20">
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

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-white/60 font-display text-xs sm:text-sm">
              {currentMoveNumber}/{moves.length}
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-8 h-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg
                       flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <Settings size={14} className="text-white/70" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-8 h-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg
                       flex items-center justify-center hover:bg-white/20 transition-all"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span className="text-white/70" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 border-b border-white/10 bg-black/30">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-display text-white/70">재생 속도</label>
                <select
                  value={settings.playbackSpeed}
                  onChange={(e) => setSettings(prev => ({ ...prev, playbackSpeed: Number(e.target.value) }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white/90 font-display text-sm"
                >
                  <option value={0.25}>0.25x</option>
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={4}>4x</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-display text-white/70">보드 테마</label>
                <select
                  value={settings.boardTheme}
                  onChange={(e) => setSettings(prev => ({ ...prev, boardTheme: e.target.value as any }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white/90 font-display text-sm"
                >
                  <option value="classic">클래식</option>
                  <option value="cosmic">코스믹</option>
                  <option value="minimal">미니멀</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                  className="rounded"
                />
                <label className="text-xs font-display text-white/70">사운드</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.showCoordinates}
                  onChange={(e) => setSettings(prev => ({ ...prev, showCoordinates: e.target.checked }))}
                  className="rounded"
                />
                <label className="text-xs font-display text-white/70">좌표 표시</label>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Game Board Container */}
          <div className="flex-1 min-h-0 p-2 sm:p-4 lg:p-6 flex items-center justify-center">
            <div className="relative w-full max-w-lg">
              {/* Board with Overlays */}
              <div className={`
                bg-gradient-to-br backdrop-blur-sm border rounded-xl sm:rounded-2xl aspect-square
                ${settings.boardTheme === 'cosmic' ? 'from-green-800/20 to-green-600/20 border-white/10' :
                  settings.boardTheme === 'classic' ? 'from-green-900/40 to-green-700/40 border-green-400/20' :
                  'from-gray-800/20 to-gray-600/20 border-white/5'}
              `}>
                <BoardOverlaySystem
                  board={currentBoard}
                  analysisData={analysisData}
                  overlayMode={overlayMode}
                  simulationMode={simulationMode}
                  currentMove={currentMove?.position}
                  onSimulationMove={handleSimulationMove}
                />
              </div>

              {/* Move Indicator */}
              {currentMove && (
                <div className="absolute -bottom-8 sm:-bottom-10 left-1/2 -translate-x-1/2">
                  <div className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
                    <span className="text-xs text-white/80 font-display whitespace-nowrap">
                      {currentMove.player === 1 ? '⚫ 흑돌' : '⚪ 백돌'}
                      ({String.fromCharCode(65 + currentMove.position.x)}{currentMove.position.y + 1})
                    </span>
                  </div>
                </div>
              )}

              {/* Board Coordinates */}
              {settings.showCoordinates && (
                <>
                  {/* Column labels */}
                  <div className="absolute -top-6 left-0 right-0 flex justify-around px-3 sm:px-4">
                    {Array.from({ length: 8 }, (_, i) => (
                      <span key={i} className="text-xs font-display text-white/50">
                        {String.fromCharCode(65 + i)}
                      </span>
                    ))}
                  </div>
                  {/* Row labels */}
                  <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-around py-3 sm:py-4">
                    {Array.from({ length: 8 }, (_, i) => (
                      <span key={i} className="text-xs font-display text-white/50">
                        {i + 1}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Playback Controls */}
          <div className="border-t border-white/10 p-3 sm:p-4 bg-black/20">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
              {/* Main Controls */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={handleGoToStart}
                  className="w-9 h-9 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg
                           flex items-center justify-center hover:bg-white/20 transition-all"
                  disabled={currentMoveIndex === 0}
                  title="처음으로"
                >
                  <SkipBack size={14} className="text-white/80" />
                </button>

                <button
                  onClick={handleStepBackward}
                  className="w-9 h-9 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg
                           flex items-center justify-center hover:bg-white/20 transition-all"
                  disabled={currentMoveIndex === 0}
                  title="이전 수"
                >
                  <ChevronLeft size={14} className="text-white/80" />
                </button>

                <button
                  onClick={handlePlayPause}
                  className="w-11 h-11 bg-purple-400/20 backdrop-blur-sm border border-purple-400/30 rounded-lg
                           flex items-center justify-center hover:bg-purple-400/30 transition-all"
                  title={isPlaying ? '일시정지' : '재생'}
                >
                  {isPlaying ? (
                    <Pause size={18} className="text-purple-300" />
                  ) : (
                    <Play size={18} className="text-purple-300 ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleStepForward}
                  className="w-9 h-9 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg
                           flex items-center justify-center hover:bg-white/20 transition-all"
                  disabled={currentMoveIndex >= Math.max(0, moves.length - 1)}
                  title="다음 수"
                >
                  <ChevronRight size={14} className="text-white/80" />
                </button>

                <button
                  onClick={handleGoToEnd}
                  className="w-9 h-9 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg
                           flex items-center justify-center hover:bg-white/20 transition-all"
                  disabled={currentMoveIndex >= Math.max(0, moves.length - 1)}
                  title="마지막으로"
                >
                  <SkipForward size={14} className="text-white/80" />
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

              {/* Speed and Actions */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <FastForward size={12} className="text-white/60" />
                  <span className="text-xs font-display text-white/70">{settings.playbackSpeed}x</span>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                  className="w-8 h-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg
                           flex items-center justify-center hover:bg-white/20 transition-all"
                  title="사운드 토글"
                >
                  {settings.soundEnabled ?
                    <Volume2 size={12} className="text-white/70" /> :
                    <VolumeX size={12} className="text-white/70" />
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analysis System */}
      <AdvancedAnalysisSystem
        analysisData={analysisData}
        currentMoveIndex={currentMoveIndex}
        totalMoves={moves.length}
        boardSize={{ width: 8, height: 8 }}
        onMoveSelect={setCurrentMoveIndex}
        onBoardOverlay={handleBoardOverlay}
        onSimulationToggle={handleSimulationToggle}
      />
    </div>
  );
}

export default AdvancedReplayViewer;