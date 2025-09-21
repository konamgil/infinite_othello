import { GameMove } from '../types/replay';

/**
 * @interface MoveQuality
 * 한 수의 품질을 나타내는 UI 관련 데이터와 심각도 수준을 정의합니다.
 */
export interface MoveQuality {
  /** @property {string} label - UI에 표시될 품질 레이블 (예: '최적수', '실수'). */
  label: string;
  /** @property {string} color - 텍스트 색상 클래스 (Tailwind CSS). */
  color: string;
  /** @property {string} bgColor - 배경 색상 클래스 (Tailwind CSS). */
  bgColor: string;
  /** @property {string} icon - 사용할 Lucide 아이콘의 이름. */
  icon: string;
  /** @property {string} description - 수에 대한 간략한 설명. */
  description: string;
  /** @property {'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'} severity - 수의 심각도 수준. */
  severity: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
}

/**
 * @interface MoveAnalysisResult
 * 단일 수에 대한 전체 분석 결과를 담는 데이터 구조입니다.
 */
export interface MoveAnalysisResult {
  /** @property {MoveQuality} quality - 수의 품질 정보. */
  quality: MoveQuality;
  /** @property {boolean} isCritical - 리플레이에서 강조해야 할 중요한 수인지 여부. */
  isCritical: boolean;
  /** @property {boolean} shouldPause - 리플레이에서 자동으로 일시정지해야 할 수인지 여부. */
  shouldPause: boolean;
  /** @property {string} commentary - 수에 대한 상세한 해설. */
  commentary: string;
}

/**
 * 한 수의 평가 점수와 맥락을 기반으로 품질을 분석합니다.
 * 이 함수는 리플레이 분석의 핵심 로직입니다.
 * @param {GameMove} move - 분석할 게임의 한 수.
 * @returns {MoveAnalysisResult | null} 분석 결과 객체, 또는 분석이 불가능할 경우 null.
 */
export function analyzeMoveQuality(move: GameMove): MoveAnalysisResult | null {
  if (!move || move.evaluationScore === undefined) {
    return null;
  }

  const score = move.evaluationScore;
  let quality: MoveQuality;
  let isCritical = false;
  let shouldPause = false;

  // 평가 점수를 기반으로 수의 품질을 분류합니다.
  if (move.isOptimal || score >= 50) {
    quality = {
      label: '최적수',
      color: 'text-green-400',
      bgColor: 'bg-green-400/20',
      icon: 'CheckCircle',
      description: '완벽한 수입니다!',
      severity: 'excellent'
    };
    isCritical = true;
  } else if (score >= 20) {
    quality = {
      label: '좋은 수',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/20',
      icon: 'TrendingUp',
      description: '좋은 선택입니다.',
      severity: 'good'
    };
  } else if (score >= -10) {
    quality = {
      label: '부정확',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/20',
      icon: 'AlertTriangle',
      description: '더 나은 수가 있었습니다.',
      severity: 'inaccuracy'
    };
  } else if (score >= -30) {
    quality = {
      label: '실수',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/20',
      icon: 'AlertTriangle',
      description: '상황을 악화시킨 수입니다.',
      severity: 'mistake'
    };
  } else {
    quality = {
      label: '대실수',
      color: 'text-red-400',
      bgColor: 'bg-red-400/20',
      icon: 'AlertTriangle',
      description: '큰 실수입니다!',
      severity: 'blunder'
    };
    isCritical = true; // 큰 실수는 중요한 수로 간주
    shouldPause = true; // 리플레이에서 자동으로 멈춰서 사용자에게 보여줌
  }

  const commentary = generateMoveCommentary(move, quality);

  return {
    quality,
    isCritical,
    shouldPause,
    commentary
  };
}

/**
 * 분석된 수에 대한 자연어 해설을 생성합니다.
 * @param {GameMove} move - 해설을 생성할 수.
 * @param {MoveQuality} quality - `analyzeMoveQuality`에서 결정된 수의 품질.
 * @returns {string} 생성된 해설 텍스트.
 */
function generateMoveCommentary(move: GameMove, quality: MoveQuality): string {
  const position = `${String.fromCharCode(65 + move.x)}${move.y + 1}`;
  const player = move.player === 'black' ? '흑돌' : '백돌';
  const flippedCount = move.flippedDiscs.length;

  let commentary = `${player}이 ${position}에 착수하여 ${flippedCount}개의 돌을 뒤집었습니다. `;

  switch (quality.severity) {
    case 'excellent':
      commentary += '이 수는 최적의 선택으로, 게임에서 유리한 위치를 확보했습니다.';
      break;
    case 'good':
      commentary += '좋은 수로, 게임 흐름을 잘 이어갔습니다.';
      break;
    case 'inaccuracy':
      commentary += '부정확한 수입니다. 더 나은 대안이 있었을 것입니다.';
      break;
    case 'mistake':
      commentary += '실수입니다. 이 수로 인해 상대방에게 유리함을 주었습니다.';
      break;
    case 'blunder':
      commentary += '큰 실수입니다! 이 수는 게임의 흐름을 크게 바꿨습니다.';
      break;
  }

  // 더 나은 대안이 있었을 경우, 해당 정보를 해설에 추가합니다.
  if (move.alternativeMoves && move.alternativeMoves.length > 0) {
    const bestAlternative = move.alternativeMoves[0];
    const altPosition = `${String.fromCharCode(65 + bestAlternative.x)}${bestAlternative.y + 1}`;
    commentary += ` 더 나은 선택은 ${altPosition}였을 것입니다.`;
  }

  return commentary;
}

