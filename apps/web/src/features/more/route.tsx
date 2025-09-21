import React from 'react';
import type { AppRouteObject, RouteMeta } from '../../app/router/meta';
import { Settings } from 'lucide-react';

import MoreScreen from './pages/index/page';
import ProfileScreen from './pages/profile/page';
import ReplayScreen from './pages/replay/page';
import SettingsHome from './pages/settings/index/page';
import ThemeSettingsScreen from './pages/settings/theme/page';

/**
 * Metadata for the root of the "more" feature.
 * This is used for the main '/more' route.
 */
const MORE_META: RouteMeta = {
  isRoot: true,
  requiresAuth: false,
  title: '더보기',
  icon: Settings,
  navPath: '/more',
};

/**
 * An error boundary component for the "more" feature.
 *
 * This is displayed if an error occurs while rendering any of the "more" screens.
 *
 * @returns {React.ReactElement} The rendered error boundary UI.
 */
const MoreErrorBoundary = () => (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
    <h2 className="text-lg font-semibold text-white">추가 메뉴를 불러오지 못했습니다.</h2>
    <p className="text-sm text-white/60">잠시 후 다시 시도해 주세요.</p>
  </div>
);

/**
 * A component to display when a specific page within the "more" feature is not found.
 *
 * @returns {React.ReactElement} The rendered "not found" UI for the "more" feature.
 */
const MoreNotFound = () => (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
    <h2 className="text-lg font-semibold text-white">해당 메뉴를 찾을 수 없습니다.</h2>
    <p className="text-sm text-white/60">목록에서 다시 선택해 주세요.</p>
  </div>
);

/**
 * The main route object for the "more" feature.
 *
 * This object defines the layout and all sub-routes for the "more" section,
 * which includes the main menu, profile, replays, and settings pages.
 */
export const moreRoute: AppRouteObject = {
  id: 'more-root',
  path: 'more',
  handle: { meta: MORE_META },
  errorElement: <MoreErrorBoundary />,
  children: [
    {
      index: true,
      element: <MoreScreen />,
      handle: { meta: MORE_META },
    },
    {
      path: 'profile',
      element: <ProfileScreen />,
      handle: { meta: { ...MORE_META, hideBottomNav: true, title: '프로필' } },
    },
    {
      path: 'replay',
      element: <ReplayScreen />,
      handle: { meta: { ...MORE_META, hideBottomNav: true, title: '리플레이' } },
    },
    {
      path: 'settings',
      element: <SettingsHome />,
      handle: { meta: { ...MORE_META, hideBottomNav: true, title: '설정' } },
    },
    {
      path: 'settings/theme',
      element: <ThemeSettingsScreen />,
      handle: { meta: { ...MORE_META, hideBottomNav: true, title: '테마 설정' } },
    },
    {
      path: '*',
      element: <MoreNotFound />,
      handle: { meta: { ...MORE_META, hideBottomNav: true, title: '메뉴 없음' } },
    },
  ],
};

export default moreRoute;

