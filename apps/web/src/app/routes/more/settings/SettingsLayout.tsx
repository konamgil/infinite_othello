import React from 'react';
import { Outlet } from 'react-router-dom';
import { SettingsStarCanvas } from '../../../../ui/settings/SettingsStarCanvas';

export function SettingsLayout() {
  return (
    <div className="h-full w-full overflow-hidden relative">
      <div className="absolute inset-0">
        <SettingsStarCanvas className="w-full h-full" />
      </div>

      <div className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain">
        <div className="content-padding section-spacing pb-32">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
