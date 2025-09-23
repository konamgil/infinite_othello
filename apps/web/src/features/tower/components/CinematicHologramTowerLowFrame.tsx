import React, { useEffect, useRef } from 'react';

/** props 동일 — 그대로 교체해서 사용하세요 */
interface CinematicHologramTowerProps {
  currentFloor: number;
  maxFloor: number;
  className?: string;
}

/** ──────────────────────────────────────────────────────────────────────────
 *  최적화 포인트 요약
 *  - DPR 상한 (<= 1.5) : 픽셀 예산 절감
 *  - Offscreen 레이어 2장 (배경/bg, 타워/tw) : 8~12fps로만 갱신
 *  - 메인 합성: 매 프레임 drawImage로 빠르게
 *  - 파티클: shadowBlur 제거, 라디얼 스프라이트 1회 생성 캐시
 *  - 격자/노드 밀도 축소, 고가 효과(펄스 테두리)는 저주파에서만
 *  - Hologram Noise: 30fps로 토글
 *  ───────────────────────────────────────────────────────────────────────── */

export function CinematicHologramTower({
  currentFloor,
  maxFloor,
  className = '',
}: CinematicHologramTowerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // ── 1) 논리 크기 & DPR 상한
    const LOGICAL_W = 320;
    const LOGICAL_H = 420;
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5); // A패치: 상한 1.5

    canvas.width = Math.round(LOGICAL_W * DPR);
    canvas.height = Math.round(LOGICAL_H * DPR);
    // setTransform으로 스케일 고정 (중복 scale 누적 방지)
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // ── 2) 오프스크린 레이어 준비 (배경, 타워)
    const bgLayer = document.createElement('canvas');
    const twLayer = document.createElement('canvas');
    bgLayer.width = LOGICAL_W;
    bgLayer.height = LOGICAL_H;
    twLayer.width = LOGICAL_W;
    twLayer.height = LOGICAL_H;
    const bg = bgLayer.getContext('2d', { alpha: true })!;
    const tw = twLayer.getContext('2d', { alpha: true })!;

    // ── 3) 파티클 초기화 (B패치: 스프라이트 캐시 사용)
    const particles: Particle[] = Array.from({ length: 50 }, () =>
      createParticle(LOGICAL_W, LOGICAL_H),
    );

    // 저주파 갱신 주기 (ms)
    const BG_INTERVAL = 120; // ≈ 8~10fps
    const TOWER_INTERVAL = 80; // ≈ 12fps
    let lastBg = 0;
    let lastTw = 0;
    let prevProgress = -1;

    // 노이즈는 30fps 토글
    let noiseToggle = false;

    let raf = 0;
    const animate = (now: number) => {
      const progress = clamp(
        maxFloor > 0 ? currentFloor / maxFloor : 0,
        0,
        1,
      );

      // (a) 배경: 저FPS만 갱신
      if (now - lastBg >= BG_INTERVAL) {
        bg.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
        drawEnhancedBackground(bg, LOGICAL_W, LOGICAL_H, now);
        lastBg = now;
      }

      // (b) 타워: 저FPS 갱신 + progress 변동 시 즉시 갱신
      if (now - lastTw >= TOWER_INTERVAL || prevProgress !== progress) {
        tw.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
        drawCinematicTower(tw, LOGICAL_W / 2, LOGICAL_H, progress, now);
        drawTowerAura(tw, LOGICAL_W / 2, LOGICAL_H, progress, now);
        prevProgress = progress;
        lastTw = now;
      }

      // (c) 메인 합성
      ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
      ctx.drawImage(bgLayer, 0, 0);
      ctx.drawImage(twLayer, 0, 0);

      // (d) 파티클: 60fps
      updateAndDrawParticlesFast(ctx, particles, LOGICAL_W, LOGICAL_H, now);

      // (e) 홀로그램 노이즈: 30fps 수준으로 토글
      noiseToggle = !noiseToggle;
      if (noiseToggle) {
        drawHologramNoise(ctx, LOGICAL_W, LOGICAL_H, now);
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
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

/* ========================= 유틸 / 타입 ========================= */

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

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
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
    maxLife: Math.random() * 200 + 100,
  };
}

