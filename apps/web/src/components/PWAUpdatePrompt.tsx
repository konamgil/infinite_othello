import React, { useState, useEffect } from 'react';
import { RefreshCw, X, Check } from 'lucide-react';

export function PWAUpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // 업데이트 확인
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      });

      // 페이지 로드 시 업데이트 확인
      navigator.serviceWorker.ready.then((reg) => {
        reg.update();
      });
    }
  }, []);

  const handleUpdate = async () => {
    if (!registration || !registration.waiting) return;

    setUpdating(true);
    
    // 새 서비스 워커에게 설치 완료 신호 전송
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // 페이지 새로고침
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-gradient-to-r from-green-900/95 to-emerald-900/95 backdrop-blur-xl border border-green-500/30 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              {updating ? (
                <RefreshCw className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Check className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-lg mb-1">
              {updating ? '업데이트 중...' : '새 버전 사용 가능'}
            </h3>
            <p className="text-gray-300 text-sm mb-3">
              {updating 
                ? '새로운 기능과 개선사항을 적용하고 있습니다.'
                : '더 나은 성능과 새로운 기능을 위해 앱을 업데이트하세요.'
              }
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 text-sm"
              >
                {updating ? '업데이트 중...' : '지금 업데이트'}
              </button>
              {!updating && (
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  나중에
                </button>
              )}
            </div>
          </div>
          
          {!updating && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
