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
      canvas.height = 420 * dpr;
      ctx.scale(dpr, dpr);
      return { width: 320, height: 420 };
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

      // 0. 고급 배경 효과
      drawEnhancedBackground(ctx, width, height, time);

      // 1. 메인 타워 (3D 원근감)
      drawCinematicTower(ctx, centerX, height, progress, time);

      // 2. 강화된 파티클 시스템
      updateAndDrawParticles(ctx, particles, width, height, time);

      // 3. 타워 주변 에너지 오라
      drawTowerAura(ctx, centerX, height, progress, time);

      // 4. 홀로그램 노이즈 효과
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
        className="w-[320px] h-[420px] block"
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
  const towerBottom = height - 30;
  const towerTop = 40;
  const towerHeight = towerBottom - towerTop;
  const sections = 20; // 20개 섹션으로 늘려 더 부드러운 피라미드

  // 타워 베이스 플랫폼 제거됨

  // 위에서 아래로 그려서 아래층이 위층을 가리도록 함
  for (let i = sections - 1; i >= 0; i--) {
    const sectionProgress = (i + 1) / sections;
    const isActive = progress >= sectionProgress;
    const isCurrent = Math.floor(progress * sections) === i;
    const isSpecial = (i + 1) % 3 === 0; // 3섹션마다 특별
    const isBoss = (i + 1) % 6 === 0; // 6섹션마다 보스

    // 피라미드형 3D 원근감 계산 - 위로 갈수록 더 뾰족하게
    const sectionY = towerBottom - (i / sections) * towerHeight;
    // i=0이 가장 아래층(1층), i=19가 가장 위층(300층)
    const heightRatio = i / sections; // 0 (아래) ~ 0.95 (위)
    
    // 삼각형 형태: 직선적으로 일정하게 축소
    const linearScale = 1.0 - heightRatio * 0.8; // 1.0 (아래) → 0.2 (위) 직선적 축소
    const baseWidth = 180 * linearScale; // 현재 층의 아래 폭
    
    // 다음 층(위층)의 폭 계산 - 현재 층의 위 폭이 됨 (직선적)
    const nextHeightRatio = (i + 1) / sections;
    const nextLinearScale = 1.0 - nextHeightRatio * 0.8;
    const topWidth = i < sections - 1 ? 180 * nextLinearScale : baseWidth * 0.8; // 최상층도 직선적으로
    
    const sectionHeight = (towerHeight / sections) * 0.9; // 각 층 높이를 균등하게

    // 색상 시스템
    let primaryColor, secondaryColor, glowIntensity;
    const isFinalFloor = i === sections - 1; // 마지막 섹션 (300층)
    
    if (isActive) {
      if (isFinalFloor) {
        primaryColor = [255, 215, 0]; // 황금빛 (300층)
        secondaryColor = [255, 235, 100];
        glowIntensity = 1.2;
        
        // 최종 층 특별 펄스
        const pulse = Math.sin(time / 200) * 0.5 + 0.7;
        glowIntensity *= pulse;
      } else if (isBoss) {
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
      if (isFinalFloor) {
        primaryColor = [150, 130, 60]; // 더 밝은 어두운 황금 (비활성 300층)
        secondaryColor = [170, 150, 80];
        glowIntensity = 0.45;
      } else {
        primaryColor = [80, 100, 150]; // 더 밝은 어두운 파란색 (비활성)
        secondaryColor = [100, 120, 170];
        glowIntensity = 0.35; // 0.2에서 0.35로 증가
      }
    }

    // 3D 섹션 그리기 - topWidth 추가 전달
    drawTowerSection(ctx, centerX, sectionY, baseWidth, topWidth, sectionHeight, primaryColor, secondaryColor, glowIntensity, time, i, isActive);

    // 홀로그램 데이터 링크
    if (isActive && i > 0) {
      drawDataLink(ctx, centerX, sectionY + sectionHeight, sectionY + sectionHeight + (towerHeight / sections), primaryColor, time, i);
    }

    // 층수 홀로그램 라벨 - 5개 섹션마다만 표시
    if (isActive && (i + 1) % 5 === 0) {
      const floorNumber = Math.floor(((i + 1) / sections) * 300); // maxFloor 대신 300 직접 사용
      drawFloorLabel(ctx, centerX + baseWidth/2 + 20, sectionY + sectionHeight/2, floorNumber, primaryColor, time);
    }
  }

  // 정상 크리스탈 (완료 시)
  if (progress >= 1) {
    drawVictoryCrystal(ctx, centerX, towerTop - 15, time);
  }
}