/* ========================= 드로잉: 배경/노이즈 ========================= */

function drawEnhancedBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) {
  // 방사형 그라디언트 배경
  const bgGradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) / 2,
  );
  bgGradient.addColorStop(0, 'rgba(0, 10, 20, 0.8)');
  bgGradient.addColorStop(0.5, 'rgba(0, 5, 15, 0.6)');
  bgGradient.addColorStop(1, 'rgba(0, 0, 10, 0.4)');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // 움직이는 에너지 링 — 얇고 저비용
  for (let i = 0; i < 3; i++) {
    const ringRadius = 50 + i * 30 + Math.sin(time / 1000 + i) * 10;
    const ringAlpha = (Math.sin(time / 800 + i * 2) * 0.3 + 0.4) * 0.3;
    ctx.strokeStyle = `rgba(0, 150, 255, ${ringAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawHologramNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) {
  // 스캔라인
  const scanY = (Math.sin(time / 3000) * 0.5 + 0.5) * height;
  ctx.fillStyle = 'rgba(0, 255, 255, 0.08)';
  ctx.fillRect(0, scanY - 1, width, 2);

  // 랜덤 픽셀 소량 — 저비용
  for (let i = 0; i < 12; i++) {
    const x = (Math.random() * width) | 0;
    const y = (Math.random() * height) | 0;
    const a = Math.random() * 0.25;
    ctx.fillStyle = `rgba(0, 255, 255, ${a})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // 글리치 바(낮은 확률)
  if (Math.random() < 0.015) {
    const gy = Math.random() * height;
    const gh = 4 + Math.random() * 8;
    ctx.fillStyle = 'rgba(255, 0, 255, 0.08)';
    ctx.fillRect(0, gy, width, gh);
  }
}

/* ========================= 드로잉: 타워 본체 ========================= */

function drawCinematicTower(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  height: number,
  progress: number,
  time: number,
) {
  const towerBottom = height - 30;
  const towerTop = 40;
  const towerHeight = towerBottom - towerTop;
  const sections = 20; // 충분히 부드럽고 비용 적정

  for (let i = sections - 1; i >= 0; i--) {
    const sectionProgress = (i + 1) / sections;
    const isActive = progress >= sectionProgress;
    const isCurrent = Math.floor(progress * sections) === i;
    const isSpecial = (i + 1) % 3 === 0;
    const isBoss = (i + 1) % 6 === 0;
    const isFinal = i === sections - 1;

    const sectionY = towerBottom - (i / sections) * towerHeight;
    const heightRatio = i / sections;
    const linearScale = 1.0 - heightRatio * 0.8;
    const baseWidth = 180 * linearScale;

    const nextRatio = (i + 1) / sections;
    const nextScale = 1.0 - nextRatio * 0.8;
    const topWidth = i < sections - 1 ? 180 * nextScale : baseWidth * 0.8;
    const sectionHeight = (towerHeight / sections) * 0.9;

    // 색상/강도 선택 (가벼운 계산만)
    let primary: RGB, secondary: RGB, glow: number;
    if (isActive) {
      if (isFinal) {
        primary = [255, 215, 0];
        secondary = [255, 235, 100];
        glow = 1.0 * (Math.sin(time / 200) * 0.5 + 0.7);
      } else if (isBoss) {
        primary = [255, 100, 100];
        secondary = [255, 150, 150];
        glow = 0.9;
      } else if (isSpecial) {
        primary = [168, 85, 247];
        secondary = [200, 120, 255];
        glow = 0.7;
      } else if (isCurrent) {
        primary = [0, 255, 255];
        secondary = [100, 255, 255];
        glow = 0.8 * (Math.sin(time / 300) * 0.4 + 0.6);
      } else {
        primary = [0, 200, 255];
        secondary = [100, 220, 255];
        glow = 0.5;
      }
    } else {
      if (isFinal) {
        primary = [150, 130, 60];
        secondary = [170, 150, 80];
        glow = 0.4;
      } else {
        primary = [80, 100, 150];
        secondary = [100, 120, 170];
        glow = 0.3;
      }
    }

    drawTowerSection(
      ctx,
      centerX,
      sectionY,
      baseWidth,
      topWidth,
      sectionHeight,
      primary,
      secondary,
      glow,
      time,
      i,
      isActive,
    );

    if (isActive && i > 0) {
      drawDataLink(
        ctx,
        centerX,
        sectionY + sectionHeight,
        sectionY + sectionHeight + towerHeight / sections,
        primary,
        time,
        i,
      );
    }

    // 5개 섹션마다 라벨
    if (isActive && (i + 1) % 5 === 0) {
      const floorNumber = Math.floor(((i + 1) / sections) * 300);
      drawFloorLabel(ctx, centerX + baseWidth / 2 + 20, sectionY + sectionHeight / 2, floorNumber, primary, time);
    }
  }

  if (progress >= 1) {
    drawVictoryCrystal(ctx, centerX, towerTop - 15, time);
  }
}

