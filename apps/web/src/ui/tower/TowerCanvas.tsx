import React, { useRef, useEffect, useState } from 'react';

interface TowerCanvasProps {
  currentFloor: number;
  maxFloor: number;
  className?: string;
}

export function TowerCanvas({ currentFloor, maxFloor, className = '' }: TowerCanvasProps) {
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

    // 별들 배열
    interface Star {
      x: number;
      y: number;
      size: number;
      opacity: number;
      twinkleSpeed: number;
      twinkleOffset: number;
    }

    const stars: Star[] = [];
    const numStars = 150;

    // 별들 초기화
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

    // 탑 구조
    const towerSections = Math.min(12, Math.ceil(currentFloor / 25)); // 최대 12개 섹션

    let animationTime = 0;

    const animate = () => {
      animationTime += 0.016; // ~60fps

      // 배경 클리어
      ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));

      const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
      const canvasHeight = canvas.height / (window.devicePixelRatio || 1);

      // 우주 배경 그라데이션
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      gradient.addColorStop(0, '#000003');
      gradient.addColorStop(0.3, '#02020e');
      gradient.addColorStop(0.7, '#050514');
      gradient.addColorStop(1, '#0a0a1a');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 성운 효과
      ctx.save();
      const nebulaGradient = ctx.createRadialGradient(
        canvasWidth * 0.3, canvasHeight * 0.2, 0,
        canvasWidth * 0.3, canvasHeight * 0.2, canvasWidth * 0.4
      );
      nebulaGradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)');
      nebulaGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.05)');
      nebulaGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.restore();

      // 별들 그리기 (반짝임 효과)
      stars.forEach(star => {
        const twinkle = Math.sin(animationTime * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
        const alpha = star.opacity * twinkle;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // 밝은 별들에 십자가 효과
        if (star.size > 1.5 && alpha > 0.7) {
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

      // 무한의 탑 그리기 (중앙 하단에서 위로)
      const towerX = canvasWidth / 2;
      const towerBaseY = canvasHeight;
      const towerWidth = canvasWidth * 0.15;
      const sectionHeight = canvasHeight / towerSections;

      // 탑 그림자
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(towerX - towerWidth/2 + 3, towerBaseY - (sectionHeight * towerSections) + 3, towerWidth, sectionHeight * towerSections);
      ctx.restore();

      // 탑 본체
      for (let i = 0; i < towerSections; i++) {
        const y = towerBaseY - (i + 1) * sectionHeight;
        const sectionWidth = towerWidth * (0.8 + (i / towerSections) * 0.2);

        // 섹션별 색상 (층수에 따라)
        const floorProgress = (i + 1) / towerSections;
        const completedProgress = Math.min(1, currentFloor / maxFloor);

        let sectionColor;
        if (floorProgress <= completedProgress) {
          // 완료된 섹션 - 황금색
          const goldGradient = ctx.createLinearGradient(towerX - sectionWidth/2, y, towerX + sectionWidth/2, y);
          goldGradient.addColorStop(0, '#92400e');
          goldGradient.addColorStop(0.5, '#f59e0b');
          goldGradient.addColorStop(1, '#92400e');
          sectionColor = goldGradient;
        } else {
          // 미완료 섹션 - 어두운 회색
          const grayGradient = ctx.createLinearGradient(towerX - sectionWidth/2, y, towerX + sectionWidth/2, y);
          grayGradient.addColorStop(0, '#1f2937');
          grayGradient.addColorStop(0.5, '#374151');
          grayGradient.addColorStop(1, '#1f2937');
          sectionColor = grayGradient;
        }

        // 섹션 그리기
        ctx.fillStyle = sectionColor;
        ctx.fillRect(towerX - sectionWidth/2, y, sectionWidth, sectionHeight * 0.9);

        // 섹션 테두리
        ctx.strokeStyle = floorProgress <= completedProgress ? '#fbbf24' : '#4b5563';
        ctx.lineWidth = 1;
        ctx.strokeRect(towerX - sectionWidth/2, y, sectionWidth, sectionHeight * 0.9);

        // 현재 도전 층 표시 (맨 위 완료 섹션에 글로우)
        if (Math.abs(floorProgress - completedProgress) < 0.1 && currentFloor < maxFloor) {
          ctx.save();
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 20;
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.strokeRect(towerX - sectionWidth/2, y, sectionWidth, sectionHeight * 0.9);
          ctx.restore();
        }

        // 창문들 (완료된 섹션에만)
        if (floorProgress <= completedProgress) {
          const windowCount = 3;
          const windowWidth = sectionWidth / (windowCount + 1);
          const windowHeight = sectionHeight * 0.3;

          for (let w = 0; w < windowCount; w++) {
            const windowX = towerX - sectionWidth/2 + windowWidth * (w + 0.7);
            const windowY = y + sectionHeight * 0.3;

            // 창문 불빛
            const lightIntensity = Math.sin(animationTime * 2 + i * 0.5 + w) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 235, 59, ${lightIntensity * 0.8})`;
            ctx.fillRect(windowX, windowY, windowWidth * 0.6, windowHeight);

            // 창문 테두리
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(windowX, windowY, windowWidth * 0.6, windowHeight);
          }
        }
      }

      // 탑 꼭대기 (현재 층이 최대층에 도달한 경우)
      if (currentFloor >= maxFloor) {
        const crownSize = towerWidth * 0.3;
        const crownY = towerBaseY - (sectionHeight * towerSections) - crownSize/2;

        // 왕관 글로우
        ctx.save();
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 30;

        // 왕관 모양
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const radius = i % 2 === 0 ? crownSize/2 : crownSize/3;
          const x = towerX + Math.cos(angle) * radius;
          const y = crownY + Math.sin(angle) * radius;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 플레이어 아바타 (현재 위치)
      const playerY = towerBaseY - (currentFloor / maxFloor) * (sectionHeight * towerSections);
      const playerSize = 8;

      // 플레이어 글로우
      ctx.save();
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(towerX + towerWidth/2 + 15, playerY, playerSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 층수 텍스트
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${currentFloor}층`, towerX, canvasHeight - 20);

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
  }, [currentFloor, maxFloor, isVisible]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  );
}