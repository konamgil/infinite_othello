/**
 * UI State Domain - 사용자 인터페이스 상태 관리 타입
 * 앱 설정, 테마, 레이아웃, 컴포넌트 상태 등
 */

import type { GameReplay, ReplayFilters, ReplaySortOptions, ReplayPlayerControls } from '../replay';

// === 앱 전역 설정 ===
export interface AppSettings {
  // 테마와 외관
  theme: ThemeMode;
  colorScheme: ColorScheme;
  boardTheme: BoardTheme;
  pieceSet: PieceSet;

  // 언어와 지역화
  language: SupportedLanguage;
  region: string;
  dateFormat: DateFormat;
  numberFormat: NumberFormat;

  // 게임 설정
  gameSettings: GameUISettings;

  // 접근성
  accessibility: AccessibilitySettings;

  // 성능
  performance: PerformanceSettings;

  // 개인화
  customization: CustomizationSettings;
}

export type ThemeMode = 'light' | 'dark' | 'system' | 'auto';
export type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'custom';
export type BoardTheme = 'classic' | 'modern' | 'neon' | 'wooden' | 'glass' | 'space';
export type PieceSet = 'classic' | 'modern' | 'minimal' | 'emoji' | 'custom';
export type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh';
export type DateFormat = 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'relative';
export type NumberFormat = 'decimal' | 'comma' | 'space' | 'local';

// === 게임 UI 설정 ===
export interface GameUISettings {
  // 보드 표시
  showCoordinates: boolean;
  showMoveNumbers: boolean;
  showValidMoves: boolean;
  showLastMove: boolean;
  showCapturePreview: boolean;

  // 애니메이션
  enableAnimations: boolean;
  animationSpeed: AnimationSpeed;
  moveAnimation: MoveAnimationType;
  captureAnimation: CaptureAnimationType;

  // 사운드
  soundEnabled: boolean;
  soundVolume: number; // 0-100
  moveSounds: boolean;
  captureSounds: boolean;
  uiSounds: boolean;

  // 햅틱 피드백
  hapticsEnabled: boolean;
  hapticsIntensity: 'light' | 'medium' | 'strong';

  // 게임 도움말
  showHints: boolean;
  showAnalysis: boolean;
  showEvaluation: boolean;
  autoAnalyze: boolean;
}

export type AnimationSpeed = 'slow' | 'normal' | 'fast' | 'instant';
export type MoveAnimationType = 'none' | 'slide' | 'fade' | 'zoom' | 'bounce';
export type CaptureAnimationType = 'none' | 'flip' | 'dissolve' | 'burst' | 'ripple';

// === 접근성 설정 ===
export interface AccessibilitySettings {
  // 시각적 접근성
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  colorBlindSupport: boolean;

  // 청각적 접근성
  visualIndicators: boolean; // 소리 대신 시각적 표시
  soundDescriptions: boolean;

  // 조작 접근성
  keyboardNavigation: boolean;
  keyboardShortcuts: KeyboardShortcuts;
  mouseSettings: MouseSettings;
  touchSettings: TouchSettings;

  // 인지적 접근성
  simplifiedUI: boolean;
  autoSave: boolean;
  confirmActions: boolean;
  timeWarnings: boolean;
}

export interface KeyboardShortcuts {
  enabled: boolean;
  shortcuts: {
    [action: string]: string; // action -> key combination
  };
}

export interface MouseSettings {
  doubleClickSpeed: number;
  dragThreshold: number;
  rightClickActions: boolean;
}

export interface TouchSettings {
  tapThreshold: number;
  longPressDelay: number;
  swipeThreshold: number;
  multiTouch: boolean;
}

// === 성능 설정 ===
export interface PerformanceSettings {
  // 렌더링
  enableGPUAcceleration: boolean;
  maxFrameRate: number; // 30, 60, 120, unlimited
  antiAliasing: boolean;
  textureQuality: 'low' | 'medium' | 'high' | 'ultra';

  // 메모리 관리
  cacheSize: number; // MB
  preloadImages: boolean;
  preloadSounds: boolean;
  backgroundProcessing: boolean;

  // 네트워크
  prefetchData: boolean;
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
  offlineMode: boolean;
}

// === 커스터마이제이션 설정 ===
export interface CustomizationSettings {
  // 레이아웃
  layout: LayoutSettings;

  // 커스텀 스타일
  customColors: CustomColorSettings;
  customFonts: CustomFontSettings;

  // 위젯과 패널
  widgets: WidgetSettings;
  panels: PanelSettings;

  // 개인화된 콘텐츠
  favorites: string[]; // IDs of favorite items
  bookmarks: string[]; // IDs of bookmarked items
  hiddenFeatures: string[]; // Features to hide
}

