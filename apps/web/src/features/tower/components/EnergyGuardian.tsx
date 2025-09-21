import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { haptic } from '../feedback/HapticFeedback';
import { GuardianTypewriter } from './GuardianTypewriter';
import { CosmicGuardian } from './CosmicGuardian';

interface EnergyGuardianProps {
  currentFloor: number;
  className?: string;
}

function getGuardianSpeech(floor: number, isEnergyFull: boolean): string[] {
  if (floor >= 300) {
    return ['마침내 정상에 도달했군요. 당신의 실력은 이제 전설이 되었습니다.'];
  }

  if (isEnergyFull) {
    return [
      '탑의 기운이 충만합니다. 이제 도전할 때입니다.',
      '우주의 힘이 당신과 함께하고 있습니다.',
      '완벽한 준비가 되었군요. 망설이지 마십시오.',
    ];
  }

  if (floor % 50 === 0) {
    return [
      `${floor}층의 보스가 기다리고 있습니다.`,
      '더 많은 기운을 모아 도전하십시오.',
    ];
  }

  return [
    '오델로의 탑에 온 것을 환영합니다.',
    '탑의 기운을 모아 힘을 기르십시오.',
    '전략과 인내가 승리의 열쇠입니다.',
  ];
}

export function EnergyGuardian({ currentFloor, className = '' }: EnergyGuardianProps) {
  const { player, updatePlayer } = useGameStore();

  // 탑의 기운 시스템 상태
  const [energyProgress, setEnergyProgress] = useState(0);
  const [isEnergyFull, setIsEnergyFull] = useState(false);
  const [lastEnergyTime, setLastEnergyTime] = useState(0);
  const [isCollecting, setIsCollecting] = useState(false);
  const [energyBonus, setEnergyBonus] = useState(50);

  // RP 애니메이션 상태
  const [showRpGain, setShowRpGain] = useState(false);
  const [animatingRp, setAnimatingRp] = useState(player.rp);
  const [previousRp, setPreviousRp] = useState(player.rp);
  const [showFlyingRp, setShowFlyingRp] = useState(false);

  // 탑의 기운 시스템 초기화 (테스트용: 즉시 100% 충전)
  useEffect(() => {
    // 테스트용: 즉시 100% 충전
    setEnergyProgress(100);
    setIsEnergyFull(true);
    setLastEnergyTime(Date.now());

    // 실제 구현시 아래 코드 사용:
    /*
    const savedEnergyTime = localStorage.getItem('towerEnergyTime');
    const savedProgress = localStorage.getItem('towerEnergyProgress');

    if (savedEnergyTime && savedProgress) {
      const lastTime = parseInt(savedEnergyTime);
      const currentTime = Date.now();
      const timeDiff = (currentTime - lastTime) / 1000; // 초 단위

      // 1시간(3600초)당 100% 충전
      const newProgress = Math.min(100, parseFloat(savedProgress) + (timeDiff / 36));
      setEnergyProgress(newProgress);
      setIsEnergyFull(newProgress >= 100);
      setLastEnergyTime(lastTime);
    } else {
      // 처음 방문 시
      setLastEnergyTime(Date.now());
      localStorage.setItem('towerEnergyTime', Date.now().toString());
      localStorage.setItem('towerEnergyProgress', '0');
    }
    */
  }, []);

  // 탑의 기운 충전 타이머
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const timeDiff = (currentTime - lastEnergyTime) / 1000;

      // 1시간(3600초)당 100% 충전
      const newProgress = Math.min(100, energyProgress + (timeDiff / 36));
      setEnergyProgress(newProgress);
      setIsEnergyFull(newProgress >= 100);

      // localStorage 업데이트
      localStorage.setItem('towerEnergyTime', currentTime.toString());
      localStorage.setItem('towerEnergyProgress', newProgress.toString());
      setLastEnergyTime(currentTime);
    }, 1000); // 1초마다 업데이트

    return () => clearInterval(interval);
  }, [energyProgress, lastEnergyTime]);

  // RP 카운터 애니메이션
  const animateRpCounter = (targetRp: number) => {
    const startRp = previousRp;
    const difference = targetRp - startRp;
    const duration = 1500; // 1.5초
    const steps = 60;
    const stepValue = difference / steps;
    let currentStep = 0;

    const counter = setInterval(() => {
      currentStep++;
      const newValue = Math.round(startRp + (stepValue * currentStep));
      setAnimatingRp(newValue);

      if (currentStep >= steps) {
        clearInterval(counter);
        setAnimatingRp(targetRp);
      }
    }, duration / steps);
  };

  // 에너지 수집 처리
  const handleEnergyCollect = () => {
    console.log('수집 버튼 클릭됨!', { isEnergyFull, isCollecting });

    if (!isEnergyFull || isCollecting) {
      console.log('수집 불가능:', { isEnergyFull, isCollecting });
      return;
    }

    console.log('수집 시작!');
    setIsCollecting(true);

    // 강한 햅틱 피드백 - 더 화려하게
    haptic.gameWin();
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 150, 50, 200, 50, 100]);
    }

    // 애니메이션 시퀀스
    setTimeout(() => {
      // 1단계: 에너지바에서 휘리리 RP 시작
      setShowFlyingRp(true);

      // 2단계: 1초 후 상단 RP 도착 + 카운터 애니메이션
      setTimeout(() => {
        const newRp = player.rp + energyBonus;
        setPreviousRp(player.rp);
        setShowRpGain(true);

        // RP 카운터 애니메이션
        animateRpCounter(newRp);

        // 실제 RP 업데이트
        updatePlayer({ rp: newRp });
        console.log('RP 보상 지급:', energyBonus);

        // 성공 햅틱
        if (navigator.vibrate) {
          navigator.vibrate([50, 30, 50]);
        }

        // 플라잉 애니메이션 숨기기
        setShowFlyingRp(false);

        // RP 증가 표시 숨기기
        setTimeout(() => {
          setShowRpGain(false);
        }, 2000);
      }, 1000);
    }, 1000);

    setTimeout(() => {
      // 에너지 초기화
      setEnergyProgress(0);
      setIsEnergyFull(false);
      setLastEnergyTime(Date.now());
      localStorage.setItem('towerEnergyTime', Date.now().toString());
      localStorage.setItem('towerEnergyProgress', '0');
    }, 1500);

    // 수집 완료 후 상태 복원
    setTimeout(() => {
      setIsCollecting(false);
      console.log('수집 완료!');
    }, 2500);
  };

  // RP 애니메이션 동기화
  useEffect(() => {
    setAnimatingRp(player.rp);
  }, [player.rp]);

  const guardianMessages = getGuardianSpeech(currentFloor, isEnergyFull);

  return (
    <div className={`relative z-10 w-full ${className}`}>
      <div className="w-full max-w-md mx-auto bg-black/40 backdrop-blur-md rounded-2xl p-3 relative overflow-hidden">
        {/* 가디언 에너지 보더 시스템 */}
        <div className="absolute inset-0 rounded-2xl">
          {/* 기본 보더 */}
          <div className="absolute inset-0 rounded-2xl border border-white/10" />
          
          {/* 에너지 보더 (진행률에 따라) */}
          <div 
            className="absolute inset-0 rounded-2xl border-2 transition-all duration-1000"
            style={{
              borderColor: isEnergyFull 
                ? 'rgba(6, 182, 212, 0.8)' 
                : `rgba(6, 182, 212, ${energyProgress * 0.006})`,
              boxShadow: isEnergyFull 
                ? '0 0 20px rgba(6, 182, 212, 0.6), inset 0 0 20px rgba(6, 182, 212, 0.1)'
                : `0 0 ${energyProgress * 0.2}px rgba(6, 182, 212, 0.4)`
            }}
          />

          {/* 에너지 충전 진행 오버레이 */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div 
              className={`absolute top-0 left-0 h-full transition-all duration-1000 ${
                isEnergyFull 
                  ? 'bg-gradient-to-r from-cyan-400/10 via-blue-500/15 to-purple-500/10'
                  : 'bg-gradient-to-r from-cyan-600/5 to-blue-600/5'
              }`}
              style={{ width: `${energyProgress}%` }}
            />
          </div>

          {/* 완충 시 펄스 효과 */}
          {isEnergyFull && (
            <>
              <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/60 animate-pulse" />
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400/20 via-blue-500/30 to-purple-500/20 blur animate-pulse" />
              
              {/* 코스믹 파티클 */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div className="absolute top-2 left-4 w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
                <div className="absolute top-6 right-8 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping delay-300" />
                <div className="absolute bottom-4 left-8 w-1 h-1 bg-purple-400 rounded-full animate-ping delay-700" />
                <div className="absolute bottom-2 right-4 w-1.5 h-1.5 bg-white rounded-full animate-ping delay-1000" />
              </div>
            </>
          )}
        </div>

        {/* 클릭 가능한 가디언 영역 */}
        <div 
          className={`flex items-center gap-3 relative z-10 ${
            isEnergyFull ? 'cursor-pointer' : 'cursor-default'
          } transition-all duration-300 ${
            isEnergyFull ? 'hover:scale-[1.02] active:scale-[0.98]' : ''
          }`}
          onClick={isEnergyFull ? handleEnergyCollect : undefined}
        >
          <div className="w-16 h-16 flex-shrink-0 relative">
            <CosmicGuardian className="w-full h-full" />
            
            {/* 가디언 주변 에너지 링 */}
            {isEnergyFull && (
              <div className="absolute inset-0 rounded-full">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-spin" style={{ animationDuration: '3s' }} />
                <div className="absolute inset-1 rounded-full border border-blue-400/30 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
              </div>
            )}

            {/* 수집 중 상태 표시 */}
            {isCollecting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="text-xs text-cyan-400 animate-pulse">⚡</div>
              </div>
            )}
          </div>

          <div className="flex-grow min-h-[4rem] flex flex-col justify-center">
            <GuardianTypewriter
              messages={guardianMessages}
              typingSpeed={80}
              pauseDuration={4000}
              className="text-white/90 text-left text-sm leading-relaxed font-smooth mb-2"
            />
            
            {/* 에너지 상태 텍스트 */}
            <div className="text-xs font-display transition-colors">
              {isEnergyFull ? (
                <span className="text-cyan-400 animate-pulse flex items-center gap-1">
                  <span>⚡ 충전 완료</span>
                  <span className="text-cyan-300">• +{energyBonus} RP</span>
                  <span className="text-white/60">• 탭하여 수집</span>
                </span>
              ) : (
                <span className="text-cyan-600/80 flex items-center gap-1">
                  <span className="flex items-center gap-0.5">
                    <span className="animate-bounce delay-0">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </span>
                  <span>충전중 {Math.round(energyProgress)}%</span>
                  <span className="text-white/40">
                    • {(() => {
                      const remainingTime = Math.ceil((100 - energyProgress) * 36);
                      const minutes = Math.floor(remainingTime / 60);
                      const seconds = remainingTime % 60;
                      if (minutes > 0) return `${minutes}분후`;
                      else if (seconds > 0) return `${seconds}초후`;
                      else return '완료임박';
                    })()}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 플라잉 RP 애니메이션 */}
        {showFlyingRp && (
          <div className="absolute left-16 top-8 pointer-events-none z-50">
            <div className="animate-bounce">
              <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                <span>+{energyBonus}</span>
                <div className="w-1 h-1 bg-yellow-400 rounded-full animate-ping" />
                <div className="w-1 h-1 bg-orange-400 rounded-full animate-ping delay-100" />
                <div className="w-1 h-1 bg-yellow-300 rounded-full animate-ping delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
