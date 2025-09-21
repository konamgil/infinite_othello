import React, { useRef, useEffect, useState } from 'react';

/**
 * @interface TowerRoomsViewProps
 * `TowerRoomsView` 컴포넌트의 props를 정의합니다.
 */
interface TowerRoomsViewProps {
  className?: string;
  currentFloor: number;
  maxFloor: number;
}

/** @interface BackgroundStar 배경에 렌더링될 별의 속성을 정의합니다. */
interface BackgroundStar {
  x: number; y: number; size: number; brightness: number;
  twinkleSpeed: number; phase: number;
}

/** @interface TowerRoom 탑의 한 층(방)에 대한 데이터 구조를 정의합니다. */
interface TowerRoom {
  floorNumber: number;
  y: number;
  height: number;
  width: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isNext: boolean;
  theme: 'forest' | 'lava' | 'ice' | 'holy' | 'shadow' | 'mechanical';
  guardian: { name: string; type: 'knight' | 'boss' | 'king'; defeated: boolean; x: number; };
  rewards: Array<{ type: 'rp' | 'theme' | 'item'; value: string; x: number }>;
  doorway: { x: number; isOpen: boolean };
}

/**
 * '무한의 탑' 내부를 각 층이 개별적인 '방'으로 표현되는 방식으로 시각화하는 Canvas 컴포넌트입니다.
 * 플레이어의 현재 위치를 중심으로 위아래 몇 개의 방을 보여주며 스크롤링 효과를 냅니다.
 * @param {TowerRoomsViewProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 애니메이션을 위한 `<canvas>` 요소.
 */
export function TowerRoomsView({ className = '', currentFloor, maxFloor }: TowerRoomsViewProps) {
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
   * 캔버스 설정, 방 데이터 생성, 애니메이션 루프를 모두 처리합니다.
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

    // 현재 층을 중심으로 보여줄 방(room)들을 절차적으로 생성합니다.
    const roomHeight = Math.min(height * 0.18, 140);
    const roomWidth = width * 0.8;
    const visibleRooms = Math.min(5, Math.ceil(height / roomHeight));
    const baseFloor = Math.max(1, currentFloor - Math.floor(visibleRooms / 2));
    const centerX = width / 2;
    const towerRooms: TowerRoom[] = [];
    const themes: TowerRoom['theme'][] = ['forest', 'lava', 'ice', 'holy', 'shadow', 'mechanical'];

    for (let i = 0; i < visibleRooms; i++) {
      const floorNum = baseFloor + i;
      const roomY = height - 60 - ((visibleRooms - 1 - i) * roomHeight);
      const isCompleted = floorNum < currentFloor;
      const isCurrent = floorNum === currentFloor;
      const isNext = floorNum === currentFloor + 1;
      const theme = themes[floorNum % themes.length];

      // 가디언 및 보상 정보 생성
      let guardianType: 'knight' | 'boss' | 'king' = 'knight';
      if (floorNum % 50 === 0 && floorNum < 300) guardianType = 'boss';
      if (floorNum === 300) guardianType = 'king';
      const guardianNames = { knight: ['그림자 기사', '빛의 수호자'], boss: ['전략의 지배자'], king: ['오델로 킹'] };
      const rewards = [];
      if (floorNum <= maxFloor) {
        rewards.push({ type: 'rp' as const, value: `${floorNum * 10}`, x: centerX - roomWidth / 2 + 60 });
        if (floorNum % 10 === 0) rewards.push({ type: 'theme' as const, value: '테마', x: centerX - roomWidth / 2 + 100 });
      }

      towerRooms.push({
        floorNumber: floorNum, y: roomY, height: roomHeight, width: roomWidth,
        isCompleted, isCurrent, isNext, theme,
        guardian: { name: guardianNames[guardianType][0], type: guardianType, defeated: isCompleted, x: centerX + roomWidth / 4 },
        rewards, doorway: { x: centerX, isOpen: isCompleted || isCurrent }
      });
    }

    const backgroundStars: BackgroundStar[] = Array.from({ length: 30 }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5, brightness: Math.random() * 0.5 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.01, phase: Math.random() * Math.PI * 2
    }));

    let animationTime = 0;

    /** 매 프레임 실행되는 핵심 애니메이션 루프. */
    const animate = () => {
      animationTime += 0.016;
      ctx.clearRect(0, 0, width, height);

      // 1. 배경 그리기
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#0a0a23');
      bgGradient.addColorStop(1, '#16213e');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);
      backgroundStars.forEach(star => { /* ... */ });

      // 2. 탑의 정적 구조물 그리기
      drawTowerStructure(ctx, width, height);

      // 3. 현재 보이는 방들 그리기
      towerRooms.forEach(room => {
        drawTowerRoom(ctx, room, animationTime);
      });

      // 4. UI 오버레이(층수 표시기) 그리기
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

