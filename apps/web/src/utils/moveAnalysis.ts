import { GameMove } from '../types/replay';

export interface MoveQuality {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
  severity: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
}

export interface MoveAnalysisResult {
  quality: MoveQuality;
  isCritical: boolean;
  shouldPause: boolean;
  commentary: string;
}

/**
 * Analyzes move quality based on evaluation score and context
 */
export function analyzeMoveQuality(move: GameMove): MoveAnalysisResult | null {
  if (!move || move.evaluationScore === undefined) {
    return null;
  }

  const score = move.evaluationScore;
  let quality: MoveQuality;
  let isCritical = false;
  let shouldPause = false;

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
    isCritical = true;
    shouldPause = true;
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
 * Generates contextual commentary for a move
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

  // Add alternative move suggestion if available
  if (move.alternativeMoves && move.alternativeMoves.length > 0) {
    const bestAlternative = move.alternativeMoves[0];
    const altPosition = `${String.fromCharCode(65 + bestAlternative.x)}${bestAlternative.y + 1}`;
    commentary += ` 더 나은 선택은 ${altPosition}였을 것입니다.`;
  }

  return commentary;
}

/**
 * Calculates a position evaluation graph for visualization
 */
export function generateEvaluationGraph(moves: GameMove[]): number[] {
  return moves.map(move => move.evaluationScore || 0);
}

/**
 * Identifies turning points in the game
 */
export function findTurningPoints(moves: GameMove[]): Array<{
  moveIndex: number;
  previousEval: number;
  newEval: number;
  change: number;
  significance: 'minor' | 'major' | 'critical';
}> {
  const turningPoints: Array<{
    moveIndex: number;
    previousEval: number;
    newEval: number;
    change: number;
    significance: 'minor' | 'major' | 'critical';
  }> = [];

  for (let i = 1; i < moves.length; i++) {
    const prevMove = moves[i - 1];
    const currentMove = moves[i];

    if (prevMove.evaluationScore !== undefined && currentMove.evaluationScore !== undefined) {
      const change = Math.abs(currentMove.evaluationScore - prevMove.evaluationScore);

      let significance: 'minor' | 'major' | 'critical';
      if (change >= 40) {
        significance = 'critical';
      } else if (change >= 20) {
        significance = 'major';
      } else if (change >= 10) {
        significance = 'minor';
      } else {
        continue; // Skip small changes
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
 * Gets move quality statistics for a game
 */
export function getMoveStatistics(moves: GameMove[]): {
  excellent: number;
  good: number;
  inaccuracies: number;
  mistakes: number;
  blunders: number;
  accuracy: number;
} {
  let excellent = 0;
  let good = 0;
  let inaccuracies = 0;
  let mistakes = 0;
  let blunders = 0;

  moves.forEach(move => {
    const analysis = analyzeMoveQuality(move);
    if (analysis) {
      switch (analysis.quality.severity) {
        case 'excellent':
          excellent++;
          break;
        case 'good':
          good++;
          break;
        case 'inaccuracy':
          inaccuracies++;
          break;
        case 'mistake':
          mistakes++;
          break;
        case 'blunder':
          blunders++;
          break;
      }
    }
  });

  const totalMoves = moves.length;
  const goodMoves = excellent + good;
  const accuracy = totalMoves > 0 ? (goodMoves / totalMoves) * 100 : 0;

  return {
    excellent,
    good,
    inaccuracies,
    mistakes,
    blunders,
    accuracy
  };
}