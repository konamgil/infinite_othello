/**
 * A collection of wise quotes from Stella, the AI mentor.
 * These are likely displayed to the user to provide tips and encouragement.
 */
export const STELLA_WISDOMS = [
  '안녕하세요, 오늘도 스텔라의 별빛 지혜를 나눠 드릴게요.',
  '코너를 차지하는 것은 중요하지만, 과정에서 선택권을 잃지 않도록 주의하세요.',
  '오프닝에서는 중앙을 장악해 움직임의 균형을 맞추는 것이 핵심입니다.',
  '상대가 예측하지 못하도록 코너 접근 루트를 다양하게 가져가세요.',
  '엔드게임에서는 모든 수를 정확하게 계산해야 승리가 보입니다.',
  '모빌리티와 안정감의 균형을 찾는 것이 고수의 핵심입니다.',
  '차분하지만 단호하게, 스스로의 방향을 믿고 플레이하세요.',
  '현재의 한 수가 미래의 판세를 결정합니다. 깊이 있게 바라보세요.'
];

/**
 * A list of daily missions for the user to complete.
 * Each mission has a title, description, rewards, and progress tracking.
 */
export const DAILY_MISSIONS = [
  {
    id: 1,
    title: '루키 시작 - 모서리 장악',
    description: '게임 초반 모서리를 선점해 견고한 기반을 다져보세요.',
    rewards: [{ type: 'rp', value: '50 RP' }],
    progress: 0,
    maxProgress: 1,
    completed: false
  },
  {
    id: 2,
    title: '코너 확보 연습',
    description: '한 판에서 코너를 두 번 이상 차지해 보세요.',
    rewards: [{ type: 'rp', value: '100 RP' }],
    progress: 1,
    maxProgress: 2,
    completed: false
  },
  {
    id: 3,
    title: '벽을 지켜라',
    description: '가장자리를 지켜 상대가 돌파하지 못하게 방어하세요.',
    rewards: [
      { type: 'rp', value: '200 RP' },
      { type: 'theme', value: '스텔라 코스튬' }
    ],
    progress: 0,
    maxProgress: 1,
    completed: false
  }
];

/**
 * A list of available strategy lessons.
 * These lessons are structured to teach the user various aspects of Othello strategy,
 * categorized by difficulty.
 */
export const STRATEGY_LESSONS = [
  {
    id: 1,
    title: '기초: 오셀로 규칙 이해하기',
    description: '게임의 기본 규칙과 필수 개념을 복습해 보세요.',
    difficulty: '초급',
    duration: '5분',
    completed: true
  },
  {
    id: 2,
    title: '전략: 모빌리티와 안정성',
    description: '움직임과 안정성의 균형을 잡는 중급 전략입니다.',
    difficulty: '중급',
    duration: '10분',
    completed: true
  },
  {
    id: 3,
    title: '고급: 엔드게임 계산',
    description: '엔드게임에서 수를 계산해 최적의 결말을 만드는 방법.',
    difficulty: '고급',
    duration: '15분',
    completed: false
  },
  {
    id: 4,
    title: '마스터: 개방 전술 분석',
    description: '마스터들이 즐겨 사용하는 개방 전술을 분석합니다.',
    difficulty: '마스터',
    duration: '20분',
    completed: false
  }
];

/**
 * A list of practice scenarios.
 * These allow the user to practice specific game situations and tactics.
 */
export const PRACTICE_SCENARIOS = [
  {
    id: 1,
    title: '코너 공략 연습',
    description: '코너를 안전하게 차지하는 다양한 방법을 연습합니다.',
    difficulty: '초급',
    plays: 1247
  },
  {
    id: 2,
    title: '가장자리 싸움',
    description: '가장자리 주도권을 확보하는 중급 전략을 배워보세요.',
    difficulty: '중급',
    plays: 892
  },
  {
    id: 3,
    title: '미드게임 턴 연습',
    description: '중반부 다양한 전술 전환을 연습해 보세요.',
    difficulty: '고급',
    plays: 543
  }
];
