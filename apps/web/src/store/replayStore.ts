import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  GameReplay,
  ReplayUIState,
  ReplayFilters,
  ReplaySortOptions,
  ReplayPlayerControls,
  ReplayStatistics
} from '../types/replay';

// Mock data generator for replays
const generateMockReplays = (): GameReplay[] => {
  const gameModes = ['tower', 'battle', 'casual', 'ai'] as const;
  const aiLevels = ['easy', 'medium', 'hard', 'expert'] as const;
  const playerNames = [
    '우주의 수호자', '별빛 전사', '은하 정복자', '코스모스', '스타더스트',
    '네뷸라', '퀘이사', '블랙홀', '슈퍼노바', '컴테일', '안드로메다',
    '오리온', '베가', '시리우스', '알타이르'
  ];

  const replays: GameReplay[] = [];

  for (let i = 0; i < 50; i++) {
    const gameMode = gameModes[Math.floor(Math.random() * gameModes.length)];
    const startTime = Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000; // Last 30 days
    const duration = 300 + Math.random() * 1800; // 5-35 minutes
    const endTime = startTime + duration * 1000;
    const totalMoves = Math.floor(20 + Math.random() * 40); // 20-60 moves

    const isPlayerBlack = Math.random() > 0.5;
    const opponentIsAI = Math.random() > 0.6;
    const playerWon = Math.random() > 0.4; // 60% win rate

    const blackScore = 25 + Math.floor(Math.random() * 15);
    const whiteScore = 64 - blackScore;

    let winner: 'black' | 'white' | 'draw';
    if (blackScore === whiteScore) {
      winner = 'draw';
    } else if (blackScore > whiteScore) {
      winner = 'black';
    } else {
      winner = 'white';
    }

    // Adjust winner based on playerWon if player is involved
    if (isPlayerBlack && !playerWon && winner === 'black') {
      winner = 'white';
    } else if (!isPlayerBlack && !playerWon && winner === 'white') {
      winner = 'black';
    }

    const playerRating = 1400 + Math.floor(Math.random() * 600);
    const opponentRating = opponentIsAI ? undefined : 1200 + Math.floor(Math.random() * 800);

    const moves = [];
    for (let m = 0; m < totalMoves; m++) {
      moves.push({
        x: Math.floor(Math.random() * 8),
        y: Math.floor(Math.random() * 8),
        player: (m % 2 === 0 ? 'black' : 'white') as 'black' | 'white',
        timestamp: startTime + (m * (duration * 1000 / totalMoves)),
        flippedDiscs: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => ({
          x: Math.floor(Math.random() * 8),
          y: Math.floor(Math.random() * 8)
        })),
        moveNumber: m + 1,
        evaluationScore: Math.floor((Math.random() - 0.5) * 200), // -100 to 100
        isOptimal: Math.random() > 0.7,
        alternativeMoves: Array.from({ length: Math.floor(Math.random() * 3) }, () => ({
          x: Math.floor(Math.random() * 8),
          y: Math.floor(Math.random() * 8),
          score: Math.floor((Math.random() - 0.5) * 200)
        }))
      });
    }

    replays.push({
      id: `replay_${i.toString().padStart(3, '0')}`,
      gameMode,
      playerBlack: {
        name: isPlayerBlack ? '우주의 오델로 수호자' : (opponentIsAI ? `AI ${aiLevels[Math.floor(Math.random() * aiLevels.length)]}` : playerNames[Math.floor(Math.random() * playerNames.length)]),
        rating: isPlayerBlack ? playerRating : opponentRating,
        isAI: isPlayerBlack ? false : opponentIsAI,
        aiLevel: (isPlayerBlack ? false : opponentIsAI) ? aiLevels[Math.floor(Math.random() * aiLevels.length)] : undefined
      },
      playerWhite: {
        name: !isPlayerBlack ? '우주의 오델로 수호자' : (opponentIsAI ? `AI ${aiLevels[Math.floor(Math.random() * aiLevels.length)]}` : playerNames[Math.floor(Math.random() * playerNames.length)]),
        rating: !isPlayerBlack ? playerRating : opponentRating,
        isAI: !isPlayerBlack ? false : opponentIsAI,
        aiLevel: (!isPlayerBlack ? false : opponentIsAI) ? aiLevels[Math.floor(Math.random() * aiLevels.length)] : undefined
      },
      result: {
        winner,
        finalScore: { black: blackScore, white: whiteScore },
        gameEndReason: Math.random() > 0.9 ? 'resignation' : 'normal'
      },
      gameInfo: {
        startTime,
        endTime,
        duration: Math.floor(duration),
        boardSize: 8,
        totalMoves
      },
      moves,
      analysis: {
        accuracy: {
          black: 75 + Math.random() * 20,
          white: 70 + Math.random() * 25
        },
        turningPoints: [
          {
            moveNumber: Math.floor(totalMoves * 0.3),
            previousEvaluation: 10,
            newEvaluation: -15,
            significance: 'major' as const,
            description: '중반 전략적 실수'
          }
        ],
        openingName: ['시칠리안 디펜스', '킹스 인디안', '퀸즈 갬빗', '프렌치 디펜스'][Math.floor(Math.random() * 4)],
        gamePhases: {
          opening: { startMove: 1, endMove: Math.floor(totalMoves * 0.25), evaluation: '균등' },
          midgame: { startMove: Math.floor(totalMoves * 0.25), endMove: Math.floor(totalMoves * 0.75), evaluation: '약간 우세' },
          endgame: { startMove: Math.floor(totalMoves * 0.75), endMove: totalMoves, evaluation: '승부 결정' }
        },
        bestMoves: Array.from({ length: Math.floor(totalMoves * 0.3) }, () => Math.floor(Math.random() * totalMoves) + 1),
        blunders: Array.from({ length: Math.floor(totalMoves * 0.1) }, () => Math.floor(Math.random() * totalMoves) + 1)
      },
      metadata: {
        version: '1.0.0',
        platform: Math.random() > 0.5 ? 'web' : 'mobile',
        tags: ['practice', 'ranked'].filter(() => Math.random() > 0.5)
      }
    });
  }

  // Sort by start time (newest first)
  return replays.sort((a, b) => b.gameInfo.startTime - a.gameInfo.startTime);
};

