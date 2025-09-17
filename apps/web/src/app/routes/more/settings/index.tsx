import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SettingsLayout } from './SettingsLayout';
import { SettingsHome } from './screens/SettingsHome';
import { ThemeSettingsScreen } from './screens/ThemeSettingsScreen';

export default function SettingsRoutes() {
  return (
    <Routes>
      <Route element={<SettingsLayout />}>
        <Route index element={<SettingsHome />} />
        <Route path="theme" element={<ThemeSettingsScreen />} />
        <Route path="*" element={<SettingsHome />} />
      </Route>
    </Routes>
  );
}
