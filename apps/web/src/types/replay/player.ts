/**
 * Replay Player Domain - 리플레이 재생과 제어 관련 타입
 * 플레이어 컨트롤, 재생 상태, 시각화 옵션 등
 */

import type { GameRecord } from './record';

// === 리플레이 플레이어 상태 ===
export interface ReplayPlayerState {
  // 현재 재생 중인 리플레이
  currentReplay: GameRecord | null;

  // 재생 위치와 상태
  currentMoveIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;

  // 재생 설정
  playbackSpeed: PlaybackSpeed;
  autoPlay: boolean;
  loop: boolean;

  // 표시 옵션
  showAnalysis: boolean;
  showCoordinates: boolean;
  showMoveNumbers: boolean;
  highlightLastMove: boolean;
  showMoveAnnotations: boolean;

  // 고급 기능
  criticalMoveDetection: boolean;
  soundEnabled: boolean;
  keyboardShortcutsEnabled: boolean;
  miniMapEnabled: boolean;

  // 분석 표시
  showEvaluation: boolean;
  showBestMoves: boolean;
  showBlunders: boolean;
  evaluationDepth: number;
}

export type PlaybackSpeed = 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2 | 2.5 | 3 | 4 | 5;

// === 리플레이 플레이어 컨트롤 ===
export interface ReplayPlayerControls {
  // 기본 재생 컨트롤
  play: () => void;
  pause: () => void;
  stop: () => void;

  // 이동 컨트롤
  stepForward: () => void;
  stepBackward: () => void;
  jumpToMove: (moveIndex: number) => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;

  // 재생 설정
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  toggleAutoPlay: () => void;
  toggleLoop: () => void;

  // 표시 설정
  toggleAnalysis: () => void;
  toggleCoordinates: () => void;
  toggleMoveNumbers: () => void;
  toggleHighlight: () => void;
  toggleSound: () => void;

  // 고급 기능
  exportPosition: () => void;
  copyMoveNotation: () => void;
  addBookmark: (moveIndex: number) => void;
  shareReplay: () => void;
}

// === 이동 주석과 분석 표시 ===
export interface MoveAnnotation {
  moveNumber: number;
  text: string;
  type: 'comment' | 'evaluation' | 'variation' | 'book';
  author?: string;
  timestamp?: string;

  // 시각적 표시
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  icon?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface PositionEvaluation {
  moveNumber: number;
  evaluation: number; // -100 to +100
  depth: number;
  bestMove?: { x: number; y: number };
  principalVariation?: { x: number; y: number }[];

  // 분류
  category: 'book' | 'opening' | 'midgame' | 'endgame' | 'winning' | 'losing' | 'equal';
  confidence: number; // 0-100
}

// === 북마크와 하이라이트 ===
export interface ReplayBookmark {
  id: string;
  replayId: string;
  moveNumber: number;
  title: string;
  description?: string;
  color?: string;
  createdAt: string;

  // 분류
  category: 'critical' | 'brilliant' | 'blunder' | 'learning' | 'custom';
  isPublic: boolean;
}

export interface MoveHighlight {
  moveNumber: number;
  type: 'best' | 'blunder' | 'interesting' | 'critical' | 'book' | 'custom';
  intensity: 'low' | 'medium' | 'high';
  color?: string;
  description?: string;
}

// === 사운드와 효과 ===
export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0-100

  // 사운드 종류별 설정
  moveSounds: boolean;
  captureSounds: boolean;
  analysisAlerts: boolean;
  endGameSound: boolean;

  // 커스텀 사운드
  soundPack: 'default' | 'wooden' | 'digital' | 'vintage' | 'custom';
  customSounds?: {
    [key: string]: string; // sound name -> URL
  };
}

export interface VisualEffects {
  animations: boolean;
  particleEffects: boolean;
  glowEffects: boolean;
  trailEffects: boolean;

