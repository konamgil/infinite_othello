import React from 'react';
import { NavItem } from './NavItem';
import { useActiveTab } from '../../store/gameStore';
import { Home, Castle, Swords, Sparkles, Settings } from 'lucide-react';

export function BottomNav() {
  const activeTab = useActiveTab();

  return (
    <nav className="bottom-nav" role="navigation" aria-label="주요 메뉴">
      <NavItem
        id="home"
        label="홈"
        icon={Home}
        isActive={activeTab === 'home'}
      />

      <NavItem
        id="tower"
        label="탑"
        icon={Castle}
        isActive={activeTab === 'tower'}
      />

      <NavItem
        id="battle"
        label="랭크대전"
        icon={Swords}
        isActive={activeTab === 'battle'}
      />

      <NavItem
        id="stella"
        label="스텔라"
        icon={Sparkles}
        isActive={activeTab === 'stella'}
      />

      <NavItem
        id="more"
        label="더보기"
        icon={Settings}
        isActive={activeTab === 'more'}
      />
    </nav>
  );
}