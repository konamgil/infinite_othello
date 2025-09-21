import React, { useRef, useEffect } from 'react';

interface CanvasHologramTowerProps {
  currentFloor: number;
  maxFloor: number;
  className?: string;
}

export function CanvasHologramTower({ currentFloor, maxFloor, className = '' }: CanvasHologramTowerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 280 * dpr;
      canvas.height = 400 * dpr;
      ctx.scale(dpr, dpr);
      return { width: 280, height: 400 };
    };

    const { width, height } = resizeCanvas();

    const animate = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const progress = Math.min(currentFloor / maxFloor, 1);

      // 홀로그램 프레임 그리기
      drawHologramFrame(ctx, width, height, time);

      // 석탑 그리기
      drawPagodaTower(ctx, centerX, height, progress, time);

      // 진행도 정보 그리기
      drawProgressInfo(ctx, centerX, height, currentFloor, maxFloor, progress);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate(0);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [currentFloor, maxFloor]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-[280px] h-[400px] block"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}

// 홀로그램 프레임 그리기
function drawHologramFrame(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const pulse = Math.sin(time / 1000) * 0.3 + 0.7;
  
  ctx.strokeStyle = `rgba(6, 182, 212, ${pulse * 0.6})`;
  ctx.lineWidth = 2;
  
  // 외부 프레임
  ctx.strokeRect(20, 20, width - 40, height - 40);
  
  // 코너 장식
  const cornerSize = 12;
  const corners = [
    [20, 20], [width - 20, 20], [20, height - 20], [width - 20, height - 20]
  ];
  
  corners.forEach(([x, y]) => {
    ctx.strokeStyle = `rgba(6, 182, 212, ${pulse * 0.8})`;
    ctx.lineWidth = 3;
    
    if (x === 20 && y === 20) { // 좌상단
      ctx.beginPath();
      ctx.moveTo(x, y + cornerSize);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerSize, y);
      ctx.stroke();
    } else if (x === width - 20 && y === 20) { // 우상단
      ctx.beginPath();
      ctx.moveTo(x - cornerSize, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + cornerSize);
      ctx.stroke();
    } else if (x === 20 && y === height - 20) { // 좌하단
      ctx.beginPath();
      ctx.moveTo(x, y - cornerSize);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerSize, y);
      ctx.stroke();
    } else { // 우하단
      ctx.beginPath();
      ctx.moveTo(x - cornerSize, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y - cornerSize);
      ctx.stroke();
    }
  });

  // 스캔라인
  const scanY = (Math.sin(time / 2000) * 0.5 + 0.5) * (height - 40) + 20;
  ctx.strokeStyle = `rgba(6, 182, 212, 0.4)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, scanY);
  ctx.lineTo(width - 20, scanY);
  ctx.stroke();
}

// 석탑 그리기
function drawPagodaTower(ctx: CanvasRenderingContext2D, centerX: number, height: number, progress: number, time: number) {
  const towerBottom = height - 80;
  const towerHeight = 250;
  const levels = 15; // 15층 석탑
  
  for (let i = 0; i < levels; i++) {
    const level = i + 1;
    const levelProgress = level / levels;
    const isActive = progress >= levelProgress;
    const isCurrent = Math.floor(progress * levels) === i;
    const isSpecial = level % 5 === 0; // 5층마다 특별층
    
    // 층 위치 및 크기
    const y = towerBottom - (i * (towerHeight / levels));
    const baseWidth = 80;
    const levelWidth = baseWidth - (i * 3.5); // 위로 갈수록 작아짐
    const levelHeight = isSpecial ? 16 : 12;
    
    // 층 색상 결정
    let color, glowColor, alpha;
    if (isActive) {
      if (isSpecial) {
        color = [168, 85, 247]; // 보라색 (특별층)
        glowColor = [168, 85, 247, 0.6];
        alpha = 0.8;
      } else if (isCurrent) {
        color = [6, 182, 212]; // 사이안 (현재층)
        glowColor = [6, 182, 212, 0.8];
        alpha = 0.9;
        
        // 현재 층 펄스 효과
        const pulse = Math.sin(time / 500) * 0.3 + 0.7;
        alpha *= pulse;
      } else {
        color = [6, 182, 212]; // 사이안 (완료층)
        glowColor = [6, 182, 212, 0.4];
        alpha = 0.6;
      }
    } else {
      color = [75, 85, 99]; // 회색 (미완료층)
      glowColor = [75, 85, 99, 0.2];
      alpha = 0.3;
    }
    
    // 층 그리기
    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
    ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha + 0.2})`;
    ctx.lineWidth = 1;
    
    const x = centerX - levelWidth / 2;
    ctx.fillRect(x, y, levelWidth, levelHeight);
    ctx.strokeRect(x, y, levelWidth, levelHeight);
    
    // 글로우 효과
    if (isActive) {
      ctx.shadowColor = `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, ${glowColor[3]})`;
      ctx.shadowBlur = isSpecial ? 15 : isCurrent ? 20 : 10;
      ctx.fillRect(x, y, levelWidth, levelHeight);
      ctx.shadowBlur = 0;
    }
    
    // 내부 디테일
    if (isActive) {
      // 스캔라인
      const scanX = x + (Math.sin(time / 1000 + i) * 0.5 + 0.5) * levelWidth;
      ctx.strokeStyle = `rgba(255, 255, 255, 0.6)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(scanX, y);
      ctx.lineTo(scanX, y + levelHeight);
      ctx.stroke();
      
      // 현재 층 파티클
      if (isCurrent) {
        const particleCount = 3;
        for (let p = 0; p < particleCount; p++) {
          const px = x + (p + 1) * (levelWidth / (particleCount + 1));
          const py = y + levelHeight / 2 + Math.sin(time / 800 + p) * 2;
          
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(time / 600 + p) * 0.5 + 0.5})`;
          ctx.beginPath();
          ctx.arc(px, py, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    // 층수 표시 (활성화된 층만)
    if (isActive) {
      const floorNumber = Math.floor((level / levels) * maxFloor);
      ctx.fillStyle = `rgba(6, 182, 212, 0.8)`;
      ctx.font = '8px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(floorNumber.toString(), x - 5, y + levelHeight / 2 + 2);
    }
  }
  
  // 기단부
  const baseY = towerBottom + 8;
  const baseWidth = 90;
  ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
  ctx.lineWidth = 2;
  ctx.fillRect(centerX - baseWidth / 2, baseY, baseWidth, 12);
  ctx.strokeRect(centerX - baseWidth / 2, baseY, baseWidth, 12);
  
  // 기단부 글로우
  ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
  ctx.shadowBlur = 10;
  ctx.fillRect(centerX - baseWidth / 2, baseY, baseWidth, 12);
  ctx.shadowBlur = 0;
}

