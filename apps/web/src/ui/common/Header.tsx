import React from 'react';
import { ArrowLeft, Settings, MoreHorizontal } from 'lucide-react';
import { haptic } from '../feedback/HapticFeedback';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  showSettings?: boolean;
  onBack?: () => void;
  onSettings?: () => void;
  rightAction?: React.ReactNode;
}

export function Header({
  title,
  showBackButton = false,
  showSettings = false,
  onBack,
  onSettings,
  rightAction
}: HeaderProps) {
  return (
    <header className="header">
      {/* 왼쪽: 뒤로가기 버튼 */}
      <div className="flex items-center">
        {showBackButton && (
          <button
            onClick={() => {
              haptic.navigationSwipe();
              onBack?.();
            }}
            className="touch-target hover:bg-tower-deep-50 rounded-lg transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={20} className="text-tower-silver-300" />
          </button>
        )}
      </div>

      {/* 중앙: 제목 */}
      <div className="flex-1 flex justify-center">
        <h1 className="text-lg font-bold text-tower-gold-300 truncate px-4">
          {title}
        </h1>
      </div>

      {/* 오른쪽: 설정 또는 커스텀 액션 */}
      <div className="flex items-center">
        {rightAction || (
          showSettings && (
            <button
              onClick={() => {
                haptic.buttonTap();
                onSettings?.();
              }}
              className="touch-target hover:bg-tower-deep-50 rounded-lg transition-colors"
              aria-label="설정"
            >
              <Settings size={20} className="text-tower-silver-300" />
            </button>
          )
        )}
      </div>
    </header>
  );
}