/**
 * 리플레이의 모든 수에 대한 평가 점수 배열을 생성하여 그래프 시각화에 사용합니다.
 * @param {GameMove[]} moves - 게임의 모든 수 배열.
 * @returns {number[]} 각 수의 평가 점수로 이루어진 배열.
 */
export function generateEvaluationGraph(moves: GameMove[]): number[] {
  return moves.map(move => move.evaluationScore || 0);
}

/**
 * @typedef {object} TurningPoint
 * 게임의 흐름이 크게 바뀐 '전환점'을 나타내는 객체입니다.
 * @property {number} moveIndex - 전환점이 발생한 수의 인덱스.
 * @property {number} previousEval - 이전 수의 평가 점수.
 * @property {number} newEval - 현재 수의 평가 점수.
 * @property {number} change - 평가 점수 변화량의 절대값.
 * @property {'minor' | 'major' | 'critical'} significance - 전환점의 중요도.
 */
export type TurningPoint = {
  moveIndex: number;
  previousEval: number;
  newEval: number;
  change: number;
  significance: 'minor' | 'major' | 'critical';
};

/**
 * 게임에서 평가 점수가 급격하게 변동한 지점(전환점)을 식별합니다.
 * @param {GameMove[]} moves - 게임의 모든 수 배열.
 * @returns {TurningPoint[]} 식별된 전환점들의 배열.
 */
export function findTurningPoints(moves: GameMove[]): TurningPoint[] {
  const turningPoints: TurningPoint[] = [];

  for (let i = 1; i < moves.length; i++) {
    const prevMove = moves[i - 1];
    const currentMove = moves[i];

    if (prevMove.evaluationScore !== undefined && currentMove.evaluationScore !== undefined) {
      const change = Math.abs(currentMove.evaluationScore - prevMove.evaluationScore);

      let significance: TurningPoint['significance'];
      if (change >= 40) {
        significance = 'critical';
      } else if (change >= 20) {
        significance = 'major';
      } else if (change >= 10) {
        significance = 'minor';
      } else {
        continue; // 변화가 미미한 경우는 건너뜁니다.
      }

      turningPoints.push({
        moveIndex: i,
        previousEval: prevMove.evaluationScore,
        newEval: currentMove.evaluationScore,
        change,
        significance
      });
    }
  }

  return turningPoints;
}

/**
 * @typedef {object} MoveStatistics
 * 게임 전체의 수 품질 통계를 나타내는 객체입니다.
 * @property {number} excellent - '최적수'의 개수.
 * @property {number} good - '좋은 수'의 개수.
 * @property {number} inaccuracies - '부정확'한 수의 개수.
 * @property {number} mistakes - '실수'의 개수.
 * @property {number} blunders - '대실수'의 개수.
 * @property {number} accuracy - 정확도 (%). (최적수 + 좋은 수) / 전체 수.
 */
export type MoveStatistics = {
  excellent: number;
  good: number;
  inaccuracies: number;
  mistakes: number;
  blunders: number;
  accuracy: number;
};

/**
 * 게임 전체의 수 품질 통계를 계산합니다.
 * @param {GameMove[]} moves - 게임의 모든 수 배열.
 * @returns {MoveStatistics} 계산된 통계 객체.
 */
export function getMoveStatistics(moves: GameMove[]): MoveStatistics {
  const stats: Omit<MoveStatistics, 'accuracy'> = {
    excellent: 0,
    good: 0,
    inaccuracies: 0,
    mistakes: 0,
    blunders: 0
  };

  moves.forEach(move => {
    const analysis = analyzeMoveQuality(move);
    if (analysis) {
      switch (analysis.quality.severity) {
        case 'excellent': stats.excellent++; break;
        case 'good': stats.good++; break;
        case 'inaccuracy': stats.inaccuracies++; break;
        case 'mistake': stats.mistakes++; break;
        case 'blunder': stats.blunders++; break;
      }
    }
  });

  const totalMoves = moves.length;
  const goodMoves = stats.excellent + stats.good;
  const accuracy = totalMoves > 0 ? (goodMoves / totalMoves) * 100 : 0;

  return {
    ...stats,
    accuracy
  };
}