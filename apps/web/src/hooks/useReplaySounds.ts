import { useCallback, useRef } from 'react';

export interface SoundConfig {
  enabled: boolean;
  volume: number; // 0-1
}

/**
 * A custom hook for managing and playing sound effects within the replay viewer.
 *
 * This hook uses the Web Audio API to generate tones for various events, such as
 * move playback, critical move detection, and UI interactions. It takes a configuration
 * object to enable/disable sounds and set the volume.
 *
 * @param {SoundConfig} config - The configuration for the sound effects.
 * @returns An object containing the sound-playing functions, a cleanup function, and the enabled status.
 */
export function useReplaySounds(config: SoundConfig) {
  const audioContextRef = useRef<AudioContext | null>(null);

  /**
   * Initializes the Web Audio API AudioContext.
   * It ensures that the AudioContext is created only once and only if sounds are enabled.
   *
   * @returns {AudioContext | null} The initialized AudioContext, or null if not supported or disabled.
   */
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && config.enabled) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Audio context not supported:', error);
      }
    }
    return audioContextRef.current;
  }, [config.enabled]);

  /**
   * Plays a tone with a specified frequency, duration, and waveform.
   * This is the core function for generating all sound effects.
   *
   * @param {number} frequency - The frequency of the tone in Hertz.
   * @param {number} duration - The duration of the tone in seconds.
   * @param {OscillatorType} [type='sine'] - The waveform of the oscillator.
   */
  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!config.enabled) return;

    const audioContext = initAudioContext();
    if (!audioContext) return;

    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(config.volume * 0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }, [config.enabled, config.volume, initAudioContext]);

  // A collection of specific sound effects for different replay events.
  const sounds = {
    // Move playback sounds
    playMove: useCallback(() => {
      playTone(400, 0.1, 'sine');
    }, [playTone]),

    // Critical move detection
    criticalMove: useCallback(() => {
      playTone(800, 0.2, 'square');
      setTimeout(() => playTone(600, 0.15, 'square'), 100);
    }, [playTone]),

    // Excellent move
    excellentMove: useCallback(() => {
      playTone(523, 0.15, 'sine'); // C5
      setTimeout(() => playTone(659, 0.15, 'sine'), 75); // E5
      setTimeout(() => playTone(784, 0.2, 'sine'), 150); // G5
    }, [playTone]),

    // Blunder detection
    blunder: useCallback(() => {
      playTone(200, 0.3, 'sawtooth');
    }, [playTone]),

    // UI interactions
    buttonClick: useCallback(() => {
      playTone(600, 0.05, 'square');
    }, [playTone]),

    // Play/pause
    playStart: useCallback(() => {
      playTone(440, 0.1, 'sine');
      setTimeout(() => playTone(554, 0.1, 'sine'), 50);
    }, [playTone]),

    playPause: useCallback(() => {
      playTone(440, 0.15, 'sine');
    }, [playTone]),

    // Navigation
    stepForward: useCallback(() => {
      playTone(500, 0.05, 'triangle');
    }, [playTone]),

    stepBackward: useCallback(() => {
      playTone(400, 0.05, 'triangle');
    }, [playTone]),

    // Jump to position
    jumpToMove: useCallback(() => {
      playTone(660, 0.1, 'sine');
    }, [playTone])
  };

  const cleanup = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  return {
    sounds,
    cleanup,
    isEnabled: config.enabled
  };
}