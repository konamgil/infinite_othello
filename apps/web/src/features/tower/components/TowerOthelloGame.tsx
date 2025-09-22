/**
 * 타워 모드 전용 오델로 게임 래퍼
 * 타워 특화 UI와 상태 관리를 포함
 */

import React, { useState, useEffect } from 'react';
import { OthelloGame, type GameEndResult, type GameStateInfo } from '../../../components/game/OthelloGame';
import { useTowerGameManager } from '../../../store/towerStore';
import { useNavigate } from 'react-router-dom';

interface TowerOthelloGameProps {
  floor: number;
  onComplete?: (victory: boolean, result: GameEndResult) => void;
  onAbandon?: () => void;
  className?: string;
}

export function TowerOthelloGame({
  floor,
  onComplete,
  onAbandon,
  className = ''
}: TowerOthelloGameProps) {
  const navigate = useNavigate();
  const towerManager = useTowerGameManager();

  const [gameState, setGameState] = useState<GameStateInfo | null>(null);
  const [gameResult, setGameResult] = useState<GameEndResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // 타워 도전 시작
  useEffect(() => {
    const startChallenge = async () => {
      const success = await towerManager.startChallenge(floor);
      if (!success) {
        console.error('Failed to start tower challenge');
        navigate('/tower');
      }
    };

    startChallenge();
  }, [floor, towerManager, navigate]);

  // 게임 종료 처리
  const handleGameEnd = (result: GameEndResult) => {
    setGameResult(result);
    setShowResult(true);

    const victory = result.winner === 'black'; // 플레이어는 항상 검은색
    onComplete?.(victory, result);

    // 3초 후 자동으로 타워 메인으로 이동
    setTimeout(() => {
      navigate('/tower');
    }, 3000);
  };

  // 게임 포기
  const handleAbandon = () => {
    towerManager.abandonChallenge();
    onAbandon?.();
    navigate('/tower');
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* 타워 정보 헤더 */}
      <div className="mb-4 text-center bg-emerald-900/30 rounded-lg p-4 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-white mb-2">
          {floor}층 도전
        </h2>

        {towerManager.currentAI && (
          <div className="space-y-1">
            <div className="text-emerald-300 font-semibold">
              상대: {towerManager.currentAI.name}
            </div>
            <div className="text-emerald-400 text-sm">
              {towerManager.currentAI.description}
            </div>
            <div className="flex justify-center gap-4 text-xs text-gray-400">
              <span>난이도: {towerManager.currentAI.difficulty}</span>
              <span>스타일: {towerManager.currentAI.personality}</span>
              <span>실수율: {towerManager.currentAI.mistakeRate}%</span>
            </div>
          </div>
        )}
      </div>

      {/* 게임 상태 정보 */}
      {gameState && (
        <div className="mb-4 flex items-center justify-between bg-black/20 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-sm text-gray-400">흑돌 (플레이어)</div>
            <div className={`text-xl font-bold ${gameState.currentPlayer === 'black' ? 'text-white' : 'text-gray-500'}`}>
              {gameState.score.black}
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-400">턴</div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${gameState.currentPlayer === 'black' ? 'bg-gray-800' : 'bg-gray-200'}`} />
              <span className="text-sm text-white">
                {gameState.currentPlayer === 'black' ? '플레이어' : 'AI'}
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-400">백돌 (AI)</div>
            <div className={`text-xl font-bold ${gameState.currentPlayer === 'white' ? 'text-white' : 'text-gray-500'}`}>
              {gameState.score.white}
            </div>
          </div>
        </div>
      )}

      {/* 메인 게임 */}
      <OthelloGame
        mode="tower"
        towerFloor={floor}
        aiEngine="tower"
        onGameEnd={handleGameEnd}
        onStateChange={setGameState}
        showControls={false}
        className="mb-4"
      />

      {/* 타워 전용 컨트롤 */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={handleAbandon}
          className="px-6 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-white text-sm transition-colors"
        >
          포기하고 나가기
        </button>

        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">에너지</div>
          <div className="text-sm text-emerald-400">
            {towerManager.energy}/{towerManager.maxEnergy}
          </div>
        </div>
      </div>

      {/* 게임 결과 모달 */}
      {showResult && gameResult && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full mx-4 text-center">
            <div className="mb-4">
              {gameResult.winner === 'black' ? (
                <div className="text-emerald-400">
                  <div className="text-3xl mb-2">🎉</div>
                  <div className="text-xl font-bold">승리!</div>
                  <div className="text-sm text-emerald-300 mt-1">
                    {floor}층을 정복했습니다!
                  </div>
                </div>
              ) : gameResult.winner === 'white' ? (
                <div className="text-red-400">
                  <div className="text-3xl mb-2">💔</div>
                  <div className="text-xl font-bold">패배...</div>
                  <div className="text-sm text-red-300 mt-1">
                    다시 도전해보세요!
                  </div>
                </div>
              ) : (
                <div className="text-yellow-400">
                  <div className="text-3xl mb-2">🤝</div>
                  <div className="text-xl font-bold">무승부</div>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-300">
              <div>최종 점수: {gameResult.score.black} - {gameResult.score.white}</div>
              <div>총 수: {gameResult.moves}수</div>
              {gameResult.duration && (
                <div>소요 시간: {Math.floor(gameResult.duration / 1000)}초</div>
              )}
            </div>

            <div className="mt-4 text-xs text-gray-400">
              3초 후 타워 메인으로 이동합니다...
            </div>
          </div>
        </div>
      )}

      {/* 에너지 부족 경고 */}
      {!towerManager.canPlay && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full mx-4 text-center">
            <div className="text-red-400 mb-4">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-xl font-bold">에너지 부족</div>
            </div>

            <div className="text-sm text-gray-300 mb-4">
              게임을 플레이하려면 에너지가 필요합니다.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/tower')}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
              >
                타워로 돌아가기
              </button>

              {towerManager.totalCoins >= 10 && (
                <button
                  onClick={() => towerManager.buyEnergy(1)}
                  className="flex-1 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-white text-sm transition-colors"
                >
                  에너지 구매 (10코인)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}