export interface LayoutSettings {
  sidebarPosition: 'left' | 'right' | 'hidden';
  toolbarPosition: 'top' | 'bottom' | 'hidden';
  panelLayout: 'tabs' | 'accordion' | 'floating';
  density: 'compact' | 'normal' | 'spacious';
}

export interface CustomColorSettings {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  border: string;
}

export interface CustomFontSettings {
  family: string;
  size: number;
  weight: number;
  lineHeight: number;
}

export interface WidgetSettings {
  enabled: string[]; // widget IDs
  positions: { [widgetId: string]: { x: number; y: number } };
  sizes: { [widgetId: string]: { width: number; height: number } };
  order: string[]; // widget IDs in display order
}

export interface PanelSettings {
  visible: string[]; // panel IDs
  collapsed: string[]; // collapsed panel IDs
  pinned: string[]; // pinned panel IDs
  sizes: { [panelId: string]: number }; // panel sizes
}

// === 페이지별 UI 상태 ===
export interface HomePageState {
  activeSection: 'recent' | 'stats' | 'achievements' | 'news';
  showWelcome: boolean;
  recentGamesCount: number;
  quickActions: string[];
}

export interface GamePageState {
  boardSize: number;
  showSidebar: boolean;
  sidebarContent: 'moves' | 'analysis' | 'chat' | 'settings';
  fullscreen: boolean;
  overlays: string[]; // active overlay IDs
}

export interface ReplayPageState {
  selectedReplay: GameReplay | null;
  viewMode: 'list' | 'replay' | 'analysis' | 'comparison';
  filters: ReplayFilters;
  sortOptions: ReplaySortOptions;
  playerControls: ReplayPlayerControls;
  showStatistics: boolean;
  searchQuery: string;
  listLayout: 'grid' | 'list' | 'table';
  selectedReplays: string[]; // for bulk operations
}

export interface ProfilePageState {
  activeTab: 'overview' | 'stats' | 'achievements' | 'settings' | 'history';
  editMode: boolean;
  showPrivateInfo: boolean;
  statsPeriod: 'week' | 'month' | 'year' | 'all';
}

// === 모달과 오버레이 ===
export interface ModalState {
  activeModal: string | null;
  modalData: any;
  modalHistory: string[]; // for modal navigation
  preventClose: boolean;
}

export interface OverlayState {
  activeOverlays: string[];
  overlayData: { [overlayId: string]: any };
  zIndexes: { [overlayId: string]: number };
}

export interface NotificationState {
  notifications: UINotification[];
  maxVisible: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  autoHide: boolean;
  autoHideDelay: number;
}

export interface UINotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actions?: NotificationAction[];
  createdAt: Date;
  expiresAt?: Date;
  persistent?: boolean;
  data?: any;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

// === 네비게이션 상태 ===
export interface NavigationState {
  currentRoute: string;
  routeHistory: string[];
  breadcrumbs: Breadcrumb[];
  navigationVisible: boolean;
  activeSection: string;
}

export interface Breadcrumb {
  label: string;
  path: string;
  icon?: string;
}

// === 로딩과 에러 상태 ===
export interface LoadingState {
  global: boolean;
  components: { [componentId: string]: boolean };
  operations: { [operationId: string]: LoadingOperation };
}

export interface LoadingOperation {
  id: string;
  label: string;
  progress?: number; // 0-100
  startedAt: Date;
  estimatedDuration?: number; // ms
  cancellable?: boolean;
}

export interface ErrorState {
  global: string | null;
  components: { [componentId: string]: string };
  history: UIError[];
}

export interface UIError {
  id: string;
  message: string;
  component?: string;
  action?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user?: string;
  context?: any;
}

// === 폼 상태 ===
export interface FormState {
  [formId: string]: {
    values: any;
    errors: { [field: string]: string };
    touched: { [field: string]: boolean };
    dirty: boolean;
    valid: boolean;
    submitting: boolean;
  };
}

// === 토스트 메시지 ===
export interface ToastState {
  toasts: Toast[];
  maxToasts: number;
  defaultDuration: number;
  position: ToastPosition;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
  createdAt: Date;
}

export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

// === 타입 가드 함수들 ===
export const isValidTheme = (theme: string): theme is ThemeMode => {
  return ['light', 'dark', 'system', 'auto'].includes(theme as ThemeMode);
};

export const isValidLanguage = (lang: string): lang is SupportedLanguage => {
  return ['ko', 'en', 'ja', 'zh'].includes(lang as SupportedLanguage);
};

export const hasActiveModal = (state: ModalState): boolean => {
  return state.activeModal !== null;
};

export const hasNotifications = (state: NotificationState): boolean => {
  return state.notifications.length > 0;
};

// === 유틸리티 타입들 ===
export type SettingsUpdate = Partial<AppSettings>;
export type UIStateUpdate = Partial<any>;
export type ComponentState<T = any> = T;