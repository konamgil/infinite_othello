import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MoreScreen } from './screens/MoreScreen';

const SettingsRoutes = React.lazy(() => import('./settings'));
const ReplayRoutes = React.lazy(() => import('./replay'));
const ProfileRoutes = React.lazy(() => import('./profile'));

export default function MoreRoutes() {
  return (
    <Routes>
      <Route index element={<MoreScreen />} />
      <Route path="settings/*" element={<SettingsRoutes />} />
      <Route path="replay/*" element={<ReplayRoutes />} />
      <Route path="profile/*" element={<ProfileRoutes />} />
      <Route path="*" element={<MoreScreen />} />
    </Routes>
  );
}
