import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../../../store/gameStore';
import { haptic } from '../../../../ui/feedback/HapticFeedback';
import { CosmicTowerCanvas } from '../../../tower/components/CosmicTowerCanvas';
import { CinematicHologramTower } from '../../../tower/components/CinematicHologramTower';
import { StatsDisplay, type StatItem } from '../../../../ui/stats';
import { Zap, Crown, Target, Star } from 'lucide-react';
import { useAnimatedCounter } from '../../../../hooks/useAnimatedCounter';
import { useTowerEnergy } from '../../../../hooks/useTowerEnergy';
import { EnergyBar } from '../../../tower/components/EnergyBar';

/**
 * Generates a set of speech lines for the Tower Guardian based on the player's progress.
 *
 * @param {number} floor - The player's current tower floor.
 * @param {boolean} isEnergyFull - Whether the player's tower energy is full.
 * @returns {string[]} An array of speech lines for the guardian to say.
 */
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

/**
 * The main page for the Tower feature.
 *
 * This component serves as the hub for the Tower challenge. It includes:
 * - A 3D representation of the tower (`CosmicTowerCanvas`).
 * - A dialogue box with the Tower Guardian, who provides context-sensitive messages.
 * - An "energy" system that recharges over time and can be collected for rewards.
 * - The main button to start a challenge on the current tower floor.
 *
 * The component manages several pieces of local state for animations and the energy system,
 * and interacts with the global `useGameStore` for player data.
 *
 * @returns {React.ReactElement} The rendered Tower home page.
 */
