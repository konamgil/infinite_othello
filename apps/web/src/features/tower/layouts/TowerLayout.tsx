import React, { ReactNode } from 'react';
import { CosmicTowerCanvas } from '../../../ui/tower/CosmicTowerCanvas';

type TowerLayoutProps = {
  children: ReactNode;
  detail?: boolean;
};

/**
 * A layout component for the tower feature.
 *
 * This component provides a consistent layout for all pages within the tower feature.
 * It includes a cosmic tower canvas background (`CosmicTowerCanvas`) and can be adapted
 * for detail pages.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The content to be rendered within the layout.
 * @param {boolean} [props.detail=false] - If true, applies a layout variant for detail pages.
 * @returns {React.ReactElement} The rendered layout component.
 */
export function TowerLayout({ children, detail = false }: TowerLayoutProps) {
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
        <CosmicTowerCanvas className="w-full h-full" />
      </div>
      <div className={overlayClasses}>
        <div className={contentClasses}>{children}</div>
      </div>
    </div>
  );
}