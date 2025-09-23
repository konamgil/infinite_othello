import React, { useState, useEffect } from 'react';
import { haptic } from '../../../../../ui/feedback/HapticFeedback';

interface CountdownPhaseProps {
  onComplete: () => void;
  onSkip?: () => void;
}

/**
 * 전투 개시 카운트다운 - 군사적 스타일
 * 
 * 하이테크 전투 시스템의 최종 활성화 단계
 */
export function CountdownPhase({ onComplete, onSkip }: CountdownPhaseProps) {
  const [currentPhase, setCurrentPhase] = useState<3 | 2 | 1 | 'ENGAGE' | null>(3);
  // PREP 단계 제거로 인해 사용하지 않는 상태들
  const [animationKey, setAnimationKey] = useState(0);

  // PREP 단계 제거로 인해 사용하지 않는 메시지들

  useEffect(() => {
    const sequence: (3 | 2 | 1 | 'ENGAGE')[] = [3, 2, 1, 'ENGAGE'];
    let currentIndex = 0;

    const progressSequence = () => {
      if (currentIndex >= sequence.length) {
        setTimeout(onComplete, 500);
        return;
      }

      const current = sequence[currentIndex];
      setCurrentPhase(current);

      // PREP 단계 제거됨 - 바로 카운트다운 시작

      // 카운트다운 단계
      if (typeof current === 'number') {
        haptic.bossEncounter();
        if (navigator.vibrate) {
          const intensity = current === 1 ? [300, 100, 300] : [150, 50, 150];
          navigator.vibrate(intensity);
        }
        
        // 애니메이션 키 업데이트로 새로운 애니메이션 트리거
        setAnimationKey(prev => prev + 1);
        
        setTimeout(() => {
          currentIndex++;
          progressSequence();
        }, 1000); // 카운트다운 각 숫자 시간 단축
        return;
      }

      // 최종 교전 단계
      if (current === 'ENGAGE') {
        haptic.gameWin();
        if (navigator.vibrate) {
          navigator.vibrate([400, 100, 400, 100, 400]);
        }
        
        setTimeout(() => {
          currentIndex++;
          progressSequence();
        }, 1000); // ENGAGE 시간 단축
        return;
      }
    };

    progressSequence();
  }, [onComplete]);

  const getPhaseColor = (phase: 'PREP' | 3 | 2 | 1 | 'ENGAGE' | null) => {
    if (phase === 'ENGAGE') return 'text-green-400';
    if (phase === 1) return 'text-red-400';
    if (phase === 2) return 'text-yellow-400';
    if (phase === 3) return 'text-cyan-400';
    return 'text-white';
  };

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
      {/* 전투 준비 배경 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-orange-900/10 via-transparent to-transparent" />
        {/* 전술 그리드 */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,165,0,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,165,0,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        {/* 스캔라인 */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-400/20 to-transparent h-2"
          style={{ 
            animation: 'scan-line 3s infinite ease-in-out'
          }}
        />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto px-8">
        
        {/* PREP 단계 제거됨 */}

        {/* 카운트다운 단계 */}
        {typeof currentPhase === 'number' && (
          <div className="animate-[fade-in_0.3s_ease-out] flex flex-col items-center justify-center">
            <div className="text-orange-400 font-mono text-lg mb-4">
              COMBAT INITIATION IN
            </div>
            
            {/* 대형 카운트다운 숫자 */}
            <div className="relative mb-8 flex items-center justify-center w-full">
              <div 
                key={animationKey}
                className={`text-9xl font-mono font-black ${getPhaseColor(currentPhase)} filter drop-shadow-2xl animate-[countdown-pulse_0.8s_ease-out] text-center leading-none`}
                style={{
                  textShadow: `0 0 50px currentColor, 0 0 100px currentColor`,
                  minWidth: '200px',
                  minHeight: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {currentPhase}
              </div>
              
              {/* 카운트다운 링 */}
              <div 
                key={`ring-${animationKey}`}
                className={`absolute inset-0 border-4 ${currentPhase === 1 ? 'border-red-400' : currentPhase === 2 ? 'border-yellow-400' : 'border-cyan-400'} rounded-full opacity-50`}
                style={{
                  animation: 'countdown-ring 1s ease-out'
                }}
              />
              
              {/* 위험 표시 (1일 때) */}
              {currentPhase === 1 && (
                <div key={`danger-${animationKey}`} className="absolute inset-0 border-2 border-red-400/50 rounded-full animate-pulse" />
              )}
            </div>

            {/* 상태 메시지 */}
            <div className="text-white/80 font-mono text-sm">
              {currentPhase === 3 && "FINAL SYSTEMS CHECK"}
              {currentPhase === 2 && "WEAPONS ARMED"}
              {currentPhase === 1 && "COMBAT IMMINENT"}
            </div>
          </div>
        )}

        {/* 교전 개시 */}
        {currentPhase === 'ENGAGE' && (
          <div className="animate-[fade-in_0.3s_ease-out]">
            <div className="text-4xl font-mono font-black text-green-400 mb-4 animate-pulse">
              ENGAGE HOSTILE
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-green-400 to-transparent mb-6" />
            
            {/* 전투 상태 */}
            <div className="text-green-300 font-mono text-lg mb-4">
              ALL SYSTEMS OPERATIONAL
            </div>
            
            {/* 에너지 파동 효과 */}
            <div className="relative">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 border-2 border-green-400/30 rounded-full"
                  style={{
                    animation: `energy-wave 1.5s infinite ease-out ${i * 0.5}s`,
                    transform: `scale(${1 + i * 0.5})`
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 전술 데이터 스트림 */}
        <div className="absolute top-1/4 -left-8 transform -translate-y-1/2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="w-px h-3 bg-orange-400/40 mb-1"
              style={{
                animation: `data-stream 2s infinite ease-in-out ${i * 0.15}s`,
              }}
            />
          ))}
        </div>

        <div className="absolute top-1/4 -right-8 transform -translate-y-1/2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="w-px h-3 bg-orange-400/40 mb-1"
              style={{
                animation: `data-stream 2s infinite ease-in-out ${i * 0.15 + 1}s`,
              }}
            />
          ))}
        </div>

        {/* 스킵 안내 제거됨 - 오른쪽 상단에 이미 있음 */}
      </div>
    </div>
  );
}