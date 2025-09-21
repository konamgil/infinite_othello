import React from 'react';
import type { AppRouteObject, RouteMeta } from '../../app/router/meta';
import { Sparkles, Target, Lightbulb, Wand2 } from 'lucide-react';

import { StellaLayout } from './layouts/StellaLayout';
import StellaHome from './pages/index/page';
import StellaMissions from './pages/missions/page';
import StellaStrategy from './pages/strategy/page';
import StellaPractice from './pages/practice/page';

/**
 * Metadata for the root of the Stella AI mentor feature.
 * This is used for the main '/stella' route.
 */
const STELLA_META: RouteMeta = {
  isRoot: true,
  requiresAuth: false,
  title: '스텔라',
  icon: Sparkles,
  navPath: '/stella',
};

/**
 * Base metadata for detail pages within the Stella feature.
 * These pages typically hide the bottom navigation.
 */
const STELLA_DETAIL_META: RouteMeta = {
  requiresAuth: false,
  hideBottomNav: true,
  title: '스텔라',
  icon: Sparkles,
  navPath: '/stella',
};

/**
 * An error boundary component for the Stella feature.
 *
 * This is displayed if an error occurs while rendering any of the Stella feature's pages.
 *
 * @returns {React.ReactElement} The rendered error boundary UI.
 */
const StellaErrorBoundary = () => (
  <StellaLayout>
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-white">스텔라 학습 데이터를 불러오지 못했습니다.</h2>
      <p className="text-sm text-white/60">잠시 후 다시 시도해 주세요.</p>
    </div>
  </StellaLayout>
);

/**
 * The main route object for the Stella AI mentor feature.
 *
 * This object defines the layout and all sub-routes for the Stella section,
 * which includes the main hub, missions, strategy lessons, and practice mode.
 */
export const stellaRoute: AppRouteObject = {
  id: 'stella-root',
  path: 'stella',
  handle: { meta: STELLA_META },
  errorElement: <StellaErrorBoundary />,
  children: [
    {
      index: true,
      element: <StellaHome />,
      handle: { meta: STELLA_META },
    },
    {
      path: 'missions',
      element: <StellaMissions />,
      handle: { meta: { ...STELLA_DETAIL_META, title: '미션', icon: Target } },
    },
    {
      path: 'strategy',
      element: <StellaStrategy />,
      handle: { meta: { ...STELLA_DETAIL_META, title: '전략 연구', icon: Lightbulb } },
    },
    {
      path: 'practice',
      element: <StellaPractice />,
      handle: { meta: { ...STELLA_DETAIL_META, title: '연습 모드', icon: Wand2 } },
    },
    {
      path: '*',
      element: <StellaHome />,
      handle: { meta: { ...STELLA_DETAIL_META, title: '스텔라 안내' } },
    },
  ],
};

export default stellaRoute;

