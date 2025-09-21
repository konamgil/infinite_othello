import type { LucideIcon } from 'lucide-react';
import type { RouteObject } from 'react-router-dom';

/**
 * Base metadata for a route.
 * This type defines common properties that can be applied to any route.
 */
export type BaseRouteMeta = {
  /** If true, the bottom navigation bar will be hidden for this route. */
  hideBottomNav?: boolean;
  /** If true, this route requires authentication. */
  requiresAuth?: boolean;
  /** An array of strings representing the breadcrumb trail for this route. */
  breadcrumb?: string[];
};

/**
 * Metadata for a root-level route.
 * Root routes are the main sections of the application, typically displayed in the bottom navigation.
 */
export type RootRouteMeta = BaseRouteMeta & {
  /** A flag indicating that this is a root route. */
  isRoot: true;
  /** The title of the route, used for the page title and navigation. */
  title: string;
  /** The icon component for the route, used in navigation. */
  icon: LucideIcon;
  /** The navigation path for the route, used to determine the active state in navigation. */
  navPath: string;
};

/**
 * Metadata for a child route.
 * Child routes are nested within root routes.
 */
export type ChildRouteMeta = BaseRouteMeta & {
  /** A flag indicating that this is not a root route. */
  isRoot?: false;
  /** The title of the route. If not provided, the title of the parent root route may be used. */
  title?: string;
  /** The icon for the route. */
  icon?: LucideIcon;
  /** The navigation path for the route. */
  navPath?: string;
};

/**
 * A union type representing the metadata for any route, which can be either a root or a child route.
 */
export type RouteMeta = RootRouteMeta | ChildRouteMeta;

/**
 * The handle object for a route in `react-router-dom`.
 * It contains the `meta` object and allows for other custom properties.
 */
export type RouteHandle = {
  /** The metadata for the route. */
  meta?: RouteMeta;
  /** Allows for other custom properties to be added to the handle. */
  [key: string]: unknown;
};

/**
 * An extended `RouteObject` from `react-router-dom` that includes the custom `RouteHandle`.
 * This allows for attaching application-specific metadata to each route definition.
 */
export type AppRouteObject = RouteObject & {
  /** The handle containing custom metadata for the route. */
  handle?: RouteHandle;
};