// 진행도 정보 그리기
function drawProgressInfo(ctx: CanvasRenderingContext2D, centerX: number, height: number, currentFloor: number, maxFloor: number, progress: number) {
  const infoY = height - 40;
  
  // 진행도 숫자
  ctx.fillStyle = 'rgba(6, 182, 212, 1)';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${currentFloor.toString().padStart(3, '0')} / ${maxFloor}`, centerX, infoY);
  
  // 진행 바
  const barY = infoY + 15;
  const barWidth = 120;
  const barHeight = 4;
  const barX = centerX - barWidth / 2;
  
  // 진행 바 배경
  ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // 진행 바 채우기
  const fillWidth = barWidth * progress;
  const gradient = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
  gradient.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
  gradient.addColorStop(1, 'rgba(168, 85, 247, 0.8)');
  ctx.fillStyle = gradient;
  ctx.fillRect(barX, barY, fillWidth, barHeight);
  
  // 진행 바 글로우
  ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
  ctx.shadowBlur = 8;
  ctx.fillRect(barX, barY, fillWidth, barHeight);
  ctx.shadowBlur = 0;
  
  // 퍼센트
  ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
  ctx.font = '10px monospace';
  ctx.fillText(`${Math.round(progress * 100)}% COMPLETE`, centerX, barY + 15);
  
  // 홀로그램 ID
  ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
  ctx.font = '8px monospace';
  ctx.fillText(`HOLO-ID: TWR-${currentFloor.toString().padStart(3, '0')}`, centerX, barY + 25);
}
