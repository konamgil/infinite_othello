import { GameReplay, GameMove, ReplayFilters, ReplaySortOptions } from '../types/replay';

/**
 * ======================================================
 * 리플레이 시스템 유틸리티 함수 (Replay System Utilities)
 * ======================================================
 * 이 파일은 리플레이 데이터를 처리, 포맷, 필터링, 정렬하는 등
 * 리플레이 시스템 전반에 사용되는 헬퍼 함수들을 모아놓은 라이브러리입니다.
 */

// --- 좌표 변환 유틸리티 ---

/**
 * (x, y) 숫자 좌표를 'A1', 'H8'과 같은 대수 표기법으로 변환합니다.
 * @param {number} x - x 좌표 (0-7).
 * @param {number} y - y 좌표 (0-7).
 * @returns {string} 대수 표기법 문자열.
 */
export const positionToAlgebraic = (x: number, y: number): string => {
  return `${String.fromCharCode(65 + x)}${y + 1}`;
};

/**
 * 대수 표기법 문자열을 (x, y) 숫자 좌표로 변환합니다.
 * @param {string} algebraic - 'A1'과 같은 대수 표기법 문자열.
 * @returns {{ x: number; y: number } | null} 변환된 좌표 객체 또는 유효하지 않은 경우 null.
 */
export const algebraicToPosition = (algebraic: string): { x: number; y: number } | null => {
  if (algebraic.length !== 2) return null;
  const x = algebraic.charCodeAt(0) - 65;
  const y = parseInt(algebraic[1]) - 1;
  if (x < 0 || x > 7 || y < 0 || y > 7) return null;
  return { x, y };
};

// --- 시간 포맷 유틸리티 ---

/**
 * 초 단위의 시간을 'HH:MM:SS' 또는 'MM:SS' 형식의 문자열로 변환합니다.
 * @param {number} seconds - 변환할 시간 (초).
 * @returns {string} 포맷팅된 시간 문자열.
 */
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

/**
 * 타임스탬프를 현재 시간과 비교하여 '방금 전', '5분 전'과 같은 상대 시간 문자열로 변환합니다.
 * @param {number} timestamp - 비교할 Unix 타임스탬프 (밀리초).
 * @returns {string} 상대 시간 문자열.
 */
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

// --- 게임 결과 유틸리티 ---

/**
 * 특정 플레이어의 관점에서 게임 결과를 반환합니다.
 * @param {GameReplay} replay - 분석할 리플레이 객체.
 * @param {string} [playerName='우주의 오델로 수호자'] - 기준이 되는 플레이어의 이름.
 * @returns {'win' | 'loss' | 'draw'} 해당 플레이어의 승/패/무승부 결과.
 */
export const getPlayerResult = (replay: GameReplay, playerName: string = '우주의 오델로 수호자'): 'win' | 'loss' | 'draw' => {
  if (replay.result.winner === 'draw') return 'draw';
  const isPlayerBlack = replay.playerBlack.name === playerName;
  const playerWon = replay.result.winner === (isPlayerBlack ? 'black' : 'white');
  return playerWon ? 'win' : 'loss';
};

/**
 * 게임 결과에 해당하는 아이콘을 반환합니다.
 * @param {'win' | 'loss' | 'draw'} result - 게임 결과.
 * @returns {string} 결과 아이콘 이모지.
 */
export const getResultIcon = (result: 'win' | 'loss' | 'draw'): string => {
  switch (result) {
    case 'win': return '🏆';
    case 'loss': return '❌';
    case 'draw': return '🤝';
    default: return '❓';
  }
};

/**
 * 게임 결과에 해당하는 Tailwind CSS 색상 클래스를 반환합니다.
 * @param {'win' | 'loss' | 'draw'} result - 게임 결과.
 * @returns {string} Tailwind CSS 텍스트 색상 클래스.
 */
export const getResultColor = (result: 'win' | 'loss' | 'draw'): string => {
  switch (result) {
    case 'win': return 'text-green-400';
    case 'loss': return 'text-red-400';
    case 'draw': return 'text-yellow-400';
    default: return 'text-gray-400';
  }
};

// --- 게임 모드 유틸리티 ---

