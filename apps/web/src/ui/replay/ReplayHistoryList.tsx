import React from 'react';
import {
  GameReplay,
  ReplayFilters,
  ReplaySortOptions
} from '../../types/replay';
import {
  Clock,
  Trophy,
  Target,
  Brain,
  Crown,
  Swords,
  Castle,
  Play,
  Calendar,
  Timer,
  Users
} from 'lucide-react';

interface ReplayHistoryListProps {
  replays: GameReplay[];
  filters: ReplayFilters;
  sortOptions: ReplaySortOptions;
  searchQuery: string;
  onReplaySelect: (replay: GameReplay) => void;
}

export function ReplayHistoryList({
  replays,
  filters,
  sortOptions,
  searchQuery,
  onReplaySelect
}: ReplayHistoryListProps) {

  // Apply filters and sorting
  const filteredAndSortedReplays = replays
    .filter(replay => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesPlayer =
          replay.playerBlack.name.toLowerCase().includes(query) ||
          replay.playerWhite.name.toLowerCase().includes(query);
        const matchesMode = replay.gameMode.toLowerCase().includes(query);
        if (!matchesPlayer && !matchesMode) return false;
      }

      // Game mode filter
      if (filters.gameMode && filters.gameMode.length > 0) {
        if (!filters.gameMode.includes(replay.gameMode)) return false;
      }

      // Result filter
      if (filters.result && filters.result !== 'any') {
        const playerWon = replay.result.winner === 'black'; // Assuming player is always black
        if (filters.result === 'win' && !playerWon) return false;
        if (filters.result === 'loss' && playerWon) return false;
        if (filters.result === 'draw' && replay.result.winner !== 'draw') return false;
      }

      // Opponent filter
      if (filters.opponent && filters.opponent !== 'any') {
        const playingAgainstAI = replay.playerWhite.isAI;
        if (filters.opponent === 'ai' && !playingAgainstAI) return false;
        if (filters.opponent === 'human' && playingAgainstAI) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const { field, direction } = sortOptions;
      let comparison = 0;

      switch (field) {
        case 'date':
          comparison = a.gameInfo.startTime - b.gameInfo.startTime;
          break;
        case 'duration':
          comparison = a.gameInfo.duration - b.gameInfo.duration;
          break;
        case 'rating':
          const aRating = (a.playerBlack.rating || 0) + (a.playerWhite.rating || 0);
          const bRating = (b.playerBlack.rating || 0) + (b.playerWhite.rating || 0);
          comparison = aRating - bRating;
          break;
        case 'accuracy':
          const aAccuracy = (a.analysis?.accuracy.black || 0) + (a.analysis?.accuracy.white || 0);
          const bAccuracy = (b.analysis?.accuracy.black || 0) + (b.analysis?.accuracy.white || 0);
          comparison = aAccuracy - bAccuracy;
          break;
        case 'moves':
          comparison = a.gameInfo.totalMoves - b.gameInfo.totalMoves;
          break;
        default:
          comparison = 0;
      }

      return direction === 'asc' ? comparison : -comparison;
    });

  const getGameModeIcon = (mode: GameReplay['gameMode']) => {
    switch (mode) {
      case 'tower': return <Castle size={16} className="text-amber-400" />;
      case 'battle': return <Swords size={16} className="text-red-400" />;
      case 'casual': return <Users size={16} className="text-blue-400" />;
      case 'ai': return <Brain size={16} className="text-purple-400" />;
      default: return <Play size={16} className="text-white/60" />;
    }
  };

  const getGameModeLabel = (mode: GameReplay['gameMode']) => {
    switch (mode) {
      case 'tower': return '무한 탑';
      case 'battle': return '랭크 대전';
      case 'casual': return '일반 대전';
      case 'ai': return 'AI 대전';
      default: return '기타';
    }
  };

  const getResultIcon = (replay: GameReplay, isPlayerBlack = true) => {
    const playerWon = replay.result.winner === (isPlayerBlack ? 'black' : 'white');
    const isDraw = replay.result.winner === 'draw';

    if (isDraw) {
      return <Target size={16} className="text-yellow-500" />;
    } else if (playerWon) {
      return <Trophy size={16} className="text-green-400" />;
    } else {
      return <Clock size={16} className="text-red-400" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (days === 0) {
      return '오늘';
    } else if (days === 1) {
      return '어제';
    } else if (days < 7) {
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (filteredAndSortedReplays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20
                       backdrop-blur-md border border-white/10 flex items-center justify-center mb-6">
          <Clock size={32} className="text-purple-300" />
        </div>
        <h3 className="text-xl font-bold text-white/90 mb-2 font-smooth">
          시공간의 기록이 없습니다
        </h3>
        <p className="text-white/60 text-center text-sm font-smooth">
          {searchQuery || Object.values(filters).some(f => f !== 'any' && (!Array.isArray(f) || f.length > 0))
            ? '검색 조건에 맞는 대국 기록을 찾을 수 없습니다'
            : '첫 대국을 시작하여 우주의 기록을 남겨보세요'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredAndSortedReplays.map((replay) => {
        const isPlayerBlack = replay.playerBlack.name === '우주의 오델로 수호자';
        const opponent = isPlayerBlack ? replay.playerWhite : replay.playerBlack;
        const playerScore = isPlayerBlack ? replay.result.finalScore.black : replay.result.finalScore.white;
        const opponentScore = isPlayerBlack ? replay.result.finalScore.white : replay.result.finalScore.black;
        const playerWon = replay.result.winner === (isPlayerBlack ? 'black' : 'white');
        const isDraw = replay.result.winner === 'draw';

        return (
          <button
            key={replay.id}
            onClick={() => onReplaySelect(replay)}
            className="w-full p-5 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                       hover:bg-black/30 hover:border-white/20 hover:scale-[1.02]
                       active:scale-[0.98] transition-all duration-300 text-left"
          >
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {getGameModeIcon(replay.gameMode)}
                <span className="font-semibold text-white/90 text-sm font-smooth">
                  {getGameModeLabel(replay.gameMode)}
                </span>
                {replay.metadata.tags && replay.metadata.tags.length > 0 && (
                  <div className="flex gap-1">
                    {replay.metadata.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300
                                 border border-purple-400/20 font-smooth"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {getResultIcon(replay, isPlayerBlack)}
                <span className="text-xs text-white/60 font-smooth">
                  {formatDate(replay.gameInfo.startTime)}
                </span>
              </div>
            </div>

            {/* Opponent and Score Row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {opponent.isAI ? (
                  <div className="flex items-center gap-2">
                    <Brain size={16} className="text-purple-400" />
                    <span className="text-white/80 font-smooth">
                      {opponent.name}
                      {opponent.aiLevel && (
                        <span className="text-purple-300 text-xs ml-1">
                          ({opponent.aiLevel})
                        </span>
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Crown size={16} className="text-amber-400" />
                    <span className="text-white/80 font-smooth">
                      {opponent.name}
                    </span>
                    {opponent.rating && (
                      <span className="text-white/60 text-xs font-smooth">
                        ({opponent.rating}점)
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className={`text-lg font-bold font-smooth ${
                isDraw ? 'text-yellow-400' : playerWon ? 'text-green-400' : 'text-red-400'
              }`}>
                {playerScore} : {opponentScore}
              </div>
            </div>

            {/* Game Stats Row */}
            <div className="flex items-center justify-between text-xs text-white/60">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Timer size={12} />
                  <span className="font-smooth">{formatDuration(replay.gameInfo.duration)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target size={12} />
                  <span className="font-smooth">{replay.gameInfo.totalMoves}수</span>
                </div>
                {replay.analysis && (
                  <div className="flex items-center gap-1">
                    <Brain size={12} />
                    <span className="font-smooth">
                      정확도 {Math.round(isPlayerBlack ? replay.analysis.accuracy.black : replay.analysis.accuracy.white)}%
                    </span>
                  </div>
                )}
              </div>

              {replay.gameInfo.endTime && (
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span className="font-smooth">
                    {new Date(replay.gameInfo.startTime).toLocaleDateString('ko-KR', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Analysis Preview */}
            {replay.analysis && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  {replay.analysis.openingName && (
                    <span className="text-xs text-purple-300 font-smooth">
                      오프닝: {replay.analysis.openingName}
                    </span>
                  )}
                  {replay.analysis.turningPoints.length > 0 && (
                    <span className="text-xs text-yellow-300 font-smooth">
                      전환점 {replay.analysis.turningPoints.length}개
                    </span>
                  )}
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}