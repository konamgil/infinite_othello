import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsStarCanvas } from '../../ui/settings/SettingsStarCanvas';
import { ThemeSelector } from '../../ui/theme/ThemeSelector';
import { useGameStore } from '../../store/gameStore';
import { Palette, Volume2, VolumeX, Smartphone, ArrowLeft, RotateCcw } from 'lucide-react';

type SettingsTab = 'theme' | 'audio' | 'display' | null;

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>(null);
  const { ui, updateUISettings } = useGameStore();

  const toggleSound = () => {
    updateUISettings({ soundEnabled: !ui.soundEnabled });
  };

  const toggleAnimations = () => {
    updateUISettings({ animations: !ui.animations });
  };

  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    updateUISettings({ fontSize: size });
  };

  if (activeTab === 'theme') {
    return (
      <div className="h-full w-full overflow-hidden relative">
        {/* 테마 설정 별빛 캔버스 배경 */}
        <div className="absolute inset-0">
          <SettingsStarCanvas className="w-full h-full" />
        </div>

        {/* 오버레이 콘텐츠 */}
        <div className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain">
          <div className="content-padding section-spacing pb-32">
            {/* 헤더 */}
            <div className="flex items-center mb-6">
              <button
                onClick={() => setActiveTab(null)}
                className="w-10 h-10 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl
                         flex items-center justify-center mr-4 hover:bg-black/30 active:scale-95 transition-all"
              >
                <ArrowLeft size={20} className="text-white/90" />
              </button>
              <h1 className="text-xl font-bold text-white/90 font-smooth">테마 설정</h1>
            </div>

            <div className="space-y-6">
              {/* 보드 테마 섹션 */}
              <div className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
                <h3 className="text-lg font-bold text-white/90 mb-4 font-smooth">보드 테마</h3>
                <ThemeSelector type="board" />
              </div>

              {/* 스톤 테마 섹션 */}
              <div className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
                <h3 className="text-lg font-bold text-white/90 mb-4 font-smooth">스톤 테마</h3>
                <ThemeSelector type="stone" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden relative">
      {/* 설정 별빛 캔버스 배경 */}
      <div className="absolute inset-0">
        <SettingsStarCanvas className="w-full h-full" />
      </div>

      {/* 오버레이 콘텐츠 */}
      <div className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain">
        <div className="content-padding section-spacing pb-32">
          {/* 헤더 */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/more')}
              className="w-10 h-10 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl
                       flex items-center justify-center mr-4 hover:bg-black/30 active:scale-95 transition-all"
            >
              <ArrowLeft size={20} className="text-white/90" />
            </button>
            <h1 className="text-xl font-bold text-white/90 font-smooth">우주선 설정</h1>
          </div>

          <div className="space-y-4">
            {/* 테마 설정 */}
            <button
              className="group w-full p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10
                         hover:bg-black/30 hover:border-white/20 active:scale-[0.99]
                         transition-all duration-300 flex items-center justify-between"
              onClick={() => setActiveTab('theme')}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400/30 to-pink-500/30 rounded-xl
                              flex items-center justify-center mr-4 backdrop-blur-sm border border-purple-400/20">
                  <Palette size={18} className="text-purple-300" />
                </div>
                <div className="text-left">
                  <span className="text-white/90 font-smooth font-medium block">테마 설정</span>
                  <span className="text-white/60 text-sm font-smooth">보드와 스톤의 테마를 변경하세요</span>
                </div>
              </div>
            </button>

            {/* 사운드 설정 */}
            <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400/30 to-emerald-500/30 rounded-xl
                                flex items-center justify-center mr-4 backdrop-blur-sm border border-green-400/20">
                    {ui.soundEnabled ? (
                      <Volume2 size={18} className="text-green-300" />
                    ) : (
                      <VolumeX size={18} className="text-green-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-white/90 font-smooth">사운드 효과</h3>
                    <p className="text-sm text-white/60 font-smooth">
                      게임 내 사운드 효과를 제어합니다
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleSound}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    ui.soundEnabled ? 'bg-orange-400/60' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${
                      ui.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 애니메이션 설정 */}
            <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400/30 to-cyan-500/30 rounded-xl
                                flex items-center justify-center mr-4 backdrop-blur-sm border border-blue-400/20">
                    <Smartphone size={18} className="text-blue-300" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white/90 font-smooth">애니메이션</h3>
                    <p className="text-sm text-white/60 font-smooth">
                      돌 뒤집기 및 UI 애니메이션
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleAnimations}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    ui.animations ? 'bg-orange-400/60' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${
                      ui.animations ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 글자 크기 설정 */}
            <div className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
              <div className="mb-4">
                <h3 className="font-medium text-white/90 mb-2 font-smooth">글자 크기</h3>
                <p className="text-sm text-white/60 font-smooth">
                  앱 전체의 글자 크기를 조절합니다
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'small', label: '작게', size: 'text-sm' },
                  { id: 'medium', label: '기본', size: 'text-base' },
                  { id: 'large', label: '크게', size: 'text-lg' }
                ].map(option => (
                  <button
                    key={option.id}
                    onClick={() => setFontSize(option.id as any)}
                    className={`p-3 rounded-xl border transition-colors font-smooth ${
                      ui.fontSize === option.id
                        ? 'bg-orange-400/60 text-white border-orange-400/60'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className={option.size}>
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 게임 설정 */}
            <div className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
              <h3 className="font-medium text-white/90 mb-4 font-smooth">게임 설정</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <span className="text-white/90 font-smooth">자동 저장</span>
                  <button className="w-12 h-6 bg-orange-400/60 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform shadow-sm" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <span className="text-white/90 font-smooth">힌트 표시</span>
                  <button className="w-12 h-6 bg-orange-400/60 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform shadow-sm" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <span className="text-white/90 font-smooth">진동 피드백</span>
                  <button className="w-12 h-6 bg-white/20 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform shadow-sm" />
                  </button>
                </div>
              </div>
            </div>

            {/* 리셋 버튼 */}
            <div className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-400/30 to-red-500/30 rounded-xl
                              flex items-center justify-center mr-4 backdrop-blur-sm border border-red-400/20">
                  <RotateCcw size={18} className="text-red-300" />
                </div>
                <div>
                  <h3 className="font-medium text-white/90 font-smooth">설정 초기화</h3>
                  <p className="text-sm text-white/60 font-smooth">
                    모든 설정을 초기값으로 되돌립니다
                  </p>
                </div>
              </div>
              <button className="w-full p-3 rounded-xl bg-red-500/20 border border-red-400/30
                               text-red-300 font-smooth font-medium hover:bg-red-500/30
                               active:scale-[0.99] transition-all">
                설정 초기화
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}