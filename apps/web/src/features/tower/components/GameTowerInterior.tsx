import React, { useRef, useEffect, useState } from 'react';

/**
 * @interface GameTowerInteriorProps
 * `GameTowerInterior` 컴포넌트의 props를 정의합니다.
 */
interface GameTowerInteriorProps {
  className?: string;
  currentFloor: number;
  maxFloor: number;
}

/** @interface BackgroundStar 배경에 렌더링될 별의 속성을 정의합니다. */
interface BackgroundStar {
  x: number; y: number; size: number; brightness: number;
  twinkleSpeed: number; phase: number;
}

/** @interface TowerFloor 탑의 한 층(방)에 대한 데이터 구조를 정의합니다. */
interface TowerFloor {
  floorNumber: number;
  y: number;
  isCompleted: boolean;
  isCurrent: boolean;
  discs: Array<{ x: number; color: 'black' | 'white'; glowPhase: number }>;
}

/**
 * '무한의 탑' 내부를 수직으로 상승하는 듯한 느낌으로 시각화하는 Canvas 애니메이션 컴포넌트입니다.
 * 플레이어의 현재 층을 중심으로 위아래 몇 개의 층을 보여주어 '스크롤링' 효과를 만듭니다.
 * @param {GameTowerInteriorProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 애니메이션을 위한 `<canvas>` 요소.
 */
export function GameTowerInterior({ className = '', currentFloor, maxFloor }: GameTowerInteriorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  /** @state {boolean} isVisible - IntersectionObserver에 의해 결정되는 캔버스의 화면 내 표시 여부. */
  const [isVisible, setIsVisible] = useState(false);

  /**
   * IntersectionObserver를 설정하여 캔버스가 뷰포트에 보일 때만 애니메이션을 실행합니다.
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
   * `isVisible` 상태가 true일 때만 실행되는 메인 애니메이션 로직입니다.
   * 캔버스 설정, 파티클 및 층 데이터 초기화, 애니메이션 루프를 모두 처리합니다.
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

    // --- 데이터 초기화 ---
    const backgroundStars: BackgroundStar[] = Array.from({ length: 50 }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5, brightness: Math.random() * 0.6 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.01, phase: Math.random() * Math.PI * 2
    }));

    const floorHeight = height * 0.08;
    const visibleFloors = 10;

    // 현재 층을 중심으로 위아래로 보여줄 층의 범위를 계산하여 '스크롤링' 효과를 구현합니다.
    const centerFloor = Math.max(5, Math.min(currentFloor, maxFloor - 4));
    const startFloor = centerFloor - 4;
    const towerFloors: TowerFloor[] = [];

    for (let i = 0; i < visibleFloors; i++) {
      const floorNum = startFloor + i;
      const isCompleted = floorNum < currentFloor;
      const isCurrent = floorNum === currentFloor;

      // 각 층에 랜덤한 오델로 디스크를 배치합니다.
      const discs = (floorNum > 0 && floorNum <= maxFloor)
        ? Array.from({ length: Math.floor(Math.random() * 6) + 4 }, () => ({
            x: (width * 0.2) + Math.random() * (width * 0.6),
            color: Math.random() > 0.5 ? 'black' : 'white',
            glowPhase: Math.random() * Math.PI * 2
          }))
        : [];

      towerFloors.push({ floorNumber: floorNum, y: height - 100 - (i * floorHeight), isCompleted, isCurrent, discs });
    }

    let animationTime = 0;

    /** 매 프레임 실행되는 핵심 애니메이션 루프. */
    const animate = () => {
      animationTime += 0.016;
      ctx.clearRect(0, 0, width, height);

      // 1. 배경 그리기 (우주, 별)
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#0a0a23'); bgGradient.addColorStop(1, '#0e1329');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      backgroundStars.forEach(star => { /* ... 별 그리기 로직 ... */ });

      // 2. 탑 내부 구조 그리기
      drawTowerInterior(ctx, width, height, animationTime);

      // 3. 층별로 플랫폼과 디스크 그리기
      towerFloors.forEach(floor => {
        drawFloor(ctx, floor, width, animationTime);
      });

      // 4. 현재 층수 표시기 그리기
      drawFloorIndicator(ctx, width, height, currentFloor, maxFloor, animationTime);

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => setCanvasSize();
    window.addEventListener('resize', handleResize);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible, currentFloor, maxFloor]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  );
}

/**
 * 탑의 내부 벽과 중앙 기둥을 그리는 헬퍼 함수입니다.
 * @param ctx - 2D 캔버스 렌더링 컨텍스트.
 */
