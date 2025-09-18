import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReplayStarCanvas } from '../../../../ui/replay/ReplayStarCanvas';
import { ReplayViewer } from '../../../../ui/replay/ReplayViewer';
import { useReplayStore } from '../../../../store/replayStore';
import type { ReplaySortOptions } from '../../../../types/replay';
import { GameReplay } from '../../../../types/replay';
import {
  Clock,
  Search,
  Filter,
  Trophy,
  Target,
  ArrowLeft,
  Play,
  Eye,
  Share2,
  Calendar,
  User,
  Zap,
  Crown,
  Swords,
  Star,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

// Convert GameReplay to legacy format for UI compatibility
const convertReplayToLegacyFormat = (replay: GameReplay): LegacyGameRecord => ({
  id: replay.id,
  date: new Date(replay.gameInfo.startTime),
  mode: replay.gameMode,
  opponent: {
    name: replay.playerBlack.name === '우주의 오델로 수호자' ? replay.playerWhite.name : replay.playerBlack.name,
    type: (replay.playerBlack.name === '우주의 오델로 수호자' ? replay.playerWhite.isAI : replay.playerBlack.isAI) ? 'ai' : 'human',
    difficulty: (replay.playerBlack.name === '우주의 오델로 수호자' ? replay.playerWhite.aiLevel : replay.playerBlack.aiLevel) || undefined,
    rank: (replay.playerBlack.name === '우주의 오델로 수호자' ? replay.playerWhite.rating : replay.playerBlack.rating) ? `Rating ${(replay.playerBlack.name === '우주의 오델로 수호자' ? replay.playerWhite.rating : replay.playerBlack.rating)}` : undefined
  },
  player: {
    color: replay.playerBlack.name === '우주의 오델로 수호자' ? 1 : -1,
    name: '우주의 오델로 수호자',
    rank: replay.playerBlack.name === '우주의 오델로 수호자' ? `Rating ${replay.playerBlack.rating}` : `Rating ${replay.playerWhite.rating}`
  },
  moves: replay.moves.map(move => ({
    position: { x: move.x, y: move.y },
    player: move.player === 'black' ? 1 : -1,
    timestamp: move.timestamp,
    capturedDiscs: move.flippedDiscs
  })),
  result: {
    winner: replay.result.winner === 'black' ? 1 : replay.result.winner === 'white' ? -1 : 'draw',
    blackScore: replay.result.finalScore.black,
    whiteScore: replay.result.finalScore.white,
    endReason: replay.result.gameEndReason === 'normal' ? 'normal' : 'forfeit'
  },
  duration: replay.gameInfo.duration,
  aiAnalysis: replay.analysis ? [
    {
      position: { x: 3, y: 4 },
      evaluation: 85,
      category: 'excellent' as const,
      alternatives: [
        { move: { x: 2, y: 4 }, evaluation: 65 },
        { move: { x: 4, y: 3 }, evaluation: 72 }
      ],
      comment: '분석된 게임입니다. AI가 이 수를 평가했습니다.'
    }
  ] : undefined,
  tags: replay.metadata.tags || []
});

// Legacy format for backward compatibility
const MOCK_GAME_RECORDS_LEGACY = [
  {
    id: '1',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
    mode: 'ranked',
    opponent: {
      name: '드래곤슬레이어',
      type: 'human',
      rank: 'Silver II'
    },
    player: {
      color: 1, // Black
      name: '우주의 오델로 수호자',
      rank: 'Bronze III'
    },
    moves: [], // Will be populated with actual moves
    result: {
      winner: 1,
      blackScore: 35,
      whiteScore: 29,
      endReason: 'normal'
    },
    duration: 923, // 15분 23초
    aiAnalysis: [
      {
        position: { x: 3, y: 4 },
        evaluation: 85,
        category: 'excellent',
        alternatives: [
          { move: { x: 2, y: 4 }, evaluation: 65 },
          { move: { x: 4, y: 3 }, evaluation: 72 }
        ],
        comment: '완벽한 중앙 장악 수! 상대의 코너 접근을 차단하면서 동시에 이동성을 확보했습니다. 이런 수를 두면 중반전에서 큰 우위를 점할 수 있어요.'
      },
      {
        position: { x: 2, y: 3 },
        evaluation: -15,
        category: 'mistake',
        alternatives: [
          { move: { x: 5, y: 2 }, evaluation: 25 },
          { move: { x: 4, y: 5 }, evaluation: 18 },
          { move: { x: 1, y: 3 }, evaluation: 12 }
        ],
        comment: '이 수는 너무 성급했습니다. 상대에게 좋은 반격 기회를 제공했네요. 대신 F3나 E6을 고려해보세요.'
      },
      {
        position: { x: 5, y: 3 },
        evaluation: 32,
        category: 'good',
        alternatives: [
          { move: { x: 3, y: 5 }, evaluation: 41 },
          { move: { x: 6, y: 2 }, evaluation: 28 }
        ],
        comment: '견고한 수입니다. 안정성을 추구하는 좋은 선택이에요. 다만 D6이 조금 더 적극적인 대안이 될 수 있었습니다.'
      },
      {
        position: { x: 6, y: 4 },
        evaluation: -42,
        category: 'blunder',
        alternatives: [
          { move: { x: 4, y: 6 }, evaluation: 15 },
          { move: { x: 7, y: 3 }, evaluation: 8 },
          { move: { x: 5, y: 5 }, evaluation: -2 }
        ],
        comment: '큰 실수입니다! 이 수로 인해 상대가 모서리를 차지할 수 있게 되었어요. E7이나 H4처럼 수비적인 수가 훨씬 나았을 겁니다.'
      },
      {
        position: { x: 2, y: 5 },
        evaluation: 58,
        category: 'excellent',
        alternatives: [
          { move: { x: 1, y: 4 }, evaluation: 45 },
          { move: { x: 3, y: 6 }, evaluation: 39 }
        ],
        comment: '훌륭한 복구 수! 이전 실수를 만회하는 멋진 수입니다. 상대의 공격 라인을 차단하면서 자신의 포지션을 강화했어요.'
      }
    ],
    tags: ['승리', '코너 장악']
  },
  {
    id: '2',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1일 전
    mode: 'tower',
    opponent: {
      name: '탑 가디언',
      type: 'ai',
      difficulty: 'Medium'
    },
    player: {
      color: -1, // White
      name: '우주의 오델로 수호자'
    },
    moves: [],
    result: {
      winner: -1,
      blackScore: 28,
      whiteScore: 36,
      endReason: 'normal'
    },
    duration: 1247, // 20분 47초
    tags: ['탑 15층']
  },
  {
    id: '3',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3일 전
    mode: 'quick',
    opponent: {
      name: '별빛검사',
      type: 'human',
      rank: 'Bronze II'
    },
    player: {
      color: 1,
      name: '우주의 오델로 수호자',
      rank: 'Bronze III'
    },
    moves: [],
    result: {
      winner: -1,
      blackScore: 22,
      whiteScore: 42,
      endReason: 'normal'
    },
    duration: 786,
    tags: ['패배']
  }
];


type SortField = ReplaySortOptions['field'];
type FilterOption = 'all' | 'wins' | 'losses' | 'draws' | 'tower' | 'ranked' | 'quick';

// Legacy GameRecord interface for backward compatibility
interface LegacyGameRecord {
  id: string;
  date: Date;
  mode: string;
  opponent: {
    name: string;
    type: 'ai' | 'human';
    difficulty?: string;
    rank?: string;
  };
  player: {
    color: number;
    name: string;
    rank?: string;
  };
  moves: any[];
  result: {
    winner: number | 'draw';
    blackScore: number;
    whiteScore: number;
    endReason: string;
  };
  duration: number;
  aiAnalysis?: any[];
  tags?: string[];
}

export default function ReplayPage() {
  const navigate = useNavigate();
  const {
    replays,
    uiState,
    isLoading,
    error,
    loadReplays,
    setSelectedReplay,
    setSearchQuery,
    updateFilters,
    updateSortOptions,
    getStatistics
  } = useReplayStore();

  const [showFilters, setShowFilters] = useState(false);

  // Load replays on mount
  useEffect(() => {
    loadReplays();
  }, [loadReplays]);

  // Convert replays to legacy format and apply filters
  const legacyGames = useMemo(() => replays.map(convertReplayToLegacyFormat), [replays]);

  // 필터링 및 정렬된 게임 목록
  const filteredAndSortedGames = useMemo(() => {
    let games = [...legacyGames];

    // 검색 필터
    if (uiState.searchQuery.trim()) {
      games = games.filter(game =>
        game.opponent.name.toLowerCase().includes(uiState.searchQuery.toLowerCase()) ||
        game.tags?.some(tag => tag.toLowerCase().includes(uiState.searchQuery.toLowerCase()))
      );
    }

    // 카테고리 필터 - using simple string for now
    const filterBy = 'all'; // Default filter
    if (filterBy !== 'all') {
      switch (filterBy) {
        case 'wins':
          games = games.filter(game => game.result.winner === game.player.color);
          break;
        case 'losses':
          games = games.filter(game => game.result.winner !== game.player.color && game.result.winner !== 'draw');
          break;
        case 'draws':
          games = games.filter(game => game.result.winner === 'draw');
          break;
        case 'tower':
        case 'ranked':
        case 'quick':
          games = games.filter(game => game.mode === filterBy);
          break;
      }
    }

    // 정렬
    games.sort((a, b) => {
      const { field, direction } = uiState.sortOptions;

      const diff = (() => {
        switch (field) {
          case 'date':
            return a.date.getTime() - b.date.getTime();
          case 'duration':
            return a.duration - b.duration;
          case 'rating': {
            const getResultPriority = (game: LegacyGameRecord) => {
              if (game.result.winner === game.player.color) return 2;
              if (game.result.winner === 'draw') return 1;
              return 0;
            };
            return getResultPriority(a) - getResultPriority(b);
          }
          default:
            return 0;
        }
      })();

      return direction === 'asc' ? diff : -diff;
    });

    return games;
  }, [legacyGames, uiState.searchQuery, uiState.sortOptions]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}분 ${remainingSeconds}초`;
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'tower': return <Crown size={16} className="text-yellow-400" />;
      case 'ranked': return <Swords size={16} className="text-purple-400" />;
      case 'quick': return <Zap size={16} className="text-blue-400" />;
      default: return <Star size={16} className="text-gray-400" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'tower': return 'from-yellow-400/20 to-orange-500/20 border-yellow-400/30';
      case 'ranked': return 'from-purple-400/20 to-purple-600/20 border-purple-400/30';
      case 'quick': return 'from-blue-400/20 to-blue-600/20 border-blue-400/30';
      default: return 'from-gray-400/20 to-gray-600/20 border-gray-400/30';
    }
  };

  const getResultInfo = (game: LegacyGameRecord) => {
    const isWin = game.result.winner === game.player.color;
    const isDraw = game.result.winner === 'draw';

    if (isDraw) {
      return {
        text: '무승부',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-400/10',
        icon: '='
      };
    }

    if (isWin) {
      return {
        text: '승리',
        color: 'text-green-400',
        bgColor: 'bg-green-400/10',
        icon: '🏆'
      };
    }

    return {
      text: '패배',
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      icon: '💀'
    };
  };

  return (
    <div className="h-full w-full overflow-hidden relative">
      {/* 시공간 기록 보관소 배경 */}
      <div className="absolute inset-0">
        <ReplayStarCanvas className="w-full h-full" />
      </div>

      {/* 오버레이 콘텐츠 */}
      <div className="relative z-10 h-full overflow-y-auto overflow-x-hidden">
        <div className="px-6 py-4 pb-32">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/more')}
                className="w-10 h-10 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl
                         flex items-center justify-center hover:bg-black/30 active:scale-95 transition-all"
              >
                <ArrowLeft size={20} className="text-white/90" />
              </button>
              <div>
                <h1 className="text-2xl font-display font-bold text-white tracking-wider">📼 시공간 아카이브</h1>
                <p className="text-sm text-white/60 font-display tracking-wide">당신의 오델로 여정을 돌아보세요</p>
              </div>
            </div>
          </div>

          {/* 통계 대시보드 */}
          {(() => {
            const stats = getStatistics();
            return (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 text-center">
                  <div className="text-2xl font-display font-bold text-blue-400">{stats.totalGames}</div>
                  <div className="text-xs text-white/70 font-display tracking-wider">전체 게임</div>
                </div>
                <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 text-center">
                  <div className="text-2xl font-display font-bold text-purple-400">
                    {Math.floor(stats.averageGameDuration / 60)}분
                  </div>
                  <div className="text-xs text-white/70 font-display tracking-wider">평균 게임시간</div>
                </div>
                <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 text-center">
                  <div className="text-2xl font-display font-bold text-green-400">{stats.winRate.toFixed(1)}%</div>
                  <div className="text-xs text-white/70 font-display tracking-wider">승률</div>
                </div>
              </div>
            );
          })()}

          {/* 검색 및 필터 */}
          <div className="mb-6 space-y-3">
            {/* 검색바 */}
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
              <input
                type="text"
                placeholder="상대 이름이나 태그로 검색..."
                value={uiState.searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                         text-white placeholder-white/50 font-display tracking-wide
                         focus:bg-black/30 focus:border-white/20 focus:outline-none transition-all"
              />
            </div>

            {/* 필터 토글 버튼 */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md border border-white/10
                       text-white/80 font-display tracking-wide hover:bg-black/30 transition-all"
            >
              <Filter size={16} />
              <span>필터 & 정렬</span>
              {showFilters ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {/* 필터 옵션들 */}
            {showFilters && (
              <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 space-y-4">
                <div>
                  <h4 className="text-white/90 font-display font-semibold mb-2 tracking-wider">정렬</h4>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: 'date', label: '최신순' },
                      { value: 'duration', label: '플레이시간순' },
                      { value: 'rating', label: '평점순' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => updateSortOptions({
                          field: option.value as 'date' | 'duration' | 'rating',
                          direction: 'desc'
                        })}
                        className={`px-3 py-1.5 rounded-lg font-display text-sm tracking-wider transition-all ${
                          uiState.sortOptions.field === option.value
                            ? 'bg-purple-400/30 text-purple-300 border border-purple-400/40'
                            : 'bg-white/10 text-white/70 border border-white/10 hover:bg-white/15'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-white/90 font-display font-semibold mb-2 tracking-wider">필터</h4>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: 'all', label: '전체' },
                      { value: 'wins', label: '승리' },
                      { value: 'losses', label: '패배' },
                      { value: 'draws', label: '무승부' },
                      { value: 'tower', label: '탑' },
                      { value: 'ranked', label: '랭크' },
                      { value: 'quick', label: '빠른게임' }
                    ].map(option => {
                      // Simple filter state for now
                      const currentFilter = 'all';
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            // TODO: Implement proper filtering
                            console.log('Filter by:', option.value);
                          }}
                          className={`px-3 py-1.5 rounded-lg font-display text-sm tracking-wider transition-all ${
                            currentFilter === option.value
                              ? 'bg-blue-400/30 text-blue-300 border border-blue-400/40'
                              : 'bg-white/10 text-white/70 border border-white/10 hover:bg-white/15'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 게임 리스트 */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-white/60 font-display">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400 border-t-transparent mx-auto mb-4"></div>
                <p>리플레이를 불러오는 중...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-400 font-display">
                <p>오류: {error}</p>
                <button
                  onClick={loadReplays}
                  className="mt-2 px-4 py-2 bg-red-400/20 rounded-lg hover:bg-red-400/30 transition-all"
                >
                  다시 시도
                </button>
              </div>
            ) : filteredAndSortedGames.length === 0 ? (
              <div className="text-center py-12 text-white/60 font-display">
                <Star size={48} className="mx-auto mb-4 text-white/30" />
                <p>검색 조건에 맞는 게임이 없습니다</p>
              </div>
            ) : (
              filteredAndSortedGames.map((game, index) => {
                const resultInfo = getResultInfo(game);

                return (
                  <div
                    key={game.id}
                    className="group p-5 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                             hover:bg-black/30 hover:border-white/20 transition-all duration-300"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'slideInUp 0.6s ease-out forwards'
                    }}
                  >
                    {/* 게임 헤더 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getModeColor(game.mode)}
                                       flex items-center justify-center backdrop-blur-sm`}>
                          {getModeIcon(game.mode)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-display font-bold ${resultInfo.bgColor} ${resultInfo.color}`}>
                              {resultInfo.icon} {resultInfo.text}
                            </span>
                            <span className="text-white/90 font-display font-semibold">vs {game.opponent.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-white/60 font-display">
                            <span>{game.opponent.rank || game.opponent.difficulty}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(game.date)}</span>
                            {game.mode === 'tower' && (
                              <>
                                <span>•</span>
                                <span>탑 {game.tags?.[0]?.replace(/\D/g, '') || '?'}층</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 게임 세부 정보 */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-white/70 font-display">
                        <span>스코어: {game.result.blackScore}-{game.result.whiteScore}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDuration(game.duration)}
                        </span>
                      </div>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={() => {
                          // Convert back to new format for ReplayViewer
                          const replay = replays.find(r => r.id === game.id);
                          if (replay) {
                            setSelectedReplay(replay);
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-400/20
                                       text-purple-300 font-display font-semibold tracking-wider
                                       hover:bg-purple-400/30 hover:text-purple-200
                                       active:scale-95 transition-all duration-200">
                        <Play size={14} />
                        재생
                      </button>

                      {game.aiAnalysis && (
                        <button
                          onClick={() => {
                            // Convert back to new format for analysis
                            const replay = replays.find(r => r.id === game.id);
                            if (replay) {
                              setSelectedReplay(replay);
                            }
                            console.log('AI 분석 시작:', game.aiAnalysis);
                            alert(`🤖 AI 분석\n\n${game.aiAnalysis?.[0]?.comment || '이 게임에 대한 분석을 시작합니다!'}\n\n평가: ${game.aiAnalysis?.[0]?.evaluation || 0}점\n카테고리: ${game.aiAnalysis?.[0]?.category || '분석중'}`);
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-400/20
                                         text-blue-300 font-display font-semibold tracking-wider
                                         hover:bg-blue-400/30 hover:text-blue-200
                                         active:scale-95 transition-all duration-200">
                          <Eye size={14} />
                          분석
                        </button>
                      )}

                      <button
                        onClick={() => {
                          // 게임 정보 복사
                          const gameInfo = `🎮 ${game.result.winner === game.player.color ? '승리' : '패배'} vs ${game.opponent.name}\n📊 ${game.result.blackScore}-${game.result.whiteScore}\n⏱️ ${formatDuration(game.duration)}\n🗓️ ${formatTimeAgo(game.date)}`;
                          navigator.clipboard.writeText(gameInfo);
                          alert('📋 게임 정보가 클립보드에 복사되었습니다!');
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10
                                       text-white/70 font-display font-semibold tracking-wider
                                       hover:bg-white/15 hover:text-white/80
                                       active:scale-95 transition-all duration-200">
                        <Share2 size={14} />
                        공유
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 리플레이 뷰어 모달 */}
      {uiState.selectedReplay && (
        <ReplayViewer
          gameReplay={uiState.selectedReplay}
          onClose={() => setSelectedReplay(null)}
        />
      )}

      {/* 애니메이션 키프레임 추가 */}
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}