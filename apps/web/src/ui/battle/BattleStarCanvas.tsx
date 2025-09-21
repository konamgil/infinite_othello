import React, { useRef, useEffect, useState } from 'react';

interface BattleStarCanvasProps {
  className?: string;
}

/**
 * A React component that renders a dynamic, animated canvas background for the battle feature.
 *
 * This component uses the HTML5 Canvas API to draw a "battle" themed space scene, including:
 * - A starry background with twinkling stars.
 * - Nebula effects using radial gradients.
 * - A central, pulsing energy core.
 * - Floating, rotating weapon and shield symbols.
 * - Energetic particle effects.
 *
 * The animation is driven by `requestAnimationFrame` for performance and only runs
 * when the canvas is visible on screen, as determined by the `IntersectionObserver` API.
 * It also handles resizing to ensure the canvas fills its container.
 *
 * @param {BattleStarCanvasProps} props - The component props.
 * @returns {React.ReactElement} The rendered canvas element.
 */
export function BattleStarCanvas({ className = '' }: BattleStarCanvasProps) {
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
    const numStars = 60;

    // 별들 초기화
    const starColors = ['#ffffff', '#e6f3ff', '#fff9e6', '#f0e6ff', '#e6fff9'];
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)]
      });
    }

    // 전투 에너지 파티클
    interface BattleParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      life: number;
      maxLife: number;
      color: string;
    }

    const battleParticles: BattleParticle[] = [];

    // 검과 방패 심볼
    interface WeaponSymbol {
      x: number;
      y: number;
      rotation: number;
      rotationSpeed: number;
      scale: number;
      pulse: number;
      type: 'sword' | 'shield';
    }

    const weaponSymbols: WeaponSymbol[] = [];

    // 무기 심볼 초기화
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.3;
      weaponSymbols.push({
        x: width * 0.5 + Math.cos(angle) * radius,
        y: height * 0.5 + Math.sin(angle) * radius,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        scale: Math.random() * 0.5 + 0.5,
        pulse: Math.random() * Math.PI * 2,
        type: i % 2 === 0 ? 'sword' : 'shield'
      });
    }

    let animationTime = 0;

    const animate = () => {
      animationTime += 0.016;

      // 배경 클리어
      ctx.clearRect(0, 0, width, height);

      // 전투 우주 배경
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0a0014');
      gradient.addColorStop(0.3, '#1a0a2e');
      gradient.addColorStop(0.7, '#2d1b3d');
      gradient.addColorStop(1, '#1a0a2e');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 전투 성운 효과
      const nebulae = [
        { x: width * 0.3, y: height * 0.2, size: width * 0.4, color: 'rgba(255, 69, 0, 0.1)' },
        { x: width * 0.7, y: height * 0.8, size: width * 0.3, color: 'rgba(138, 43, 226, 0.08)' },
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
        const twinkle = Math.sin(animationTime * star.twinkleSpeed + star.phase) * 0.4 + 0.6;
        const alpha = star.brightness * twinkle;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // 밝은 별들에 십자가 효과
        if (star.size > 1.5 && alpha > 0.7) {
          ctx.globalAlpha = alpha * 0.5;
          ctx.strokeStyle = star.color;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(star.x - star.size * 3, star.y);
          ctx.lineTo(star.x + star.size * 3, star.y);
          ctx.moveTo(star.x, star.y - star.size * 3);
          ctx.lineTo(star.x, star.y + star.size * 3);
          ctx.stroke();
        }
        ctx.restore();
      });

      // 중앙 전투 에너지 코어
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const coreSize = 30;

      ctx.save();
      const coreIntensity = Math.sin(animationTime * 2) * 0.3 + 0.7;
      ctx.shadowColor = '#ff4500';
      ctx.shadowBlur = 20 * coreIntensity;

      const coreGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, coreSize * coreIntensity
      );
      coreGradient.addColorStop(0, `rgba(255, 69, 0, ${0.6 * coreIntensity})`);
      coreGradient.addColorStop(0.5, `rgba(138, 43, 226, ${0.3 * coreIntensity})`);
      coreGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = coreGradient;
      ctx.fillRect(centerX - coreSize, centerY - coreSize, coreSize * 2, coreSize * 2);
      ctx.restore();

      // 무기 심볼들
      weaponSymbols.forEach(symbol => {
        symbol.rotation += symbol.rotationSpeed;
        symbol.pulse += 0.03;

        const pulseIntensity = Math.sin(symbol.pulse) * 0.3 + 0.7;
        const currentScale = symbol.scale * pulseIntensity;

        ctx.save();
        ctx.translate(symbol.x, symbol.y);
        ctx.rotate(symbol.rotation);
        ctx.scale(currentScale, currentScale);
        ctx.globalAlpha = 0.6;

        if (symbol.type === 'sword') {
          ctx.fillStyle = '#ff6b6b';
          // 검 모양
          ctx.fillRect(-2, -15, 4, 20);
          ctx.fillRect(-8, -18, 16, 6);
        } else {
          ctx.fillStyle = '#4ecdc4';
          // 방패 모양
          ctx.beginPath();
          ctx.moveTo(0, -15);
          ctx.lineTo(10, -10);
          ctx.lineTo(10, 10);
          ctx.lineTo(0, 15);
          ctx.lineTo(-10, 10);
          ctx.lineTo(-10, -10);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      });

      // 전투 파티클 생성
      if (Math.random() < 0.2) {
        for (let i = 0; i < 2; i++) {
          battleParticles.push({
            x: centerX + (Math.random() - 0.5) * 80,
            y: centerY + (Math.random() - 0.5) * 80,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            size: Math.random() * 3 + 1,
            life: 1,
            maxLife: Math.random() * 60 + 40,
            color: Math.random() > 0.5 ? '#ff4500' : '#8a2be2'
          });
        }
      }

      // 파티클 업데이트 및 그리기
      battleParticles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 1;
        particle.vx *= 0.98;
        particle.vy *= 0.98;

        if (particle.life <= 0) {
          battleParticles.splice(index, 1);
          return;
        }

        const alpha = particle.life / particle.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
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