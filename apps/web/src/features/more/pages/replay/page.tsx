import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReplayStarCanvas } from '../../../../ui/replay/ReplayStarCanvas';
import { ReplayViewer } from '../../../../ui/replay/ReplayViewer';
import { useReplayStore } from '../../../../store/replayStore';
import type { ReplaySortOptions } from '../../../../types/replay';
import { GameReplay } from '../../../../types/replay';
import { ReplayFilters } from '../../../../ui/replay/ReplayFilters';
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
  ChevronRight,
  Brain
} from 'lucide-react';

/**
 * Converts a `GameReplay` object from the new data format to the legacy `LegacyGameRecord` format.
 * This is used for backward compatibility with UI components that expect the older data structure.
 *
 * @param {GameReplay} replay - The replay object in the new format.
 * @returns {LegacyGameRecord} The replay object converted to the legacy format.
 */
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

/**
 * The main page for browsing and viewing game replays.
 *
 * This component provides a rich interface for users to interact with their game history.
 * Key features include:
 * - Loading and displaying a list of all past games.
 * - A statistics dashboard summarizing the player's performance.
 * - Advanced filtering, sorting, and searching capabilities for the replay list.
 * - Launching a `ReplayViewer` modal to watch a selected game.
 * - Compatibility with both new and legacy replay data formats.
 *
 * It uses a dedicated `useReplayStore` to manage its complex state.
 *
 * @returns {React.ReactElement} The rendered replay browser page.
 */
