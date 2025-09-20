import React, { useRef, useEffect, useState, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'star' | 'spark' | 'meteor' | 'energy';
}

interface ParticleSystemProps {
  type: 'floating' | 'burst' | 'trail' | 'energy';
  intensity?: number;
  colors?: string[];
  className?: string;
  trigger?: boolean;
}

/**
 * A versatile particle system component rendered on an HTML5 Canvas.
 *
 * This component can render several types of particle effects ('floating', 'burst', 'trail', 'energy')
 * with configurable intensity and colors. It uses `requestAnimationFrame` for smooth animations
 * and an `IntersectionObserver` to ensure it only runs when visible, optimizing performance.
 * The 'burst' effect can be triggered via a `trigger` prop.
 *
 * @param {ParticleSystemProps} props - The component props.
 * @returns {React.ReactElement} The rendered canvas element for the particle system.
 */
export function ParticleSystem({
  type,
  intensity = 50,
  colors = ['#ffffff', '#fbbf24', '#60a5fa', '#a855f7'],
  className = '',
  trigger = false
}: ParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer로 성능 최적화
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

  const createParticle = useCallback((x?: number, y?: number): Particle => {
    const canvas = canvasRef.current;
    if (!canvas) return {} as Particle;

    const rect = canvas.getBoundingClientRect();
    const randomX = x ?? Math.random() * rect.width;
    const randomY = y ?? Math.random() * rect.height;

    const particleType = type === 'floating' ? 'star' :
                        type === 'burst' ? 'spark' :
                        type === 'trail' ? 'meteor' : 'energy';

    return {
      x: randomX,
      y: randomY,
      vx: (Math.random() - 0.5) * (type === 'burst' ? 8 : 2),
      vy: (Math.random() - 0.5) * (type === 'burst' ? 8 : 2) + (type === 'floating' ? -0.5 : 0),
      size: Math.random() * (type === 'burst' ? 4 : 6) + 1,
      opacity: Math.random() * 0.8 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      maxLife: type === 'burst' ? 60 : type === 'trail' ? 120 : 300,
      type: particleType
    };
  }, [type, colors]);

  const initParticles = useCallback(() => {
    particlesRef.current = [];
    for (let i = 0; i < intensity; i++) {
      particlesRef.current.push(createParticle());
    }
  }, [intensity, createParticle]);

  const updateParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    particlesRef.current = particlesRef.current.filter(particle => {
      // 위치 업데이트
      particle.x += particle.vx;
      particle.y += particle.vy;

      // 생명력 감소
      particle.life--;

      // 투명도 업데이트
      particle.opacity = particle.life / particle.maxLife;

      // 타입별 특별한 동작
      if (particle.type === 'star') {
        particle.vy += 0.01; // 중력
        particle.vx *= 0.999; // 공기저항
      } else if (particle.type === 'spark') {
        particle.vy += 0.2; // 강한 중력
        particle.size *= 0.98; // 크기 감소
      } else if (particle.type === 'meteor') {
        particle.vy += 0.05;
        // 꼬리 효과는 렌더링에서 처리
      } else if (particle.type === 'energy') {
        // 에너지 파티클은 위아래로 부유
        particle.vy += Math.sin(Date.now() * 0.01) * 0.1;
      }

      // 화면 경계에서 리스폰 (floating 타입만)
      if (type === 'floating') {
        if (particle.x < -10) particle.x = rect.width + 10;
        if (particle.x > rect.width + 10) particle.x = -10;
        if (particle.y < -10) {
          particle.y = rect.height + 10;
          particle.vy = Math.random() * -1 - 0.5;
        }
        if (particle.y > rect.height + 10) {
          particle.y = -10;
          particle.vy = Math.random() * 1 + 0.5;
        }
      }

      return particle.life > 0 &&
             particle.x >= -50 && particle.x <= rect.width + 50 &&
             particle.y >= -50 && particle.y <= rect.height + 50;
    });

    // floating 타입은 파티클 수 유지
    if (type === 'floating') {
      while (particlesRef.current.length < intensity) {
        particlesRef.current.push(createParticle());
      }
    }
  }, [type, intensity, createParticle]);

  const renderParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.opacity;

      if (particle.type === 'star') {
        // 별 모양
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // 십자가 효과
        if (particle.size > 2) {
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particle.x - particle.size * 2, particle.y);
          ctx.lineTo(particle.x + particle.size * 2, particle.y);
          ctx.moveTo(particle.x, particle.y - particle.size * 2);
          ctx.lineTo(particle.x, particle.y + particle.size * 2);
          ctx.stroke();
        }
      } else if (particle.type === 'spark') {
        // 스파크 효과
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.type === 'meteor') {
        // 유성 꼬리 효과
        const tailLength = 15;
        const gradient = ctx.createLinearGradient(
          particle.x, particle.y,
          particle.x - particle.vx * tailLength, particle.y - particle.vy * tailLength
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'transparent');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = particle.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x - particle.vx * tailLength, particle.y - particle.vy * tailLength);
        ctx.stroke();

        // 머리 부분
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.type === 'energy') {
        // 에너지 구체
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(0.5, particle.color + '80');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // 중심 코어
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }, []);

  // Burst 효과 트리거
  useEffect(() => {
    if (trigger && type === 'burst') {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      for (let i = 0; i < 30; i++) {
        particlesRef.current.push(createParticle(centerX, centerY));
      }
    }
  }, [trigger, type, createParticle]);

  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 크기 설정
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
    initParticles();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));

      updateParticles();
      renderParticles(ctx);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => setCanvasSize();
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible, initParticles, updateParticles, renderParticles]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      style={{ display: 'block' }}
    />
  );
}