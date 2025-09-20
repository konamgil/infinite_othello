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
      <div className="flex flex-col gap-4 pb-8 flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400/20 to-purple-600/20 flex items-center justify-center border border-purple-400/30">
              <Brain size={18} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white/90">전략 학습</h2>
          </div>
          <button
            onClick={() => navigate('/stella')}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/15 hover:text-white/80 active:scale-95 transition-all duration-300"
          >
            돌아가기
          </button>
        </div>

        <div className="space-y-2">
          {STRATEGY_LESSONS.map((lesson) => {
            const style = DIFFICULTY_STYLES[lesson.difficulty] ?? DIFFICULTY_STYLES['초급'];

            return (
              <div key={lesson.id} className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-start gap-2.5">
                  <div className={`w-10 h-10 rounded-xl ${style.container} flex items-center justify-center flex-shrink-0`}>
                    {lesson.completed ? (
                      <CheckCircle size={16} className="text-green-400" />
                    ) : (
                      <Brain size={16} className={style.text} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white/90 text-sm truncate">{lesson.title}</h3>
                      <button className={`px-2.5 py-1 rounded-lg text-xs font-medium ml-2.5 flex-shrink-0 transition-all duration-300 active:scale-95 ${
                        lesson.completed
                          ? 'bg-white/10 text-white/70 hover:bg-white/15'
                          : 'bg-purple-400/20 text-purple-300 hover:bg-purple-400/30 border border-purple-400/30'
                      }`}>
                        {lesson.completed ? '복습' : '학습'}
                      </button>
                    </div>
                    <p className="text-xs text-white/60 mb-2 line-clamp-2">{lesson.description}</p>
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.container} ${style.text}`}>
                        {lesson.difficulty}
                      </span>
                      <span className="text-xs text-white/50">{lesson.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </StellaLayout>
  );
}