// Placeholder haptics service (Web Vibration API)
export function vibrate(ms = 20) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    // @ts-ignore - older lib dom types
    navigator.vibrate?.(ms);
  }
}

