import React, { useRef, useEffect } from 'react';

interface CosmicTowerCanvasProps {
  currentFloor: number;
  maxFloor: number;
  className?: string;
}

interface Star {
  x: number; y: number; r: number; vx: number; vy: number; alpha: number;
}

export function CosmicTowerCanvas({ currentFloor, maxFloor, className = '' }: CosmicTowerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const stars: Star[] = [];

    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      return { width, height };
    };

    const { width, height } = resizeCanvas();

    // Create star layers for parallax effect
    for (let i = 0; i < 100; i++) {
      const speed = Math.random() * 0.2 + 0.1;
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * (speed > 0.2 ? 1.5 : 1.0),
        vx: (Math.random() - 0.5) * speed / 4,
        vy: speed * 0.5,
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    const animate = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw cosmic background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#0a0a1a');
      bgGradient.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw parallax stars
      stars.forEach(star => {
        star.y += star.vy;
        star.x += star.vx;
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

      // 3. Draw the ethereal tower
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

      // 4. Draw player progress ring
      const progress = Math.min(currentFloor / maxFloor, 1);
      const ringY = height - (progress * height * 0.8) - (height * 0.1);
      const pulse = Math.sin(time / 400) * 0.5 + 0.5;

      ctx.beginPath();
      ctx.arc(towerX, ringY, 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(251, 191, 36, ${pulse * 0.8 + 0.2})`;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 20 * pulse;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(towerX, ringY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate(0);

    window.addEventListener('resize', resizeCanvas);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [currentFloor, maxFloor]);

  return <canvas ref={canvasRef} className={className} />;
}
