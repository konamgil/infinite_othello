import React, { useState } from 'react';
import { Layout } from '../../ui/common/Layout';
import { ThemeSelector } from '../../ui/theme/ThemeSelector';
import { useGameStore } from '../../store/gameStore';
import { Palette, Volume2, VolumeX, Smartphone } from 'lucide-react';

type SettingsTab = 'theme' | 'audio' | 'display' | null;

export default function Settings() {
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
      <Layout title="테마 설정" showBackButton onBack={() => setActiveTab(null)}>
        <div className="content-padding section-spacing">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-tower-silver-200 mb-4">보드 테마</h3>
              <ThemeSelector type="board" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-tower-silver-200 mb-4">스톤 테마</h3>
              <ThemeSelector type="stone" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="설정" showBackButton>
      <div className="content-padding section-spacing">
        <div className="space-y-4">
          {/* 테마 설정 */}
          <div
            className="card-hover"
            onClick={() => setActiveTab('theme')}
          >
            <div className="flex items-center">
              <div className="bg-purple-500 p-3 rounded-lg mr-4">
                <Palette size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-tower-silver-200">테마 설정</h3>
                <p className="text-sm text-tower-silver-400">
                  보드와 스톤의 테마를 변경하세요
                </p>
              </div>
            </div>
          </div>

          {/* 사운드 설정 */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-500 p-3 rounded-lg mr-4">
                  {ui.soundEnabled ? (
                    <Volume2 size={24} className="text-white" />
                  ) : (
                    <VolumeX size={24} className="text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-tower-silver-200">사운드 효과</h3>
                  <p className="text-sm text-tower-silver-400">
                    게임 내 사운드 효과를 제어합니다
                  </p>
                </div>
              </div>
              <button
                onClick={toggleSound}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  ui.soundEnabled ? 'bg-tower-gold-400' : 'bg-tower-deep-200'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                    ui.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 애니메이션 설정 */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-500 p-3 rounded-lg mr-4">
                  <Smartphone size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-tower-silver-200">애니메이션</h3>
                  <p className="text-sm text-tower-silver-400">
                    돌 뒤집기 및 UI 애니메이션
                  </p>
                </div>
              </div>
              <button
                onClick={toggleAnimations}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  ui.animations ? 'bg-tower-gold-400' : 'bg-tower-deep-200'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                    ui.animations ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 글자 크기 설정 */}
          <div className="card">
            <div className="mb-4">
              <h3 className="font-semibold text-tower-silver-200 mb-2">글자 크기</h3>
              <p className="text-sm text-tower-silver-400">
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
                  className={`p-3 rounded-lg border transition-colors ${
                    ui.fontSize === option.id
                      ? 'bg-tower-gold-400 text-tower-deep-500 border-tower-gold-400'
                      : 'bg-tower-deep-200 text-tower-silver-300 border-tower-silver-500 hover:bg-tower-deep-100'
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
          <div className="card">
            <h3 className="font-semibold text-tower-silver-200 mb-4">게임 설정</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-tower-silver-300">자동 저장</span>
                <button className="w-12 h-6 bg-tower-gold-400 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-tower-silver-300">힌트 표시</span>
                <button className="w-12 h-6 bg-tower-gold-400 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-tower-silver-300">진동 피드백</span>
                <button className="w-12 h-6 bg-tower-deep-200 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* 리셋 버튼 */}
          <div className="card">
            <h3 className="font-semibold text-tower-silver-200 mb-2">초기화</h3>
            <p className="text-sm text-tower-silver-400 mb-4">
              모든 설정을 초기값으로 되돌립니다
            </p>
            <button className="btn-danger w-full">
              설정 초기화
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}