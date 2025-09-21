import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../../../store/gameStore';
import { haptic } from '../../../../ui/feedback/HapticFeedback';
import { CosmicTowerCanvas } from '../../../../ui/tower/CosmicTowerCanvas';
import { CinematicHologramTower } from '../../../../ui/tower/CinematicHologramTower';
import { TowerStatsCard } from '../../../../ui/tower/TowerStatsCard';
import { StatsDisplay, type StatItem } from '../../../../ui/stats';
import { Zap, Crown, TrendingUp, Target, Star, Battery } from 'lucide-react';


export default function TowerPage() {
  const navigate = useNavigate();
  const { player, updatePlayer } = useGameStore();
  const currentFloor =300; // player.towerProgress;
  // player.towerProgress
  const maxFloor = 300;


  // RP 애니메이션 상태
  const [showRpGain, setShowRpGain] = useState(false);
  const [animatingRp, setAnimatingRp] = useState(player.rp);
  const [previousRp, setPreviousRp] = useState(player.rp);
  const [showFlyingRp, setShowFlyingRp] = useState(false);


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


  // 상단 통계 데이터 구성
  const statsData: StatItem[] = [
    {
      key: 'tower',
      label: '탑',
      value: `${currentFloor}층 • ${Math.round((currentFloor / maxFloor) * 100)}%`,
      icon: Crown,
      color: 'blue'
    },
    {
      key: 'rp',
      label: 'RP',
      value: animatingRp,
      icon: Star,
      color: 'yellow',
      animation: showRpGain && (
        <div className="absolute -top-5 right-0 pointer-events-none">
          <div className="flex items-center gap-0.5 animate-bounce">
            <span className="text-yellow-400 font-display font-bold text-xs">+{energyBonus}</span>
            <div className="w-0.5 h-0.5 bg-yellow-400 rounded-full animate-ping" />
            <div className="w-0.5 h-0.5 bg-orange-400 rounded-full animate-ping delay-100" />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-black relative">
      {/* 전체 페이지 별빛 배경 */}
      <CosmicTowerCanvas
        currentFloor={currentFloor}
        maxFloor={maxFloor}
        className="absolute inset-0 w-full h-full"
      />
      
      {/* 전체 페이지 그라디언트 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/40" />
      
      {/* Hero Section - 상단 영역 (Stats만) */}
      <div className="relative flex-[0.1] min-h-0">
        {/* Stats Display - 우측 상단 */}
        <StatsDisplay stats={statsData} className="top-6 right-4" />
      </div>

      {/* Main Content Area - 홀로그램 타워 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-8 pb-0 relative">
        
        {/* 영화적 홀로그램 타워 */}
        <div className="relative z-10">
          <CinematicHologramTower
            currentFloor={currentFloor}
            maxFloor={maxFloor}
            className="mx-auto"
          />
        </div>
      </div>

      {/* Challenge UI - 하단 고정 */}
      <div className="px-4 pt-0 pb-4 relative">
        <div className="w-full max-w-md mx-auto">
          {/* 진행 상황 간단 표시 */}
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-yellow-400" />
              <span className="text-xs text-yellow-400/80 font-display">다음 목표: {currentFloor + 1}층</span>
            </div>
            <span className="text-xs text-yellow-400/80 font-display">예상 보상: +150 RP</span>
          </div>

          {/* 메인 도전 버튼 - 3D 컴팩트 */}
          <button
            id="challenge-start-btn"
            onClick={handleChallengeStart}
            className="relative w-full py-2.5 px-4 rounded-xl
                     bg-gradient-to-b from-cyan-500/20 to-blue-600/20
                     border border-cyan-400/50
                     shadow-[0_4px_12px_rgba(6,182,212,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]
                     active:shadow-[0_2px_6px_rgba(6,182,212,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]
                     active:translate-y-0.5 transition-all duration-150
                     group overflow-hidden"
          >
              {/* 3D 상단 하이라이트 */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              
              <div className="flex items-center justify-center gap-2.5">
                {/* 컴팩트 아이콘 */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 
                              flex items-center justify-center shadow-md
                              group-active:scale-95 transition-transform duration-150">
                  <Zap size={16} className="text-white" />
                </div>
                
                {/* 컴팩트 텍스트 */}
                <div className="text-center">
                  <div className="font-display text-cyan-300 font-bold text-base tracking-wide 
                                group-active:scale-98 transition-transform duration-150">
                    {currentFloor <= maxFloor ? `${currentFloor}층 도전하기` : '탑 정복 완료!'}
                  </div>
                </div>
              </div>

              {/* 미니 파티클 */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                <div className="absolute top-1 right-3 w-1 h-1 bg-cyan-400 rounded-full animate-ping delay-200" />
                <div className="absolute bottom-1 left-4 w-0.5 h-0.5 bg-blue-400 rounded-full animate-ping delay-600" />
                <div className="absolute top-2 left-1/3 w-0.5 h-0.5 bg-white rounded-full animate-ping delay-800" />
              </div>

          </button>
        </div>
      </div>

      {/* 휘리리 RP 플라잉 애니메이션 - 가디언에서 시작 */}
      {showFlyingRp && (
        <div className="absolute inset-0 pointer-events-none z-50">
          <div
            className="absolute animate-bounce duration-1000"
            style={{
              left: '50%',
              top: '35%', // 가디언 위치로 조정 (상단 정보 아래)
              transform: 'translate(-50%, -50%)',
              animation: 'flyToRpFromGuardian 1s ease-out forwards'
            }}
          >
            <div className="flex items-center gap-1 bg-cyan-400/20 border border-cyan-400/60 rounded-full px-3 py-1.5 backdrop-blur-md">
              <div className="text-cyan-400 text-xs">⚡</div>
              <span className="text-cyan-400 font-display font-bold text-sm">+{energyBonus}</span>
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-ping delay-100" />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes flyToRpFromGuardian {
          0% {
            left: 50%;
            top: 15%; /* 가디언 위치에서 시작 */
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          50% {
            left: 70%;
            top: 25%;
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.9;
          }
          100% {
            left: 85%;
            top: 8%; /* 상단 RP 위치로 도착 */
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}