function drawTowerInterior(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
) {
  const centerX = width / 2;
  const towerWidth = width * 0.7;

  ctx.save();

  // 탑 내부 벽면들 - 원근감 있게
  const leftWallGradient = ctx.createLinearGradient(centerX - towerWidth / 2, 0, centerX - towerWidth / 4, 0);
  leftWallGradient.addColorStop(0, 'rgba(20, 25, 40, 0.8)');
  leftWallGradient.addColorStop(1, 'rgba(35, 40, 60, 0.6)');

  const rightWallGradient = ctx.createLinearGradient(centerX + towerWidth / 4, 0, centerX + towerWidth / 2, 0);
  rightWallGradient.addColorStop(0, 'rgba(35, 40, 60, 0.6)');
  rightWallGradient.addColorStop(1, 'rgba(20, 25, 40, 0.8)');

  // 왼쪽 벽
  ctx.fillStyle = leftWallGradient;
  ctx.fillRect(centerX - towerWidth / 2, 0, towerWidth / 4, height);

  // 오른쪽 벽
  ctx.fillStyle = rightWallGradient;
  ctx.fillRect(centerX + towerWidth / 4, 0, towerWidth / 4, height);

  // 벽면 텍스처 - 돌 블록 느낌
  ctx.strokeStyle = 'rgba(60, 70, 90, 0.4)';
  ctx.lineWidth = 1;

  // 왼쪽 벽 블록들
  for (let y = 0; y < height; y += 30) {
    for (let x = 0; x < towerWidth / 4; x += 40) {
      const blockX = centerX - towerWidth / 2 + x + (y % 60 === 0 ? 20 : 0);
      const blockY = y;
      ctx.strokeRect(blockX, blockY, 40, 30);
    }
  }

  // 오른쪽 벽 블록들
  for (let y = 0; y < height; y += 30) {
    for (let x = 0; x < towerWidth / 4; x += 40) {
      const blockX = centerX + towerWidth / 4 + x + (y % 60 === 0 ? 20 : 0);
      const blockY = y;
      ctx.strokeRect(blockX, blockY, 40, 30);
    }
  }

  // 마법진 같은 중앙 기둥
  const pillarX = centerX;
  const pillarWidth = 8;
  const pillarGradient = ctx.createLinearGradient(
    pillarX - pillarWidth / 2, 0,
    pillarX + pillarWidth / 2, 0
  );
  pillarGradient.addColorStop(0, 'rgba(100, 150, 200, 0.3)');
  pillarGradient.addColorStop(0.5, 'rgba(150, 200, 255, 0.6)');
  pillarGradient.addColorStop(1, 'rgba(100, 150, 200, 0.3)');

  ctx.fillStyle = pillarGradient;
  ctx.fillRect(pillarX - pillarWidth / 2, 0, pillarWidth, height);

  // 기둥에 글로우 효과
  const glowIntensity = Math.sin(time * 2) * 0.3 + 0.7;
  ctx.shadowColor = '#87ceeb';
  ctx.shadowBlur = 20 * glowIntensity;
  ctx.fillRect(pillarX - 2, 0, 4, height);

  ctx.restore();
}

/**
 * 탑의 단일 층(플랫폼과 오델로 디스크)을 그리는 헬퍼 함수입니다.
 * 층의 상태(완료, 현재, 다음)에 따라 다른 스타일을 적용합니다.
 * @param ctx - 2D 캔버스 렌더링 컨텍스트.
 * @param floor - 그릴 층의 데이터.
 */
