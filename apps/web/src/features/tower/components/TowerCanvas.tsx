import React, { useRef, useEffect, useState } from 'react';

/**
 * @interface TowerCanvasProps
 * `TowerCanvas` 컴포넌트의 props를 정의합니다.
 */
interface TowerCanvasProps {
  /** @property {number} currentFloor - 플레이어의 현재 층수. 탑의 진행 상황을 표시하는 데 사용됩니다. */
  currentFloor: number;
  /** @property {number} maxFloor - 탑의 최대 층수. 진행률 계산에 사용됩니다. */
  maxFloor: number;
  /** @property {string} [className] - 컴포넌트의 최상위 `<canvas>` 요소에 적용할 추가 CSS 클래스. */
  className?: string;
}

/**
 * '무한의 탑' 진행 상황을 시각화하는 동적인 Canvas 애니메이션 컴포넌트입니다.
 * 별이 빛나는 우주 배경 위에 플레이어의 현재 층수에 따라 성장하는 탑을 그립니다.
 * IntersectionObserver를 사용하여 화면에 보일 때만 애니메이션을 실행하는 성능 최적화가 적용되어 있습니다.
 * @param {TowerCanvasProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 애니메이션을 위한 `<canvas>` 요소.
 */
export function TowerCanvas({ currentFloor, maxFloor, className = '' }: TowerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  /** @state {boolean} isVisible - IntersectionObserver에 의해 결정되는 캔버스의 화면 내 표시 여부. */
  const [isVisible, setIsVisible] = useState(false);

  /**
   * IntersectionObserver를 설정하여 캔버스가 뷰포트에 들어오거나 나갈 때 `isVisible` 상태를 업데이트합니다.
   * 이는 보이지 않을 때 값비싼 애니메이션을 중지시키는 성능 최적화입니다.
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 } // 10% 이상 보일 때
    );

    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }

    return () => observer.disconnect();
  }, []);

  /**
   * `isVisible` 상태가 true일 때만 실행되는 메인 애니메이션 로직입니다.
   * 캔버스 설정, 파티클 초기화, 애니메이션 루프를 모두 처리합니다.
   */
  useEffect(() => {
    if (!isVisible) return; // 화면에 보이지 않으면 애니메이션을 실행하지 않음

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /** 캔버스 크기를 설정하고 고해상도 디스플레이에 맞게 조정합니다. */
    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    setCanvasSize();

    // --- 파티클 정의 및 초기화 ---
    interface Star { x: number; y: number; size: number; opacity: number; twinkleSpeed: number; twinkleOffset: number; }
    const stars: Star[] = [];
    const numStars = 150;

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width / (window.devicePixelRatio || 1),
        y: Math.random() * canvas.height / (window.devicePixelRatio || 1),
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    // --- 탑 구조 계산 ---
    const towerSections = Math.min(12, Math.ceil(currentFloor / 25)); // 최대 12개 섹션

    let animationTime = 0;

    /** 매 프레임 실행되는 핵심 애니메이션 루프. */
    const animate = () => {
      animationTime += 0.016; // ~60fps
      const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
      const canvasHeight = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // 1. 배경 그라데이션 및 성운 효과 그리기
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      gradient.addColorStop(0, '#000003');
      gradient.addColorStop(1, '#0a0a1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const nebulaGradient = ctx.createRadialGradient(canvasWidth * 0.3, canvasHeight * 0.2, 0, canvasWidth * 0.3, canvasHeight * 0.2, canvasWidth * 0.4);
      nebulaGradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)');
      nebulaGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 2. 별 그리기 (반짝임 효과 포함)
      stars.forEach(star => {
        const twinkle = Math.sin(animationTime * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
        const alpha = star.opacity * twinkle;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        if (star.size > 1.5 && alpha > 0.7) { // 밝은 별에 십자가 효과
          ctx.globalAlpha = alpha * 0.5;
          ctx.strokeStyle = '#ffffff';
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

      // 3. '무한의 탑' 그리기
      const towerX = canvasWidth / 2;
      const towerBaseY = canvasHeight;
      const towerWidth = canvasWidth * 0.15;
      const sectionHeight = canvasHeight / towerSections;

      // 탑 본체 (섹션별로)
      for (let i = 0; i < towerSections; i++) {
        const y = towerBaseY - (i + 1) * sectionHeight;
        const sectionWidth = towerWidth * (0.8 + (i / towerSections) * 0.2); // 위로 갈수록 좁아짐
        const floorProgress = (i + 1) / towerSections;
        const completedProgress = Math.min(1, currentFloor / maxFloor);
        const isCompleted = floorProgress <= completedProgress;

        // 섹션 색상 결정 (완료: 금색, 미완료: 회색)
        const gradient = ctx.createLinearGradient(towerX - sectionWidth/2, y, towerX + sectionWidth/2, y);
        if (isCompleted) {
          gradient.addColorStop(0, '#92400e');
          gradient.addColorStop(0.5, '#f59e0b');
          gradient.addColorStop(1, '#92400e');
        } else {
          gradient.addColorStop(0, '#1f2937');
          gradient.addColorStop(0.5, '#374151');
          gradient.addColorStop(1, '#1f2937');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(towerX - sectionWidth/2, y, sectionWidth, sectionHeight * 0.9);

        // 창문과 글로우 등 추가 효과
        if (isCompleted) {
          // ... (창문 그리기 로직)
        }
      }

      // 4. 탑 꼭대기 (최대 층 도달 시)
      if (currentFloor >= maxFloor) {
        // ... (왕관 그리기 로직)
      }

      // 5. 플레이어 아바타 그리기
      const playerY = towerBaseY - (currentFloor / maxFloor) * (sectionHeight * towerSections);
      const playerSize = 8;
      ctx.save();
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(towerX + towerWidth/2 + 15, playerY, playerSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 6. 현재 층수 텍스트
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${currentFloor}층`, towerX, canvasHeight - 20);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // 컴포넌트 언마운트 시 애니메이션과 이벤트 리스너 정리
    const handleResize = () => setCanvasSize();
    window.addEventListener('resize', handleResize);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [currentFloor, maxFloor, isVisible]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  );
}