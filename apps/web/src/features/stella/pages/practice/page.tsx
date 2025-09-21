import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StellaLayout } from '../../layouts/StellaLayout';
import { PRACTICE_SCENARIOS } from '../../constants';
import { RotateCcw } from 'lucide-react';

/**
 * The practice scenarios page.
 *
 * This component displays a list of available practice scenarios that allow
 * users to hone their skills in specific game situations. Each scenario shows
 * its title, description, difficulty, and how many times it has been played.
 *
 * @returns {React.ReactElement} The rendered practice scenarios page.
 */
export default function StellaPractice() {
  const navigate = useNavigate();

  return (
    <StellaLayout detail>
      <div className="flex flex-col gap-4 pb-8 flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400/20 to-orange-600/20 flex items-center justify-center border border-orange-400/30">
              <RotateCcw size={18} className="text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white/90">연습 시나리오</h2>
          </div>
          <button
            onClick={() => navigate('/stella')}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/15 hover:text-white/80 active:scale-95 transition-all duration-300"
          >
            돌아가기
          </button>
        </div>

        <div className="space-y-2">
          {PRACTICE_SCENARIOS.map((scenario) => (
            <div key={scenario.id} className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400/20 to-orange-600/20 flex items-center justify-center flex-shrink-0 border border-orange-400/30">
                  <RotateCcw size={16} className="text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white/90 text-sm truncate">{scenario.title}</h3>
                    <button className="px-2.5 py-1 rounded-lg text-xs font-medium ml-2.5 flex-shrink-0 bg-orange-400/20 text-orange-400 hover:bg-orange-400/30 border border-orange-400/30 transition-all duration-300 active:scale-95">
                      연습
                    </button>
                  </div>
                  <p className="text-xs text-white/60 mb-2 line-clamp-2">{scenario.description}</p>
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      scenario.difficulty === '초급'
                        ? 'bg-green-400/20 text-green-400 border border-green-400/30'
                        : scenario.difficulty === '중급'
                          ? 'bg-blue-400/20 text-blue-400 border border-blue-400/30'
                          : 'bg-purple-400/20 text-purple-400 border border-purple-400/30'
                    }`}>
                      {scenario.difficulty}
                    </span>
                    <span className="text-xs text-white/50">
                      {scenario.plays.toLocaleString()}명 연습
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StellaLayout>
  );
}