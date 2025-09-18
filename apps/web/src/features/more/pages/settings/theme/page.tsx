import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Palette, Sparkles } from 'lucide-react';
import { ThemeSelector } from '../../../../../ui/theme/ThemeSelector';
import { MoreLayout } from '../../../layouts/MoreLayout';

export default function ThemeSettingsPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = React.useState<'board' | 'stone'>('board');

  return (
    <MoreLayout detail>
      {/* 세련된 헤더 */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 rounded-2xl blur-xl animate-pulse" />
        <div className="relative flex items-center p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
          <button
            onClick={() => navigate('/more/settings')}
            className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center mr-4 active:scale-90 transition-all duration-200 group"
          >
            <ArrowLeft size={20} className="text-white/90 group-active:text-white transition-colors" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-xl flex items-center justify-center backdrop-blur-sm border border-purple-400/20">
              <Palette size={20} className="text-purple-300 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white/90 font-smooth">테마 설정</h1>
              <p className="text-xs text-white/50 font-smooth">게임 보드와 디스크를 꾸며보세요</p>
            </div>
          </div>
          <div className="ml-auto">
            <Sparkles size={16} className="text-yellow-400/60 animate-spin" style={{animationDuration: '3s'}} />
          </div>
        </div>
      </div>

      {/* 세련된 탭 + 테마 리스트 */}
      <div className="bg-gradient-to-br from-black/20 via-black/15 to-black/10 backdrop-blur-md rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0 border border-white/10 shadow-2xl">
        {/* 슬라이더 스타일 탭 */}
        <div className="relative p-2 flex-shrink-0">
          <div className="relative flex bg-black/20 rounded-xl p-1">
            <div
              className={`absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-lg transition-all duration-300 ease-out border border-purple-400/20 shadow-lg ${
                activeTab === 'board' ? 'left-1' : 'left-1/2'
              }`}
            />
            <button
              onClick={() => setActiveTab('board')}
              className={`relative flex-1 py-3 px-4 font-medium transition-all duration-300 rounded-lg active:scale-95 flex items-center justify-center gap-2 ${
                activeTab === 'board'
                  ? 'text-white/90 z-10'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <span className={`transition-transform duration-300 ${
                activeTab === 'board' ? 'scale-110' : 'scale-100'
              }`}>🎲</span>
              <span>보드 테마</span>
            </button>
            <button
              onClick={() => setActiveTab('stone')}
              className={`relative flex-1 py-3 px-4 font-medium transition-all duration-300 rounded-lg active:scale-95 flex items-center justify-center gap-2 ${
                activeTab === 'stone'
                  ? 'text-white/90 z-10'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <span className={`transition-transform duration-300 ${
                activeTab === 'stone' ? 'scale-110' : 'scale-100'
              }`}>⚫</span>
              <span>디스크 테마</span>
            </button>
          </div>
        </div>

        {/* 애니메이션이 있는 테마 리스트 */}
        <div className="px-4 pb-4 flex-1 min-h-0 relative overflow-hidden">
          <div
            key={activeTab}
            className="animate-in fade-in-0 slide-in-from-right-4 duration-500 ease-out"
          >
            <ThemeSelector type={activeTab} />
          </div>
        </div>
      </div>
    </MoreLayout>
  );
}