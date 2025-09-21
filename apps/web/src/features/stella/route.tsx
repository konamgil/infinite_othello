import React from 'react';
import type { AppRouteObject, RouteMeta } from '../../app/router/meta';
import { Sparkles, Target, Lightbulb, Wand2 } from 'lucide-react';

import { StellaLayout } from './layouts/StellaLayout';
import StellaHome from './pages/index/page';
import StellaMissions from './pages/missions/page';
import StellaStrategy from './pages/strategy/page';
import StellaPractice from './pages/practice/page';
import { createFeatureErrorBoundary, createFeatureNotFound, createFeatureRoute } from '../../app/router/routeFactories';

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
const StellaErrorBoundary = createFeatureErrorBoundary(StellaLayout, '스텔라 학습 데이터를 불러오지 못했습니다.');

/**
 * The main route object for the Stella AI mentor feature.
 *
 * This object defines the layout and all sub-routes for the Stella section,
 * which includes the main hub, missions, strategy lessons, and practice mode.
 */
export const stellaRoute: AppRouteObject = createFeatureRoute({
  id: 'stella-root',
  path: 'stella',
  meta: STELLA_META,
  layout: StellaLayout,
  errorBoundary: StellaErrorBoundary,
  children: [
    { index: true, element: <StellaHome /> },
    { path: 'missions', element: <StellaMissions />, meta: { ...STELLA_DETAIL_META, title: '미션', icon: Target } },
    { path: 'strategy', element: <StellaStrategy />, meta: { ...STELLA_DETAIL_META, title: '전략 연구', icon: Lightbulb } },
    { path: 'practice', element: <StellaPractice />, meta: { ...STELLA_DETAIL_META, title: '연습 모드', icon: Wand2 } },
  ],
  catchAll: { element: <StellaHome />, meta: { ...STELLA_DETAIL_META, title: '스텔라 안내' } },
});

export default stellaRoute;

