import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { TowerChallengeIntro } from '../../components/challenge/TowerChallengeIntro';
import { useGameStore } from '../../../../store/gameStore';

interface TowerChallengeRouteState {
  mode?: string;
  towerFloor?: number;
  title?: string;
}

/**
 * 타워 도전 준비 페이지
 *
 * 이 컴포넌트는 실제 오델로 게임이 시작되기 전의 도전 준비 과정을 관리합니다.
 * - 도전 준비 단계 (3초)
 * - 상대 등장 단계 (4초)
 * - 카운트다운 단계 (3초)
 * - 게임 전환 단계 (1초)
 */
export default function TowerChallengePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ floor: string }>();
  const routeState = (location.state ?? {}) as TowerChallengeRouteState;
  const { player } = useGameStore();

  // Floor 파라미터 검증
  const floorParam = params.floor;
  const isValidNumber = floorParam && /^\d+$/.test(floorParam);
  const floor = isValidNumber ? parseInt(floorParam, 10) : NaN;

  // Floor 유효성 검사 - 디버깅 로그 추가
  console.log('Challenge page - floor:', floor, 'towerProgress:', player.towerProgress);

  if (isNaN(floor) || floor <= 0 || floor > 300 || floor > player.towerProgress) {
    console.log('Invalid floor access:', { floor, towerProgress: player.towerProgress });
    navigate('/tower', { replace: true });
    return null;
  }

  // 챌린지 완료 후 게임으로 이동
  const handleChallengeComplete = () => {
    navigate(`/tower/${floor}`, {
      state: {
        mode: 'tower',
        towerFloor: floor,
        title: `Tower Floor ${floor}`,
      },
      replace: true,
    });
  };

  // 챌린지 취소 시 타워 메인으로 복귀
  const handleChallengeCancel = () => {
    navigate('/tower', { replace: true });
  };

  return (
    <TowerChallengeIntro
      floor={floor}
      onChallengeComplete={handleChallengeComplete}
      onChallengeCancel={handleChallengeCancel}
    />
  );
}