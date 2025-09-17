import React, { Suspense } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "../ui/common/AppShell";
import { BottomNav } from "../ui/bottom-nav/BottomNav";

const HomeRoutes = React.lazy(() => import('./routes/home'));
const TowerRoutes = React.lazy(() => import('./routes/tower'));
const BattleRoutes = React.lazy(() => import('./routes/battle'));
const StellaRoutes = React.lazy(() => import('./routes/stella'));
const MoreRoutes = React.lazy(() => import('./routes/more'));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-tower-gold-400 border-t-transparent" />
    </div>
  );
}

const bottomNavRootPaths = new Set([
  '/',
  '/home',
  '/tower',
  '/battle',
  '/stella',
  '/more'
]);

function AppContent() {
  const location = useLocation();
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  const rootSegment = normalizedPath === '/' ? '/' : `/${normalizedPath.split('/')[1] ?? ''}`;
  const shouldShowBottomNav = bottomNavRootPaths.has(rootSegment) && normalizedPath === rootSegment;

  return (
    <AppShell>
      <div className="w-full overflow-x-hidden flex flex-col" style={{ height: '100dvh' }}>
        <div className="flex-1 min-h-0">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<HomeRoutes />} />
              <Route path="/tower/*" element={<TowerRoutes />} />
              <Route path="/battle/*" element={<BattleRoutes />} />
              <Route path="/stella/*" element={<StellaRoutes />} />
              <Route path="/more/*" element={<MoreRoutes />} />
              <Route path="*" element={<HomeRoutes />} />
            </Routes>
          </Suspense>
        </div>

        {shouldShowBottomNav && (
          <div className="flex-shrink-0">
            <BottomNav />
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
