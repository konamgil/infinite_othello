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
  uiState: ReplayUIState;
  isLoading: boolean;
  error: string | null;
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
}

type ReplayStore = ReplayState & ReplayActions;

const initialFilters: ReplayFilters = {
  gameMode: [],
  opponent: 'any',
  result: 'any'
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
  highlightLastMove: true
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

export const useReplayStore = create<ReplayStore>()(
  devtools(
    (set, get) => ({
      replays: [],
      uiState: initialUIState,
      isLoading: false,
      error: null,

      loadReplays: () => {
        set({ isLoading: true, error: null });

        // Simulate API call
        setTimeout(() => {
          try {
            const mockReplays = generateMockReplays();
            set({
              replays: mockReplays,
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

      updateFilters: (filters) =>
        set((state) => ({
          uiState: {
            ...state.uiState,
            filters: { ...state.uiState.filters, ...filters }
          }
        })),

      updateSortOptions: (sort) =>
        set((state) => ({
          uiState: { ...state.uiState, sortOptions: sort }
        })),

      updatePlayerControls: (controls) =>
        set((state) => ({
          uiState: {
            ...state.uiState,
            playerControls: { ...state.uiState.playerControls, ...controls }
          }
        })),

      setSearchQuery: (query) =>
        set((state) => ({
          uiState: { ...state.uiState, searchQuery: query }
        })),

      toggleStatistics: () =>
        set((state) => ({
          uiState: {
            ...state.uiState,
            showStatistics: !state.uiState.showStatistics
          }
        })),

      clearFilters: () =>
        set((state) => ({
          uiState: {
            ...state.uiState,
            filters: initialFilters,
            searchQuery: ''
          }
        })),

      getStatistics: (): ReplayStatistics => {
        const { replays } = get();
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

        // Calculate win rate (assuming player is always black for simplicity)
        const wins = replays.filter(r => r.result.winner === 'black').length;
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
          if (replay.result.winner === 'black') {
            acc[mode].wins++;
          }
          return acc;
        }, {} as any);

        Object.keys(performanceByMode).forEach(mode => {
          const data = performanceByMode[mode];
          data.winRate = (data.wins / data.games) * 100;
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
              winRate: last7Days.length > 0 ? (last7Days.filter(r => r.result.winner === 'black').length / last7Days.length) * 100 : 0
            },
            last30Days: {
              games: last30Days.length,
              winRate: last30Days.length > 0 ? (last30Days.filter(r => r.result.winner === 'black').length / last30Days.length) * 100 : 0
            },
            last90Days: {
              games: last90Days.length,
              winRate: last90Days.length > 0 ? (last90Days.filter(r => r.result.winner === 'black').length / last90Days.length) * 100 : 0
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