/**
 * Replay Filters Domain - 리플레이 필터링과 검색 관련 타입
 * 필터 조건, 정렬 옵션, 검색 기능 등
 */

import type { GameMode } from '../game';

// === 기본 필터 인터페이스 ===
export interface ReplayFilters {
  // 게임 정보 필터
  gameMode?: GameMode[];
  opponent?: OpponentFilter;
  result?: ResultFilter;

  // 시간 관련 필터
  dateRange?: DateRangeFilter;
  durationRange?: DurationRangeFilter;

  // 플레이어 관련 필터
  ratingRange?: RatingRangeFilter;
  playerColor?: 'black' | 'white' | 'any';

  // 분석 관련 필터
  hasAnalysis?: boolean;
  accuracyRange?: AccuracyRangeFilter;

  // 메타데이터 필터
  tags?: string[];
  collections?: string[];
  annotations?: boolean;

  // 고급 필터
  openingFilter?: OpeningFilter;
  endGameFilter?: EndGameFilter;
  criticalMoves?: CriticalMovesFilter;
}

// === 세부 필터 타입들 ===
export type OpponentFilter = 'human' | 'ai' | 'any';
export type ResultFilter = 'win' | 'loss' | 'draw' | 'any';

export interface DateRangeFilter {
  start: Date;
  end: Date;
  preset?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export interface DurationRangeFilter {
  min?: number; // seconds
  max?: number; // seconds
  preset?: 'quick' | 'normal' | 'long' | 'marathon' | 'custom';
}

export interface RatingRangeFilter {
  min?: number;
  max?: number;
  includeUnrated?: boolean;
}

export interface AccuracyRangeFilter {
  min?: number; // 0-100
  max?: number; // 0-100
  includeUnanalyzed?: boolean;
}

export interface OpeningFilter {
  names?: string[]; // opening names
  eco?: string[]; // ECO codes (if applicable)
  moveCount?: { min?: number; max?: number }; // opening length
}

export interface EndGameFilter {
  type?: 'material' | 'time' | 'resignation' | 'any';
  margin?: { min?: number; max?: number }; // point difference
}

export interface CriticalMovesFilter {
  hasBlunders?: boolean;
  hasBrilliantMoves?: boolean;
  turningPoints?: boolean;
  minSignificance?: 'minor' | 'major' | 'critical';
}

// === 정렬 옵션 ===
export interface ReplaySortOptions {
  field: SortField;
  direction: SortDirection;
  secondary?: {
    field: SortField;
    direction: SortDirection;
  };
}

export type SortField =
  | 'date'
  | 'duration'
  | 'rating'
  | 'accuracy'
  | 'moves'
  | 'opponent'
  | 'result'
  | 'mode'
  | 'custom';

export type SortDirection = 'asc' | 'desc';

// === 검색 기능 ===
export interface SearchOptions {
  query: string;
  fields: SearchField[];
  matchType: 'exact' | 'contains' | 'fuzzy';
  caseSensitive: boolean;
  includeAnalysis: boolean;
  includeComments: boolean;
}

export type SearchField =
  | 'opponent'
  | 'tags'
  | 'annotations'
  | 'opening'
  | 'location'
  | 'event'
  | 'all';

export interface SearchResult {
  gameId: string;
  relevance: number; // 0-100
  matches: SearchMatch[];
}

export interface SearchMatch {
  field: SearchField;
  text: string;
  context?: string;
  moveNumber?: number;
}

// === 필터 프리셋 ===
export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: ReplayFilters;
  sortOptions?: ReplaySortOptions;
  isDefault?: boolean;
  isPublic?: boolean;
  createdBy?: string;
  createdAt: string;
  usage: number; // times used
}

export type QuickFilterType =
  | 'recentWins'
  | 'recentLosses'
  | 'challengingGames'
  | 'aiMatches'
  | 'humanMatches'
  | 'longGames'
  | 'quickGames'
  | 'analyzedGames'
  | 'unanalyzedGames'
  | 'highAccuracy'
  | 'needsReview';

// === 필터 상태 관리 ===
export interface FilterState {
  current: ReplayFilters;
  active: boolean;
  applied: boolean;
  count: number; // filtered results count

