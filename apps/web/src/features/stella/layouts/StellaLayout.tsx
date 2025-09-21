import React, { ReactNode } from 'react';
import { StellaCanvas } from '../components/StellaCanvas';
import { useGameStore } from '../../../store/gameStore';
import { DAILY_MISSIONS } from '../constants';
import { StatsDisplay, type StatItem } from '../../../ui/stats';
import { Star, Target } from 'lucide-react';

type StellaLayoutProps = {
  children: ReactNode;
  detail?: boolean;
};

/**
 * A layout component for the Stella AI mentor feature.
 *
 * This component provides a consistent layout for all pages within the Stella feature.
 * It includes a star canvas background (`StellaCanvas`) and can be adapted for
 * detail pages, which have a slightly different structure.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The content to be rendered within the layout.
 * @param {boolean} [props.detail=false] - If true, applies a layout variant for detail pages.
 * @returns {React.ReactElement} The rendered layout component.
 */
export function StellaLayout({ children, detail = false }: StellaLayoutProps) {
  const player = useGameStore((state) => state.player);
  const completedMissions = DAILY_MISSIONS.filter(m => m.completed).length;
  const totalMissions = DAILY_MISSIONS.length;

  const rootClasses = detail
    ? 'min-h-screen w-full overflow-hidden relative flex flex-col'
    : 'h-full w-full overflow-hidden relative';

  const overlayClasses = detail
    ? 'relative z-10 flex-1 flex flex-col overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain'
    : 'relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain';

  const contentClasses = detail
    ? 'px-4 pt-12 pb-12 flex flex-col gap-8 min-h-[calc(100vh-6rem)]'
    : 'px-4 py-6 pb-32';

  // 상단 통계 데이터 구성
  const statsData: StatItem[] = [
    {
      key: 'missions',
      label: '미션',
      value: `${completedMissions}/${totalMissions}`,
      icon: Target,
      color: 'green'
    },
    {
      key: 'rp',
      label: 'RP',
      value: player.rp,
      icon: Star,
      color: 'yellow'
    }
  ];

  return (
    <div className={rootClasses}>
      <div className="absolute inset-0">
        <StellaCanvas className="w-full h-full" />
      </div>

      {/* Stats Display - 우측 상단 */}
      <StatsDisplay stats={statsData} />

      <div className={overlayClasses}>
        <div className={contentClasses}>{children}</div>
      </div>
    </div>
  );
}
