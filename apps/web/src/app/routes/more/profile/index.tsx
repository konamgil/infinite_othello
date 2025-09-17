import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProfileScreen } from './screens/ProfileScreen';

export default function ProfileRoutes() {
  return (
    <Routes>
      <Route index element={<ProfileScreen />} />
      <Route path="*" element={<ProfileScreen />} />
    </Routes>
  );
}
