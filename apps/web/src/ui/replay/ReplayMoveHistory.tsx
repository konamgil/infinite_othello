import React from 'react';
import { GameMove } from '../../types/replay';
import {
  Circle,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

/**
 * @interface ReplayMoveHistoryProps
 * `ReplayMoveHistory` 컴포넌트의 props를 정의합니다.
 */
interface ReplayMoveHistoryProps {
  /** @property {GameMove[]} moves - 게임의 모든 수에 대한 데이터 배열. */
  moves: GameMove[];
  /** @property {number} currentMoveIndex - 현재 선택된 수의 인덱스. */
  currentMoveIndex: number;
  /** @property {(index: number) => void} onMoveSelect - 사용자가 특정 수를 선택했을 때 호출될 콜백. */
  onMoveSelect: (index: number) => void;
  /** @property {boolean} [showAnalysis=false] - 각 수에 대한 AI 분석 정보를 표시할지 여부. */
  showAnalysis?: boolean;
}

/**
 * 게임의 모든 수를 순서대로 나열하는 스크롤 가능한 기록 목록 컴포넌트입니다.
 * 사용자는 각 수를 클릭하여 리플레이의 해당 시점으로 이동할 수 있습니다.
 * @param {ReplayMoveHistoryProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 수 기록 목록 UI.
 */
export function ReplayMoveHistory({
  moves,
  currentMoveIndex,
  onMoveSelect,
  showAnalysis = false
}: ReplayMoveHistoryProps) {

  /**
   * 좌표를 'A1'과 같은 대수 표기법으로 변환합니다.
   * @param {number} x - x 좌표 (0-7).
   * @param {number} y - y 좌표 (0-7).
   * @returns {string} 대수 표기법 문자열.
   */
  const formatPosition = (x: number, y: number) => {
    return `${String.fromCharCode(65 + x)}${y + 1}`;
  };

  /**
   * 평가 점수에 따라 적절한 아이콘을 반환합니다.
   * @param {number} [score] - 평가 점수.
   * @returns {JSX.Element | null} 아이콘 컴포넌트 또는 null.
   */
  const getEvaluationIcon = (score?: number) => {
    if (score === undefined) return null;
    if (score > 20) return <TrendingUp size={12} className="text-green-400" />;
    if (score < -20) return <TrendingDown size={12} className="text-red-400" />;
    if (Math.abs(score) > 10) return <AlertTriangle size={12} className="text-yellow-400" />;
    return <CheckCircle size={12} className="text-blue-400" />;
  };

  /**
   * 평가 점수와 최적수 여부에 따라 텍스트 색상 클래스를 반환합니다.
   * @param {number} [score] - 평가 점수.
   * @param {boolean} [isOptimal] - 최적수 여부.
   * @returns {string} Tailwind CSS 색상 클래스.
   */
  const getEvaluationColor = (score?: number, isOptimal?: boolean) => {
    if (isOptimal) return 'text-green-400';
    if (score === undefined) return 'text-white/60';
    if (score > 20) return 'text-green-400';
    if (score < -20) return 'text-red-400';
    if (Math.abs(score) > 10) return 'text-yellow-400';
    return 'text-blue-400';
  };

  /**
   * 타임스탬프를 '분:초' 형식의 문자열로 변환합니다.
   * @param {number} timestamp - 현재 수의 타임스탬프.
   * @param {number} startTime - 게임 시작 타임스탬프.
   * @returns {string} 포맷된 시간 문자열.
   */
  const formatTime = (timestamp: number, startTime: number) => {
    const elapsed = Math.floor((timestamp - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const startTime = moves.length > 0 ? moves[0].timestamp : Date.now();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="font-semibold text-white/90 font-smooth">수 기록</h3>
        <p className="text-xs text-white/60 font-smooth mt-1">
          총 {moves.length}수 • {showAnalysis ? 'AI 분석 포함' : '기본 정보'}
        </p>
      </div>

      {/* Move List */}
      <div className="flex-1 overflow-y-auto overscroll-behavior-y-contain">
        <div className="p-2">
          {/* Starting Position */}
          <button
            onClick={() => onMoveSelect(0)}
            className={`w-full p-3 rounded-lg border transition-all duration-200 mb-2 ${
              currentMoveIndex === 0
                ? 'bg-purple-500/20 border-purple-400/30'
                : 'bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-400
                            flex items-center justify-center">
                <span className="text-xs font-bold text-white">S</span>
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-white/90 font-smooth">
                  게임 시작
                </div>
                <div className="text-xs text-white/60 font-smooth">
                  초기 배치 상태
                </div>
              </div>
            </div>
          </button>

          {/* Individual Moves */}
          {moves.map((move, index) => {
            const moveNumber = index + 1;
            const isSelected = currentMoveIndex === moveNumber;
            const isPastMove = currentMoveIndex > moveNumber;

            return (
              <button
                key={moveNumber}
                onClick={() => onMoveSelect(moveNumber)}
                className={`w-full p-3 rounded-lg border transition-all duration-200 mb-2 ${
                  isSelected
                    ? 'bg-purple-500/20 border-purple-400/30'
                    : isPastMove
                    ? 'bg-blue-500/10 border-blue-400/20'
                    : 'bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Move Number and Player */}
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      move.player === 'black'
                        ? 'bg-black border-gray-600'
                        : 'bg-white border-gray-300'
                    }`}>
                      <span className={`text-xs font-bold ${
                        move.player === 'black' ? 'text-white' : 'text-black'
                      }`}>
                        {moveNumber}
                      </span>
                    </div>

                    {showAnalysis && move.isOptimal && (
                      <CheckCircle size={12} className="text-green-400" />
                    )}
                  </div>

                  {/* Move Details */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white/90 font-smooth">
                        {formatPosition(move.x, move.y)}
                      </span>
                      <span className="text-xs text-white/60 font-smooth">
                        {move.flippedDiscs.length}개 뒤집기
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      {/* Time */}
                      <span className="text-xs text-white/50 font-smooth">
                        {formatTime(move.timestamp, startTime)}
                      </span>

                      {/* Analysis Info */}
                      {showAnalysis && move.evaluationScore !== undefined && (
                        <div className="flex items-center gap-1">
                          {getEvaluationIcon(move.evaluationScore)}
                          <span className={`text-xs font-smooth ${
                            getEvaluationColor(move.evaluationScore, move.isOptimal)
                          }`}>
                            {move.evaluationScore > 0 ? '+' : ''}{move.evaluationScore}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  )}
                </div>

                {/* Alternative Moves Preview */}
                {showAnalysis && move.alternativeMoves && move.alternativeMoves.length > 0 && isSelected && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="text-xs text-white/60 mb-1 font-smooth">다른 좋은 수:</div>
                    <div className="flex flex-wrap gap-1">
                      {move.alternativeMoves.slice(0, 3).map((altMove, altIndex) => (
                        <span
                          key={altIndex}
                          className="px-2 py-1 text-xs rounded bg-black/30 text-white/70 font-smooth"
                        >
                          {formatPosition(altMove.x, altMove.y)} ({altMove.score > 0 ? '+' : ''}{altMove.score})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            );
          })}

          {/* Game End */}
          <button
            onClick={() => onMoveSelect(moves.length)}
            className={`w-full p-3 rounded-lg border transition-all duration-200 ${
              currentMoveIndex === moves.length
                ? 'bg-purple-500/20 border-purple-400/30'
                : 'bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-400
                            flex items-center justify-center">
                <span className="text-xs font-bold text-white">E</span>
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-white/90 font-smooth">
                  게임 종료
                </div>
                <div className="text-xs text-white/60 font-smooth">
                  최종 결과 상태
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-white/10">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-black/30">
            <div className="text-white/60 font-smooth">흑돌 수</div>
            <div className="text-white/90 font-bold">
              {moves.filter(m => m.player === 'black').length}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-black/30">
            <div className="text-white/60 font-smooth">백돌 수</div>
            <div className="text-white/90 font-bold">
              {moves.filter(m => m.player === 'white').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}