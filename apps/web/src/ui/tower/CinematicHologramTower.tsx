import React, { useRef, useEffect } from 'react';

interface CinematicHologramTowerProps {
  currentFloor: number;
  maxFloor: number;
  className?: string;
}

export function CinematicHologramTower({ currentFloor, maxFloor, className = '' }: CinematicHologramTowerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Particle[] = [];

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 320 * dpr;
      canvas.height = 380 * dpr;
      ctx.scale(dpr, dpr);
      return { width: 320, height: 380 };
    };

    const { width, height } = resizeCanvas();

    // 파티클 시스템 초기화
    for (let i = 0; i < 50; i++) {
      particles.push(createParticle(width, height));
    }

    const animate = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const progress = Math.min(currentFloor / maxFloor, 1);

      // 1. 배경 에너지 필드
    //   drawEnergyField(ctx, width, height, time);

      // 2. 홀로그램 UI 프레임 (제거됨)

      // 3. 메인 타워 (3D 원근감)
      drawCinematicTower(ctx, centerX, height, progress, time);

      // 4. 파티클 시스템
      updateAndDrawParticles(ctx, particles, width, height, time);

      // 5. HUD 정보 (제거됨 - HTML로 대체)

      // 6. 홀로그램 노이즈 효과
      drawHologramNoise(ctx, width, height, time);

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
        className="w-[320px] h-[380px] block"
        style={{ imageRendering: 'auto' }}
      />
    </div>
  );
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
}

function createParticle(width: number, height: number): Particle {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    alpha: Math.random() * 0.5 + 0.2,
    size: Math.random() * 2 + 0.5,
    life: 0,
    maxLife: Math.random() * 200 + 100
  };
}

