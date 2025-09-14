import React from 'react';
import { GameController } from '../../ui/game/GameController';

export default function Game() {
  // URL 파라미터나 state에서 게임 설정을 가져올 수 있음
  const gameMode = 'tower'; // tower, battle, practice 등
  const difficulty = 'medium';

  return (
    <GameController
      title="탑 1층 도전"
      opponent="ai"
      difficulty={difficulty}
    />
  );
}