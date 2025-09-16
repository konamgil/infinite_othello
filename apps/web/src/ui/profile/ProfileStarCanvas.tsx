import React, { useEffect, useRef } from 'react';

interface ProfileStarCanvasProps {
  className?: string;
}

export function ProfileStarCanvas({ className = '' }: ProfileStarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    // 업적 상징들 (별자리 패턴)
    const constellations: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      color: string;
      connections: number[];
      twinkle: number;
    }> = [];

    // 떠다니는 트로피들
    const trophies: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      rotation: number;
      rotationSpeed: number;
      color: string;
      drift: number;
    }> = [];

    // 별자리 초기화 (업적을 상징)
    for (let i = 0; i < 35; i++) {
      constellations.push({
        x: Math.random() * canvas.width / window.devicePixelRatio,
        y: Math.random() * canvas.height / window.devicePixelRatio,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.7 + 0.3,
        color: ['#FFD700', '#FFA500', '#FF6347', '#FF4500', '#FFFF00'][Math.floor(Math.random() * 5)],
        connections: [],
        twinkle: Math.random() * 0.02 + 0.01
      });
    }

    // 트로피들 초기화
    for (let i = 0; i < 8; i++) {
      trophies.push({
        x: Math.random() * canvas.width / window.devicePixelRatio,
        y: Math.random() * canvas.height / window.devicePixelRatio,
        size: Math.random() * 4 + 2,
        opacity: Math.random() * 0.3 + 0.2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        color: ['#FFD700', '#C0C0C0', '#CD7F32', '#FF6B35'][Math.floor(Math.random() * 4)],
        drift: Math.random() * 0.5 + 0.2
      });
    }

    let time = 0;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // 배경 그라디언트 (영광의 색상)
      const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
      gradient.addColorStop(0, '#1a0826');
      gradient.addColorStop(0.3, '#2d1537');
      gradient.addColorStop(0.7, '#4a2c5a');
      gradient.addColorStop(1, '#2d1537');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // 승리의 광선
      ctx.save();
      const rayGrad = ctx.createRadialGradient(
        rect.width * 0.3, rect.height * 0.2, 0,
        rect.width * 0.3, rect.height * 0.2, rect.width * 0.6
      );
      rayGrad.addColorStop(0, 'rgba(255, 215, 0, 0.15)');
      rayGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');

      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.arc(rect.width * 0.3, rect.height * 0.2, rect.width * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 별자리 그리기 (업적 상징)
      constellations.forEach((star, index) => {
        const twinkle = Math.sin(time * star.twinkle) * 0.4 + 0.6;
        const currentOpacity = star.opacity * twinkle;

        ctx.save();
        ctx.globalAlpha = currentOpacity;
        ctx.fillStyle = star.color;
        ctx.shadowBlur = star.size * 3;
        ctx.shadowColor = star.color;

        // 업적 별
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = star.size * 1.5;
        const innerRadius = star.size * 0.7;

        for (let i = 0; i < spikes * 2; i++) {
          const angle = (i / (spikes * 2)) * Math.PI * 2;
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const x = star.x + Math.cos(angle) * radius;
          const y = star.y + Math.sin(angle) * radius;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // 별 중앙의 빛나는 코어
        ctx.globalAlpha = currentOpacity * 0.9;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // 간헐적 연결선 (업적간 연관성)
        if (index % 7 === 0 && index < constellations.length - 5) {
          const nextStar = constellations[index + 5];
          ctx.save();
          ctx.globalAlpha = 0.1 * twinkle;
          ctx.strokeStyle = star.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(nextStar.x, nextStar.y);
          ctx.stroke();
          ctx.restore();
        }
      });

      // 트로피들 (주요 업적들)
      trophies.forEach(trophy => {
        trophy.y -= trophy.drift;
        trophy.rotation += trophy.rotationSpeed;

        if (trophy.y < -20) {
          trophy.y = rect.height + 20;
          trophy.x = Math.random() * rect.width;
        }

        ctx.save();
        ctx.globalAlpha = trophy.opacity * (Math.sin(time * 0.005) * 0.3 + 0.7);
        ctx.translate(trophy.x, trophy.y);
        ctx.rotate(trophy.rotation);

        // 트로피 모양 그리기
        ctx.fillStyle = trophy.color;
        ctx.shadowBlur = trophy.size * 2;
        ctx.shadowColor = trophy.color;

        // 트로피 컵
        ctx.beginPath();
        ctx.ellipse(0, 0, trophy.size, trophy.size * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 트로피 손잡이
        ctx.strokeStyle = trophy.color;
        ctx.lineWidth = trophy.size * 0.3;
        ctx.beginPath();
        ctx.arc(trophy.size * 1.5, 0, trophy.size * 0.8, Math.PI * 0.7, Math.PI * 1.3, false);
        ctx.arc(-trophy.size * 1.5, 0, trophy.size * 0.8, Math.PI * 1.7, Math.PI * 0.3, false);
        ctx.stroke();

        // 트로피 받침
        ctx.fillRect(-trophy.size * 0.8, trophy.size * 1.2, trophy.size * 1.6, trophy.size * 0.3);

        ctx.restore();
      });

      // 성취의 파티클들
      ctx.save();
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < 12; i++) {
        const particleX = (time * 0.3 + i * 40) % rect.width;
        const particleY = rect.height * 0.8 + Math.sin(time * 0.008 + i) * 80;

        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(particleX, particleY, 1, 0, Math.PI * 2);
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
      style={{ background: 'linear-gradient(135deg, #1a0826 0%, #2d1537 50%, #4a2c5a 100%)' }}
    />
  );
}