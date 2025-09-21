import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./ui/theme/globals.css";
import "./ui/effects/animations.css";

// PWA 서비스 워커 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ PWA Service Worker 등록 성공:', registration);
        
        // 업데이트 확인
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 새 PWA 버전 사용 가능');
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('❌ PWA Service Worker 등록 실패:', registrationError);
      });
  });
}

const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

