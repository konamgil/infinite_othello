import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../ui/common/Layout';
import { Palette, ShoppingBag, User, Settings, HelpCircle, Info } from 'lucide-react';

export default function More() {
  const navigate = useNavigate();

  return (
    <Layout title="더보기">
      <div className="h-full w-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain">
        <div className="content-padding section-spacing pb-32">
        {/* 사용자 프로필 섹션 */}
        <div className="card mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-r from-tower-gold-400 to-tower-gold-300 rounded-full flex items-center justify-center mr-4">
              <User size={32} className="text-tower-deep-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-tower-silver-200">오델로 나이트</h3>
              <p className="text-sm text-tower-silver-400">Bronze III • 1,487 RP</p>
              <p className="text-xs text-tower-silver-500">탑 진행도: 1층</p>
            </div>
          </div>
        </div>

        {/* 메뉴 섹션들 - 은은한 스타일 */}
        <div className="space-y-3">
          {/* 테마 및 커스터마이징 */}
          <button
            className="w-full bg-white/5 hover:bg-white/10 active:bg-white/15
                       backdrop-blur-sm border border-white/10
                       rounded-xl p-4 transition-all duration-200
                       flex items-center justify-between"
            onClick={() => navigate('/settings')}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-lg
                            flex items-center justify-center mr-3">
                <Palette size={16} className="text-yellow-400" />
              </div>
              <span className="text-white/90 font-medium">테마 설정</span>
            </div>
            <span className="text-white/50 text-sm">보드 & 스톤</span>
          </button>

          {/* 상점 */}
          <button className="w-full bg-white/5 hover:bg-white/10 active:bg-white/15
                           backdrop-blur-sm border border-white/10
                           rounded-xl p-4 transition-all duration-200
                           flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-lg
                            flex items-center justify-center mr-3">
                <ShoppingBag size={16} className="text-green-400" />
              </div>
              <span className="text-white/90 font-medium">상점</span>
            </div>
            <span className="bg-red-500/80 text-white text-xs px-2 py-1 rounded-full">
              SALE
            </span>
          </button>

          {/* 프로필 & 업적 */}
          <button className="w-full bg-white/5 hover:bg-white/10 active:bg-white/15
                           backdrop-blur-sm border border-white/10
                           rounded-xl p-4 transition-all duration-200
                           flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-lg
                            flex items-center justify-center mr-3">
                <User size={16} className="text-blue-400" />
              </div>
              <span className="text-white/90 font-medium">프로필 & 업적</span>
            </div>
            <span className="text-white/50 text-sm">12/50</span>
          </button>

          {/* 환경설정 */}
          <button className="w-full bg-white/5 hover:bg-white/10 active:bg-white/15
                           backdrop-blur-sm border border-white/10
                           rounded-xl p-4 transition-all duration-200
                           flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-400/20 to-gray-500/20 rounded-lg
                          flex items-center justify-center mr-3">
              <Settings size={16} className="text-gray-400" />
            </div>
            <span className="text-white/90 font-medium">환경설정</span>
          </button>

          {/* 도움말 */}
          <button className="w-full bg-white/5 hover:bg-white/10 active:bg-white/15
                           backdrop-blur-sm border border-white/10
                           rounded-xl p-4 transition-all duration-200
                           flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-lg
                          flex items-center justify-center mr-3">
              <HelpCircle size={16} className="text-purple-400" />
            </div>
            <span className="text-white/90 font-medium">도움말</span>
          </button>

          {/* 앱 정보 */}
          <button className="w-full bg-white/5 hover:bg-white/10 active:bg-white/15
                           backdrop-blur-sm border border-white/10
                           rounded-xl p-4 transition-all duration-200
                           flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-400/20 to-slate-500/20 rounded-lg
                            flex items-center justify-center mr-3">
                <Info size={16} className="text-gray-400" />
              </div>
              <span className="text-white/90 font-medium">앱 정보</span>
            </div>
            <span className="text-white/50 text-sm">v1.0.0</span>
          </button>
        </div>

        {/* 하단 설정 토글들 */}
        <div className="card mt-6">
          <h4 className="font-semibold text-tower-silver-200 mb-4">빠른 설정</h4>

          <div className="space-y-3">
            {/* 사운드 설정 */}
            <div className="flex items-center justify-between">
              <span className="text-tower-silver-300">사운드 효과</span>
              <div className="w-12 h-6 bg-tower-gold-400 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
              </div>
            </div>

            {/* 애니메이션 설정 */}
            <div className="flex items-center justify-between">
              <span className="text-tower-silver-300">애니메이션</span>
              <div className="w-12 h-6 bg-tower-gold-400 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
              </div>
            </div>

            {/* 진동 설정 */}
            <div className="flex items-center justify-between">
              <span className="text-tower-silver-300">진동</span>
              <div className="w-12 h-6 bg-tower-deep-200 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </Layout>
  );
}