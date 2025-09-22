/**
 * UI Domain - 사용자 인터페이스 관련 모든 타입의 중앙 집중화
 * 상태 관리, 컴포넌트, 테마, 설정 등
 */

// Core UI types
export * from './state';
export * from './components';

// Re-export commonly used types with aliases
export type {
  AppSettings as Settings,
  ThemeMode as Theme,
  GameUISettings as GameSettings,
  AccessibilitySettings as A11y,
} from './state';

export type {
  BaseComponentProps as BaseProps,
  ButtonProps as Button,
  InputProps as Input,
  ModalProps as Modal,
  TableProps as Table,
} from './components';