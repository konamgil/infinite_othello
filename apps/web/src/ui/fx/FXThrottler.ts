// FX 스로틀러 및 큐 시스템 - design-feedback.md 6번에서 요구한 시스템
// "동시 FX 최대 1개. 새 FX가 들어오면 큐에 넣고 끝난 뒤 재생"

type FXFunction = (onComplete?: () => void) => void;

class FXThrottler {
  private fxQueue: FXFunction[] = [];
  private busy = false;
  private lastActionTime = 0;
  private readonly DEBOUNCE_DELAY = 200; // 200ms 디바운스

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

  // 스크롤/드래그 중 모든 FX 일시 중지
  pauseAll(): void {
    this.fxQueue.length = 0; // 큐 비우기
    this.busy = false;
  }

  // 현재 진행중인 FX가 있는지 확인
  isBusy(): boolean {
    return this.busy;
  }

  // 큐 상태 확인
  getQueueLength(): number {
    return this.fxQueue.length;
  }
}

// 전역 인스턴스
export const fxThrottler = new FXThrottler();

// 사용 예시:
// fxThrottler.playFX((onComplete) => {
//   // FX 실행 코드
//   setTimeout(onComplete, 180); // 완료시 onComplete 호출
// });