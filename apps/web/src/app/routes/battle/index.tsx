import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { BattleHome } from './screens/BattleHome';
import { BattleMatchScreen } from './screens/BattleMatchScreen';
import { BattleTournamentScreen } from './screens/BattleTournamentScreen';

const GameRoutes = React.lazy(() => import('./game'));

export default function BattleRoutes() {
  return (
    <Routes>
      <Route index element={<BattleHome />} />
      <Route path="quick" element={<BattleMatchScreen mode="quick" />} />
      <Route path="ranked" element={<BattleMatchScreen mode="ranked" />} />
      <Route path="tournament" element={<BattleTournamentScreen />} />
      <Route path="game/*" element={<GameRoutes />} />
      <Route path="*" element={<BattleHome />} />
    </Routes>
  );
}
