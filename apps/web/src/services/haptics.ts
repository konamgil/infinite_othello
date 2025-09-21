/**
 * 지원되는 기기에서 간단한 진동을 발생시킵니다.
 *
 * 이 함수는 웹 진동 API(Web Vibration API)를 사용합니다.
 * 이 API를 지원하지 않는 기기에서는 아무런 동작도 하지 않습니다.
 *
 * @param {number} [ms=20] - 진동의 지속 시간 (밀리초).
 */
export function vibrate(ms = 20) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    // @ts-ignore - 오래된 lib dom 타입 호환성을 위해 무시
    navigator.vibrate?.(ms);
  }
}

