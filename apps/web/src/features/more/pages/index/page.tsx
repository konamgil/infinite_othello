import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreStarCanvas } from '../../../../ui/more/MoreStarCanvas';
import { Palette, ShoppingBag, User, Settings, HelpCircle, Info, Clock } from 'lucide-react';

export default function MorePage() {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full overflow-hidden relative">
      {/* 설정 별빛 캔버스 배경 */}
      <div className="absolute inset-0">
        <MoreStarCanvas className="w-full h-full" />
      </div>

      {/* 오버레이 콘텐츠 */}
      <div className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain">
        <div className="px-3 py-4 pb-28 space-y-3">
        {/* 사용자 프로필 섹션 */}
        <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full flex items-center justify-center mr-3 border border-blue-400/30">
              <User size={20} className="text-blue-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-white/90">우주의 오델로 수호자</h3>
              <p className="text-sm text-white/70 font-display">Bronze III • 1,487 RP</p>
              <p className="text-xs text-white/60 font-display">탑 진행도: 1층</p>
            </div>
          </div>
        </div>

        {/* 메인 메뉴 */}
        <div className="space-y-2">
          {/* 시공간 아카이브 (리플레이) */}
          <button
            className="w-full p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                       hover:bg-black/30 active:scale-95 transition-all duration-200
                       flex items-center justify-between"
            onClick={() => navigate('/more/replay')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400/20 to-blue-500/20 rounded-xl
                            flex items-center justify-center border border-purple-400/30">
                <Clock size={16} className="text-purple-300" />
              </div>
              <span className="text-white/90 font-display font-medium">시공간 아카이브</span>
            </div>
            <span className="text-white/50 text-sm font-display">대국 기록</span>
          </button>

          {/* 테마 설정 */}
          <button
            className="w-full p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                       hover:bg-black/30 active:scale-95 transition-all duration-200
                       flex items-center justify-between"
            onClick={() => navigate('/more/settings/theme')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-xl
                            flex items-center justify-center border border-purple-400/30">
                <Palette size={16} className="text-purple-300" />
              </div>
              <span className="text-white/90 font-display font-medium">테마 설정</span>
            </div>
            <span className="text-white/50 text-sm font-display">보드 & 디스크</span>
          </button>

          {/* 환경설정 */}
          <button
            className="w-full p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                       hover:bg-black/30 active:scale-95 transition-all duration-200
                       flex items-center justify-between"
            onClick={() => navigate('/more/settings')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-400/20 to-slate-500/20 rounded-xl
                            flex items-center justify-center border border-slate-400/30">
                <Settings size={16} className="text-slate-300" />
              </div>
              <span className="text-white/90 font-display font-medium">환경 설정</span>
            </div>
            <span className="text-white/50 text-sm font-display">사운드 & 시스템</span>
          </button>

          {/* 도움말 */}
          <button className="w-full p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                           hover:bg-black/30 active:scale-95 transition-all duration-200
                           flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-xl
                          flex items-center justify-center border border-purple-400/30">
              <HelpCircle size={16} className="text-purple-300" />
            </div>
            <span className="text-white/90 font-display font-medium">도움말</span>
          </button>
        </div>

        {/* 빠른 설정 */}
        <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
          <h4 className="font-display font-medium text-white/90 mb-3">빠른 설정</h4>

          <div className="space-y-2">
            {/* 사운드 설정 */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
              <span className="text-white/90 font-display text-sm">사운드 효과</span>
              <div className="w-10 h-5 bg-orange-400/60 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
              </div>
            </div>

            {/* 애니메이션 설정 */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
              <span className="text-white/90 font-display text-sm">애니메이션</span>
              <div className="w-10 h-5 bg-orange-400/60 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
              </div>
            </div>

            {/* 진동 설정 */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
              <span className="text-white/90 font-display text-sm">진동</span>
              <div className="w-10 h-5 bg-white/20 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
