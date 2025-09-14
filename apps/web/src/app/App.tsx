import React, { Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "../ui/common/AppShell";
import { BottomNav } from "../ui/bottom-nav/BottomNav";

// 페이지 컴포넌트들 (lazy loading)
const Home = React.lazy(() => import("./routes/Home"));
const Tower = React.lazy(() => import("./routes/Tower"));
const Battle = React.lazy(() => import("./routes/Battle"));
const Stella = React.lazy(() => import("./routes/Stella"));
const More = React.lazy(() => import("./routes/More"));
const Game = React.lazy(() => import("./routes/Game"));
const Settings = React.lazy(() => import("./routes/Settings"));

// 로딩 컴포넌트
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-tower-gold-400 border-t-transparent"></div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
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
              </Routes>
            </Suspense>
          </div>

          {/* 바텀 네비게이션 - 고정 위치 */}
          <div className="flex-shrink-0">
            <BottomNav />
          </div>
        </div>
      </AppShell>
    </BrowserRouter>
  );
}
