import React, { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';

import { router } from './router';
import { PWASplashScreen } from '../components/pwa/PWASplashScreen';

/**
 * The main application component.
 *
 * This component sets up the routing for the application using `react-router-dom`.
 * It renders the `RouterProvider` component, passing it the application's router configuration.
 * Also handles the PWA splash screen display on initial app load.
 *
 * @returns {React.ReactElement} The rendered `RouterProvider` component with splash screen.
 */
export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const [showHomeAnimation, setShowHomeAnimation] = useState(false);

  useEffect(() => {
    // PWA 환경 감지 (더 정확한 감지)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone ||
                  document.referrer.includes('android-app://') ||
                  window.location.search.includes('source=pwa');

    // 개발 중에는 항상 스플래시 표시 (테스트용)
    const isDev = import.meta.env.DEV;

    // PWA가 아니고 개발 모드가 아니면 스플래시 스킵
    if (!isPWA && !isDev) {
      setShowSplash(false);
      setAppReady(true);
      // 스플래시를 스킵하는 경우 즉시 애니메이션 활성화
      setShowHomeAnimation(true);
      return;
    }

    // PWA이거나 개발 모드인 경우 스플래시 표시 후 앱 로드
    // 더 부드러운 전환을 위해 로딩 시간 증가
    const timer = setTimeout(() => {
      setAppReady(true);
      
      // PWA 모드에서 주소창 숨기기 시도
      if (isPWA) {
        // iOS Safari에서 주소창 숨기기
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          window.scrollTo(0, 1);
        }
        
        // Android Chrome에서 주소창 숨기기
        if (/Android/.test(navigator.userAgent)) {
          setTimeout(() => {
            window.scrollTo(0, 1);
          }, 100);
        }
      }
    }, 500); // 100ms -> 500ms로 증가

    return () => clearTimeout(timer);
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    
    // 현재 경로가 홈 페이지인지 확인
    const isHomePage = window.location.pathname === '/' || window.location.pathname === '/home';
    
    if (isHomePage) {
      // 홈 페이지인 경우에만 진입 애니메이션 활성화
      setTimeout(() => {
        setShowHomeAnimation(true);
      }, 100);
    } else {
      // 다른 페이지인 경우 즉시 애니메이션 활성화
      setShowHomeAnimation(true);
    }
  };

  return (
    <>
      <PWASplashScreen
        isVisible={showSplash && appReady}
        onComplete={handleSplashComplete}
        duration={3000} // 3초 -> 2초로 단축 (MATRIX_LOAD만)
      />
      {!showSplash && appReady && (
        <div className={`transition-all duration-1000 ease-in-out ${
          showHomeAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </div>
      )}
    </>
  );
}
