import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * The main application shell component.
 *
 * This component acts as the primary container for the entire application,
 * creating a fixed-width layout centered on the screen. It also includes
 * decorative "gutters" on the left and right on wider screens.
 *
 * @param {AppShellProps} props - The component props.
 * @returns {React.ReactElement} The rendered application shell.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <>
      {/* 데스크톱 좌우 배경 */}
      <div className="gutters" />

      {/* 390px 고정폭 앱 컨테이너 */}
      <div className="app-shell touch-manipulation">
        {children}
      </div>
    </>
  );
}