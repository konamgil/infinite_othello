import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StellaLayout } from '../StellaLayout';
import { PRACTICE_SCENARIOS } from '../constants';
import { RotateCcw } from 'lucide-react';

export function StellaPractice() {
  const navigate = useNavigate();

  return (
    <StellaLayout detail>
      <div className="flex flex-col gap-8 pb-10 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400/30 to-orange-600/30 flex items-center justify-center backdrop-blur-sm border border-orange-400/20">
              <RotateCcw size={18} className="text-orange-300" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white tracking-wider">연습 시나리오</h2>
          </div>
          <button
            onClick={() => navigate('/stella')}
            className="px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 text-white/80 font-display tracking-wider hover:bg-black/30 hover:border-white/20 hover:text-white active:scale-95 transition-all duration-300"
          >
            돌아가기
          </button>
        </div>

        <div className="space-y-4">
          {PRACTICE_SCENARIOS.map((scenario) => (
            <div key={scenario.id} className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/25 hover:border-white/15 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400/30 to-orange-600/30 flex items-center justify-center mr-4 backdrop-blur-sm border border-orange-400/20">
                    <RotateCcw size={20} className="text-orange-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-white/90 tracking-wider mb-1">{scenario.title}</h3>
                    <p className="text-sm text-white/60 font-display tracking-wide leading-relaxed mb-3">{scenario.description}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className={`px-3 py-1 rounded-full font-display font-semibold tracking-wider ${
                        scenario.difficulty === '초급'
                          ? 'bg-green-400/20 text-green-300'
                          : scenario.difficulty === '중급'
                            ? 'bg-blue-400/20 text-blue-300'
                            : 'bg-purple-400/20 text-purple-300'
                      }`}>
                        {scenario.difficulty}
                      </span>
                      <span className="text-white/50 font-display tracking-wider">
                        {scenario.plays.toLocaleString()}명이 연습했습니다
                      </span>
                    </div>
                  </div>
                </div>
                <button className="px-6 py-2 rounded-xl bg-orange-400/20 text-orange-300 font-display font-semibold tracking-wider hover:bg-orange-400/30 hover:text-orange-200 active:scale-95 transition-all duration-300">
                  연습하기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StellaLayout>
  );
}
