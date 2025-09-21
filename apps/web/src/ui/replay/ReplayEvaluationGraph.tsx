import React, { useMemo } from 'react';
import { GameMove } from '../../types/replay';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

/**
 * @interface ReplayEvaluationGraphProps
 * `ReplayEvaluationGraph` 컴포넌트의 props를 정의합니다.
 */
interface ReplayEvaluationGraphProps {
  /** @property {GameMove[]} moves - 게임의 모든 수에 대한 데이터 배열. 평가 점수를 추출하는 데 사용됩니다. */
  moves: GameMove[];
  /** @property {number} currentMoveIndex - 현재 리플레이의 수 인덱스. 그래프에서 현재 위치를 강조하는 데 사용됩니다. */
  currentMoveIndex: number;
  /** @property {(moveIndex: number) => void} [onMoveClick] - 사용자가 그래프의 특정 지점을 클릭했을 때 호출될 콜백 함수. */
  onMoveClick?: (moveIndex: number) => void;
  /** @property {number} [height=100] - 그래프의 높이 (픽셀 단위). */
  height?: number;
  /** @property {string} [className] - 컴포넌트의 최상위 요소에 적용할 추가 CSS 클래스. */
  className?: string;
}

/**
 * 게임 리플레이의 AI 평가 점수 변화를 시각화하는 라인 그래프 컴포넌트입니다.
 * SVG를 사용하여 렌더링하며, 사용자가 그래프의 특정 지점을 클릭하여 해당 수로 이동할 수 있습니다.
 * @param {ReplayEvaluationGraphProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 평가 그래프 UI.
 */
