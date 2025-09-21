import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { GameReplay, GameMove as ReplayGameMove } from '../../../types/replay';
import { OthelloEngine } from '../../../utils/othelloEngine';
import { useReplaySounds } from '../../../hooks/useReplaySounds';
import { useReplayOptimizations } from '../../../hooks/useReplayOptimizations';
import { analyzeMoveQuality, generateEvaluationGraph } from '../../../utils/moveAnalysis';
import {
  formatDuration,
  formatRelativeTime,
  getPlayerResult,
  getGameModeConfig,
  getMoveQualityColor,
  positionToAlgebraic
} from '../../../utils/replayUtils';
import { ReplayErrorBoundary, SimpleErrorFallback } from './ReplayErrorBoundary';
import { ReplayControls } from './ReplayControls';
import { ReplayEvaluationGraph } from './ReplayEvaluationGraph';
import { ReplayMoveAnnotation } from './ReplayMoveAnnotation';
import { ReplayStatistics } from './ReplayStatistics';
import { ReplayFilters } from './ReplayFilters';
import {
  Play, Pause, SkipBack, SkipForward, X,
  ChevronLeft, ChevronRight, FastForward,
  Eye, Brain, TrendingUp, AlertTriangle, CheckCircle,
  Settings, Volume2, VolumeX, Download, Share2,
  Maximize2, Minimize2, Grid3X3, BarChart3,
  MessageSquare, Bookmark, BookmarkCheck,
  RotateCcw, ZoomIn, ZoomOut, Monitor,
  Smartphone, Tablet, Gamepad2, Cpu,
  Clock, Target, Trophy, Star, Zap,
  ThermometerSun, Activity, Database
} from 'lucide-react';

// Lazy load heavy components for better initial performance
const ReplayExporter = lazy(() => import('./ReplayExporter').then(m => ({ default: m.ReplayExporter })));

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
 * @interface ViewMode
 * 뷰어의 다양한 레이아웃 및 표시 설정을 관리하는 객체의 타입을 정의합니다.
 */
interface ViewMode {
  /** @property {'standard' | 'analysis' | 'compact' | 'theater'} layout - 전체적인 레이아웃 모드. */
  layout: 'standard' | 'analysis' | 'compact' | 'theater';
  /** @property {boolean} showSidebar - 분석 사이드바 표시 여부. */
  showSidebar: boolean;
  /** @property {boolean} showAnalysis - 상세 분석 컴포넌트 표시 여부. */
  showAnalysis: boolean;
  /** @property {boolean} showStats - 통계 컴포넌트 표시 여부. */
  showStats: boolean;
  /** @property {'small' | 'medium' | 'large'} boardSize - 게임 보드의 크기. */
  boardSize: 'small' | 'medium' | 'large';
  /** @property {'cosmic' | 'classic' | 'minimal'} theme - 전체적인 UI 테마. */
  theme: 'cosmic' | 'classic' | 'minimal';
}

/**
 * @interface UltimateReplayViewerProps
 * `UltimateReplayViewer` 컴포넌트의 props를 정의합니다.
 */
