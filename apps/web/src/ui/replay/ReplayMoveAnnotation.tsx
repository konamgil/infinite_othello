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

/**
 * @interface ReplayMoveAnnotationProps
 * `ReplayMoveAnnotation` 컴포넌트의 props를 정의합니다.
 */
interface ReplayMoveAnnotationProps {
  /** @property {GameMove} move - 분석하고 표시할 단일 수 데이터. */
  move: GameMove;
  /** @property {number} moveIndex - 해당 수의 인덱스 (0부터 시작). */
  moveIndex: number;
  /** @property {boolean} [isCurrentMove=false] - 이 수가 현재 리플레이에서 선택된 수인지 여부. */
  isCurrentMove?: boolean;
  /** @property {boolean} [showDetails=true] - 해설, 대안 수 등 상세 정보를 표시할지 여부. */
  showDetails?: boolean;
  /** @property {() => void} [onMoveClick] - 사용자가 이 주석 카드를 클릭했을 때 호출될 콜백. */
  onMoveClick?: () => void;
  /** @property {string} [className] - 컴포넌트의 최상위 요소에 적용할 추가 CSS 클래스. */
  className?: string;
}

/**
 * 단일 게임 수에 대한 상세한 분석 정보를 시각적으로 표시하는 "카드" 컴포넌트입니다.
 * 수의 품질, 평가 점수, 해설, 대안 수 등을 포함한 풍부한 정보를 제공합니다.
 * @param {ReplayMoveAnnotationProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 수 분석 정보 카드 UI.
 */
export function ReplayMoveAnnotation({
  move,
  moveIndex,
  isCurrentMove = false,
  showDetails = true,
  onMoveClick,
  className = ''
}: ReplayMoveAnnotationProps) {
  // `analyzeMoveQuality` 유틸리티 함수를 사용하여 수 데이터를 분석합니다.
  const analysis = analyzeMoveQuality(move);

  // 분석 데이터가 없는 경우 간단한 메시지를 표시합니다.
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

  /** 분석 품질에 따라 적절한 Lucide 아이콘 컴포넌트를 반환합니다. */
  const getIcon = () => {
    switch (quality.icon) {
      case 'CheckCircle': return CheckCircle;
      case 'TrendingUp': return TrendingUp;
      case 'AlertTriangle': return AlertTriangle;
      default: return Target;
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
          ? 'bg-yellow-500/10 border-yellow-400/30 ring-1 ring-yellow-400/20' // 현재 수 강조
          : 'bg-black/20 border-white/10 hover:bg-black/30' // 기본 상태
        }
        ${onMoveClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onMoveClick}
    >
      <div className="flex items-start gap-3">
        {/* 좌측: 수 품질 아이콘 */}
        <div className={`w-8 h-8 ${quality.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} className={quality.color} />
        </div>

        <div className="flex-1 min-w-0">
          {/* 우측 상단: 헤더 (수 정보, 품질 레이블, 평가 점수) */}
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

          {/* 우측 중단: 부가 정보 (뒤집은 돌 개수, 최적수 여부 등) */}
          <div className="flex items-center gap-4 text-xs text-white/60 mb-2">
            <span>{move.flippedDiscs.length}개 뒤집음</span>
            {move.isOptimal && (
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle size={10} /> 최적수
              </span>
            )}
            {isCurrentMove && (
              <span className="flex items-center gap-1 text-yellow-400">
                <ChevronRight size={10} /> 현재
              </span>
            )}
          </div>

          {/* 상세 정보가 활성화된 경우 표시되는 내용 */}
          {showDetails && (
            <>
              {/* AI 해설 */}
              <p className="text-sm text-white/80 font-smooth leading-relaxed mb-2">
                {commentary}
              </p>
              {/* 대안 수 목록 */}
              {move.alternativeMoves && move.alternativeMoves.length > 0 && (
                <div className="space-y-1">
                  <h5 className="text-xs font-medium text-white/70 font-smooth">더 나은 선택:</h5>
                  <div className="flex flex-wrap gap-2">
                    {move.alternativeMoves.slice(0, 3).map((altMove, index) => (
                      <div key={index} className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-xs">
                        <span className="text-white/80 font-smooth">{String.fromCharCode(65 + altMove.x)}{altMove.y + 1}</span>
                        <span className={`font-mono ${altMove.score > 0 ? 'text-green-400' : altMove.score < 0 ? 'text-red-400' : 'text-white/70'}`}>
                          {altMove.score > 0 ? '+' : ''}{altMove.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* 타임스탬프 */}
              {move.timestamp && (
                <div className="flex items-center gap-1 mt-2 text-xs text-white/50">
                  <Clock size={10} />
                  <span>{new Date(move.timestamp).toLocaleTimeString()}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * @interface ReplayMoveListProps
 * `ReplayMoveList` 컴포넌트의 props를 정의합니다.
 */
interface ReplayMoveListProps {
  /** @property {GameMove[]} moves - 표시할 수들의 배열. */
  moves: GameMove[];
  /** @property {number} currentMoveIndex - 현재 선택된 수의 인덱스. */
  currentMoveIndex: number;
  /** @property {(moveIndex: number) => void} [onMoveClick] - 리스트의 항목을 클릭했을 때 호출될 콜백. */
  onMoveClick?: (moveIndex: number) => void;
  /** @property {boolean} [showAnnotations=true] - 각 수에 대한 상세 주석 표시 여부. */
  showAnnotations?: boolean;
  className?: string;
}

/**
 * `ReplayMoveAnnotation` 컴포넌트들을 리스트 형태로 렌더링하는 컨테이너 컴포넌트입니다.
 * @param {ReplayMoveListProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 수 주석 목록 UI.
 */
export function ReplayMoveList({
  moves,
  currentMoveIndex,
  onMoveClick,
  showAnnotations = true,
  className = ''
}: ReplayMoveListProps) {
  // 수가 없는 경우 메시지를 표시합니다.
  if (moves.length === 0) {
    return (
      <div className={`text-center py-8 text-white/60 ${className}`}>
        <Brain size={24} className="mx-auto mb-2 opacity-50" />
        <p className="font-display">수순 정보가 없습니다</p>
      </div>
    );
  }

  // `moves` 배열을 순회하며 각 수에 대한 `ReplayMoveAnnotation`을 렌더링합니다.
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