import React, { useState, useEffect } from 'react';
import { RefreshCw, X, Check, Zap, Database, Shield } from 'lucide-react';

/**
 * PWA 업데이트 프롬프트 - SF 홀로그램 스타일
 * 
 * 타워 시스템의 홀로그램 테마에 맞춘 고급 업데이트 인터페이스
 */
export function PWAUpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [systemStatus, setSystemStatus] = useState<string[]>([]);

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

  // 업데이트 진행 애니메이션
  useEffect(() => {
    if (updating) {
      const interval = setInterval(() => {
        setUpdateProgress(prev => {
          if (prev >= 100) return 100;
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [updating]);

  // 시스템 상태 메시지
  useEffect(() => {
    if (updating) {
      const messages = [
        'DOWNLOADING QUANTUM PATCHES...',
        'UPDATING NEURAL NETWORKS...',
        'SYNCHRONIZING DATA MATRIX...',
        'OPTIMIZING PERFORMANCE...',
        'FINALIZING INSTALLATION...'
      ];
      
      let currentIndex = 0;
      const interval = setInterval(() => {
        setSystemStatus(prev => {
          if (currentIndex < messages.length) {
            return [...prev, messages[currentIndex]];
          }
          return prev;
        });
        currentIndex++;
      }, 800);
      
      return () => clearInterval(interval);
    }
  }, [updating]);

  const handleUpdate = async () => {
    if (!registration || !registration.waiting) return;

    setUpdating(true);
    
    // 새 서비스 워커에게 설치 완료 신호 전송
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // 페이지 새로고침
    setTimeout(() => {
      window.location.reload();
    }, 4000);
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-500">
      {/* 홀로그램 배경 효과 */}
      <div className="relative">
        {/* 에너지 필드 배경 */}
        <div className="absolute inset-0 bg-gradient-radial from-green-900/20 via-transparent to-transparent rounded-2xl" />
        
        {/* 스캔라인 효과 */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/20 to-transparent h-1 rounded-2xl"
          style={{ 
            animation: 'scan-line 2s infinite ease-in-out',
            top: `${updateProgress}%`
          }}
        />
        
        {/* 홀로그램 노이즈 */}
        <div 
          className="absolute inset-0 bg-green-400/5 rounded-2xl"
          style={{ 
            animation: 'hologram-flicker 0.1s infinite',
            mixBlendMode: 'screen'
          }}
        />

        {/* 메인 컨테이너 */}
        <div className="relative bg-black/80 backdrop-blur-xl border border-green-400/30 rounded-2xl p-6 shadow-2xl">
          {/* 홀로그램 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center relative">
                {updating ? (
                  <RefreshCw className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Check className="w-6 h-6 text-white" />
                )}
                {/* 홀로그램 글로우 */}
                <div className="absolute inset-0 bg-green-400/30 rounded-xl animate-pulse" />
              </div>
              <div>
                <h3 className="text-green-300 font-mono text-lg font-semibold">
                  {updating ? 'SYSTEM UPDATE' : 'UPDATE AVAILABLE'}
                </h3>
                <div className="text-green-400/60 font-mono text-xs">
                  INFINITY OTHELLO v2.1
                </div>
              </div>
            </div>
            
            {!updating && (
              <button
                onClick={handleDismiss}
                className="text-green-400/60 hover:text-green-300 transition-colors duration-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* 홀로그램 인터페이스 */}
          <div className="mb-6">
            <div className="relative w-full h-24 border border-green-400/30 bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden">
              {/* 인터페이스 헤더 */}
              <div className="absolute top-0 left-0 right-0 h-6 bg-green-400/20 border-b border-green-400/30">
                <div className="flex items-center justify-between px-3 h-full">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                  <div className="text-xs text-green-300 font-mono">UPDATE.SYS</div>
                </div>
              </div>

              {/* 업데이트 진행률 */}
              <div className="absolute top-6 left-3 right-3 mt-4">
                <div className="h-1 bg-green-900/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all duration-300"
                    style={{ width: `${updateProgress}%` }}
                  />
                </div>
              </div>

              {/* 현재 상태 */}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-green-300 font-mono text-xs">
                  {updating 
                    ? `> ${systemStatus[systemStatus.length - 1] || 'INITIALIZING...'}`
                    : '> READY FOR QUANTUM UPDATE'
                  }
                </div>
              </div>

              {/* 홀로그램 노이즈 */}
              <div 
                className="absolute inset-0 bg-green-400/5"
                style={{ 
                  animation: 'hologram-flicker 0.1s infinite',
                  mixBlendMode: 'screen'
                }}
              />
            </div>
          </div>

          {/* 시스템 상태 */}
          <div className="grid grid-cols-3 gap-4 text-xs font-mono mb-6">
            <div className="text-green-400">
              <div className="text-green-400/60 mb-1">NEURAL LINK</div>
              <div>{updating ? 'UPDATING' : 'STABLE'}</div>
            </div>
            <div className="text-blue-400">
              <div className="text-green-400/60 mb-1">QUANTUM STATE</div>
              <div>{updating ? 'SYNCING' : 'READY'}</div>
            </div>
            <div className="text-yellow-400">
              <div className="text-green-400/60 mb-1">PERFORMANCE</div>
              <div>{updating ? 'OPTIMIZING' : 'ENHANCED'}</div>
            </div>
          </div>

          {/* 업데이트 내용 */}
          {!updating && (
            <div className="mb-6">
              <div className="text-green-300 font-mono text-sm mb-3">UPDATE CONTENTS:</div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-green-400/80">
                  <Zap className="w-3 h-3" />
                  <span>Enhanced Tower AI algorithms</span>
                </div>
                <div className="flex items-center gap-2 text-green-400/80">
                  <Database className="w-3 h-3" />
                  <span>Improved data synchronization</span>
                </div>
                <div className="flex items-center gap-2 text-green-400/80">
                  <Shield className="w-3 h-3" />
                  <span>Security patches applied</span>
                </div>
              </div>
            </div>
          )}

          {/* 업데이트 로그 */}
          {updating && systemStatus.length > 0 && (
            <div className="mb-6">
              <div className="text-green-300 font-mono text-sm mb-3">UPDATE LOG:</div>
              <div className="space-y-1 text-xs font-mono max-h-20 overflow-y-auto">
                {systemStatus.map((status, i) => (
                  <div key={i} className="text-green-400/80 animate-fade-in">
                    &gt; {status}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 액션 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleUpdate}
              disabled={updating}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono font-medium py-3 px-6 rounded-lg transition-all duration-200 text-sm relative overflow-hidden"
            >
              {/* 버튼 글로우 효과 */}
              <div className="absolute inset-0 bg-green-400/20 animate-pulse" />
              <span className="relative z-10">
                {updating ? 'UPDATING...' : 'INITIATE UPDATE'}
              </span>
            </button>
            {!updating && (
              <button
                onClick={handleDismiss}
                className="px-6 py-3 text-green-400/60 hover:text-green-300 transition-colors duration-200 text-sm font-mono border border-green-400/30 rounded-lg hover:border-green-400/50"
              >
                DEFER
              </button>
            )}
          </div>

          {/* 데이터 스트림 효과 */}
          <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-px h-3 bg-green-400/40 mb-1"
                style={{
                  animation: `data-stream 1.5s infinite ease-in-out ${i * 0.15}s`,
                }}
              />
            ))}
          </div>

          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-px h-3 bg-green-400/40 mb-1"
                style={{
                  animation: `data-stream 1.5s infinite ease-in-out ${i * 0.15 + 0.75}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
