import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { useNavigate } from 'react-router-dom';

interface NavItemProps {
  id: 'home' | 'tower' | 'battle' | 'stella' | 'more';
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  badge?: number;
}

export function NavItem({ id, label, icon: Icon, isActive, badge }: NavItemProps) {
  const setActiveTab = useGameStore((state) => state.setActiveTab);
  const navigate = useNavigate();

  const handleClick = () => {
    setActiveTab(id);
    navigate(`/${id === 'home' ? '' : id}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`tab-button ${isActive ? 'active' : ''}`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* 아이콘 및 배지 */}
      <div className="relative">
        <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />

        {/* 배지 (알림 숫자) */}
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 text-xs font-bold
                           bg-tower-danger-500 text-white rounded-full
                           flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}

        {/* 활성 상태 인디케이터 */}
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2
                          w-1 h-1 bg-tower-gold-400 rounded-full" />
        )}
      </div>

      {/* 라벨 */}
      <span className="font-medium text-xs leading-none">{label}</span>
    </button>
  );
}