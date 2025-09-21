import guardianData from './tower-guardians.json';

export interface GuardianData {
  floor: number;
  name: string;
  title: string;
  avatar: string;
  specialty: string;
  ability: string;
  quote: string;
  story: string;
  winRate: number;
  isBoss: boolean;
}

export interface ThemeData {
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'nightmare';
  background: string;
}

export interface TowerGuardianData {
  metadata: {
    version: string;
    totalFloors: number;
    lastUpdated: string;
    description: string;
  };
  themes: Record<string, ThemeData>;
  guardians: GuardianData[];
}

/**
 * 타워 가디언 데이터를 로드합니다.
 */
export function getTowerGuardianData(): TowerGuardianData {
  return guardianData as TowerGuardianData;
}

/**
 * 특정 층의 가디언 정보를 가져옵니다.
 * 
 * @param floor - 타워 층수 (1-300)
 * @returns 해당 층의 가디언 데이터
 */
export function getGuardianByFloor(floor: number): GuardianData | null {
  const data = getTowerGuardianData();
  
  // JSON에서 직접 찾기
  const guardian = data.guardians.find(g => g.floor === floor);
  if (guardian) {
    return guardian;
  }

  // JSON에 없는 층은 동적으로 생성 (임시 처리)
  return generateGuardianForFloor(floor);
}

/**
 * 특정 층 범위의 테마 정보를 가져옵니다.
 */
export function getThemeForFloor(floor: number): ThemeData | null {
  const data = getTowerGuardianData();
  
  const themeRanges = [
    { range: '1-50', min: 1, max: 50 },
    { range: '51-100', min: 51, max: 100 },
    { range: '101-150', min: 101, max: 150 },
    { range: '151-200', min: 151, max: 200 },
    { range: '201-250', min: 201, max: 250 },
    { range: '251-300', min: 251, max: 300 },
  ];

  const themeRange = themeRanges.find(t => floor >= t.min && floor <= t.max);
  return themeRange ? data.themes[themeRange.range] : null;
}

/**
 * JSON에 없는 층의 가디언을 동적으로 생성합니다.
 * (나중에 모든 층을 JSON에 추가하면 제거 예정)
 */
function generateGuardianForFloor(floor: number): GuardianData {
  const theme = getThemeForFloor(floor);
  const isBoss = floor % 50 === 0;
  
  // 임시 이름 생성 로직 (나중에 제거)
  const baseNames = [
    '아르테미스', '아폴론', '아테나', '아레스', '헤라', '제우스', '포세이돈', '하데스',
    '헤르메스', '디오니소스', '헤파이스토스', '데메테르', '헤스티아', '아프로디테'
  ];
  
  const titles = [
    '수호자', '감시자', '전사', '마법사', '기사', '현자', '예언자', '심판관'
  ];

  const nameIndex = (floor - 1) % baseNames.length;
  const titleIndex = Math.floor((floor - 1) / 50) % titles.length;
  
  return {
    floor,
    name: `${baseNames[nameIndex]} ${titles[titleIndex]}`,
    title: theme?.name || '미지의 존재',
    avatar: isBoss ? '👑' : '⚔️',
    specialty: '전략적 플레이',
    ability: '균형잡힌 전술',
    quote: `${floor}층에 오신 것을 환영합니다.`,
    story: `${floor}층을 지키는 신비로운 존재입니다.`,
    winRate: Math.min(30 + Math.floor(floor / 5), 85),
    isBoss
  };
}

/**
 * 모든 보스 가디언 목록을 가져옵니다.
 */
export function getAllBossGuardians(): GuardianData[] {
  const data = getTowerGuardianData();
  return data.guardians.filter(g => g.isBoss);
}

/**
 * 특정 테마의 모든 가디언을 가져옵니다.
 */
export function getGuardiansByTheme(themeRange: string): GuardianData[] {
  const data = getTowerGuardianData();
  const [min, max] = themeRange.split('-').map(Number);
  return data.guardians.filter(g => g.floor >= min && g.floor <= max);
}

