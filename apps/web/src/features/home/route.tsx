import React from 'react';
import { redirect } from 'react-router-dom';
import type { AppRouteObject, RouteMeta } from '../../app/router/meta';
import { Home as HomeIcon } from 'lucide-react';

import HomePage from './pages/index/page';

/**
 * Metadata for the home feature's root route.
 */
const HOME_META: RouteMeta = {
  isRoot: true,
  title: '홈',
  icon: HomeIcon,
  navPath: '/',
};

/**
 * An error boundary component for the home feature.
 *
 * This is displayed if an error occurs while rendering the home page.
 *
 * @returns {React.ReactElement} The rendered error boundary UI.
 */
const HomeErrorBoundary = () => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
    <h2 className="text-lg font-semibold text-white">홈 화면을 불러오지 못했습니다.</h2>
    <p className="text-sm text-white/60">잠시 후 다시 시도해 주세요.</p>
  </div>
);

/**
 * The main route object for the home feature.
 *
 * This object defines the routes for the home screen of the application.
 * It handles the root path ('/'), '/home', and redirects any other paths
 * under '/home/' back to the root.
 */
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

