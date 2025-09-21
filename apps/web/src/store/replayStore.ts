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

/**
 * 개발 및 테스트를 위한 `GameReplay` 모의 객체 목록을 생성합니다.
 * @returns {GameReplay[]} 50개의 모의 게임 리플레이 배열.
 */
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
    const startTime = Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000; // 최근 30일
    const duration = 300 + Math.random() * 1800; // 5-35분
    const endTime = startTime + duration * 1000;
    const totalMoves = Math.floor(20 + Math.random() * 40); // 20-60수

    const isPlayerBlack = Math.random() > 0.5;
    const opponentIsAI = Math.random() > 0.6;
    const playerWon = Math.random() > 0.4; // 60% 승률

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

    // 플레이어 승패 결과에 따라 승자 조정
    if (isPlayerBlack && !playerWon && winner === 'black') {
      winner = 'white';
    } else if (!isPlayerBlack && !playerWon && winner === 'white') {
      winner = 'black';
    }

    const playerRating = 1400 + Math.floor(Math.random() * 600);
    const opponentRating = opponentIsAI ? undefined : 1200 + Math.floor(Math.random() * 800);

    const moves = Array.from({ length: totalMoves }, (v, m) => ({
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
    }));

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

  // 최신순으로 정렬
  return replays.sort((a, b) => b.gameInfo.startTime - a.gameInfo.startTime);
};

/**
 * @interface ReplayState
 * 리플레이 기능의 상태 형태를 정의합니다.
 */
interface ReplayState {
  /** @property {GameReplay[]} replays - 필터링되지 않은 모든 리플레이 원본 목록. */
  replays: GameReplay[];
  /** @property {GameReplay[]} filteredReplays - 필터링 및 정렬이 적용된 후의 리플레이 목록. */
  filteredReplays: GameReplay[];
  /** @property {ReplayUIState} uiState - 필터, 정렬, 플레이어 컨트롤을 포함한 UI 상태. */
  uiState: ReplayUIState;
  /** @property {boolean} isLoading - 리플레이를 로드 중일 때 true. */
  isLoading: boolean;
  /** @property {string | null} error - 리플레이 로딩 또는 처리 중 발생한 에러 메시지. */
  error: string | null;
  /** @property {ReplayFilters | null} filterMemory - 나중에 복원하기 위한 필터 스냅샷. */
  filterMemory: ReplayFilters | null;
}

/**
 * @interface ReplayActions
 * 리플레이 상태에 대해 수행할 수 있는 액션들을 정의합니다.
 */
