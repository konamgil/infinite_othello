import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../../../store/gameStore';
import { BattleLayout } from '../../layouts/BattleLayout';
import { haptic } from '../../../../ui/feedback/HapticFeedback';
import { Swords, Trophy, Crown } from 'lucide-react';

/**
 * The main page for the battle feature.
 *
 * This component serves as the hub for all battle-related activities. It displays:
 * - The player's current battle statistics (wins, losses, rank).
 * - A selection of battle modes (Quick Match, Ranked Game, Tournament).
 * - A list of the player's recent battle history.
 *
 * It uses the `useGameStore` to get player data and `useNavigate` for routing.
 *
 * @returns {React.ReactElement} The rendered battle home page.
 */
export default function BattlePage() {
  const player = useGameStore((state) => state.player);
  const navigate = useNavigate();

  /**
   * Handles the click event for a battle mode selection.
   *
   * This function triggers haptic feedback and navigates the user to the
   * corresponding battle mode page (e.g., '/battle/quick').
   *
   * @param {string} mode - The selected battle mode (e.g., 'quick', 'ranked').
   */
  const handleBattleModeClick = (mode: string) => {
    haptic.buttonTap();
    if (navigator.vibrate) {
      navigator.vibrate([25, 15, 25]); // 배틀 모드 진동
    }
    navigate(`/battle/${mode}`);
  };

  return (
    <BattleLayout>
      <div>
        {/* 플레이어 전투 기록 - 별빛 스타일 */}
        <div className="mb-6 mt-12 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center">
                <Swords size={16} className="text-yellow-400/80" />
              </div>
              <h3 className="text-base font-display font-medium text-white/90 tracking-wide">
                {player.name}님의 전투 기록
              </h3>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="relative group">
                <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="text-lg font-display font-bold text-green-400 mb-1">{player.wins}</div>
                  <div className="text-xs text-white/60 font-display">승리</div>
                </div>
                <div className="absolute -inset-1 bg-green-400/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              </div>

              <div className="relative group">
                <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="text-lg font-display font-bold text-red-400 mb-1">{player.losses}</div>
                  <div className="text-xs text-white/60 font-display">패배</div>
                </div>
                <div className="absolute -inset-1 bg-red-400/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              </div>

              <div className="relative group">
                <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="text-lg font-display font-bold text-orange-400 mb-1">{player.winStreak}</div>
                  <div className="text-xs text-white/60 font-display">연승</div>
                </div>
                <div className="absolute -inset-1 bg-orange-400/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              </div>
            </div>
            
          </div>
        </div>

        {/* 전투 모드 선택 - 별빛 스타일 */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 flex items-center justify-center">
              <Trophy size={16} className="text-blue-400/80" />
            </div>
            <h3 className="text-base font-display font-medium text-white/90 tracking-wide">전투 모드</h3>
          </div>

          <div className="space-y-3">
            {/* 빠른 매치 */}
            <div
              className="group relative p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10
                       hover:bg-white/10 hover:border-white/20
                       active:scale-90 active:brightness-110 transition-all duration-150
                       cursor-pointer touch-manipulation select-none"
              onClick={() => handleBattleModeClick('quick')}
            >
              <div className="flex items-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400/20 to-blue-600/20 flex items-center justify-center mr-4 border border-blue-400/30">
                  <Swords size={22} className="text-blue-400/80" />
                </div>
                <div className="flex-1">
                  <h4 className="font-display font-medium text-white/90 text-base mb-1">빠른 매치</h4>
                  <p className="text-sm text-white/60 font-display">비슷한 전력의 상대와 즉시 매칭</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="text-xs text-blue-400/80 font-display font-bold">~30초</div>
                </div>
              </div>
              <div className="absolute -inset-1 bg-blue-400/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            </div>

            {/* 랭크 게임 */}
            <div
              className="group relative p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10
                       hover:bg-white/10 hover:border-white/20
                       active:scale-90 active:brightness-110 transition-all duration-150
                       cursor-pointer touch-manipulation select-none"
              onClick={() => handleBattleModeClick('ranked')}
            >
              <div className="flex items-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-400/20 to-purple-600/20 flex items-center justify-center mr-4 border border-purple-400/30">
                  <Crown size={22} className="text-purple-400/80" />
                </div>
                <div className="flex-1">
                  <h4 className="font-display font-medium text-white/90 text-base mb-1">랭크 게임</h4>
                  <p className="text-sm text-white/60 font-display">RP를 획득하고 등급을 올려보세요</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <div className="text-xs text-purple-400/80 font-display font-bold">~10분</div>
                </div>
              </div>
              <div className="absolute -inset-1 bg-purple-400/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            </div>

            {/* 토너먼트 */}
            <div
              className="group relative p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10
                       hover:bg-white/10 hover:border-white/20
                       active:scale-90 active:brightness-110 transition-all duration-150
                       cursor-pointer touch-manipulation select-none"
              onClick={() => handleBattleModeClick('tournament')}
            >
              <div className="flex items-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400/20 to-orange-600/20 flex items-center justify-center mr-4 border border-orange-400/30">
                  <Trophy size={22} className="text-orange-400/80" />
                </div>
                <div className="flex-1">
                  <h4 className="font-display font-medium text-white/90 text-base mb-1">토너먼트</h4>
                  <p className="text-sm text-white/60 font-display">정예 전사들과 경쟁하는 이벤트 모드</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <div className="text-xs text-orange-400/80 font-display font-bold">64강 진행 중</div>
                </div>
              </div>
              <div className="absolute -inset-1 bg-orange-400/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            </div>
          </div>
        </div>

      </div>
    </BattleLayout>
  );
}


