import React from 'react';

import { RootLayout } from './RootLayout';
import { appRootChildren } from './rootRoutes';
import { NotFoundScreen } from './NotFound';
import type { AppRouteObject } from './meta';

const notFoundRoute: AppRouteObject = {
  path: '*',
  element: <NotFoundScreen />,
  handle: { meta: { hideBottomNav: true, title: '404' } },
};

export const routeTree: AppRouteObject[] = [
  {
    id: 'app-root',
    path: '/',
    element: <RootLayout />,
    children: [...appRootChildren, notFoundRoute],
  },
];
