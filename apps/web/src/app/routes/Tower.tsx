import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { haptic } from '../../ui/feedback/HapticFeedback';
import { TypewriterText } from '../../ui/stella/TypewriterText';
import { CosmicTowerCanvas } from '../../ui/tower/CosmicTowerCanvas';
import { CosmicGuardian } from '../../ui/tower/CosmicGuardian';
import { TowerStatsCard } from '../../ui/tower/TowerStatsCard';
import { Zap, Crown } from 'lucide-react';

function getGuardianSpeech(floor: number): string[] {
  if (floor >= 300) {
    return ['마침내 정상에 도달했군요. 당신의 실력은 이제 전설이 되었습니다.'];
  }
  if (floor % 50 === 0) {
    return [
      `도전자여, ${floor}층의 보스, 내가 상대해주지.`,
      '이곳을 지나려면 나를 이겨야만 한다!',
      '단순한 힘이 아닌, 지혜를 증명해봐라.',
    ];
  }
  return [
    '오델로의 탑에 온 것을 환영한다.',
    '전략을 잘 세워보거라. 행운을 빈다.',
  ];
}

export default function Tower() {
  const navigate = useNavigate();
  const { player } = useGameStore();
  const currentFloor = player.towerProgress;
  const maxFloor = 300;

  const handleChallengeStart = () => {
    if (currentFloor > maxFloor) {
      haptic.gameWin();
      alert('🎉 축하합니다! 무한의 탑을 완전히 정복하셨습니다!');
      return;
    }
    haptic.bossEncounter();
    navigate('/game', { state: { towerFloor: currentFloor } });
  };

  const guardianMessages = getGuardianSpeech(currentFloor);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-black">
      {/* Hero Section (Flex: 40%) */}
      <div className="relative flex-[0.4] min-h-0">
        <CosmicTowerCanvas 
          currentFloor={currentFloor} 
          maxFloor={maxFloor} 
          className="absolute inset-0 w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full pt-8 text-center text-white">
          <h1 className="text-3xl font-display font-bold text-white tracking-wider">THE TOWER</h1>
          <div className="flex items-center gap-2 mt-2 px-4 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
            <Crown size={14} className="text-yellow-400" />
            <span className="font-sans font-bold text-lg">{currentFloor}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area (Flex: 60%, with space-around) */}
      <div className="relative flex-[0.6] flex flex-col justify-around items-center px-6 py-4">
        
        {/* Guardian Dialogue Card */}
        <div className="w-full max-w-md mx-auto bg-black/30 backdrop-blur-lg border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-20 h-20 flex-shrink-0">
            <CosmicGuardian className="w-full h-full" />
          </div>
          <div className="flex-grow min-h-[3rem]">
            <TypewriterText
              messages={guardianMessages}
              typingSpeed={50}
              pauseDuration={4000}
              className="text-purple-200/90 text-left text-sm leading-relaxed font-smooth"
            />
          </div>
        </div>

        {/* Stats Card */}
        <TowerStatsCard />

        {/* Action Button */}
        <div className="w-full max-w-md mx-auto">
          <button
            id="challenge-start-btn"
            onClick={handleChallengeStart}
            className="group relative w-full py-4 px-8 rounded-full
                     bg-white/10 backdrop-blur-md border border-white/20
                     active:scale-95 transition-all duration-300
                     flex items-center justify-center gap-3
                     hover:bg-white/15 hover:border-white/30"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            
            <div className="relative flex items-center gap-3">
                <Zap size={18} className="text-yellow-300" />
                <span className="font-display text-white/90 tracking-wider text-lg">
                    {currentFloor <= maxFloor ? `Challenge Floor ${currentFloor}` : 'Tower Conquered!'}
                </span>
            </div>

            <div className="absolute -inset-1 bg-white/10 rounded-full blur opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
          </button>
        </div>
      </div>
    </div>
  );
}
