import React from 'react';
import type { AppRouteObject, RouteMeta } from '../../app/router/meta';
import { Swords, Sword, Trophy, Gamepad2 } from 'lucide-react';

import { BattleLayout } from './layouts/BattleLayout';
import BattleHome from './pages/index/page';
import BattleMatchScreen from './pages/match/page';
import BattleTournamentScreen from './pages/tournament/page';
import QuickMatchPage from './pages/quick/page';
import RankedMatchPage from './pages/ranked/page';
import { createFeatureErrorBoundary, createFeatureNotFound, createFeatureRoute } from '../../app/router/routeFactories';

/**
 * Metadata for the root of the battle feature.
 * This is used for the main '/battle' route.
 */
const BATTLE_ROOT_META: RouteMeta = {
  isRoot: true,
  requiresAuth: false,
  title: '랭크전',
  icon: Swords,
  navPath: '/battle',
};

/**
 * Base metadata for detail pages within the battle feature.
 * These pages typically hide the bottom navigation.
 */
const BATTLE_DETAIL_META: RouteMeta = {
  requiresAuth: false,
  hideBottomNav: true,
  title: '배틀 상세',
  icon: Sword,
};

/**
 * Metadata for the actual game screen.
 */
const GAME_META: RouteMeta = {
  requiresAuth: false,
  hideBottomNav: true,
  title: '대전',
  icon: Gamepad2,
};

/**
 * An error boundary component specific to the battle feature.
 *
 * This component is rendered when an error is thrown within the battle feature's routes.
 * It displays a user-friendly message indicating that the battle information could not be loaded.
 *
 * @returns {React.ReactElement} The rendered error boundary UI.
 */
const BattleErrorBoundary = createFeatureErrorBoundary(BattleLayout, '전투 정보를 불러오지 못했습니다.');

/**
 * A component to display when a specific battle page is not found.
 *
 * This is rendered for any paths under '/battle/' that do not match a defined route.
 * It provides a message guiding the user back to the list of battles.
 *
 * @returns {React.ReactElement} The rendered "not found" UI for the battle feature.
 */
const BattleNotFound = createFeatureNotFound(BattleLayout, '해당 전투 페이지를 찾을 수 없습니다.');


/**
 * The main route object for the entire battle feature.
 *
 * This object defines the layout and all the sub-routes for the battle section of the app.
 * It includes routes for the battle home page, quick matches, ranked matches, tournaments,
 * and a catch-all route for pages that are not found.
 */
export const battleRoute: AppRouteObject = createFeatureRoute({
  id: 'battle-root',
  path: 'battle',
  meta: BATTLE_ROOT_META,
  layout: BattleLayout,
  errorBoundary: BattleErrorBoundary,
  children: [
    { index: true, element: <BattleHome /> },
    { path: 'quick', element: <QuickMatchPage />, meta: { ...BATTLE_DETAIL_META, title: '빠른 매치' } },
    { path: 'ranked', element: <RankedMatchPage />, meta: { ...BATTLE_DETAIL_META, title: '랭크 매치' } },
    { path: 'tournament', element: <BattleTournamentScreen />, meta: { ...BATTLE_DETAIL_META, title: '토너먼트', icon: Trophy } },
  ],
  catchAll: { element: BattleNotFound, meta: { ...BATTLE_DETAIL_META, title: '전투 없음' } },
});

export default battleRoute;

