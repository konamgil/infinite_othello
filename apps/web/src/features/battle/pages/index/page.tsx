import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../../../store/gameStore';
import { BattleLayout } from '../../layouts/BattleLayout';
import { RECENT_BATTLES, TOURNAMENTS } from '../../constants';
import { haptic } from '../../../../ui/feedback/HapticFeedback';
import { Swords, Trophy, Users, Clock, Star, Crown } from 'lucide-react';

export default function BattlePage() {
  const player = useGameStore((state) => state.player);
  const navigate = useNavigate();

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
        <div className="mb-8 p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center">
                <Swords size={16} className="text-yellow-400/80" />
              </div>
              <h3 className="text-lg font-display font-bold text-white/90 tracking-wide">
                {player.name}님의 전투 기록
              </h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="relative group">
                <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="text-2xl font-display font-bold text-green-400 mb-1">{player.wins}</div>
                  <div className="text-xs text-white/60 font-display">승리</div>
                </div>
                <div className="absolute -inset-1 bg-green-400/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              </div>
              
              <div className="relative group">
                <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="text-2xl font-display font-bold text-red-400 mb-1">{player.losses}</div>
                  <div className="text-xs text-white/60 font-display">패배</div>
                </div>
                <div className="absolute -inset-1 bg-red-400/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              </div>
              
              <div className="relative group">
                <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="text-2xl font-display font-bold text-orange-400 mb-1">{player.winStreak}</div>
                  <div className="text-xs text-white/60 font-display">연승</div>
                </div>
                <div className="absolute -inset-1 bg-orange-400/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/30">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Crown size={12} className="text-white" />
              </div>
              <span className="text-white/90 font-display font-bold tracking-wider">
                {player.rank} · {player.rp} RP
              </span>
            </div>
          </div>
        </div>

        {/* 전투 모드 선택 - 별빛 스타일 */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 flex items-center justify-center">
              <Trophy size={16} className="text-blue-400/80" />
            </div>
            <h3 className="text-lg font-display font-bold text-white/90 tracking-wide">전투 모드</h3>
          </div>

          <div className="space-y-4">
            {/* 빠른 매치 */}
            <div
              className="group relative p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 
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
                  <h4 className="font-display font-bold text-white/90 text-lg mb-1">빠른 매치</h4>
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
              className="group relative p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 
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
                  <h4 className="font-display font-bold text-white/90 text-lg mb-1">랭크 게임</h4>
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
              className="group relative p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 
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
                  <h4 className="font-display font-bold text-white/90 text-lg mb-1">토너먼트</h4>
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

        {/* 최근 전투 기록 - 별빛 스타일 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400/20 to-blue-500/20 flex items-center justify-center">
              <Star size={16} className="text-green-400/80" />
            </div>
            <h3 className="text-lg font-display font-bold text-white/90 tracking-wide">최근 전투 기록</h3>
          </div>
          
          <div className="space-y-3">
            {RECENT_BATTLES.map((battle) => (
              <div key={battle.opponent} className="group relative p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-between hover:bg-white/10 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 flex items-center justify-center border border-blue-400/30">
                    <Star size={18} className="text-blue-400/80" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-white/90">{battle.opponent}</div>
                    <div className="text-xs text-white/60 font-display">
                      {battle.rank} · {battle.timeAgo}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-display font-bold ${
                    battle.result === 'victory' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {battle.result === 'victory' ? '승리' : '패배'}
                  </div>
                  <div className="text-xs text-white/60 font-display">{battle.score}</div>
                </div>
                
                {/* 호버 시 글로우 효과 */}
                <div className={`absolute -inset-1 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500 ${
                  battle.result === 'victory' ? 'bg-green-400/10' : 'bg-red-400/10'
                }`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BattleLayout>
  );
}