interface ReplayState {
  replays: GameReplay[];
  filteredReplays: GameReplay[];
  uiState: ReplayUIState;
  isLoading: boolean;
  error: string | null;
  filterMemory: ReplayFilters | null;
}

interface ReplayActions {
  loadReplays: () => void;
  setViewMode: (mode: ReplayUIState['viewMode']) => void;
  setSelectedReplay: (replay: GameReplay | null) => void;
  updateFilters: (filters: Partial<ReplayFilters>) => void;
  updateSortOptions: (sort: ReplaySortOptions) => void;
  updatePlayerControls: (controls: Partial<ReplayPlayerControls>) => void;
  setSearchQuery: (query: string) => void;
  toggleStatistics: () => void;
  clearFilters: () => void;
  getStatistics: () => ReplayStatistics;
  getFilteredReplays: () => GameReplay[];
  applyQuickFilter: (type: 'recentWins' | 'challengingGames' | 'aiMatches' | 'longGames') => void;
  saveFilterMemory: () => void;
  loadFilterMemory: () => void;
}

type ReplayStore = ReplayState & ReplayActions;

const initialFilters: ReplayFilters = {
  gameMode: [],
  opponent: 'any',
  result: 'any',
  dateRange: undefined,
  minDuration: undefined,
  maxDuration: undefined,
  ratingRange: undefined,
  tags: []
};

const initialSortOptions: ReplaySortOptions = {
  field: 'date',
  direction: 'desc'
};

const initialPlayerControls: ReplayPlayerControls = {
  isPlaying: false,
  currentMoveIndex: 0,
  playbackSpeed: 1,
  autoPlay: false,
  showAnalysis: true,
  showCoordinates: true,
  highlightLastMove: true,
  showMoveAnnotations: true,
  criticalMoveDetection: true,
  soundEnabled: false,
  keyboardShortcutsEnabled: true
};

const initialUIState: ReplayUIState = {
  selectedReplay: null,
  viewMode: 'list',
  filters: initialFilters,
  sortOptions: initialSortOptions,
  playerControls: initialPlayerControls,
  showStatistics: false,
  searchQuery: ''
};

