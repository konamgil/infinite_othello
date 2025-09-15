import React, { useRef, useEffect, useState } from 'react';

interface DigitalCosmicTowerProps {
  className?: string;
  currentFloor: number;
  maxFloor: number;
}

export function DigitalCosmicTower({ className = '', currentFloor, maxFloor }: DigitalCosmicTowerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isVisible, setIsVisible] = useState(false);
  const [rotationY, setRotationY] = useState(0);
  const [rotationX, setRotationX] = useState(-0.2);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });

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

    // 별들과 디지털 파티클 배열
    interface Star {
      x: number;
      y: number;
      size: number;
      brightness: number;
      twinkleSpeed: number;
      phase: number;
      color: string;
    }

    interface DigitalParticle {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      color: string;
      direction: number;
      trail: Array<{x: number, y: number, opacity: number}>;
    }

    const stars: Star[] = [];
    const digitalParticles: DigitalParticle[] = [];

    // 별들 초기화 - 우주 느낌
    const starColors = ['#ffffff', '#87ceeb', '#ffd700', '#e6e6fa', '#98fb98'];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.8 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        phase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)]
      });
    }

    // 디지털 파티클 초기화 - 전자적 효과
    const digitalColors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff6600'];
    for (let i = 0; i < 15; i++) {
      digitalParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.8 + 0.2,
        color: digitalColors[Math.floor(Math.random() * digitalColors.length)],
        direction: Math.random() * Math.PI * 2,
        trail: []
      });
    }

    // 더 정교한 탑 구조 데이터
    interface TowerFloor {
      y: number;
      width: number;
      height: number;
      depth: number;
      windows: number;
      isActive: boolean;
      glowIntensity: number;
      roofStyle: 'pagoda' | 'platform' | 'spire';
      decorations: boolean;
    }

    const towerFloors: TowerFloor[] = [];
    const baseWidth = Math.min(width * 0.5, 200);
    const floorHeight = Math.max(height * 0.06, 35);

    // 더 세련된 탑 층들 생성 (아래부터 위로)
    const visibleFloors = Math.min(Math.max(currentFloor + 3, 8), 15);
    const startFloor = Math.max(1, currentFloor - Math.floor(visibleFloors / 2));

    for (let i = 0; i < visibleFloors; i++) {
      const actualFloor = startFloor + i;
      const relativePosition = i / (visibleFloors - 1);

      // 원근법과 depth를 고려한 위치 계산
      const perspectiveFactor = 0.7 + (relativePosition * 0.3);
      const floorY = height - 100 - (i * floorHeight * 0.9);
      const floorWidth = baseWidth * perspectiveFactor - (i * baseWidth * 0.03);
      const isCurrentFloor = actualFloor === currentFloor;
      const isAccessible = actualFloor <= currentFloor;

      towerFloors.push({
        y: floorY,
        width: floorWidth,
        height: floorHeight * perspectiveFactor,
        depth: floorHeight * 0.3,
        windows: Math.min(6, Math.max(3, Math.floor(floorWidth / 25))),
        isActive: isAccessible,
        glowIntensity: isCurrentFloor ? 1.0 : (isAccessible ? 0.4 : 0.15),
        roofStyle: i % 3 === 0 ? 'pagoda' : (i % 5 === 0 ? 'spire' : 'platform'),
        decorations: i % 2 === 0 && isAccessible
      });
    }

    let animationTime = 0;

    const animate = () => {
      animationTime += 0.016;

      // 배경 클리어
      ctx.clearRect(0, 0, width, height);

      // 우주 배경 그라데이션
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#0a0a23');
      bgGradient.addColorStop(0.3, '#1a1a2e');
      bgGradient.addColorStop(0.7, '#16213e');
      bgGradient.addColorStop(1, '#0e1329');

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // 은하수 효과
      const nebulaGradient = ctx.createRadialGradient(
        width * 0.7, height * 0.3, 0,
        width * 0.7, height * 0.3, width * 0.5
      );
      nebulaGradient.addColorStop(0, 'rgba(138, 43, 226, 0.15)');
      nebulaGradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.08)');
      nebulaGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, width, height);

      // 별들 그리기
      stars.forEach(star => {
        const twinkle = Math.sin(animationTime * star.twinkleSpeed + star.phase) * 0.4 + 0.6;
        const alpha = star.brightness * twinkle;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = star.color;
        ctx.shadowColor = star.color;
        ctx.shadowBlur = star.size * 3;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 3D 회전이 적용된 디지털 탑 그리기
      towerFloors.reverse().forEach((floor, index) => {
        drawDigitalFloor(ctx, floor, width, animationTime, currentFloor, maxFloor - index, rotationY, rotationX);
      });
      towerFloors.reverse(); // 원래 순서로 복원

      // 디지털 파티클 효과
      digitalParticles.forEach(particle => {
        // 파티클 이동
        particle.x += Math.cos(particle.direction) * particle.speed;
        particle.y += Math.sin(particle.direction) * particle.speed;

        // 경계 처리
        if (particle.x < 0 || particle.x > width) particle.direction = Math.PI - particle.direction;
        if (particle.y < 0 || particle.y > height) particle.direction = -particle.direction;

        particle.x = Math.max(0, Math.min(width, particle.x));
        particle.y = Math.max(0, Math.min(height, particle.y));

        // 트레일 업데이트
        particle.trail.unshift({ x: particle.x, y: particle.y, opacity: particle.opacity });
        if (particle.trail.length > 8) particle.trail.pop();

        // 트레일 그리기
        particle.trail.forEach((point, i) => {
          const trailOpacity = point.opacity * (1 - i / particle.trail.length);
          const trailSize = particle.size * (1 - i / particle.trail.length * 0.5);

          ctx.save();
          ctx.globalAlpha = trailOpacity * 0.6;
          ctx.fillStyle = particle.color;
          ctx.shadowColor = particle.color;
          ctx.shadowBlur = trailSize * 2;

          ctx.beginPath();
          ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      });

      // 현재 층수 표시 - 디지털 스타일
      drawFloorIndicator(ctx, width, height, currentFloor, maxFloor, animationTime);

      // 오델로 보드 미니어처 (현재 층에)
      if (currentFloor > 0) {
        drawMiniatureBoard(ctx, width, height, animationTime);
      }

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
  }, [isVisible, currentFloor, maxFloor, rotationY, rotationX]);

  // 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    setLastTouch({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - lastTouch.x;
    const deltaY = touch.clientY - lastTouch.y;

    setRotationY(prev => prev + deltaX * 0.005);
    setRotationX(prev => Math.max(-0.8, Math.min(0.3, prev - deltaY * 0.003)));

    setLastTouch({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 마우스 이벤트 핸들러 (데스크톱용)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastTouch({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastTouch.x;
    const deltaY = e.clientY - lastTouch.y;

    setRotationY(prev => prev + deltaX * 0.005);
    setRotationX(prev => Math.max(-0.8, Math.min(0.3, prev - deltaY * 0.003)));

    setLastTouch({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className} cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{ display: 'block', touchAction: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}

// 3D 회전 효과가 있는 디지털 층 그리기 함수
function drawDigitalFloor(
  ctx: CanvasRenderingContext2D,
  floor: TowerFloor,
  canvasWidth: number,
  time: number,
  currentFloor: number,
  floorNumber: number,
  rotationY: number = 0,
  rotationX: number = 0
) {
  const centerX = canvasWidth / 2;
  const centerY = floor.y + floor.height / 2;
  const isCurrentFloor = floorNumber === currentFloor;
  const glowColor = isCurrentFloor ? '#00ffff' : (floor.isActive ? '#87ceeb' : '#444444');
  const brightness = Math.sin(time * 2) * 0.2 + 0.8;

  ctx.save();

  // 3D 변환 매트릭스 적용
  ctx.translate(centerX, centerY);

  // Y축 회전 (좌우)
  const cosY = Math.cos(rotationY);
  const sinY = Math.sin(rotationY);

  // X축 회전 (상하) - 약간만 적용
  const cosX = Math.cos(rotationX);
  const sinX = Math.sin(rotationX);

  // 3D 원근감을 위한 스케일 조정
  const scaleX = cosY;
  const skewY = sinY * 0.3;
  const scaleY = cosX;

  ctx.transform(scaleX, skewY * sinX, 0, scaleY, 0, 0);
  ctx.translate(-centerX, -centerY);

  // 더 세련된 층 구조 - depth 효과 포함

  // 뒷면 (깊이감) 그리기
  if (Math.abs(sinY) > 0.1) {
    const depthOffset = floor.depth * sinY;
    const depthGradient = ctx.createLinearGradient(
      centerX - floor.width / 2, floor.y,
      centerX + floor.width / 2, floor.y + floor.height
    );

    if (floor.isActive) {
      depthGradient.addColorStop(0, 'rgba(15, 15, 35, 0.7)');
      depthGradient.addColorStop(1, 'rgba(5, 5, 15, 0.8)');
    } else {
      depthGradient.addColorStop(0, 'rgba(10, 10, 10, 0.4)');
      depthGradient.addColorStop(1, 'rgba(5, 5, 5, 0.6)');
    }

    ctx.fillStyle = depthGradient;
    ctx.fillRect(
      centerX - floor.width / 2 + depthOffset,
      floor.y,
      floor.width,
      floor.height
    );
  }

  // 메인 층 구조
  const mainGradient = ctx.createLinearGradient(
    centerX - floor.width / 2, floor.y,
    centerX + floor.width / 2, floor.y + floor.height
  );

  if (floor.isActive) {
    const intensity = isCurrentFloor ? 1.2 : 0.8;
    mainGradient.addColorStop(0, `rgba(${25 * intensity}, ${25 * intensity}, ${70 * intensity}, 0.95)`);
    mainGradient.addColorStop(0.3, `rgba(${20 * intensity}, ${20 * intensity}, ${55 * intensity}, 0.9)`);
    mainGradient.addColorStop(0.7, `rgba(${15 * intensity}, ${15 * intensity}, ${40 * intensity}, 0.85)`);
    mainGradient.addColorStop(1, `rgba(${10 * intensity}, ${10 * intensity}, ${25 * intensity}, 0.9)`);
  } else {
    mainGradient.addColorStop(0, 'rgba(25, 25, 25, 0.6)');
    mainGradient.addColorStop(0.5, 'rgba(15, 15, 15, 0.7)');
    mainGradient.addColorStop(1, 'rgba(8, 8, 8, 0.8)');
  }

  ctx.fillStyle = mainGradient;
  ctx.fillRect(centerX - floor.width / 2, floor.y, floor.width, floor.height);

  // 정교한 테두리와 구조선
  if (floor.isActive) {
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6 * floor.glowIntensity;
    ctx.strokeRect(centerX - floor.width / 2, floor.y, floor.width, floor.height);

    // 장식용 구조선
    if (floor.decorations) {
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 0.8;

      // 수직선들
      for (let i = 1; i < 4; i++) {
        const lineX = centerX - floor.width / 2 + (floor.width / 4) * i;
        ctx.beginPath();
        ctx.moveTo(lineX, floor.y);
        ctx.lineTo(lineX, floor.y + floor.height);
        ctx.stroke();
      }

      // 수평선
      const midY = floor.y + floor.height / 2;
      ctx.beginPath();
      ctx.moveTo(centerX - floor.width / 2, midY);
      ctx.lineTo(centerX + floor.width / 2, midY);
      ctx.stroke();
    }
  }

  // 디지털 글로우 효과
  if (floor.glowIntensity > 0.2) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20 * floor.glowIntensity * brightness;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2 * floor.glowIntensity;
    ctx.globalAlpha = 0.8 * floor.glowIntensity;

    ctx.strokeRect(centerX - floor.width / 2, floor.y, floor.width, floor.height);
  }

  // 창문들 - 전자적 빛
  const windowWidth = floor.width / (floor.windows * 2);
  for (let i = 0; i < floor.windows; i++) {
    const windowX = centerX - floor.width / 2 + (i + 0.5) * (floor.width / floor.windows);
    const windowY = floor.y + floor.height * 0.3;
    const windowHeight = floor.height * 0.4;

    if (floor.isActive) {
      const windowBrightness = Math.sin(time * 3 + i) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(0, 255, 255, ${0.6 * windowBrightness * floor.glowIntensity})`;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
      ctx.shadowBlur = 0;
    }

    ctx.fillRect(windowX - windowWidth / 2, windowY, windowWidth, windowHeight);
  }

  // 층수 표시 - 홀로그램 스타일
  if (floor.isActive && floorNumber <= 20) {
    ctx.font = `${Math.max(8, floor.width * 0.08)}px Orbitron, monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = isCurrentFloor ? '#00ffff' : '#87ceeb';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.globalAlpha = 0.9;

    const floorText = `${floorNumber}F`;
    ctx.fillText(floorText, centerX, floor.y - 5);
  }

  ctx.restore();
}

// 층수 표시기 그리기
function drawFloorIndicator(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentFloor: number,
  maxFloor: number,
  time: number
) {
  const indicatorX = width - 80;
  const indicatorY = 50;
  const panelWidth = 120;
  const panelHeight = 80;

  ctx.save();

  // 홀로그램 패널 배경
  const panelGradient = ctx.createLinearGradient(
    indicatorX - panelWidth / 2, indicatorY,
    indicatorX + panelWidth / 2, indicatorY + panelHeight
  );
  panelGradient.addColorStop(0, 'rgba(0, 50, 100, 0.8)');
  panelGradient.addColorStop(1, 'rgba(0, 20, 40, 0.9)');

  ctx.fillStyle = panelGradient;
  ctx.fillRect(indicatorX - panelWidth / 2, indicatorY, panelWidth, panelHeight);

  // 패널 테두리 - 사이버 글로우
  const glowIntensity = Math.sin(time * 2) * 0.3 + 0.7;
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 15 * glowIntensity;
  ctx.globalAlpha = 0.8;

  ctx.strokeRect(indicatorX - panelWidth / 2, indicatorY, panelWidth, panelHeight);

  // 메인 층수 표시
  ctx.font = 'bold 24px Orbitron, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00ffff';
  ctx.shadowBlur = 20;
  ctx.fillText(`${currentFloor}`, indicatorX, indicatorY + 35);

  // "층" 텍스트
  ctx.font = '12px Orbitron, monospace';
  ctx.fillStyle = '#87ceeb';
  ctx.fillText('FLOOR', indicatorX, indicatorY + 52);

  // 진행도 바
  const progressY = indicatorY + 60;
  const progressWidth = panelWidth - 20;
  const progress = currentFloor / maxFloor;

  // 진행도 바 배경
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(indicatorX - progressWidth / 2, progressY, progressWidth, 4);

  // 진행도 바 채우기
  const progressGradient = ctx.createLinearGradient(
    indicatorX - progressWidth / 2, progressY,
    indicatorX + progressWidth / 2, progressY
  );
  progressGradient.addColorStop(0, '#00ffff');
  progressGradient.addColorStop(1, '#0080ff');

  ctx.fillStyle = progressGradient;
  ctx.shadowBlur = 10;
  ctx.fillRect(indicatorX - progressWidth / 2, progressY, progressWidth * progress, 4);

  // 최대 층수 표시
  ctx.font = '10px Orbitron, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.textAlign = 'right';
  ctx.shadowBlur = 0;
  ctx.fillText(`MAX: ${maxFloor}`, indicatorX + panelWidth / 2 - 5, indicatorY + 15);

  ctx.restore();
}

// 미니어처 오델로 보드 그리기
function drawMiniatureBoard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
) {
  const boardSize = Math.min(width * 0.15, 60);
  const boardX = width / 2 - boardSize / 2;
  const boardY = height - 180;
  const cellSize = boardSize / 8;

  ctx.save();

  // 보드 배경 - 홀로그램 스타일
  const boardGradient = ctx.createRadialGradient(
    boardX + boardSize / 2, boardY + boardSize / 2, 0,
    boardX + boardSize / 2, boardY + boardSize / 2, boardSize / 2
  );
  boardGradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
  boardGradient.addColorStop(1, 'rgba(0, 100, 100, 0.1)');

  ctx.fillStyle = boardGradient;
  ctx.fillRect(boardX, boardY, boardSize, boardSize);

  // 격자 그리기
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
  ctx.lineWidth = 0.5;

  for (let i = 1; i < 8; i++) {
    // 세로선
    ctx.beginPath();
    ctx.moveTo(boardX + i * cellSize, boardY);
    ctx.lineTo(boardX + i * cellSize, boardY + boardSize);
    ctx.stroke();

    // 가로선
    ctx.beginPath();
    ctx.moveTo(boardX, boardY + i * cellSize);
    ctx.lineTo(boardX + boardSize, boardY + i * cellSize);
    ctx.stroke();
  }

  // 샘플 디스크들 - 홀로그램 효과
  const sampleDiscs = [
    { x: 3, y: 3, color: 'white' },
    { x: 4, y: 3, color: 'black' },
    { x: 3, y: 4, color: 'black' },
    { x: 4, y: 4, color: 'white' },
  ];

  sampleDiscs.forEach(disc => {
    const discX = boardX + disc.x * cellSize + cellSize / 2;
    const discY = boardY + disc.y * cellSize + cellSize / 2;
    const radius = cellSize * 0.3;
    const opacity = Math.sin(time * 2) * 0.2 + 0.6;

    ctx.globalAlpha = opacity;
    ctx.fillStyle = disc.color === 'black' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
    ctx.shadowColor = disc.color === 'black' ? '#ffffff' : '#000000';
    ctx.shadowBlur = 5;

    ctx.beginPath();
    ctx.arc(discX, discY, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}