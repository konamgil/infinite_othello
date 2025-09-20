// Simple audio service with graceful fallback
let audioContext: AudioContext | null = null;

/**
 * Initializes the global AudioContext.
 * This function should be called once, ideally after a user interaction,
 * to enable audio playback. It includes a fallback for older browsers.
 */
export function initAudio() {
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch (e) {
    console.warn('Audio not supported');
  }
}

/**
 * Plays a short, sharp click sound.
 * This is typically used for UI feedback on button presses or other interactions.
 * It will fail silently if the AudioContext has not been initialized or is not supported.
 */
export function playClick() {
  if (!audioContext) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    // Silent fail
  }
}