/**
 * 게임 모드에 따른 UI 설정값(이름, 아이콘, 색상 등)을 반환합니다.
 * @param {GameReplay['gameMode']} mode - 게임 모드.
 * @returns {{ name: string; icon: string; color: string; bgColor: string; borderColor: string; }} UI 설정 객체.
 */
export const getGameModeConfig = (mode: GameReplay['gameMode']) => {
  const configs = {
    tower: { name: '무한 탑', icon: '🏰', color: 'text-amber-400', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/20' },
    battle: { name: '랭크 대전', icon: '⚔️', color: 'text-red-400', bgColor: 'bg-red-400/10', borderColor: 'border-red-400/20' },
    casual: { name: '일반 대전', icon: '🎮', color: 'text-blue-400', bgColor: 'bg-blue-400/10', borderColor: 'border-blue-400/20' },
    ai: { name: 'AI 대전', icon: '🤖', color: 'text-purple-400', bgColor: 'bg-purple-400/10', borderColor: 'border-purple-400/20' }
  };
  return configs[mode] || configs.casual;
};

// --- 수 분석 유틸리티 ---

/**
 * 평가 점수에 따라 수의 품질을 나타내는 색상 클래스를 반환합니다.
 * @param {number} [evaluationScore] - 수의 평가 점수.
 * @returns {string} Tailwind CSS 텍스트 색상 클래스.
 */
export const getMoveQualityColor = (evaluationScore?: number): string => {
  if (evaluationScore === undefined) return 'text-gray-400';
  if (evaluationScore >= 50) return 'text-green-400';
  if (evaluationScore >= 20) return 'text-blue-400';
  if (evaluationScore >= -10) return 'text-yellow-400';
  if (evaluationScore >= -30) return 'text-orange-400';
  return 'text-red-400';
};

/**
 * 평가 점수에 따라 수의 품질을 나타내는 레이블을 반환합니다.
 * @param {number} [evaluationScore] - 수의 평가 점수.
 * @param {boolean} [isOptimal] - 최적의 수인지 여부.
 * @returns {string} 품질 레이블 문자열.
 */
export const getMoveQualityLabel = (evaluationScore?: number, isOptimal?: boolean): string => {
  if (isOptimal) return '최적수';
  if (evaluationScore === undefined) return '분석 없음';
  if (evaluationScore >= 50) return '훌륭함';
  if (evaluationScore >= 20) return '좋음';
  if (evaluationScore >= -10) return '부정확';
  if (evaluationScore >= -30) return '실수';
  return '대실수';
};

// --- 필터링 및 정렬 유틸리티 ---

/**
 * 주어진 필터와 검색어에 따라 리플레이 목록을 필터링합니다.
 * @param {GameReplay[]} replays - 필터링할 전체 리플레이 배열.
 * @param {ReplayFilters} filters - 적용할 필터 조건 객체.
 * @param {string} [searchQuery=''] - 사용자 검색어.
 * @returns {GameReplay[]} 필터링된 리플레이 배열.
 */
export const applyReplayFilters = (
  replays: GameReplay[],
  filters: ReplayFilters,
  searchQuery: string = ''
): GameReplay[] => {
  return replays.filter(replay => {
    // 검색어 필터: 플레이어 이름, 게임 모드, 태그에서 검색
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesPlayer = replay.playerBlack.name.toLowerCase().includes(query) || replay.playerWhite.name.toLowerCase().includes(query);
      const matchesMode = getGameModeConfig(replay.gameMode).name.toLowerCase().includes(query);
      const matchesTags = replay.metadata.tags?.some(tag => tag.toLowerCase().includes(query)) || false;
      if (!matchesPlayer && !matchesMode && !matchesTags) return false;
    }
    // 게임 모드 필터
    if (filters.gameMode && filters.gameMode.length > 0 && !filters.gameMode.includes(replay.gameMode)) {
      return false;
    }
    // 결과 필터
    if (filters.result && filters.result !== 'any' && filters.result !== getPlayerResult(replay)) {
      return false;
    }
    // 상대방 필터 (AI/인간)
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
    // 게임 길이 필터
    if (filters.minDuration && replay.gameInfo.duration < filters.minDuration) return false;
    if (filters.maxDuration && replay.gameInfo.duration > filters.maxDuration) return false;
    // 레이팅 범위 필터
    if (filters.ratingRange) {
      const maxRating = Math.max(replay.playerBlack.rating || 0, replay.playerWhite.rating || 0);
      if (filters.ratingRange.min && maxRating < filters.ratingRange.min) return false;
      if (filters.ratingRange.max && maxRating > filters.ratingRange.max) return false;
    }
    // 태그 필터
    if (filters.tags && filters.tags.length > 0) {
      const replayTags = replay.metadata.tags || [];
      if (!filters.tags.some(tag => replayTags.some(replayTag => replayTag.toLowerCase().includes(tag.toLowerCase())))) {
        return false;
      }
    }
    return true;
  });
};

