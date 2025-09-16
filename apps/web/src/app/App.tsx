import React, { Suspense } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "../ui/common/AppShell";
import { BottomNav } from "../ui/bottom-nav/BottomNav";

import { useGameStore } from "../store/gameStore";

// 페이지 컴포넌트들 (lazy loading)
const Home = React.lazy(() => import("./routes/Home"));
const Tower = React.lazy(() => import("./routes/Tower"));
const Battle = React.lazy(() => import("./routes/Battle"));
const Stella = React.lazy(() => import("./routes/Stella"));
const More = React.lazy(() => import("./routes/More"));
const Game = React.lazy(() => import("./routes/Game"));
const Settings = React.lazy(() => import("./routes/Settings"));
const Replay = React.lazy(() => import("./routes/Replay"));

// 로딩 컴포넌트
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-tower-gold-400 border-t-transparent"></div>
    </div>
  );
}

// 바텀 네비게이션을 숨길 페이지들
const hideBottomNavPaths = ['/settings', '/game', '/replay'];

function AppContent() {
  const location = useLocation();
  const shouldShowBottomNav = !hideBottomNavPaths.includes(location.pathname);

  return (
    <AppShell>
      <div className="w-full overflow-x-hidden flex flex-col" style={{ height: '100dvh' }}>
        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 min-h-0">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tower" element={<Tower />} />
              <Route path="/battle" element={<Battle />} />
              <Route path="/stella" element={<Stella />} />
              <Route path="/more" element={<More />} />
              <Route path="/game" element={<Game />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/replay" element={<Replay />} />
            </Routes>
          </Suspense>
        </div>

        {/* 바텀 네비게이션 - 조건부 표시 */}
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
