import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StellaLayout } from '../../layouts/StellaLayout';
import { STELLA_WISDOMS } from '../../constants';
import { TypewriterText } from '../../../../ui/stella/TypewriterText';
import { Target, Brain, RotateCcw, ChevronRight } from 'lucide-react';

export default function StellaHome() {
  const navigate = useNavigate();
  return (
    <StellaLayout>
      <div>
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 flex items-center justify-center backdrop-blur-sm shrink-0 animate-pulse">
              <span className="text-2xl">✨</span>
            </div>
            <div className="flex-1 min-h-[3rem]">
              <h4 className="font-smooth font-medium text-blue-300 mb-3 text-sm">스텔라의 우주적 지혜</h4>
              <div className="text-white/85 font-smooth text-base leading-relaxed">
                <TypewriterText messages={STELLA_WISDOMS} typingSpeed={60} pauseDuration={5000} className="text-white/85" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
          <h3 className="font-smooth font-semibold text-white/90 mb-4 text-center">학습 진행도</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm">
              <div className="text-2xl font-smooth font-bold text-green-400">2/4</div>
              <div className="text-xs text-white/70 font-smooth mt-1">전략 강의</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm">
              <div className="text-2xl font-smooth font-bold text-blue-400">1/3</div>
              <div className="text-xs text-white/70 font-smooth mt-1">데일리 미션</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm">
              <div className="text-2xl font-smooth font-bold text-purple-400">3</div>
              <div className="text-xs text-white/70 font-smooth mt-1">연습 시나리오</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-display font-semibold text-white/90 tracking-wider">스텔라의 학습 메뉴</h3>

          <div className="group p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/30 hover:border-white/20 active:scale-[0.98] transition-all duration-300 cursor-pointer"
               onClick={() => navigate('/stella/missions')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400/30 to-green-600/30 flex items-center justify-center mr-4 backdrop-blur-sm border border-green-400/20">
                  <Target size={20} className="text-green-300" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-white/90 tracking-wider">데일리 미션</h3>
                  <p className="text-sm text-white/60 font-display tracking-wide">매일 새로운 도전에 도전하세요</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-green-400/20 text-green-300 text-xs font-display font-semibold tracking-wider">1/3</span>
                <ChevronRight size={16} className="text-white/40 group-hover:text-white/60 transition-colors" />
              </div>
            </div>
          </div>

          <div className="group p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/30 hover:border-white/20 active:scale-[0.98] transition-all duration-300 cursor-pointer"
               onClick={() => navigate('/stella/strategy')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400/30 to-purple-600/30 flex items-center justify-center mr-4 backdrop-blur-sm border border-purple-400/20">
                  <Brain size={20} className="text-purple-300" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-white/90 tracking-wider">전략 학습</h3>
                  <p className="text-sm text-white/60 font-display tracking-wide">스텔라가 직접 가이드하는 전략 강의</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-purple-400/20 text-purple-300 text-xs font-display font-semibold tracking-wider">2/4</span>
                <ChevronRight size={16} className="text-white/40 group-hover:text-white/60 transition-colors" />
              </div>
            </div>
          </div>

          <div className="group p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/30 hover:border-white/20 active:scale-[0.98] transition-all duration-300 cursor-pointer"
               onClick={() => navigate('/stella/practice')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400/30 to-orange-600/30 flex items-center justify-center mr-4 backdrop-blur-sm border border-orange-400/20">
                  <RotateCcw size={20} className="text-orange-300" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-white/90 tracking-wider">연습 시나리오</h3>
                  <p className="text-sm text-white/60 font-display tracking-wide">실전 감각을 키우는 다양한 상황 연습</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-white/40 group-hover:text-white/60 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </StellaLayout>
  );
}