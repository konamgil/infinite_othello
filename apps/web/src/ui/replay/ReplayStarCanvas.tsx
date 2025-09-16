import React, { useEffect, useRef } from 'react';

interface ReplayStarCanvasProps {
  className?: string;
}

export function ReplayStarCanvas({ className = '' }: ReplayStarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 별들과 시간 파편 입자들
    const stars: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      twinkleSpeed: number;
      color: string;
    }> = [];

    const timeFragments: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      drift: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    // 별들 초기화
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

    // 시간 파편들 초기화 (기록의 조각들)
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

    let time = 0;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // 우주 배경 그라디언트
      const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
      gradient.addColorStop(0, '#0B0021');    // 깊은 보라
      gradient.addColorStop(0.3, '#1a0b3d');  // 진한 남보라
      gradient.addColorStop(0.7, '#2d1b5f');  // 중간 보라
      gradient.addColorStop(1, '#1a0b3d');    // 다시 진해짐

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // 시간의 흔적 - 미묘한 나선
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

      // 별들 그리기 (반짝임)
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

        // 별 중앙에 더 밝은 핵
        ctx.globalAlpha = currentOpacity * 0.8;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 시간 파편들 (기록의 조각들)
      timeFragments.forEach(fragment => {
        fragment.y -= fragment.drift;
        fragment.rotation += fragment.rotationSpeed;

        if (fragment.y < -10) {
          fragment.y = rect.height + 10;
          fragment.x = Math.random() * rect.width;
        }

        ctx.save();
        ctx.globalAlpha = fragment.opacity * (Math.sin(time * 0.01) * 0.2 + 0.8);
        ctx.translate(fragment.x, fragment.y);
        ctx.rotate(fragment.rotation);

        // 다이아몬드 모양의 시간 파편
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

        // 내부 빛
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

      // 시간의 흐름을 나타내는 미묘한 입자들
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