import type { LucideIcon } from 'lucide-react';

import { homeRoute } from '../../features/home/route';
import { battleRoute } from '../../features/battle/route';
import { towerRoute } from '../../features/tower/route';
import { stellaRoute } from '../../features/stella/route';
import { moreRoute } from '../../features/more/route';
import type { AppRouteObject, RouteMeta } from './meta';

export const appRootChildren: AppRouteObject[] = [
  homeRoute,
  battleRoute,
  towerRoute,
  stellaRoute,
  moreRoute,
];

type NavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
};

const extractNavItem = (route: AppRouteObject): NavItem | null => {
  const meta = (route.handle as { meta?: RouteMeta } | undefined)?.meta;
  if (meta?.isRoot !== true) {
    return null;
  }

  return {
    path: meta.navPath,
    label: meta.title,
    icon: meta.icon,
  };
};

export const rootNavItems: NavItem[] = appRootChildren
  .map(extractNavItem)
  .filter((item): item is NavItem => item !== null);