// 피라미드형 3D 타워 섹션 그리기
function drawTowerSection(ctx: CanvasRenderingContext2D, centerX: number, y: number, 
                        baseWidth: number, topWidth: number, height: number, 
                        primaryColor: number[], secondaryColor: number[], glowIntensity: number, 
                        time: number, index: number, isActive: boolean) {
  
  // topWidth는 이미 메인 루프에서 계산되어 전달됨
  const width = baseWidth; // 가독성을 위해
  
  // 3D 원근감을 위한 기울기
  const skew = width * 0.08;
  
  // 고급 메인 면 (정면) - 다층 그라디언트와 질감
  
  // 1. 베이스 메탈릭 레이어
  const metallicGradient = ctx.createLinearGradient(centerX - width/2, y, centerX + width/2, y + height);
  metallicGradient.addColorStop(0, `rgba(${secondaryColor[0] * 0.3}, ${secondaryColor[1] * 0.3}, ${secondaryColor[2] * 0.3}, ${glowIntensity * 0.8})`);
  metallicGradient.addColorStop(0.3, `rgba(${primaryColor[0] * 0.6}, ${primaryColor[1] * 0.6}, ${primaryColor[2] * 0.6}, ${glowIntensity * 0.4})`);
  metallicGradient.addColorStop(0.7, `rgba(${primaryColor[0] * 0.8}, ${primaryColor[1] * 0.8}, ${primaryColor[2] * 0.8}, ${glowIntensity * 0.6})`);
  metallicGradient.addColorStop(1, `rgba(${secondaryColor[0] * 0.4}, ${secondaryColor[1] * 0.4}, ${secondaryColor[2] * 0.4}, ${glowIntensity * 0.3})`);
  
  ctx.fillStyle = metallicGradient;
  ctx.beginPath();
  ctx.moveTo(centerX - width/2, y + height);
  ctx.lineTo(centerX - topWidth/2, y);
  ctx.lineTo(centerX + topWidth/2, y);
  ctx.lineTo(centerX + width/2, y + height);
  ctx.closePath();
  ctx.fill();
  
  // 2. 발광 오버레이 레이어
  const glowGradient = ctx.createRadialGradient(centerX, y + height/2, 0, centerX, y + height/2, width/2);
  glowGradient.addColorStop(0, `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, ${glowIntensity * 0.4})`);
  glowGradient.addColorStop(0.6, `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, ${glowIntensity * 0.2})`);
  glowGradient.addColorStop(1, `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, 0)`);
  
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.moveTo(centerX - width/2, y + height);
  ctx.lineTo(centerX - topWidth/2, y);
  ctx.lineTo(centerX + topWidth/2, y);
  ctx.lineTo(centerX + width/2, y + height);
  ctx.closePath();
  ctx.fill();
  
  // 3. 하이라이트 반사 효과
  const highlightGradient = ctx.createLinearGradient(centerX - width/4, y, centerX + width/4, y + height/3);
  highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${glowIntensity * 0.3})`);
  highlightGradient.addColorStop(0.5, `rgba(255, 255, 255, ${glowIntensity * 0.1})`);
  highlightGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
  
  ctx.fillStyle = highlightGradient;
  ctx.beginPath();
  ctx.moveTo(centerX - width/3, y + height);
  ctx.lineTo(centerX - topWidth/3, y);
  ctx.lineTo(centerX, y);
  ctx.lineTo(centerX, y + height);
  ctx.closePath();
  ctx.fill();

  // 고급 측면 (3D 효과) - 그라디언트와 음영
  const sideGradient = ctx.createLinearGradient(centerX + width/2, y + height, centerX + width/2 + skew, y - skew);
  sideGradient.addColorStop(0, `rgba(${secondaryColor[0] * 0.4}, ${secondaryColor[1] * 0.4}, ${secondaryColor[2] * 0.4}, ${glowIntensity * 0.6})`);
  sideGradient.addColorStop(0.5, `rgba(${primaryColor[0] * 0.3}, ${primaryColor[1] * 0.3}, ${primaryColor[2] * 0.3}, ${glowIntensity * 0.4})`);
  sideGradient.addColorStop(1, `rgba(${secondaryColor[0] * 0.2}, ${secondaryColor[1] * 0.2}, ${secondaryColor[2] * 0.2}, ${glowIntensity * 0.3})`);
  
  ctx.fillStyle = sideGradient;
  ctx.beginPath();
  ctx.moveTo(centerX + width/2, y + height);
  ctx.lineTo(centerX + topWidth/2, y);
  ctx.lineTo(centerX + topWidth/2 + skew, y - skew);
  ctx.lineTo(centerX + width/2 + skew, y + height - skew);
  ctx.closePath();
  ctx.fill();

  // 고급 윗면 (3D 효과) - 방사형 그라디언트
  const topGradient = ctx.createRadialGradient(centerX, y - skew/2, 0, centerX, y - skew/2, topWidth/2 + skew);
  topGradient.addColorStop(0, `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, ${glowIntensity * 0.8})`);
  topGradient.addColorStop(0.7, `rgba(${secondaryColor[0] * 0.8}, ${secondaryColor[1] * 0.8}, ${secondaryColor[2] * 0.8}, ${glowIntensity * 0.5})`);
  topGradient.addColorStop(1, `rgba(${secondaryColor[0] * 0.4}, ${secondaryColor[1] * 0.4}, ${secondaryColor[2] * 0.4}, ${glowIntensity * 0.3})`);
  
  ctx.fillStyle = topGradient;
  ctx.beginPath();
  ctx.moveTo(centerX - topWidth/2, y);
  ctx.lineTo(centerX - topWidth/2 + skew, y - skew);
  ctx.lineTo(centerX + topWidth/2 + skew, y - skew);
  ctx.lineTo(centerX + topWidth/2, y);
  ctx.closePath();
  ctx.fill();

  // 고급 홀로그램 그리드 시스템
  
  // 1. 기본 그리드 (얇은 선)
  ctx.strokeStyle = `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, ${glowIntensity * 0.3})`;
  ctx.lineWidth = 0.5;
  
  // 피라미드형 수직 그리드
  for (let gridIndex = 0; gridIndex <= 8; gridIndex++) {
    const ratio = gridIndex / 8;
    const bottomX = centerX - width/2 + (ratio * width);
    const topX = centerX - topWidth/2 + (ratio * topWidth);
    
    ctx.beginPath();
    ctx.moveTo(topX, y);
    ctx.lineTo(bottomX, y + height);
    ctx.stroke();
  }
  
  // 피라미드형 수평 그리드
  for (let gridIndex = 0; gridIndex <= 4; gridIndex++) {
    const gridY = y + (gridIndex * height/4);
    const ratio = gridIndex / 4;
    const currentWidth = topWidth + (width - topWidth) * ratio;
    
    ctx.beginPath();
    ctx.moveTo(centerX - currentWidth/2, gridY);
    ctx.lineTo(centerX + currentWidth/2, gridY);
    ctx.stroke();
  }
  
  // 2. 강조 그리드 (굵은 선)
  ctx.strokeStyle = `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, ${glowIntensity * 0.7})`;
  ctx.lineWidth = 1.5;
  
  // 중앙 수직선
  ctx.beginPath();
  ctx.moveTo(centerX, y);
  ctx.lineTo(centerX, y + height);
  ctx.stroke();
  
  // 중앙 수평선
  const midY = y + height/2;
  const midWidth = topWidth + (width - topWidth) * 0.5;
  ctx.beginPath();
  ctx.moveTo(centerX - midWidth/2, midY);
  ctx.lineTo(centerX + midWidth/2, midY);
  ctx.stroke();
  
  // 3. 에너지 펄스 효과
  if (isActive) {
    const pulseIntensity = Math.sin(time / 300 + index) * 0.5 + 0.5;
    ctx.strokeStyle = `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, ${pulseIntensity * glowIntensity * 0.8})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, ${pulseIntensity * 0.5})`;
    ctx.shadowBlur = 8;
    
    // 펄싱 테두리
    ctx.beginPath();
    ctx.moveTo(centerX - width/2, y + height);
    ctx.lineTo(centerX - topWidth/2, y);
    ctx.lineTo(centerX + topWidth/2, y);
    ctx.lineTo(centerX + width/2, y + height);
    ctx.closePath();
    ctx.stroke();
    
    ctx.shadowBlur = 0; // 그림자 리셋
  }
  
  // 4. 데이터 노드 (교차점에 작은 점들)
  if (isActive) {
    for (let vIndex = 1; vIndex <= 7; vIndex += 2) {
      for (let hIndex = 1; hIndex <= 3; hIndex += 2) {
        const vRatio = vIndex / 8;
        const hRatio = hIndex / 4;
        
        const nodeX = centerX - (topWidth + (width - topWidth) * hRatio)/2 + vRatio * (topWidth + (width - topWidth) * hRatio);
        const nodeY = y + hRatio * height;
        
        const nodeIntensity = Math.sin(time / 200 + vIndex + hIndex) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(${primaryColor[0]}, ${primaryColor[1]}, ${primaryColor[2]}, ${nodeIntensity * glowIntensity})`;
        
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 에너지 코어 및 아크 (제거됨)
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
  const pulse = Math.sin(time / 500) * 0.4 + 0.6;
  const crystalSize = 16 + pulse * 4; // 크기 키움
  
  // 크리스탈 코어 (더 밝고 선명하게)
  ctx.fillStyle = `rgba(255, 215, 0, ${0.8 + pulse * 0.2})`;
  ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
  ctx.shadowBlur = 20; // 그림자 강화
  ctx.beginPath();
  ctx.arc(centerX, y, crystalSize/2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 내부 하이라이트
  ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + pulse * 0.2})`;
  ctx.beginPath();
  ctx.arc(centerX - 2, y - 2, crystalSize/4, 0, Math.PI * 2);
  ctx.fill();

  // 승리 광선들 (더 눈에 띄게)
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2 / 8) + time / 1200;
    const beamLength = 25 + Math.sin(time / 700 + i) * 8;
    const beamX = centerX + Math.cos(angle) * beamLength;
    const beamY = y + Math.sin(angle) * beamLength;
    
    ctx.strokeStyle = `rgba(255, 215, 0, ${Math.sin(time / 500 + i) * 0.4 + 0.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, y);
    ctx.lineTo(beamX, beamY);
    ctx.stroke();
  }
}

