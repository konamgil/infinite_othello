import React, { useState, useEffect } from 'react';
import { getThemeForFloor } from '../../../data/guardianLoader';

interface PreparationPhaseProps {
  floor: number;
  onComplete: () => void;
  onSkip?: () => void;
}

const STRATEGIC_PHASES = [
  'TACTICAL ANALYSIS INITIATED',
  'SCANNING DIMENSIONAL MATRIX',
  'CALCULATING VICTORY PROBABILITY',
  'SYNCHRONIZING NEURAL PATHWAYS'
];

/**
 * 전술 준비 단계 - 성숙한 SF 스타일
 * 
 * 홀로그램 타워의 세계관에 맞는 하이테크 준비 과정
 */
export function PreparationPhase({ floor, onComplete, onSkip }: PreparationPhaseProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const theme = getThemeForFloor(floor);

  useEffect(() => {
    // 단계별 진행
    const phaseTimer = setInterval(() => {
      setCurrentPhase(prev => (prev + 1) % STRATEGIC_PHASES.length);
    }, 1200); // 더 여유로운 메시지 전환

    // 진행도 애니메이션
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 2;
      });
    }, 60);

    const completeTimer = setTimeout(onComplete, 5000);

    return () => {
      clearInterval(phaseTimer);
      clearInterval(progressTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // 터치/클릭으로 스킵
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  return (
    <div 
      className="relative w-full h-full flex flex-col items-center justify-center cursor-pointer"
      onClick={handleSkip}
      onTouchStart={handleSkip}
    >
      {/* 배경 에너지 필드 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-blue-900/20 via-transparent to-transparent" />
        {/* 스캔라인 효과 */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent h-1"
          style={{ 
            animation: 'scan-line 2s infinite ease-in-out',
            top: `${(progress / 100) * 100}%`
          }}
        />
      </div>

      {/* 메인 컨테이너 */}
      <div className="relative z-10 text-center max-w-lg mx-auto px-8">
        
        {/* 층수 및 테마 표시 */}
        <div className="mb-12">
          <div className="text-6xl font-mono font-light text-white/90 mb-2">
            FLOOR {floor.toString().padStart(3, '0')}
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent mb-4" />
          <div className="text-cyan-300 font-mono text-sm tracking-[0.2em] uppercase">
            {theme?.name || 'UNKNOWN SECTOR'}
          </div>
        </div>

        {/* 홀로그램 인터페이스 */}
        <div className="mb-8">
          <div className="relative w-64 h-32 mx-auto border border-cyan-400/30 bg-black/40 backdrop-blur-sm">
            {/* 인터페이스 헤더 */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-cyan-400/20 border-b border-cyan-400/30">
              <div className="flex items-center justify-between px-2 h-full">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
                <div className="text-xs text-cyan-300 font-mono">TACTICAL.SYS</div>
              </div>
            </div>

            {/* 진행률 바 */}
            <div className="absolute top-6 left-2 right-2 mt-4">
              <div className="h-1 bg-cyan-900/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* 현재 단계 */}
            <div className="absolute bottom-4 left-2 right-2">
              <div className="text-cyan-300 font-mono text-xs text-left">
                &gt; {STRATEGIC_PHASES[currentPhase]}
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

        {/* 시스템 상태 */}
        <div className="grid grid-cols-3 gap-4 text-xs font-mono">
          <div className="text-green-400">
            <div className="text-white/60 mb-1">NEURAL LINK</div>
            <div>ACTIVE</div>
          </div>
          <div className="text-blue-400">
            <div className="text-white/60 mb-1">QUANTUM STATE</div>
            <div>STABLE</div>
          </div>
          <div className="text-yellow-400">
            <div className="text-white/60 mb-1">PROBABILITY</div>
            <div>{Math.floor(45 + (progress / 100) * 35)}%</div>
          </div>
        </div>

        {/* 데이터 스트림 */}
        <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-px h-4 bg-cyan-400/40 mb-1"
              style={{
                animation: `data-stream 1s infinite ease-in-out ${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        <div className="absolute -left-8 top-1/2 transform -translate-y-1/2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-px h-4 bg-cyan-400/40 mb-1"
              style={{
                animation: `data-stream 1s infinite ease-in-out ${i * 0.1 + 0.5}s`,
              }}
            />
          ))}
        </div>

        {/* 스킵 안내 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/60 backdrop-blur-sm border border-cyan-400/30 rounded-full px-4 py-2 animate-pulse">
            <div className="text-cyan-300 font-mono text-xs">
              TAP TO SKIP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}