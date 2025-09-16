/**
 * 햅틱 피드백 시스템
 * 모바일 디바이스에서 진동을 통한 촉각 피드백 제공
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection' | 'impact';

export class HapticFeedback {
  private static isSupported = 'vibrate' in navigator;
  private static isEnabled = true;

  static setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  static isHapticSupported(): boolean {
    return this.isSupported;
  }

  static trigger(pattern: HapticPattern) {
    if (!this.isSupported || !this.isEnabled) return;

    const vibrationPattern = this.getVibrationPattern(pattern);

    try {
      navigator.vibrate(vibrationPattern);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  private static getVibrationPattern(pattern: HapticPattern): number | number[] {
    switch (pattern) {
      case 'light':
        return [10]; // 짧은 진동

      case 'medium':
        return [25]; // 중간 진동

      case 'heavy':
        return [50]; // 강한 진동

      case 'success':
        return [30, 20, 30]; // 성공 패턴

      case 'error':
        return [50, 30, 50, 30, 50]; // 에러 패턴

      case 'warning':
        return [40, 20, 40]; // 경고 패턴

      case 'selection':
        return [15]; // 선택 피드백

      case 'impact':
        return [20, 10, 30]; // 충격 패턴

      default:
        return [25]; // 기본 패턴
    }
  }

static lightTap() {
    this.trigger('light');
  }


  // 게임 특화 햅틱 패턴들
  static discPlace() {
    this.trigger('medium');
  }

  static discFlip() {
    this.trigger('light');
  }

  static invalidMove() {
    this.trigger('error');
  }

  static gameWin() {
    if (!this.isSupported || !this.isEnabled) return;
    navigator.vibrate([100, 50, 100, 50, 200]); // 승리 패턴
  }

  static gameLose() {
    if (!this.isSupported || !this.isEnabled) return;
    navigator.vibrate([200, 100, 100]); // 패배 패턴
  }

  static buttonTap() {
    this.trigger('selection');
  }

  static floorUnlock() {
    if (!this.isSupported || !this.isEnabled) return;
    navigator.vibrate([30, 20, 30]); // 층 해금
  }

  static bossEncounter() {
    if (!this.isSupported || !this.isEnabled) return;
    navigator.vibrate([100, 50, 100, 50, 100, 50, 200]); // 보스 조우
  }

  static navigationSwipe() {
    this.trigger('light');
  }

  static themeChange() {
    if (!this.isSupported || !this.isEnabled) return;
    navigator.vibrate([20, 10, 20, 10, 30]); // 테마 변경
  }
}

// 전역 햅틱 헬퍼
export const haptic = HapticFeedback;