import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Settings,
  Eye,
  EyeOff,
  Target,
  Zap,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Brain,
  Keyboard,
  Hash,
  FastForward,
  Rewind
} from 'lucide-react';
import { ReplayPlayerControls, GameMove } from '../../../types/replay';

/**
 * @interface ReplayControlsProps
 * `ReplayControls` 컴포넌트의 props를 정의합니다.
 * 기본 재생 제어 기능과 다양한 고급 기능을 포함합니다.
 */
interface ReplayControlsProps {
  // --- 기본 제어 Props ---
  /** @property {number} currentMoveIndex 현재 리플레이의 수 인덱스 (0부터 시작). */
  currentMoveIndex: number;
  /** @property {number} totalMoves 리플레이의 총 수. */
  totalMoves: number;
  /** @property {boolean} isPlaying 현재 재생 중인지 여부. */
  isPlaying: boolean;
  /** @property {number} playbackSpeed 현재 재생 속도 배율. */
  playbackSpeed: number;
  /** @property {() => void} onPlay 재생 시작 시 호출될 콜백. */
  onPlay: () => void;
  /** @property {() => void} onPause 일시정지 시 호출될 콜백. */
  onPause: () => void;
  /** @property {() => void} onStepForward 한 수 앞으로 이동 시 호출될 콜백. */
  onStepForward: () => void;
  /** @property {() => void} onStepBackward 한 수 뒤로 이동 시 호출될 콜백. */
  onStepBackward: () => void;
  /** @property {(index: number) => void} onSeek 특정 수 인덱스로 이동 시 호출될 콜백. */
  onSeek: (index: number) => void;
  /** @property {(speed: number) => void} onSpeedChange 재생 속도 변경 시 호출될 콜백. */
  onSpeedChange: (speed: number) => void;

  // --- 설정 및 UI 상태 Props ---
  /** @property {() => void} onToggleSettings 설정 패널 표시/숨김 토글 콜백. */
  onToggleSettings: () => void;
  /** @property {boolean} showSettings 설정 패널이 현재 표시되는지 여부. */
  showSettings: boolean;
  /** @property {() => void} onToggleCoordinates 좌표 표시/숨김 토글 콜백. */
  onToggleCoordinates: () => void;
  /** @property {() => void} onToggleHighlight 마지막 수 강조 표시/숨김 토글 콜백. */
  onToggleHighlight: () => void;
  /** @property {boolean} showCoordinates 좌표가 현재 표시되는지 여부. */
  showCoordinates: boolean;
  /** @property {boolean} highlightLastMove 마지막 수가 현재 강조되는지 여부. */
  highlightLastMove: boolean;

  // --- 고급 기능 Props (선택적) ---
  /** @property {GameMove[]} [moves] 게임의 모든 수에 대한 데이터 배열. 수 분석에 사용됩니다. */
  moves?: GameMove[];
  /** @property {boolean} [autoPlay] 자동 재생 기능 활성화 여부. */
  autoPlay?: boolean;
  /** @property {() => void} [onToggleAutoPlay] 자동 재생 토글 콜백. */
  onToggleAutoPlay?: () => void;
  /** @property {(moveNumber: number) => void} [onJumpToMove] 특정 수 번호로 점프하는 콜백. */
  onJumpToMove?: (moveNumber: number) => void;
  /** @property {boolean} [showMoveAnnotations] 수 해설/분석 표시 여부. */
  showMoveAnnotations?: boolean;
  /** @property {() => void} [onToggleMoveAnnotations] 수 해설 표시 토글 콜백. */
  onToggleMoveAnnotations?: () => void;
  /** @property {boolean} [criticalMoveDetection] 결정적인 수(실수, 최적수)에서 자동 멈춤 기능 활성화 여부. */
  criticalMoveDetection?: boolean;
  /** @property {() => void} [onToggleCriticalMoves] 결정적인 수 감지 기능 토글 콜백. */
  onToggleCriticalMoves?: () => void;
  /** @property {boolean} [soundEnabled] 효과음 활성화 여부. */
  soundEnabled?: boolean;
  /** @property {() => void} [onToggleSound] 효과음 토글 콜백. */
  onToggleSound?: () => void;
  /** @property {number[]} [evaluationData] 각 수에 대한 평가 점수 배열. 프로그레스 바 시각화에 사용됩니다. */
  evaluationData?: number[];
}

