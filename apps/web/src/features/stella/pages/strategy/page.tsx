import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StellaLayout } from '../../layouts/StellaLayout';
import { STRATEGY_LESSONS } from '../../constants';
import { Brain, CheckCircle } from 'lucide-react';

const DIFFICULTY_STYLES: Record<string, { container: string; text: string }> = {
  초급: {
    container: 'bg-gradient-to-br from-green-400/30 to-green-600/30 border border-green-400/20',
    text: 'text-green-300'
  },
  중급: {
    container: 'bg-gradient-to-br from-blue-400/30 to-blue-600/30 border border-blue-400/20',
    text: 'text-blue-300'
  },
  고급: {
    container: 'bg-gradient-to-br from-purple-400/30 to-purple-600/30 border border-purple-400/20',
    text: 'text-purple-300'
  },
  마스터: {
    container: 'bg-gradient-to-br from-red-400/30 to-red-600/30 border border-red-400/20',
    text: 'text-red-300'
  }
};

export default function StellaStrategy() {
  const navigate = useNavigate();

  return (
    <StellaLayout detail>
      <div className="flex flex-col gap-8 pb-10 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400/30 to-purple-600/30 flex items-center justify-center backdrop-blur-sm border border-purple-400/20">
              <Brain size={18} className="text-purple-300" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white tracking-wider">전략 학습</h2>
          </div>
          <button
            onClick={() => navigate('/stella')}
            className="px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 text-white/80 font-display tracking-wider hover:bg-black/30 hover:border-white/20 hover:text-white active:scale-95 transition-all duration-300"
          >
            돌아가기
          </button>
        </div>

        <div className="space-y-4">
          {STRATEGY_LESSONS.map((lesson) => {
            const style = DIFFICULTY_STYLES[lesson.difficulty] ?? DIFFICULTY_STYLES['초급'];

            return (
              <div key={lesson.id} className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/25 hover:border-white/15 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${style.container} flex items-center justify-center backdrop-blur-sm`}>
                      {lesson.completed ? (
                        <CheckCircle size={20} className="text-green-300" />
                      ) : (
                        <Brain size={20} className={style.text} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-white/90 tracking-wider mb-1">{lesson.title}</h3>
                      <p className="text-sm text-white/60 font-display tracking-wide leading-relaxed mb-3">{lesson.description}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="px-3 py-1 rounded-full font-display font-semibold tracking-wider bg-white/10 text-white/70">
                          {lesson.difficulty}
                        </span>
                        <span className="text-white/50 font-display tracking-wider">{lesson.duration}</span>
                      </div>
                    </div>
                  </div>
                  <button className={`px-6 py-2 rounded-xl font-display font-semibold tracking-wider active:scale-95 transition-all duration-300 ${
                    lesson.completed ? 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white/80' : 'bg-purple-400/20 text-purple-300 hover:bg-purple-400/30 hover:text-purple-200'
                  }`}>
                    {lesson.completed ? '복습하기' : '학습하기'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </StellaLayout>
  );
}