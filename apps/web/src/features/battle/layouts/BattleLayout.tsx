import React, { ReactNode } from 'react';
import { BattleStarCanvas } from '../../../ui/battle/BattleStarCanvas';
import { useGameStore } from '../../../store/gameStore';
import { Star, Crown } from 'lucide-react';

type BattleLayoutProps = {
  children: ReactNode;
  detail?: boolean;
};

export function BattleLayout({ children, detail = false }: BattleLayoutProps) {
  const player = useGameStore((state) => state.player);

  const rootClasses = detail
    ? 'min-h-screen w-full overflow-hidden relative flex flex-col'
    : 'h-full w-full overflow-hidden relative';

  const overlayClasses = detail
    ? 'relative z-10 flex-1 flex flex-col overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain'
    : 'relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain';

  const contentClasses = detail
    ? 'px-4 pt-12 pb-12 flex flex-col gap-8 min-h-[calc(100vh-6rem)]'
    : 'px-4 py-6 pb-32';

  return (
    <div className={rootClasses}>
      <div className="absolute inset-0">
        <BattleStarCanvas className="w-full h-full" />
      </div>

      {/* Stats Display - 우측 상단 */}
      <div className="absolute top-6 right-4 z-20 flex items-center gap-2">
        {/* Rank Display */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md border border-blue-400/20 rounded-full">
          <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
            <Crown size={6} className="text-white" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-white/70 font-display text-[10px]">랭크</span>
            <span className="text-blue-400 font-display font-medium text-xs tracking-wide">
              {player.rank}
            </span>
          </div>
        </div>

        {/* RP Display */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md border border-yellow-400/20 rounded-full">
          <div className="w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Star size={6} className="text-white" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-white/70 font-display text-[10px]">RP</span>
            <span className="text-yellow-400 font-display font-medium text-xs tracking-wide">
              {player.rp.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className={overlayClasses}>
        <div className={contentClasses}>{children}</div>
      </div>
    </div>
  );
}
