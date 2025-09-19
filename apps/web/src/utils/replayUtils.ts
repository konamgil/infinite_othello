import { GameReplay, GameMove, ReplayFilters, ReplaySortOptions } from '../types/replay';

/**
 * Utility functions for replay system
 */

// Position conversion utilities
export const positionToAlgebraic = (x: number, y: number): string => {
  return `${String.fromCharCode(65 + x)}${y + 1}`;
};

export const algebraicToPosition = (algebraic: string): { x: number; y: number } | null => {
  if (algebraic.length !== 2) return null;
  const x = algebraic.charCodeAt(0) - 65;
  const y = parseInt(algebraic[1]) - 1;
  if (x < 0 || x > 7 || y < 0 || y > 7) return null;
  return { x, y };
};

// Time formatting utilities
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
};

export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
};

// Game result utilities
export const getPlayerResult = (replay: GameReplay, playerName: string = '우주의 오델로 수호자'): 'win' | 'loss' | 'draw' => {
  if (replay.result.winner === 'draw') return 'draw';

  const isPlayerBlack = replay.playerBlack.name === playerName;
  const playerWon = replay.result.winner === (isPlayerBlack ? 'black' : 'white');

  return playerWon ? 'win' : 'loss';
};

export const getResultIcon = (result: 'win' | 'loss' | 'draw'): string => {
  switch (result) {
    case 'win': return '🏆';
    case 'loss': return '❌';
    case 'draw': return '🤝';
    default: return '❓';
  }
};

export const getResultColor = (result: 'win' | 'loss' | 'draw'): string => {
  switch (result) {
    case 'win': return 'text-green-400';
    case 'loss': return 'text-red-400';
    case 'draw': return 'text-yellow-400';
    default: return 'text-gray-400';
  }
};

// Game mode utilities
export const getGameModeConfig = (mode: GameReplay['gameMode']) => {
  const configs = {
    tower: {
      name: '무한 탑',
      icon: '🏰',
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      borderColor: 'border-amber-400/20'
    },
    battle: {
      name: '랭크 대전',
      icon: '⚔️',
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/20'
    },
    casual: {
      name: '일반 대전',
      icon: '🎮',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20'
    },
    ai: {
      name: 'AI 대전',
      icon: '🤖',
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      borderColor: 'border-purple-400/20'
    }
  };

  return configs[mode] || configs.casual;
};

// Move analysis utilities
export const getMoveQualityColor = (evaluationScore?: number): string => {
  if (evaluationScore === undefined) return 'text-gray-400';
  if (evaluationScore >= 50) return 'text-green-400';
  if (evaluationScore >= 20) return 'text-blue-400';
  if (evaluationScore >= -10) return 'text-yellow-400';
  if (evaluationScore >= -30) return 'text-orange-400';
  return 'text-red-400';
};

export const getMoveQualityLabel = (evaluationScore?: number, isOptimal?: boolean): string => {
  if (isOptimal) return '최적수';
  if (evaluationScore === undefined) return '분석 없음';
  if (evaluationScore >= 50) return '훌륭함';
  if (evaluationScore >= 20) return '좋음';
  if (evaluationScore >= -10) return '부정확';
  if (evaluationScore >= -30) return '실수';
  return '대실수';
};

