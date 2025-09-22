/**
 * Replay Domain - 리플레이와 게임 분석 관련 모든 타입의 중앙 집중화
 * 게임 기록, 플레이어, 필터링 등
 */

// Core replay types
export * from './record';
export * from './player';
export * from './filters';

// Re-export commonly used types with aliases
export type {
  GameRecord as Replay,
  ReplayCollection as Collection,
  GameAnnotation as Annotation,
  ReplayStatistics as Stats,
} from './record';

export type {
  ReplayPlayerState as PlayerState,
  ReplayPlayerControls as PlayerControls,
  PlaybackSpeed as Speed,
  MoveAnnotation as MoveNote,
} from './player';

export type {
  ReplayFilters as Filters,
  ReplaySortOptions as SortOptions,
  QuickFilterType as QuickFilter,
  SearchOptions as Search,
} from './filters';