import React from 'react';
import type { AppRouteObject, RouteMeta } from '../../app/router/meta';
import { Castle, Gamepad2 } from 'lucide-react';

import { protectedLoader } from '../../app/router/loaders';
import { TowerLayout } from './layouts/TowerLayout';
import GameScreen from './pages/game/page';
import TowerScreen from './pages/index/page';

const TOWER_META: RouteMeta = {
  isRoot: true,
  requiresAuth: false,
  title: '탑',
  icon: Castle,
  navPath: '/tower',
};

const TOWER_GAME_META: RouteMeta = {
  requiresAuth: true,
  title: '탑 도전',
  icon: Gamepad2,
};

const TowerErrorBoundary = () => (
  <TowerLayout>
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-white">탑 정보를 불러오지 못했습니다.</h2>
      <p className="text-sm text-white/60">네트워크 상태를 확인한 뒤 다시 시도해 주세요.</p>
    </div>
  </TowerLayout>
);

const TowerNotFound = () => (
  <TowerLayout>
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-white/90">해당 탑 층을 찾을 수 없습니다.</h2>
      <p className="text-sm text-white/60">다시 시도해 주세요.</p>
    </div>
  </TowerLayout>
);

export const towerRoute: AppRouteObject = {
  id: 'tower-root',
  path: 'tower',
  handle: { meta: TOWER_META },
  errorElement: <TowerErrorBoundary />,
  children: [
    {
      index: true,
      element: <TowerScreen />,
      handle: { meta: TOWER_META },
    },
    {
      path: ':floor',
      element: <GameScreen />,
      handle: { meta: { ...TOWER_GAME_META, hideBottomNav: true } },
    },
    {
      path: '*',
      element: <TowerNotFound />,
      handle: { meta: { ...TOWER_META, hideBottomNav: true, title: '탑 경로 없음' } },
    },
  ],
};

export default towerRoute;

