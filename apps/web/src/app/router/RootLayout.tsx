import React, { Suspense, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useMatches, useNavigation } from 'react-router-dom';

import { AppShell } from '../../ui/layout/AppShell';
import { BottomNav } from '../../ui/navigation/BottomNav';
import { PWAInstallPrompt } from '../../components/pwa/PWAInstallPrompt';
import { PWAUpdatePrompt } from '../../components/pwa/PWAUpdatePrompt';
import type { RouteHandle, RouteMeta, RootRouteMeta } from './meta';
import { rootNavItems } from './rootRoutes';

/**
 * Normalizes a URL path by removing any trailing slashes.
 * If the path is empty after normalization, it returns '/'.
 *
 * @param {string} path - The URL path to normalize.
 * @returns {string} The normalized path.
 * @example
 * normalizePath('/home/') // returns '/home'
 * normalizePath('/') // returns '/'
 * normalizePath('') // returns '/'
 */
const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

/**
 * Extracts the root segment from a URL path.
 * The root segment is the part of the path after the initial slash.
 *
 * @param {string} path - The URL path.
 * @returns {string} The root segment of the path (e.g., '/home'). Returns '/' for the root path itself.
 * @example
 * getRootSegment('/home/user') // returns '/home'
 * getRootSegment('/') // returns '/'
 * getRootSegment('/about') // returns '/about'
 */
const getRootSegment = (path: string) => {
  if (path === '/') return '/';
  const [, first = ''] = path.split('/');
  return first ? `/${first}` : '/';
};

/**
 * Extracts the 'meta' property from a route handle object.
 * Route handles are used by `react-router-dom` to attach custom data to routes.
 *
 * @param {RouteHandle | undefined} handle - The route handle object, which may be undefined.
 * @returns {RouteMeta | undefined} The metadata object if it exists, otherwise undefined.
 */
const pickMeta = (handle?: RouteHandle): RouteMeta | undefined => handle?.meta;

/**
 * A loading overlay component that indicates a loading state.
 * It can be displayed as a full-screen overlay or as an inline element.
 *
 * @param {object} props - The component props.
 * @param {boolean} [props.inline=false] - If true, the loading indicator is displayed inline. Otherwise, it's a full-screen overlay.
 * @returns {React.ReactElement} The rendered loading overlay.
 */
const LoadingOverlay: React.FC<{ inline?: boolean }> = ({ inline = false }) => (
  <div
    className={
      inline
        ? 'flex h-full w-full items-center justify-center py-16'
        : 'absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm'
    }
  >
    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/10">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-transparent" aria-hidden />
      <span className="sr-only">콘텐츠를 불러오는 중입니다</span>
    </div>
  </div>
);

/**
 * The root layout component for the entire application.
 *
 * This component orchestrates the main structure of the app, including:
 * - A consistent app shell (`AppShell`).
 * - A bottom navigation bar (`BottomNav`) that is conditionally displayed based on the current route.
 * - A loading indicator that shows during route transitions.
 * - Dynamic document title updates based on the active route's metadata.
 * - A suspense boundary for lazily loaded route components.
 *
 * It uses `react-router-dom` hooks (`useMatches`, `useLocation`, `useNavigation`) to adapt the layout
 * to the current routing state.
 *
 * @returns {React.ReactElement} The rendered root layout of the application.
 */
export function RootLayout() {
  const matches = useMatches();
  const location = useLocation();
  const navigation = useNavigation();

  const rootNavSet = useMemo(() => new Set(rootNavItems.map((item) => normalizePath(item.path))), []);

  const { rootMeta, activeMeta } = useMemo(() => {
    let root: RootRouteMeta | undefined;
    let active: RouteMeta | undefined;

    for (const match of matches) {
      const meta = pickMeta(match.handle as RouteHandle | undefined);
      if (!meta) continue;
      if (meta.isRoot) {
        root = meta;
      }
      active = meta;
    }

    return { rootMeta: root, activeMeta: active };
  }, [matches]);

  useEffect(() => {
    const title = activeMeta?.title ?? rootMeta?.title;
    document.title = title ? `Infinity Othello | ${title}` : 'Infinity Othello';
  }, [activeMeta?.title, rootMeta?.title]);

  const shouldShowBottomNav = useMemo(() => {
    // 현재 활성 라우트가 hideBottomNav를 설정했으면 숨김
    if (activeMeta?.hideBottomNav) {
      return false;
    }

    if (!rootMeta || rootMeta.hideBottomNav) {
      return false;
    }
    const normalized = normalizePath(location.pathname);
    const rootSegment = getRootSegment(normalized);
    return rootNavSet.has(rootSegment);
  }, [location.pathname, rootMeta, activeMeta, rootNavSet]);

  const activeNavPath = rootMeta?.navPath;
  const isNavigating = navigation.state === 'loading';

  return (
    <AppShell>
      <div className="w-full overflow-x-hidden flex flex-col" style={{ height: '100dvh' }}>
        <div className="flex-1 min-h-0 relative">
          <Suspense fallback={<LoadingOverlay inline />}>
            <Outlet />
          </Suspense>
          {isNavigating && <LoadingOverlay />}
        </div>
        {shouldShowBottomNav && (
          <div className="flex-shrink-0">
            <BottomNav items={rootNavItems} activePath={activeNavPath} />
          </div>
        )}
      </div>
      <PWAUpdatePrompt />
      <PWAInstallPrompt />
    </AppShell>
  );
}