export default function ReplayPage() {
  const navigate = useNavigate();
  const {
    replays,
    filteredReplays,
    uiState,
    isLoading,
    error,
    loadReplays,
    setSelectedReplay,
    setSearchQuery,
    updateFilters,
    updateSortOptions,
    getStatistics,
    getFilteredReplays,
    applyQuickFilter,
    saveFilterMemory,
    loadFilterMemory
  } = useReplayStore();

  const [showFilters, setShowFilters] = useState(false);

  // Load filter memory on mount
  useEffect(() => {
    loadFilterMemory();
  }, [loadFilterMemory]);

  // Load replays on mount
  useEffect(() => {
    loadReplays();
  }, [loadReplays]);

  // Use filtered replays from store for optimized performance
  const currentFilteredReplays = getFilteredReplays();

  // Convert filtered replays to legacy format for UI compatibility
  const filteredAndSortedGames = useMemo(() =>
    currentFilteredReplays.map(convertReplayToLegacyFormat),
    [currentFilteredReplays]
  );

  // --- Helper Functions ---

  /**
   * Formats a duration in seconds into a "M분 S초" string.
   * @param {number} seconds - The duration in seconds.
   * @returns {string} The formatted duration string.
   */
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}분 ${remainingSeconds}초`;
  };

  /**
   * Formats a date object into a "time ago" string (e.g., "5분 전", "2시간 전").
   * @param {Date} date - The date to format.
   * @returns {string} The formatted time ago string.
   */
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

  /**
   * Returns an icon component based on the game mode string.
   * @param {string} mode - The game mode (e.g., 'tower', 'ranked').
   * @returns {React.ReactElement} The corresponding icon.
   */
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'tower': return <Crown size={16} className="text-yellow-400" />;
      case 'ranked': return <Swords size={16} className="text-purple-400" />;
      case 'quick': return <Zap size={16} className="text-blue-400" />;
      default: return <Star size={16} className="text-gray-400" />;
    }
  };

  /**
   * Returns a set of Tailwind CSS classes for the background color based on the game mode.
   * @param {string} mode - The game mode.
   * @returns {string} The Tailwind CSS classes for the background.
   */
  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'tower': return 'from-yellow-400/20 to-orange-500/20 border-yellow-400/30';
      case 'ranked': return 'from-purple-400/20 to-purple-600/20 border-purple-400/30';
      case 'quick': return 'from-blue-400/20 to-blue-600/20 border-blue-400/30';
      default: return 'from-gray-400/20 to-gray-600/20 border-gray-400/30';
    }
  };

  /**
   * Returns display information (text, color, icon) based on the game result.
   * @param {LegacyGameRecord} game - The game record.
   * @returns {{text: string, color: string, bgColor: string, icon: string}} An object with display properties.
   */
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
        <div className="px-3 py-4 pb-28">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-5">
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
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 text-center">
                  <div className="text-xl font-display font-bold text-blue-400">{stats.totalGames}</div>
                  <div className="text-xs text-white/70 font-display tracking-wider">전체 게임</div>
                </div>
                <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 text-center">
                  <div className="text-xl font-display font-bold text-purple-400">
                    {Math.floor(stats.averageGameDuration / 60)}분
                  </div>
                  <div className="text-xs text-white/70 font-display tracking-wider">평균 게임시간</div>
                </div>
                <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 text-center">
                  <div className="text-xl font-display font-bold text-green-400">{stats.winRate.toFixed(1)}%</div>
                  <div className="text-xs text-white/70 font-display tracking-wider">승률</div>
                </div>
              </div>
            );
          })()}

          {/* Enhanced Filters Component */}
          <div className="mb-5">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-black/20 backdrop-blur-md border border-white/10
                       text-white/80 font-display tracking-wide hover:bg-black/30 transition-all mb-3 w-full justify-between"
            >
              <div className="flex items-center gap-2">
                <Filter size={16} />
                <span>고급 필터링 및 검색</span>
              </div>
              {showFilters ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {showFilters && (
              <ReplayFilters
                filters={uiState.filters}
                sortOptions={uiState.sortOptions}
                searchQuery={uiState.searchQuery}
                onFiltersChange={updateFilters}
                onSortChange={updateSortOptions}
                onSearchChange={setSearchQuery}
                onClose={() => setShowFilters(false)}
              />
            )}
          </div>

          {/* 게임 리스트 */}
          <div className="space-y-3">
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
                <h3 className="text-xl font-bold text-white/90 mb-2">검색 결과가 없습니다</h3>
                <p className="mb-4">필터 조건에 맞는 리플레이를 찾을 수 없습니다</p>
                <button
                  onClick={() => {
                    updateFilters({
                      gameMode: [],
                      opponent: 'any',
                      result: 'any',
                      dateRange: undefined,
                      ratingRange: undefined
                    });
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-purple-400/20 rounded-lg hover:bg-purple-400/30 transition-all
                           text-purple-300 font-display tracking-wider"
                >
                  필터 초기화
                </button>
              </div>
            ) : (
              filteredAndSortedGames.map((game, index) => {
                const resultInfo = getResultInfo(game);

                return (
                  <div
                    key={game.id}
                    className="group p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                             hover:bg-black/30 hover:border-white/20 transition-all duration-300
                             opacity-0 translate-y-5"
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
                          const replay = currentFilteredReplays.find(r => r.id === game.id) || replays.find(r => r.id === game.id);
                          if (replay) {
                            setSelectedReplay(replay);
                            // Save current filter state for later
                            saveFilterMemory();
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-400/20
                                       text-purple-300 font-display font-medium text-sm tracking-wide
                                       hover:bg-purple-400/30 hover:text-purple-200
                                       active:scale-95 transition-all duration-200">
                        <Play size={12} />
                        재생
                      </button>

                      <button
                        onClick={() => {
                          // Convert back to new format for ReplayViewer with analysis
                          const replay = currentFilteredReplays.find(r => r.id === game.id) || replays.find(r => r.id === game.id);
                          if (replay) {
                            setSelectedReplay(replay);
                            saveFilterMemory();
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-400/20
                                       text-green-300 font-display font-medium text-sm tracking-wide
                                       hover:bg-green-400/30 hover:text-green-200
                                       active:scale-95 transition-all duration-200">
                        <Brain size={12} />
                        AI 분석
                      </button>

                      <button
                        onClick={() => {
                          // 게임 정보 복사
                          const gameInfo = `🎮 ${game.result.winner === game.player.color ? '승리' : '패배'} vs ${game.opponent.name}\n📊 ${game.result.blackScore}-${game.result.whiteScore}\n⏱️ ${formatDuration(game.duration)}\n🗓️ ${formatTimeAgo(game.date)}`;
                          navigator.clipboard.writeText(gameInfo);
                          alert('📋 게임 정보가 클립보드에 복사되었습니다!');
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10
                                       text-white/70 font-display font-medium text-sm tracking-wide
                                       hover:bg-white/15 hover:text-white/80
                                       active:scale-95 transition-all duration-200">
                        <Share2 size={12} />
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
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* 애니메이션 시작 전 초기 상태 보장 */
        .game-card-enter {
          opacity: 0;
          transform: translateY(20px);
        }
      `}</style>
    </div>
  );
}