import { useCallback, useRef } from 'react';

/**
 * @interface SoundConfig
 * 사운드 효과의 설정을 정의합니다.
 */
export interface SoundConfig {
  enabled: boolean; // 사운드 활성화 여부
  volume: number;   // 볼륨 (0-1)
}

/**
 * 리플레이 뷰어 내에서 사운드 효과를 관리하고 재생하는 커스텀 훅.
 *
 * 이 훅은 Web Audio API를 사용하여 수 재생, 중요한 수 감지, UI 상호작용 등
 * 다양한 이벤트에 대한 톤을 생성합니다. 사운드를 활성화/비활성화하고 볼륨을
 * 설정하기 위한 설정 객체를 받습니다.
 *
 * @param {SoundConfig} config - 사운드 효과에 대한 설정.
 * @returns 사운드 재생 함수, 정리 함수, 활성화 상태를 포함하는 객체.
 */
export function useReplaySounds(config: SoundConfig) {
  const audioContextRef = useRef<AudioContext | null>(null);

  /**
   * Web Audio API의 AudioContext를 초기화합니다.
   * AudioContext가 한 번만 그리고 사운드가 활성화된 경우에만 생성되도록 보장합니다.
   *
   * @returns {AudioContext | null} 초기화된 AudioContext, 또는 지원되지 않거나 비활성화된 경우 null.
   */
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && config.enabled) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('오디오 컨텍스트를 지원하지 않습니다:', error);
      }
    }
    return audioContextRef.current;
  }, [config.enabled]);

  /**
   * 지정된 주파수, 지속 시간, 파형으로 톤을 재생합니다.
   * 모든 사운드 효과를 생성하는 핵심 함수입니다.
   *
   * @param {number} frequency - 톤의 주파수 (헤르츠).
   * @param {number} duration - 톤의 지속 시간 (초).
   * @param {OscillatorType} [type='sine'] - 오실레이터의 파형.
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
      console.warn('사운드 재생 중 오류 발생:', error);
    }
  }, [config.enabled, config.volume, initAudioContext]);

  // 다양한 리플레이 이벤트를 위한 특정 사운드 효과 모음.
  const sounds = {
    // 수 재생 사운드
    playMove: useCallback(() => playTone(400, 0.1, 'sine'), [playTone]),

    // 중요한 수 감지
    criticalMove: useCallback(() => {
      playTone(800, 0.2, 'square');
      setTimeout(() => playTone(600, 0.15, 'square'), 100);
    }, [playTone]),

    // 훌륭한 수
    excellentMove: useCallback(() => {
      playTone(523, 0.15, 'sine'); // C5
      setTimeout(() => playTone(659, 0.15, 'sine'), 75); // E5
      setTimeout(() => playTone(784, 0.2, 'sine'), 150); // G5
    }, [playTone]),

    // 큰 실수 감지
    blunder: useCallback(() => playTone(200, 0.3, 'sawtooth'), [playTone]),

    // UI 상호작용
    buttonClick: useCallback(() => playTone(600, 0.05, 'square'), [playTone]),

    // 재생/일시정지
    playStart: useCallback(() => {
      playTone(440, 0.1, 'sine');
      setTimeout(() => playTone(554, 0.1, 'sine'), 50);
    }, [playTone]),
    playPause: useCallback(() => playTone(440, 0.15, 'sine'), [playTone]),

    // 네비게이션
    stepForward: useCallback(() => playTone(500, 0.05, 'triangle'), [playTone]),
    stepBackward: useCallback(() => playTone(400, 0.05, 'triangle'), [playTone]),

    // 위치로 점프
    jumpToMove: useCallback(() => playTone(660, 0.1, 'sine'), [playTone])
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