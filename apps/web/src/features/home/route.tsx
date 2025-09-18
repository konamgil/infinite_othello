import React from 'react';
import { redirect } from 'react-router-dom';
import type { AppRouteObject, RouteMeta } from '../../app/router/meta';
import { Home as HomeIcon } from 'lucide-react';

import HomePage from './pages/index/page';

const HOME_META: RouteMeta = {
  isRoot: true,
  title: '홈',
  icon: HomeIcon,
  navPath: '/',
};

const HomeErrorBoundary = () => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
    <h2 className="text-lg font-semibold text-white">홈 화면을 불러오지 못했습니다.</h2>
    <p className="text-sm text-white/60">잠시 후 다시 시도해 주세요.</p>
  </div>
);

export const homeRoute: AppRouteObject = {
  id: 'home-root',
  path: '',
  handle: { meta: HOME_META },
  errorElement: <HomeErrorBoundary />,
  children: [
    {
      index: true,
      element: <HomePage />,
      handle: { meta: HOME_META },
    },
    {
      path: 'home',
      element: <HomePage />,
      handle: { meta: HOME_META },
    },
    {
      path: 'home/*',
      loader: () => redirect('/'),
    },
  ],
};

export default homeRoute;

