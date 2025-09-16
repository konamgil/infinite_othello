import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavItemProps {
  id: 'home' | 'tower' | 'battle' | 'stella' | 'more';
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  badge?: number;
}

export function NavItem({ id, label, icon: Icon, isActive, badge }: NavItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    // 네비게이션만 수행, 상태는 BottomNav에서 관리
    navigate(`/${id === 'home' ? '' : id}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl
                  group select-none
                  transition-transform duration-200
                  active:scale-90 active:bg-white/10
                  ${isActive
                    ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-md shadow-lg shadow-purple-500/20 border border-purple-400/30'
                    : 'hover:scale-105 hover:bg-white/5'
                  }`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* 터치시 ripple 효과 */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-100
                      bg-gradient-to-br from-white/20 to-white/10 transition-opacity duration-150" />

      {/* 별빛 효과 - 항상 표시하되 활성/비활성에 따라 다르게 */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${
        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        {Array.from({ length: isActive ? 5 : 3 }, (_, i) => (
          <div
            key={i}
            className={`absolute rounded-full animate-pulse ${
              isActive
                ? 'w-1 h-1 bg-gradient-to-r from-purple-300 to-blue-300'
                : 'w-0.5 h-0.5 bg-white/60'
            }`}
            style={{
              left: `${15 + i * (isActive ? 15 : 25)}%`,
              top: `${10 + (i % 2) * (isActive ? 60 : 40) + (i * 10)}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${1.5 + i * 0.2}s`
            }}
          />
        ))}
      </div>

      {/* 활성 상태 글로우 */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-blue-400/10
                        rounded-2xl blur-lg animate-pulse"
             style={{ animationDuration: '3s' }} />
      )}

      {/* 아이콘 */}
      <div className="relative mb-1.5 z-10">
        <Icon
          size={20}
          strokeWidth={2}
          className={`transition-all duration-200 ${
            isActive
              ? 'text-white drop-shadow-sm'
              : 'text-white/60 group-hover:text-white/80 group-active:text-white'
          }`}
        />

        {/* 배지 (알림 숫자) */}
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 text-xs font-bold
                           bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full
                           flex items-center justify-center shadow-lg shadow-red-500/30
                           border border-red-400/30 animate-pulse">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>

      {/* 라벨 */}
      <span className={`text-xs font-medium transition-all duration-200 z-10 ${
        isActive
          ? 'text-white drop-shadow-sm'
          : 'text-white/50 group-hover:text-white/70 group-active:text-white/80'
      }`}>
        {label}
      </span>

      {/* 활성 상태 인디케이터 - 조건부 렌더링으로 완전 분리 */}
      {isActive && (
        <div className="absolute -bottom-1 left-1/2 z-10 animate-slideInScale">
          <div className="w-8 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full
                          shadow-sm shadow-purple-400/50" />
          <div className="absolute inset-0 w-8 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400
                          rounded-full blur-sm opacity-60" />
        </div>
      )}
    </button>
  );
}