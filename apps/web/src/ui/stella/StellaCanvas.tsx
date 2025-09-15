import React, { useRef, useEffect, useState } from 'react';

interface StellaCanvasProps {
  className?: string;
  isActive?: boolean;
}

export function StellaCanvas({ className = '', isActive = true }: StellaCanvasProps) {
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
    if (!isVisible || !isActive) return;

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
    const numStars = 80;

    // 별들 초기화 - 다양한 색상
    const starColors = ['#ffffff', '#e6f3ff', '#fff9e6', '#f0e6ff', '#e6fff9'];
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 0.8,
        brightness: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        phase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)]
      });
    }

    // 스텔라 AI 홀로그램 파티클
    interface StellaParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      life: number;
      maxLife: number;
      color: string;
    }

    const stellaParticles: StellaParticle[] = [];

    // 지식 오브 (떠다니는 지식 구체들)
    interface KnowledgeOrb {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      phase: number;
      speed: number;
      color: string;
      symbol: string;
    }

    const knowledgeOrbs: KnowledgeOrb[] = [];
    const orbSymbols = ['♔', '♕', '⚡', '🌟', '💡', '🔮', '✨'];
    const orbColors = ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f87171'];

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.25;
      knowledgeOrbs.push({
        x: width * 0.5 + Math.cos(angle) * radius,
        y: height * 0.5 + Math.sin(angle) * radius,
        baseX: width * 0.5 + Math.cos(angle) * radius,
        baseY: height * 0.5 + Math.sin(angle) * radius,
        size: Math.random() * 8 + 4,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.01,
        color: orbColors[Math.floor(Math.random() * orbColors.length)],
        symbol: orbSymbols[Math.floor(Math.random() * orbSymbols.length)]
      });
    }

    let animationTime = 0;

    const animate = () => {
      animationTime += 0.016;

      // 배경 클리어
      ctx.clearRect(0, 0, width, height);

      // 심우주 배경
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#000006');
      gradient.addColorStop(0.3, '#0a0a2e');
      gradient.addColorStop(0.7, '#16213e');
      gradient.addColorStop(1, '#0f172a');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 성운 효과들 - 여러 개
      const nebulae = [
        { x: width * 0.2, y: height * 0.3, size: width * 0.3, color: 'rgba(99, 102, 241, 0.08)' },
        { x: width * 0.8, y: height * 0.7, size: width * 0.25, color: 'rgba(168, 85, 247, 0.06)' },
        { x: width * 0.5, y: height * 0.1, size: width * 0.2, color: 'rgba(34, 211, 238, 0.05)' }
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
        if (star.size > 2 && alpha > 0.8) {
          ctx.globalAlpha = alpha * 0.6;
          ctx.strokeStyle = star.color;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(star.x - star.size * 4, star.y);
          ctx.lineTo(star.x + star.size * 4, star.y);
          ctx.moveTo(star.x, star.y - star.size * 4);
          ctx.lineTo(star.x, star.y + star.size * 4);
          ctx.stroke();
        }
        ctx.restore();
      });

      // 스텔라 AI 중앙 홀로그램
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const coreSize = 40;

      // AI 코어 - 맥동하는 에너지
      ctx.save();
      const coreIntensity = Math.sin(animationTime * 3) * 0.3 + 0.7;
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 30 * coreIntensity;

      const coreGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, coreSize * coreIntensity
      );
      coreGradient.addColorStop(0, `rgba(96, 165, 250, ${0.8 * coreIntensity})`);
      coreGradient.addColorStop(0.5, `rgba(168, 85, 247, ${0.4 * coreIntensity})`);
      coreGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = coreGradient;
      ctx.fillRect(centerX - coreSize, centerY - coreSize, coreSize * 2, coreSize * 2);
      ctx.restore();

      // AI 시그니처 - 회전하는 링들
      for (let ring = 0; ring < 3; ring++) {
        const ringRadius = 30 + ring * 15;
        const ringSpeed = (ring + 1) * 0.02;
        const numSegments = 8 + ring * 4;

        for (let i = 0; i < numSegments; i++) {
          const angle = (i / numSegments) * Math.PI * 2 + animationTime * ringSpeed;
          const x = centerX + Math.cos(angle) * ringRadius;
          const y = centerY + Math.sin(angle) * ringRadius;
          const segmentAlpha = Math.sin(animationTime * 2 + i) * 0.3 + 0.7;

          ctx.save();
          ctx.globalAlpha = segmentAlpha * 0.6;
          ctx.fillStyle = ring % 2 === 0 ? '#60a5fa' : '#a78bfa';
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 지식 오브들
      knowledgeOrbs.forEach(orb => {
        orb.phase += orb.speed;
        orb.x = orb.baseX + Math.cos(orb.phase) * 20;
        orb.y = orb.baseY + Math.sin(orb.phase * 1.3) * 15;

        // 오브 글로우
        ctx.save();
        ctx.shadowColor = orb.color;
        ctx.shadowBlur = 15;
        ctx.globalAlpha = Math.sin(animationTime * 2 + orb.phase) * 0.3 + 0.7;

        // 오브 본체
        const orbGradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size);
        orbGradient.addColorStop(0, orb.color);
        orbGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = orbGradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
        ctx.fill();

        // 지식 심볼
        ctx.restore();
        ctx.save();
        ctx.font = `${orb.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.fillText(orb.symbol, orb.x, orb.y);
        ctx.restore();
      });

      // 스텔라 AI 파티클 시스템 - 생각하는 AI
      if (Math.random() < 0.3) {
        for (let i = 0; i < 3; i++) {
          stellaParticles.push({
            x: centerX + (Math.random() - 0.5) * 60,
            y: centerY + (Math.random() - 0.5) * 60,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 3 + 1,
            life: 1,
            maxLife: Math.random() * 60 + 40,
            color: Math.random() > 0.5 ? '#60a5fa' : '#a78bfa'
          });
        }
      }

      // 파티클 업데이트 및 그리기
      stellaParticles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 1;
        particle.vx *= 0.98;
        particle.vy *= 0.98;

        if (particle.life <= 0) {
          stellaParticles.splice(index, 1);
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

      // 연결선들 - AI의 사고 패턴
      ctx.save();
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.3)';
      ctx.lineWidth = 1;
      knowledgeOrbs.forEach((orb1, i) => {
        knowledgeOrbs.slice(i + 1).forEach(orb2 => {
          const distance = Math.sqrt((orb1.x - orb2.x) ** 2 + (orb1.y - orb2.y) ** 2);
          if (distance < 150) {
            const alpha = (150 - distance) / 150 * 0.5;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(orb1.x, orb1.y);
            ctx.lineTo(orb2.x, orb2.y);
            ctx.stroke();
          }
        });
      });
      ctx.restore();

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
  }, [isVisible, isActive]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  );
}