function drawFloor(
  ctx: CanvasRenderingContext2D,
  floor: TowerFloor,
  canvasWidth: number,
  time: number
) {
  if (floor.floorNumber <= 0) return;

  const centerX = canvasWidth / 2;
  const floorWidth = canvasWidth * 0.5;
  const floorHeight = 8;

  ctx.save();

  // 층 바닥 플랫폼 (부드러운 색상)
  let floorColor;
  if (floor.isCurrent) {
    floorColor = `rgba(100, 150, 200, 0.6)`;  // 부드러운 파란색
  } else if (floor.isCompleted) {
    floorColor = 'rgba(120, 160, 120, 0.4)';  // 부드러운 초록색
  } else {
    floorColor = 'rgba(80, 80, 80, 0.3)';
  }

  ctx.fillStyle = floorColor;
  ctx.fillRect(centerX - floorWidth / 2, floor.y, floorWidth, floorHeight);

  // 층 테두리 (부드러운 색상)
  if (floor.isCurrent) {
    ctx.strokeStyle = 'rgba(100, 150, 200, 0.8)';  // 부드러운 파란색
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(100, 150, 200, 0.3)';
    ctx.shadowBlur = 6;
  } else if (floor.isCompleted) {
    ctx.strokeStyle = 'rgba(120, 160, 120, 0.6)';  // 부드러운 초록색
    ctx.lineWidth = 1;
  } else {
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.3)';
    ctx.lineWidth = 1;
  }

  ctx.strokeRect(centerX - floorWidth / 2, floor.y, floorWidth, floorHeight);

  // 층수 표시 (부드러운 색상)
  if (floor.floorNumber > 0) {
    ctx.font = 'bold 14px Orbitron, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = floor.isCurrent ? 'rgba(100, 150, 200, 1)' : (floor.isCompleted ? 'rgba(120, 160, 120, 1)' : '#888888');
    ctx.fillText(`${floor.floorNumber}F`, centerX - floorWidth / 2 + 10, floor.y - 5);
  }

  // 오델로 디스크들 그리기
  floor.discs.forEach((disc, index) => {
    const discY = floor.y - 15;
    const glowPhase = disc.glowPhase + time * 2 + index * 0.5;
    const glow = Math.sin(glowPhase) * 0.3 + 0.7;
    const radius = 6;

    ctx.save();

    if (floor.isCurrent) {
      ctx.shadowColor = disc.color === 'black' ? '#ffffff' : '#000000';
      ctx.shadowBlur = 8 * glow;
    }

    // 디스크 그림자
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(disc.x + 2, discY + 2, radius, 0, Math.PI * 2);
    ctx.fill();

    // 메인 디스크
    ctx.globalAlpha = floor.isCompleted ? 0.8 : (floor.isCurrent ? 1.0 : 0.4);

    if (disc.color === 'black') {
      const blackGradient = ctx.createRadialGradient(
        disc.x - radius * 0.3, discY - radius * 0.3, 0,
        disc.x, discY, radius
      );
      blackGradient.addColorStop(0, '#444444');
      blackGradient.addColorStop(0.7, '#222222');
      blackGradient.addColorStop(1, '#000000');
      ctx.fillStyle = blackGradient;
    } else {
      const whiteGradient = ctx.createRadialGradient(
        disc.x - radius * 0.3, discY - radius * 0.3, 0,
        disc.x, discY, radius
      );
      whiteGradient.addColorStop(0, '#ffffff');
      whiteGradient.addColorStop(0.8, '#f0f0f0');
      whiteGradient.addColorStop(1, '#cccccc');
      ctx.fillStyle = whiteGradient;
    }

    ctx.beginPath();
    ctx.arc(disc.x, discY, radius, 0, Math.PI * 2);
    ctx.fill();

    // 하이라이트
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = disc.color === 'black' ? '#ffffff' : '#ffffff';
    ctx.beginPath();
    ctx.arc(disc.x - radius * 0.3, discY - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });

  ctx.restore();
}

// 층수 표시기
function drawFloorIndicator(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentFloor: number,
  maxFloor: number,
  time: number
) {
  const indicatorX = width - 80;
  const indicatorY = 30;

  ctx.save();

  // 홀로그램 패널
  const panelGradient = ctx.createLinearGradient(
    indicatorX - 50, indicatorY,
    indicatorX + 50, indicatorY + 60
  );
  panelGradient.addColorStop(0, 'rgba(0, 50, 100, 0.8)');
  panelGradient.addColorStop(1, 'rgba(0, 20, 40, 0.9)');

  ctx.fillStyle = panelGradient;
  ctx.fillRect(indicatorX - 50, indicatorY, 100, 60);

  // 패널 테두리 (부드러운 색상, 애니메이션 제거)
  ctx.strokeStyle = 'rgba(100, 150, 200, 0.8)';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(100, 150, 200, 0.2)';
  ctx.shadowBlur = 8;
  ctx.strokeRect(indicatorX - 50, indicatorY, 100, 60);

  // 현재 층수 (부드러운 색상)
  ctx.font = 'bold 24px Orbitron, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(180, 200, 220, 1)';
  ctx.shadowBlur = 10;
  ctx.fillText(`${currentFloor}`, indicatorX, indicatorY + 35);

  // "층" 텍스트 (부드러운 색상)
  ctx.font = '12px Orbitron, monospace';
  ctx.fillStyle = 'rgba(150, 170, 190, 0.8)';
  ctx.fillText('FLOOR', indicatorX, indicatorY + 52);

  ctx.restore();
}