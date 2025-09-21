import React, { useRef, useEffect, useState } from 'react';

interface SettingsStarCanvasProps {
  className?: string;
}

export function SettingsStarCanvas({ className = '' }: SettingsStarCanvasProps) {
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
    const numStars = 45;

    // 별들 초기화 - 설정 테마에 맞는 색상
    const starColors = ['#ffffff', '#e6f3ff', '#f0f8ff', '#fff8dc', '#e0e6ff', '#f5f0ff'];
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 0.5,
        brightness: Math.random() * 0.7 + 0.2,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
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
      type: 'gear' | 'cog' | 'wheel';
    }

    const settingsGears: SettingsGear[] = [];
    const gearTypes: ('gear' | 'cog' | 'wheel')[] = ['gear', 'cog', 'wheel'];

    // 기어들 초기화 - 다양한 크기와 타입
    for (let i = 0; i < 6; i++) {
      settingsGears.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 18 + 10,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.008,
        opacity: Math.random() * 0.25 + 0.15,
        pulsePhase: Math.random() * Math.PI * 2,
        type: gearTypes[Math.floor(Math.random() * gearTypes.length)]
      });
    }

    // 설정 아이콘들 (슬라이더, 토글 등)
    interface SettingsIcon {
      x: number;
      y: number;
      type: 'slider' | 'toggle' | 'switch';
      animationPhase: number;
      opacity: number;
      size: number;
    }

    const settingsIcons: SettingsIcon[] = [];
    const iconTypes: ('slider' | 'toggle' | 'switch')[] = ['slider', 'toggle', 'switch'];

    for (let i = 0; i < 4; i++) {
      settingsIcons.push({
        x: Math.random() * width,
        y: Math.random() * height,
        type: iconTypes[Math.floor(Math.random() * iconTypes.length)],
        animationPhase: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.2 + 0.1,
        size: Math.random() * 12 + 8
      });
    }

    let animationTime = 0;

    const drawGear = (gear: SettingsGear, alpha: number) => {
      ctx.save();
      ctx.translate(gear.x, gear.y);
      ctx.rotate(gear.rotation);
      ctx.globalAlpha = alpha;

      if (gear.type === 'gear') {
        // 전통적인 기어
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 1.2;

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
        ctx.arc(0, 0, gear.size * 0.25, 0, Math.PI * 2);
        ctx.stroke();
      } else if (gear.type === 'cog') {
        // 현대적인 톱니바퀴
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1.5;

        const spokes = 6;
        for (let i = 0; i < spokes; i++) {
          const angle = (i / spokes) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle) * gear.size, Math.sin(angle) * gear.size);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(0, 0, gear.size * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // 휠 형태
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.arc(0, 0, gear.size, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, gear.size * 0.7, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, gear.size * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawSettingsIcon = (icon: SettingsIcon, alpha: number) => {
      ctx.save();
      ctx.translate(icon.x, icon.y);
      ctx.globalAlpha = alpha;

      if (icon.type === 'slider') {
        // 슬라이더
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-icon.size, 0);
        ctx.lineTo(icon.size, 0);
        ctx.stroke();

        // 슬라이더 핸들
        const handlePos = Math.sin(icon.animationPhase) * icon.size * 0.6;
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(handlePos, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (icon.type === 'toggle') {
        // 토글 스위치
        const isOn = Math.sin(icon.animationPhase) > 0;
        ctx.fillStyle = isOn ? '#10b981' : '#6b7280';
        ctx.beginPath();
        ctx.roundRect(-icon.size * 0.6, -icon.size * 0.3, icon.size * 1.2, icon.size * 0.6, icon.size * 0.3);
        ctx.fill();

        // 토글 노브
        ctx.fillStyle = '#ffffff';
        const knobX = isOn ? icon.size * 0.3 : -icon.size * 0.3;
        ctx.beginPath();
        ctx.arc(knobX, 0, icon.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 스위치
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(-icon.size * 0.4, -icon.size * 0.4, icon.size * 0.8, icon.size * 0.8);
        ctx.stroke();

        if (Math.sin(icon.animationPhase) > 0) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-icon.size * 0.2, 0);
          ctx.lineTo(-icon.size * 0.1, icon.size * 0.1);
          ctx.lineTo(icon.size * 0.2, -icon.size * 0.2);
          ctx.stroke();
        }
      }

      ctx.restore();
    };

    const animate = () => {
      animationTime += 0.016;

      // 배경 클리어
      ctx.clearRect(0, 0, width, height);

      // 설정 테마 우주 배경
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#1e1b4b');
      gradient.addColorStop(0.3, '#312e81');
      gradient.addColorStop(0.6, '#1e3a8a');
      gradient.addColorStop(1, '#1e293b');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 보라/파랑 성운 효과 - 설정 테마에 맞게
      const nebulae = [
        { x: width * 0.3, y: height * 0.2, size: width * 0.5, color: 'rgba(139, 92, 246, 0.08)' },
        { x: width * 0.7, y: height * 0.8, size: width * 0.4, color: 'rgba(59, 130, 246, 0.06)' },
        { x: width * 0.1, y: height * 0.6, size: width * 0.3, color: 'rgba(168, 85, 247, 0.05)' }
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

        // 큰 별들에 부드러운 글로우
        if (star.size > 1.8) {
          ctx.globalAlpha = alpha * 0.25;
          ctx.shadowColor = star.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // 설정 기어들
      settingsGears.forEach(gear => {
        gear.rotation += gear.rotationSpeed;
        gear.pulsePhase += 0.015;

        const pulseIntensity = Math.sin(gear.pulsePhase) * 0.3 + 0.7;
        const currentOpacity = gear.opacity * pulseIntensity;

        drawGear(gear, currentOpacity);
      });

      // 설정 아이콘들
      settingsIcons.forEach(icon => {
        icon.animationPhase += 0.02;
        const currentOpacity = icon.opacity * (Math.sin(animationTime * 0.5) * 0.2 + 0.8);
        drawSettingsIcon(icon, currentOpacity);
      });

      // 연결선들 - 기어들 사이의 연결을 나타내는 미묘한 선들
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < settingsGears.length - 1; i++) {
        const gear1 = settingsGears[i];
        const gear2 = settingsGears[i + 1];
        const distance = Math.hypot(gear2.x - gear1.x, gear2.y - gear1.y);

        if (distance < width * 0.4) {
          const connectionStrength = Math.sin(animationTime + i) * 0.3 + 0.7;
          ctx.globalAlpha = 0.05 * connectionStrength;
          ctx.beginPath();
          ctx.moveTo(gear1.x, gear1.y);
          ctx.lineTo(gear2.x, gear2.y);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
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