// 강화된 파티클 시스템
function updateAndDrawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], 
                               width: number, height: number, time: number) {
  particles.forEach((particle, index) => {
    // 파티클 업데이트
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life++;
    
    // 타워 중심 근처에서는 약간 끌려감
    const centerX = width / 2;
    const centerY = height - 30;
    const distToCenter = Math.sqrt((particle.x - centerX) ** 2 + (particle.y - centerY) ** 2);
    
    if (distToCenter < 100) {
      const pullStrength = (100 - distToCenter) / 100 * 0.02;
      particle.vx += (centerX - particle.x) * pullStrength * 0.01;
      particle.vy += (centerY - particle.y) * pullStrength * 0.01;
    }
    
    // 경계 체크
    if (particle.x < 0 || particle.x > width || particle.y < 0 || particle.y > height || 
        particle.life > particle.maxLife) {
      Object.assign(particle, createParticle(width, height));
    }
    
    // 고급 파티클 렌더링
    const lifeRatio = 1 - (particle.life / particle.maxLife);
    const pulseSize = particle.size * (1 + Math.sin(time / 300 + index) * 0.3);
    const alpha = particle.alpha * lifeRatio;
    
    // 글로우 효과
    ctx.shadowColor = `rgba(0, 255, 255, ${alpha})`;
    ctx.shadowBlur = 6;
    
    ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2);
    ctx.fill();
    
    // 내부 하이라이트
    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, pulseSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.shadowBlur = 0; // 그림자 리셋
}

// 영화적 HUD (제거됨 - HTML UI로 대체)

// 고급 배경 효과
function drawEnhancedBackground(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  // 1. 기본 그라디언트 배경
  const bgGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
  bgGradient.addColorStop(0, 'rgba(0, 10, 20, 0.8)');
  bgGradient.addColorStop(0.5, 'rgba(0, 5, 15, 0.6)');
  bgGradient.addColorStop(1, 'rgba(0, 0, 10, 0.4)');
  
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);
  
  // 2. 움직이는 에너지 링
  for (let i = 0; i < 3; i++) {
    const ringRadius = 50 + i * 30 + Math.sin(time / 1000 + i) * 10;
    const ringAlpha = (Math.sin(time / 800 + i * 2) * 0.3 + 0.4) * 0.3;
    
    ctx.strokeStyle = `rgba(0, 150, 255, ${ringAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(width/2, height/2, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// 타워 주변 에너지 오라
function drawTowerAura(ctx: CanvasRenderingContext2D, centerX: number, height: number, progress: number, time: number) {
  const auraIntensity = Math.sin(time / 500) * 0.3 + 0.7;
  const auraRadius = 120 + progress * 50;
  
  // 외부 오라
  const outerAura = ctx.createRadialGradient(centerX, height - 30, 0, centerX, height - 30, auraRadius);
  outerAura.addColorStop(0, `rgba(0, 255, 255, ${auraIntensity * 0.2})`);
  outerAura.addColorStop(0.7, `rgba(0, 150, 255, ${auraIntensity * 0.1})`);
  outerAura.addColorStop(1, 'rgba(0, 100, 200, 0)');
  
  ctx.fillStyle = outerAura;
  ctx.fillRect(0, 0, centerX * 2, height);
  
  // 내부 오라 (더 밝음)
  const innerAura = ctx.createRadialGradient(centerX, height - 30, 0, centerX, height - 30, auraRadius * 0.6);
  innerAura.addColorStop(0, `rgba(255, 255, 255, ${auraIntensity * 0.1})`);
  innerAura.addColorStop(0.5, `rgba(0, 255, 255, ${auraIntensity * 0.15})`);
  innerAura.addColorStop(1, 'rgba(0, 200, 255, 0)');
  
  ctx.fillStyle = innerAura;
  ctx.fillRect(0, 0, centerX * 2, height);
}

// 홀로그램 노이즈 효과
function drawHologramNoise(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  // 1. 스캔라인
  const scanY = (Math.sin(time / 3000) * 0.5 + 0.5) * height;
  ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
  ctx.fillRect(0, scanY - 1, width, 3);
  
  // 2. 랜덤 픽셀 노이즈
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const intensity = Math.random() * 0.3;
    
    ctx.fillStyle = `rgba(0, 255, 255, ${intensity})`;
    ctx.fillRect(x, y, 1, 1);
  }
  
  // 3. 글리치 효과
  if (Math.random() < 0.02) {
    const glitchY = Math.random() * height;
    const glitchHeight = 5 + Math.random() * 10;
    ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
    ctx.fillRect(0, glitchY, width, glitchHeight);
  }
}