// 에너지 필드 배경
function drawEnergyField(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const centerX = width / 2;
  const centerY = height / 2;
  
  // 방사형 에너지 그라디언트
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) / 2);
  gradient.addColorStop(0, 'rgba(6, 182, 212, 0.1)');
  gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.05)');
  gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 에너지 링들
  for (let i = 0; i < 3; i++) {
    const radius = 50 + i * 40 + Math.sin(time / 1000 + i) * 10;
    const alpha = (Math.sin(time / 1500 + i) * 0.3 + 0.2) * (0.8 - i * 0.2);
    
    ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// 영화적 홀로그램 프레임 (제거됨 - 더 자유로운 공간)

// 영화적 3D 석탑
function drawCinematicTower(ctx: CanvasRenderingContext2D, centerX: number, height: number, progress: number, time: number) {
  const towerBottom = height - 50;
  const towerTop = 5;
  const towerHeight = towerBottom - towerTop;
  const sections = 10; // 10개 섹션 (간격 넓히기)

  // 타워 베이스 플랫폼 (미래적)
  drawTowerBase(ctx, centerX, towerBottom + 12, time);

  for (let i = 0; i < sections; i++) {
    const sectionProgress = (i + 1) / sections;
    const isActive = progress >= sectionProgress;
    const isCurrent = Math.floor(progress * sections) === i;
    const isSpecial = (i + 1) % 3 === 0; // 3섹션마다 특별
    const isBoss = (i + 1) % 6 === 0; // 6섹션마다 보스

    // 3D 원근감 계산
    const sectionY = towerBottom - (i / sections) * towerHeight;
    const perspectiveScale = 1 - (i / sections) * 0.25; // 위로 갈수록 작아짐 (더 완만하게)
    const baseWidth = 140 * perspectiveScale; // 기본 폭 더 증가
    const sectionHeight = (isBoss ? 35 : isSpecial ? 28 : 22) * perspectiveScale; // 높이 더 증가

    // 색상 시스템
    let primaryColor, secondaryColor, glowIntensity;
    
    if (isActive) {
      if (isBoss) {
        primaryColor = [255, 100, 100]; // 빨간색 (보스)
        secondaryColor = [255, 150, 150];
        glowIntensity = 0.9;
      } else if (isSpecial) {
        primaryColor = [168, 85, 247]; // 보라색 (특별)
        secondaryColor = [200, 120, 255];
        glowIntensity = 0.7;
      } else if (isCurrent) {
        primaryColor = [0, 255, 255]; // 시안 (현재)
        secondaryColor = [100, 255, 255];
        glowIntensity = 1.0;
        
        // 현재 섹션 펄스
        const pulse = Math.sin(time / 300) * 0.4 + 0.6;
        glowIntensity *= pulse;
      } else {
        primaryColor = [0, 200, 255]; // 파란색 (완료)
        secondaryColor = [100, 220, 255];
        glowIntensity = 0.5;
      }
    } else {
      primaryColor = [60, 80, 120]; // 어두운 파란색 (비활성)
      secondaryColor = [80, 100, 140];
      glowIntensity = 0.2;
    }

    // 3D 섹션 그리기
    drawTowerSection(ctx, centerX, sectionY, baseWidth, sectionHeight, primaryColor, secondaryColor, glowIntensity, time, i);

    // 홀로그램 데이터 링크
    if (isActive && i > 0) {
      drawDataLink(ctx, centerX, sectionY + sectionHeight, sectionY + sectionHeight + (towerHeight / sections), primaryColor, time, i);
    }

    // 층수 홀로그램 라벨
    if (isActive) {
      const floorNumber = Math.floor(((i + 1) / sections) * maxFloor);
      drawFloorLabel(ctx, centerX + baseWidth/2 + 20, sectionY + sectionHeight/2, floorNumber, primaryColor, time);
    }
  }

  // 정상 크리스탈 (완료 시)
  if (progress >= 1) {
    drawVictoryCrystal(ctx, centerX, towerTop - 30, time);
  }
}

// 3D 타워 섹션 그리기
function drawTowerSection(ctx: CanvasRenderingContext2D, centerX: number, y: number, width: number, height: number, 
                        primaryColor: number[], secondaryColor: number[], glowIntensity: number, time: number, index: number) {
  
  // 3D 원근감을 위한 기울기
  const skew = width * 0.1;
  
  // 메인 면 (정면)
  const frontGradient = ctx.createLinearGradient(centerX - width/2, y, centerX + width/2, y);
  frontGradient.addColorStop(0, `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, ${glowIntensity * 0.3})`);
  frontGradient.addColorStop(0.5, `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, ${glowIntensity * 0.6})`);
  frontGradient.addColorStop(1, `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, ${glowIntensity * 0.3})`);
  
  ctx.fillStyle = frontGradient;
  ctx.fillRect(centerX - width/2, y, width, height);

  // 측면 (3D 효과)
  ctx.fillStyle = `rgba(${secondaryColor[0]}, ${secondaryColor[1]}, ${secondaryColor[2]}, ${glowIntensity * 0.4})`;
  ctx.beginPath();
  ctx.moveTo(centerX + width/2, y);
  ctx.lineTo(centerX + width/2 + skew, y - skew);
  ctx.lineTo(centerX + width/2 + skew, y + height - skew);
  ctx.lineTo(centerX + width/2, y + height);
  ctx.closePath();
  ctx.fill();

  // 윗면 (3D 효과)
  ctx.fillStyle = `rgba(${secondaryColor[0]}, ${secondaryColor[1]}, ${secondaryColor[2]}, ${glowIntensity * 0.5})`;
  ctx.beginPath();
  ctx.moveTo(centerX - width/2, y);
  ctx.lineTo(centerX - width/2 + skew, y - skew);
  ctx.lineTo(centerX + width/2 + skew, y - skew);
  ctx.lineTo(centerX + width/2, y);
  ctx.closePath();
  ctx.fill();

  // 홀로그램 그리드 라인
  ctx.strokeStyle = `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, ${glowIntensity * 0.6})`;
  ctx.lineWidth = 1;
  
  // 수직 그리드 + 전기 흐름
  for (let gridIndex = 0; gridIndex <= 6; gridIndex++) {
    const x = centerX - width/2 + (gridIndex * width/6);
    
    // 기본 그리드 선
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.stroke();
    
    // 전기 흐름 효과 (활성화된 층만)
    if (isActive && glowIntensity > 0.4) {
      const flowProgress = (time / 1000 + gridIndex * 0.3 + index * 0.1) % 1;
      const flowY = y + flowProgress * height;
      
      // 전기 점
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(time / 200 + gridIndex) * 0.5 + 0.5})`;
      ctx.beginPath();
      ctx.arc(x, flowY, 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // 전기 꼬리
      const tailLength = 8;
      const gradient = ctx.createLinearGradient(x, flowY - tailLength, x, flowY);
      gradient.addColorStop(0, `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, 0)`);
      gradient.addColorStop(1, `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, 0.8)`);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, flowY - tailLength);
      ctx.lineTo(x, flowY);
      ctx.stroke();
    }
  }
  
  // 수평 그리드 + 전기 흐름
  for (let gridIndex = 0; gridIndex <= 3; gridIndex++) {
    const gridY = y + (gridIndex * height/3);
    
    // 기본 그리드 선
    ctx.beginPath();
    ctx.moveTo(centerX - width/2, gridY);
    ctx.lineTo(centerX + width/2, gridY);
    ctx.stroke();
    
    // 수평 전기 흐름 (활성화된 층만)
    if (isActive && glowIntensity > 0.4) {
      const flowProgress = (time / 1500 + gridIndex * 0.4 + index * 0.15) % 1;
      const flowX = centerX - width/2 + flowProgress * width;
      
      // 전기 점
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(time / 250 + gridIndex) * 0.4 + 0.4})`;
      ctx.beginPath();
      ctx.arc(flowX, gridY, 1, 0, Math.PI * 2);
      ctx.fill();
      
      // 전기 꼬리
      const tailLength = 6;
      const gradient = ctx.createLinearGradient(flowX - tailLength, gridY, flowX, gridY);
      gradient.addColorStop(0, `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, 0)`);
      gradient.addColorStop(1, `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, 0.6)`);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(flowX - tailLength, gridY);
      ctx.lineTo(flowX, gridY);
      ctx.stroke();
    }
  }

  // 에너지 코어 및 아크 (제거됨)
}

