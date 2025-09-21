import React from 'react';

import { RootLayout } from './RootLayout';
import { appRootChildren } from './rootRoutes';
import { NotFoundScreen } from './NotFound';
import type { AppRouteObject } from './meta';

/**
 * A route object for handling 404 Not Found errors.
 *
 * This route uses a wildcard path ('*') to catch any URLs that don't match other routes.
 * It renders the `NotFoundScreen` component. The `handle` property includes metadata
 * to hide the bottom navigation and set the page title to '404'.
 */
const notFoundRoute: AppRouteObject = {
  path: '*',
  element: <NotFoundScreen />,
  handle: { meta: { hideBottomNav: true, title: '404' } },
};

/**
 * The main route tree for the application.
 *
 * This array defines the entire routing structure. It consists of a single top-level
 * route that uses the `RootLayout` component. All other routes, including the main
 * feature routes (`appRootChildren`) and the `notFoundRoute`, are nested as its children.
 * This structure ensures that all pages share the common `RootLayout`.
 */
export const routeTree: AppRouteObject[] = [
  {
    id: 'app-root',
    path: '/',
    element: <RootLayout />,
    children: [...appRootChildren, notFoundRoute],
  },
];
