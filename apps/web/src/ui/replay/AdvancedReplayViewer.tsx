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

/** @typedef {-1 | 1} Player - 흑돌(1) 또는 백돌(-1)을 나타내는 플레이어 타입. */
type Player = -1 | 1;
/** @typedef {-1 | 0 | 1} Disc - 보드 위의 돌 상태. 흑돌(1), 백돌(-1), 빈 칸(0). */
type Disc = -1 | 0 | 1;
/** @typedef {{x: number, y: number}} Position - 보드 위의 좌표. */
interface Position { x: number; y: number; }
/** @typedef {Disc[][]} Board - 8x8 오델로 보드 상태. */
type Board = Disc[][];

/**
 * @interface AdvancedReplayViewerProps
 * `AdvancedReplayViewer` 컴포넌트의 props를 정의합니다.
 */
interface AdvancedReplayViewerProps {
  /** @property {GameReplay} gameReplay - 표시할 게임 리플레이 데이터. */
  gameReplay: GameReplay;
  /** @property {() => void} onClose - 리플레이 뷰어를 닫을 때 호출될 콜백 함수. */
  onClose: () => void;
}

/**
 * @interface ViewerSettings
 * 뷰어의 다양한 설정을 관리하는 객체의 타입을 정의합니다.
 */
interface ViewerSettings {
  /** @property {boolean} autoPlay - 자동 재생 활성화 여부. */
  autoPlay: boolean;
  /** @property {number} playbackSpeed - 재생 속도 배율. */
  playbackSpeed: number;
  /** @property {boolean} soundEnabled - 효과음 활성화 여부. */
  soundEnabled: boolean;
  /** @property {boolean} showCoordinates - 보드 좌표 표시 여부. */
  showCoordinates: boolean;
  /** @property {'slow' | 'normal' | 'fast'} animationSpeed - 애니메이션 속도. */
  animationSpeed: 'slow' | 'normal' | 'fast';
  /** @property {'classic' | 'cosmic' | 'minimal'} boardTheme - 보드 테마. */
  boardTheme: 'classic' | 'cosmic' | 'minimal';
}

/* ──────────────────────────────────────────────────────────────────
   Advanced Replay Viewer Component
   ────────────────────────────────────────────────────────────────── */

/**
 * 고급 리플레이 분석 기능을 제공하는 뷰어 컴포넌트입니다.
 * 보드 오버레이, 시뮬레이션 모드, 상세 분석 시스템 등 다양한 고급 기능을 포함합니다.
 * @param {AdvancedReplayViewerProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 고급 리플레이 뷰어 UI.
 */
