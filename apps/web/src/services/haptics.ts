/**
 * Triggers a simple vibration on supported devices.
 *
 * This function uses the Web Vibration API. It will do nothing on devices
 * that do not support this API.
 *
 * @param {number} [ms=20] - The duration of the vibration in milliseconds.
 */
export function vibrate(ms = 20) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    // @ts-ignore - older lib dom types
    navigator.vibrate?.(ms);
  }
}

