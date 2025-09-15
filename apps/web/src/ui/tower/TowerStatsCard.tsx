import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Award, TrendingUp, History, CheckCircle, XCircle } from 'lucide-react';

export function TowerStatsCard() {
  const { player } = useGameStore();

  // Placeholder data - this should come from the game store in a real implementation
  const towerHighestProgress = player.towerHighestProgress || player.towerProgress;
  const towerWins = player.towerWins || 18;
  const towerLosses = player.towerLosses || 5;
  const successRate = Math.round((towerWins / (towerWins + towerLosses)) * 100);
  const recentAttempts = [true, true, false, true, true]; // true for win, false for loss

  return (
    <div className="w-full max-w-md mx-auto bg-black/30 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
      <div className="grid grid-cols-3 gap-4 text-center">
        
        {/* Stat 1: Highest Floor */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/20 mb-2">
            <Award className="w-6 h-6 text-yellow-400" />
          </div>
          <span className="text-xs text-white/60 font-sans">최고 기록</span>
          <span className="text-lg font-bold font-display text-white">{towerHighestProgress}F</span>
        </div>

        {/* Stat 2: Success Rate */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-400/10 border border-green-400/20 mb-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <span className="text-xs text-white/60 font-sans">도전 성공률</span>
          <span className="text-lg font-bold font-display text-white">{successRate}%</span>
        </div>

        {/* Stat 3: Recent Attempts */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-400/10 border border-purple-400/20 mb-2">
            <History className="w-6 h-6 text-purple-400" />
          </div>
          <span className="text-xs text-white/60 font-sans">최근 도전</span>
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
