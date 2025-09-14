import React from 'react';
import { Header } from './Header';

interface LayoutProps {
  title: string;
  showBackButton?: boolean;
  showSettings?: boolean;
  onBack?: () => void;
  onSettings?: () => void;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}

export function Layout({
  title,
  showBackButton,
  showSettings,
  onBack,
  onSettings,
  rightAction,
  children
}: LayoutProps) {
  return (
    <div className="flex flex-col h-full w-full overflow-x-hidden">
      {/* 헤더 */}
      <Header
        title={title}
        showBackButton={showBackButton}
        showSettings={showSettings}
        onBack={onBack}
        onSettings={onSettings}
        rightAction={rightAction}
      />

      {/* 메인 콘텐츠 영역 - flexbox로 자동 높이 계산 */}
      <main className="flex-1 min-h-0 w-full">
        {children}
      </main>
    </div>
  );
}