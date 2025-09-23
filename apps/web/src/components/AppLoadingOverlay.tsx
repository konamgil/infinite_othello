import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AppLoadingOverlayProps {
  onComplete: () => void;
}

/**
 * 앱 진입 시 부드러운 전환을 위한 로딩 오버레이
 * 스플래시에서 메인 화면으로의 자연스러운 전환을 제공
 */
export function AppLoadingOverlay({ onComplete }: AppLoadingOverlayProps) {
  const [phase, setPhase] = useState<'loading' | 'transitioning' | 'complete'>('loading');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 로딩 시뮬레이션 (실제로는 필요한 리소스 로딩 시간에 맞춤)
    const loadingSequence = [
      { delay: 0, progress: 20, phase: 'loading' as const },
      { delay: 800, progress: 50, phase: 'loading' as const },
      { delay: 1600, progress: 80, phase: 'loading' as const },
      { delay: 2400, progress: 100, phase: 'transitioning' as const },
      { delay: 3000, progress: 100, phase: 'complete' as const }
    ];

    const timers = loadingSequence.map(({ delay, progress: targetProgress, phase: targetPhase }) =>
      setTimeout(() => {
        setProgress(targetProgress);
        setPhase(targetPhase);
        
        if (targetPhase === 'complete') {
          onComplete();
        }
      }, delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      {/* 우주 배경 */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/30 via-purple-900/20 to-black" />
      
      {/* 별빛 파티클 */}
      <div className="absolute inset-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 text-center">
        {/* 로고/타이틀 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 animate-pulse">
            Infinity Othello
          </h1>
          <p className="text-cyan-300 text-sm font-mono tracking-wider">
            무한의 오델로 세계에 오신 것을 환영합니다
          </p>
        </div>

        {/* 로딩 바 */}
        <div className="w-64 mx-auto mb-4">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 로딩 상태 텍스트 */}
        <div className="text-cyan-300 text-sm font-mono">
          {phase === 'loading' && '시스템 초기화 중...'}
          {phase === 'transitioning' && '게임 세계로 이동 중...'}
        </div>

        {/* 홀로그램 효과 */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent h-1"
            style={{ 
              animation: 'scan-line 2s infinite ease-in-out',
              top: `${progress}%`
            }}
          />
        </div>
      </div>

      {/* 전환 시 페이드 아웃 효과 */}
      {phase === 'transitioning' && (
        <div className="absolute inset-0 bg-black transition-opacity duration-1000 opacity-0 animate-fade-in" />
      )}
    </div>
  );
}
