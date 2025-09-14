import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
}

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