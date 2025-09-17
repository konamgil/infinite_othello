import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { GameScreen } from './screens/GameScreen';

export default function GameRoutes() {
  return (
    <Routes>
      <Route index element={<GameScreen />} />
      <Route path=":mode" element={<GameScreen />} />
      <Route path=":mode/:detail" element={<GameScreen />} />
      <Route path="*" element={<GameScreen />} />
    </Routes>
  );
}
