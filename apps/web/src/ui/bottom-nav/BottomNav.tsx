import React, { useEffect } from 'react';
import { NavItem } from './NavItem';
import { useActiveTab, useGameStore } from '../../store/gameStore';
import { useLocation } from 'react-router-dom';
import { Home, Castle, Swords, Sparkles, Settings } from 'lucide-react';

type BottomNavTab = 'home' | 'tower' | 'battle' | 'stella' | 'more';

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

const resolveTabFromPath = (path: string): BottomNavTab => {
  const normalized = normalizePath(path);
  if (normalized === '/' || normalized === '/home') return 'home';
  const [, firstSegment = ''] = normalized.split('/');
  if (firstSegment === 'tower') return 'tower';
  if (firstSegment === 'battle') return 'battle';
  if (firstSegment === 'stella') return 'stella';
  if (firstSegment === 'more' || firstSegment === 'replay') return 'more';
  return 'home';
};

export function BottomNav() {
  const location = useLocation();
  const setActiveTab = useGameStore((state) => state.setActiveTab);
  const currentTab = resolveTabFromPath(location.pathname);
  const activeTab = useActiveTab();

  useEffect(() => {
    const newTab = resolveTabFromPath(location.pathname);
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.pathname, activeTab, setActiveTab]);

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
        <NavItem id="home" label="홈" icon={Home} isActive={currentTab === 'home'} />
        <NavItem id="tower" label="탑" icon={Castle} isActive={currentTab === 'tower'} />
        <NavItem id="battle" label="랭크전" icon={Swords} isActive={currentTab === 'battle'} />
        <NavItem id="stella" label="스텔라" icon={Sparkles} isActive={currentTab === 'stella'} />
        <NavItem id="more" label="더보기" icon={Settings} isActive={currentTab === 'more'} />
      </div>
    </nav>
  );
}
