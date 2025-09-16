import React, { useEffect } from 'react';
import { NavItem } from './NavItem';
import { useActiveTab, useGameStore } from '../../store/gameStore';
import { useLocation } from 'react-router-dom';
import { Home, Castle, Swords, Sparkles, Settings } from 'lucide-react';

export function BottomNav() {
  const location = useLocation();
  const setActiveTab = useGameStore((state) => state.setActiveTab);

  // URL 기반으로 현재 activeTab 계산
  const getCurrentTab = (): 'home' | 'tower' | 'battle' | 'stella' | 'more' => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path === '/tower') return 'tower';
    if (path === '/battle') return 'battle';
    if (path === '/stella') return 'stella';
    if (path === '/more') return 'more';
    return 'home';
  };

  const currentTab = getCurrentTab();
  const activeTab = useActiveTab();

  // URL 변경시 activeTab 동기화 (디버깅 포함)
  useEffect(() => {
    const path = location.pathname;
    let newTab: 'home' | 'tower' | 'battle' | 'stella' | 'more' = 'home';

    if (path === '/' || path === '/home') {
      newTab = 'home';
    } else if (path === '/tower') {
      newTab = 'tower';
    } else if (path === '/battle') {
      newTab = 'battle';
    } else if (path === '/stella') {
      newTab = 'stella';
    } else if (path === '/more') {
      newTab = 'more';
    }

    console.log('BottomNav URL sync:', { path, newTab, currentActiveTab: activeTab });

    // 현재 상태와 다를 때만 업데이트
    if (newTab !== activeTab) {
      console.log('Updating activeTab to:', newTab);
      setActiveTab(newTab);
    }
  }, [location.pathname, activeTab, setActiveTab]);

  return (
    <nav
      className="relative px-4 py-3 bg-gradient-to-t from-slate-800/50 via-purple-900/20 to-black/40 backdrop-blur-2xl"
      role="navigation"
      aria-label="주요 메뉴"
    >
      {/* 미묘한 별빛 효과 */}
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

      {/* 네비게이션 아이템들 */}
      <div className="relative flex justify-around items-center">
        <NavItem
          id="home"
          label="홈"
          icon={Home}
          isActive={currentTab === 'home'}
        />

        <NavItem
          id="tower"
          label="탑"
          icon={Castle}
          isActive={currentTab === 'tower'}
        />

        <NavItem
          id="battle"
          label="랭크대전"
          icon={Swords}
          isActive={currentTab === 'battle'}
        />

        <NavItem
          id="stella"
          label="스텔라"
          icon={Sparkles}
          isActive={currentTab === 'stella'}
        />

        <NavItem
          id="more"
          label="더보기"
          icon={Settings}
          isActive={currentTab === 'more'}
        />
      </div>
    </nav>
  );
}