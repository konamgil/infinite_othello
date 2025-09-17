import React, { ReactNode } from 'react';
import { BattleStarCanvas } from '../../../ui/battle/BattleStarCanvas';

type BattleLayoutProps = {
  children: ReactNode;
  detail?: boolean;
};

export function BattleLayout({ children, detail = false }: BattleLayoutProps) {
  const rootClasses = detail
    ? 'min-h-screen w-full overflow-hidden relative flex flex-col'
    : 'h-full w-full overflow-hidden relative';

  const overlayClasses = detail
    ? 'relative z-10 flex-1 flex flex-col overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain'
    : 'relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain';

  const contentClasses = detail
    ? 'content-padding pt-12 pb-12 flex flex-col gap-8 min-h-[calc(100vh-6rem)]'
    : 'content-padding section-spacing pb-32';

  return (
    <div className={rootClasses}>
      <div className="absolute inset-0">
        <BattleStarCanvas className="w-full h-full" />
      </div>
      <div className={overlayClasses}>
        <div className={contentClasses}>{children}</div>
      </div>
    </div>
  );
}
