import { useCallback } from 'react';
import { useGameStore } from '../../../store/gameStore';
import { haptic } from '../../../ui/feedback/HapticFeedback';

/**
 * 타워 진행도 관리 훅
 * 
 * 게임 승리 시 타워 진행도를 업데이트하고 관련 보상을 처리합니다.
 */
export function useTowerProgress() {
  const { player, updatePlayer } = useGameStore();

  /**
   * 타워 층 클리어 처리
   * 
   * @param clearedFloor - 클리어한 층수
   * @param isVictory - 승리 여부
   */
  const clearFloor = useCallback((clearedFloor: number, isVictory: boolean) => {
    if (!isVictory) {
      console.log('타워 도전 실패:', clearedFloor);
      return;
    }

    // 현재 진행도보다 높은 층을 클리어한 경우에만 업데이트
    if (clearedFloor >= player.towerProgress) {
      const newProgress = clearedFloor + 1; // 다음 층으로 진행
      const maxProgress = Math.min(newProgress, 300); // 최대 300층

      // 보상 계산
      const baseRpReward = 50;
      const floorBonus = Math.floor(clearedFloor / 10) * 5; // 10층마다 5 RP 추가
      const isBossFloor = clearedFloor % 50 === 0;
      const bossBonus = isBossFloor ? 200 : 0; // 보스층 클리어시 200 RP 추가
      
      const totalRpReward = baseRpReward + floorBonus + bossBonus;

      console.log('🏆 타워 층 클리어!', {
        floor: clearedFloor,
        newProgress: maxProgress,
        rpReward: totalRpReward,
        isBoss: isBossFloor
      });

      // 플레이어 데이터 업데이트
      updatePlayer({
        towerProgress: maxProgress,
        currentFloor: maxProgress,
        rp: player.rp + totalRpReward,
        wins: player.wins + 1,
        winStreak: player.winStreak + 1
      });

      // 햅틱 피드백
      if (isBossFloor) {
        haptic.gameWin();
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 300]);
        }
      } else {
        haptic.levelUp();
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      }

      // 특별한 층 달성 시 추가 처리
      if (maxProgress === 300) {
        console.log('🎉 무한의 탑 정복 완료!');
        // 최종 보상 추가 가능
      } else if (isBossFloor) {
        console.log('👑 보스층 클리어!', clearedFloor);
      }

      return {
        success: true,
        newProgress: maxProgress,
        rpReward: totalRpReward,
        isBossFloor
      };
    } else {
      console.log('이미 클리어한 층:', clearedFloor);
      
      // 이미 클리어한 층 재플레이 시 소량의 RP 보상
      const replayRpReward = 10;
      updatePlayer({
        rp: player.rp + replayRpReward,
        wins: player.wins + 1,
        winStreak: player.winStreak + 1
      });

      return {
        success: true,
        newProgress: player.towerProgress,
        rpReward: replayRpReward,
        isBossFloor: false,
        isReplay: true
      };
    }
  }, [player, updatePlayer]);

  /**
   * 타워 도전 실패 처리
   * 
   * @param failedFloor - 실패한 층수
   */
  const failFloor = useCallback((failedFloor: number) => {
    console.log('💀 타워 도전 실패:', failedFloor);

    // 실패 시에도 소량의 경험치 RP 지급
    const consolationRp = 5;
    
    updatePlayer({
      rp: player.rp + consolationRp,
      losses: player.losses + 1,
      winStreak: 0 // 연승 초기화
    });

    // 실패 햅틱 피드백
    haptic.error();
    if (navigator.vibrate) {
      navigator.vibrate([300, 100, 300]);
    }

    return {
      success: false,
      rpReward: consolationRp
    };
  }, [player, updatePlayer]);

  /**
   * 현재 도전 가능한 층 확인
   */
  const canChallengeFloor = useCallback((floor: number): boolean => {
    return floor > 0 && floor <= player.towerProgress && floor <= 300;
  }, [player.towerProgress]);

  /**
   * 다음 도전할 층 가져오기
   */
  const getNextFloor = useCallback((): number => {
    return Math.min(player.towerProgress, 300);
  }, [player.towerProgress]);

  /**
   * 보스층 여부 확인
   */
  const isBossFloor = useCallback((floor: number): boolean => {
    return floor % 50 === 0;
  }, []);

  return {
    // 상태
    currentProgress: player.towerProgress,
    maxFloor: 300,
    
    // 액션
    clearFloor,
    failFloor,
    
    // 유틸리티
    canChallengeFloor,
    getNextFloor,
    isBossFloor
  };
}