/**
 * 주어진 정렬 옵션에 따라 리플레이 목록을 정렬합니다.
 * @param {GameReplay[]} replays - 정렬할 리플레이 배열.
 * @param {ReplaySortOptions} sortOptions - 정렬 필드와 방향.
 * @returns {GameReplay[]} 정렬된 새로운 리플레이 배열.
 */
export const sortReplays = (replays: GameReplay[], sortOptions: ReplaySortOptions): GameReplay[] => {
  return [...replays].sort((a, b) => {
    const { field, direction } = sortOptions;
    let comparison = 0;
    switch (field) {
      case 'date': comparison = a.gameInfo.startTime - b.gameInfo.startTime; break;
      case 'duration': comparison = a.gameInfo.duration - b.gameInfo.duration; break;
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
      case 'moves': comparison = a.gameInfo.totalMoves - b.gameInfo.totalMoves; break;
      default: comparison = 0;
    }
    return direction === 'asc' ? comparison : -comparison;
  });
};

// --- 표시 데이터 생성 유틸리티 ---

/**
 * 리플레이 객체를 기반으로 표시할 게임 제목을 생성합니다.
 * @param {GameReplay} replay - 리플레이 객체.
 * @returns {string} "날짜 vs 상대 (결과)" 형식의 제목.
 */
export const generateGameTitle = (replay: GameReplay): string => {
  const date = new Date(replay.gameInfo.startTime).toLocaleDateString('ko-KR');
  const opponent = replay.playerBlack.name === '우주의 오델로 수호자' ? replay.playerWhite.name : replay.playerBlack.name;
  const resultText = getPlayerResult(replay) === 'win' ? '승리' : getPlayerResult(replay) === 'loss' ? '패배' : '무승부';
  return `${date} vs ${opponent} (${resultText})`;
};

/**
 * 리플레이 객체를 기반으로 표시할 게임 요약 설명을 생성합니다.
 * @param {GameReplay} replay - 리플레이 객체.
 * @returns {string} "게임모드 • 게임시간 • 최종스코어" 형식의 설명.
 */
export const generateGameDescription = (replay: GameReplay): string => {
  const mode = getGameModeConfig(replay.gameMode).name;
  const duration = formatDuration(replay.gameInfo.duration);
  const score = `${replay.result.finalScore.black}-${replay.result.finalScore.white}`;
  return `${mode} • ${duration} • ${score}`;
};

// --- 통계 유틸리티 ---

/**
 * 리플레이 목록에서 특정 플레이어의 승률을 계산합니다.
 * @param {GameReplay[]} replays - 리플레이 배열.
 * @param {string} [playerName='우주의 오델로 수호자'] - 기준 플레이어 이름.
 * @returns {number} 승률 (%).
 */
export const calculateWinRate = (replays: GameReplay[], playerName: string = '우주의 오델로 수호자'): number => {
  if (replays.length === 0) return 0;
  const wins = replays.filter(replay => getPlayerResult(replay, playerName) === 'win').length;
  return (wins / replays.length) * 100;
};

/**
 * 리플레이 목록에서 현재 연승/연패 및 최장 연승/연패 정보를 계산합니다.
 * @param {GameReplay[]} replays - 시간순으로 정렬될 리플레이 배열.
 * @param {string} [playerName='우주의 오델로 수호자'] - 기준 플레이어 이름.
 * @returns {{ currentStreak: number; streakType: 'win' | 'loss'; longestWinStreak: number; longestLossStreak: number; }} 연승/연패 정보 객체.
 */
