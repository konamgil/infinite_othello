import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StellaLayout } from '../../layouts/StellaLayout';
import { STELLA_WISDOMS, DAILY_MISSIONS, STRATEGY_LESSONS, PRACTICE_SCENARIOS } from '../../constants';
import { TypewriterText } from '../../../../ui/stella/TypewriterText';
import { haptic } from '../../../../ui/feedback/HapticFeedback';
import { Target, Brain, RotateCcw, ChevronRight, Sparkles, Calendar, CheckCircle, BookOpen, Swords, Star, Zap } from 'lucide-react';

export default function StellaHome() {
  const navigate = useNavigate();
  const [stellaTouched, setStellaTouched] = useState(false);
  const [wisdomIndex, setWisdomIndex] = useState(0);

  // 스텔라 터치 인터랙션 (숨겨진 이스터에그)
  const handleStellaTouch = () => {
    haptic.buttonTap();
    if (navigator.vibrate) {
      navigator.vibrate([20, 10, 20, 10, 30]); // 별빛 같은 부드러운 진동
    }
    setStellaTouched(true);
    setTimeout(() => setStellaTouched(false), 2000);
  };

  // 메뉴 네비게이션 햅틱
  const handleNavigation = (path: string, vibrationPattern: number[]) => {
    haptic.buttonTap();
    if (navigator.vibrate) {
      navigator.vibrate(vibrationPattern);
    }
    navigate(path);
  };

  return (
    <StellaLayout>
      <div className="space-y-6">
        {/* 스텔라의 우주적 지혜 */}
        <div className="p-5 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
          <div className="flex items-start gap-4">
            {/* 스텔라 아바타 */}
            <button
              onClick={handleStellaTouch}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400/20 to-blue-500/20
                       flex items-center justify-center shrink-0
                       hover:scale-105 active:scale-95 transition-all duration-200
                       border border-purple-400/30"
            >
              {stellaTouched && (
                <div className="absolute inset-0 rounded-full bg-purple-400/30 animate-ping" />
              )}
              <span className="text-2xl">✨</span>
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-purple-400" />
                <h4 className="font-display font-medium text-purple-300 text-sm">
                  스텔라의 우주적 지혜
                </h4>
              </div>

              <div className="h-16 flex items-center text-white/90 font-smooth text-sm leading-relaxed">
                <TypewriterText
                  messages={STELLA_WISDOMS}
                  typingSpeed={50}
                  pauseDuration={6000}
                  className="text-white/85"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 오늘의 미션 */}
        <div className="p-5 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-green-400" />
              <h3 className="font-display font-medium text-white/90">오늘의 미션</h3>
            </div>
            <div className="text-xs text-green-400/70 font-display">
              {DAILY_MISSIONS.filter(m => m.completed).length}/{DAILY_MISSIONS.length} 완료
            </div>
          </div>

          <div className="space-y-2">
            {DAILY_MISSIONS.slice(0, 3).map((mission) => (
              <button
                key={mission.id}
                onClick={() => handleNavigation('/stella/missions', [25, 15, 25])}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5
                         hover:bg-white/10 active:scale-95 transition-all duration-200"
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  mission.completed
                    ? 'bg-green-400/20 border border-green-400/60'
                    : mission.progress > 0
                      ? 'bg-yellow-400/20 border border-yellow-400/60'
                      : 'bg-white/10 border border-white/20'
                }`}>
                  {mission.completed ? (
                    <CheckCircle size={12} className="text-green-400" />
                  ) : mission.progress > 0 ? (
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                  ) : (
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-display text-white/90 truncate">
                    {mission.title}
                  </div>
                  {mission.completed && (
                    <div className="text-xs text-green-400 font-display">
                      완료!
                    </div>
                  )}
                </div>

                <div className="text-xs text-green-400/80 font-display font-medium">
                  {mission.rewards[0]?.value}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 스텔라의 학습 메뉴 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Star size={14} className="text-blue-400" />
            <h3 className="font-display font-medium text-white/90">스텔라의 학습 메뉴</h3>
          </div>

          {/* 전략 학습 */}
          <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                          hover:bg-black/30 active:scale-95 transition-all duration-200
                          cursor-pointer"
               onClick={() => handleNavigation('/stella/strategy', [30, 20, 30])}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400/20 to-purple-600/20
                              flex items-center justify-center border border-purple-400/30">
                  <Brain size={18} className="text-purple-400" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-white/90">전략 학습</h4>
                  <p className="text-xs text-white/60 font-display">스텔라가 직접 가이드하는 전략 강의</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-purple-400/20 border border-purple-400/30">
                <span className="text-purple-300 text-xs font-display font-semibold">
                  {STRATEGY_LESSONS.filter(l => l.completed).length}/{STRATEGY_LESSONS.length}
                </span>
              </div>
            </div>
          </div>

          {/* 연습 시나리오 */}
          <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                          hover:bg-black/30 active:scale-95 transition-all duration-200
                          cursor-pointer"
               onClick={() => handleNavigation('/stella/practice', [20, 15, 25])}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400/20 to-orange-600/20
                              flex items-center justify-center border border-orange-400/30">
                  <RotateCcw size={18} className="text-orange-400" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-white/90">연습 시나리오</h4>
                  <p className="text-xs text-white/60 font-display">실전 감각을 키우는 다양한 상황 연습</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-orange-400/20 border border-orange-400/30">
                <span className="text-orange-300 text-xs font-display font-semibold">
                  {PRACTICE_SCENARIOS.length}개
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StellaLayout>
  );
}