// 탑 구조 그리기
function drawTowerStructure(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const centerX = width / 2;

  ctx.save();

  // 중앙 기둥
  const pillarGradient = ctx.createLinearGradient(centerX - 4, 0, centerX + 4, 0);
  pillarGradient.addColorStop(0, 'rgba(60, 80, 120, 0.8)');
  pillarGradient.addColorStop(0.5, 'rgba(100, 130, 180, 0.9)');
  pillarGradient.addColorStop(1, 'rgba(60, 80, 120, 0.8)');

  ctx.fillStyle = pillarGradient;
  ctx.fillRect(centerX - 6, 0, 12, height);

  // 기둥 글로우
  ctx.shadowColor = '#4682b4';
  ctx.shadowBlur = 15;
  ctx.fillRect(centerX - 3, 0, 6, height);

  ctx.restore();
}

// 개별 방 그리기
function drawTowerRoom(ctx: CanvasRenderingContext2D, room: TowerRoom, time: number) {
  if (room.floorNumber <= 0) return;

  const centerX = room.doorway.x;
  const roomLeft = centerX - room.width / 2;
  const roomRight = centerX + room.width / 2;

  ctx.save();

  // 방 상태별 색상 결정
  let roomBaseColor, roomAccentColor, roomAlpha;
  if (room.isCurrent) {
    roomBaseColor = [0, 255, 255]; // 사이언
    roomAccentColor = '#00ffff';
    roomAlpha = 0.9 + Math.sin(time * 2) * 0.1;
  } else if (room.isCompleted) {
    roomBaseColor = [100, 200, 100]; // 초록
    roomAccentColor = '#64c864';
    roomAlpha = 0.7;
  } else if (room.isNext) {
    roomBaseColor = [255, 215, 0]; // 골드
    roomAccentColor = '#ffd700';
    roomAlpha = 0.6;
  } else {
    roomBaseColor = [80, 80, 80]; // 회색
    roomAccentColor = '#505050';
    roomAlpha = 0.4;
  }

  // 방 배경
  const roomGradient = ctx.createLinearGradient(roomLeft, room.y, roomRight, room.y + room.height);
  roomGradient.addColorStop(0, `rgba(20, 25, 40, ${roomAlpha})`);
  roomGradient.addColorStop(0.5, `rgba(${roomBaseColor[0] * 0.3}, ${roomBaseColor[1] * 0.3}, ${roomBaseColor[2] * 0.3}, ${roomAlpha * 0.8})`);
  roomGradient.addColorStop(1, `rgba(15, 20, 35, ${roomAlpha})`);

  ctx.fillStyle = roomGradient;
  ctx.fillRect(roomLeft, room.y, room.width, room.height);

  // 방 테두리
  ctx.strokeStyle = roomAccentColor;
  ctx.lineWidth = room.isCurrent ? 3 : (room.isNext ? 2 : 1);
  ctx.globalAlpha = roomAlpha;

  if (room.isCurrent) {
    ctx.shadowColor = roomAccentColor;
    ctx.shadowBlur = 20;
  }

  ctx.strokeRect(roomLeft, room.y, room.width, room.height);

  // 층수 표시 (참고 이미지의 "1층" 같은 표시)
  ctx.font = 'bold 16px Orbitron, monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = room.isCurrent ? '#00ffff' : (room.isCompleted ? '#66ff66' : '#cccccc');
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  // 배경 패널
  const labelWidth = 50;
  const labelHeight = 24;
  const labelX = roomLeft + 10;
  const labelY = room.y + 10;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(labelX, labelY, labelWidth, labelHeight);

  ctx.fillStyle = roomAccentColor;
  ctx.fillText(`${room.floorNumber}층`, labelX + 5, labelY + 17);

  // 가디언 그리기 (참고 이미지의 캐릭터들 같은 느낌)
  drawGuardian(ctx, room.guardian, room.y + room.height * 0.3, time, room.isCompleted, room.isCurrent);

  // 보상들 그리기
  room.rewards.forEach((reward, index) => {
    drawReward(ctx, reward, room.y + room.height * 0.7 + index * 25, room.isCurrent);
  });

  // 문/통로 표시
  if (room.doorway.isOpen) {
    ctx.fillStyle = room.isCurrent ? 'rgba(0, 255, 255, 0.3)' : 'rgba(100, 255, 100, 0.2)';
    ctx.fillRect(centerX - 15, room.y + room.height - 8, 30, 8);
  }

  ctx.restore();
}