// Performance optimization: memoized filter functions
const applyFiltersToReplays = (replays: GameReplay[], filters: ReplayFilters, searchQuery: string): GameReplay[] => {
  return replays.filter(replay => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesPlayer =
        replay.playerBlack.name.toLowerCase().includes(query) ||
        replay.playerWhite.name.toLowerCase().includes(query);
      const matchesMode = replay.gameMode.toLowerCase().includes(query);
      const matchesTags = replay.metadata.tags?.some(tag =>
        tag.toLowerCase().includes(query)
      ) || false;
      if (!matchesPlayer && !matchesMode && !matchesTags) return false;
    }

    // Game mode filter
    if (filters.gameMode && filters.gameMode.length > 0) {
      if (!filters.gameMode.includes(replay.gameMode)) return false;
    }

    // Result filter
    if (filters.result && filters.result !== 'any') {
      const isPlayerBlack = replay.playerBlack.name === '우주의 오델로 수호자';
      const playerWon = replay.result.winner === (isPlayerBlack ? 'black' : 'white');
      const isDraw = replay.result.winner === 'draw';

      if (filters.result === 'win' && !playerWon) return false;
      if (filters.result === 'loss' && (playerWon || isDraw)) return false;
      if (filters.result === 'draw' && !isDraw) return false;
    }

    // Opponent filter
    if (filters.opponent && filters.opponent !== 'any') {
      const isPlayerBlack = replay.playerBlack.name === '우주의 오델로 수호자';
      const opponentIsAI = isPlayerBlack ? replay.playerWhite.isAI : replay.playerBlack.isAI;

      if (filters.opponent === 'ai' && !opponentIsAI) return false;
      if (filters.opponent === 'human' && opponentIsAI) return false;
    }

    // Date range filter
    if (filters.dateRange) {
      const gameDate = replay.gameInfo.startTime;
      if (filters.dateRange.start && gameDate < filters.dateRange.start.getTime()) return false;
      if (filters.dateRange.end && gameDate > filters.dateRange.end.getTime()) return false;
    }

    // Duration filters
    if (filters.minDuration && replay.gameInfo.duration < filters.minDuration) return false;
    if (filters.maxDuration && replay.gameInfo.duration > filters.maxDuration) return false;

    // Rating range filter
    if (filters.ratingRange) {
      const playerRating = replay.playerBlack.name === '우주의 오델로 수호자'
        ? replay.playerBlack.rating
        : replay.playerWhite.rating;
      const opponentRating = replay.playerBlack.name === '우주의 오델로 수호자'
        ? replay.playerWhite.rating
        : replay.playerBlack.rating;

      const maxRating = Math.max(playerRating || 0, opponentRating || 0);
      if (filters.ratingRange.min && maxRating < filters.ratingRange.min) return false;
      if (filters.ratingRange.max && maxRating > filters.ratingRange.max) return false;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const replayTags = replay.metadata.tags || [];
      const hasMatchingTag = filters.tags.some(tag =>
        replayTags.some(replayTag =>
          replayTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      if (!hasMatchingTag) return false;
    }

    return true;
  });
};

