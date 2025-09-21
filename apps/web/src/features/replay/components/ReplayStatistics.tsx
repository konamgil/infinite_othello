import React from 'react';
import { GameReplay } from '../../../types/replay';
import { useReplayStore } from '../../store/replayStore';
import {
  Trophy,
  Target,
  Clock,
  Brain,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  Calendar,
  Timer,
  Percent,
  Star
} from 'lucide-react';

/**
 * @interface ReplayStatisticsProps
 * `ReplayStatistics` 컴포넌트의 props를 정의합니다.
 */
interface ReplayStatisticsProps {
  /** @property {GameReplay[]} replays - 통계 계산에 사용될 리플레이 데이터 배열. (현재는 `useReplayStore`를 통해 데이터를 가져오므로 직접 사용되지 않을 수 있음) */
  replays: GameReplay[];
}

/**
 * 여러 게임 리플레이에 대한 종합 통계를 시각화하는 대시보드 컴포넌트입니다.
 * `useReplayStore` (Zustand 스토어)를 통해 집계된 통계 데이터를 가져와 표시합니다.
 * @param {ReplayStatisticsProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 통계 대시보드 UI.
 */
export function ReplayStatistics({ replays }: ReplayStatisticsProps) {
  // Zustand 스토어에서 통계 계산 함수를 가져옵니다.
  const { getStatistics } = useReplayStore();
  // 스토어의 데이터를 기반으로 통계를 계산합니다.
  const stats = getStatistics();

  /**
   * 초 단위 시간을 "X시간 Y분" 또는 "Y분" 형식의 문자열로 변환합니다.
   * @param {number} seconds - 변환할 시간 (초).
   * @returns {string} 포맷된 시간 문자열.
   */
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else {
      return `${minutes}분`;
    }
  };

  /**
   * 개별 통계 항목을 표시하기 위한 재사용 가능한 카드 컴포넌트입니다.
   * @param {object} props - StatCard 컴포넌트의 props.
   * @param {string} props.title - 통계 항목의 제목.
   * @param {string | number} props.value - 표시할 통계 값.
   * @param {string} [props.subtitle] - 부가적인 설명.
   * @param {React.ElementType} props.icon - 표시할 아이콘.
   * @param {string} [props.color='text-white'] - 아이콘 색상 클래스.
   * @param {'up' | 'down'} [props.trend] - 상승 또는 하락 추세.
   * @param {string} [props.trendValue] - 추세 값.
   * @returns {JSX.Element} 통계 카드 UI.
   */
  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = 'text-white',
    trend,
    trendValue
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color?: string;
    trend?: 'up' | 'down';
    trendValue?: string;
  }) => (
    <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <Icon size={20} className={color} />
        {trend && (
          <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="text-xs font-smooth">{trendValue}</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white/90 font-smooth mb-1">
        {value}
      </div>
      <div className="text-sm text-white/70 font-smooth">
        {title}
      </div>
      {subtitle && (
        <div className="text-xs text-white/50 font-smooth mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );

  if (stats.totalGames === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20
                       backdrop-blur-md border border-white/10 flex items-center justify-center mb-6">
          <Trophy size={32} className="text-purple-300" />
        </div>
        <h3 className="text-xl font-bold text-white/90 mb-2 font-smooth">
          아직 통계 데이터가 없습니다
        </h3>
        <p className="text-white/60 text-center text-sm font-smooth">
          게임을 플레이하면 여러분의 성장을 추적할 수 있는 통계가 생성됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div>
        <h3 className="text-lg font-bold text-white/90 mb-4 font-smooth">전체 통계</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="총 게임 수"
            value={stats.totalGames}
            subtitle="우주 전투 횟수"
            icon={Target}
            color="text-blue-400"
          />
          <StatCard
            title="승률"
            value={`${Math.round(stats.winRate)}%`}
            subtitle={`${Math.round(stats.winRate * stats.totalGames / 100)}승`}
            icon={Trophy}
            color="text-green-400"
            trend={stats.winRate >= 50 ? 'up' : 'down'}
            trendValue={`${Math.abs(stats.winRate - 50).toFixed(1)}%`}
          />
          <StatCard
            title="평균 게임 시간"
            value={formatDuration(stats.averageGameDuration)}
            subtitle="1게임당"
            icon={Clock}
            color="text-purple-400"
          />
          <StatCard
            title="평균 수"
            value={stats.averageMovesPerGame}
            subtitle="게임당 평균"
            icon={Brain}
            color="text-amber-400"
          />
        </div>
      </div>

      {/* Performance by Game Mode */}
      <div>
        <h3 className="text-lg font-bold text-white/90 mb-4 font-smooth">모드별 성과</h3>
        <div className="space-y-3">
          {Object.entries(stats.performanceByMode).map(([mode, data]) => {
            if (data.games === 0) return null;

            const modeConfig = {
              tower: { name: '무한 탑', color: 'text-amber-400', bgColor: 'from-amber-500/20 to-yellow-500/20' },
              battle: { name: '랭크 대전', color: 'text-red-400', bgColor: 'from-red-500/20 to-pink-500/20' },
              casual: { name: '일반 대전', color: 'text-blue-400', bgColor: 'from-blue-500/20 to-cyan-500/20' },
              ai: { name: 'AI 대전', color: 'text-purple-400', bgColor: 'from-purple-500/20 to-indigo-500/20' }
            }[mode as keyof typeof stats.performanceByMode] || {
              name: mode,
              color: 'text-white/80',
              bgColor: 'from-gray-500/20 to-slate-500/20'
            };

            return (
              <div
                key={mode}
                className={`p-4 rounded-2xl bg-gradient-to-r ${modeConfig.bgColor}
                           backdrop-blur-md border border-white/10`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-semibold ${modeConfig.color} font-smooth`}>
                      {modeConfig.name}
                    </h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-white/80 text-sm font-smooth">
                        {data.games}게임
                      </span>
                      <span className={`text-sm font-smooth ${
                        data.winRate >= 50 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        승률 {Math.round(data.winRate)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${modeConfig.color} font-smooth`}>
                      {Math.round(data.winRate)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Trends */}
      <div>
        <h3 className="text-lg font-bold text-white/90 mb-4 font-smooth">최근 추세</h3>
        <div className="grid grid-cols-1 gap-3">
          {[
            { period: '최근 7일', data: stats.recentTrends.last7Days, color: 'text-green-400' },
            { period: '최근 30일', data: stats.recentTrends.last30Days, color: 'text-blue-400' },
            { period: '최근 90일', data: stats.recentTrends.last90Days, color: 'text-purple-400' }
          ].map(({ period, data, color }) => (
            <div
              key={period}
              className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white/90 font-smooth">{period}</span>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-white/70 text-sm font-smooth">
                      {data.games}게임
                    </span>
                    {data.games > 0 && (
                      <span className={`text-sm font-smooth ${color}`}>
                        승률 {Math.round(data.winRate)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className={`text-xl font-bold ${color} font-smooth`}>
                  {data.games > 0 ? `${Math.round(data.winRate)}%` : '-'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Favorite Openings */}
      {stats.favoriteOpenings.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white/90 mb-4 font-smooth">선호 오프닝</h3>
          <div className="space-y-3">
            {stats.favoriteOpenings.map((opening, index) => (
              <div
                key={opening.name}
                className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-gray-400/20 text-gray-300' :
                      'bg-amber-600/20 text-amber-400'
                    }`}>
                      <Star size={16} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white/90 font-smooth">
                        {opening.name}
                      </h4>
                      <span className="text-white/60 text-sm font-smooth">
                        {opening.count}회 사용
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold font-smooth ${
                      opening.winRate >= 50 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {Math.round(opening.winRate)}%
                    </div>
                    <span className="text-xs text-white/50 font-smooth">승률</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strongest Opponents */}
      {stats.strongestOpponents.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white/90 mb-4 font-smooth">강력한 상대들</h3>
          <div className="space-y-3">
            {stats.strongestOpponents.map((opponent) => (
              <div
                key={opponent.name}
                className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30
                                  flex items-center justify-center border border-blue-400/20">
                      {opponent.name.startsWith('AI') ? (
                        <Brain size={16} className="text-purple-300" />
                      ) : (
                        <Users size={16} className="text-blue-300" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white/90 font-smooth">
                        {opponent.name}
                      </h4>
                      <span className="text-white/60 text-sm font-smooth">
                        {opponent.gamesPlayed}회 대전
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold font-smooth ${
                      opponent.winRate >= 50 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {Math.round(opponent.winRate)}%
                    </div>
                    <span className="text-xs text-white/50 font-smooth">승률</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}