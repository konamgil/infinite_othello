import React from 'react';
import type { AppRouteObject, RouteMeta } from '../../app/router/meta';
import { Sparkles, Target, Lightbulb, Wand2 } from 'lucide-react';

import { StellaLayout } from './layouts/StellaLayout';
import StellaHome from './pages/index/page';
import StellaMissions from './pages/missions/page';
import StellaStrategy from './pages/strategy/page';
import StellaPractice from './pages/practice/page';

const STELLA_META: RouteMeta = {
  isRoot: true,
  requiresAuth: false,
  title: '스텔라',
  icon: Sparkles,
  navPath: '/stella',
};

const STELLA_DETAIL_META: RouteMeta = {
  requiresAuth: false,
  hideBottomNav: true,
  title: '스텔라',
  icon: Sparkles,
  navPath: '/stella',
};

const StellaErrorBoundary = () => (
  <StellaLayout>
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-white">스텔라 학습 데이터를 불러오지 못했습니다.</h2>
      <p className="text-sm text-white/60">잠시 후 다시 시도해 주세요.</p>
    </div>
  </StellaLayout>
);

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

