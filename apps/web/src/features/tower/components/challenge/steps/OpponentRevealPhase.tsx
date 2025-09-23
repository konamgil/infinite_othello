import React, { useState, useEffect } from 'react';
import { haptic } from '../../../../../ui/feedback/HapticFeedback';

interface OpponentData {
  name: string;
  level: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'nightmare';
  specialty: string;
  winRate: number;
  specialAbility: string;
  avatar: string;
  quote: string;
}

interface OpponentRevealPhaseProps {
  floor: number;
  opponent: OpponentData;
  onComplete: () => void;
  onSkip?: () => void;
}

/**
 * 적대자 분석 단계 - 하이테크 스캐닝 시스템
 */
export function OpponentRevealPhase({ floor, opponent, onComplete, onSkip }: OpponentRevealPhaseProps) {
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScanPhase, setCurrentScanPhase] = useState('INITIALIZING');
  const [showProfile, setShowProfile] = useState(false);
  const [showThreatAssessment, setShowThreatAssessment] = useState(false);

  const scanPhases = [
    'INITIALIZING QUANTUM SCANNER',
    'DETECTING NEURAL PATTERNS', 
    'ANALYZING STRATEGIC MATRIX',
    'COMPILING THREAT PROFILE',
    'SCAN COMPLETE'
  ];

  useEffect(() => {
    haptic.bossEncounter();
    
    // 스캔 진행도 애니메이션
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2.5;
      });
    }, 100);

    // 스캔 단계 변경
    const phaseInterval = setInterval(() => {
      setCurrentScanPhase(prev => {
        const currentIndex = scanPhases.indexOf(prev);
        if (currentIndex < scanPhases.length - 1) {
          return scanPhases[currentIndex + 1];
        }
        clearInterval(phaseInterval);
        return prev;
      });
    }, 1200); // 더 천천히 스캔

    // 프로필 표시
    const profileTimer = setTimeout(() => setShowProfile(true), 3000);  // 더 늦게 표시
    const threatTimer = setTimeout(() => setShowThreatAssessment(true), 4500); // 더 늦게 표시
    const completeTimer = setTimeout(onComplete, 6000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(phaseInterval);
      clearTimeout(profileTimer);
      clearTimeout(threatTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const getDifficultyLevel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return { level: 'MINIMAL', color: 'text-green-400', bg: 'bg-green-400/20' };
      case 'medium': return { level: 'MODERATE', color: 'text-yellow-400', bg: 'bg-yellow-400/20' };
      case 'hard': return { level: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-400/20' };
      case 'nightmare': return { level: 'EXTREME', color: 'text-red-400', bg: 'bg-red-400/20' };
      default: return { level: 'UNKNOWN', color: 'text-gray-400', bg: 'bg-gray-400/20' };
    }
  };

  const difficultyInfo = getDifficultyLevel(opponent.difficulty);

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
      {/* 배경 스캔 효과 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-red-900/10 via-transparent to-transparent" />
        {/* 스캔 그리드 */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto px-8">
        
        {/* 스캔 헤더 */}
        <div className="mb-8">
          <div className="text-2xl font-mono font-light text-red-400 mb-2">
            HOSTILE ENTITY DETECTED
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-red-400 to-transparent mb-4" />
          <div className="text-cyan-300 font-mono text-sm tracking-[0.2em]">
            INITIATING COMBAT ANALYSIS
          </div>
        </div>

        {/* 메인 스캔 인터페이스 */}
        <div className="mb-8">
          <div className="relative w-full max-w-md mx-auto h-80 border border-red-400/30 bg-black/60 backdrop-blur-sm">
            
            {/* 스캔 진행률 */}
            <div className="absolute top-4 left-4 right-4">
              <div className="flex justify-between text-xs font-mono text-cyan-300 mb-2">
                <span>SCAN PROGRESS</span>
                <span>{Math.floor(scanProgress)}%</span>
              </div>
              <div className="h-1 bg-cyan-900/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-400 to-orange-400 transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>

            {/* 적대자 홀로그램 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* 홀로그램 프로젝션 */}
                <div className="w-24 h-24 flex items-center justify-center text-4xl relative">
                  <div 
                    className="absolute inset-0 bg-red-400/20 rounded-full"
                    style={{ animation: 'pulse 2s infinite' }}
                  />
                  <div className="relative z-10 filter brightness-125 contrast-125">
                    {opponent.avatar}
                  </div>
                  {/* 스캔 링 */}
                  <div 
                    className="absolute inset-0 border-2 border-red-400/50 rounded-full"
                    style={{ animation: 'spin 3s linear infinite' }}
                  />
                </div>

                {/* 스캔 데이터 포인트 */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-red-400/60"
                    style={{
                      left: `${50 + 40 * Math.cos(i * Math.PI / 3)}%`,
                      top: `${50 + 40 * Math.sin(i * Math.PI / 3)}%`,
                      animation: `scan-point 2s infinite ${i * 0.3}s`
                    }}
                  />
                ))}
              </div>
            </div>

            {/* 현재 스캔 단계 */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="text-red-300 font-mono text-xs">
                &gt; {currentScanPhase}
              </div>
            </div>

            {/* 홀로그램 노이즈 */}
            <div 
              className="absolute inset-0 bg-red-400/5 mix-blend-screen"
              style={{ animation: 'hologram-flicker 0.15s infinite' }}
            />
          </div>
        </div>

        {/* 적대자 프로필 */}
        {showProfile && (
          <div className="grid grid-cols-2 gap-6 mb-6 animate-[fade-in_0.5s_ease-out]">
            <div className="text-left">
              <div className="text-red-400 font-mono text-sm mb-2">ENTITY PROFILE</div>
              <div className="bg-black/40 border border-red-400/30 p-4 rounded">
                <div className="text-white font-mono text-lg mb-1">{opponent.name}</div>
                <div className="text-red-300 font-mono text-sm">COMBAT LEVEL: {opponent.level}</div>
                <div className="text-gray-400 font-mono text-xs mt-2">{opponent.specialty}</div>
              </div>
            </div>
            
            <div className="text-left">
              <div className="text-orange-400 font-mono text-sm mb-2">TACTICAL SPECS</div>
              <div className="bg-black/40 border border-orange-400/30 p-4 rounded">
                <div className="text-orange-300 font-mono text-sm mb-1">
                  ABILITY: {opponent.specialAbility}
                </div>
                <div className="text-orange-300 font-mono text-sm">
                  WIN RATE: {opponent.winRate}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 위협 평가 */}
        {showThreatAssessment && (
          <div className="animate-[fade-in_0.5s_ease-out]">
            <div className="text-center mb-4">
              <div className="text-yellow-400 font-mono text-sm mb-2">THREAT ASSESSMENT</div>
              <div className={`inline-block px-4 py-2 rounded border ${difficultyInfo.bg} ${difficultyInfo.color} border-current/40`}>
                <div className="font-mono font-bold">{difficultyInfo.level} THREAT</div>
              </div>
            </div>

            {/* 전투 준비 상태 */}
            <div className="text-cyan-300 font-mono text-sm">
              COMBAT SYSTEMS: READY
            </div>
          </div>
        )}

        {/* 데이터 스트림 */}
        <div className="absolute top-1/2 -left-4 transform -translate-y-1/2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-px h-2 bg-red-400/30 mb-1"
              style={{
                animation: `data-stream 1.5s infinite ease-in-out ${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        <div className="absolute top-1/2 -right-4 transform -translate-y-1/2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-px h-2 bg-red-400/30 mb-1"
              style={{
                animation: `data-stream 1.5s infinite ease-in-out ${i * 0.1 + 0.7}s`,
              }}
            />
          ))}
        </div>

        {/* 스킵 안내 제거됨 - 오른쪽 상단에 이미 있음 */}
      </div>
    </div>
  );
}