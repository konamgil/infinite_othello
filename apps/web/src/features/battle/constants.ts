/**
 * 참가 가능한 토너먼트 목록입니다.
 *
 * 이 상수는 사용자가 참여할 수 있는 다양한 토너먼트에 대한 정적 데이터를 제공합니다.
 * 각 토너먼트 객체는 ID, 이름, 랭크 요구 조건, 보상 등과 같은 세부 정보를 포함합니다.
 * 이 데이터는 UI에 토너먼트 목록을 표시하는 데 사용될 가능성이 높습니다.
 */
export const TOURNAMENTS = [
  {
    id: 'rookie',
    name: '루키 토너먼트',
    rank: 'Bronze ~ Silver',
    reward: '500 RP + 루마 1개',
    participants: 128,
    timeLeft: '2시간 30분',
    icon: '🌟'
  },
  {
    id: 'champion',
    name: '챔피언십',
    rank: 'Gold 이상',
    reward: '2000 RP + 전설 루마',
    participants: 64,
    timeLeft: '12시간',
    icon: '👑'
  }
];

/**
 * 표시할 최근 대전 목록입니다.
 *
 * 이 상수는 사용자의 최근 대전 기록에 대한 모의 또는 샘플 데이터를 보유합니다.
 * 각 객체는 단일 대전을 나타내며 상대방, 결과, 점수 및 대전 시간에 대한 정보를 포함합니다.
 * 이는 UI 목업 또는 플레이스홀더 데이터로 사용될 가능성이 높습니다.
 */
export const RECENT_BATTLES = [
  {
    opponent: '드래곤슬레이어',
    rank: 'Silver II',
    result: 'victory',
    score: '32-32',
    timeAgo: '5분 전'
  },
  {
    opponent: '마법사의검',
    rank: 'Bronze I',
    result: 'defeat',
    score: '28-36',
    timeAgo: '1시간 전'
  },
  {
    opponent: '어둠의기사',
    rank: 'Silver III',
    result: 'victory',
    score: '45-19',
    timeAgo: '3시간 전'
  }
];