interface UltimateReplayViewerProps {
  /** @property {GameReplay} gameReplay - 표시할 게임 리플레이 데이터. */
  gameReplay: GameReplay;
  /** @property {() => void} onClose - 리플레이 뷰어를 닫을 때 호출될 콜백 함수. */
  onClose: () => void;
  /** @property {Partial<ViewMode>} [initialViewMode] - 뷰어의 초기 뷰 모드 설정. */
  initialViewMode?: Partial<ViewMode>;
  /** @property {boolean} [enableAdvancedFeatures=true] - 성능 최적화, 고급 분석 등 고급 기능 활성화 여부. */
  enableAdvancedFeatures?: boolean;
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
 * 로딩 상태를 표시하는 간단한 스피너 컴포넌트입니다.
 * @param {{text?: string}} props - 컴포넌트 props.
 * @returns {JSX.Element} 로딩 스피너 UI.
 */
const LoadingSpinner = ({ text = '로딩 중...' }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-3" />
    <p className="text-sm text-white/60 font-display">{text}</p>
  </div>
);

/**
 * 모든 기능을 통합한 최종 버전의 리플레이 뷰어 컴포넌트입니다.
 * 다양한 뷰 모드, 성능 최적화, 고급 분석, 내보내기, 반응형 UI 등 모든 기능을 갖추고 있습니다.
 * @param {UltimateReplayViewerProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 최종 리플레이 뷰어 UI.
 */
export function UltimateReplayViewer({
  gameReplay,
  onClose,
  initialViewMode = {},
  enableAdvancedFeatures = true
}: UltimateReplayViewerProps) {
  // --- State Management ---

  /** @state {ViewMode} viewMode - 레이아웃, 테마 등 UI의 전반적인 표시 모드를 관리합니다. */
  const [viewMode, setViewMode] = useState<ViewMode>({
    layout: 'standard',
    showSidebar: true,
    showAnalysis: true,
    showStats: false,
    boardSize: 'medium',
    theme: 'cosmic',
    ...initialViewMode
  });

  /** @state {number} currentMoveIndex - 현재 수의 인덱스. */
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  /** @state {boolean} isPlaying - 재생 중인지 여부. */
  const [isPlaying, setIsPlaying] = useState(false);
  /** @state {number} playbackSpeed - 재생 속도 배율. */
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  /** @state {boolean} showSettings - 설정 패널 표시 여부. */
  const [showSettings, setShowSettings] = useState(false);
  /** @state {boolean} showExporter - 내보내기 모달 표시 여부. */
  const [showExporter, setShowExporter] = useState(false);
  /** @state {boolean} isBookmarked - 리플레이 북마크 여부. */
  const [isBookmarked, setIsBookmarked] = useState(false);

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
  /** @state {boolean} showPerformanceMetrics - 성능 지표 오버레이 표시 여부. */
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);

  /** @state {boolean} isFullscreen - 전체 화면 모드 여부. */
  const [isFullscreen, setIsFullscreen] = useState(false);
  /** @state {boolean} showMobileControls - 모바일 전용 컨트롤 표시 여부. */
  const [showMobileControls, setShowMobileControls] = useState(false);
  /** @state {number | null} selectedMoveForAnalysis - 사용자가 보드에서 직접 클릭하여 선택한 수의 인덱스. */
  const [selectedMoveForAnalysis, setSelectedMoveForAnalysis] = useState<number | null>(null);

  // --- Hooks ---

  /**
   * 리플레이 데이터 처리 최적화를 위한 커스텀 훅입니다.
   * 가상 스크롤링, 성능 모니터링 등의 기능을 제공합니다.
   */
  const {
    optimizedMoves,
    optimizedBoardData,
    performanceMonitoring,
    virtualScrolling,
    memoryCleanup
  } = useReplayOptimizations(gameReplay, {
    enableVirtualScrolling: enableAdvancedFeatures,
    enablePerformanceMonitoring: enableAdvancedFeatures
  });

  /** 리플레이 사운드 효과를 관리하는 커스텀 훅입니다. */
  const { sounds, cleanup } = useReplaySounds({
    enabled: soundEnabled,
    volume: 0.3
  });

  // --- Memos ---

  /** 렌더링 시 사용할 안전한 8x8 빈 보드 상태를 memoization합니다. */
  const EMPTY_BOARD: Board = useMemo(
    () => Array.from({ length: 8 }, () => Array(8).fill(0) as Disc[]),
    []
  );

