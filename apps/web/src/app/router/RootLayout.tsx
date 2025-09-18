import React, { Suspense, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useMatches, useNavigation } from 'react-router-dom';

import { AppShell } from '../../ui/common/AppShell';
import { BottomNav } from '../../ui/bottom-nav/BottomNav';
import type { RouteHandle, RouteMeta, RootRouteMeta } from './meta';
import { rootNavItems } from './rootRoutes';

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

const getRootSegment = (path: string) => {
  if (path === '/') return '/';
  const [, first = ''] = path.split('/');
  return first ? `/${first}` : '/';
};

const pickMeta = (handle?: RouteHandle): RouteMeta | undefined => handle?.meta;

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
    if (!rootMeta || rootMeta.hideBottomNav) {
      return false;
    }
    const normalized = normalizePath(location.pathname);
    const rootSegment = getRootSegment(normalized);
    return rootNavSet.has(rootSegment);
  }, [location.pathname, rootMeta, rootNavSet]);

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
    </AppShell>
  );
}
