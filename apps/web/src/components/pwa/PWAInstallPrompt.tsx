import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor, Zap, Shield } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

/**
 * PWA 설치 프롬프트 - SF 홀로그램 스타일
 * 
 * 타워 시스템의 홀로그램 테마에 맞춘 고급 설치 인터페이스
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    // PWA가 이미 설치되었는지 확인
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
      setIsInstalled(false);
    };

    checkInstalled();

    // beforeinstallprompt 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      
      // 로컬 스토리지에서 사용자가 이전에 거부했는지 확인
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        // 약간의 지연 후 프롬프트 표시
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
    };

    // appinstalled 이벤트 리스너
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 스캔 애니메이션
  useEffect(() => {
    if (showPrompt) {
      const interval = setInterval(() => {
        setScanProgress(prev => (prev + 1) % 100);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [showPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA 설치 승인됨');
      } else {
        console.log('PWA 설치 거부됨');
        localStorage.setItem('pwa-install-dismissed', 'true');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('PWA 설치 중 오류:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    
    // 7일 후 다시 표시
    const dismissTime = Date.now();
    localStorage.setItem('pwa-install-dismissed', dismissTime.toString());
  };

  // 이미 설치되었거나 프롬프트를 표시할 이유가 없으면 null 반환
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
      {/* 홀로그램 배경 효과 */}
      <div className="relative">
        {/* 에너지 필드 배경 */}
        <div className="absolute inset-0 bg-gradient-radial from-cyan-900/20 via-transparent to-transparent rounded-2xl" />
        
        {/* 스캔라인 효과 */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent h-1 rounded-2xl"
          style={{ 
            animation: 'scan-line 3s infinite ease-in-out',
            top: `${scanProgress}%`
          }}
        />
        
        {/* 홀로그램 노이즈 */}
        <div 
          className="absolute inset-0 bg-cyan-400/5 rounded-2xl"
          style={{ 
            animation: 'hologram-flicker 0.1s infinite',
            mixBlendMode: 'screen'
          }}
        />

        {/* 메인 컨테이너 */}
        <div className="relative bg-black/80 backdrop-blur-xl border border-cyan-400/30 rounded-2xl p-6 shadow-2xl">
          {/* 홀로그램 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center relative">
                <Download className="w-6 h-6 text-white" />
                {/* 홀로그램 글로우 */}
                <div className="absolute inset-0 bg-cyan-400/30 rounded-xl animate-pulse" />
              </div>
              <div>
                <h3 className="text-cyan-300 font-mono text-lg font-semibold">
                  SYSTEM INSTALLATION
                </h3>
                <div className="text-cyan-400/60 font-mono text-xs">
                  INFINITY OTHELLO v2.0
                </div>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="text-cyan-400/60 hover:text-cyan-300 transition-colors duration-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 홀로그램 인터페이스 */}
          <div className="mb-6">
            <div className="relative w-full h-24 border border-cyan-400/30 bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden">
              {/* 인터페이스 헤더 */}
              <div className="absolute top-0 left-0 right-0 h-6 bg-cyan-400/20 border-b border-cyan-400/30">
                <div className="flex items-center justify-between px-3 h-full">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                  <div className="text-xs text-cyan-300 font-mono">INSTALL.SYS</div>
                </div>
              </div>

              {/* 설치 진행률 */}
              <div className="absolute top-6 left-3 right-3 mt-4">
                <div className="h-1 bg-cyan-900/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-300"
                    style={{ width: `${(scanProgress / 100) * 80 + 20}%` }}
                  />
                </div>
              </div>

              {/* 시스템 상태 */}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-cyan-300 font-mono text-xs">
                  &gt; PREPARING NEURAL INTERFACE...
                </div>
              </div>

              {/* 홀로그램 노이즈 */}
              <div 
                className="absolute inset-0 bg-cyan-400/5"
                style={{ 
                  animation: 'hologram-flicker 0.1s infinite',
                  mixBlendMode: 'screen'
                }}
              />
            </div>
          </div>

          {/* 시스템 정보 */}
          <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-6">
            <div className="text-green-400">
              <div className="text-cyan-400/60 mb-1">NEURAL LINK</div>
              <div>OPTIMIZED</div>
            </div>
            <div className="text-blue-400">
              <div className="text-cyan-400/60 mb-1">QUANTUM STATE</div>
              <div>STABLE</div>
            </div>
            <div className="text-yellow-400">
              <div className="text-cyan-400/60 mb-1">PERFORMANCE</div>
              <div>ENHANCED</div>
            </div>
            <div className="text-purple-400">
              <div className="text-cyan-400/60 mb-1">SECURITY</div>
              <div>ACTIVE</div>
            </div>
          </div>

          {/* 기능 표시 */}
          <div className="flex items-center justify-center gap-6 text-xs text-cyan-400/80 mb-6">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span className="font-mono">MOBILE OPTIMIZED</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="font-mono">OFFLINE MODE</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="font-mono">SECURE</span>
            </div>
          </div>
          
          {/* 액션 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-mono font-medium py-3 px-6 rounded-lg transition-all duration-200 text-sm relative overflow-hidden"
            >
              {/* 버튼 글로우 효과 */}
              <div className="absolute inset-0 bg-cyan-400/20 animate-pulse" />
              <span className="relative z-10">INITIATE INSTALLATION</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-6 py-3 text-cyan-400/60 hover:text-cyan-300 transition-colors duration-200 text-sm font-mono border border-cyan-400/30 rounded-lg hover:border-cyan-400/50"
            >
              DEFER
            </button>
          </div>

          {/* 데이터 스트림 효과 */}
          <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-px h-3 bg-cyan-400/40 mb-1"
                style={{
                  animation: `data-stream 2s infinite ease-in-out ${i * 0.2}s`,
                }}
              />
            ))}
          </div>

          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-px h-3 bg-cyan-400/40 mb-1"
                style={{
                  animation: `data-stream 2s infinite ease-in-out ${i * 0.2 + 1}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
