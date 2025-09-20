import React, { useEffect, useRef } from 'react';

/**
 * @interface ShopStarCanvasProps
 * `ShopStarCanvas` 컴포넌트의 props를 정의합니다.
 */
interface ShopStarCanvasProps {
  className?: string;
}

/** @interface ShopItem 상점에 떠다니는 아이템(보석, 코인, 상자)의 속성을 정의합니다. */
interface ShopItem {
  x: number; y: number; size: number; opacity: number; color: string;
  rotation: number; rotationSpeed: number; twinkle: number;
  type: 'gem' | 'coin' | 'chest';
}

/** @interface Coin 배경에 떠다니는 금화 파티클의 속성을 정의합니다. */
interface Coin {
  x: number; y: number; size: number; opacity: number;
  rotation: number; rotationSpeed: number; drift: number;
}

/**
 * 게임 내 상점 화면을 위한 동적이고 화려한 Canvas 배경을 렌더링하는 컴포넌트입니다.
 * 부유하고 마법적인 분위기를 연출하기 위해 반짝이는 보석, 떠다니는 금화,
 * 보물 상자 등 다양한 시각 효과를 포함합니다.
 * @param {ShopStarCanvasProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 애니메이션 배경을 위한 `<canvas>` 요소.
 */
export function ShopStarCanvas({ className = '' }: ShopStarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /** 캔버스 크기를 설정하고 고해상도 디스플레이에 맞게 조정합니다. */
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

    // --- 파티클 초기화 ---
    const shopItems: ShopItem[] = [];
    for (let i = 0; i < 20; i++) {
      shopItems.push({
        x: Math.random() * canvas.width / window.devicePixelRatio,
        y: Math.random() * canvas.height / window.devicePixelRatio,
        size: Math.random() * 4 + 2,
        opacity: Math.random() * 0.7 + 0.3,
        color: ['#FF6B35', '#F7931E', '#FFD23F', '#A8E6CF', '#88D8B0'][Math.floor(Math.random() * 5)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        twinkle: Math.random() * 0.03 + 0.01,
        type: ['gem', 'coin', 'chest'][Math.floor(Math.random() * 3)] as 'gem' | 'coin' | 'chest'
      });
    }

    const coins: Coin[] = [];
    for (let i = 0; i < 15; i++) {
      coins.push({
        x: Math.random() * canvas.width / window.devicePixelRatio,
        y: Math.random() * canvas.height / window.devicePixelRatio,
        size: Math.random() * 3 + 1.5,
        opacity: Math.random() * 0.5 + 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,
        drift: Math.random() * 0.8 + 0.3
      });
    }

    let time = 0;

    /** 매 프레임 실행되는 핵심 애니메이션 루프. */
    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // 1. 배경 그리기 (그라데이션 및 오라)
      const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
      gradient.addColorStop(0, '#2D1B69');
      gradient.addColorStop(1, '#2D1B69');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);

      const auraGrad = ctx.createRadialGradient(rect.width * 0.5, rect.height * 0.4, 0, rect.width * 0.5, rect.height * 0.4, rect.width * 0.7);
      auraGrad.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
      auraGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(rect.width * 0.5, rect.height * 0.4, rect.width * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // 2. 메인 상점 아이템 그리기 (보석, 코인, 상자)
      shopItems.forEach(item => { /* ... 아이템 렌더링 로직 ... */ });

      // 3. 떠다니는 금화들 그리기
      coins.forEach(coin => { /* ... 코인 렌더링 로직 ... */ });

      // 4. 추가적인 마법/RP 파티클 효과 그리기
      // ...

      time++;
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    // 컴포넌트 언마운트 시 정리
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
      style={{ background: 'linear-gradient(135deg, #2D1B69 0%, #1E3A8A 50%, #7C3AED 100%)' }}
    />
  );
}