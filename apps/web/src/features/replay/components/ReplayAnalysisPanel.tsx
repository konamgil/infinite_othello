import React, { useState } from 'react';
import { GameAnalysis, GameMove } from '../../../types/replay';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity,
  Zap,
  Eye
} from 'lucide-react';

/**
 * @interface ReplayAnalysisPanelProps
 * `ReplayAnalysisPanel` 컴포넌트의 props를 정의합니다.
 */
interface ReplayAnalysisPanelProps {
  /** @property {GameAnalysis} analysis - 게임 전체에 대한 AI 분석 데이터 객체. */
  analysis: GameAnalysis;
  /** @property {GameMove} [currentMove] - 현재 선택된 수에 대한 정보. */
  currentMove?: GameMove;
  /** @property {number} currentMoveIndex - 현재 선택된 수의 인덱스. */
  currentMoveIndex: number;
}

/**
 * 게임 리플레이에 대한 AI 분석 결과를 탭 형식으로 보여주는 패널 컴포넌트입니다.
 * '현재 수', '전체', '단계별' 분석 탭을 제공합니다.
 * @param {ReplayAnalysisPanelProps} props - 컴포넌트 props
 * @returns {JSX.Element} AI 분석 패널 UI
 */
export function ReplayAnalysisPanel({
  analysis,
  currentMove,
  currentMoveIndex
}: ReplayAnalysisPanelProps) {
  /** @state {'current' | 'overall' | 'phases'} activeTab - 현재 활성화된 탭을 관리하는 상태. */
  const [activeTab, setActiveTab] = useState<'current' | 'overall' | 'phases'>('current');

  /**
   * 정확도 숫자를 퍼센트 문자열로 포맷합니다.
   * @param {number} accuracy - 정확도 값.
   * @returns {string} 포맷된 퍼센트 문자열 (예: "85%").
   */
  const formatAccuracy = (accuracy: number) => `${Math.round(accuracy)}%`;

  /**
   * 정확도 값에 따라 적절한 Tailwind CSS 텍스트 색상 클래스를 반환합니다.
   * @param {number} accuracy - 정확도 값.
   * @returns {string} Tailwind CSS 색상 클래스.
   */
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-400';
    if (accuracy >= 80) return 'text-yellow-400';
    if (accuracy >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  /**
   * 수의 평가 점수에 따라 품질(레이블, 색상, 아이콘)을 반환합니다.
   * @param {GameMove} [move] - 분석할 수 정보.
   * @returns {{label: string, color: string, icon: React.ElementType} | null} 수 품질 정보 객체 또는 null.
   */
  const getMoveQuality = (move?: GameMove) => {
    if (!move || move.evaluationScore === undefined) return null;

    if (move.isOptimal) {
      return { label: '최적수', color: 'text-green-400', icon: CheckCircle };
    } else if (move.evaluationScore > 10) {
      return { label: '좋은 수', color: 'text-blue-400', icon: TrendingUp };
    } else if (move.evaluationScore < -20) {
      return { label: '실수', color: 'text-red-400', icon: TrendingDown };
    } else if (move.evaluationScore < -10) {
      return { label: '부정확', color: 'text-yellow-400', icon: AlertTriangle };
    }
    return { label: '평균', color: 'text-white/70', icon: Target };
  };

  /**
   * 분석 패널 내에서 사용되는 탭 버튼을 위한 내부 컴포넌트입니다.
   * @param {{id: typeof activeTab, label: string, icon: React.ElementType}} props - 탭 버튼 props
   * @returns {JSX.Element} 탭 버튼 UI
   */
  const TabButton = ({ id, label, icon: Icon }: {
    id: typeof activeTab,
    label: string,
    icon: any
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
        activeTab === id
          ? 'bg-purple-500/20 border border-purple-400/30 text-purple-300'
          : 'hover:bg-black/30 text-white/60'
      }`}
    >
      <Icon size={14} />
      <span className="text-xs font-smooth">{label}</span>
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="font-semibold text-white/90 font-smooth">AI 분석</h3>
        <p className="text-xs text-white/60 font-smooth mt-1">
          게임 분석 및 평가
        </p>
      </div>

      {/* Tabs */}
      <div className="p-3 border-b border-white/10">
        <div className="flex gap-1">
          <TabButton id="current" label="현재 수" icon={Eye} />
          <TabButton id="overall" label="전체" icon={BarChart3} />
          <TabButton id="phases" label="단계별" icon={Activity} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-behavior-y-contain p-4">
        {activeTab === 'current' && (
          <div className="space-y-4">
            {currentMove ? (
              <>
                {/* Move Quality */}
                <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
                  <h4 className="text-sm font-medium text-white/80 mb-2 font-smooth">
                    수 품질 평가
                  </h4>
                  {(() => {
                    const quality = getMoveQuality(currentMove);
                    if (!quality) {
                      return (
                        <div className="text-white/60 text-sm font-smooth">
                          분석 정보 없음
                        </div>
                      );
                    }

                    const Icon = quality.icon;
                    return (
                      <div className="flex items-center gap-3">
                        <Icon size={20} className={quality.color} />
                        <div>
                          <div className={`font-semibold ${quality.color} font-smooth`}>
                            {quality.label}
                          </div>
                          <div className="text-xs text-white/60 font-smooth">
                            평가점수: {currentMove.evaluationScore > 0 ? '+' : ''}{currentMove.evaluationScore}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Move Details */}
                <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
                  <h4 className="text-sm font-medium text-white/80 mb-2 font-smooth">
                    수 정보
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60 font-smooth">위치</span>
                      <span className="text-white/90 font-smooth">
                        {String.fromCharCode(65 + currentMove.x)}{currentMove.y + 1}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60 font-smooth">플레이어</span>
                      <span className="text-white/90 font-smooth">
                        {currentMove.player === 'black' ? '흑돌' : '백돌'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60 font-smooth">뒤집힌 돌</span>
                      <span className="text-white/90 font-smooth">
                        {currentMove.flippedDiscs.length}개
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60 font-smooth">수 번호</span>
                      <span className="text-white/90 font-smooth">
                        {currentMove.moveNumber}수
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alternative Moves */}
                {currentMove.alternativeMoves && currentMove.alternativeMoves.length > 0 && (
                  <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
                    <h4 className="text-sm font-medium text-white/80 mb-2 font-smooth">
                      다른 가능한 수
                    </h4>
                    <div className="space-y-2">
                      {currentMove.alternativeMoves.slice(0, 3).map((altMove, index) => (
                        <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-black/30">
                          <span className="text-white/80 font-smooth">
                            {String.fromCharCode(65 + altMove.x)}{altMove.y + 1}
                          </span>
                          <span className={`text-sm font-smooth ${
                            altMove.score > 0 ? 'text-green-400' :
                            altMove.score < 0 ? 'text-red-400' :
                            'text-white/70'
                          }`}>
                            {altMove.score > 0 ? '+' : ''}{altMove.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Brain size={32} className="text-white/40 mx-auto mb-2" />
                <p className="text-white/60 font-smooth">
                  수를 선택하면 분석 정보를 볼 수 있습니다
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'overall' && (
          <div className="space-y-4">
            {/* Accuracy Stats */}
            <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
              <h4 className="text-sm font-medium text-white/80 mb-3 font-smooth">
                정확도 분석
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-black/30">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-black rounded-full"></div>
                    <span className="text-xs text-white/60 font-smooth">흑돌</span>
                  </div>
                  <div className={`text-lg font-bold font-smooth ${getAccuracyColor(analysis.accuracy.black)}`}>
                    {formatAccuracy(analysis.accuracy.black)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-black/30">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                    <span className="text-xs text-white/60 font-smooth">백돌</span>
                  </div>
                  <div className={`text-lg font-bold font-smooth ${getAccuracyColor(analysis.accuracy.white)}`}>
                    {formatAccuracy(analysis.accuracy.white)}
                  </div>
                </div>
              </div>
            </div>

            {/* Opening */}
            {analysis.openingName && (
              <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
                <h4 className="text-sm font-medium text-white/80 mb-2 font-smooth">
                  오프닝
                </h4>
                <div className="text-white/90 font-smooth">
                  {analysis.openingName}
                </div>
              </div>
            )}

            {/* Turning Points */}
            {analysis.turningPoints.length > 0 && (
              <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
                <h4 className="text-sm font-medium text-white/80 mb-3 font-smooth">
                  게임 전환점
                </h4>
                <div className="space-y-2">
                  {analysis.turningPoints.slice(0, 3).map((point, index) => (
                    <div key={index} className="p-2 rounded-lg bg-black/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white/80 text-sm font-smooth">
                          {point.moveNumber}수
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          point.significance === 'critical' ? 'bg-red-500/20 text-red-300' :
                          point.significance === 'major' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-blue-500/20 text-blue-300'
                        } font-smooth`}>
                          {point.significance === 'critical' ? '결정적' :
                           point.significance === 'major' ? '중요' : '소폭'}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 font-smooth">
                        {point.description}
                      </p>
                      <div className="text-xs text-white/50 mt-1 font-smooth">
                        {point.previousEvaluation} → {point.newEvaluation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Move Quality Summary */}
            <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
              <h4 className="text-sm font-medium text-white/80 mb-3 font-smooth">
                수 품질 요약
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 rounded-lg bg-green-500/10 border border-green-400/20">
                  <div className="text-green-300 font-smooth">최적수</div>
                  <div className="text-white/90 font-bold">
                    {analysis.bestMoves.length}개
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-400/20">
                  <div className="text-red-300 font-smooth">실수</div>
                  <div className="text-white/90 font-bold">
                    {analysis.blunders.length}개
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'phases' && (
          <div className="space-y-4">
            {/* Game Phases */}
            {Object.entries(analysis.gamePhases).map(([phase, data]) => (
              <div key={phase} className="p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
                <h4 className="text-sm font-medium text-white/80 mb-2 font-smooth capitalize">
                  {phase === 'opening' ? '오프닝' :
                   phase === 'midgame' ? '중반전' :
                   '엔드게임'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60 font-smooth">수 범위</span>
                    <span className="text-white/90 font-smooth">
                      {data.startMove} - {data.endMove}수
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 font-smooth">평가</span>
                    <span className="text-white/90 font-smooth">
                      {data.evaluation}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Time Analysis */}
            {analysis.timeAnalysis && (
              <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
                <h4 className="text-sm font-medium text-white/80 mb-3 font-smooth">
                  시간 분석
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 rounded-lg bg-black/30">
                      <div className="text-xs text-white/60 font-smooth">흑돌 평균</div>
                      <div className="text-white/90 font-bold">
                        {Math.round(analysis.timeAnalysis.averageThinkTime.black)}초
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30">
                      <div className="text-xs text-white/60 font-smooth">백돌 평균</div>
                      <div className="text-white/90 font-bold">
                        {Math.round(analysis.timeAnalysis.averageThinkTime.white)}초
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-black/30">
                    <div className="text-xs text-white/60 font-smooth">최장 고민</div>
                    <div className="text-white/90 text-sm font-smooth">
                      {analysis.timeAnalysis.longestThink.moveNumber}수 •{' '}
                      {analysis.timeAnalysis.longestThink.player === 'black' ? '흑돌' : '백돌'} •{' '}
                      {Math.round(analysis.timeAnalysis.longestThink.duration)}초
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-black/30">
                    <div className="text-xs text-white/60 font-smooth">시간 분배</div>
                    <div className="text-white/90 text-sm font-smooth">
                      {analysis.timeAnalysis.timeDistribution === 'even' ? '균등' :
                       analysis.timeAnalysis.timeDistribution === 'frontloaded' ? '초반 집중' :
                       '후반 집중'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}