// 간단한 오디오 서비스 (오류 발생 시 조용히 실패)
let audioContext: AudioContext | null = null;

/**
 * 전역 AudioContext를 초기화합니다.
 * 이 함수는 오디오 재생을 활성화하기 위해 사용자의 상호작용 후에 한 번만 호출되어야 합니다.
 * 구형 브라우저를 위한 폴백(fallback)을 포함합니다.
 */
export function initAudio() {
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch (e) {
    console.warn('이 브라우저에서는 오디오를 지원하지 않습니다.');
  }
}

/**
 * 짧고 날카로운 클릭 사운드를 재생합니다.
 * 주로 버튼 클릭과 같은 UI 상호작용에 대한 피드백으로 사용됩니다.
 * AudioContext가 초기화되지 않았거나 지원되지 않는 경우 조용히 실패합니다.
 */
export function playClick() {
  if (!audioContext) return;

  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 사운드 특성 설정
    oscillator.frequency.value = 800; // 주파수 (클릭 소리 톤)
    oscillator.type = 'square'; // 파형 (날카로운 소리)

    // 볼륨 조절 (짧게 끊어지는 효과)
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    // 조용한 실패 (오류를 던지지 않음)
  }
}