export default function TowerPage() {
  const navigate = useNavigate();
  const { player, updatePlayer } = useGameStore();
  const currentFloor = player.towerProgress;
  const maxFloor = 300;

  // RP 애니메이션 상태
  const [showRpGain, setShowRpGain] = useState(false);
  const [showFlyingRp, setShowFlyingRp] = useState(false);
  const rpCounter = useAnimatedCounter(player.rp, { durationMs: 1500, steps: 60 });

  // 타워 에너지 시스템 상태 훅으로 대체
  const { progressPercent, isFull, isCollecting, collect } = useTowerEnergy({
    fullChargeSeconds: 3600,
    storageKey: 'towerEnergy',
    debugStartFull: true, // 기존 코드의 테스트 동작 유지
  });
  const energyBonus = 150;

  /** Handles the collection of tower energy, triggering animations and awarding RP. */
  const handleEnergyCollect = () => {
    console.log('수집 버튼 클릭됨!', { isFull, isCollecting });

    if (!isFull || isCollecting) {
      console.log('수집 불가능:', { isFull, isCollecting });
      return;
    }

    console.log('수집 시작!');

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
        setShowRpGain(true);

        // RP 카운터 애니메이션
        rpCounter.animateTo(newRp);

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

    // 훅이 내부적으로 초기화/종료 타이밍을 처리
    collect();
  };

  /** Handles the start of a new tower challenge, navigating to the challenge preparation screen. */
  const handleChallengeStart = () => {
    // 300층 정복 완료 체크
    if (currentFloor > maxFloor) {
      haptic.gameWin();
      alert('🎉 축하합니다! 무한의 탑을 완전히 정복하셨습니다!');
      return;
    }
    
    // 현재 층이 실제 진행도를 넘는지 체크
    if (currentFloor > player.towerProgress) {
      alert('아직 도전할 수 없는 층입니다.');
      return;
    }

    haptic.bossEncounter();
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]); // 강한 진동으로 도전감 강조
    }
    
    // 새로운 챌린지 플로우로 이동
    navigate(`/tower/${currentFloor}/challenge`, {
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
      value: rpCounter.value,
      icon: Star,
      color: 'yellow',
      animation: showRpGain && (
        <div className="absolute top-full mt-1 right-0 pointer-events-none z-10">
          <div className="flex items-center gap-0.5 animate-bounce bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 border border-yellow-400/30">
            <span className="text-yellow-400 font-display font-bold text-xs drop-shadow-lg">+{energyBonus}</span>
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
      <div className="relative flex-[0.08] min-h-0">
        {/* Stats Display - 우측 상단 */}
        <StatsDisplay stats={statsData} />
      </div>

      {/* Main Content Area - 홀로그램 타워 (더 많은 공간 할당) */}
      <div className="flex-[1.2] flex flex-col items-center justify-center px-4 pt-4 pb-0 relative">
        
        {/* 영화적 홀로그램 타워 */}
        <div className="relative z-10">
          <CinematicHologramTower
            currentFloor={currentFloor}
            maxFloor={maxFloor}
            className="mx-auto"
          />
        </div>
      </div>

      {/* Challenge UI - 하단 고정 (더 컴팩트) */}
      <div className="px-4 pt-0 pb-3 relative">
        <div className="w-full max-w-md mx-auto">
          <EnergyBar 
            progressPercent={progressPercent} 
            isFull={isFull} 
            isCollecting={isCollecting}
            onCollect={handleEnergyCollect}
          />
          
          {/* 진행 상황 간단 표시 (더 컴팩트) */}
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <Target size={12} className="text-yellow-400" />
              <span className="text-xs text-yellow-400/80 font-display">다음 목표: {currentFloor + 1}층</span>
            </div>
            <span className="text-xs text-yellow-400/80 font-display">도전 준비됨!</span>
          </div>
          <button
            id="challenge-start-btn"
            onClick={handleChallengeStart}
            disabled={currentFloor > player.towerProgress}
            className={`relative w-full py-3 px-4 rounded-xl transition-all duration-150 group overflow-hidden ${
              currentFloor > player.towerProgress
                ? 'bg-gradient-to-b from-gray-600/30 to-gray-700/30 border border-gray-400/40 opacity-50 cursor-not-allowed'
                : 'bg-gradient-to-b from-purple-600/30 to-indigo-700/30 border border-purple-400/60 shadow-[0_4px_16px_rgba(147,51,234,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] active:shadow-[0_2px_8px_rgba(147,51,234,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] active:translate-y-0.5'
            }`}
          >
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-300/40 to-transparent ${
              currentFloor > player.towerProgress ? 'opacity-30' : ''
            }`} />
            <div className="flex items-center justify-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-lg transition-transform duration-150 ${
                currentFloor > player.towerProgress
                  ? 'bg-gradient-to-br from-gray-500 to-gray-600'
                  : 'bg-gradient-to-br from-purple-500 to-indigo-600 group-active:scale-95'
              }`}>
                <Target size={18} className="text-white" />
              </div>
              <div className="text-center">
                <div className={`font-display font-bold text-lg tracking-wide transition-transform duration-150 ${
                  currentFloor > player.towerProgress
                    ? 'text-gray-300'
                    : 'text-purple-200 group-active:scale-98'
                }`}>
                  {currentFloor > maxFloor 
                    ? '탑 정복 완료!' 
                    : currentFloor > player.towerProgress
                    ? '잠겨있는 층'
                    : `${currentFloor}층 도전하기`
                  }
                </div>
                <div className={`text-xs font-display ${
                  currentFloor > player.towerProgress
                    ? 'text-gray-400'
                    : 'text-purple-300/70'
                }`}>
                  {currentFloor > player.towerProgress
                    ? `${player.towerProgress}층까지 클리어 필요`
                    : '전투 준비 완료'
                  }
                </div>
              </div>
            </div>
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
              <div className="absolute top-1 right-3 w-1 h-1 bg-purple-400 rounded-full animate-ping delay-200" />
              <div className="absolute bottom-1 left-4 w-0.5 h-0.5 bg-indigo-400 rounded-full animate-ping delay-600" />
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

      {/* flyToRpFromGuardian 애니메이션은 ui/effects/animations.css로 분리됨 */}
    </div>
  );
}