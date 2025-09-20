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
      className="relative px-4 py-3 bg-gradient-to-t from-slate-800/50 via-purple-900/20 to-black/40 backdrop-blur-2xl"
      role="navigation"
      aria-label="주요 메뉴"
    >
      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white/40 rounded-full animate-pulse"
            style={{
              left: `${10 + i * 20}%`,
              top: `${20 + (i % 2) * 40}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${2 + i * 0.3}s`
            }}
          />
        ))}
      </div>

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