  /**
   * 게임의 모든 보드 상태를 재구성합니다.
   * `useReplayOptimizations` 훅에서 제공하는 최적화된 데이터가 있으면 사용하고,
   * 그렇지 않으면 `OthelloEngine`을 통해 직접 계산합니다.
   * @returns {{moves: Array, boardStates: Boards}}
   */
  const { moves, boardStates } = useMemo<{
    moves: Array<{ position: Position; player: Player; timestamp: number; capturedDiscs: Position[] }>;
    boardStates: Boards;
  }>(() => {
    // 최적화된 데이터가 있으면 사용
    if (enableAdvancedFeatures && optimizedBoardData) {
      const legacyMoves = convertMovesToLegacyFormat(gameReplay.moves);
      return {
        moves: legacyMoves,
        boardStates: optimizedBoardData.boardStates.map(state =>
          state.map(row => row.map(cell => cell as Disc))
        )
      };
    }

    // Fallback: 직접 계산
    const legacyMoves = convertMovesToLegacyFormat(gameReplay.moves);
    const engine = new OthelloEngine();
    const engineMoves = legacyMoves.map(m => ({ position: m.position, player: m.player }));
    let states: Boards = [];
    try {
      const s = (engine.reconstructGameFromMoves(engineMoves) || []) as Boards;
      states = Array.isArray(s) && s.length ? s : [];
    } catch {
      states = [];
    }
    return { moves: legacyMoves, boardStates: states };
  }, [gameReplay, optimizedBoardData, enableAdvancedFeatures]);

  /** 현재 `currentMoveIndex`에 해당하는 `boardStates` 배열의 인덱스를 계산합니다. */
  const boardIdx = useMemo(() => {
    const hasInitialState = boardStates.length === moves.length + 1;
    const idx = hasInitialState ? currentMoveIndex + 1 : currentMoveIndex;
    return Math.min(Math.max(idx, 0), Math.max(boardStates.length - 1, 0));
  }, [currentMoveIndex, boardStates.length, moves.length]);

  const board = boardStates[boardIdx] ?? EMPTY_BOARD;
  const currentMove = moves[currentMoveIndex];
  const currentGameMove = gameReplay.moves[currentMoveIndex];

  /** 평가 그래프 시각화를 위한 데이터를 생성합니다. */
  const evaluationData = useMemo(() =>
    generateEvaluationGraph(gameReplay.moves), [gameReplay.moves]
  );

  // --- Effects ---