/**
 * 게임 리플레이를 위한 종합 컨트롤러 컴포넌트입니다.
 * 재생/정지, 탐색, 속도 조절 등 기본 기능과 함께
 * 키보드 단축키, 설정 패널, 수 이동, 고급 분석 기능 등 다양한 UI를 제공합니다.
 * @param {ReplayControlsProps} props - 컴포넌트 props
 * @returns {JSX.Element} 리플레이 컨트롤러 UI
 */
export function ReplayControls({
  currentMoveIndex,
  totalMoves,
  isPlaying,
  playbackSpeed,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onSeek,
  onSpeedChange,
  onToggleSettings,
  showSettings,
  onToggleCoordinates,
  onToggleHighlight,
  showCoordinates,
  highlightLastMove,
  // Enhanced features
  moves = [],
  autoPlay = false,
  onToggleAutoPlay,
  onJumpToMove,
  showMoveAnnotations = true,
  onToggleMoveAnnotations,
  criticalMoveDetection = true,
  onToggleCriticalMoves,
  soundEnabled = false,
  onToggleSound,
  evaluationData = []
}: ReplayControlsProps) {

  // 재생 속도 옵션 배열
  const speedOptions: number[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4];

  // --- 상태(State) 및 참조(Ref) ---
  /** @state {boolean} showJumpDialog - '수 번호로 이동' 다이얼로그 표시 여부 */
  const [showJumpDialog, setShowJumpDialog] = useState(false);
  /** @state {string} jumpValue - '수 번호로 이동' 다이얼로그의 입력 값 */
  const [jumpValue, setJumpValue] = useState('');
  /** @state {boolean} showKeyboardHelp - 키보드 단축키 도움말 표시 여부 */
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  /** @ref {HTMLInputElement} jumpInputRef - '수 번호로 이동' 다이얼로그의 input 요소에 대한 참조 */
  const jumpInputRef = useRef<HTMLInputElement>(null);

  // Auto-play interval management (현재는 직접 사용되지 않지만, 향후 확장성을 위해 유지)
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 프로그레스 바(seek bar)의 변경 이벤트를 처리합니다.
   * @param {React.ChangeEvent<HTMLInputElement>} e - 입력 요소의 변경 이벤트
   */
  const handleSeekBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    onSeek(value);
  };

  /**
   * '수 번호로 이동' 다이얼로그에서 이동 버튼 클릭을 처리합니다.
   * 입력된 수 번호로 리플레이를 이동시킵니다.
   */
  const handleJumpToMove = useCallback(() => {
    const moveNumber = parseInt(jumpValue);
    if (moveNumber >= 1 && moveNumber <= totalMoves && onJumpToMove) {
      onJumpToMove(moveNumber - 1); // 0-based 인덱스로 변환하여 전달
      setShowJumpDialog(false);
      setJumpValue('');
    }
  }, [jumpValue, totalMoves, onJumpToMove]);

  /**
   * 현재 수 인덱스에 해당하는 수 정보를 반환합니다.
   * @returns {GameMove | undefined} 현재 수 정보
   */
  const getCurrentMove = useCallback(() => {
    return moves[currentMoveIndex];
  }, [moves, currentMoveIndex]);

  /**
   * 주어진 수의 평가 점수를 기반으로 품질(최적수, 실수 등) 정보를 반환합니다.
   * @param {GameMove} [move] - 분석할 수 정보
   * @returns {{label: string, color: string, bgColor: string, icon: React.ElementType} | null} 수 품질 정보 객체 또는 null
   */
  const getMoveQuality = useCallback((move?: GameMove) => {
    if (!move || move.evaluationScore === undefined) return null;

    if (move.isOptimal) {
      return { label: '최적수', color: 'text-green-400', bgColor: 'bg-green-400/20', icon: CheckCircle };
    } else if (move.evaluationScore > 10) {
      return { label: '좋은 수', color: 'text-blue-400', bgColor: 'bg-blue-400/20', icon: TrendingUp };
    } else if (move.evaluationScore < -20) {
      return { label: '실수', color: 'text-red-400', bgColor: 'bg-red-400/20', icon: AlertTriangle };
    } else if (move.evaluationScore < -10) {
      return { label: '부정확', color: 'text-yellow-400', bgColor: 'bg-yellow-400/20', icon: AlertTriangle };
    }
    return { label: '평균', color: 'text-white/70', bgColor: 'bg-white/10', icon: Target };
  }, []);

  /**
   * 주어진 수가 결정적인 수(최적수 또는 큰 실수)인지 확인합니다.
   * @param {GameMove} [move] - 확인할 수 정보
   * @returns {boolean} 결정적인 수인 경우 true
   */
  const isCriticalMove = useCallback((move?: GameMove) => {
    if (!move || move.evaluationScore === undefined) return false;
    return move.isOptimal || move.evaluationScore < -20; // 최적수 또는 큰 실수
  }, []);

  /**
   * 키보드 단축키를 처리하는 `useEffect` 훅입니다.
   * Space: 재생/일시정지, ←/→: 이전/다음 수, Home/End: 처음/끝, J: 수 이동, S: 설정, H: 도움말
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있을 때는 단축키를 비활성화합니다.
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (isPlaying) onPause();
          else onPlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onStepBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onStepForward();
          break;
        case 'Home':
          e.preventDefault();
          onSeek(0);
          break;
        case 'End':
          e.preventDefault();
          onSeek(totalMoves);
          break;
        case 'KeyJ':
          e.preventDefault();
          setShowJumpDialog(true);
          break;
        case 'KeyS':
          e.preventDefault();
          onToggleSettings();
          break;
        case 'KeyH':
        case 'F1':
          e.preventDefault();
          setShowKeyboardHelp(true);
          break;
        case 'Escape':
          if (showJumpDialog) setShowJumpDialog(false);
          if (showKeyboardHelp) setShowKeyboardHelp(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, onPlay, onPause, onStepBackward, onStepForward, onSeek, onToggleSettings, totalMoves, showJumpDialog, showKeyboardHelp]);

  /**
   * '수 번호로 이동' 다이얼로그가 열릴 때 input 필드에 자동으로 포커스를 줍니다.
   */
  useEffect(() => {
    if (showJumpDialog && jumpInputRef.current) {
      jumpInputRef.current.focus();
    }
  }, [showJumpDialog]);

  /**
   * '결정적인 수에서 자동 멈춤' 기능을 처리하는 `useEffect` 훅입니다.
   * 재생 중에 결정적인 수를 만나면 자동으로 일시정지합니다.
   */
  useEffect(() => {
    if (criticalMoveDetection && isPlaying) {
      const currentMove = getCurrentMove();
      if (currentMove && isCriticalMove(currentMove)) {
        onPause();
        // TODO: 효과음이 활성화된 경우, 알림 소리를 재생하는 로직 추가 가능
        if (soundEnabled) {
          // Play critical move sound
        }
      }
    }
  }, [currentMoveIndex, criticalMoveDetection, isPlaying, onPause, getCurrentMove, isCriticalMove, soundEnabled]);

  /**
   * 현재 수/총 수 형식의 문자열을 반환합니다. (예: "5 / 64")
   * @returns {string}
   */
  const formatMoveDisplay = () => {
    return `${currentMoveIndex} / ${totalMoves}`;
  };

  /**
   * 재생 속도를 표시용 문자열로 변환합니다. (예: "2×")
   * @param {number} speed - 재생 속도
   * @returns {string}
   */
  const getSpeedDisplay = (speed: number) => {
    return speed === 1 ? '1×' : `${speed}×`;
  };

  /**
   * 현재 수의 평가 점수에 따라 프로그레스 바의 그라데이션 색상을 결정합니다.
   * @returns {string} Tailwind CSS 그라데이션 클래스 문자열
   */
  const getProgressBarGradient = () => {
    if (!evaluationData.length) {
      return 'from-purple-400 to-blue-400'; // 기본 색상
    }

    // 현재 위치의 평가 점수에 따라 색상 변경
    const currentEval = evaluationData[currentMoveIndex] || 0;
    if (currentEval > 20) return 'from-green-400 to-green-300'; // 유리
    if (currentEval < -20) return 'from-red-400 to-red-300';   // 불리 (큰 실수)
    if (currentEval < -10) return 'from-yellow-400 to-yellow-300'; // 약간 불리
    return 'from-blue-400 to-blue-300'; // 보통
  };

  return (
    <div className="p-3 sm:p-4 relative">
      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black/70 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white font-display flex items-center gap-2">
                <Keyboard size={18} />
                키보드 단축키
              </h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">스페이스</span>
                <span className="text-white/90">재생/일시정지</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">← →</span>
                <span className="text-white/90">이전/다음 수</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Home/End</span>
                <span className="text-white/90">처음/끝으로</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">J</span>
                <span className="text-white/90">특정 수로 이동</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">S</span>
                <span className="text-white/90">설정 토글</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">H / F1</span>
                <span className="text-white/90">단축키 도움말</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Jump to Move Modal */}
      {showJumpDialog && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black/70 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-6 max-w-xs sm:max-w-sm w-full">
            <div className="flex items-center gap-2 mb-4">
              <Hash size={18} className="text-purple-400" />
              <h3 className="text-base sm:text-lg font-semibold text-white font-display">
                수 번호로 이동
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <input
                  ref={jumpInputRef}
                  type="number"
                  min="1"
                  max={totalMoves}
                  value={jumpValue}
                  onChange={(e) => setJumpValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJumpToMove();
                    if (e.key === 'Escape') setShowJumpDialog(false);
                  }}
                  placeholder={`1-${totalMoves}`}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-purple-400 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleJumpToMove}
                  disabled={!jumpValue || parseInt(jumpValue) < 1 || parseInt(jumpValue) > totalMoves}
                  className="flex-1 py-2 bg-purple-500/20 border border-purple-400/30 text-purple-300 rounded-lg hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  이동
                </button>
                <button
                  onClick={() => setShowJumpDialog(false)}
                  className="px-4 py-2 bg-white/10 border border-white/20 text-white/70 rounded-lg hover:bg-white/20 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
          <h4 className="text-sm font-semibold text-white/90 mb-3 font-display">재생 설정</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Display Options */}
            <div>
              <h5 className="text-xs font-medium text-white/70 mb-2 font-display">표시 옵션</h5>
              <div className="space-y-2">
                <button
                  onClick={onToggleCoordinates}
                  className={`w-full p-2 rounded-lg border transition-all duration-200 ${
                    showCoordinates
                      ? 'bg-blue-500/20 border-blue-400/30 text-blue-300'
                      : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <Eye size={12} />
                    <span className="font-display">좌표 표시</span>
                  </div>
                </button>

                <button
                  onClick={onToggleHighlight}
                  className={`w-full p-2 rounded-lg border transition-all duration-200 ${
                    highlightLastMove
                      ? 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300'
                      : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <Target size={12} />
                    <span className="font-display">마지막 수 강조</span>
                  </div>
                </button>

                {onToggleMoveAnnotations && (
                  <button
                    onClick={onToggleMoveAnnotations}
                    className={`w-full p-2 rounded-lg border transition-all duration-200 ${
                      showMoveAnnotations
                        ? 'bg-purple-500/20 border-purple-400/30 text-purple-300'
                        : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <Brain size={12} />
                      <span className="font-display">수 해설</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Options */}
            <div>
              <h5 className="text-xs font-medium text-white/70 mb-2 font-display">고급 설정</h5>
              <div className="space-y-2">
                {onToggleAutoPlay && (
                  <button
                    onClick={onToggleAutoPlay}
                    className={`w-full p-2 rounded-lg border transition-all duration-200 ${
                      autoPlay
                        ? 'bg-green-500/20 border-green-400/30 text-green-300'
                        : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <Play size={12} />
                      <span className="font-display">자동 재생</span>
                    </div>
                  </button>
                )}

                {onToggleCriticalMoves && (
                  <button
                    onClick={onToggleCriticalMoves}
                    className={`w-full p-2 rounded-lg border transition-all duration-200 ${
                      criticalMoveDetection
                        ? 'bg-orange-500/20 border-orange-400/30 text-orange-300'
                        : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <AlertTriangle size={12} />
                      <span className="font-display">중요 수 감지</span>
                    </div>
                  </button>
                )}

                {onToggleSound && (
                  <button
                    onClick={onToggleSound}
                    className={`w-full p-2 rounded-lg border transition-all duration-200 ${
                      soundEnabled
                        ? 'bg-cyan-500/20 border-cyan-400/30 text-cyan-300'
                        : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                      <span className="font-display">효과음</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Speed Settings */}
            <div className="sm:col-span-2">
              <h5 className="text-xs font-medium text-white/70 mb-2 font-display">재생 속도</h5>
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-1">
                {speedOptions.slice(0, 6).map(speed => (
                  <button
                    key={speed}
                    onClick={() => onSpeedChange(speed)}
                    className={`p-1.5 sm:p-2 rounded-lg border transition-all duration-200 ${
                      playbackSpeed === speed
                        ? 'bg-purple-500/20 border-purple-400/30 text-purple-300'
                        : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30'
                    }`}
                  >
                    <div className="text-xs font-display">{getSpeedDisplay(speed)}</div>
                  </button>
                ))}
              </div>
              {speedOptions.length > 6 && (
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {speedOptions.slice(6).map(speed => (
                    <button
                      key={speed}
                      onClick={() => onSpeedChange(speed)}
                      className={`p-1.5 sm:p-2 rounded-lg border transition-all duration-200 ${
                        playbackSpeed === speed
                          ? 'bg-purple-500/20 border-purple-400/30 text-purple-300'
                          : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30'
                      }`}
                    >
                      <div className="text-xs font-display">{getSpeedDisplay(speed)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        {/* Step Controls */}
        <div className="flex items-center justify-center gap-1 order-2 sm:order-1">
          <button
            onClick={() => onSeek(0)}
            disabled={currentMoveIndex <= 0}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
            title="처음으로 (Home)"
          >
            <SkipBack size={18} className="text-white/80" />
          </button>

          <button
            onClick={() => {
              const targetIndex = Math.max(0, currentMoveIndex - 10);
              onSeek(targetIndex);
            }}
            disabled={currentMoveIndex <= 0}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
            title="10수 뒤로"
          >
            <Rewind size={16} className="text-white/80" />
          </button>

          <button
            onClick={onStepBackward}
            disabled={currentMoveIndex <= 0}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
            title="이전 수 (←)"
          >
            <ChevronLeft size={18} className="text-white/80" />
          </button>
        </div>

        {/* Play/Pause */}
        <div className="flex justify-center order-1 sm:order-2">
          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={currentMoveIndex >= totalMoves}
            className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500
                     hover:from-purple-600 hover:to-blue-600 active:scale-95
                     transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-lg shadow-purple-500/25"
            title={isPlaying ? '일시정지 (Space)' : '재생 (Space)'}
          >
            {isPlaying ? (
              <Pause size={20} className="text-white" />
            ) : (
              <Play size={20} className="text-white ml-1" />
            )}
          </button>
        </div>

        {/* Step Forward Controls */}
        <div className="flex items-center justify-center gap-1 order-3">
          <button
            onClick={onStepForward}
            disabled={currentMoveIndex >= totalMoves}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
            title="다음 수 (→)"
          >
            <ChevronRight size={18} className="text-white/80" />
          </button>

          <button
            onClick={() => {
              const targetIndex = Math.min(totalMoves, currentMoveIndex + 10);
              onSeek(targetIndex);
            }}
            disabled={currentMoveIndex >= totalMoves}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
            title="10수 앞으로"
          >
            <FastForward size={16} className="text-white/80" />
          </button>

          <button
            onClick={() => onSeek(totalMoves)}
            disabled={currentMoveIndex >= totalMoves}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors
                     disabled:opacity-30 disabled:cursor-not-allowed"
            title="마지막으로 (End)"
          >
            <SkipForward size={18} className="text-white/80" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 mx-2 sm:mx-4 order-4 sm:order-4">
          <div className="relative">
            <input
              type="range"
              min={0}
              max={totalMoves}
              value={currentMoveIndex}
              onChange={handleSeekBarChange}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-gradient-to-r
                       [&::-webkit-slider-thumb]:from-purple-400 [&::-webkit-slider-thumb]:to-blue-400
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg
                       [&::-webkit-slider-thumb]:shadow-purple-500/25 hover:[&::-webkit-slider-thumb]:scale-110
                       [&::-webkit-slider-thumb]:transition-transform"
            />

            {/* Progress fill with dynamic coloring */}
            <div
              className={`absolute top-0 left-0 h-2 bg-gradient-to-r ${getProgressBarGradient()}
                       rounded-lg transition-all duration-200 pointer-events-none`}
              style={{ width: `${(currentMoveIndex / totalMoves) * 100}%` }}
            />

            {/* Move quality indicators on progress bar */}
            {moves.length > 0 && evaluationData.length > 0 && (
              <div className="absolute top-0 left-0 w-full h-2 pointer-events-none">
                {moves.map((move, index) => {
                  const quality = getMoveQuality(move);
                  if (!quality || !move.evaluationScore) return null;

                  const position = (index / totalMoves) * 100;
                  const isBlunder = move.evaluationScore < -20;
                  const isExcellent = move.isOptimal;

                  if (!isBlunder && !isExcellent) return null;

                  return (
                    <div
                      key={index}
                      className={`absolute w-1 h-2 rounded-full ${
                        isExcellent ? 'bg-green-400' : 'bg-red-400'
                      }`}
                      style={{ left: `${position}%` }}
                      title={`${index + 1}수: ${quality.label}`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between mt-1 gap-1 sm:gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60 font-display">
                {formatMoveDisplay()}
              </span>
              {/* Current move quality indicator */}
              {(() => {
                const currentMove = getCurrentMove();
                const quality = getMoveQuality(currentMove);
                if (!quality) return null;

                const Icon = quality.icon;
                return (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${quality.bgColor} ${quality.color}`}>
                    <Icon size={10} />
                    <span className="font-display">{quality.label}</span>
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center gap-2">
              {soundEnabled && (
                <Volume2 size={12} className="text-cyan-400" />
              )}
              {autoPlay && (
                <Play size={12} className="text-green-400" />
              )}
              <span className="text-xs text-white/60 font-display">
                {getSpeedDisplay(playbackSpeed)}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Controls */}
        <div className="flex items-center justify-center gap-1 order-5">
          {/* Jump to Move */}
          <button
            onClick={() => setShowJumpDialog(true)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60"
            title="수 번호로 이동 (J)"
          >
            <Hash size={16} />
          </button>

          {/* Keyboard Help */}
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60"
            title="키보드 단축키 (H)"
          >
            <Keyboard size={16} />
          </button>

          {/* Settings Toggle */}
          <button
            onClick={onToggleSettings}
            className={`p-2 rounded-lg transition-colors ${
              showSettings
                ? 'bg-white/20 text-white/90'
                : 'hover:bg-white/10 text-white/60'
            }`}
            title="설정 (S)"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}