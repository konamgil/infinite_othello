import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { StellaHome } from './screens/StellaHome';
import { StellaMissions } from './screens/StellaMissions';
import { StellaStrategy } from './screens/StellaStrategy';
import { StellaPractice } from './screens/StellaPractice';

export default function StellaRoutes() {
  return (
    <Routes>
      <Route index element={<StellaHome />} />
      <Route path="missions" element={<StellaMissions />} />
      <Route path="strategy" element={<StellaStrategy />} />
      <Route path="practice" element={<StellaPractice />} />
      <Route path="*" element={<StellaHome />} />
    </Routes>
  );
}
