import React, { useEffect, useRef } from 'react';

/**
 * @interface ReplayStarCanvasProps
 * `ReplayStarCanvas` 컴포넌트의 props를 정의합니다.
 */
interface ReplayStarCanvasProps {
  /** @property {string} [className] - 컴포넌트의 최상위 `<canvas>` 요소에 적용할 추가 CSS 클래스. */
  className?: string;
}

/**
 * HTML5 Canvas를 사용하여 아름다운 우주 배경 애니메이션을 렌더링하는 장식용 컴포넌트입니다.
 * 반짝이는 별, 떠다니는 시간 파편, 미묘한 입자 흐름 등을 포함하여 동적인 배경을 만듭니다.
 * @param {ReplayStarCanvasProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 애니메이션 배경을 위한 `<canvas>` 요소.
 */
export function ReplayStarCanvas({ className = '' }: ReplayStarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();

  // 이 useEffect는 컴포넌트가 마운트될 때 한 번만 실행되어 애니메이션을 설정하고 시작합니다.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /**
     * 캔버스 크기를 부모 요소에 맞게 조정하고, 고해상도(HiDPI/Retina) 디스플레이를 지원합니다.
     * `devicePixelRatio`를 사용하여 선명한 렌더링을 보장합니다.
     */
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // --- 파티클(입자) 데이터 구조 정의 ---

    /** 별들의 상태를 저장하는 배열 */
    const stars: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      twinkleSpeed: number;
      color: string;
    }> = [];

    /** 시간 파편들의 상태를 저장하는 배열 */
    const timeFragments: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      drift: number; // 떠다니는 속도
      color: string;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    // --- 파티클 초기화 ---

    // 45개의 별을 무작위 위치, 크기, 색상으로 생성합니다.
    for (let i = 0; i < 45; i++) {
      stars.push({
        x: Math.random() * canvas.width / window.devicePixelRatio,
        y: Math.random() * canvas.height / window.devicePixelRatio,
        size: Math.random() * 2.5 + 0.8,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        color: ['#E6E6FA', '#DDA0DD', '#DA70D6', '#BA55D3', '#9370DB'][Math.floor(Math.random() * 5)]
      });
    }

    // 25개의 시간 파편(기록의 조각들)을 무작위 속성으로 생성합니다.
    for (let i = 0; i < 25; i++) {
      timeFragments.push({
        x: Math.random() * canvas.width / window.devicePixelRatio,
        y: Math.random() * canvas.height / window.devicePixelRatio,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.4 + 0.1,
        drift: Math.random() * 0.8 + 0.2,
        color: ['#4B0082', '#483D8B', '#6A5ACD', '#7B68EE', '#9370DB'][Math.floor(Math.random() * 5)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02
      });
    }

    let time = 0; // 애니메이션 시간 경과를 위한 카운터

    /**
     * `requestAnimationFrame`에 의해 매 프레임 호출되는 핵심 애니메이션 함수입니다.
     * 캔버스를 지우고 모든 시각적 요소를 다시 그립니다.
     */
    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // 1. 우주 배경 그라디언트 그리기
      const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
      gradient.addColorStop(0, '#0B0021');    // 깊은 보라
      gradient.addColorStop(0.3, '#1a0b3d');  // 진한 남보라
      gradient.addColorStop(0.7, '#2d1b5f');  // 중간 보라
      gradient.addColorStop(1, '#1a0b3d');    // 다시 진해짐
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // 2. 시간의 흔적 - 미묘한 나선형 성운 효과
      ctx.save();
      const spiralGrad = ctx.createRadialGradient(
        rect.width * 0.7, rect.height * 0.3, 0,
        rect.width * 0.7, rect.height * 0.3, rect.width * 0.4
      );
      spiralGrad.addColorStop(0, 'rgba(138, 43, 226, 0.08)');
      spiralGrad.addColorStop(1, 'rgba(138, 43, 226, 0)');
      ctx.fillStyle = spiralGrad;
      ctx.beginPath();
      ctx.arc(rect.width * 0.7, rect.height * 0.3, rect.width * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. 별들 그리기 (반짝임 효과 포함)
      stars.forEach(star => {
        const twinkle = Math.sin(time * star.twinkleSpeed) * 0.3 + 0.7;
        const currentOpacity = star.opacity * twinkle;

        ctx.save();
        ctx.globalAlpha = currentOpacity;
        ctx.fillStyle = star.color;
        ctx.shadowBlur = star.size * 2;
        ctx.shadowColor = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // 별 중앙에 더 밝은 핵을 그려 깊이감을 줌
        ctx.globalAlpha = currentOpacity * 0.8;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 4. 시간 파편들 그리기 (위로 떠다니며 회전)
      timeFragments.forEach(fragment => {
        fragment.y -= fragment.drift;
        fragment.rotation += fragment.rotationSpeed;

        // 화면 위로 벗어나면 아래에서 다시 나타남
        if (fragment.y < -10) {
          fragment.y = rect.height + 10;
          fragment.x = Math.random() * rect.width;
        }

        ctx.save();
        ctx.globalAlpha = fragment.opacity * (Math.sin(time * 0.01) * 0.2 + 0.8);
        ctx.translate(fragment.x, fragment.y);
        ctx.rotate(fragment.rotation);

        // 다이아몬드 모양으로 파편을 그림
        ctx.fillStyle = fragment.color;
        ctx.shadowBlur = fragment.size;
        ctx.shadowColor = fragment.color;
        ctx.beginPath();
        ctx.moveTo(0, -fragment.size);
        ctx.lineTo(fragment.size * 0.7, 0);
        ctx.lineTo(0, fragment.size);
        ctx.lineTo(-fragment.size * 0.7, 0);
        ctx.closePath();
        ctx.fill();

        // 내부에 빛나는 효과 추가
        ctx.globalAlpha = fragment.opacity * 0.6;
        ctx.fillStyle = '#E6E6FA';
        ctx.beginPath();
        ctx.moveTo(0, -fragment.size * 0.5);
        ctx.lineTo(fragment.size * 0.35, 0);
        ctx.lineTo(0, fragment.size * 0.5);
        ctx.lineTo(-fragment.size * 0.35, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // 5. 시간의 흐름을 나타내는 미묘한 입자들
      ctx.save();
      ctx.globalAlpha = 0.1;
      for (let i = 0; i < 8; i++) {
        const flowX = (time * 0.5 + i * 50) % rect.width;
        const flowY = rect.height * 0.5 + Math.sin(time * 0.01 + i) * 100;
        ctx.fillStyle = '#9370DB';
        ctx.beginPath();
        ctx.arc(flowX, flowY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      time++;
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    // 컴포넌트가 언마운트될 때 이벤트 리스너와 애니메이션을 정리합니다.
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ background: 'linear-gradient(135deg, #0B0021 0%, #1a0b3d 50%, #2d1b5f 100%)' }}
    />
  );
}