export function ReplayEvaluationGraph({
  moves,
  currentMoveIndex,
  onMoveClick,
  height = 100,
  className = ''
}: ReplayEvaluationGraphProps) {
  /**
   * `moves` prop으로부터 그래프 렌더링에 필요한 데이터를 계산하고 memoization합니다.
   * - `evaluationData`: 모든 수의 평가 점수 배열.
   * - `minEval`, `maxEval`: Y축 스케일링을 위한 최소/최대 평가 점수.
   * - `turningPoints`: 평가 점수가 급격하게 변하는 '전환점' 수의 인덱스 배열.
   */
  const { evaluationData, minEval, maxEval, turningPoints } = useMemo(() => {
    const evaluations = moves.map(move => move.evaluationScore || 0);
    if (evaluations.length === 0) {
      return { evaluationData: [], minEval: -100, maxEval: 100, turningPoints: [] };
    }
    const min = Math.min(...evaluations, -100);
    const max = Math.max(...evaluations, 100);

    // 평가 점수가 크게 변동하는 지점(전환점)을 찾습니다.
    const turningPoints: number[] = [];
    for (let i = 1; i < evaluations.length; i++) {
      const change = Math.abs(evaluations[i] - evaluations[i - 1]);
      if (change >= 20) { // 20점 이상 변화 시 전환점으로 간주
        turningPoints.push(i);
      }
    }

    return {
      evaluationData: evaluations,
      minEval: min,
      maxEval: max,
      turningPoints
    };
  }, [moves]);

  // 데이터가 없을 경우 메시지를 표시합니다.
  if (evaluationData.length === 0) {
    return (
      <div className={`flex items-center justify-center text-white/40 ${className}`} style={{ height }}>
        <Activity size={20} />
        <span className="ml-2 text-sm font-smooth">평가 데이터 없음</span>
      </div>
    );
  }

  /**
   * 평가 점수 값을 SVG의 Y 좌표(0-100)로 정규화합니다.
   * @param {number} value - 정규화할 평가 점수.
   * @returns {number} 0에서 100 사이의 값.
   */
  const normalize = (value: number) => {
    const range = maxEval - minEval;
    if (range === 0) return 50; // 모든 값이 같을 경우 중간에 표시
    return ((value - minEval) / range) * 100;
  };

  /**
   * 평가 점수와 현재 수 여부에 따라 데이터 포인트의 색상을 결정합니다.
   * @param {number} evaluation - 평가 점수.
   * @param {number} index - 해당 수의 인덱스.
   * @returns {string} SVG `fill` 및 `stroke`에 사용할 Tailwind CSS 클래스.
   */
  const getPointColor = (evaluation: number, index: number) => {
    if (index === currentMoveIndex) {
      return 'fill-yellow-400 stroke-yellow-300';
    }
    if (evaluation >= 20) return 'fill-green-400 stroke-green-300';
    if (evaluation <= -20) return 'fill-red-400 stroke-red-300';
    if (evaluation <= -10) return 'fill-orange-400 stroke-orange-300';
    return 'fill-blue-400 stroke-blue-300';
  };

  /**
   * 평가 점수에 따라 라인 세그먼트의 색상을 결정합니다.
   * @param {number} evaluation - 평가 점수.
   * @returns {string} SVG `stroke`에 사용할 Tailwind CSS 클래스.
   */
  const getSegmentColor = (evaluation: number) => {
    if (evaluation >= 20) return 'stroke-green-400';
    if (evaluation <= -20) return 'stroke-red-400';
    if (evaluation <= -10) return 'stroke-orange-400';
    return 'stroke-blue-400';
  };

  /**
   * 평가 데이터 배열을 기반으로 SVG `<path>` 요소의 `d` 속성 문자열을 생성합니다.
   * (현재는 개별 `<line>` 요소로 대체되어 사용되지 않음)
   * @type {string}
   */
  const pathData = evaluationData.reduce((path, eval, index) => {
    const x = (index / (evaluationData.length - 1)) * 100;
    const y = 100 - normalize(eval);
    return path + (index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
  }, '');

  return (
    <div className={`relative bg-black/20 rounded-lg sm:rounded-xl border border-white/10 p-3 sm:p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs sm:text-sm font-medium text-white/80 font-display flex items-center gap-2">
          <Activity size={14} />
          게임 평가 흐름
        </h4>
        <div className="flex items-center gap-2 sm:gap-4 text-xs text-white/60">
          <div className="flex items-center gap-1">
            <TrendingUp size={10} className="text-green-400" />
            <span className="hidden sm:inline">유리</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown size={10} className="text-red-400" />
            <span className="hidden sm:inline">불리</span>
          </div>
        </div>
      </div>

      <div className="relative" style={{ height }}>
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Zero line */}
          <line
            x1="0"
            y1={100 - normalize(0)}
            x2="100"
            y2={100 - normalize(0)}
            stroke="white"
            strokeOpacity="0.2"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />

          {/* Evaluation line segments with colors */}
          {evaluationData.slice(1).map((eval, index) => {
            const prevEval = evaluationData[index];
            const x1 = (index / (evaluationData.length - 1)) * 100;
            const y1 = 100 - normalize(prevEval);
            const x2 = ((index + 1) / (evaluationData.length - 1)) * 100;
            const y2 = 100 - normalize(eval);

            return (
              <line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={getSegmentColor(eval)}
                strokeWidth="1.5"
                opacity="0.8"
              />
            );
          })}

          {/* Data points */}
          {evaluationData.map((eval, index) => {
            const x = (index / (evaluationData.length - 1)) * 100;
            const y = 100 - normalize(eval);
            const isTurningPoint = turningPoints.includes(index);
            const isCurrentMove = index === currentMoveIndex;

            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={isCurrentMove ? "2" : isTurningPoint ? "1.5" : "1"}
                className={getPointColor(eval, index)}
                strokeWidth="1"
                style={{ cursor: onMoveClick ? 'pointer' : 'default' }}
                onClick={() => onMoveClick?.(index)}
              >
                <title>
                  {index + 1}수: {eval > 0 ? '+' : ''}{eval}
                  {moves[index] && ` (${String.fromCharCode(65 + moves[index].x)}${moves[index].y + 1})`}
                </title>
              </circle>
            );
          })}

          {/* Current move indicator line */}
          {currentMoveIndex >= 0 && currentMoveIndex < evaluationData.length && (
            <line
              x1={(currentMoveIndex / (evaluationData.length - 1)) * 100}
              y1="0"
              x2={(currentMoveIndex / (evaluationData.length - 1)) * 100}
              y2="100"
              stroke="yellow"
              strokeOpacity="0.6"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          )}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-white/50 -ml-6 sm:-ml-8">
          <span className="text-xs">{Math.round(maxEval)}</span>
          <span className="text-xs">0</span>
          <span className="text-xs">{Math.round(minEval)}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 gap-2 text-xs text-white/60">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>우수</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>보통</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <span>실수</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span>대실수</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          <span>현재</span>
        </div>
      </div>
    </div>
  );
}