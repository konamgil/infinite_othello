import React from 'react';
import {
  ReplayFilters as IReplayFilters,
  ReplaySortOptions
} from '../../types/replay';
import {
  Filter,
  X,
  Calendar,
  Trophy,
  Brain,
  Users,
  Castle,
  Swords,
  Clock,
  SortAsc,
  SortDesc,
  Target,
  Timer
} from 'lucide-react';

interface ReplayFiltersProps {
  filters: IReplayFilters;
  sortOptions: ReplaySortOptions;
  onFiltersChange: (filters: Partial<IReplayFilters>) => void;
  onSortChange: (sort: ReplaySortOptions) => void;
  onClose: () => void;
}

export function ReplayFilters({
  filters,
  sortOptions,
  onFiltersChange,
  onSortChange,
  onClose
}: ReplayFiltersProps) {

  const gameModeOptions = [
    { value: 'tower' as const, label: '무한 탑', icon: Castle, color: 'text-amber-400' },
    { value: 'battle' as const, label: '랭크 대전', icon: Swords, color: 'text-red-400' },
    { value: 'casual' as const, label: '일반 대전', icon: Users, color: 'text-blue-400' },
    { value: 'ai' as const, label: 'AI 대전', icon: Brain, color: 'text-purple-400' }
  ];

  const resultOptions = [
    { value: 'any' as const, label: '전체', icon: Filter },
    { value: 'win' as const, label: '승리', icon: Trophy, color: 'text-green-400' },
    { value: 'loss' as const, label: '패배', icon: X, color: 'text-red-400' },
    { value: 'draw' as const, label: '무승부', icon: Target, color: 'text-yellow-400' }
  ];

  const opponentOptions = [
    { value: 'any' as const, label: '전체', icon: Filter },
    { value: 'human' as const, label: '인간', icon: Users, color: 'text-blue-400' },
    { value: 'ai' as const, label: 'AI', icon: Brain, color: 'text-purple-400' }
  ];

  const sortOptions_list = [
    { value: 'date' as const, label: '날짜', icon: Calendar },
    { value: 'duration' as const, label: '게임 시간', icon: Timer },
    { value: 'rating' as const, label: '레이팅', icon: Trophy },
    { value: 'accuracy' as const, label: '정확도', icon: Target },
    { value: 'moves' as const, label: '수 개수', icon: Clock }
  ];

  const handleGameModeToggle = (mode: typeof gameModeOptions[0]['value']) => {
    const currentModes = filters.gameMode || [];
    const newModes = currentModes.includes(mode)
      ? currentModes.filter(m => m !== mode)
      : [...currentModes, mode];

    onFiltersChange({ gameMode: newModes });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      gameMode: [],
      opponent: 'any',
      result: 'any',
      dateRange: undefined,
      minDuration: undefined,
      maxDuration: undefined,
      ratingRange: undefined,
      tags: []
    });
  };

  const hasActiveFilters = () => {
    return (filters.gameMode && filters.gameMode.length > 0) ||
           filters.opponent !== 'any' ||
           filters.result !== 'any' ||
           filters.dateRange ||
           filters.minDuration ||
           filters.maxDuration ||
           filters.ratingRange ||
           (filters.tags && filters.tags.length > 0);
  };

  return (
    <div className="mb-6 p-5 rounded-2xl bg-black/30 backdrop-blur-md border border-purple-400/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-purple-300" />
          <h3 className="font-semibold text-white/90 font-smooth">필터 & 정렬</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-white/60 hover:text-white/80 transition-colors font-smooth"
            >
              전체 초기화
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={16} className="text-white/60" />
          </button>
        </div>
      </div>

      {/* Game Mode Filter */}
      <div className="mb-5">
        <h4 className="text-sm font-medium text-white/80 mb-3 font-smooth">게임 모드</h4>
        <div className="grid grid-cols-2 gap-2">
          {gameModeOptions.map(option => {
            const Icon = option.icon;
            const isSelected = filters.gameMode?.includes(option.value);

            return (
              <button
                key={option.value}
                onClick={() => handleGameModeToggle(option.value)}
                className={`p-3 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? 'bg-purple-500/20 border-purple-400/30 text-white/90'
                    : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon size={16} className={option.color || 'text-current'} />
                  <span className="text-xs font-smooth">{option.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result and Opponent Filters */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Result Filter */}
        <div>
          <h4 className="text-sm font-medium text-white/80 mb-3 font-smooth">게임 결과</h4>
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
                      ? 'bg-purple-500/20 border-purple-400/30 text-white/90'
                      : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={option.color || 'text-current'} />
                    <span className="text-xs font-smooth">{option.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Opponent Filter */}
        <div>
          <h4 className="text-sm font-medium text-white/80 mb-3 font-smooth">상대</h4>
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
                      ? 'bg-purple-500/20 border-purple-400/30 text-white/90'
                      : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={option.color || 'text-current'} />
                    <span className="text-xs font-smooth">{option.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div>
        <h4 className="text-sm font-medium text-white/80 mb-3 font-smooth">정렬 기준</h4>
        <div className="grid grid-cols-2 gap-2">
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
                className={`p-3 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? 'bg-blue-500/20 border-blue-400/30 text-white/90'
                    : 'bg-black/20 border-white/10 text-white/60 hover:bg-black/30'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon size={16} />
                  <span className="text-xs font-smooth">{option.label}</span>
                  {isSelected && (
                    sortOptions.direction === 'desc' ?
                      <SortDesc size={12} className="text-blue-300" /> :
                      <SortAsc size={12} className="text-blue-300" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}