import { useMemo } from 'react';
import { getOpponentData } from '../components/challenge/data/aiOpponents';

interface OpponentData {
  name: string;
  level: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'nightmare';
  specialty: string;
  winRate: number;
  specialAbility: string;
  avatar: string;
  quote: string;
}

interface PhaseTimings {
  preparation: number;
  opponent: number;
  countdown: number;
  // transition: number; // 나중에 사용 예정
}

interface ChallengeFlowData {
  opponentData: OpponentData;
  phaseTimings: PhaseTimings;
  totalDuration: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'nightmare';
}

/**
 * 타워 챌린지 플로우 관리 훅
 *
 * 층수에 따른 상대 정보, 타이밍, 난이도 등을 제공하며
 * 챌린지 플로우의 상태를 관리합니다.
 *
 * @param floor - 도전할 타워 층수
 * @returns 챌린지 플로우 데이터
 */
export function useChallengeFlow(floor: number): ChallengeFlowData {
  // 상대 데이터 생성 (메모이제이션으로 성능 최적화)
  const opponentData = useMemo(() => {
    return getOpponentData(floor);
  }, [floor]);

  // 단계별 타이밍 설정 (난이도나 보스층에 따라 조정 가능)
  const phaseTimings = useMemo<PhaseTimings>(() => {
    const isBossFloor = floor % 50 === 0;
    const difficulty = opponentData.difficulty;

    // 보스층은 약간 더 긴 연출
    const multiplier = isBossFloor ? 1.2 : 1.0;

    // 난이도가 높을수록 약간 더 긴 준비 시간
    const difficultyMultiplier = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.1,
      nightmare: 1.2
    }[difficulty];

    return {
      preparation: Math.round(3000 * multiplier * difficultyMultiplier),
      opponent: Math.round(4000 * multiplier),
      countdown: 3000, // 카운트다운은 항상 동일
      // transition: 1000, // 나중에 사용 예정
    };
  }, [floor, opponentData.difficulty]);

  // 총 소요 시간 계산
  const totalDuration = useMemo(() => {
    return Object.values(phaseTimings).reduce((sum, time) => sum + time, 0);
  }, [phaseTimings]);

  return {
    opponentData,
    phaseTimings,
    totalDuration,
    difficulty: opponentData.difficulty,
  };
}

/**
 * 단계별 타이머 관리 훅
 *
 * 각 단계의 진행 상황을 추적하고 자동 진행을 관리합니다.
 */
export function useStepTimer(
  duration: number,
  onComplete: () => void,
  isSkipping = false
) {
  // 실제 타이머 로직은 각 컴포넌트에서 useEffect로 처리하므로
  // 여기서는 타이머 관련 유틸리티만 제공

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}초`;
  };

  const getProgress = (elapsed: number): number => {
    return Math.min((elapsed / duration) * 100, 100);
  };

  return {
    formatTime,
    getProgress,
    duration,
  };
}

/**
 * 챌린지 설정 관리 훅
 *
 * 사용자의 챌린지 관련 설정을 관리합니다.
 */
export function useChallengeSettings() {
  // 로컬 스토리지에서 설정 읽기
  const getSkipPreference = (): boolean => {
    try {
      const saved = localStorage.getItem('tower_challenge_skip_enabled');
      return saved !== null ? JSON.parse(saved) : true; // 기본값: 스킵 허용
    } catch {
      return true;
    }
  };

  const setSkipPreference = (enabled: boolean): void => {
    try {
      localStorage.setItem('tower_challenge_skip_enabled', JSON.stringify(enabled));
    } catch {
      // 로컬 스토리지 실패 시 무시
    }
  };

  const getReducedAnimations = (): boolean => {
    try {
      const saved = localStorage.getItem('tower_challenge_reduced_animations');
      return saved !== null ? JSON.parse(saved) : false; // 기본값: 전체 애니메이션
    } catch {
      return false;
    }
  };

  const setReducedAnimations = (enabled: boolean): void => {
    try {
      localStorage.setItem('tower_challenge_reduced_animations', JSON.stringify(enabled));
    } catch {
      // 로컬 스토리지 실패 시 무시
    }
  };

  return {
    skipEnabled: getSkipPreference(),
    reducedAnimations: getReducedAnimations(),
    setSkipPreference,
    setReducedAnimations,
  };
}