interface ReplayActions {
  /** 초기 리플레이 목록을 로드합니다. */
  loadReplays: () => void;
  /** 리플레이 목록의 보기 모드('list' 또는 'grid')를 설정합니다. */
  setViewMode: (mode: ReplayUIState['viewMode']) => void;
  /** 현재 선택된 리플레이를 설정합니다. */
  setSelectedReplay: (replay: GameReplay | null) => void;
  /** 필터를 업데이트하고 리플레이 목록에 다시 적용합니다. */
  updateFilters: (filters: Partial<ReplayFilters>) => void;
  /** 정렬 옵션을 업데이트하고 리플레이 목록을 다시 정렬합니다. */
  updateSortOptions: (sort: ReplaySortOptions) => void;
  /** 리플레이 플레이어의 컨트롤 상태를 업데이트합니다. */
  updatePlayerControls: (controls: Partial<ReplayPlayerControls>) => void;
  /** 검색어를 설정하고 목록을 다시 필터링합니다. */
  setSearchQuery: (query: string) => void;
  /** 통계 패널의 표시 여부를 토글합니다. */
  toggleStatistics: () => void;
  /** 모든 필터를 초기 상태로 리셋합니다. */
  clearFilters: () => void;
  /** 현재 필터링된 리플레이를 기반으로 통계를 계산하여 반환합니다. */
  getStatistics: () => ReplayStatistics;
  /** 현재 필터링 및 정렬된 리플레이 목록을 반환합니다. */
  getFilteredReplays: () => GameReplay[];
  /** 미리 정의된 필터셋을 적용합니다. */
  applyQuickFilter: (type: 'recentWins' | 'challengingGames' | 'aiMatches' | 'longGames') => void;
  /** 현재 필터 상태를 메모리/localStorage에 저장합니다. */
  saveFilterMemory: () => void;
  /** 메모리/localStorage에서 필터 상태를 불러옵니다. */
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

/**
 * 리플레이 목록에 필터와 검색어를 적용합니다.
 * 성능을 위해 이 함수는 스토어 외부에서 순수 함수로 관리될 수 있습니다.
 * @param {GameReplay[]} replays - 원본 리플레이 배열.
 * @param {ReplayFilters} filters - 필터 기준.
 * @param {string} searchQuery - 사용자 검색어.
 * @returns {GameReplay[]} 필터링된 리플레이 배열.
 */
const applyFiltersToReplays = (replays: GameReplay[], filters: ReplayFilters, searchQuery: string): GameReplay[] => {
  return replays.filter(replay => {
    // 검색 필터
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

    // 게임 모드 필터
    if (filters.gameMode && filters.gameMode.length > 0) {
      if (!filters.gameMode.includes(replay.gameMode)) return false;
    }

    // 결과 필터
    if (filters.result && filters.result !== 'any') {
      const isPlayerBlack = replay.playerBlack.name === '우주의 오델로 수호자';
      const playerWon = replay.result.winner === (isPlayerBlack ? 'black' : 'white');
      const isDraw = replay.result.winner === 'draw';

      if (filters.result === 'win' && !playerWon) return false;
      if (filters.result === 'loss' && (playerWon || isDraw)) return false;
      if (filters.result === 'draw' && !isDraw) return false;
    }

    // 상대방 필터
    if (filters.opponent && filters.opponent !== 'any') {
      const isPlayerBlack = replay.playerBlack.name === '우주의 오델로 수호자';
      const opponentIsAI = isPlayerBlack ? replay.playerWhite.isAI : replay.playerBlack.isAI;

      if (filters.opponent === 'ai' && !opponentIsAI) return false;
      if (filters.opponent === 'human' && opponentIsAI) return false;
    }

    // 날짜 범위 필터
    if (filters.dateRange) {
      const gameDate = replay.gameInfo.startTime;
      if (filters.dateRange.start && gameDate < filters.dateRange.start.getTime()) return false;
      if (filters.dateRange.end && gameDate > filters.dateRange.end.getTime()) return false;
    }

    // 게임 시간 필터
    if (filters.minDuration && replay.gameInfo.duration < filters.minDuration) return false;
    if (filters.maxDuration && replay.gameInfo.duration > filters.maxDuration) return false;

    // 레이팅 범위 필터
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

    // 태그 필터
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

/**
 * 제공된 정렬 옵션에 따라 리플레이 배열을 정렬합니다.
 * @param {GameReplay[]} replays - 정렬할 리플레이 배열.
 * @param {ReplaySortOptions} sortOptions - 정렬 기준.
 * @returns {GameReplay[]} 정렬된 리플레이 배열.
 */
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

/**
 * 게임 리플레이 기능의 상태를 관리하는 Zustand 스토어입니다.
 *
 * 이 스토어는 게임 리플레이의 로딩, 필터링, 정렬 및 보기를 처리합니다.
 * 현재는 모의 데이터를 사용하지만 실제 API와 함께 작동하도록 구성되어 있습니다.
 */
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

        // API 호출 시뮬레이션
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
              error: '리플레이 데이터 로드 실패',
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
              minDuration: 1800 // 30+ 분
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
        // 실제 앱에서는 여기서 localStorage에 저장
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
          console.warn('필터 메모리 로드 실패:', error);
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

        // '우주의 오델로 수호자' 기준 승률 계산
        const wins = replays.filter(r => {
          const isPlayerBlack = r.playerBlack.name === '우주의 오델로 수호자';
          return r.result.winner === (isPlayerBlack ? 'black' : 'white');
        }).length;
        const winRate = (wins / totalGames) * 100;

        // 평균 계산
        const totalDuration = replays.reduce((sum, r) => sum + r.gameInfo.duration, 0);
        const totalMoves = replays.reduce((sum, r) => sum + r.gameInfo.totalMoves, 0);

        // 모드별 성능
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

        // 최근 동향
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