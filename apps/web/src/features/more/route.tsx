import React from 'react';
import type { AppRouteObject, RouteMeta } from '../../app/router/meta';
import { Settings } from 'lucide-react';

import MoreScreen from './pages/index/page';
import ProfileScreen from './pages/profile/page';
import ReplayScreen from './pages/replay/page';
import SettingsHome from './pages/settings/index/page';
import ThemeSettingsScreen from './pages/settings/theme/page';

const MORE_META: RouteMeta = {
  isRoot: true,
  requiresAuth: false,
  title: '더보기',
  icon: Settings,
  navPath: '/more',
};

const MoreErrorBoundary = () => (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
    <h2 className="text-lg font-semibold text-white">추가 메뉴를 불러오지 못했습니다.</h2>
    <p className="text-sm text-white/60">잠시 후 다시 시도해 주세요.</p>
  </div>
);

const MoreNotFound = () => (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
    <h2 className="text-lg font-semibold text-white">해당 메뉴를 찾을 수 없습니다.</h2>
    <p className="text-sm text-white/60">목록에서 다시 선택해 주세요.</p>
  </div>
);

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

