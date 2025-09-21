import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Award, TrendingUp, History, CheckCircle, XCircle } from 'lucide-react';

/**
 * '무한의 탑' 도전과 관련된 플레이어의 주요 통계를 보여주는 카드 컴포넌트입니다.
 * 최고 기록, 도전 성공률, 최근 도전 결과 등 세 가지 핵심 지표를 시각적으로 표시합니다.
 * @returns {JSX.Element} 탑 통계 정보를 담은 카드 UI.
 */
export function TowerStatsCard() {
  // Zustand 스토어에서 플레이어의 상태 정보를 가져옵니다.
  const { player } = useGameStore();

  // TODO: 실제 구현 시 이 데이터는 스토어나 백엔드에서 받아와야 합니다. 현재는 임시 데이터(placeholder)를 사용합니다.
  /** @const {number} towerHighestProgress - 플레이어가 도달한 최고 층수. */
  const towerHighestProgress = player.towerHighestProgress || player.towerProgress;
  /** @const {number} towerWins - 탑에서 승리한 횟수. */
  const towerWins = player.towerWins || 18;
  /** @const {number} towerLosses - 탑에서 패배한 횟수. */
  const towerLosses = player.towerLosses || 5;
  /** @const {number} successRate - 승률 계산 (승리 / (승리 + 패배)). */
  const successRate = Math.round((towerWins / (towerWins + towerLosses)) * 100);
  /** @const {boolean[]} recentAttempts - 최근 5번의 도전 결과 (true: 승리, false: 패배). */
  const recentAttempts = [true, true, false, true, true];

  return (
    // 반투명 배경과 흐림 효과가 적용된 메인 컨테이너
    <div className="w-full max-w-md mx-auto bg-black/30 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
      {/* 3개의 통계를 가로로 나열하기 위한 그리드 레이아웃 */}
      <div className="grid grid-cols-3 gap-4 text-center">
        
        {/* 통계 1: 최고 기록 */}
        <div className="flex flex-col items-center justify-center">
          {/* 아이콘 표시부 */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/20 mb-2">
            <Award className="w-6 h-6 text-yellow-400" />
          </div>
          {/* 통계 제목 */}
          <span className="text-xs text-white/60 font-sans">최고 기록</span>
          {/* 통계 값 */}
          <span className="text-lg font-bold font-display text-white">{towerHighestProgress}F</span>
        </div>

        {/* 통계 2: 도전 성공률 */}
        <div className="flex flex-col items-center justify-center">
          {/* 아이콘 표시부 */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-400/10 border border-green-400/20 mb-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          {/* 통계 제목 */}
          <span className="text-xs text-white/60 font-sans">도전 성공률</span>
          {/* 통계 값 */}
          <span className="text-lg font-bold font-display text-white">{successRate}%</span>
        </div>

        {/* 통계 3: 최근 도전 기록 */}
        <div className="flex flex-col items-center justify-center">
          {/* 아이콘 표시부 */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-400/10 border border-purple-400/20 mb-2">
            <History className="w-6 h-6 text-purple-400" />
          </div>
          {/* 통계 제목 */}
          <span className="text-xs text-white/60 font-sans">최근 도전</span>
          {/* 최근 5번의 결과를 아이콘으로 매핑하여 표시 */}
          <div className="flex items-center gap-1 mt-2">
            {recentAttempts.map((won, index) => (
              won ? 
                <CheckCircle key={index} className="w-3.5 h-3.5 text-green-400/70" /> : 
                <XCircle key={index} className="w-3.5 h-3.5 text-red-400/50" />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
