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
        <div className="content-padding section-spacing pb-32">
        {/* 사용자 프로필 섹션 - 신비로운 디자인 */}
        <div className="mb-6 p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full flex items-center justify-center mr-4 backdrop-blur-sm border border-blue-400/20">
              <User size={32} className="text-blue-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-smooth font-bold text-white/90">우주의 오델로 수호자</h3>
              <p className="text-sm text-white/70 font-smooth">Bronze III • 1,487 RP</p>
              <p className="text-xs text-white/60 font-smooth">탑 진행도: 1층</p>
            </div>
          </div>
        </div>

        {/* 마이스타이컴 메뉴들 */}
        <div className="space-y-4">
          {/* 시공간 아카이브 (리플레이) */}
          <button
            className="group w-full p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                       hover:bg-black/30 hover:border-white/20 active:scale-[0.99]
                       transition-all duration-300 flex items-center justify-between"
            onClick={() => navigate('/more/replay')}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400/30 to-blue-500/30 rounded-xl
                            flex items-center justify-center mr-4 backdrop-blur-sm border border-purple-400/20">
                <Clock size={18} className="text-purple-300" />
              </div>
              <span className="text-white/90 font-smooth font-medium">시공간 아카이브</span>
            </div>
            <span className="text-white/50 text-sm font-smooth">대국 기록</span>
          </button>

          {/* 테마 및 커스터마이징 */}
          <button
            className="group w-full p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                       hover:bg-black/30 hover:border-white/20 active:scale-[0.99]
                       transition-all duration-300 flex items-center justify-between"
            onClick={() => navigate('/more/settings')}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-xl
                            flex items-center justify-center mr-4 backdrop-blur-sm border border-yellow-400/20">
                <Palette size={18} className="text-yellow-300" />
              </div>
              <span className="text-white/90 font-smooth font-medium">테마 설정</span>
            </div>
            <span className="text-white/50 text-sm font-smooth">보드 & 스톤</span>
          </button>

          {/* 상점 */}
          <button className="group w-full p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                           hover:bg-black/30 hover:border-white/20 active:scale-[0.99]
                           transition-all duration-300 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400/30 to-emerald-500/30 rounded-xl
                            flex items-center justify-center mr-4 backdrop-blur-sm border border-green-400/20">
                <ShoppingBag size={18} className="text-green-300" />
              </div>
              <span className="text-white/90 font-smooth font-medium">우주 상점</span>
            </div>
            <span className="bg-red-400/20 text-red-300 text-xs px-3 py-1 rounded-full font-smooth font-medium border border-red-400/20">
              SALE
            </span>
          </button>

          {/* 프로필 & 업적 */}
          <button className="group w-full p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                           hover:bg-black/30 hover:border-white/20 active:scale-[0.99]
                           transition-all duration-300 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-xl
                            flex items-center justify-center mr-4 backdrop-blur-sm border border-blue-400/20">
                <User size={18} className="text-blue-300" />
              </div>
              <span className="text-white/90 font-smooth font-medium">전사 기록 & 업적</span>
            </div>
            <span className="text-white/50 text-sm font-smooth">12/50</span>
          </button>

          {/* 환경설정 */}
          <button className="group w-full p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                           hover:bg-black/30 hover:border-white/20 active:scale-[0.99]
                           transition-all duration-300 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-400/30 to-slate-500/30 rounded-xl
                          flex items-center justify-center mr-4 backdrop-blur-sm border border-slate-400/20">
              <Settings size={18} className="text-slate-300" />
            </div>
            <span className="text-white/90 font-smooth font-medium">우주선 설정</span>
          </button>

          {/* 도움말 */}
          <button className="group w-full p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                           hover:bg-black/30 hover:border-white/20 active:scale-[0.99]
                           transition-all duration-300 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400/30 to-pink-500/30 rounded-xl
                          flex items-center justify-center mr-4 backdrop-blur-sm border border-purple-400/20">
              <HelpCircle size={18} className="text-purple-300" />
            </div>
            <span className="text-white/90 font-smooth font-medium">우주 가이드</span>
          </button>

          {/* 앱 정보 */}
          <button className="group w-full p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                           hover:bg-black/30 hover:border-white/20 active:scale-[0.99]
                           transition-all duration-300 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-400/30 to-slate-500/30 rounded-xl
                            flex items-center justify-center mr-4 backdrop-blur-sm border border-gray-400/20">
                <Info size={18} className="text-gray-300" />
              </div>
              <span className="text-white/90 font-smooth font-medium">우주선 정보</span>
            </div>
            <span className="text-white/50 text-sm font-smooth">v1.0.0</span>
          </button>
        </div>

        {/* 하단 설정 토글들 */}
        <div className="mt-6 p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
          <h4 className="font-smooth font-semibold text-white/90 mb-4">빠른 설정</h4>

          <div className="space-y-4">
            {/* 사운드 설정 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 backdrop-blur-sm">
              <span className="text-white/90 font-smooth">사운드 효과</span>
              <div className="w-12 h-6 bg-orange-400/60 rounded-full relative cursor-pointer transition-colors">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform shadow-sm"></div>
              </div>
            </div>

            {/* 애니메이션 설정 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 backdrop-blur-sm">
              <span className="text-white/90 font-smooth">애니메이션</span>
              <div className="w-12 h-6 bg-orange-400/60 rounded-full relative cursor-pointer transition-colors">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform shadow-sm"></div>
              </div>
            </div>

            {/* 진동 설정 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 backdrop-blur-sm">
              <span className="text-white/90 font-smooth">진동</span>
              <div className="w-12 h-6 bg-white/20 rounded-full relative cursor-pointer transition-colors">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
