import React, { useState, useEffect, useCallback } from 'react';
import { haptic } from '../../../../ui/feedback/HapticFeedback';

// 단계별 컴포넌트들 (곧 구현 예정)
import { PreparationPhase } from './steps/PreparationPhase';
import { OpponentRevealPhase } from './steps/OpponentRevealPhase';
import { CountdownPhase } from './steps/CountdownPhase';
import { TransitionPhase } from './steps/TransitionPhase';

// 훅과 유틸리티들 (곧 구현 예정)
import { useChallengeFlow } from '../../hooks/useChallengeFlow';
import { getOpponentData } from './data/aiOpponents';

type ChallengePhase = 'preparation' | 'opponent' | 'countdown' | 'transition' | 'complete';

interface TowerChallengeIntroProps {
  /** 도전할 층 번호 */
  floor: number;
  /** 챌린지 완료 시 호출되는 콜백 (게임 시작) */
  onChallengeComplete: () => void;
  /** 챌린지 취소 시 호출되는 콜백 */
  onChallengeCancel?: () => void;
}

/**
 * 타워 도전 플로우를 관리하는 메인 오케스트레이터 컴포넌트
 *
 * 4단계의 도전 준비 과정을 순차적으로 진행:
 * 1. 준비 단계 (3초) - 전략 분석 및 로딩
 * 2. 상대 등장 (4초) - AI 상대 정보 표시
 * 3. 카운트다운 (3초) - 3-2-1 카운트다운
 * 4. 전환 (1초) - 게임으로 부드러운 전환
 */
export function TowerChallengeIntro({
  floor,
  onChallengeComplete,
  onChallengeCancel
}: TowerChallengeIntroProps) {
  const [currentPhase, setCurrentPhase] = useState<ChallengePhase>('preparation');
  const [canSkip, setCanSkip] = useState(true);
  const [isSkipping, setIsSkipping] = useState(false);

  // 챌린지 플로우 관리 훅 (곧 구현 예정)
  const { opponentData, phaseTimings } = useChallengeFlow(floor);

  // 단계별 타이밍 설정 - 더 여유롭게 조정
  const PHASE_DURATIONS = {
    preparation: 5000,  // 3초 → 5초 (충분한 몰입 시간)
    opponent: 6000,     // 4초 → 6초 (상대 분석 시간 증가)
    countdown: 4000,    // 3초 → 4초 (긴장감 빌드업)
    transition: 3000,   // 1초 → 3초 (부드러운 전환)
  };

  // 다음 단계로 진행
  const advanceToNextPhase = useCallback(() => {
    setCurrentPhase(current => {
      switch (current) {
        case 'preparation':
          return 'opponent';
        case 'opponent':
          return 'countdown';
        case 'countdown':
          return 'transition';
        case 'transition':
          return 'complete';
        default:
          return current;
      }
    });
  }, []);

  // 챌린지 완료 처리
  useEffect(() => {
    if (currentPhase === 'complete') {
      onChallengeComplete();
    }
  }, [currentPhase, onChallengeComplete]);

  // 자동 진행 타이머
  useEffect(() => {
    if (isSkipping) return;

    const duration = PHASE_DURATIONS[currentPhase as keyof typeof PHASE_DURATIONS];
    if (!duration) return;

    const timer = setTimeout(() => {
      advanceToNextPhase();
    }, duration);

    return () => clearTimeout(timer);
  }, [currentPhase, isSkipping, advanceToNextPhase]);

  // 스킵 처리
  const handleSkip = useCallback(() => {
    if (!canSkip || isSkipping) return;

    setIsSkipping(true);
    haptic.buttonTap();

    // 즉시 게임으로 이동
    setTimeout(() => {
      onChallengeComplete();
    }, 100);
  }, [canSkip, isSkipping, onChallengeComplete]);

  // 화면 터치/클릭으로 스킵
  const handleScreenTouch = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    handleSkip();
  }, [handleSkip]);

  // ESC 키로 취소
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onChallengeCancel) {
        onChallengeCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onChallengeCancel]);

  return (
    <div
      className="fixed inset-0 bg-black z-50 overflow-hidden cursor-pointer"
      onClick={handleScreenTouch}
      onTouchStart={handleScreenTouch}
    >
      {/* 배경 그라디언트 */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/30 via-purple-900/20 to-black" />

      {/* 별빛 파티클 배경 */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
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

      {/* 스킵 힌트 - 하이테크 스타일 */}
      {canSkip && !isSkipping && (
        <div
          className="absolute top-6 right-6 z-10 opacity-0 animate-fade-in"
          style={{ animationDelay: '2s', animationFillMode: 'forwards' }}
        >
          <div className="bg-black/70 backdrop-blur-sm border border-cyan-400/40 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
              <span className="text-cyan-300 font-mono text-xs tracking-wide">TAP TO SKIP</span>
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 영역 */}
      <div className="relative z-10 h-full flex items-center justify-center">
        {currentPhase === 'preparation' && (
          <PreparationPhase
            floor={floor}
            onComplete={advanceToNextPhase}
            onSkip={handleSkip}
          />
        )}

        {currentPhase === 'opponent' && (
          <OpponentRevealPhase
            floor={floor}
            opponent={opponentData}
            onComplete={advanceToNextPhase}
            onSkip={handleSkip}
          />
        )}

        {currentPhase === 'countdown' && (
          <CountdownPhase
            onComplete={advanceToNextPhase}
            onSkip={handleSkip}
          />
        )}

        {currentPhase === 'transition' && (
          <TransitionPhase
            floor={floor}
            onComplete={advanceToNextPhase}
            onSkip={handleSkip}
          />
        )}
      </div>

      {/* 진행률 표시기 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex gap-2">
          {(['preparation', 'opponent', 'countdown', 'transition'] as const).map((phase, index) => (
            <div
              key={phase}
              className={`w-8 h-1 rounded-full transition-all duration-300 ${
                currentPhase === phase
                  ? 'bg-purple-400 shadow-lg shadow-purple-400/50'
                  : index < ['preparation', 'opponent', 'countdown', 'transition'].indexOf(currentPhase)
                  ? 'bg-purple-600/80'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}