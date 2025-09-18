import React from 'react';
import type { AppRouteObject, RouteMeta } from '../../app/router/meta';
import { Swords, Sword, Trophy, Gamepad2 } from 'lucide-react';

import { protectedLoader } from '../../app/router/loaders';
import { BattleLayout } from './layouts/BattleLayout';
import BattleHome from './pages/index/page';
import BattleMatchScreen from './pages/match/page';
import BattleTournamentScreen from './pages/tournament/page';
import QuickMatchPage from './pages/quick/page';
import RankedMatchPage from './pages/ranked/page';

const BATTLE_ROOT_META: RouteMeta = {
  isRoot: true,
  requiresAuth: false,
  title: '랭크전',
  icon: Swords,
  navPath: '/battle',
};

const BATTLE_DETAIL_META: RouteMeta = {
  requiresAuth: false,
  hideBottomNav: true,
  title: '배틀 상세',
  icon: Sword,
};

const GAME_META: RouteMeta = {
  requiresAuth: false,
  hideBottomNav: true,
  title: '대전',
  icon: Gamepad2,
};

const BattleErrorBoundary = () => (
  <BattleLayout>
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-white">전투 정보를 불러오지 못했습니다.</h2>
      <p className="text-sm text-white/60">잠시 후 다시 시도하거나 네트워크 상태를 확인해 주세요.</p>
    </div>
  </BattleLayout>
);

const BattleNotFound = () => (
  <BattleLayout detail>
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-white/90">해당 전투 페이지를 찾을 수 없습니다.</h2>
      <p className="text-sm text-white/60">목록으로 돌아가 다시 시도해 주세요.</p>
    </div>
  </BattleLayout>
);



export const battleRoute: AppRouteObject = {
  id: 'battle-root',
  path: 'battle',
  handle: { meta: BATTLE_ROOT_META },
  errorElement: <BattleErrorBoundary />,
  children: [
    {
      index: true,
      element: <BattleHome />,
      handle: { meta: BATTLE_ROOT_META },
    },
    {
      path: 'quick',
      element: <QuickMatchPage />,
      handle: { meta: { ...BATTLE_DETAIL_META, title: '빠른 매치' } },
    },
    {
      path: 'ranked',
      element: <RankedMatchPage />,
      handle: { meta: { ...BATTLE_DETAIL_META, title: '랭크 매치' } },
    },
    {
      path: 'tournament',
      element: <BattleTournamentScreen />,
      handle: { meta: { ...BATTLE_DETAIL_META, title: '토너먼트', icon: Trophy } },
    },
    {
      path: '*',
      element: <BattleNotFound />,
      handle: { meta: { ...BATTLE_DETAIL_META, title: '전투 없음' } },
    },
  ],
};

export default battleRoute;

