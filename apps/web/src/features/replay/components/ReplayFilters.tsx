import React, { useState, useEffect, useCallback } from 'react';
import {
  ReplayFilters as IReplayFilters,
  ReplaySortOptions
} from '../../../types/replay';
import {
  Filter, X, Calendar, Trophy, Brain, Users, Castle, Swords, Clock,
  SortAsc, SortDesc, Target, Timer, Search, Star, Zap, TrendingUp,
  Sliders, RotateCcw, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';

/**
 * @interface ReplayFiltersProps
 * `ReplayFilters` 컴포넌트의 props를 정의합니다.
 */
interface ReplayFiltersProps {
  /** @property {IReplayFilters} filters - 현재 적용된 필터 객체. */
  filters: IReplayFilters;
  /** @property {ReplaySortOptions} sortOptions - 현재 적용된 정렬 옵션 객체. */
  sortOptions: ReplaySortOptions;
  /** @property {string} searchQuery - 현재 검색어. */
  searchQuery: string;
  /** @property {(filters: Partial<IReplayFilters>) => void} onFiltersChange - 필터 변경 시 호출될 콜백. */
  onFiltersChange: (filters: Partial<IReplayFilters>) => void;
  /** @property {(sort: ReplaySortOptions) => void} onSortChange - 정렬 옵션 변경 시 호출될 콜백. */
  onSortChange: (sort: ReplaySortOptions) => void;
  /** @property {(query: string) => void} onSearchChange - 검색어 변경 시 호출될 콜백. */
  onSearchChange: (query: string) => void;
  /** @property {() => void} onClose - 필터 컴포넌트를 닫을 때 호출될 콜백. */
  onClose: () => void;
  /** @property {string} [className] - 컴포넌트의 최상위 요소에 적용할 추가 CSS 클래스. */
  className?: string;
}

/**
 * 게임 리플레이 목록을 위한 포괄적인 필터 및 정렬 UI를 제공하는 컴포넌트입니다.
 * 검색, 빠른 필터 프리셋, 확장 가능한 고급 필터 섹션을 포함합니다.
 * @param {ReplayFiltersProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 필터 및 정렬 UI.
 */
export function ReplayFilters({
  filters,
  sortOptions,
  searchQuery,
  onFiltersChange,
  onSortChange,
  onSearchChange,
  onClose,
  className = ''
}: ReplayFiltersProps) {
  /** @state {boolean} isExpanded - 고급 필터 섹션의 확장 여부. */
  const [isExpanded, setIsExpanded] = useState(false);
  /** @state {string} searchTerm - 내부 검색어 상태 (디바운싱 적용). */
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  /** @state {string | null} activeSection - 현재 열려있는 고급 필터 섹션의 ID. */
  const [activeSection, setActiveSection] = useState<string | null>(null);

  /**
   * 검색어 입력에 대한 디바운싱을 처리하는 `useEffect` 훅입니다.
   * 사용자가 타이핑을 멈춘 후 300ms가 지나면 `onSearchChange` 콜백을 호출합니다.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);

  // --- UI 옵션 상수 ---
  const gameModeOptions = [
    { value: 'tower' as const, label: '무한 탑', icon: Castle, color: 'text-amber-400', bgColor: 'bg-amber-400/10' },
    { value: 'battle' as const, label: '랭크 대전', icon: Swords, color: 'text-red-400', bgColor: 'bg-red-400/10' },
    { value: 'casual' as const, label: '일반 대전', icon: Users, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
    { value: 'ai' as const, label: 'AI 대전', icon: Brain, color: 'text-purple-400', bgColor: 'bg-purple-400/10' }
  ];
  const resultOptions = [
    { value: 'any' as const, label: '전체', icon: Filter, color: 'text-white/60' },
    { value: 'win' as const, label: '승리', icon: Trophy, color: 'text-green-400', bgColor: 'bg-green-400/10' },
    { value: 'loss' as const, label: '패배', icon: X, color: 'text-red-400', bgColor: 'bg-red-400/10' },
    { value: 'draw' as const, label: '무승부', icon: Target, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' }
  ];
  const opponentOptions = [
    { value: 'any' as const, label: '전체', icon: Filter, color: 'text-white/60' },
    { value: 'human' as const, label: '인간', icon: Users, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
    { value: 'ai' as const, label: 'AI', icon: Brain, color: 'text-purple-400', bgColor: 'bg-purple-400/10' }
  ];
  const sortOptions_list = [
    { value: 'date' as const, label: '날짜', icon: Calendar },
    { value: 'duration' as const, label: '게임 시간', icon: Timer },
    { value: 'rating' as const, label: '레이팅', icon: Trophy },
    { value: 'accuracy' as const, label: '정확도', icon: Target },
    { value: 'moves' as const, label: '수 개수', icon: Clock }
  ];
  const quickPresets = [
    { label: '최근 승리', icon: Trophy, color: 'text-green-400', bgColor: 'bg-green-400/10', borderColor: 'border-green-400/20', filters: { result: 'win' as const, dateRange: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() } } },
    { label: '도전적인 게임', icon: TrendingUp, color: 'text-orange-400', bgColor: 'bg-orange-400/10', borderColor: 'border-orange-400/20', filters: { ratingRange: { min: 1500, max: 2000 } } },
    { label: 'AI 매치', icon: Brain, color: 'text-purple-400', bgColor: 'bg-purple-400/10', borderColor: 'border-purple-400/20', filters: { opponent: 'ai' as const } },
    { label: '긴 게임', icon: Clock, color: 'text-blue-400', bgColor: 'bg-blue-400/10', borderColor: 'border-blue-400/20', filters: { minDuration: 1800 } }
  ];

  // --- 이벤트 핸들러 ---

  /** 게임 모드 필터를 토글합니다 (다중 선택). */
  const handleGameModeToggle = (mode: typeof gameModeOptions[0]['value']) => {
    const currentModes = filters.gameMode || [];
    const newModes = currentModes.includes(mode)
      ? currentModes.filter(m => m !== mode)
      : [...currentModes, mode];
    onFiltersChange({ gameMode: newModes });
  };

  /** 빠른 필터 프리셋을 적용합니다. */
  const applyQuickPreset = (preset: typeof quickPresets[0]) => {
    onFiltersChange(preset.filters);
    setActiveSection(null);
  };

  /** 레이팅 범위 슬라이더 변경을 처리합니다. */
  const handleRatingChange = useCallback((type: 'min' | 'max', value: number) => {
    const currentRange = filters.ratingRange || { min: 800, max: 2400 };
    onFiltersChange({ ratingRange: { ...currentRange, [type]: value } });
  }, [filters.ratingRange, onFiltersChange]);

  /** 날짜 범위 선택 변경을 처리합니다. */
  const handleDateRangeChange = (type: 'start' | 'end', date: Date) => {
    const currentRange = filters.dateRange || { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() };
    onFiltersChange({ dateRange: { ...currentRange, [type]: date } });
  };

  /** 모든 필터와 검색어를 초기화합니다. */
  const clearAllFilters = () => {
    onFiltersChange({ gameMode: [], opponent: 'any', result: 'any', dateRange: undefined, minDuration: undefined, maxDuration: undefined, ratingRange: undefined, tags: [] });
    setSearchTerm('');
    onSearchChange('');
  };

  /** 현재 활성화된 필터가 있는지 확인합니다. */
  const hasActiveFilters = () => {
    return (filters.gameMode && filters.gameMode.length > 0) ||
           filters.opponent !== 'any' || filters.result !== 'any' ||
           filters.dateRange || filters.minDuration || filters.maxDuration ||
           filters.ratingRange || (filters.tags && filters.tags.length > 0);
  };

  /** 고급 필터 내의 섹션을 열고 닫습니다. */
  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className={`mb-4 sm:mb-6 rounded-xl sm:rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 transition-all duration-300 ${className}`}>
      {/* Search Bar - Always Visible */}
      <div className="p-3 sm:p-4 border-b border-white/10">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
          <input
            type="text"
            placeholder="상대 이름이나 태그로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-black/30 backdrop-blur-md border border-white/10
                     text-white placeholder-white/50 font-display tracking-wide text-sm sm:text-base
                     focus:bg-black/40 focus:border-white/20 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Header with Toggle */}
      <div className="flex items-center justify-between p-3 sm:p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
        >
          <Filter size={16} className="text-purple-300" />
          <h3 className="font-semibold font-display tracking-wider text-sm sm:text-base">고급 필터</h3>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <div className="flex items-center gap-1 sm:gap-2">
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg bg-red-400/10 text-red-300 text-xs
                       hover:bg-red-400/20 transition-all font-display tracking-wider"
            >
              <RotateCcw size={10} />
              초기화
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={14} className="text-white/60" />
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      {!isExpanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          <h4 className="text-xs sm:text-sm font-medium text-white/80 mb-2 sm:mb-3 font-display tracking-wider">빠른 필터</h4>
          <div className="grid grid-cols-2 gap-2">
            {quickPresets.map((preset, index) => {
              const Icon = preset.icon;
              return (
                <button
                  key={index}
                  onClick={() => applyQuickPreset(preset)}
                  className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-200
                           ${preset.bgColor} ${preset.borderColor} hover:scale-105 active:scale-95`}
                >
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <Icon size={12} className={preset.color} />
                    <span className="text-xs font-display tracking-wider text-white/80">{preset.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Advanced Filters - Expandable */}
      {isExpanded && (
        <div className="p-3 sm:p-4 pt-0 space-y-4 sm:space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Game Mode Filter */}
          <div>
            <button
              onClick={() => toggleSection('gameMode')}
              className="flex items-center gap-2 mb-2 sm:mb-3 text-white/90 hover:text-white transition-colors w-full"
            >
              <Sparkles size={14} className="text-amber-400" />
              <h4 className="text-xs sm:text-sm font-medium font-display tracking-wider">게임 모드</h4>
              <div className="ml-auto">
                {activeSection === 'gameMode' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </div>
            </button>
            {activeSection === 'gameMode' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {gameModeOptions.map(option => {
                  const Icon = option.icon;
                  const isSelected = filters.gameMode?.includes(option.value);

                  return (
                    <button
                      key={option.value}
                      onClick={() => handleGameModeToggle(option.value)}
                      className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                        isSelected
                          ? `${option.bgColor} border-${option.color.split('-')[1]}-400/40 text-white/90 scale-105`
                          : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <Icon size={14} className={option.color || 'text-current'} />
                        <span className="text-xs font-display tracking-wider">{option.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Result and Opponent Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Result Filter */}
            <div>
              <button
                onClick={() => toggleSection('result')}
                className="flex items-center gap-2 mb-2 sm:mb-3 text-white/90 hover:text-white transition-colors w-full"
              >
                <Trophy size={14} className="text-green-400" />
                <h4 className="text-xs sm:text-sm font-medium font-display tracking-wider">게임 결과</h4>
                <div className="ml-auto">
                  {activeSection === 'result' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </div>
              </button>
              {activeSection === 'result' && (
                <div className="space-y-2">
                  {resultOptions.map(option => {
                    const Icon = option.icon;
                    const isSelected = filters.result === option.value;

                    return (
                      <button
                        key={option.value}
                        onClick={() => onFiltersChange({ result: option.value })}
                        className={`w-full p-2 rounded-lg border transition-all duration-200 ${
                          isSelected
                            ? `${option.bgColor || 'bg-purple-500/20'} border-purple-400/30 text-white/90 scale-105`
                            : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={14} className={option.color || 'text-current'} />
                          <span className="text-xs font-display tracking-wider">{option.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Opponent Filter */}
            <div>
              <button
                onClick={() => toggleSection('opponent')}
                className="flex items-center gap-2 mb-2 sm:mb-3 text-white/90 hover:text-white transition-colors w-full"
              >
                <Users size={14} className="text-blue-400" />
                <h4 className="text-xs sm:text-sm font-medium font-display tracking-wider">상대</h4>
                <div className="ml-auto">
                  {activeSection === 'opponent' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </div>
              </button>
              {activeSection === 'opponent' && (
                <div className="space-y-2">
                  {opponentOptions.map(option => {
                    const Icon = option.icon;
                    const isSelected = filters.opponent === option.value;

                    return (
                      <button
                        key={option.value}
                        onClick={() => onFiltersChange({ opponent: option.value })}
                        className={`w-full p-2 rounded-lg border transition-all duration-200 ${
                          isSelected
                            ? `${option.bgColor || 'bg-purple-500/20'} border-purple-400/30 text-white/90 scale-105`
                            : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={14} className={option.color || 'text-current'} />
                          <span className="text-xs font-display tracking-wider">{option.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Rating Range Slider */}
          <div>
            <button
              onClick={() => toggleSection('rating')}
              className="flex items-center gap-2 mb-2 sm:mb-3 text-white/90 hover:text-white transition-colors w-full"
            >
              <Sliders size={14} className="text-yellow-400" />
              <h4 className="text-xs sm:text-sm font-medium font-display tracking-wider">레이팅 범위</h4>
              <div className="ml-auto">
                {activeSection === 'rating' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </div>
            </button>
            {activeSection === 'rating' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-white/70 font-display">
                  <span>{filters.ratingRange?.min || 800}</span>
                  <span>{filters.ratingRange?.max || 2400}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/60 mb-1 font-display">최소</label>
                    <input
                      type="range"
                      min="800"
                      max="2400"
                      step="50"
                      value={filters.ratingRange?.min || 800}
                      onChange={(e) => handleRatingChange('min', parseInt(e.target.value))}
                      className="w-full h-2 bg-black/30 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1 font-display">최대</label>
                    <input
                      type="range"
                      min="800"
                      max="2400"
                      step="50"
                      value={filters.ratingRange?.max || 2400}
                      onChange={(e) => handleRatingChange('max', parseInt(e.target.value))}
                      className="w-full h-2 bg-black/30 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date Range Picker */}
          <div>
            <button
              onClick={() => toggleSection('dateRange')}
              className="flex items-center gap-2 mb-2 sm:mb-3 text-white/90 hover:text-white transition-colors w-full"
            >
              <Calendar size={14} className="text-cyan-400" />
              <h4 className="text-xs sm:text-sm font-medium font-display tracking-wider">날짜 범위</h4>
              <div className="ml-auto">
                {activeSection === 'dateRange' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </div>
            </button>
            {activeSection === 'dateRange' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/60 mb-1 font-display">시작일</label>
                  <input
                    type="date"
                    value={filters.dateRange?.start?.toISOString().split('T')[0] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    onChange={(e) => handleDateRangeChange('start', new Date(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white/80
                             focus:bg-black/40 focus:border-white/20 focus:outline-none transition-all text-xs font-display"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1 font-display">종료일</label>
                  <input
                    type="date"
                    value={filters.dateRange?.end?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleDateRangeChange('end', new Date(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white/80
                             focus:bg-black/40 focus:border-white/20 focus:outline-none transition-all text-xs font-display"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sort Options */}
          <div>
            <button
              onClick={() => toggleSection('sort')}
              className="flex items-center gap-2 mb-2 sm:mb-3 text-white/90 hover:text-white transition-colors w-full"
            >
              <Zap size={14} className="text-pink-400" />
              <h4 className="text-xs sm:text-sm font-medium font-display tracking-wider">정렬 기준</h4>
              <div className="ml-auto">
                {activeSection === 'sort' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </div>
            </button>
            {activeSection === 'sort' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sortOptions_list.map(option => {
                  const Icon = option.icon;
                  const isSelected = sortOptions.field === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => onSortChange({
                        field: option.value,
                        direction: sortOptions.field === option.value && sortOptions.direction === 'desc' ? 'asc' : 'desc'
                      })}
                      className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all duration-200 ${
                        isSelected
                          ? 'bg-blue-500/20 border-blue-400/30 text-white/90 scale-105'
                          : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <Icon size={14} />
                        <span className="text-xs font-display tracking-wider">{option.label}</span>
                        {isSelected && (
                          sortOptions.direction === 'desc' ?
                            <SortDesc size={10} className="text-blue-300" /> :
                            <SortAsc size={10} className="text-blue-300" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}