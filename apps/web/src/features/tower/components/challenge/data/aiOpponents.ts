import { getGuardianByFloor, getThemeForFloor } from '../../../data/guardianLoader';
import type { GuardianData, ThemeData } from '../../../data/guardianLoader';

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

/**
 * 층수에 따른 AI 상대 데이터를 생성합니다.
 * JSON 파일에서 가디언 데이터를 로드하여 OpponentData 형식으로 변환합니다.
 *
 * @param floor - 타워 층수 (1-300)
 * @returns 해당 층의 AI 상대 정보
 */
export function getOpponentData(floor: number): OpponentData {
  // JSON에서 가디언 데이터 로드
  const guardian = getGuardianByFloor(floor);
  const theme = getThemeForFloor(floor);

  if (!guardian) {
    throw new Error(`No guardian data found for floor ${floor}`);
  }

  // 난이도 결정 (테마 기반 또는 층수 기반)
  const difficulty: OpponentData['difficulty'] = theme?.difficulty || 
    (floor <= 50 ? 'easy' :
     floor <= 150 ? 'medium' :
     floor <= 250 ? 'hard' : 'nightmare');

  // 보스층 승률 보정
  const winRate = guardian.isBoss ? Math.min(guardian.winRate + 15, 95) : guardian.winRate;

  // JSON 가디언 데이터를 OpponentData 형식으로 변환
  return {
    name: guardian.name,
    level: floor,
    difficulty,
    specialty: guardian.specialty,
    winRate,
    specialAbility: guardian.ability,
    avatar: guardian.avatar,
    quote: guardian.quote
  };
}

/**
 * 모든 층의 상대 데이터를 미리 생성 (성능 최적화용)
 * JSON 기반으로 변경되어 필요시에만 로드합니다.
 */
export const precomputeOpponents = (maxFloor: number = 300) => {
  const opponents: Record<number, OpponentData> = {};
  for (let floor = 1; floor <= maxFloor; floor++) {
    opponents[floor] = getOpponentData(floor);
  }
  return opponents;
};