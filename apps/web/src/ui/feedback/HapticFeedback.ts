/**
 * 햅틱 피드백 시스템
 * 모바일 디바이스에서 진동을 통한 촉각 피드백 제공
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection' | 'impact';

/**
 * A utility class for providing haptic feedback (vibrations) on supported devices.
 *
 * It uses the Web Vibration API and provides a set of pre-defined patterns
 * for common application events, such as button taps, game events, and notifications.
 */
export class HapticFeedback {
  private static isSupported = 'vibrate' in navigator;
  private static isEnabled = true;

  /**
   * Enables or disables all haptic feedback.
   * @param {boolean} enabled - True to enable, false to disable.
   */
  static setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Checks if the browser supports the Vibration API.
   * @returns {boolean} True if haptics are supported.
   */
  static isHapticSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Triggers a vibration with a pre-defined pattern.
   * @param {HapticPattern} pattern - The name of the vibration pattern to play.
   */
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

  /** A light tap vibration. */
  static lightTap() {
    this.trigger('light');
  }


  // --- Game-specific Haptic Patterns ---

  /** Vibration for placing a disc on the board. */
  static discPlace() {
    this.trigger('medium');
  }

  /** Vibration for discs being flipped. */
  static discFlip() {
    this.trigger('light');
  }

  /** Vibration for an invalid move attempt. */
  static invalidMove() {
    this.trigger('error');
  }

  /** A triumphant vibration for winning a game. */
  static gameWin() {
    if (!this.isSupported || !this.isEnabled) return;
    navigator.vibrate([100, 50, 100, 50, 200]); // 승리 패턴
  }

  /** A somber vibration for losing a game. */
  static gameLose() {
    if (!this.isSupported || !this.isEnabled) return;
    navigator.vibrate([200, 100, 100]); // 패배 패턴
  }

  /** A standard vibration for a button tap. */
  static buttonTap() {
    this.trigger('selection');
  }

  /** A special vibration for unlocking a new tower floor. */
  static floorUnlock() {
    if (!this.isSupported || !this.isEnabled) return;
    navigator.vibrate([30, 20, 30]); // 층 해금
  }

  /** An intense vibration for encountering a boss in the tower. */
  static bossEncounter() {
    if (!this.isSupported || !this.isEnabled) return;
    navigator.vibrate([100, 50, 100, 50, 100, 50, 200]); // 보스 조우
  }

  /** A light vibration for swiping between navigation screens. */
  static navigationSwipe() {
    this.trigger('light');
  }

  /** A subtle vibration to confirm a theme change. */
  static themeChange() {
    if (!this.isSupported || !this.isEnabled) return;
    navigator.vibrate([20, 10, 20, 10, 30]); // 테마 변경
  }
}

/** A global singleton instance of the HapticFeedback class for easy access. */
export const haptic = HapticFeedback;