const sortReplays = (replays: GameReplay[], sortOptions: ReplaySortOptions): GameReplay[] => {
  return [...replays].sort((a, b) => {
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
};

export const useReplayStore = create<ReplayStore>()(
  devtools(
    (set, get) => ({
      replays: [],
      filteredReplays: [],
      uiState: initialUIState,
      isLoading: false,
      error: null,
      filterMemory: null,

      loadReplays: () => {
        set({ isLoading: true, error: null });

        // Simulate API call
        setTimeout(() => {
          try {
            const mockReplays = generateMockReplays();
            const state = get();
            const filtered = applyFiltersToReplays(mockReplays, state.uiState.filters, state.uiState.searchQuery);
            const sorted = sortReplays(filtered, state.uiState.sortOptions);

            set({
              replays: mockReplays,
              filteredReplays: sorted,
              isLoading: false
            });
          } catch (error) {
            set({
              error: 'Failed to load replay data',
              isLoading: false
            });
          }
        }, 500);
      },

      setViewMode: (mode) =>
        set((state) => ({
          uiState: { ...state.uiState, viewMode: mode }
        })),

      setSelectedReplay: (replay) =>
        set((state) => ({
          uiState: { ...state.uiState, selectedReplay: replay }
        })),

      updateFilters: (filters) => {
        const state = get();
        const newFilters = { ...state.uiState.filters, ...filters };
        const filtered = applyFiltersToReplays(state.replays, newFilters, state.uiState.searchQuery);
        const sorted = sortReplays(filtered, state.uiState.sortOptions);

        set({
          uiState: {
            ...state.uiState,
            filters: newFilters
          },
          filteredReplays: sorted
        });
      },

      updateSortOptions: (sort) => {
        const state = get();
        const filtered = applyFiltersToReplays(state.replays, state.uiState.filters, state.uiState.searchQuery);
        const sorted = sortReplays(filtered, sort);

        set({
          uiState: { ...state.uiState, sortOptions: sort },
          filteredReplays: sorted
        });
      },

      updatePlayerControls: (controls) =>
        set((state) => ({
          uiState: {
            ...state.uiState,
            playerControls: { ...state.uiState.playerControls, ...controls }
          }
        })),

      setSearchQuery: (query) => {
        const state = get();
        const filtered = applyFiltersToReplays(state.replays, state.uiState.filters, query);
        const sorted = sortReplays(filtered, state.uiState.sortOptions);

        set({
          uiState: { ...state.uiState, searchQuery: query },
          filteredReplays: sorted
        });
      },

      toggleStatistics: () =>
        set((state) => ({
          uiState: {
            ...state.uiState,
            showStatistics: !state.uiState.showStatistics
          }
        })),

      clearFilters: () => {
        const state = get();
        const filtered = applyFiltersToReplays(state.replays, initialFilters, '');
        const sorted = sortReplays(filtered, state.uiState.sortOptions);

        set({
          uiState: {
            ...state.uiState,
            filters: initialFilters,
            searchQuery: ''
          },
          filteredReplays: sorted
        });
      },

      getFilteredReplays: () => {
        return get().filteredReplays;
      },

      applyQuickFilter: (type) => {
        const state = get();
        let quickFilters: Partial<ReplayFilters> = {};

        switch (type) {
          case 'recentWins':
            quickFilters = {
              result: 'win',
              dateRange: {
                start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                end: new Date()
              }
            };
            break;
          case 'challengingGames':
            quickFilters = {
              ratingRange: { min: 1500, max: 2000 }
            };
            break;
          case 'aiMatches':
            quickFilters = {
              opponent: 'ai'
            };
            break;
          case 'longGames':
            quickFilters = {
              minDuration: 1800 // 30+ minutes
            };
            break;
        }

        const newFilters = { ...state.uiState.filters, ...quickFilters };
        const filtered = applyFiltersToReplays(state.replays, newFilters, state.uiState.searchQuery);
        const sorted = sortReplays(filtered, state.uiState.sortOptions);

        set({
          uiState: {
            ...state.uiState,
            filters: newFilters
          },
          filteredReplays: sorted
        });
      },

      saveFilterMemory: () => {
        const state = get();
        set({ filterMemory: state.uiState.filters });
        // In a real app, you'd save to localStorage here
        localStorage.setItem('replayFilterMemory', JSON.stringify(state.uiState.filters));
      },

      loadFilterMemory: () => {
        try {
          const saved = localStorage.getItem('replayFilterMemory');
          if (saved) {
            const filters = JSON.parse(saved);
            const state = get();
            const filtered = applyFiltersToReplays(state.replays, filters, state.uiState.searchQuery);
            const sorted = sortReplays(filtered, state.uiState.sortOptions);

            set({
              uiState: {
                ...state.uiState,
                filters
              },
              filteredReplays: sorted,
              filterMemory: filters
            });
          }
        } catch (error) {
          console.warn('Failed to load filter memory:', error);
        }
      },

      getStatistics: (): ReplayStatistics => {
        const { filteredReplays: replays } = get();
        const totalGames = replays.length;

        if (totalGames === 0) {
          return {
            totalGames: 0,
            winRate: 0,
            averageGameDuration: 0,
            averageMovesPerGame: 0,
            favoriteOpenings: [],
            strongestOpponents: [],
            performanceByMode: {
              tower: { games: 0, winRate: 0 },
              battle: { games: 0, winRate: 0 },
              casual: { games: 0, winRate: 0 },
              ai: { games: 0, winRate: 0 }
            },
            recentTrends: {
              last7Days: { games: 0, winRate: 0 },
              last30Days: { games: 0, winRate: 0 },
              last90Days: { games: 0, winRate: 0 }
            }
          };
        }

        // Calculate win rate based on which player is '우주의 오델로 수호자'
        const wins = replays.filter(r => {
          const isPlayerBlack = r.playerBlack.name === '우주의 오델로 수호자';
          return r.result.winner === (isPlayerBlack ? 'black' : 'white');
        }).length;
        const winRate = (wins / totalGames) * 100;

        // Calculate averages
        const totalDuration = replays.reduce((sum, r) => sum + r.gameInfo.duration, 0);
        const totalMoves = replays.reduce((sum, r) => sum + r.gameInfo.totalMoves, 0);

        // Performance by mode
        const performanceByMode = replays.reduce((acc, replay) => {
          const mode = replay.gameMode;
          if (!acc[mode]) {
            acc[mode] = { games: 0, winRate: 0, wins: 0 };
          }
          acc[mode].games++;
          const isPlayerBlack = replay.playerBlack.name === '우주의 오델로 수호자';
          const playerWon = replay.result.winner === (isPlayerBlack ? 'black' : 'white');
          if (playerWon) {
            acc[mode].wins++;
          }
          return acc;
        }, {} as any);

        Object.keys(performanceByMode).forEach(mode => {
          const data = performanceByMode[mode];
          data.winRate = data.games > 0 ? (data.wins / data.games) * 100 : 0;
          delete data.wins;
        });

        // Recent trends
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;

        const last7Days = replays.filter(r => now - r.gameInfo.startTime <= 7 * day);
        const last30Days = replays.filter(r => now - r.gameInfo.startTime <= 30 * day);
        const last90Days = replays.filter(r => now - r.gameInfo.startTime <= 90 * day);

        return {
          totalGames,
          winRate,
          averageGameDuration: Math.round(totalDuration / totalGames),
          averageMovesPerGame: Math.round(totalMoves / totalGames),
          favoriteOpenings: [
            { name: '시칠리안 디펜스', count: 12, winRate: 75 },
            { name: '킹즈 인디안', count: 8, winRate: 62.5 },
            { name: '퀸즈 갬빗', count: 6, winRate: 83.3 }
          ],
          strongestOpponents: [
            { name: '우주의 수호자', gamesPlayed: 5, winRate: 40 },
            { name: '은하 정복자', gamesPlayed: 3, winRate: 66.7 },
            { name: 'AI Expert', gamesPlayed: 8, winRate: 25 }
          ],
          performanceByMode: {
            tower: performanceByMode.tower || { games: 0, winRate: 0 },
            battle: performanceByMode.battle || { games: 0, winRate: 0 },
            casual: performanceByMode.casual || { games: 0, winRate: 0 },
            ai: performanceByMode.ai || { games: 0, winRate: 0 }
          },
          recentTrends: {
            last7Days: {
              games: last7Days.length,
              winRate: last7Days.length > 0 ? (last7Days.filter(r => {
                const isPlayerBlack = r.playerBlack.name === '우주의 오델로 수호자';
                return r.result.winner === (isPlayerBlack ? 'black' : 'white');
              }).length / last7Days.length) * 100 : 0
            },
            last30Days: {
              games: last30Days.length,
              winRate: last30Days.length > 0 ? (last30Days.filter(r => {
                const isPlayerBlack = r.playerBlack.name === '우주의 오델로 수호자';
                return r.result.winner === (isPlayerBlack ? 'black' : 'white');
              }).length / last30Days.length) * 100 : 0
            },
            last90Days: {
              games: last90Days.length,
              winRate: last90Days.length > 0 ? (last90Days.filter(r => {
                const isPlayerBlack = r.playerBlack.name === '우주의 오델로 수호자';
                return r.result.winner === (isPlayerBlack ? 'black' : 'white');
              }).length / last90Days.length) * 100 : 0
            }
          }
        };
      }
    }),
    {
      name: 'infinity-othello-replay-store'
    }
  )
);