/**
 * 타워 시스템 디버그 및 테스트용 패널
 * 개발 단계에서 상태 조작용
 */

import React from 'react';
import { useTowerGameManager } from '../../store/towerStore';

interface TowerDebugPanelProps {
  className?: string;
}

export function TowerDebugPanel({ className = '' }: TowerDebugPanelProps) {
  const towerManager = useTowerGameManager();

  // 진행도 리셋 (1층으로)
  const resetToFloor1 = () => {
    towerManager.resetProgress();
    // 로컬스토리지 클리어
    localStorage.removeItem('infinity-othello-tower-store');
    window.location.reload();
  };

  // 특정 층으로 스킵
  const skipToFloor = (floor: number) => {
    // 임시로 maxReachedFloor를 조작 (개발용)
    const currentState = JSON.parse(localStorage.getItem('infinity-othello-tower-store') || '{}');
    const newState = {
      ...currentState,
      state: {
        ...currentState.state,
        maxReachedFloor: floor,
        currentFloor: floor
      }
    };
    localStorage.setItem('infinity-othello-tower-store', JSON.stringify(newState));
    window.location.reload();
  };

  // 에너지 풀충전
  const refillEnergy = () => {
    const currentState = JSON.parse(localStorage.getItem('infinity-othello-tower-store') || '{}');
    const newState = {
      ...currentState,
      state: {
        ...currentState.state,
        energy: 5,
        lastEnergyUpdate: Date.now()
      }
    };
    localStorage.setItem('infinity-othello-tower-store', JSON.stringify(newState));
    window.location.reload();
  };

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-4 ${className}`}>
      <h3 className="text-white font-bold mb-4">🔧 타워 디버그 패널</h3>

      <div className="space-y-4">
        {/* 현재 상태 */}
        <div className="text-sm">
          <div className="text-gray-300 mb-2">현재 상태:</div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>최고 도달층: {towerManager.maxReachedFloor}층</div>
            <div>현재층: {towerManager.currentFloor}층</div>
            <div>에너지: {towerManager.energy}/{towerManager.maxEnergy}</div>
            <div>총 RP: {towerManager.totalRP}</div>
            <div>총 코인: {towerManager.totalCoins}</div>
            <div>승률: {(towerManager.winRate * 100).toFixed(1)}%</div>
          </div>
        </div>

        {/* 진행도 조작 */}
        <div>
          <div className="text-gray-300 mb-2 text-sm">진행도 조작:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={resetToFloor1}
              className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded text-white text-xs"
            >
              1층으로 리셋
            </button>
            <button
              onClick={() => skipToFloor(10)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-xs"
            >
              10층으로 스킵
            </button>
            <button
              onClick={() => skipToFloor(50)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-xs"
            >
              50층으로 스킵
            </button>
            <button
              onClick={() => skipToFloor(100)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-xs"
            >
              100층으로 스킵
            </button>
          </div>
        </div>

        {/* 리소스 조작 */}
        <div>
          <div className="text-gray-300 mb-2 text-sm">리소스 조작:</div>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={refillEnergy}
              className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded text-white text-xs"
            >
              에너지 풀충전
            </button>
          </div>
        </div>

        {/* AI 테스트 */}
        <div>
          <div className="text-gray-300 mb-2 text-sm">AI 테스트:</div>
          <div className="text-xs text-gray-400">
            {towerManager.currentAI ? (
              <div>
                <div>현재 AI: {towerManager.currentAI.name}</div>
                <div>난이도: {towerManager.currentAI.difficulty}</div>
                <div>실수율: {towerManager.currentAI.mistakeRate}%</div>
              </div>
            ) : (
              <div>AI 없음 (게임 중이 아님)</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-yellow-400">
        ⚠️ 개발용 패널입니다. 프로덕션에서는 제거하세요.
      </div>
    </div>
  );
}