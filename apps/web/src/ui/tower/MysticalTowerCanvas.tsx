import React, { useRef, useEffect, useState } from 'react';

interface MysticalTowerCanvasProps {
  currentFloor: number;
  maxFloor: number;
  className?: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  phase: number;
  color: string;
}

interface OthelloDisc {
  x: number;
  y: number;
  size: number;
  color: 'black' | 'white';
  glow: number;
  rotationSpeed: number;
  rotation: number;
}

export function MysticalTowerCanvas({ currentFloor, maxFloor, className = '' }: MysticalTowerCanvasProps) {
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

    const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
    const canvasHeight = canvas.height / (window.devicePixelRatio || 1);

    // 별들 생성
    const stars: Star[] = [];
    const numStars = 80;
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight * 0.7, // 상단 70%에만
        size: Math.random() * 2.5 + 0.5,
        brightness: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        phase: Math.random() * Math.PI * 2,
        color: ['#ffffff', '#ffeb3b', '#81c784', '#64b5f6'][Math.floor(Math.random() * 4)]
      });
    }

    // 오델로 디스크들 (탑 주변에 떠다니는)
    const floatingDiscs: OthelloDisc[] = [];
    const numDiscs = 12;
    for (let i = 0; i < numDiscs; i++) {
      floatingDiscs.push({
        x: canvasWidth * 0.2 + Math.random() * canvasWidth * 0.6,
        y: canvasHeight * 0.2 + Math.random() * canvasHeight * 0.6,
        size: Math.random() * 8 + 4,
        color: Math.random() > 0.5 ? 'black' : 'white',
        glow: Math.random() * 0.5 + 0.3,
        rotationSpeed: Math.random() * 0.02 + 0.005,
        rotation: Math.random() * Math.PI * 2
      });
    }

    let startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000;

      // 배경 클리어
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // 깊은 우주 배경
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      bgGradient.addColorStop(0, '#000003');
      bgGradient.addColorStop(0.3, '#02020e');
      bgGradient.addColorStop(0.7, '#050514');
      bgGradient.addColorStop(1, '#0a0a1a');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 성운 효과들
      const nebula1 = ctx.createRadialGradient(canvasWidth * 0.2, canvasHeight * 0.3, 0, canvasWidth * 0.2, canvasHeight * 0.3, canvasWidth * 0.4);
      nebula1.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
      nebula1.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)');
      nebula1.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const nebula2 = ctx.createRadialGradient(canvasWidth * 0.8, canvasHeight * 0.2, 0, canvasWidth * 0.8, canvasHeight * 0.2, canvasWidth * 0.3);
      nebula2.addColorStop(0, 'rgba(245, 158, 11, 0.1)');
      nebula2.addColorStop(0.5, 'rgba(251, 191, 36, 0.05)');
      nebula2.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 별들 그리기
      ctx.save();
      stars.forEach((star, index) => {
        star.phase += star.twinkleSpeed;
        const twinkle = Math.sin(star.phase) * 0.4 + 0.6;
        const size = star.size * (1 + Math.sin(elapsed + index) * 0.1);

        // 별 중심
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.brightness * twinkle;
        ctx.beginPath();
        ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
        ctx.fill();

        // 큰 별들의 십자 광선
        if (star.size > 1.8) {
          ctx.strokeStyle = star.color;
          ctx.lineWidth = 1;
          ctx.globalAlpha = star.brightness * twinkle * 0.6;
          const crossSize = size * 4;
          ctx.beginPath();
          ctx.moveTo(star.x - crossSize, star.y);
          ctx.lineTo(star.x + crossSize, star.y);
          ctx.moveTo(star.x, star.y - crossSize);
          ctx.lineTo(star.x, star.y + crossSize);
          ctx.stroke();
        }
      });
      ctx.restore();

      // 2.5D 무한 탑 그리기
      const towerCenterX = canvasWidth / 2;
      const towerBaseY = canvasHeight * 0.95;
      const towerHeight = canvasHeight * 0.7;
      const towerSections = Math.min(15, Math.ceil(currentFloor / 20));

      // 탑의 원근감을 위한 계산
      const perspective = 0.7; // 원근 비율

      for (let i = 0; i < towerSections; i++) {
        const sectionProgress = i / towerSections;
        const floorStart = i * 20 + 1;
        const floorEnd = (i + 1) * 20;

        // 현재 섹션이 완료되었는지 확인
        const isCompleted = currentFloor >= floorEnd;
        const isCurrent = currentFloor >= floorStart && currentFloor < floorEnd;

        // 원근감 적용된 위치와 크기
        const sectionY = towerBaseY - (sectionProgress * towerHeight);
        const sectionWidth = (60 - sectionProgress * 20) * (1 + sectionProgress * perspective);
        const sectionHeight = 25;

        // 3D 효과를 위한 side face
        const sideOffset = sectionWidth * 0.15;

        // 섹션 색상 결정
        let frontColor, sideColor, topColor;
        if (isCompleted) {
          // 완료된 섹션 - 황금빛
          frontColor = `linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)`;
          sideColor = '#d97706';
          topColor = '#fbbf24';
        } else if (isCurrent) {
          // 현재 도전 중인 섹션 - 빛나는 효과
          const pulse = Math.sin(elapsed * 3) * 0.3 + 0.7;
          frontColor = `rgba(59, 130, 246, ${pulse})`;
          sideColor = `rgba(37, 99, 235, ${pulse * 0.8})`;
          topColor = `rgba(96, 165, 250, ${pulse})`;
        } else {
          // 미완료 섹션 - 어두운 회색
          frontColor = '#374151';
          sideColor = '#1f2937';
          topColor = '#4b5563';
        }

        // 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(towerCenterX - sectionWidth/2 + 3, sectionY - sectionHeight + 3, sectionWidth, sectionHeight);

        // 정면 (메인 면)
        if (typeof frontColor === 'string' && frontColor.startsWith('linear-gradient')) {
          const gradient = ctx.createLinearGradient(
            towerCenterX - sectionWidth/2, sectionY - sectionHeight,
            towerCenterX + sectionWidth/2, sectionY
          );
          gradient.addColorStop(0, '#d97706');
          gradient.addColorStop(0.5, '#f59e0b');
          gradient.addColorStop(1, '#d97706');
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = frontColor;
        }
        ctx.fillRect(towerCenterX - sectionWidth/2, sectionY - sectionHeight, sectionWidth, sectionHeight);

        // 오른쪽 사이드 (3D 효과)
        ctx.fillStyle = sideColor;
        ctx.beginPath();
        ctx.moveTo(towerCenterX + sectionWidth/2, sectionY - sectionHeight);
        ctx.lineTo(towerCenterX + sectionWidth/2 + sideOffset, sectionY - sectionHeight - sideOffset);
        ctx.lineTo(towerCenterX + sectionWidth/2 + sideOffset, sectionY - sideOffset);
        ctx.lineTo(towerCenterX + sectionWidth/2, sectionY);
        ctx.closePath();
        ctx.fill();

        // 상단면 (3D 효과)
        ctx.fillStyle = topColor;
        ctx.beginPath();
        ctx.moveTo(towerCenterX - sectionWidth/2, sectionY - sectionHeight);
        ctx.lineTo(towerCenterX - sectionWidth/2 + sideOffset, sectionY - sectionHeight - sideOffset);
        ctx.lineTo(towerCenterX + sectionWidth/2 + sideOffset, sectionY - sectionHeight - sideOffset);
        ctx.lineTo(towerCenterX + sectionWidth/2, sectionY - sectionHeight);
        ctx.closePath();
        ctx.fill();

        // 오델로 패턴 장식 (완료된 섹션에만)
        if (isCompleted && i % 2 === 0) {
          const discSize = 3;
          const spacing = 12;
          const numDiscs = Math.floor(sectionWidth / spacing);

          for (let d = 0; d < numDiscs; d++) {
            const discX = towerCenterX - sectionWidth/2 + spacing * d + spacing/2;
            const discY = sectionY - sectionHeight/2;
            const discColor = d % 2 === 0 ? '#000000' : '#ffffff';

            // 디스크 그림자
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(discX + 1, discY + 1, discSize, 0, Math.PI * 2);
            ctx.fill();

            // 디스크
            ctx.fillStyle = discColor;
            ctx.beginPath();
            ctx.arc(discX, discY, discSize, 0, Math.PI * 2);
            ctx.fill();

            // 디스크 하이라이트
            ctx.fillStyle = discColor === '#000000' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(discX - 1, discY - 1, discSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 현재 도전 층 글로우 효과
        if (isCurrent) {
          ctx.save();
          ctx.shadowColor = '#3b82f6';
          ctx.shadowBlur = 20;
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 2;
          ctx.strokeRect(towerCenterX - sectionWidth/2, sectionY - sectionHeight, sectionWidth, sectionHeight);
          ctx.restore();
        }
      }

      // 탑 꼭대기 크리스탈 (완주 시)
      if (currentFloor >= maxFloor) {
        const crystalX = towerCenterX;
        const crystalY = towerBaseY - towerHeight - 30;
        const crystalSize = 20;

        ctx.save();
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 30;

        // 크리스탈 모양
        const gradient = ctx.createRadialGradient(crystalX, crystalY, 0, crystalX, crystalY, crystalSize);
        gradient.addColorStop(0, '#fbbf24');
        gradient.addColorStop(0.7, '#f59e0b');
        gradient.addColorStop(1, '#d97706');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(crystalX, crystalY - crystalSize);
        ctx.lineTo(crystalX - crystalSize * 0.6, crystalY);
        ctx.lineTo(crystalX, crystalY + crystalSize * 0.5);
        ctx.lineTo(crystalX + crystalSize * 0.6, crystalY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 떠다니는 오델로 디스크들
      ctx.save();
      floatingDiscs.forEach((disc, index) => {
        disc.rotation += disc.rotationSpeed;

        // 디스크 위치 애니메이션 (원형으로 떠다님)
        const orbitRadius = 30 + index * 5;
        const orbitSpeed = 0.001 + index * 0.0005;
        disc.x = towerCenterX + Math.cos(elapsed * orbitSpeed + index) * orbitRadius;
        disc.y = towerBaseY - towerHeight * 0.5 + Math.sin(elapsed * orbitSpeed * 1.5 + index) * 40;

        const glowIntensity = Math.sin(elapsed * 2 + index) * 0.3 + 0.7;

        // 디스크 글로우
        ctx.shadowColor = disc.color === 'black' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10 * disc.glow * glowIntensity;

        // 3D 회전 효과
        ctx.save();
        ctx.translate(disc.x, disc.y);
        ctx.rotate(disc.rotation);
        ctx.scale(Math.cos(disc.rotation * 2) * 0.3 + 0.7, 1);

        // 디스크 그라데이션
        const discGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, disc.size);
        if (disc.color === 'black') {
          discGradient.addColorStop(0, '#4a4a4a');
          discGradient.addColorStop(0.7, '#2a2a2a');
          discGradient.addColorStop(1, '#000000');
        } else {
          discGradient.addColorStop(0, '#ffffff');
          discGradient.addColorStop(0.7, '#e5e5e5');
          discGradient.addColorStop(1, '#cccccc');
        }

        ctx.fillStyle = discGradient;
        ctx.beginPath();
        ctx.arc(0, 0, disc.size, 0, Math.PI * 2);
        ctx.fill();

        // 디스크 하이라이트
        ctx.fillStyle = disc.color === 'black' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(-disc.size * 0.3, -disc.size * 0.3, disc.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });
      ctx.restore();

      // 마법진 효과 (바닥에)
      const runeRadius = 80;
      const runeX = towerCenterX;
      const runeY = towerBaseY;

      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;

      // 바깥 원
      ctx.beginPath();
      ctx.arc(runeX, runeY, runeRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 안쪽 원
      ctx.beginPath();
      ctx.arc(runeX, runeY, runeRadius * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      // 룬 문자들 (오델로 패턴을 모티프로)
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + elapsed * 0.5;
        const x = runeX + Math.cos(angle) * runeRadius * 0.8;
        const y = runeY + Math.sin(angle) * runeRadius * 0.8;

        ctx.fillStyle = i % 2 === 0 ? '#000000' : '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // 리사이즈 핸들링
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