  // 애니메이션 설정
  moveAnimation: 'none' | 'slide' | 'fade' | 'bounce';
  captureAnimation: 'none' | 'flip' | 'dissolve' | 'burst';
  duration: number; // milliseconds

  // 하이라이트 효과
  lastMoveHighlight: boolean;
  possibleMovesHint: boolean;
  capturedPiecesEffect: boolean;
}

// === 키보드 단축키 ===
export interface KeyboardShortcuts {
  enabled: boolean;

  shortcuts: {
    play: string; // 'Space'
    stepForward: string; // 'ArrowRight'
    stepBackward: string; // 'ArrowLeft'
    jumpToStart: string; // 'Home'
    jumpToEnd: string; // 'End'
    toggleAnalysis: string; // 'A'
    toggleCoordinates: string; // 'C'
    speedUp: string; // 'Plus'
    slowDown: string; // 'Minus'
    addBookmark: string; // 'B'
    exportPosition: string; // 'E'
    fullscreen: string; // 'F'
  };

  // 커스텀 단축키
  customShortcuts?: {
    [action: string]: string;
  };
}

// === 리플레이 플레이어 이벤트 ===
export interface ReplayPlayerEvents {
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onMoveChange: (moveIndex: number) => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onAnalysisToggle: (enabled: boolean) => void;
  onBookmarkAdd: (bookmark: ReplayBookmark) => void;
  onError: (error: string) => void;
  onLoadComplete: (replay: GameRecord) => void;
  onExit: () => void;
}

// === 미니맵과 네비게이션 ===
export interface MiniMap {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size: 'small' | 'medium' | 'large';

  // 표시 옵션
  showMoveNumbers: boolean;
  showEvaluation: boolean;
  showCriticalMoves: boolean;

  // 상호작용
  clickToJump: boolean;
  dragToSeek: boolean;
  wheelToZoom: boolean;
}

export interface ProgressBar {
  enabled: boolean;
  showThumbnails: boolean;
  showMarkers: boolean; // 중요한 순간들 표시

  // 마커 종류
  markers: {
    criticalMoves: boolean;
    blunders: boolean;
    bookmarks: boolean;
    phaseTransitions: boolean; // opening -> midgame -> endgame
  };
}

// === 플레이어 설정 ===
export interface ReplayPlayerSettings {
  // 기본 설정
  playback: {
    defaultSpeed: PlaybackSpeed;
    autoPlayOnLoad: boolean;
    loopByDefault: boolean;
    stepThroughAnnotations: boolean;
  };

  // 표시 설정
  display: {
    showAnalysisByDefault: boolean;
    showCoordinates: boolean;
    showMoveNumbers: boolean;
    highlightLastMove: boolean;
    evaluationStyle: 'bar' | 'number' | 'color' | 'none';
  };

  // 오디오/비주얼
  effects: {
    sound: SoundSettings;
    visual: VisualEffects;
    keyboard: KeyboardShortcuts;
  };

  // 레이아웃
  layout: {
    miniMap: MiniMap;
    progressBar: ProgressBar;
    sidePanel: 'left' | 'right' | 'bottom' | 'hidden';
    showToolbar: boolean;
  };
}

// === 타입 가드 함수들 ===
export const isValidPlaybackSpeed = (speed: number): speed is PlaybackSpeed => {
  const validSpeeds: PlaybackSpeed[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5];
  return validSpeeds.includes(speed as PlaybackSpeed);
};

export const isValidMoveIndex = (index: number, replay: GameRecord): boolean => {
  return index >= 0 && index <= replay.moves.length;
};

export const hasBookmarks = (bookmarks: ReplayBookmark[], replayId: string): boolean => {
  return bookmarks.some(b => b.replayId === replayId);
};

// === 유틸리티 타입들 ===
export type PlayerControlAction = keyof ReplayPlayerControls;
export type DisplayOption = keyof ReplayPlayerSettings['display'];
export type EffectOption = keyof VisualEffects;