  /** 화면 크기를 감지하여 모바일/태블릿 뷰를 결정하는 `useEffect` 훅입니다. */
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  /** 자동 재생 기능을 처리합니다. */
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
        if (soundEnabled) sounds.playMove();
        return next;
      });
    }, 1000 / playbackSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, currentMoveIndex, moves.length, playbackSpeed, soundEnabled, sounds]);

  /** '결정적인 수에서 자동 멈춤' 기능을 처리합니다. */
  useEffect(() => {
    if (criticalMoveDetection && isPlaying && currentGameMove) {
      const analysis = analyzeMoveQuality(currentGameMove);
      if (analysis?.shouldPause) {
        setIsPlaying(false);
        if (soundEnabled) sounds.criticalMove();
      } else if (analysis?.quality.severity === 'excellent' && soundEnabled) {
        sounds.excellentMove();
      }
    }
  }, [currentMoveIndex, criticalMoveDetection, isPlaying, currentGameMove, soundEnabled, sounds]);

  /** 다양한 키보드 단축키를 처리합니다. (재생, 탐색, 전체화면, 설정, 내보내기, 북마크 등) */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space': e.preventDefault(); isPlaying ? handlePause() : handlePlay(); break;
        case 'ArrowLeft': e.preventDefault(); handleStepBackward(); break;
        case 'ArrowRight': e.preventDefault(); handleStepForward(); break;
        case 'Home': e.preventDefault(); handleSeek(0); break;
        case 'End': e.preventDefault(); handleSeek(moves.length); break;
        case 'KeyF': e.preventDefault(); setIsFullscreen(prev => !prev); break;
        case 'KeyS': e.preventDefault(); setShowSettings(prev => !prev); break;
        case 'KeyE': e.preventDefault(); setShowExporter(true); break;
        case 'KeyB': e.preventDefault(); setIsBookmarked(prev => !prev); break;
        case 'Escape':
          e.preventDefault();
          if (isFullscreen) setIsFullscreen(false);
          else if (showSettings) setShowSettings(false);
          else if (showExporter) setShowExporter(false);
          else onClose();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isFullscreen, showSettings, showExporter, moves.length]);

  /** 컴포넌트 언마운트 시 오디오 컨텍스트를 정리합니다. */
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // --- Handlers ---

  /** 재생을 시작하고 성능 모니터링을 시작합니다. */
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    if (soundEnabled) sounds.playStart();
    if (performanceMonitoring) performanceMonitoring.startRenderTiming();
  }, [soundEnabled, sounds, performanceMonitoring]);

  /** 재생을 멈추고 성능 모니터링을 종료합니다. */
  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (soundEnabled) sounds.playPause();
    if (performanceMonitoring) performanceMonitoring.endRenderTiming();
  }, [soundEnabled, sounds, performanceMonitoring]);

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

  /** 뷰 모드(레이아웃, 테마 등)를 변경합니다. */
  const handleViewModeChange = useCallback((changes: Partial<ViewMode>) => {
    setViewMode(prev => ({ ...prev, ...changes }));
  }, []);

  /** 전체 화면 모드를 토글합니다. */
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, [isFullscreen]);

  const currentMoveNumber = moves.length > 0 ? currentMoveIndex + 1 : 0;
  const gameConfig = getGameModeConfig(gameReplay.gameMode);
  const playerResult = getPlayerResult(gameReplay);

  /** 성능 지표 오버레이를 렌더링합니다. */
  const performanceMetrics = useMemo(() => {
    if (!performanceMonitoring || !showPerformanceMetrics) return null;

    const suggestions = performanceMonitoring.getOptimizationSuggestions();
    const memory = performanceMonitoring.getMemoryUsage();

    return (
      <div className="fixed bottom-4 left-4 bg-black/80 backdrop-blur-md border border-white/20 rounded-lg p-3 text-xs font-mono z-[70]">
        <div className="text-white/80 mb-2">Performance Metrics:</div>
        <div className="text-white/60 space-y-1">
          <div>Render: {performanceMonitoring.metrics.renderTime.toFixed(1)}ms</div>
          <div>Frames: {performanceMonitoring.metrics.frameDrop} dropped</div>
          {memory && <div>Memory: {memory.used}MB/{memory.total}MB</div>}
        </div>
        {suggestions.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="text-yellow-300 text-xs">{suggestions[0]}</div>
          </div>
        )}
      </div>
    );
  }, [performanceMonitoring, showPerformanceMetrics]);

  /** 뷰 모드에 따라 보드 크기 CSS 클래스를 반환합니다. */
  const getBoardSizeClasses = () => {
    switch (viewMode.boardSize) {
      case 'small': return 'max-w-xs lg:max-w-sm';
      case 'large': return 'max-w-lg lg:max-w-xl';
      default: return 'max-w-sm lg:max-w-md';
    }
  };

  /** 뷰 모드와 전체 화면 상태에 따라 레이아웃 CSS 클래스를 반환합니다. */
  const getLayoutClasses = () => {
    if (isFullscreen) return 'fixed inset-0 z-[100]';
    if (viewMode.layout === 'theater') return 'fixed inset-0 z-50';
    return 'fixed inset-0 z-50';
  };

  return (
    <ReplayErrorBoundary
      enableReporting={enableAdvancedFeatures}
      fallback={<SimpleErrorFallback error={new Error('리플레이 뷰어 오류')} retry={onClose} />}
    >
      <div
        className={`${getLayoutClasses()} p-2 sm:p-4 bg-black/80 backdrop-blur-sm flex items-center justify-center`}
        role="dialog"
        aria-modal="true"
      >
        <div className={`w-full ${viewMode.layout === 'compact' ? 'max-w-4xl' : 'max-w-7xl'} h-[95vh] bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl
                         flex items-center justify-center hover:bg-white/20 transition-all flex-shrink-0"
                title="닫기 (Esc)"
              >
                <ChevronLeft size={20} className="text-white/90" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg sm:text-xl font-display font-bold text-white tracking-wider truncate">
                    🎮 Ultimate Replay
                  </h2>
                  <div className={`px-2 py-1 rounded-full text-xs font-display ${gameConfig.bgColor} ${gameConfig.color}`}>
                    {gameConfig.name}
                  </div>
                  {playerResult && (
                    <div className={`px-2 py-1 rounded-full text-xs font-display ${
                      playerResult === 'win' ? 'bg-green-400/10 text-green-400' :
                      playerResult === 'loss' ? 'bg-red-400/10 text-red-400' :
                      'bg-yellow-400/10 text-yellow-400'
                    }`}>
                      {playerResult === 'win' ? '승리' : playerResult === 'loss' ? '패배' : '무승부'}
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-white/60 font-display truncate">
                  vs {gameReplay.playerBlack.name === '우주의 오델로 수호자' ? gameReplay.playerWhite.name : gameReplay.playerBlack.name}
                  {' '}• {gameReplay.result.finalScore.black}-{gameReplay.result.finalScore.white}
                  {' '}• {formatDuration(gameReplay.gameInfo.duration)}
                </p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Bookmark */}
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-2 rounded-lg transition-colors ${
                  isBookmarked ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
                title="북마크 (B)"
              >
                {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              </button>

              {/* Export */}
              <button
                onClick={() => setShowExporter(true)}
                className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
                title="내보내기 (E)"
              >
                <Download size={16} />
              </button>

              {/* Share */}
              <button
                onClick={() => navigator.share?.({
                  title: `Othello Replay vs ${gameReplay.playerWhite.name}`,
                  url: window.location.href
                })}
                className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
                title="공유"
              >
                <Share2 size={16} />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
                title="전체화면 (F)"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              {/* Device Adaptation */}
              {isMobile && (
                <button
                  onClick={() => setShowMobileControls(!showMobileControls)}
                  className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors lg:hidden"
                  title="모바일 컨트롤"
                >
                  <Smartphone size={16} />
                </button>
              )}

              {/* Performance Metrics Toggle */}
              {enableAdvancedFeatures && performanceMonitoring && (
                <button
                  onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
                  className={`p-2 rounded-lg transition-colors ${
                    showPerformanceMetrics ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                  title="성능 지표"
                >
                  <Activity size={16} />
                </button>
              )}

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
                  <Suspense fallback={<LoadingSpinner text="그래프 로딩 중..." />}>
                    <ReplayEvaluationGraph
                      moves={gameReplay.moves}
                      currentMoveIndex={currentMoveIndex}
                      onMoveClick={handleJumpToMove}
                      height={isMobile ? 40 : 60}
                      className="rounded-lg"
                    />
                  </Suspense>
                </div>
              )}

              {/* Board Container */}
              <div className="flex-1 flex items-center justify-center">
                <div className={`relative w-full ${getBoardSizeClasses()}`}>
                  {/* Board */}
                  <div className="grid grid-cols-8 gap-1 p-3 sm:p-4
                                  bg-gradient-to-br from-green-800/20 to-green-600/20
                                  rounded-xl sm:rounded-2xl border border-white/10 aspect-square">
                    {board && board.length > 0 ? board.map((row, y) =>
                      row.map((disc, x) => {
                        const isLastMove = !!currentMove && currentMove.position.x === x && currentMove.position.y === y;
                        const isSelected = selectedMoveForAnalysis !== null &&
                          gameReplay.moves[selectedMoveForAnalysis]?.x === x &&
                          gameReplay.moves[selectedMoveForAnalysis]?.y === y;

                        return (
                          <div
                            key={`${x}-${y}`}
                            className={`aspect-square bg-green-600/30 border border-green-400/20 rounded-md sm:rounded-lg
                                        flex items-center justify-center transition-all duration-300 relative cursor-pointer
                                        ${isLastMove && highlightLastMove ? 'ring-2 ring-yellow-400 ring-opacity-80' : ''}
                                        ${isSelected ? 'ring-2 ring-blue-400 ring-opacity-80' : ''}
                                        hover:bg-green-600/40`}
                            onClick={() => {
                              const moveIndex = gameReplay.moves.findIndex(m => m.x === x && m.y === y);
                              if (moveIndex >= 0) {
                                setSelectedMoveForAnalysis(moveIndex);
                                handleJumpToMove(moveIndex);
                              }
                            }}
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
                                            ${isLastMove ? 'scale-110 shadow-yellow-400/50' : ''}
                                            ${isSelected ? 'scale-105 shadow-blue-400/50' : ''}`}
                              />
                            )}

                            {/* Move quality indicator */}
                            {enableAdvancedFeatures && gameReplay.moves.find(m => m.x === x && m.y === y) && (
                              <div className="absolute -top-1 -right-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  getMoveQualityColor(gameReplay.moves.find(m => m.x === x && m.y === y)?.evaluationScore)
                                }`} />
                              </div>
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
                          ({positionToAlgebraic(currentMove.position.x, currentMove.position.y)})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Board Size Controls */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleViewModeChange({ boardSize: 'small' })}
                      className={`p-1 rounded transition-colors ${
                        viewMode.boardSize === 'small' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                      }`}
                      title="작은 보드"
                    >
                      <ZoomOut size={12} />
                    </button>
                    <button
                      onClick={() => handleViewModeChange({ boardSize: 'medium' })}
                      className={`p-1 rounded transition-colors ${
                        viewMode.boardSize === 'medium' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                      }`}
                      title="보통 보드"
                    >
                      <Target size={12} />
                    </button>
                    <button
                      onClick={() => handleViewModeChange({ boardSize: 'large' })}
                      className={`p-1 rounded transition-colors ${
                        viewMode.boardSize === 'large' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                      }`}
                      title="큰 보드"
                    >
                      <ZoomIn size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Panel */}
            {viewMode.showSidebar && (
              <aside className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 p-3 sm:p-4 lg:p-6 overflow-y-auto min-h-0 max-h-60 lg:max-h-none">
                <div className="space-y-3 sm:space-y-4">
                  {/* Analysis Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-display font-bold text-white tracking-wider flex items-center gap-2">
                      <Brain size={18} className="text-purple-400" />
                      상세 분석
                    </h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleViewModeChange({ showStats: !viewMode.showStats })}
                        className={`p-1.5 rounded-lg transition-colors ${
                          viewMode.showStats ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/60'
                        }`}
                        title="통계 보기"
                      >
                        <BarChart3 size={14} />
                      </button>
                      <button
                        onClick={() => handleViewModeChange({ showSidebar: false })}
                        className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
                        title="패널 숨기기"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Statistics Panel */}
                  {viewMode.showStats && (
                    <Suspense fallback={<LoadingSpinner text="통계 로딩 중..." />}>
                      <ReplayStatistics replays={[gameReplay]} />
                    </Suspense>
                  )}

                  {/* Current Move Analysis */}
                  {showMoveAnnotations && currentGameMove && (
                    <Suspense fallback={<LoadingSpinner text="분석 로딩 중..." />}>
                      <ReplayMoveAnnotation
                        move={currentGameMove}
                        moveIndex={currentMoveIndex}
                        isCurrentMove={true}
                        showDetails={true}
                      />
                    </Suspense>
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
                      <div className="flex justify-between">
                        <span className="text-white/60 font-display">경과 시간</span>
                        <span className="text-white/90 font-display font-semibold">
                          {formatRelativeTime(gameReplay.gameInfo.startTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            )}

            {/* Show Sidebar Button (when hidden) */}
            {!viewMode.showSidebar && (
              <button
                onClick={() => handleViewModeChange({ showSidebar: true })}
                className="absolute top-1/2 right-4 -translate-y-1/2 w-8 h-16 bg-white/10 backdrop-blur-sm border border-white/20 rounded-l-lg flex items-center justify-center hover:bg-white/20 transition-all z-10"
                title="분석 패널 보기"
              >
                <ChevronLeft size={16} className="text-white/60 rotate-180" />
              </button>
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

        {/* Export Modal */}
        {showExporter && (
          <Suspense fallback={<LoadingSpinner text="내보내기 도구 로딩 중..." />}>
            <ReplayExporter
              replay={gameReplay}
              onClose={() => setShowExporter(false)}
            />
          </Suspense>
        )}

        {/* Performance Metrics */}
        {performanceMetrics}
      </div>
    </ReplayErrorBoundary>
  );
}