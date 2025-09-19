import React from 'react';
import { GameMove } from '../../types/replay';
import { analyzeMoveQuality } from '../../utils/moveAnalysis';
import {
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Brain,
  Target,
  Clock,
  ChevronRight
} from 'lucide-react';

interface ReplayMoveAnnotationProps {
  move: GameMove;
  moveIndex: number;
  isCurrentMove?: boolean;
  showDetails?: boolean;
  onMoveClick?: () => void;
  className?: string;
}

export function ReplayMoveAnnotation({
  move,
  moveIndex,
  isCurrentMove = false,
  showDetails = true,
  onMoveClick,
  className = ''
}: ReplayMoveAnnotationProps) {
  const analysis = analyzeMoveQuality(move);

  if (!analysis) {
    return (
      <div className={`p-3 rounded-lg bg-black/20 border border-white/10 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60 font-display">
            {moveIndex + 1}수 - 분석 정보 없음
          </span>
        </div>
      </div>
    );
  }

  const { quality, commentary } = analysis;

  const getIcon = () => {
    switch (quality.icon) {
      case 'CheckCircle':
        return CheckCircle;
      case 'TrendingUp':
        return TrendingUp;
      case 'AlertTriangle':
        return AlertTriangle;
      default:
        return Target;
    }
  };

  const Icon = getIcon();
  const position = `${String.fromCharCode(65 + move.x)}${move.y + 1}`;
  const player = move.player === 'black' ? '●' : '○';

  return (
    <div
      className={`
        p-3 rounded-lg border transition-all duration-200
        ${isCurrentMove
          ? 'bg-yellow-500/10 border-yellow-400/30 ring-1 ring-yellow-400/20'
          : 'bg-black/20 border-white/10 hover:bg-black/30'
        }
        ${onMoveClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onMoveClick}
    >
      <div className="flex items-start gap-3">
        {/* Move icon and quality */}
        <div className={`w-8 h-8 ${quality.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} className={quality.color} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Move header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/90 font-smooth">
                {moveIndex + 1}수 {player} {position}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${quality.bgColor} ${quality.color} font-smooth`}>
                {quality.label}
              </span>
            </div>

            {move.evaluationScore !== undefined && (
              <span className={`text-sm font-mono ${
                move.evaluationScore > 0 ? 'text-green-400' :
                move.evaluationScore < 0 ? 'text-red-400' : 'text-white/70'
              }`}>
                {move.evaluationScore > 0 ? '+' : ''}{move.evaluationScore}
              </span>
            )}
          </div>

          {/* Move details */}
          <div className="flex items-center gap-4 text-xs text-white/60 mb-2">
            <span>{move.flippedDiscs.length}개 뒤집음</span>
            {move.isOptimal && (
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle size={10} />
                최적수
              </span>
            )}
            {isCurrentMove && (
              <span className="flex items-center gap-1 text-yellow-400">
                <ChevronRight size={10} />
                현재
              </span>
            )}
          </div>

          {/* Commentary */}
          {showDetails && (
            <p className="text-sm text-white/80 font-smooth leading-relaxed mb-2">
              {commentary}
            </p>
          )}

          {/* Alternative moves */}
          {showDetails && move.alternativeMoves && move.alternativeMoves.length > 0 && (
            <div className="space-y-1">
              <h5 className="text-xs font-medium text-white/70 font-smooth">더 나은 선택:</h5>
              <div className="flex flex-wrap gap-2">
                {move.alternativeMoves.slice(0, 3).map((altMove, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-xs"
                  >
                    <span className="text-white/80 font-smooth">
                      {String.fromCharCode(65 + altMove.x)}{altMove.y + 1}
                    </span>
                    <span className={`font-mono ${
                      altMove.score > 0 ? 'text-green-400' :
                      altMove.score < 0 ? 'text-red-400' : 'text-white/70'
                    }`}>
                      {altMove.score > 0 ? '+' : ''}{altMove.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp (if available) */}
          {showDetails && move.timestamp && (
            <div className="flex items-center gap-1 mt-2 text-xs text-white/50">
              <Clock size={10} />
              <span>{new Date(move.timestamp).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ReplayMoveListProps {
  moves: GameMove[];
  currentMoveIndex: number;
  onMoveClick?: (moveIndex: number) => void;
  showAnnotations?: boolean;
  className?: string;
}

export function ReplayMoveList({
  moves,
  currentMoveIndex,
  onMoveClick,
  showAnnotations = true,
  className = ''
}: ReplayMoveListProps) {
  if (moves.length === 0) {
    return (
      <div className={`text-center py-8 text-white/60 ${className}`}>
        <Brain size={24} className="mx-auto mb-2 opacity-50" />
        <p className="font-display">수순 정보가 없습니다</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {moves.map((move, index) => (
        <ReplayMoveAnnotation
          key={index}
          move={move}
          moveIndex={index}
          isCurrentMove={index === currentMoveIndex}
          showDetails={showAnnotations}
          onMoveClick={() => onMoveClick?.(index)}
        />
      ))}
    </div>
  );
}