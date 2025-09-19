import React, { useMemo } from 'react';
import { GameMove } from '../../types/replay';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface ReplayEvaluationGraphProps {
  moves: GameMove[];
  currentMoveIndex: number;
  onMoveClick?: (moveIndex: number) => void;
  height?: number;
  className?: string;
}

export function ReplayEvaluationGraph({
  moves,
  currentMoveIndex,
  onMoveClick,
  height = 100,
  className = ''
}: ReplayEvaluationGraphProps) {
  const { evaluationData, minEval, maxEval, turningPoints } = useMemo(() => {
    const evaluations = moves.map(move => move.evaluationScore || 0);
    const min = Math.min(...evaluations, -100);
    const max = Math.max(...evaluations, 100);

    // Find significant evaluation changes
    const turningPoints: number[] = [];
    for (let i = 1; i < evaluations.length; i++) {
      const change = Math.abs(evaluations[i] - evaluations[i - 1]);
      if (change >= 20) {
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

  if (evaluationData.length === 0) {
    return (
      <div className={`flex items-center justify-center text-white/40 ${className}`} style={{ height }}>
        <Activity size={20} />
        <span className="ml-2 text-sm font-smooth">평가 데이터 없음</span>
      </div>
    );
  }

  const normalize = (value: number) => {
    return ((value - minEval) / (maxEval - minEval)) * 100;
  };

  const getPointColor = (evaluation: number, index: number) => {
    if (index === currentMoveIndex) {
      return 'fill-yellow-400 stroke-yellow-300';
    }

    if (evaluation >= 20) return 'fill-green-400 stroke-green-300';
    if (evaluation <= -20) return 'fill-red-400 stroke-red-300';
    if (evaluation <= -10) return 'fill-orange-400 stroke-orange-300';
    return 'fill-blue-400 stroke-blue-300';
  };

  const getSegmentColor = (evaluation: number) => {
    if (evaluation >= 20) return 'stroke-green-400';
    if (evaluation <= -20) return 'stroke-red-400';
    if (evaluation <= -10) return 'stroke-orange-400';
    return 'stroke-blue-400';
  };

  // Generate SVG path for the evaluation line
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