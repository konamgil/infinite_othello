import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ReplayScreen } from './screens/ReplayScreen';

export default function ReplayRoutes() {
  return (
    <Routes>
      <Route index element={<ReplayScreen />} />
      <Route path="*" element={<ReplayScreen />} />
    </Routes>
  );
}
