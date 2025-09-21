import React, { useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { GameController } from '../../../../ui/game/GameController';
import { useGameStore } from '../../../../store/gameStore';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'nightmare'] as const;
type Difficulty = (typeof DIFFICULTIES)[number];
type Opponent = 'ai' | 'human' | 'stella';

interface TowerGameRouteState {
  title?: string;
}

/**
 * The game screen for a specific floor in the Tower challenge.
 *
 * This component acts as a wrapper for the main `GameController`. It is responsible for:
 * 1.  Validating the 'floor' parameter from the URL. It ensures the floor is a valid number,
 *     is accessible based on the player's progress, and does not exceed the maximum floor.
 * 2.  Redirecting the user if the floor parameter is invalid.
 * 3.  Determining the AI opponent's difficulty based on the current floor number.
 * 4.  Rendering the `GameController` with the appropriate props for the tower match.
 *
 * @returns {React.ReactElement | null} The rendered game controller for the tower match, or `null` if redirecting.
 */
export default function TowerGamePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ floor: string }>();
  const routeState = (location.state ?? {}) as TowerGameRouteState;
  const { player } = useGameStore();

  // Tower 전용: floor 파라미터 검증 (엄격한 숫자 검사)
  const floorParam = params.floor;
  const isValidNumber = floorParam && /^\d+$/.test(floorParam); // 순수 숫자만 허용
  const floor = isValidNumber ? parseInt(floorParam, 10) : NaN;

  useEffect(() => {
    // 1. floor가 숫자가 아닌 경우
    if (isNaN(floor)) {
      console.warn('Invalid floor parameter:', floorParam);
      navigate('/tower', { replace: true });
      return;
    }

    // 2. floor가 0 이하인 경우
    if (floor <= 0) {
      console.warn('Floor must be positive:', floor);
      navigate('/tower', { replace: true });
      return;
    }

    // 3. 사용자가 아직 도달하지 못한 층인 경우
    if (floor > player.towerProgress) {
      console.warn('Access denied to floor:', floor, 'Current progress:', player.towerProgress);
      navigate('/tower', { replace: true });
      return;
    }

    // 4. 최대 층수를 초과한 경우 (300층 제한)
    if (floor > 300) {
      console.warn('Floor exceeds maximum:', floor);
      navigate('/tower', { replace: true });
      return;
    }
  }, [floor, floorParam, player.towerProgress, navigate]);

  // 유효하지 않은 상태에서는 null 반환 (리다이렉트 중)
  if (isNaN(floor) || floor <= 0 || floor > player.towerProgress || floor > 300) {
    return null;
  }

  // Tower 전용: 간소화된 설정
  const title = routeState.title ?? `Tower Floor ${floor}`;
  const difficulty: Difficulty = floor <= 50 ? 'easy' : floor <= 150 ? 'medium' : floor <= 250 ? 'hard' : 'nightmare';
  const opponent: Opponent = 'ai';

  return (
    <GameController
      key={`tower-${floor}`}
      title={title}
      opponent={opponent}
      difficulty={difficulty}
    />
  );
}