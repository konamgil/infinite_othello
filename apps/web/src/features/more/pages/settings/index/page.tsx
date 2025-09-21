import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Volume2, VolumeX, Smartphone, ArrowLeft, RotateCcw } from 'lucide-react';
import { useGameStore } from '../../../../../store/gameStore';
import { MoreLayout } from '../../../layouts/MoreLayout';

/**
 * The main settings page of the application.
 *
 * This component provides a user interface for configuring various application-wide settings.
 * Users can toggle sound and animations, adjust the font size, and manage other game-related preferences.
 * The settings are persisted using the `useGameStore`.
 *
 * @returns {React.ReactElement} The rendered settings page.
 */
export default function SettingsPage() {
  const navigate = useNavigate();
  const { ui, updateUISettings } = useGameStore();

  /** Toggles the sound effects on or off. */
  const toggleSound = () => {
    updateUISettings({ soundEnabled: !ui.soundEnabled });
  };

  /** Toggles UI animations on or off. */
  const toggleAnimations = () => {
    updateUISettings({ animations: !ui.animations });
  };

  /**
   * Sets the global font size for the application UI.
   * @param {'small' | 'medium' | 'large'} size - The desired font size.
   */
  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    updateUISettings({ fontSize: size });
  };

  return (
    <MoreLayout detail>
      <div className="flex items-center mb-4 -mx-4 px-4">
        <button
          onClick={() => navigate('/more')}
          className="w-10 h-10 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center mr-4 hover:bg-black/30 active:scale-95 transition-all"
        >
          <ArrowLeft size={20} className="text-white/90" />
        </button>
        <h1 className="text-xl font-bold text-white/90 font-smooth">환경 설정</h1>
      </div>

      <div className="space-y-3">

        <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400/30 to-emerald-500/30 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm border border-green-400/20">
                {ui.soundEnabled ? (
                  <Volume2 size={18} className="text-green-300" />
                ) : (
                  <VolumeX size={18} className="text-green-300" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-white/90 font-smooth">사운드 효과</h3>
                <p className="text-sm text-white/60 font-smooth">버튼과 UI 사운드를 켜거나 끕니다</p>
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

        <div className="p-3 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400/30 to-cyan-500/30 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm border border-blue-400/20">
                <Smartphone size={18} className="text-blue-300" />
              </div>
              <div>
                <h3 className="font-medium text-white/90 font-smooth">애니메이션</h3>
                <p className="text-sm text-white/60 font-smooth">동적인 UI 애니메이션을 제어합니다</p>
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

        <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
          <div className="mb-3">
            <h3 className="font-medium text-white/90 mb-2 font-smooth">글자 크기</h3>
            <p className="text-sm text-white/60 font-smooth">전체 UI의 글자 크기를 변경합니다</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'small', label: '작게', size: 'text-sm' },
              { id: 'medium', label: '기본', size: 'text-base' },
              { id: 'large', label: '크게', size: 'text-lg' }
            ].map(option => (
              <button
                key={option.id}
                onClick={() => setFontSize(option.id as any)}
                className={`p-2.5 rounded-xl border transition-colors font-smooth ${
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

        <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
          <h3 className="font-medium text-white/90 mb-3 font-smooth">게임 설정</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
              <span className="text-white/90 font-smooth">자동 패스</span>
              <button className="w-12 h-6 bg-orange-400/60 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform shadow-sm" />
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
              <span className="text-white/90 font-smooth">힌트 표시</span>
              <button className="w-12 h-6 bg-orange-400/60 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform shadow-sm" />
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5">
              <span className="text-white/90 font-smooth">진동 모드</span>
              <button className="w-12 h-6 bg-white/20 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform shadow-sm" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-400/30 to-red-500/30 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm border border-red-400/20">
              <RotateCcw size={18} className="text-red-300" />
            </div>
            <div>
              <h3 className="font-medium text-white/90 font-smooth">설정 초기화</h3>
              <p className="text-sm text-white/60 font-smooth">모든 설정을 기본값으로 되돌립니다</p>
            </div>
          </div>
          <button className="w-full p-2.5 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 font-smooth font-medium hover:bg-red-500/30 active:scale-[0.99] transition-all">
            설정 초기화
          </button>
        </div>
      </div>
    </MoreLayout>
  );
}