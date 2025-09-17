import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ThemeSelector } from '../../../../../ui/theme/ThemeSelector';

export function ThemeSettingsScreen() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/more/settings')}
          className="w-10 h-10 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center mr-4 hover:bg-black/30 active:scale-95 transition-all"
        >
          <ArrowLeft size={20} className="text-white/90" />
        </button>
        <h1 className="text-xl font-bold text-white/90 font-smooth">테마 설정</h1>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
          <h3 className="text-lg font-bold text-white/90 mb-4 font-smooth">보드 테마</h3>
          <ThemeSelector type="board" />
        </div>

        <div className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
          <h3 className="text-lg font-bold text-white/90 mb-4 font-smooth">돌 테마</h3>
          <ThemeSelector type="stone" />
        </div>
      </div>
    </div>
  );
}