// 타워 베이스 플랫폼
function drawTowerBase(ctx: CanvasRenderingContext2D, centerX: number, y: number, time: number) {
  const baseWidth = 150;
  const baseHeight = 18;
  const skew = 15;
  
  // 메인 플랫폼
  const gradient = ctx.createLinearGradient(centerX - baseWidth/2, y, centerX + baseWidth/2, y);
  gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
  gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.7)');
  gradient.addColorStop(1, 'rgba(0, 255, 255, 0.3)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(centerX - baseWidth/2, y, baseWidth, baseHeight);

  // 3D 측면
  ctx.fillStyle = 'rgba(0, 200, 255, 0.5)';
  ctx.beginPath();
  ctx.moveTo(centerX + baseWidth/2, y);
  ctx.lineTo(centerX + baseWidth/2 + skew, y - skew);
  ctx.lineTo(centerX + baseWidth/2 + skew, y + baseHeight - skew);
  ctx.lineTo(centerX + baseWidth/2, y + baseHeight);
  ctx.closePath();
  ctx.fill();

  // 에너지 코어들
  for (let i = 0; i < 5; i++) {
    const coreX = centerX - baseWidth/2 + 20 + i * 20;
    const corePulse = Math.sin(time / 400 + i) * 0.5 + 0.5;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${corePulse * 0.8})`;
    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(coreX, y + baseHeight/2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// 데이터 링크 (층간 연결)
function drawDataLink(ctx: CanvasRenderingContext2D, centerX: number, startY: number, endY: number, 
                     color: number[], time: number, index: number) {
  const flow = (time / 1000 + index) % 1;
  const linkY = startY + (endY - startY) * flow;
  
  ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.6)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, startY);
  ctx.lineTo(centerX, endY);
  ctx.stroke();

  // 흐르는 데이터 점
  ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(time / 200 + index) * 0.5 + 0.5})`;
  ctx.beginPath();
  ctx.arc(centerX, linkY, 2, 0, Math.PI * 2);
  ctx.fill();
}

// 층수 홀로그램 라벨
function drawFloorLabel(ctx: CanvasRenderingContext2D, x: number, y: number, floorNumber: number, 
                      color: number[], time: number) {
  const pulse = Math.sin(time / 800) * 0.3 + 0.7;
  
  // 라벨 배경
  ctx.fillStyle = `rgba(0, 0, 0, 0.7)`;
  ctx.fillRect(x - 15, y - 8, 30, 16);
  
  // 라벨 테두리
  ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${pulse})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 15, y - 8, 30, 16);
  
  // 층수 텍스트
  ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${pulse})`;
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(floorNumber.toString(), x, y + 3);
}

// 승리 크리스탈
function drawVictoryCrystal(ctx: CanvasRenderingContext2D, centerX: number, y: number, time: number) {
  const pulse = Math.sin(time / 400) * 0.5 + 0.5;
  const crystalSize = 20 + pulse * 5;
  
  // 크리스탈 코어
  ctx.fillStyle = `rgba(255, 215, 0, ${0.8 + pulse * 0.2})`;
  ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.arc(centerX, y, crystalSize/2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 승리 광선들
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2 / 8) + time / 1000;
    const beamLength = 30 + Math.sin(time / 600 + i) * 10;
    const beamX = centerX + Math.cos(angle) * beamLength;
    const beamY = y + Math.sin(angle) * beamLength;
    
    ctx.strokeStyle = `rgba(255, 215, 0, ${Math.sin(time / 400 + i) * 0.4 + 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, y);
    ctx.lineTo(beamX, beamY);
    ctx.stroke();
  }
}

// 파티클 시스템
function updateAndDrawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], 
                               width: number, height: number, time: number) {
  particles.forEach(particle => {
    // 파티클 업데이트
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life++;
    
    // 경계 체크
    if (particle.x < 0 || particle.x > width || particle.y < 0 || particle.y > height || 
        particle.life > particle.maxLife) {
      Object.assign(particle, createParticle(width, height));
    }
    
    // 파티클 그리기
    const lifeRatio = 1 - (particle.life / particle.maxLife);
    ctx.fillStyle = `rgba(0, 255, 255, ${particle.alpha * lifeRatio})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

// 영화적 HUD (제거됨 - HTML UI로 대체)

// 홀로그램 노이즈 효과
function drawHologramNoise(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  // 스캔라인
  const scanY = (Math.sin(time / 3000) * 0.5 + 0.5) * height;
  ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
  ctx.fillRect(0, scanY - 1, width, 3);
}