// Filtering utilities
export const applyReplayFilters = (
  replays: GameReplay[],
  filters: ReplayFilters,
  searchQuery: string = ''
): GameReplay[] => {
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
      const playerResult = getPlayerResult(replay);
      if (filters.result !== playerResult) return false;
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

// Sorting utilities
export const sortReplays = (replays: GameReplay[], sortOptions: ReplaySortOptions): GameReplay[] => {
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

// Export utilities
export const generateGameTitle = (replay: GameReplay): string => {
  const date = new Date(replay.gameInfo.startTime).toLocaleDateString('ko-KR');
  const opponent = replay.playerBlack.name === '우주의 오델로 수호자'
    ? replay.playerWhite.name
    : replay.playerBlack.name;
  const result = getPlayerResult(replay);
  const resultText = result === 'win' ? '승리' : result === 'loss' ? '패배' : '무승부';

  return `${date} vs ${opponent} (${resultText})`;
};

export const generateGameDescription = (replay: GameReplay): string => {
  const mode = getGameModeConfig(replay.gameMode).name;
  const duration = formatDuration(replay.gameInfo.duration);
  const score = `${replay.result.finalScore.black}-${replay.result.finalScore.white}`;

  return `${mode} • ${duration} • ${score}`;
};

// Statistics utilities
export const calculateWinRate = (replays: GameReplay[], playerName: string = '우주의 오델로 수호자'): number => {
  if (replays.length === 0) return 0;

  const wins = replays.filter(replay => getPlayerResult(replay, playerName) === 'win').length;
  return (wins / replays.length) * 100;
};

export const getStreakInfo = (replays: GameReplay[], playerName: string = '우주의 오델로 수호자'): {
  currentStreak: number;
  streakType: 'win' | 'loss';
  longestWinStreak: number;
  longestLossStreak: number;
} => {
  if (replays.length === 0) {
    return { currentStreak: 0, streakType: 'win', longestWinStreak: 0, longestLossStreak: 0 };
  }

  const sortedReplays = [...replays].sort((a, b) => b.gameInfo.startTime - a.gameInfo.startTime);

  let currentStreak = 0;
  let streakType: 'win' | 'loss' = 'win';
  let longestWinStreak = 0;
  let longestLossStreak = 0;

  let tempWinStreak = 0;
  let tempLossStreak = 0;
  let currentStreakCount = 0;
  let lastResult: 'win' | 'loss' | 'draw' | null = null;

  for (const replay of sortedReplays) {
    const result = getPlayerResult(replay, playerName);

    if (result === 'draw') continue; // Skip draws for streak calculation

    // Calculate current streak
    if (currentStreakCount === 0) {
      streakType = result;
      currentStreak = 1;
      currentStreakCount = 1;
    } else if (result === streakType) {
      currentStreak++;
      currentStreakCount++;
    } else {
      currentStreakCount = 0; // Reset current streak tracking
    }

    // Calculate longest streaks
    if (result === 'win') {
      tempWinStreak++;
      if (tempLossStreak > longestLossStreak) {
        longestLossStreak = tempLossStreak;
      }
      tempLossStreak = 0;
    } else if (result === 'loss') {
      tempLossStreak++;
      if (tempWinStreak > longestWinStreak) {
        longestWinStreak = tempWinStreak;
      }
      tempWinStreak = 0;
    }

    lastResult = result;
  }

  // Update longest streaks for final streaks
  if (tempWinStreak > longestWinStreak) {
    longestWinStreak = tempWinStreak;
  }
  if (tempLossStreak > longestLossStreak) {
    longestLossStreak = tempLossStreak;
  }

  return {
    currentStreak,
    streakType,
    longestWinStreak,
    longestLossStreak
  };
};

// Validation utilities
export const validateReplayData = (replay: GameReplay): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Basic structure validation
  if (!replay.id) errors.push('Missing replay ID');
  if (!replay.playerBlack?.name) errors.push('Missing black player name');
  if (!replay.playerWhite?.name) errors.push('Missing white player name');
  if (!replay.moves || !Array.isArray(replay.moves)) errors.push('Invalid moves data');
  if (!replay.gameInfo) errors.push('Missing game info');

  // Move validation
  if (replay.moves) {
    replay.moves.forEach((move, index) => {
      if (move.x < 0 || move.x > 7 || move.y < 0 || move.y > 7) {
        errors.push(`Invalid position in move ${index + 1}: (${move.x}, ${move.y})`);
      }
      if (!move.player || (move.player !== 'black' && move.player !== 'white')) {
        errors.push(`Invalid player in move ${index + 1}: ${move.player}`);
      }
      if (typeof move.timestamp !== 'number' || move.timestamp <= 0) {
        errors.push(`Invalid timestamp in move ${index + 1}`);
      }
    });
  }

  // Game info validation
  if (replay.gameInfo) {
    if (replay.gameInfo.startTime >= replay.gameInfo.endTime) {
      errors.push('Start time must be before end time');
    }
    if (replay.gameInfo.duration <= 0) {
      errors.push('Duration must be positive');
    }
    if (replay.gameInfo.totalMoves !== replay.moves.length) {
      errors.push('Total moves mismatch with actual moves array length');
    }
  }

  // Score validation
  if (replay.result) {
    const { black, white } = replay.result.finalScore;
    if (black + white > 64) {
      errors.push('Total score cannot exceed 64');
    }
    if (black < 0 || white < 0) {
      errors.push('Scores cannot be negative');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Data conversion utilities
export const convertLegacyReplayFormat = (legacyReplay: any): GameReplay | null => {
  try {
    // This would contain conversion logic for older replay formats
    // Implementation depends on the legacy format structure
    console.warn('Legacy replay conversion not implemented');
    return null;
  } catch (error) {
    console.error('Failed to convert legacy replay:', error);
    return null;
  }
};

// Search utilities
export const highlightSearchTerms = (text: string, searchQuery: string): string => {
  if (!searchQuery.trim()) return text;

  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-400/30 text-yellow-200">$1</mark>');
};

export const getSearchSuggestions = (replays: GameReplay[], query: string): string[] => {
  if (!query.trim()) return [];

  const suggestions = new Set<string>();
  const lowerQuery = query.toLowerCase();

  replays.forEach(replay => {
    // Add player name suggestions
    if (replay.playerBlack.name.toLowerCase().includes(lowerQuery)) {
      suggestions.add(replay.playerBlack.name);
    }
    if (replay.playerWhite.name.toLowerCase().includes(lowerQuery)) {
      suggestions.add(replay.playerWhite.name);
    }

    // Add game mode suggestions
    if (replay.gameMode.toLowerCase().includes(lowerQuery)) {
      suggestions.add(getGameModeConfig(replay.gameMode).name);
    }

    // Add tag suggestions
    replay.metadata.tags?.forEach(tag => {
      if (tag.toLowerCase().includes(lowerQuery)) {
        suggestions.add(tag);
      }
    });
  });

  return Array.from(suggestions).slice(0, 5); // Limit to 5 suggestions
};

// Performance utilities
export const estimateReplayComplexity = (replay: GameReplay): 'low' | 'medium' | 'high' => {
  let complexity = 0;

  // Base complexity from move count
  complexity += replay.moves.length / 60; // Normalize to average game length

  // Add complexity for analysis data
  if (replay.analysis) {
    complexity += 0.5;
    if (replay.analysis.turningPoints.length > 5) complexity += 0.3;
    if (replay.analysis.timeAnalysis) complexity += 0.2;
  }

  // Add complexity for metadata
  if (replay.metadata.tags && replay.metadata.tags.length > 3) complexity += 0.2;

  if (complexity < 1) return 'low';
  if (complexity < 2) return 'medium';
  return 'high';
};

export const shouldUseVirtualScrolling = (itemCount: number): boolean => {
  return itemCount > 100; // Use virtual scrolling for large lists
};

export const shouldEnablePerformanceMode = (replays: GameReplay[]): boolean => {
  const totalMoves = replays.reduce((sum, replay) => sum + replay.moves.length, 0);
  const avgComplexity = replays.reduce((sum, replay) => {
    const complexity = estimateReplayComplexity(replay);
    return sum + (complexity === 'high' ? 3 : complexity === 'medium' ? 2 : 1);
  }, 0) / replays.length;

  return totalMoves > 5000 || avgComplexity > 2 || replays.length > 200;
};