  // 히스토리
  history: FilterSnapshot[];
  presets: FilterPreset[];

  // UI 상태
  expanded: boolean;
  quickFilters: QuickFilterType[];
  searchOptions: SearchOptions;
}

export interface FilterSnapshot {
  id: string;
  filters: ReplayFilters;
  timestamp: string;
  resultCount: number;
  name?: string; // user-given name
}

// === 필터 검증과 제약 ===
export interface FilterConstraints {
  maxDateRange: number; // days
  maxDurationRange: number; // seconds
  maxRatingRange: number;
  maxTagsCount: number;
  maxCollectionsCount: number;

  // 성능 제약
  maxResultsWithoutPaging: number;
  requiresIndexing: SortField[];
}

export interface FilterValidation {
  isValid: boolean;
  errors: FilterError[];
  warnings: FilterWarning[];
  suggestions: FilterSuggestion[];
}

export interface FilterError {
  field: keyof ReplayFilters;
  message: string;
  code: string;
}

export interface FilterWarning {
  field: keyof ReplayFilters;
  message: string;
  impact: 'performance' | 'accuracy' | 'completeness';
}

export interface FilterSuggestion {
  type: 'preset' | 'refinement' | 'expansion';
  description: string;
  filters?: Partial<ReplayFilters>;
}

// === 집계와 통계 ===
export interface FilterAggregation {
  field: keyof ReplayFilters;
  values: AggregationBucket[];
  total: number;
}

export interface AggregationBucket {
  value: any;
  count: number;
  percentage: number;
  label?: string;
}

export interface FilterStatistics {
  totalGames: number;
  filteredGames: number;
  filterEfficiency: number; // 0-100, how much the filter reduced results

  // 분포 정보
  distributions: {
    byMode: AggregationBucket[];
    byResult: AggregationBucket[];
    byOpponent: AggregationBucket[];
    byRating: AggregationBucket[];
    byDuration: AggregationBucket[];
  };

  // 성능 메트릭
  performanceMetrics: {
    filterTime: number; // ms
    resultSize: number; // bytes
    cacheHit: boolean;
  };
}

// === 필터 UI 관련 ===
export interface FilterPanelState {
  isOpen: boolean;
  activeSection: FilterSection;
  expandedSections: FilterSection[];
  showAdvanced: boolean;
  showPresets: boolean;
}

export type FilterSection =
  | 'basic'
  | 'time'
  | 'players'
  | 'analysis'
  | 'metadata'
  | 'advanced';

export interface FilterComponent {
  type: 'dropdown' | 'range' | 'date' | 'tags' | 'search' | 'toggle';
  field: keyof ReplayFilters;
  label: string;
  placeholder?: string;
  options?: { value: any; label: string }[];
  validation?: (value: any) => boolean;
  transform?: (value: any) => any;
}

// === 타입 가드와 유틸리티 ===
export const isValidDateRange = (range: DateRangeFilter): boolean => {
  return range.start <= range.end && range.start <= new Date();
};

export const isValidRatingRange = (range: RatingRangeFilter): boolean => {
  if (range.min !== undefined && range.max !== undefined) {
    return range.min <= range.max && range.min >= 0;
  }
  return true;
};

export const hasActiveFilters = (filters: ReplayFilters): boolean => {
  return Object.values(filters).some(value =>
    value !== undefined &&
    value !== null &&
    (Array.isArray(value) ? value.length > 0 : true)
  );
};

export const isQuickFilter = (type: string): type is QuickFilterType => {
  const quickFilters: QuickFilterType[] = [
    'recentWins', 'recentLosses', 'challengingGames', 'aiMatches',
    'humanMatches', 'longGames', 'quickGames', 'analyzedGames',
    'unanalyzedGames', 'highAccuracy', 'needsReview'
  ];
  return quickFilters.includes(type as QuickFilterType);
};

// === 편의 타입들 ===
export type FilterUpdate = Partial<ReplayFilters>;
export type SortUpdate = Partial<ReplaySortOptions>;
export type SearchUpdate = Partial<SearchOptions>;