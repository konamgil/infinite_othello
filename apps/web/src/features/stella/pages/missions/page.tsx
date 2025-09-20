import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StellaLayout } from '../../layouts/StellaLayout';
import { DAILY_MISSIONS } from '../../constants';
import { Target, CheckCircle } from 'lucide-react';

export default function StellaMissions() {
  const navigate = useNavigate();

  return (
    <StellaLayout detail>
      <div className="flex flex-col gap-6 pb-10 flex-1">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400/30 to-green-600/30 flex items-center justify-center backdrop-blur-sm border border-green-400/20">
              <Target size={18} className="text-green-300" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white tracking-wider">데일리 미션</h2>
          </div>
          <button
            onClick={() => navigate('/stella')}
            className="px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 text-white/80 font-display tracking-wider hover:bg-black/30 hover:border-white/20 hover:text-white active:scale-95 transition-all duration-300"
          >
            돌아가기
          </button>
        </div>

        <div className="space-y-3">
          {DAILY_MISSIONS.map((mission) => (
            <div key={mission.id} className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/25 hover:border-white/15 transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 backdrop-blur-sm ${
                    mission.completed ? 'bg-green-400/20 border border-green-400/30' : 'bg-white/10 border border-white/20'
                  }`}>
                    {mission.completed ? (
                      <CheckCircle size={18} className="text-green-300" />
                    ) : (
                      <span className="text-sm font-display font-bold text-white/70">{mission.id}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-white/90 tracking-wider mb-1">{mission.title}</h3>
                    <p className="text-sm text-white/60 font-display tracking-wide leading-relaxed">{mission.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {mission.rewards.map((reward, index) => (
                    <div key={index} className={`px-3 py-1 rounded-full text-xs font-display font-semibold tracking-wider whitespace-nowrap ${
                      reward.type === 'rp' ? 'bg-green-400/20 text-green-300' : 'bg-purple-400/20 text-purple-300 border border-purple-400/30'
                    }`}>
                      {reward.value}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(mission.progress / mission.maxProgress) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-white/50 font-display tracking-wider mt-2">
                    {mission.progress} / {mission.maxProgress} 완료
                  </div>
                </div>
                {mission.completed ? (
                  <span className="text-green-300 text-sm font-display font-semibold tracking-wider">모든 보상 획득!</span>
                ) : (
                  <button className="px-4 py-1.5 rounded-xl bg-green-400/20 text-green-300 font-display font-semibold tracking-wider hover:bg-green-400/30 hover:text-green-200 active:scale-95 transition-all duration-300">
                    진행하기
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </StellaLayout>
  );
}