export function AdvancedReplayViewer({ gameReplay, onClose }: AdvancedReplayViewerProps) {
  // --- Core State ---
  /** @state {number} currentMoveIndex - 현재 수의 인덱스. */
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  /** @state {boolean} isPlaying - 재생 중인지 여부. */
  const [isPlaying, setIsPlaying] = useState(false);
  /** @state {boolean} isFullscreen - 전체 화면 모드 여부. */
  const [isFullscreen, setIsFullscreen] = useState(false);
  /** @state {boolean} showSettings - 설정 패널 표시 여부. */
  const [showSettings, setShowSettings] = useState(false);

  // --- Analysis State ---
  /** @state {'scores' | 'heatmap' | 'mobility' | 'frontier' | null} overlayMode - 보드에 표시할 분석 오버레이 종류. */
  const [overlayMode, setOverlayMode] = useState<'scores' | 'heatmap' | 'mobility' | 'frontier' | null>(null);
  /** @state {boolean} simulationMode - 'What-if' 시뮬레이션 모드 활성화 여부. */
  const [simulationMode, setSimulationMode] = useState(false);
  /** @state {Position | null} simulationMove - 시뮬레이션 중인 수의 위치. */
  const [simulationMove, setSimulationMove] = useState<Position | null>(null);

  // --- Settings State ---
  /** @state {ViewerSettings} settings - 뷰어의 전반적인 설정을 담는 객체. */
  const [settings, setSettings] = useState<ViewerSettings>({
    autoPlay: false,
    playbackSpeed: 1,
    soundEnabled: true,
    showCoordinates: false,
    animationSpeed: 'normal',
    boardTheme: 'cosmic'
  });

  /**
   * `gameReplay` prop으로부터 내부에서 사용할 수 있는 형식의 수(move) 배열을 생성합니다.
   * 이 변환은 `gameReplay.moves`가 변경될 때만 다시 계산됩니다.
   * @type {Array<{position: Position; player: Player; timestamp: number; capturedDiscs: Position[]}>}
   */
  const moves = useMemo(() => {
    return gameReplay.moves.map(move => ({
      position: { x: move.x, y: move.y },
      player: move.player === 'black' ? 1 : -1,
      timestamp: move.timestamp,
      capturedDiscs: move.flippedDiscs
    }));
  }, [gameReplay.moves]);

  /**
   * `moves` 배열을 기반으로 오델로 엔진을 사용하여 게임의 모든 보드 상태를 재구성합니다.
   * 이 계산은 `moves` 배열이 변경될 때만 다시 실행됩니다.
   * @type {Board[]}
   */
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

  // 현재 보드 상태와 수 정보를 계산합니다.
  const hasInitialState = boardStates.length === moves.length + 1;
  const boardIndex = hasInitialState ? currentMoveIndex + 1 : currentMoveIndex;
  const currentBoard = boardStates[Math.min(Math.max(boardIndex, 0), boardStates.length - 1)] ||
                       Array.from({ length: 8 }, () => Array(8).fill(0) as Disc[]);
  const currentMove = moves[currentMoveIndex];

  /**
   * 현재 수를 기반으로 `AdvancedAnalysisSystem`에 전달할 상세 분석 데이터를 생성합니다.
   * 이 데이터는 데모를 위해 결정론적 의사 난수로 생성된 목(mock) 데이터입니다.
   * 실제 애플리케이션에서는 AI 분석 엔진으로부터 이 데이터를 받아와야 합니다.
   * @type {AnalysisData | null}
   */
  const analysisData = useMemo<AnalysisData | null>(() => {
    if (!currentMove) return null;

    // 결정론적 난수 생성을 위한 시드 생성
    const seedBase = (currentMove.position.x + 1) * 31 + (currentMove.position.y + 1) * 131 +
                     (currentMove.player === 1 ? 997 : 499) + currentMoveIndex * 17;

    const seededRand = (seed: number) => {
      const s = Math.sin(seed) * 10000;
      return s - Math.floor(s);
    };

    const evaluation = Math.floor(seededRand(seedBase) * 100) - 50;

    // 둘 수 있는 위치와 점수를 포함한 목 데이터 생성
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

    // 최종 분석 데이터 객체
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

  /**
   * 자동 재생 기능을 처리하는 `useEffect` 훅입니다.
   * `isPlaying` 상태가 true일 때 `settings.playbackSpeed`에 맞춰 다음 수로 넘어갑니다.
   */
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

  /**
   * 키보드 단축키를 처리하는 `useEffect` 훅입니다.
   * Space: 재생/일시정지, ←/→: 이전/다음 수, Home/End: 처음/끝, Esc: 닫기/전체화면 해제.
   */
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

  // --- Control Handlers ---
  /** 재생/일시정지 상태를 토글합니다. */
  const handlePlayPause = useCallback(() => setIsPlaying(prev => !prev), []);
  /** 한 수 뒤로 이동하고 재생을 멈춥니다. */
  const handleStepBackward = useCallback(() => {
    setCurrentMoveIndex(prev => Math.max(0, prev - 1));
    setIsPlaying(false);
  }, []);
  /** 한 수 앞으로 이동하고 재생을 멈춥니다. */
  const handleStepForward = useCallback(() => {
    setCurrentMoveIndex(prev => Math.min(moves.length - 1, prev + 1));
    setIsPlaying(false);
  }, [moves.length]);
  /** 게임의 처음으로 이동합니다. */
  const handleGoToStart = useCallback(() => {
    setCurrentMoveIndex(0);
    setIsPlaying(false);
  }, []);
  /** 게임의 마지막으로 이동합니다. */
  const handleGoToEnd = useCallback(() => {
    setCurrentMoveIndex(Math.max(0, moves.length - 1));
    setIsPlaying(false);
  }, [moves.length]);

  /** 보드 오버레이 모드를 설정합니다. */
  const handleBoardOverlay = useCallback((mode: string | null) => {
    setOverlayMode(mode as any);
  }, []);

  /** 시뮬레이션 모드를 토글합니다. */
  const handleSimulationToggle = useCallback((active: boolean) => {
    setSimulationMode(active);
    if (!active) setSimulationMove(null);
  }, []);

  /** 시뮬레이션 할 수를 설정합니다. */
  const handleSimulationMove = useCallback((x: number, y: number) => {
    setSimulationMove({ x, y });
  }, []);

  // UI 렌더링에 필요한 계산된 값들
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