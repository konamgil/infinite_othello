import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../../../store/gameStore';
import { BattleLayout } from '../../layouts/BattleLayout';
import { Swords, Crown } from 'lucide-react';

type MatchMode = 'quick' | 'ranked';

const MODE_CONTENT: Record<MatchMode, { title: string; badgeText: string; description: string; icon: React.ReactElement }> = {
  quick: {
    title: '빠른 매치',
    badgeText: '즉시 매칭',
    description: '비슷한 실력의 전사를 찾는 중입니다',
    icon: <Swords size={18} className="text-blue-300" />
  },
  ranked: {
    title: '랭크 게임',
    badgeText: 'RP 상승',
    description: '랭크 배치를 준비 중입니다',
    icon: <Crown size={18} className="text-purple-300" />
  }
};

interface BattleMatchScreenProps {
  mode: MatchMode;
}

export default function BattleMatchPage({ mode }: BattleMatchScreenProps) {
  const navigate = useNavigate();
  const player = useGameStore((state) => state.player);
  const content = MODE_CONTENT[mode];

  return (
    <BattleLayout detail>
      <div className="flex flex-col gap-8 pb-10 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-sm border ${
              mode === 'quick'
                ? 'bg-gradient-to-br from-blue-400/30 to-blue-600/30 border-blue-400/20'
                : 'bg-gradient-to-br from-purple-400/30 to-purple-600/30 border-purple-400/20'
            }`}>
              {content.icon}
            </div>
            <h2 className="text-2xl font-smooth font-bold text-white">{content.title}</h2>
          </div>
          <button
            onClick={() => navigate('/battle')}
            className="px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 text-white/80 font-smooth hover:bg-black/30 hover:border-white/20 hover:text-white active:scale-95 transition-all duration-300"
          >
            취소
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10 text-center">
          <div className="mb-8">
            <div className="w-16 h-16 border-4 border-orange-400/60 border-t-orange-400 rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-lg font-smooth font-bold text-white/90 mb-3">우주에서 상대를 찾는 중...</h3>
            <p className="text-white/70 font-smooth">{content.description}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-white/60 font-smooth">현재 등급</div>
                <div className="font-smooth font-semibold text-white/90">{player.rank}</div>
              </div>
              <div>
                <div className="text-white/60 font-smooth">예상 대기 시간</div>
                <div className="font-smooth font-semibold text-orange-400">~30초</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BattleLayout>
  );
}


