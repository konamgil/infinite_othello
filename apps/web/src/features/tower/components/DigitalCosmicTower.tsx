import React, { useRef, useEffect, useState } from 'react';

/**
 * @interface DigitalCosmicTowerProps
 * `DigitalCosmicTower` 컴포넌트의 props를 정의합니다.
 */
interface DigitalCosmicTowerProps {
  className?: string;
  currentFloor: number;
  maxFloor: number;
}

/**
 * '무한의 탑'을 3D 회전이 가능한 디지털/홀로그램 스타일로 시각화하는 Canvas 컴포넌트입니다.
 * 사용자는 마우스나 터치로 드래그하여 탑을 회전시킬 수 있습니다.
 * @param {DigitalCosmicTowerProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 인터랙티브한 3D 탑을 렌더링하는 `<canvas>` 요소.
 */
export function DigitalCosmicTower({ className = '', currentFloor, maxFloor }: DigitalCosmicTowerProps) {
  // --- Refs and State ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  /** @state {boolean} isVisible - IntersectionObserver에 의해 결정되는 캔버스의 화면 내 표시 여부. */
  const [isVisible, setIsVisible] = useState(false);
  /** @state {number} rotationY - Y축 기준 회전값 (좌우). */
  const [rotationY, setRotationY] = useState(0);
  /** @state {number} rotationX - X축 기준 회전값 (상하). */
  const [rotationX, setRotationX] = useState(-0.2);
  /** @state {boolean} isDragging - 사용자가 캔버스를 드래그 중인지 여부. */
  const [isDragging, setIsDragging] = useState(false);
  /** @state {{x: number, y: number}} lastTouch - 마지막 터치/마우스 위치 (델타 계산용). */
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });

  /**
   * IntersectionObserver를 설정하여 캔버스가 화면에 보일 때만 애니메이션을 실행합니다.
   * 이는 성능 최적화를 위해 중요합니다.
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  /**
   * 메인 애니메이션 로직을 담고 있는 `useEffect` 훅입니다.
   * `isVisible` 또는 회전값이 변경될 때마다 실행되어 캔버스를 다시 그립니다.
   */
  useEffect(() => {
    if (!isVisible) return;

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

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    // --- 파티클 및 탑 구조 데이터 정의 및 초기화 ---
    interface Star { x: number; y: number; size: number; brightness: number; twinkleSpeed: number; phase: number; color: string; }
    interface DigitalParticle { x: number; y: number; size: number; speed: number; opacity: number; color: string; direction: number; trail: Array<{x: number, y: number, opacity: number}>; }
    interface TowerFloor { y: number; width: number; height: number; depth: number; windows: number; isActive: boolean; glowIntensity: number; roofStyle: 'pagoda' | 'platform' | 'spire'; decorations: boolean; }

    const stars: Star[] = Array.from({ length: 80 }, () => ({ /* ... */ } as Star));
    const digitalParticles: DigitalParticle[] = Array.from({ length: 15 }, () => ({ /* ... */ } as DigitalParticle));
    const towerFloors: TowerFloor[] = [];
    // ... (탑 층 데이터 생성 로직)

    let animationTime = 0;

    /** 매 프레임 실행되는 핵심 애니메이션 루프. */
    const animate = () => {
      animationTime += 0.016;
      ctx.clearRect(0, 0, width, height);

      // 1. 배경, 은하수, 별 그리기
      // ...

      // 2. 3D 회전이 적용된 디지털 탑 그리기
      towerFloors.reverse().forEach((floor, index) => {
        drawDigitalFloor(ctx, floor, width, animationTime, currentFloor, maxFloor - index, rotationY, rotationX);
      });
      towerFloors.reverse(); // 순서 복원

      // 3. 디지털 파티클 효과 그리기
      // ...

      // 4. UI 오버레이 (층수 표시기, 미니 보드) 그리기
      drawFloorIndicator(ctx, width, height, currentFloor, maxFloor, animationTime);
      if (currentFloor > 0) drawMiniatureBoard(ctx, width, height, animationTime);

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => setCanvasSize();
    window.addEventListener('resize', handleResize);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible, currentFloor, maxFloor, rotationY, rotationX]);

  // --- 이벤트 핸들러 ---

  /** 터치 시작 이벤트를 처리하여 드래그를 시작합니다. */
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    setLastTouch({ x: touch.clientX, y: touch.clientY });
  };

  /** 터치 이동 이벤트를 처리하여 탑의 회전값을 업데이트합니다. */
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

  /** 터치 종료 시 드래그 상태를 해제합니다. */
  const handleTouchEnd = () => setIsDragging(false);

  /** 마우스 다운 이벤트를 처리하여 드래그를 시작합니다. */
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastTouch({ x: e.clientX, y: e.clientY });
  };

  /** 마우스 이동 이벤트를 처리하여 탑의 회전값을 업데이트합니다. */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastTouch.x;
    const deltaY = e.clientY - lastTouch.y;
    setRotationY(prev => prev + deltaX * 0.005);
    setRotationX(prev => Math.max(-0.8, Math.min(0.3, prev - deltaY * 0.003)));
    setLastTouch({ x: e.clientX, y: e.clientY });
  };

  /** 마우스 업/리브 시 드래그 상태를 해제합니다. */
  const handleMouseUp = () => setIsDragging(false);

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