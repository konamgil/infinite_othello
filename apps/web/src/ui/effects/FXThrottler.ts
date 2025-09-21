// FX 스로틀러 및 큐 시스템 - design-feedback.md 6번에서 요구한 시스템
// "동시 FX 최대 1개. 새 FX가 들어오면 큐에 넣고 끝난 뒤 재생"

type FXFunction = (onComplete?: () => void) => void;

/**
 * A class to manage and throttle visual effects.
 *
 * This system ensures that only one major visual effect plays at a time.
 * If a new effect is triggered while another is busy, it is added to a queue
 * and played after the current one finishes. It also includes a debounce
 * mechanism to prevent rapid, repetitive effect triggers.
 */
class FXThrottler {
  private fxQueue: FXFunction[] = [];
  private busy = false;
  private lastActionTime = 0;
  private readonly DEBOUNCE_DELAY = 200; // 200ms 디바운스

  /**
   * Plays an effect function, either immediately or by adding it to the queue.
   * @param {FXFunction} fn - The function that triggers the visual effect. It receives an `onComplete` callback that it must call when the effect is finished.
   */
  playFX(fn: FXFunction): void {
    // 동일 카테고리 중복 입력 방지 (디바운스)
    const now = Date.now();
    if (now - this.lastActionTime < this.DEBOUNCE_DELAY) {
      return; // 탈락
    }

    this.lastActionTime = now;

    if (this.busy) {
      // 큐에 추가
      this.fxQueue.push(fn);
      return;
    }

    // 즉시 실행
    this.executeFX(fn);
  }

  private executeFX(fn: FXFunction): void {
    this.busy = true;

    fn(() => {
      this.busy = false;
      // 큐에서 다음 FX 실행
      const nextFX = this.fxQueue.shift();
      if (nextFX) {
        this.executeFX(nextFX);
      }
    });
  }

  /**
   * Pauses all FX by clearing the queue and resetting the busy state.
   * This is useful during user interactions like scrolling or dragging.
   */
  pauseAll(): void {
    this.fxQueue.length = 0; // 큐 비우기
    this.busy = false;
  }

  /**
   * Checks if an effect is currently playing.
   * @returns {boolean} True if the throttler is busy.
   */
  isBusy(): boolean {
    return this.busy;
  }

  /**
   * Gets the number of effects currently waiting in the queue.
   * @returns {number} The length of the FX queue.
   */
  getQueueLength(): number {
    return this.fxQueue.length;
  }
}

/** A global singleton instance of the FXThrottler. */
export const fxThrottler = new FXThrottler();

// 사용 예시:
// fxThrottler.playFX((onComplete) => {
//   // FX 실행 코드
//   setTimeout(onComplete, 180); // 완료시 onComplete 호출
// });