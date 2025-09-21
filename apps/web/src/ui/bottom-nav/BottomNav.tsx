import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

import { NavItem } from './NavItem';

/**
 * Defines the properties for a single item in the bottom navigation bar.
 */
export type BottomNavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

/**
 * Normalizes a URL path by removing any trailing slashes.
 * If the path is empty after normalization, it returns '/'.
 * @private
 */
const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

/**
 * Extracts the root segment from a URL path (e.g., '/battle' from '/battle/ranked').
 * @private
 */
const getRootSegment = (path: string) => {
  if (path === '/') return '/';
  const [, first = ''] = path.split('/');
  return first ? `/${first}` : '/';
};

interface BottomNavProps {
  items: BottomNavItem[];
  activePath?: string;
}

/**
 * The main bottom navigation component for the application.
 *
 * This component renders a list of navigation items and determines which item is
 * currently active based on the current URL path. It uses a particle animation
 * for a decorative background effect.
 *
 * @param {BottomNavProps} props - The component props.
 * @returns {React.ReactElement} The rendered bottom navigation bar.
 */
export function BottomNav({ items, activePath }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const normalizedCurrent = normalizePath(location.pathname);
  const fallbackActive = getRootSegment(normalizedCurrent);
  const normalizedActive = normalizePath(activePath ?? fallbackActive);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <nav
      className="relative px-4 py-3 bg-gradient-to-t from-slate-800/60 via-purple-900/25 to-transparent backdrop-blur-3xl
                 before:absolute before:top-0 before:inset-x-0 before:h-px
                 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
      role="navigation"
      aria-label="주요 메뉴"
    >
      <div className="absolute inset-0 opacity-40 overflow-hidden">
        {/* 떠다니는 별빛 파티클들 */}
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              width: `${0.5 + (i % 3) * 0.3}rem`,
              height: `${0.5 + (i % 3) * 0.3}rem`,
              left: `${5 + i * 11}%`,
              top: `${10 + (i % 3) * 30}%`,
              background: `radial-gradient(circle, ${
                i % 4 === 0 ? 'rgba(147, 197, 253, 0.6)' :
                i % 4 === 1 ? 'rgba(196, 181, 253, 0.6)' :
                i % 4 === 2 ? 'rgba(253, 186, 116, 0.6)' :
                'rgba(255, 255, 255, 0.6)'
              }, transparent 70%)`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${2.5 + i * 0.4}s`,
              transform: 'translateZ(0)', // GPU 가속
            }}
          />
        ))}

        {/* 미묘하게 움직이는 배경 별들 */}
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={`bg-${i}`}
            className="absolute w-px h-px bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationName: 'float',
              animationDuration: `${8 + i * 0.5}s`,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
              animationDelay: `${i * 0.3}s`,
              transform: 'translateZ(0)',
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.2; }
          25% { transform: translateY(-4px) translateX(2px); opacity: 0.6; }
          50% { transform: translateY(-2px) translateX(-1px); opacity: 0.8; }
          75% { transform: translateY(-6px) translateX(3px); opacity: 0.4; }
        }
      `}</style>

      <div className="relative flex justify-around items-center">
        {items.map((item) => {
          const itemPath = normalizePath(item.path);
          const isActive = itemPath === '/'
            ? normalizedActive === '/'
            : normalizedActive.startsWith(itemPath);

          return (
            <NavItem
              key={item.path}
              path={item.path}
              label={item.label}
              icon={item.icon}
              badge={item.badge}
              isActive={isActive}
              onNavigate={handleNavigate}
            />
          );
        })}
      </div>
    </nav>
  );
}
