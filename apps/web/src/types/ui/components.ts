/**
 * UI Components Domain - 컴포넌트별 Props와 상태 타입
 * 재사용 가능한 컴포넌트들의 인터페이스 정의
 */

import type { ReactNode, CSSProperties } from 'react';
import type { GameRecord, ReplayPlayerControls } from '../replay';
import type { UserProfile } from '../auth';

// === 기본 컴포넌트 Props ===
export interface BaseComponentProps {
  className?: string;
  style?: CSSProperties;
  id?: string;
  testId?: string;
  children?: ReactNode;
}

// === 버튼 컴포넌트 ===
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface IconButtonProps extends BaseComponentProps {
  icon: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

// === 입력 컴포넌트 ===
export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'url';
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  hint?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  autoComplete?: string;
  maxLength?: number;
}

export interface SelectProps extends BaseComponentProps {
  options: SelectOption[];
  value?: string | string[];
  defaultValue?: string | string[];
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  error?: string;
  label?: string;
  hint?: string;
  onChange?: (value: string | string[]) => void;
  onSearch?: (query: string) => void;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
  description?: string;
  group?: string;
}

// === 레이아웃 컴포넌트 ===
export interface LayoutProps extends BaseComponentProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  sidebarPosition?: 'left' | 'right';
  sidebarWidth?: number;
  sidebarCollapsible?: boolean;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: (collapsed: boolean) => void;
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  header?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  hoverable?: boolean;
  loading?: boolean;
}

export interface PanelProps extends BaseComponentProps {
  title: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  tools?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// === 모달과 오버레이 ===
export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  maskClosable?: boolean;
  escClosable?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  centered?: boolean;
  destroyOnClose?: boolean;
}

export interface DrawerProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  size?: number | string;
  closable?: boolean;
  maskClosable?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

export interface TooltipProps extends BaseComponentProps {
  content: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
}

// === 피드백 컴포넌트 ===
export interface AlertProps extends BaseComponentProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  closable?: boolean;
  onClose?: () => void;
  action?: ReactNode;
  icon?: ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  loading?: boolean;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
  tip?: string;
}

export interface ProgressProps extends BaseComponentProps {
  percent: number;
  size?: 'sm' | 'md' | 'lg';
  type?: 'line' | 'circle' | 'dashboard';
  status?: 'normal' | 'success' | 'error' | 'active';
  showInfo?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
}

// === 데이터 표시 컴포넌트 ===
export interface TableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: PaginationConfig;
  selection?: SelectionConfig<T>;
  sorting?: SortingConfig;
  filtering?: FilteringConfig;
  rowKey?: string | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
  onRowDoubleClick?: (record: T, index: number) => void;
  emptyText?: ReactNode;
}

export interface TableColumn<T = any> {
  key: string;
  title: ReactNode;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => ReactNode;
  width?: number | string;
  fixed?: 'left' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: (total: number, range: [number, number]) => ReactNode;
  onChange?: (page: number, pageSize: number) => void;
}

export interface SelectionConfig<T = any> {
  type: 'checkbox' | 'radio';
  selectedRowKeys: string[];
  onChange: (selectedRowKeys: string[], selectedRows: T[]) => void;
  getCheckboxProps?: (record: T) => { disabled?: boolean };
}

export interface SortingConfig {
  field?: string;
  direction?: 'asc' | 'desc';
  onChange?: (field: string, direction: 'asc' | 'desc') => void;
}

export interface FilteringConfig {
  filters: { [key: string]: any };
  onChange?: (filters: { [key: string]: any }) => void;
}

// === 게임 관련 컴포넌트 ===
export interface GameBoardProps extends BaseComponentProps {
  board: Array<Array<'black' | 'white' | null>>;
  size: number;
  validMoves?: Array<{ row: number; col: number }>;
  lastMove?: { row: number; col: number };
  onCellClick?: (row: number, col: number) => void;
  disabled?: boolean;
  interactive?: boolean;
  theme?: 'classic' | 'modern' | 'neon';
  showCoordinates?: boolean;
  showValidMoves?: boolean;
  showLastMove?: boolean;
  animationEnabled?: boolean;
}

