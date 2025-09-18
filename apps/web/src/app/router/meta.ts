import type { LucideIcon } from 'lucide-react';
import type { RouteObject } from 'react-router-dom';

export type BaseRouteMeta = {
  hideBottomNav?: boolean;
  requiresAuth?: boolean;
  breadcrumb?: string[];
};

export type RootRouteMeta = BaseRouteMeta & {
  isRoot: true;
  title: string;
  icon: LucideIcon;
  navPath: string;
};

export type ChildRouteMeta = BaseRouteMeta & {
  isRoot?: false;
  title?: string;
  icon?: LucideIcon;
  navPath?: string;
};

export type RouteMeta = RootRouteMeta | ChildRouteMeta;

export type RouteHandle = {
  meta?: RouteMeta;
  [key: string]: unknown;
};

export type AppRouteObject = RouteObject & {
  handle?: RouteHandle;
};
