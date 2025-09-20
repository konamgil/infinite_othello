import React, { useRef, useEffect } from 'react';

/**
 * @interface CosmicTowerCanvasProps
 * `CosmicTowerCanvas` 컴포넌트의 props를 정의합니다.
 */
interface CosmicTowerCanvasProps {
  /** @property {number} currentFloor - 플레이어의 현재 층수. */
  currentFloor: number;
  /** @property {number} maxFloor - 탑의 최대 층수. */
  maxFloor: number;
  /** @property {string} [className] - 컴포넌트의 최상위 `<canvas>` 요소에 적용할 추가 CSS 클래스. */
  className?: string;
}

/**
 * @interface Star
 * 별 파티클의 속성을 정의하는 타입. 시차 효과(Parallax)를 위해 각기 다른 속도를 가집니다.
 */
interface Star {
  x: number; y: number; r: number; vx: number; vy: number; alpha: number;
}

/**
 * '무한의 탑' 진행 상황을 추상적이고 아름다운 우주 컨셉으로 시각화하는 Canvas 컴포넌트입니다.
 * 시차 효과가 적용된 별 필드와 빛나는 탑, 그리고 플레이어의 진행률을 나타내는 펄스 링을 렌더링합니다.
 * @param {CosmicTowerCanvasProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 애니메이션을 위한 `<canvas>` 요소.
 */
export function CosmicTowerCanvas({ currentFloor, maxFloor, className = '' }: CosmicTowerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const stars: Star[] = [];

    /** 캔버스 크기를 설정하고 고해상도 디스플레이에 맞게 조정합니다. */
    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      return { width, height };
    };

    const { width, height } = resizeCanvas();

    // 시차 효과(Parallax effect)를 위해 속도가 다른 별들을 생성합니다.
    for (let i = 0; i < 100; i++) {
      const speed = Math.random() * 0.2 + 0.1;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * (speed > 0.2 ? 1.5 : 1.0),
        vx: (Math.random() - 0.5) * speed / 4, // 좌우 미세한 움직임
        vy: speed * 0.5, // 주된 하강 속도
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    /** 매 프레임 실행되는 핵심 애니메이션 루프. */
    const animate = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // 1. 우주 배경 그리기
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#0a0a1a');
      bgGradient.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. 시차 효과가 적용된 별들 그리기 및 위치 업데이트
      stars.forEach(star => {
        star.y += star.vy;
        star.x += star.vx;
        // 화면을 벗어나면 다시 위에서 나타나도록 처리
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
        if (star.x > width || star.x < 0) {
            star.vx *= -1;
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();
      });

      // 3. 반투명한 '에테르' 탑 그리기
      const towerX = width / 2;
      const towerWidth = width * 0.3;
      ctx.globalAlpha = 0.4;
      const towerGradient = ctx.createLinearGradient(towerX - towerWidth / 2, 0, towerX + towerWidth / 2, 0);
      towerGradient.addColorStop(0, 'rgba(139, 92, 246, 0)');
      towerGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.5)');
      towerGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = towerGradient;
      ctx.fillRect(towerX - towerWidth / 2, 0, towerWidth, height);
      ctx.globalAlpha = 1.0;

      // 4. 플레이어 진행률을 나타내는 펄스 링 그리기
      const progress = Math.min(currentFloor / maxFloor, 1);
      const ringY = height - (progress * height * 0.8) - (height * 0.1);
      const pulse = Math.sin(time / 400) * 0.5 + 0.5; // 0~1 사이를 반복하는 값

      // 바깥쪽 글로우
      ctx.beginPath();
      ctx.arc(towerX, ringY, 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(251, 191, 36, ${pulse * 0.8 + 0.2})`;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 20 * pulse;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 안쪽 흰색 핵
      ctx.beginPath();
      ctx.arc(towerX, ringY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate(0);

    // 컴포넌트 언마운트 시 애니메이션과 이벤트 리스너 정리
    window.addEventListener('resize', resizeCanvas);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [currentFloor, maxFloor]);

  return <canvas ref={canvasRef} className={className} />;
}