export const getStreakInfo = (replays: GameReplay[], playerName: string = '우주의 오델로 수호자'): {
  currentStreak: number; streakType: 'win' | 'loss'; longestWinStreak: number; longestLossStreak: number;
} => {
  if (replays.length === 0) {
    return { currentStreak: 0, streakType: 'win', longestWinStreak: 0, longestLossStreak: 0 };
  }
  // 최신 게임이 먼저 오도록 정렬
  const sortedReplays = [...replays].sort((a, b) => b.gameInfo.startTime - a.gameInfo.startTime);

  let currentStreak = 0;
  let streakType: 'win' | 'loss' = 'win';
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;
  let isCurrentStreakBroken = false;

  for (const replay of sortedReplays) {
    const result = getPlayerResult(replay, playerName);
    if (result === 'draw') continue; // 무승부는 연승/연패 계산에서 제외

    // 현재 연승/연패 계산 (가장 최근 게임부터 시작)
    if (!isCurrentStreakBroken) {
      if (currentStreak === 0) {
        streakType = result;
        currentStreak = 1;
      } else if (result === streakType) {
        currentStreak++;
      } else {
        isCurrentStreakBroken = true; // 다른 결과가 나오면 현재 연승/연패는 끝남
      }
    }

    // 최장 연승/연패 계산
    if (result === 'win') {
      tempWinStreak++;
      longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
      tempLossStreak = 0;
    } else { // loss
      tempLossStreak++;
      longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
      tempWinStreak = 0;
    }
  }

  // 루프 종료 후 마지막 연승/연패도 최장 기록과 비교
  longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
  longestLossStreak = Math.max(longestLossStreak, tempLossStreak);

  return { currentStreak, streakType, longestWinStreak, longestLossStreak };
};

// --- 데이터 검증 및 변환 유틸리티 ---

/**
 * 리플레이 데이터의 유효성을 검사하고 오류 목록을 반환합니다.
 * @param {GameReplay} replay - 검사할 리플레이 객체.
 * @returns {{ isValid: boolean; errors: string[] }} 유효성 결과 및 오류 메시지 배열.
 */
export const validateReplayData = (replay: GameReplay): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  // 기본 구조 검사
  if (!replay.id) errors.push('리플레이 ID가 없습니다.');
  if (!replay.playerBlack?.name) errors.push('흑돌 플레이어 이름이 없습니다.');
  if (!replay.playerWhite?.name) errors.push('백돌 플레이어 이름이 없습니다.');
  if (!replay.moves || !Array.isArray(replay.moves)) errors.push('기보 데이터가 유효하지 않습니다.');
  if (!replay.gameInfo) errors.push('게임 정보가 없습니다.');
  // 수 데이터 검사
  replay.moves?.forEach((move, index) => {
    if (move.x < 0 || move.x > 7 || move.y < 0 || move.y > 7) errors.push(`${index + 1}번째 수의 좌표가 유효하지 않습니다.`);
    if (!move.player || (move.player !== 'black' && move.player !== 'white')) errors.push(`${index + 1}번째 수의 플레이어 정보가 유효하지 않습니다.`);
  });
  // 게임 정보 검사
  if (replay.gameInfo) {
    if (replay.gameInfo.startTime >= replay.gameInfo.endTime) errors.push('시작 시간은 종료 시간보다 빨라야 합니다.');
    if (replay.gameInfo.duration <= 0) errors.push('게임 시간은 양수여야 합니다.');
    if (replay.gameInfo.totalMoves !== replay.moves.length) errors.push('총 수와 실제 기보 길이가 일치하지 않습니다.');
  }
  // 점수 검사
  if (replay.result) {
    const { black, white } = replay.result.finalScore;
    if (black + white > 64) errors.push('총 점수는 64를 초과할 수 없습니다.');
  }
  return { isValid: errors.length === 0, errors };
};

/**
 * 오래된 형식의 리플레이 데이터를 최신 형식으로 변환합니다. (구현은 형식에 따라 다름)
 * @param {any} legacyReplay - 변환할 레거시 리플레이 데이터.
 * @returns {GameReplay | null} 변환된 리플레이 객체 또는 실패 시 null.
 */
export const convertLegacyReplayFormat = (legacyReplay: any): GameReplay | null => {
  try {
    // 실제 변환 로직은 레거시 포맷에 따라 달라집니다.
    // 이 함수는 향후 호환성을 위한 예시입니다.
    console.warn('레거시 리플레이 변환은 아직 구현되지 않았습니다.');
    return null;
  } catch (error) {
    console.error('레거시 리플레이 변환 실패:', error);
    return null;
  }
};