export interface GamePieceProps extends BaseComponentProps {
  color: 'black' | 'white';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'flat' | '3d' | 'neon' | 'minimal';
  animated?: boolean;
  onClick?: () => void;
}

export interface GameStatsProps extends BaseComponentProps {
  stats: {
    black: number;
    white: number;
    moves: number;
    time?: number;
  };
  layout?: 'horizontal' | 'vertical';
  showTime?: boolean;
  showMoves?: boolean;
  compact?: boolean;
}

// === 리플레이 관련 컴포넌트 ===
export interface ReplayViewerProps extends BaseComponentProps {
  replay: GameRecord;
  controls: ReplayPlayerControls;
  onControlChange: (controls: Partial<ReplayPlayerControls>) => void;
  showControls?: boolean;
  showAnalysis?: boolean;
  showAnnotations?: boolean;
  autoPlay?: boolean;
}

export interface ReplayListProps extends BaseComponentProps {
  replays: GameRecord[];
  loading?: boolean;
  layout?: 'list' | 'grid' | 'table';
  selectable?: boolean;
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
  onReplayClick?: (replay: GameRecord) => void;
  onReplayDoubleClick?: (replay: GameRecord) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string, order: 'asc' | 'desc') => void;
  emptyText?: ReactNode;
}

// === 사용자 관련 컴포넌트 ===
export interface UserAvatarProps extends BaseComponentProps {
  user: UserProfile;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showOnline?: boolean;
  showRating?: boolean;
  showName?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export interface UserProfileProps extends BaseComponentProps {
  user: UserProfile;
  editable?: boolean;
  onEdit?: (updates: Partial<UserProfile>) => void;
  showPrivateInfo?: boolean;
  compact?: boolean;
}

// === 네비게이션 컴포넌트 ===
export interface BreadcrumbProps extends BaseComponentProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  maxItems?: number;
  onItemClick?: (item: BreadcrumbItem, index: number) => void;
}

export interface BreadcrumbItem {
  title: ReactNode;
  path?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends BaseComponentProps {
  items: TabItem[];
  activeKey?: string;
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  type?: 'line' | 'card' | 'editable-card';
  size?: 'sm' | 'md' | 'lg';
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TabItem {
  key: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  closable?: boolean;
  icon?: ReactNode;
}

// === 폼 관련 컴포넌트 ===
export interface FormProps extends BaseComponentProps {
  initialValues?: any;
  onSubmit?: (values: any) => void;
  onValuesChange?: (changedValues: any, allValues: any) => void;
  layout?: 'horizontal' | 'vertical' | 'inline';
  labelCol?: number;
  wrapperCol?: number;
  disabled?: boolean;
  validateTrigger?: 'onChange' | 'onBlur' | 'onSubmit';
}

export interface FormItemProps extends BaseComponentProps {
  name?: string;
  label?: ReactNode;
  required?: boolean;
  rules?: ValidationRule[];
  help?: ReactNode;
  validateStatus?: 'success' | 'warning' | 'error' | 'validating';
  labelCol?: number;
  wrapperCol?: number;
}

export interface ValidationRule {
  required?: boolean;
  message?: string;
  pattern?: RegExp;
  min?: number;
  max?: number;
  len?: number;
  validator?: (rule: any, value: any) => Promise<void> | void;
}

// === 타입 가드 함수들 ===
export const isButtonProps = (props: any): props is ButtonProps => {
  return typeof props === 'object' && 'onClick' in props;
};

export const isTableColumn = <T>(column: any): column is TableColumn<T> => {
  return column && typeof column.key === 'string' && column.title !== undefined;
};

// === 유틸리티 타입들 ===
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ComponentVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';
export type ComponentProps<T extends BaseComponentProps> = T;