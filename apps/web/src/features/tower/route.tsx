import React from 'react';
import type { AppRouteObject, RouteMeta } from '../../app/router/meta';
import { Castle, Gamepad2, Target } from 'lucide-react';

import { protectedLoader } from '../../app/router/loaders';
import { TowerLayout } from './layouts/TowerLayout';
import GameScreen from './pages/game/page';
import TowerScreen from './pages/index/page';
import TowerChallengeScreen from './pages/challenge/page';

/**
 * Metadata for the root of the tower feature.
 * This is used for the main '/tower' route.
 */
const TOWER_META: RouteMeta = {
  isRoot: true,
  requiresAuth: false,
  title: '탑',
  icon: Castle,
  navPath: '/tower',
};

/**
 * Metadata for the tower game screen itself.
 * This route requires authentication.
 */
const TOWER_GAME_META: RouteMeta = {
  requiresAuth: true,
  title: '탑 도전',
  icon: Gamepad2,
};

/**
 * Metadata for the tower challenge preparation screen.
 * This route requires authentication and hides bottom navigation.
 */
const TOWER_CHALLENGE_META: RouteMeta = {
  requiresAuth: true,
  title: '도전 준비',
  icon: Target,
  hideBottomNav: true,
};

/**
 * An error boundary component for the tower feature.
 *
 * This is displayed if an error occurs while rendering any of the tower feature's pages.
 *
 * @returns {React.ReactElement} The rendered error boundary UI.
 */
const TowerErrorBoundary = () => (
  <TowerLayout>
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-white">탑 정보를 불러오지 못했습니다.</h2>
      <p className="text-sm text-white/60">네트워크 상태를 확인한 뒤 다시 시도해 주세요.</p>
    </div>
  </TowerLayout>
);

/**
 * A component to display when a specific tower floor is not found.
 *
 * @returns {React.ReactElement} The rendered "not found" UI for the tower feature.
 */
const TowerNotFound = () => (
  <TowerLayout>
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-white/90">해당 탑 층을 찾을 수 없습니다.</h2>
      <p className="text-sm text-white/60">다시 시도해 주세요.</p>
    </div>
  </TowerLayout>
);

/**
 * The main route object for the tower feature.
 *
 * This object defines the layout and all sub-routes for the tower section,
 * including the main tower screen and the game screen for each floor.
 */
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
      path: ':floor/challenge',
      element: <TowerChallengeScreen />,
      handle: { meta: TOWER_CHALLENGE_META },
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