// --- 검색 유틸리티 ---

/**
 * 텍스트 내에서 검색어를 찾아 `<mark>` 태그로 감싸 하이라이트 처리합니다.
 * @param {string} text - 원본 텍스트.
 * @param {string} searchQuery - 하이라이트할 검색어.
 * @returns {string} 하이라이트 처리된 HTML 문자열.
 */
export const highlightSearchTerms = (text: string, searchQuery: string): string => {
  if (!searchQuery.trim()) return text;
  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-400/30 text-yellow-200">$1</mark>');
};

/**
 * 현재 검색어에 기반하여 추천 검색어 목록을 생성합니다.
 * @param {GameReplay[]} replays - 검색 대상 리플레이 배열.
 * @param {string} query - 사용자 입력 검색어.
 * @returns {string[]} 추천 검색어 문자열 배열.
 */
export const getSearchSuggestions = (replays: GameReplay[], query: string): string[] => {
  if (!query.trim()) return [];
  const suggestions = new Set<string>();
  const lowerQuery = query.toLowerCase();

  replays.forEach(replay => {
    // 플레이어 이름 추천
    if (replay.playerBlack.name.toLowerCase().includes(lowerQuery)) suggestions.add(replay.playerBlack.name);
    if (replay.playerWhite.name.toLowerCase().includes(lowerQuery)) suggestions.add(replay.playerWhite.name);
    // 게임 모드 이름 추천
    if (getGameModeConfig(replay.gameMode).name.toLowerCase().includes(lowerQuery)) suggestions.add(getGameModeConfig(replay.gameMode).name);
    // 태그 추천
    replay.metadata.tags?.forEach(tag => {
      if (tag.toLowerCase().includes(lowerQuery)) suggestions.add(tag);
    });
  });

  return Array.from(suggestions).slice(0, 5); // 최대 5개까지 추천
};

// --- 성능 관련 유틸리티 ---

/**
 * 리플레이 데이터의 복잡도를 추정하여 'low', 'medium', 'high'로 분류합니다.
 * 복잡한 리플레이는 렌더링에 더 많은 리소스를 사용할 수 있음을 나타냅니다.
 * @param {GameReplay} replay - 복잡도를 추정할 리플레이.
 * @returns {'low' | 'medium' | 'high'} 추정된 복잡도.
 */
export const estimateReplayComplexity = (replay: GameReplay): 'low' | 'medium' | 'high' => {
  let complexity = replay.moves.length / 60; // 수의 개수를 기본 복잡도로 사용
  if (replay.analysis) {
    complexity += 0.5; // 분석 데이터가 있으면 복잡도 증가
    if (replay.analysis.turningPoints.length > 5) complexity += 0.3;
  }
  if (replay.metadata.tags && replay.metadata.tags.length > 3) complexity += 0.2;

  if (complexity < 1) return 'low';
  if (complexity < 2) return 'medium';
  return 'high';
};

/**
 * 항목 수가 많을 때 가상 스크롤링을 사용할지 여부를 결정합니다.
 * @param {number} itemCount - 리스트의 항목 수.
 * @returns {boolean} 가상 스크롤링 사용 여부.
 */
export const shouldUseVirtualScrolling = (itemCount: number): boolean => {
  return itemCount > 100; // 100개 이상의 항목에 대해 가상 스크롤링 사용
};

/**
 * 전체 리플레이 목록의 규모와 복잡도에 따라 성능 모드를 활성화할지 결정합니다.
 * @param {GameReplay[]} replays - 전체 리플레이 배열.
 * @returns {boolean} 성능 모드 활성화 여부.
 */
export const shouldEnablePerformanceMode = (replays: GameReplay[]): boolean => {
  const totalMoves = replays.reduce((sum, replay) => sum + replay.moves.length, 0);
  const avgComplexity = replays.reduce((sum, replay) => {
    const complexity = estimateReplayComplexity(replay);
    return sum + (complexity === 'high' ? 3 : complexity === 'medium' ? 2 : 1);
  }, 0) / (replays.length || 1);
  return totalMoves > 5000 || avgComplexity > 2 || replays.length > 200;
};