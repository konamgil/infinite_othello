import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatItem {
  key: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'yellow' | 'green' | 'purple' | 'orange';
  animation?: React.ReactNode; // 애니메이션 요소 (예: RP 증가 표시)
}

interface StatsDisplayProps {
  stats: StatItem[];
  className?: string;
}

const colorStyles = {
  blue: {
    border: 'border-blue-400/20',
    iconBg: 'bg-gradient-to-br from-blue-400 to-cyan-500',
    text: 'text-blue-400'
  },
  yellow: {
    border: 'border-yellow-400/20',
    iconBg: 'bg-gradient-to-br from-yellow-400 to-orange-500',
    text: 'text-yellow-400'
  },
  green: {
    border: 'border-green-400/20',
    iconBg: 'bg-gradient-to-br from-green-400 to-emerald-500',
    text: 'text-green-400'
  },
  purple: {
    border: 'border-purple-400/20',
    iconBg: 'bg-gradient-to-br from-purple-400 to-purple-600',
    text: 'text-purple-400'
  },
  orange: {
    border: 'border-orange-400/20',
    iconBg: 'bg-gradient-to-br from-orange-400 to-orange-600',
    text: 'text-orange-400'
  }
};

export function StatsDisplay({ stats, className = '' }: StatsDisplayProps) {
  return (
    <div className={`absolute top-4 right-3 z-20 flex items-center gap-1.5 ${className}`}>
      {stats.map((stat) => {
        const styles = colorStyles[stat.color];
        const Icon = stat.icon;

        return (
          <div
            key={stat.key}
            className={`relative flex items-center gap-1 px-2 py-1 bg-black/30 backdrop-blur-md ${styles.border} rounded-full`}
          >
            <div className={`w-2 h-2 ${styles.iconBg} rounded-full flex items-center justify-center`}>
              <Icon size={4} className="text-white" />
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-white/70 font-display text-[8px]">{stat.label}</span>
              <span className={`${styles.text} font-display font-medium text-[9px] tracking-wide`}>
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </span>
            </div>

            {/* 애니메이션 요소 렌더링 */}
            {stat.animation}
          </div>
        );
      })}
    </div>
  );
}