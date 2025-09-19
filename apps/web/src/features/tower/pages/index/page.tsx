import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../../../store/gameStore';
import { haptic } from '../../../../ui/feedback/HapticFeedback';
import { GuardianTypewriter } from '../../../../ui/tower/GuardianTypewriter';
import { CosmicTowerCanvas } from '../../../../ui/tower/CosmicTowerCanvas';
import { CosmicGuardian } from '../../../../ui/tower/CosmicGuardian';
import { TowerStatsCard } from '../../../../ui/tower/TowerStatsCard';
import { Zap, Crown, TrendingUp, Target, Star, Battery } from 'lucide-react';

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

export default function TowerPage() {
  const navigate = useNavigate();
  const { player, updatePlayer } = useGameStore();
  const currentFloor = player.towerProgress;
  const maxFloor = 300;

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
      const currentRp = Math.round(startRp + (stepValue * currentStep));
      setAnimatingRp(currentRp);

      if (currentStep >= steps) {
        clearInterval(counter);
        setAnimatingRp(targetRp);
      }
    }, duration / steps);
  };

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

  const handleChallengeStart = () => {
    if (currentFloor > maxFloor) {
      haptic.gameWin();
      alert('🎉 축하합니다! 무한의 탑을 완전히 정복하셨습니다!');
      return;
    }
    haptic.bossEncounter();
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]); // 강한 진동으로 도전감 강조
    }
    navigate(`/tower/${currentFloor}`, {
      state: {
        mode: 'tower',
        towerFloor: currentFloor,
        title: `Tower Floor ${currentFloor}`,
      },
    });
  };

  const guardianMessages = getGuardianSpeech(currentFloor, isEnergyFull);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-black relative">
      {/* Hero Section - 별빛 스타일 + RP 우측 상단 */}
      <div className="relative flex-[0.4] min-h-0">
        <CosmicTowerCanvas
          currentFloor={currentFloor}
          maxFloor={maxFloor}
          className="absolute inset-0 w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {/* RP Display - 우측 상단 작게 */}
        <div className="absolute top-8 right-6 z-20">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md border border-yellow-400/20 rounded-full">
            <div className="w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Star size={6} className="text-white" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white/70 font-display text-[10px]">RP</span>
              <span className="text-yellow-400 font-display font-medium text-xs tracking-wide">
                {animatingRp.toLocaleString()}
              </span>
            </div>

            {/* RP 증가 애니메이션 */}
            {showRpGain && (
              <div className="absolute -top-5 right-0 pointer-events-none">
                <div className="flex items-center gap-0.5 animate-bounce">
                  <span className="text-yellow-400 font-display font-bold text-xs">+{energyBonus}</span>
                  <div className="w-0.5 h-0.5 bg-yellow-400 rounded-full animate-ping" />
                  <div className="w-0.5 h-0.5 bg-orange-400 rounded-full animate-ping delay-100" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center h-full pt-16 text-center text-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center">
              <Crown size={16} className="text-yellow-400/80" />
            </div>
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-yellow-400 via-white to-blue-400 bg-clip-text text-transparent tracking-wider">THE TOWER</h1>
          </div>

          {/* 현재 층수와 진행률 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="font-display font-bold text-lg text-yellow-400">{currentFloor}층</span>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="font-display text-sm text-blue-400">{Math.round((currentFloor / maxFloor) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - 호흡하는 레이아웃 */}
      <div className="flex-1 flex flex-col px-6 py-6 space-y-8 justify-center">

        {/* 1. Guardian Dialogue - 넉넉한 공간 */}
        <div className="w-full max-w-md mx-auto bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 flex-shrink-0">
              <CosmicGuardian className="w-full h-full" />
            </div>
            <div className="flex-grow min-h-[4rem] flex items-center">
              <GuardianTypewriter
                messages={guardianMessages}
                typingSpeed={80}
                pauseDuration={4000}
                className="text-white/90 text-left text-sm leading-relaxed font-smooth"
              />
            </div>
          </div>
        </div>

        {/* 2. Energy Status - 여유로운 에너지 시스템 */}
        <div className="w-full max-w-md mx-auto py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Battery
                size={16}
                className={`${isEnergyFull ? 'text-cyan-400 animate-pulse' : 'text-cyan-600'} transition-colors`}
              />
              <span className="text-sm font-display font-medium text-cyan-200">탑의 기운</span>
            </div>
            <div className="relative h-7 flex items-center justify-end">
              <div className={`transition-all duration-500 ${
                isEnergyFull
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 translate-x-4 pointer-events-none'
              }`}>
                <button
                  onClick={handleEnergyCollect}
                  disabled={isCollecting}
                  className={`px-4 py-1.5 rounded-full text-xs font-display font-medium transition-all duration-300 ${
                    !isCollecting
                      ? 'bg-cyan-400/20 border border-cyan-400/60 text-cyan-400 hover:bg-cyan-400/30 active:scale-95'
                      : 'bg-cyan-400/30 border border-cyan-400/80 text-cyan-400 animate-pulse cursor-not-allowed'
                  }`}
                >
                  {isCollecting ? '수집중...' : '⚡ 수집'}
                </button>
              </div>

              <div className={`absolute right-0 transition-all duration-500 ${
                !isEnergyFull
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 -translate-x-4 pointer-events-none'
              }`}>
                <div className="px-3 py-1.5 text-xs font-display text-cyan-600/50 flex items-center gap-1 whitespace-nowrap">
                  <div className="w-1.5 h-1.5 bg-cyan-600/30 rounded-full animate-pulse"></div>
                  {(() => {
                    const remainingTime = Math.ceil((100 - energyProgress) * 36); // 36초 per 1%
                    const minutes = Math.floor(remainingTime / 60);
                    const seconds = remainingTime % 60;

                    if (minutes > 0) {
                      return `${minutes}분후`;
                    } else if (seconds > 0) {
                      return `${seconds}초후`;
                    } else {
                      return '완료임박';
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* 코스믹 에너지 바 */}
          <div className="relative mb-6">
            {/* 외부 글로우 효과 */}
            {isEnergyFull && (
              <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/20 via-blue-500/30 to-purple-500/20 rounded-full blur animate-pulse" />
            )}

            <div className="relative bg-black/30 rounded-full h-3 overflow-hidden border border-cyan-400/20">
              <div
                className={`h-3 rounded-full transition-all duration-1000 relative ${
                  isEnergyFull
                    ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500'
                    : 'bg-gradient-to-r from-cyan-600/50 to-blue-600/50'
                }`}
                style={{ width: `${energyProgress}%` }}
              >
                {/* 코스믹 플로우 효과 */}
                {isEnergyFull && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-200/60 via-transparent to-purple-200/60 animate-ping" />
                    </div>
                  </>
                )}
              </div>

              {/* 코스믹 파티클 */}
              {isEnergyFull && (
                <div className="absolute -top-1 -bottom-1 left-0 right-0 pointer-events-none">
                  <div className="absolute top-1 left-1/4 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                  <div className="absolute top-0 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-ping delay-300" />
                  <div className="absolute top-1 right-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping delay-700" />
                  <div className="absolute top-0 left-1/3 w-1 h-1 bg-white rounded-full animate-ping delay-1000" />
                </div>
              )}
            </div>

            <div className="text-center mt-2">
              <span className={`text-xs font-display transition-colors ${
                isEnergyFull ? 'text-cyan-400 animate-pulse' : 'text-cyan-600/80'
              }`}>
                {isEnergyFull ? (
                  <>⚡ 충전 완료 • +{energyBonus} RP</>
                ) : (
                  <span className="flex items-center justify-center gap-1">
                    <span className="animate-bounce delay-0">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                    <span className="ml-1">충전중 {Math.round(energyProgress)}%</span>
                    <span className="animate-bounce delay-0">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Challenge Button - 임팩트 있는 메인 버튼 */}
        <div className="w-full max-w-md mx-auto py-6 mt-4">
          {/* 진행 상황 간단 표시 */}
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-yellow-400" />
              <span className="text-xs text-yellow-400/80 font-display">다음 목표: {currentFloor + 1}층</span>
            </div>
            <span className="text-xs text-yellow-400/80 font-display">예상 보상: +150 RP</span>
          </div>

          {/* 메인 도전 버튼 */}
          <div className="relative">
            {/* 황금 글로우 효과 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/30 via-orange-500/40 to-yellow-400/30 rounded-2xl blur animate-pulse" />

            <button
              id="challenge-start-btn"
              onClick={handleChallengeStart}
              className="relative w-full py-6 px-8 rounded-2xl
                       bg-gradient-to-r from-yellow-400/20 via-orange-500/30 to-yellow-400/20
                       border-2 border-yellow-400/60
                       hover:border-yellow-400/80 hover:from-yellow-400/30 hover:via-orange-500/40 hover:to-yellow-400/30
                       active:scale-95 transition-all duration-300
                       flex items-center justify-center gap-4
                       shadow-xl shadow-yellow-400/20"
            >
              {/* 아이콘 */}
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Zap size={18} className="text-white" />
              </div>

              {/* 텍스트 */}
              <div className="text-center">
                <div className="font-display text-yellow-400 font-bold text-xl tracking-wide">
                  {currentFloor <= maxFloor ? `${currentFloor}층 도전하기` : '탑 정복 완료!'}
                </div>
                <div className="text-yellow-400/70 text-xs font-display mt-1">
                  영웅의 여정이 기다립니다
                </div>
              </div>

              {/* 장식 파티클 */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <div className="absolute top-2 right-4 w-1 h-1 bg-yellow-400 rounded-full animate-ping delay-100" />
                <div className="absolute bottom-3 left-6 w-1 h-1 bg-orange-400 rounded-full animate-ping delay-500" />
                <div className="absolute top-4 left-1/3 w-0.5 h-0.5 bg-white rounded-full animate-ping delay-1000" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 휘리리 RP 플라잉 애니메이션 */}
      {showFlyingRp && (
        <div className="absolute inset-0 pointer-events-none z-50">
          <div
            className="absolute animate-bounce duration-1000"
            style={{
              left: '50%',
              top: '60%',
              transform: 'translate(-50%, -50%)',
              animation: 'flyToRp 1s ease-out forwards'
            }}
          >
            <div className="flex items-center gap-1 bg-yellow-400/20 border border-yellow-400/60 rounded-full px-3 py-1.5 backdrop-blur-md">
              <Star size={12} className="text-yellow-400" />
              <span className="text-yellow-400 font-display font-bold text-sm">+{energyBonus}</span>
              <div className="w-1 h-1 bg-yellow-400 rounded-full animate-ping" />
              <div className="w-1 h-1 bg-orange-400 rounded-full animate-ping delay-100" />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes flyToRp {
          0% {
            left: 50%;
            top: 60%;
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          50% {
            left: 75%;
            top: 35%;
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.8;
          }
          100% {
            left: 85%;
            top: 18%;
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}