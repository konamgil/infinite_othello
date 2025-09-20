import React, { ReactNode } from 'react';
import { MoreStarCanvas } from '../../../ui/more/MoreStarCanvas';

type MoreLayoutProps = {
  children: ReactNode;
  detail?: boolean;
};

export function MoreLayout({ children, detail = false }: MoreLayoutProps) {
  const rootClasses = detail
    ? 'min-h-screen w-full overflow-hidden relative flex flex-col bg-black'
    : 'h-full w-full overflow-hidden relative bg-black';

  const overlayClasses = detail
    ? 'relative z-10 flex-1 flex flex-col overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain min-h-screen'
    : 'relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain';

  const contentClasses = detail
    ? 'px-4 pt-12 pb-12 flex flex-col gap-8 min-h-screen flex-1'
    : 'px-4 py-6 pb-32';

  return (
    <div className={rootClasses}>
      <div className="fixed inset-0 bg-black">
        <MoreStarCanvas className="w-full h-full" />
      </div>
      <div className={overlayClasses}>
        <div className={contentClasses}>{children}</div>
      </div>
    </div>
  );
}