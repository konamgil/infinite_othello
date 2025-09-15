import React, { useRef, useEffect, useState } from 'react';

interface MoreStarCanvasProps {
  className?: string;
}

export function MoreStarCanvas({ className = '' }: MoreStarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 해상도 설정
    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.scale(dpr, dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    setCanvasSize();

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    // 별들 배열
    interface Star {
      x: number;
      y: number;
      size: number;
      brightness: number;
      twinkleSpeed: number;
      phase: number;
      color: string;
    }

    const stars: Star[] = [];
    const numStars = 50;

    // 별들 초기화 - 부드러운 색상
    const starColors = ['#ffffff', '#f0f8ff', '#fff8dc', '#e6e6fa', '#f0fff0'];
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.6 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.008,
        phase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)]
      });
    }

    // 설정 기어들
    interface SettingsGear {
      x: number;
      y: number;
      size: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
      pulsePhase: number;
    }

    const settingsGears: SettingsGear[] = [];

    // 기어들 초기화
    for (let i = 0; i < 8; i++) {
      settingsGears.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 15 + 8,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        opacity: Math.random() * 0.3 + 0.2,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    let animationTime = 0;

    const animate = () => {
      animationTime += 0.016;

      // 배경 클리어
      ctx.clearRect(0, 0, width, height);

      // 차분한 우주 배경
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0f0f23');
      gradient.addColorStop(0.4, '#1a1a2e');
      gradient.addColorStop(0.8, '#16213e');
      gradient.addColorStop(1, '#0e1329');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 은은한 성운 효과
      const nebulae = [
        { x: width * 0.2, y: height * 0.3, size: width * 0.4, color: 'rgba(106, 90, 205, 0.06)' },
        { x: width * 0.8, y: height * 0.7, size: width * 0.3, color: 'rgba(70, 130, 180, 0.04)' }
      ];

      nebulae.forEach(nebula => {
        ctx.save();
        const nebulaGradient = ctx.createRadialGradient(
          nebula.x, nebula.y, 0,
          nebula.x, nebula.y, nebula.size
        );
        nebulaGradient.addColorStop(0, nebula.color);
        nebulaGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = nebulaGradient;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      });

      // 별들 그리기
      stars.forEach(star => {
        const twinkle = Math.sin(animationTime * star.twinkleSpeed + star.phase) * 0.3 + 0.7;
        const alpha = star.brightness * twinkle;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // 큰 별들에 부드러운 글로우
        if (star.size > 1.5) {
          ctx.globalAlpha = alpha * 0.3;
          ctx.shadowColor = star.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // 설정 기어들
      settingsGears.forEach(gear => {
        gear.rotation += gear.rotationSpeed;
        gear.pulsePhase += 0.02;

        const pulseIntensity = Math.sin(gear.pulsePhase) * 0.2 + 0.8;
        const currentOpacity = gear.opacity * pulseIntensity;

        ctx.save();
        ctx.translate(gear.x, gear.y);
        ctx.rotate(gear.rotation);
        ctx.globalAlpha = currentOpacity;
        ctx.strokeStyle = '#87ceeb';
        ctx.lineWidth = 1.5;

        // 기어 모양 그리기
        const teeth = 8;
        const innerRadius = gear.size * 0.6;
        const outerRadius = gear.size;

        ctx.beginPath();
        for (let i = 0; i < teeth * 2; i++) {
          const angle = (i / (teeth * 2)) * Math.PI * 2;
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // 중앙 구멍
        ctx.beginPath();
        ctx.arc(0, 0, gear.size * 0.3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // 리사이즈 이벤트
    const handleResize = () => setCanvasSize();
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  );
}