type RGB = [number, number, number];

function drawTowerSection(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  baseWidth: number,
  topWidth: number,
  height: number,
  primary: RGB,
  secondary: RGB,
  glow: number,
  time: number,
  index: number,
  isActive: boolean,
) {
  const width = baseWidth;
  const skew = width * 0.08;

  // (1) 정면 메탈릭 레이어
  const metallic = ctx.createLinearGradient(
    centerX - width / 2,
    y,
    centerX + width / 2,
    y + height,
  );
  metallic.addColorStop(0, rgba(scaleRGB(secondary, 0.3), glow * 0.8));
  metallic.addColorStop(0.3, rgba(scaleRGB(primary, 0.6), glow * 0.4));
  metallic.addColorStop(0.7, rgba(scaleRGB(primary, 0.8), glow * 0.6));
  metallic.addColorStop(1, rgba(scaleRGB(secondary, 0.4), glow * 0.3));

  ctx.fillStyle = metallic;
  pathDiamond(ctx, centerX, y, width, topWidth, height);
  ctx.fill();

  // (2) 발광 오버레이
  const glowGrad = ctx.createRadialGradient(
    centerX,
    y + height / 2,
    0,
    centerX,
    y + height / 2,
    width / 2,
  );
  glowGrad.addColorStop(0, rgba(primary, glow * 0.35));
  glowGrad.addColorStop(0.6, rgba(primary, glow * 0.18));
  glowGrad.addColorStop(1, rgba(primary, 0));
  ctx.fillStyle = glowGrad;
  pathDiamond(ctx, centerX, y, width, topWidth, height);
  ctx.fill();

  // (3) 측면
  const side = ctx.createLinearGradient(
    centerX + width / 2,
    y + height,
    centerX + width / 2 + skew,
    y - skew,
  );
  side.addColorStop(0, rgba(scaleRGB(secondary, 0.4), glow * 0.6));
  side.addColorStop(0.5, rgba(scaleRGB(primary, 0.3), glow * 0.4));
  side.addColorStop(1, rgba(scaleRGB(secondary, 0.2), glow * 0.3));
  ctx.fillStyle = side;
  ctx.beginPath();
  ctx.moveTo(centerX + width / 2, y + height);
  ctx.lineTo(centerX + topWidth / 2, y);
  ctx.lineTo(centerX + topWidth / 2 + skew, y - skew);
  ctx.lineTo(centerX + width / 2 + skew, y + height - skew);
  ctx.closePath();
  ctx.fill();

  // (4) 윗면
  const top = ctx.createRadialGradient(
    centerX,
    y - skew / 2,
    0,
    centerX,
    y - skew / 2,
    topWidth / 2 + skew,
  );
  top.addColorStop(0, rgba(primary, glow * 0.7));
  top.addColorStop(0.7, rgba(scaleRGB(secondary, 0.8), glow * 0.45));
  top.addColorStop(1, rgba(scaleRGB(secondary, 0.4), glow * 0.25));
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.moveTo(centerX - topWidth / 2, y);
  ctx.lineTo(centerX - topWidth / 2 + skew, y - skew);
  ctx.lineTo(centerX + topWidth / 2 + skew, y - skew);
  ctx.lineTo(centerX + topWidth / 2, y);
  ctx.closePath();
  ctx.fill();

  // ── (5) 홀로그램 그리드 (C패치: 밀도 낮춤)
  ctx.strokeStyle = rgba(primary, glow * 0.4);
  ctx.lineWidth = 0.5;

  // 세로: 9 → 5
  for (let gridIndex = 0; gridIndex <= 4; gridIndex++) {
    const r = gridIndex / 4;
    const bottomX = centerX - width / 2 + r * width;
    const topX = centerX - topWidth / 2 + r * topWidth;
    ctx.beginPath();
    ctx.moveTo(topX, y);
    ctx.lineTo(bottomX, y + height);
    ctx.stroke();
  }

  // 가로: 5 → 3
  for (let gridIndex = 0; gridIndex <= 2; gridIndex++) {
    const r = gridIndex / 2;
    const gridY = y + r * height;
    const curW = topWidth + (width - topWidth) * r;
    ctx.beginPath();
    ctx.moveTo(centerX - curW / 2, gridY);
    ctx.lineTo(centerX + curW / 2, gridY);
    ctx.stroke();
  }

  // 강조 교차선 — 얇게 유지
  ctx.strokeStyle = rgba(primary, glow * 0.6);
  ctx.lineWidth = 1;
  // 중앙 수직
  ctx.beginPath();
  ctx.moveTo(centerX, y);
  ctx.lineTo(centerX, y + height);
  ctx.stroke();
  // 중앙 수평
  const midY = y + height / 2;
  const midW = topWidth + (width - topWidth) * 0.5;
  ctx.beginPath();
  ctx.moveTo(centerX - midW / 2, midY);
  ctx.lineTo(centerX + midW / 2, midY);
  ctx.stroke();

  // (6) 데이터 노드 (밀도 축소)
  if (isActive) {
    for (let vIndex = 1; vIndex <= 7; vIndex += 3) {
      for (let hIndex = 1; hIndex <= 3; hIndex += 2) {
        const vR = vIndex / 8;
        const hR = hIndex / 4;
        const curW = topWidth + (width - topWidth) * hR;
        const nodeX = centerX - curW / 2 + vR * curW;
        const nodeY = y + hR * height;
        const nodeA = (Math.sin(time / 220 + vIndex + hIndex) * 0.3 + 0.7) * glow;
        ctx.fillStyle = rgba(primary, nodeA);
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/** 다이아몬드(정면) 패스 */
function pathDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  w: number,
  tw: number,
  h: number,
) {
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, y + h);
  ctx.lineTo(cx - tw / 2, y);
  ctx.lineTo(cx + tw / 2, y);
  ctx.lineTo(cx + w / 2, y + h);
  ctx.closePath();
}

function rgba(rgb: RGB, a: number) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
}
function scaleRGB([r, g, b]: RGB, s: number): RGB {
  return [r * s, g * s, b * s];
}

/* ========================= 기타 요소 ========================= */

function drawDataLink(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  startY: number,
  endY: number,
  color: RGB,
  time: number,
  index: number,
) {
  const flow = (time / 1000 + index) % 1;
  const linkY = startY + (endY - startY) * flow;

  ctx.strokeStyle = rgba(color, 0.6);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, startY);
  ctx.lineTo(centerX, endY);
  ctx.stroke();

  ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(time / 200 + index) * 0.5 + 0.5})`;
  ctx.beginPath();
  ctx.arc(centerX, linkY, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawFloorLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  floorNumber: number,
  color: RGB,
  time: number,
) {
  const pulse = Math.sin(time / 800) * 0.3 + 0.7;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(x - 15, y - 8, 30, 16);
  ctx.strokeStyle = rgba(color, pulse);
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 15, y - 8, 30, 16);
  ctx.fillStyle = rgba(color, pulse);
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(floorNumber.toString(), x, y + 3);
}

function drawVictoryCrystal(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  time: number,
) {
  const pulse = Math.sin(time / 500) * 0.4 + 0.6;
  const size = 16 + pulse * 4;

  ctx.fillStyle = `rgba(255, 215, 0, ${0.8 + pulse * 0.2})`;
  // shadowBlur는 2D에서 고가 — 사용하지 않음(시각적 차이 적음)
  ctx.beginPath();
  ctx.arc(centerX, y, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + pulse * 0.2})`;
  ctx.beginPath();
  ctx.arc(centerX - 2, y - 2, size / 4, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8 + time / 1200;
    const beamLength = 25 + Math.sin(time / 700 + i) * 8;
    const bx = centerX + Math.cos(angle) * beamLength;
    const by = y + Math.sin(angle) * beamLength;
    ctx.strokeStyle = `rgba(255, 215, 0, ${Math.sin(time / 500 + i) * 0.4 + 0.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, y);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
}

function drawTowerAura(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  height: number,
  progress: number,
  time: number,
) {
  const auraIntensity = Math.sin(time / 500) * 0.3 + 0.7;
  const auraRadius = 120 + progress * 50;

  const outer = ctx.createRadialGradient(
    centerX,
    height - 30,
    0,
    centerX,
    height - 30,
    auraRadius,
  );
  outer.addColorStop(0, `rgba(0, 255, 255, ${auraIntensity * 0.2})`);
  outer.addColorStop(0.7, `rgba(0, 150, 255, ${auraIntensity * 0.1})`);
  outer.addColorStop(1, 'rgba(0, 100, 200, 0)');
  ctx.fillStyle = outer;
  ctx.fillRect(0, 0, centerX * 2, height);

  const inner = ctx.createRadialGradient(
    centerX,
    height - 30,
    0,
    centerX,
    height - 30,
    auraRadius * 0.6,
  );
  inner.addColorStop(0, `rgba(255, 255, 255, ${auraIntensity * 0.1})`);
  inner.addColorStop(0.5, `rgba(0, 255, 255, ${auraIntensity * 0.15})`);
  inner.addColorStop(1, 'rgba(0, 200, 255, 0)');
  ctx.fillStyle = inner;
  ctx.fillRect(0, 0, centerX * 2, height);
}

/* ========================= 파티클 (스프라이트) ========================= */

function makeParticleSprite(size = 24) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const r = size / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, 'rgba(0,255,255,0.9)');
  grad.addColorStop(0.6, 'rgba(0,255,255,0.4)');
  grad.addColorStop(1, 'rgba(0,255,255,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(r, r, r, 0, Math.PI * 2);
  g.fill();
  return c;
}

function updateAndDrawParticlesFast(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  width: number,
  height: number,
  time: number,
) {
  // 정적 캐시 — 1회 생성
  (updateAndDrawParticlesFast as any)._sprite ||= makeParticleSprite(24);
  const sprite: HTMLCanvasElement = (updateAndDrawParticlesFast as any)._sprite;

  const cx = width / 2;
  const cy = height - 30;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    // 이동/수명
    p.x += p.vx;
    p.y += p.vy;
    p.life++;

    // 타워 중심으로 약한 인력
    const dx = cx - p.x;
    const dy = cy - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 100) {
      const pull = (100 - dist) * 0.0002;
      p.vx += dx * pull;
      p.vy += dy * pull;
    }

    // 재생성
    if (
      p.x < 0 ||
      p.x > width ||
      p.y < 0 ||
      p.y > height ||
      p.life > p.maxLife
    ) {
      Object.assign(p, createParticle(width, height));
    }

    // 렌더: 스프라이트 drawImage (shadowBlur 제거)
    const lifeRatio = 1 - p.life / p.maxLife;
    const alpha = p.alpha * lifeRatio;
    const pulse = 1 + Math.sin(time / 300 + i) * 0.3;
    const size = p.size * 2.0 * pulse;

    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
  }
  ctx.globalAlpha = 1;
}

// 선택적으로 default export도 제공(프로젝트 취향에 맞게)
export default CinematicHologramTower;