// 가디언 그리기
function drawGuardian(
  ctx: CanvasRenderingContext2D,
  guardian: any,
  y: number,
  time: number,
  isDefeated: boolean,
  isCurrent: boolean
) {
  const x = guardian.x;
  const size = guardian.type === 'king' ? 25 : (guardian.type === 'boss' ? 20 : 15);

  ctx.save();

  if (isDefeated) {
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#666666';
  } else if (isCurrent) {
    const glow = Math.sin(time * 3) * 0.3 + 0.7;
    ctx.globalAlpha = glow;
    ctx.shadowColor = guardian.type === 'king' ? '#ffd700' : (guardian.type === 'boss' ? '#ff6b6b' : '#4ecdc4');
    ctx.shadowBlur = 15;
    ctx.fillStyle = guardian.type === 'king' ? '#ffd700' : (guardian.type === 'boss' ? '#ff6b6b' : '#4ecdc4');
  } else {
    ctx.fillStyle = '#888888';
  }

  // 간단한 가디언 실루엣
  if (guardian.type === 'king') {
    // 왕관 모양
    ctx.fillRect(x - size/2, y - size/2, size, size * 0.6);
    ctx.fillRect(x - size/3, y - size/2 - 5, size/3, 5);
    ctx.fillRect(x, y - size/2 - 8, size/6, 8);
  } else if (guardian.type === 'boss') {
    // 보스 실루엣
    ctx.fillRect(x - size/2, y - size/2, size, size * 0.8);
    ctx.fillRect(x - size/3, y - size/2 + size * 0.3, size * 2/3, size * 0.3);
  } else {
    // 기본 기사
    ctx.beginPath();
    ctx.arc(x, y, size/2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 가디언 이름 (작게)
  if (isCurrent) {
    ctx.font = '10px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText(guardian.name, x, y + size/2 + 15);
  }

  ctx.restore();
}

// 보상 그리기
function drawReward(ctx: CanvasRenderingContext2D, reward: any, y: number, isCurrent: boolean) {
  const x = reward.x;
  const iconSize = 20;

  ctx.save();

  // 보상 배경
  ctx.fillStyle = reward.type === 'rp' ? 'rgba(255, 215, 0, 0.3)' :
                   reward.type === 'theme' ? 'rgba(138, 43, 226, 0.3)' : 'rgba(255, 69, 0, 0.3)';
  ctx.fillRect(x - iconSize/2, y - iconSize/2, iconSize, iconSize);

  // 보상 아이콘
  ctx.font = '12px Orbitron, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = isCurrent ? '#ffffff' : '#cccccc';

  if (reward.type === 'rp') {
    ctx.fillText(reward.value, x, y + 4);
  } else if (reward.type === 'theme') {
    ctx.fillText('🎨', x, y + 4);
  } else {
    ctx.fillText('⚔️', x, y + 4);
  }

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

  // 홀로그램 패널 (참고 이미지의 "최고 5탑" 같은 느낌)
  const panelGradient = ctx.createLinearGradient(
    indicatorX - 50, indicatorY,
    indicatorX + 50, indicatorY + 80
  );
  panelGradient.addColorStop(0, 'rgba(0, 50, 100, 0.9)');
  panelGradient.addColorStop(1, 'rgba(0, 20, 40, 0.9)');

  ctx.fillStyle = panelGradient;
  ctx.fillRect(indicatorX - 50, indicatorY, 100, 80);

  // 패널 테두리
  const glowIntensity = Math.sin(time * 2) * 0.3 + 0.7;
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 15 * glowIntensity;
  ctx.strokeRect(indicatorX - 50, indicatorY, 100, 80);

  // "최고 N층" 표시
  ctx.font = '12px Orbitron, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#87ceeb';
  ctx.fillText(`최고 ${Math.max(currentFloor - 1, 0)}층`, indicatorX, indicatorY + 20);

  // 현재 층수
  ctx.font = 'bold 24px Orbitron, monospace';
  ctx.fillStyle = '#00ffff';
  ctx.shadowBlur = 20;
  ctx.fillText(`${currentFloor}`, indicatorX, indicatorY + 50);

  // "층" 텍스트
  ctx.font = '14px Orbitron, monospace';
  ctx.fillStyle = '#87ceeb';
  ctx.fillText('층', indicatorX, indicatorY + 70);

  ctx.restore();
}