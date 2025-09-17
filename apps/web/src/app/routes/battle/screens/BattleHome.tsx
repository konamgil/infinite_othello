import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../../../store/gameStore';
import { BattleLayout } from '../BattleLayout';
import { RECENT_BATTLES, TOURNAMENTS } from '../constants';
import { Swords, Trophy, Users, Clock, Star, Crown } from 'lucide-react';

export function BattleHome() {
  const player = useGameStore((state) => state.player);
  const navigate = useNavigate();

  return (
    <BattleLayout>
      <div>
        <div className="mb-6 p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
          <div className="text-center">
            <h3 className="text-lg font-smooth font-semibold text-white/90 mb-4">
              {player.name}님의 전투 기록
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm">
                <div className="text-2xl font-smooth font-bold text-green-400">{player.wins}</div>
                <div className="text-xs text-white/70 font-smooth">승리</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm">
                <div className="text-2xl font-smooth font-bold text-red-400">{player.losses}</div>
                <div className="text-xs text-white/70 font-smooth">패배</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm">
                <div className="text-2xl font-smooth font-bold text-orange-400">{player.winStreak}</div>
                <div className="text-xs text-white/70 font-smooth">연승</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
              <Crown size={16} className="text-orange-400" />
              <span className="text-sm text-white/90 font-smooth">
                {player.rank} · {player.rp} RP
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-smooth font-semibold text-white/90 mb-6">전투 모드</h3>

          <div
            className="group p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/30 hover:border-white/20 active:scale-[0.98] transition-all duration-300 cursor-pointer"
            onClick={() => navigate('/battle/quick')}
          >
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400/30 to-blue-600/30 flex items-center justify-center mr-4 backdrop-blur-sm border border-blue-400/20">
                <Swords size={20} className="text-blue-300" />
              </div>
              <div className="flex-1">
                <h4 className="font-smooth font-semibold text-white/90">빠른 매치</h4>
                <p className="text-sm text-white/70 font-smooth">비슷한 전력의 상대와 즉시 매칭</p>
              </div>
              <div className="text-xs text-white/50 font-smooth">~30초</div>
            </div>
          </div>

          <div
            className="group p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/30 hover:border-white/20 active:scale-[0.98] transition-all duration-300 cursor-pointer"
            onClick={() => navigate('/battle/ranked')}
          >
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400/30 to-purple-600/30 flex items-center justify-center mr-4 backdrop-blur-sm border border-purple-400/20">
                <Crown size={20} className="text-purple-300" />
              </div>
              <div className="flex-1">
                <h4 className="font-smooth font-semibold text-white/90">랭크 게임</h4>
                <p className="text-sm text-white/70 font-smooth">RP를 획득하고 등급을 올려보세요</p>
              </div>
              <div className="text-xs text-white/50 font-smooth">소요 ~10분</div>
            </div>
          </div>

          <div
            className="group p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/30 hover:border-white/20 active:scale-[0.98] transition-all duration-300 cursor-pointer"
            onClick={() => navigate('/battle/tournament')}
          >
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400/30 to-orange-600/30 flex items-center justify-center mr-4 backdrop-blur-sm border border-orange-400/20">
                <Trophy size={20} className="text-orange-300" />
              </div>
              <div className="flex-1">
                <h4 className="font-smooth font-semibold text-white/90">토너먼트</h4>
                <p className="text-sm text-white/70 font-smooth">정예 전사들과 경쟁하는 이벤트 모드</p>
              </div>
              <div className="text-xs text-white/50 font-smooth">64강 진행 중</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-smooth font-semibold text-white/90">최근 전투 기록</h3>
          <div className="space-y-3">
            {RECENT_BATTLES.map((battle) => (
              <div key={battle.opponent} className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400/30 to-purple-400/30 flex items-center justify-center border border-blue-400/20">
                      <Star size={18} className="text-blue-200" />
                    </div>
                    <div>
                      <div className="font-smooth font-semibold text-white/90">{battle.opponent}</div>
                      <div className="text-xs text-white/60 font-smooth">
                        {battle.rank} · {battle.timeAgo}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-smooth font-semibold ${
                    battle.result === 'victory' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {battle.result === 'victory' ? '승리' : '패배'}
                  </div>
                  <div className="text-xs text-white/60 font-smooth">{battle.score}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-smooth font-semibold text-white/90">이벤트 토너먼트</h3>
          <button className="flex items-center gap-2 text-sm text-white/60 font-smooth hover:text-white">
            모두 보기
            <Clock size={14} />
          </button>
        </div>
        <div className="space-y-4">
          {TOURNAMENTS.map((tournament) => (
            <div key={tournament.id} className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="text-3xl mr-3">{tournament.icon}</div>
                  <div>
                    <h3 className="font-smooth font-bold text-white/90">{tournament.name}</h3>
                    <p className="text-sm text-white/70 font-smooth">참여 조건: {tournament.rank}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-orange-400 font-smooth font-semibold">{tournament.reward}</div>
                  <div className="text-xs text-white/60 font-smooth">{tournament.timeLeft} 후 종료</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-white/60 font-smooth">
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {tournament.participants}명
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {tournament.timeLeft}
                  </span>
                </div>
                <button className="px-6 py-2 rounded-xl bg-orange-400/20 text-orange-300 font-smooth font-semibold hover:bg-orange-400/30 hover:text-orange-200 active:scale-95 transition-all duration-300">
                  참가하기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BattleLayout>
  );
}


