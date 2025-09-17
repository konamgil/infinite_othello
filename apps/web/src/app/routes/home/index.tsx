import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomeScreen } from './screens/HomeScreen';

export default function HomeRoutes() {
  return (
    <Routes>
      <Route index element={<HomeScreen />} />
      <Route path="*" element={<HomeScreen />} />
    </Routes>
  );
}
