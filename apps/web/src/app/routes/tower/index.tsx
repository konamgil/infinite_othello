import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { TowerScreen } from './screens/TowerScreen';

const GameRoutes = React.lazy(() => import('../battle/game'));

export default function TowerRoutes() {
  return (
    <Routes>
      <Route index element={<TowerScreen />} />
      <Route path="game/*" element={<GameRoutes />} />
      <Route path="*" element={<TowerScreen />} />
    </Routes>
  );
}
