import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BattleLayout } from '../BattleLayout';
import { TOURNAMENTS } from '../constants';
import { Users, Clock, Trophy } from 'lucide-react';

export function BattleTournamentScreen() {
  const navigate = useNavigate();

  return (
    <BattleLayout detail>
      <div className="flex flex-col gap-8 pb-10 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400/30 to-orange-600/30 flex items-center justify-center backdrop-blur-sm border border-orange-400/20">
              <Trophy size={18} className="text-orange-300" />
            </div>
            <h2 className="text-2xl font-smooth font-bold text-white">토너먼트</h2>
          </div>
          <button
            onClick={() => navigate('/battle')}
            className="px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 text-white/80 font-smooth hover:bg-black/30 hover:border-white/20 hover:text-white active:scale-95 transition-all duration-300"
          >
            돌아가기
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
