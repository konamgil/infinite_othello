// src/ui/game/OthelloStarCanvas.tsx
import React, { useEffect, useRef } from "react";

type DiscColor = "white" | "black";
interface Disc { x: number; y: number; color: DiscColor; }

interface OthelloStarCanvasProps {
  width?: number;
  height?: number;
  className?: string;

  boardScale?: number;          // 기본 1.0 (상단 폭 기준)
  perspectiveSkew?: number;     // 하단으로 갈수록 좌/우로 벌어지는 정도(px, 기본 2)
  safeMargin?: number;          // 바깥 여백(px)
  safeBottom?: number;          // 하단 탭 높이(px)
  fpsCap?: 0 | 30 | 45;         // 0=무제한

  discs?: Disc[];               // 없으면 중앙 4개 기본
}

interface Star {
  x: number; y: number; size: number;
  brightness: number; twinkleSpeed: number; phase: number;
}
interface LightRay {
  fromStar: Star; targetX: number; targetY: number;
  intensity: number; phase: number; color: string;
}

const DEFAULT_DISCS: Disc[] = [
  { x: 3, y: 3, color: "black" },
  { x: 4, y: 4, color: "black" },
  { x: 3, y: 4, color: "white" },
  { x: 4, y: 3, color: "white" },
];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** 보드 사다리꼴 코너 */
type Pt = { x: number; y: number };
/**
 * Linearly interpolates between two points.
 * @private
 */
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/**
 * Performs bilinear interpolation within a quadrilateral defined by four points.
 * This is used to map a 2D coordinate (u, v) from a unit square to a point within the trapezoidal board.
 * @private
 */
function quadLerp(TL: Pt, TR: Pt, BR: Pt, BL: Pt, u: number, v: number): Pt {
  const top = lerp(TL, TR, u);
  const bot = lerp(BL, BR, u);
  return lerp(top, bot, v);
}

/**
 * A React component that renders a stylized, animated 3D-perspective Othello board on a canvas.
 *
 * This component creates a visually rich scene of an Othello board floating in space.
 * It includes:
 * - A starfield background with twinkling stars and light rays.
 * - A game board rendered with a trapezoidal perspective effect.
 * - Styled game discs with lighting and shadow effects.
 *
 * The component is highly configurable, allowing for adjustments to scale, perspective,
 * and performance (via an FPS cap).
 *
 * @param {OthelloStarCanvasProps} props - The component props.
 * @returns {React.ReactElement} The rendered canvas element.
 */
const OthelloStarCanvas: React.FC<OthelloStarCanvasProps> = ({
  width = 390,
  height = 300,
  className = "",

  boardScale = 1.0,
  perspectiveSkew = 2,
  safeMargin = 8,
  safeBottom = 0,
  fpsCap = 0,

  discs = DEFAULT_DISCS,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const starsRef = useRef<Star[]>([]);
  const raysRef = useRef<LightRay[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Hi-DPI
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // ── 보드 크기/배치 계산 (상단 폭 기준) ──────────────────────────
    const TOP_W = 200 * boardScale;          // 윗변 길이
    const H = 120 * boardScale;              // 보드 높이(세로)
    const maxW = Math.max(10, width - safeMargin * 2);
    const maxH = Math.max(10, height - safeMargin * 2 - safeBottom);
    let topW = Math.min(TOP_W, maxW);
    let bh = Math.min(H, maxH);

    const cx = width * 0.5;
    const cy = height * 0.75;
    let topX = cx - topW / 2;
    let topY = cy - bh / 2;

    // 하단 변의 좌/우 벌어짐(총 8칸, 한 칸당 skew → 양 끝은 ±4*skew)
    const bottomOffset = 4 * perspectiveSkew;
    const TL: Pt = { x: topX,            y: topY };
    const TR: Pt = { x: topX + topW,     y: topY };
    const BL: Pt = { x: topX - bottomOffset,     y: topY + bh };
    const BR: Pt = { x: topX + topW + bottomOffset, y: topY + bh };

    // 화면 밖이면 위로/안으로 보정(간단 클램프: 중심만 조정)
    const minX = safeMargin, maxXr = width - safeMargin;
    const minY = safeMargin, maxYb = height - safeMargin - safeBottom;
    const totalLeft = Math.min(TL.x, BL.x), totalRight = Math.max(TR.x, BR.x);
    const totalTop = TL.y, totalBottom = BL.y; // 상/하는 수평
    let dx = 0, dy = 0;
    if (totalLeft < minX)  dx = minX - totalLeft;
    if (totalRight > maxXr) dx = Math.min(dx, maxXr - totalRight);
    if (totalBottom > maxYb) dy = maxYb - totalBottom;
    if (totalTop < minY)     dy = Math.max(dy, minY - totalTop);

    TL.x += dx; TR.x += dx; BL.x += dx; BR.x += dx;
    TL.y += dy; TR.y += dy; BL.y += dy; BR.y += dy;

    // 보드 셀 크기(보드 좌표 기준)
    const uStep = 1 / 8;
    const vStep = 1 / 8;

    // 보드 좌표→픽셀 좌표(셀 중심)
    const toPx = (bx: number, by: number): Pt => {
      const u = (bx + 0.5) * uStep;
      const v = (by + 0.5) * vStep;
      return quadLerp(TL, TR, BR, BL, u, v);
    };

    // ── 별/광선 초기화 ─────────────────────────────────────────────
    const NUM_STARS = 35;
    starsRef.current = Array.from({ length: NUM_STARS }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.6,
      size: Math.random() * 3 + 1,
      brightness: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.03 + 0.01,
      phase: Math.random() * Math.PI * 2,
    }));

    // 레이: 각 디스크 중심 + 셀 방향으로 약간의 난수 지터(셀 안에서만)
    raysRef.current = [];
    const jitterFromCell = (bx: number, by: number) => {
      const u = (bx + 0.5) * uStep, v = (by + 0.5) * vStep;
      const p = quadLerp(TL, TR, BR, BL, u, v);
      const pu = quadLerp(TL, TR, BR, BL, u + uStep, v);
      const pv = quadLerp(TL, TR, BR, BL, u, v + vStep);
      const du = { x: pu.x - p.x, y: pu.y - p.y };
      const dv = { x: pv.x - p.x, y: pv.y - p.y };
      const a = (Math.random() - 0.5) * 0.5; // 셀 가로 0.5배 이내
      const b = (Math.random() - 0.5) * 0.3; // 셀 세로 0.3배 이내
      return { x: p.x + du.x * a + dv.x * b, y: p.y + du.y * a + dv.y * b };
    };
    starsRef.current.slice(0, 12).forEach((star, i) => {
      const d = discs[i % discs.length];
      const j = jitterFromCell(d.x, d.y);
      raysRef.current.push({
        fromStar: star,
        targetX: j.x,
        targetY: j.y,
        intensity: Math.random() * 0.6 + 0.3,
        phase: Math.random() * Math.PI * 2,
        color: i % 3 === 0 ? "#FFD700" : i % 3 === 1 ? "#FFFFFF" : "#87CEEB",
      });
    });

    // ── 루프 ────────────────────────────────────────────────────────
    const start = performance.now();
    let last = start;
    const interval = fpsCap ? 1000 / fpsCap : 0;

    const animate = (ts: number) => {
      if (interval && ts - last < interval) { rafRef.current = requestAnimationFrame(animate); return; }
      last = ts;
      const t = (ts - start) / 1000;

      // 배경
      ctx.fillStyle = "rgba(0,0,3,0.95)";
      ctx.fillRect(0, 0, width, height);
      const bg = ctx.createRadialGradient(width / 2, height / 3, 0, width / 2, height / 3, height);
      bg.addColorStop(0, "rgba(139,92,246,0.08)");
      bg.addColorStop(0.5, "rgba(0,0,3,0.3)");
      bg.addColorStop(1, "rgba(0,0,3,1)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);

      // 광선
      ctx.globalCompositeOperation = "lighter";
      raysRef.current.forEach((ray, i) => {
        const shimmer = Math.sin(t * ray.fromStar.twinkleSpeed * 8 + ray.phase) * 0.3 + 0.7;
        const sway = Math.sin(t * 0.5 + i) * 5;
        const alpha = ray.intensity * shimmer * 0.4;
        const rgb = ray.color === "#FFD700" ? "255,215,0" : ray.color === "#FFFFFF" ? "255,255,255" : "135,206,235";
        ctx.strokeStyle = `rgba(${rgb},${alpha})`;
        ctx.lineWidth = 2; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(ray.fromStar.x, ray.fromStar.y); ctx.lineTo(ray.targetX + sway, ray.targetY); ctx.stroke();
        ctx.strokeStyle = `rgba(${rgb},${alpha * 0.3})`; ctx.lineWidth = 6; ctx.stroke();
      });

      // 별
      starsRef.current.forEach((s, idx) => {
        s.phase += s.twinkleSpeed;
        const tw = Math.sin(s.phase) * 0.4 + 0.6;
        const size = s.size * (1 + Math.sin(t + idx) * 0.2);
        ctx.fillStyle = `rgba(255,255,255,${s.brightness * tw})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, size, 0, Math.PI * 2); ctx.fill();
        if (s.size > 2) {
          const cs = size * 3;
          ctx.strokeStyle = `rgba(255,255,255,${s.brightness * tw * 0.6})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(s.x - cs, s.y); ctx.lineTo(s.x + cs, s.y);
          ctx.moveTo(s.x, s.y - cs); ctx.lineTo(s.x, s.y + cs); ctx.stroke();
        }
      });

      // ── 보드 배경: 사다리꼴(선과 배경 완전 일치) ─────────────────
      ctx.globalCompositeOperation = "source-over";

      // 외곽 그림자
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.moveTo(TL.x - 6, TL.y + 4);
      ctx.lineTo(TR.x + 6, TR.y + 4);
      ctx.lineTo(BR.x + 6, BR.y + 8);
      ctx.lineTo(BL.x - 6, BL.y + 8);
      ctx.closePath();
      ctx.fill();

      // 본체(녹색)
      ctx.fillStyle = "rgba(20,40,20,0.88)";
      ctx.beginPath();
      ctx.moveTo(TL.x, TL.y);
      ctx.lineTo(TR.x, TR.y);
      ctx.lineTo(BR.x, BR.y);
      ctx.lineTo(BL.x, BL.y);
      ctx.closePath();
      ctx.fill();

      // 상하 하이라이트 그라데이션(클립 내 채우기)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(TL.x, TL.y); ctx.lineTo(TR.x, TR.y); ctx.lineTo(BR.x, BR.y); ctx.lineTo(BL.x, BL.y); ctx.closePath();
      ctx.clip();
      const edge = ctx.createLinearGradient(TL.x, TL.y, TL.x, BL.y);
      edge.addColorStop(0, "rgba(255,255,255,0.08)");
      edge.addColorStop(0.5, "rgba(255,255,255,0)");
      edge.addColorStop(1, "rgba(0,0,0,0.15)");
      ctx.fillStyle = edge;
      ctx.fillRect(Math.min(TL.x, BL.x), TL.y, Math.max(TR.x, BR.x) - Math.min(TL.x, BL.x), BL.y - TL.y);
      ctx.restore();

      // 테두리 라인(배경과 정확히 겹침)
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(TL.x + 0.5, TL.y + 0.5);
      ctx.lineTo(TR.x - 0.5, TR.y + 0.5);
      ctx.lineTo(BR.x - 0.5, BR.y - 0.5);
      ctx.lineTo(BL.x + 0.5, BL.y - 0.5);
      ctx.closePath();
      ctx.stroke();

      // ── 그리드(사다리꼴 좌표계로 정확히) ─────────────────────────
      ctx.strokeStyle = "rgba(120,180,120,0.75)";
      ctx.lineWidth = 1;

      // 세로 u 고정
      for (let i = 0; i <= 8; i++) {
        const u = i * uStep;
        const a = quadLerp(TL, TR, BR, BL, u, 0);
        const b = quadLerp(TL, TR, BR, BL, u, 1);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      // 가로 v 고정
      for (let j = 0; j <= 8; j++) {
        const v = j * vStep;
        const a = quadLerp(TL, TR, BR, BL, 0, v);
        const b = quadLerp(TL, TR, BR, BL, 1, v);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }

      // 중앙 십자선 조금 두껍게
      ctx.lineWidth = 1.6;
      let a = quadLerp(TL, TR, BR, BL, 0.5, 0); let b = quadLerp(TL, TR, BR, BL, 0.5, 1);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      a = quadLerp(TL, TR, BR, BL, 0, 0.5); b = quadLerp(TL, TR, BR, BL, 1, 0.5);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.lineWidth = 1;

      // ── 디스크(셀 중심을 사다리꼴 매핑으로) ──────────────────────
      discs.forEach((d, idx) => {
        const light = Math.sin(t * 2 + idx) * 0.2 + 0.8;
        const { x: cx2, y: cy2 } = toPx(d.x, d.y);

        // 셀 대각선 길이 기준 반지름 추정(퍼스펙티브 보정)
        const p = toPx(d.x, d.y);
        const pu = toPx(d.x + 1, d.y); // 오른쪽 셀 중심 (근사)
        const pv = toPx(d.x, d.y + 1);
        const du = Math.hypot(pu.x - p.x, pu.y - p.y);
        const dv = Math.hypot(pv.x - p.x, pv.y - p.y);
        const r = Math.max(6, Math.min(14, 0.28 * Math.min(du, dv))); // 화면 크기에 따라 자연스러운 크기

        // 그림자
        ctx.fillStyle = "rgba(0,0,0,0.32)";
        ctx.beginPath(); ctx.ellipse(cx2 + 2, cy2 + 4, r, r / 2, 0, 0, Math.PI * 2); ctx.fill();

        // 본체
        const g = ctx.createRadialGradient(cx2 - 5, cy2 - 5, 0, cx2, cy2, r);
        if (d.color === "white") {
          g.addColorStop(0, `rgba(255,255,255,${light})`);
          g.addColorStop(0.7, `rgba(220,220,220,${light * 0.9})`);
          g.addColorStop(1, `rgba(180,180,180,${light * 0.8})`);
        } else {
          g.addColorStop(0, `rgba(80,80,80,${light})`);
          g.addColorStop(0.7, `rgba(40,40,40,${light * 0.9})`);
          g.addColorStop(1, `rgba(10,10,10,${light * 0.8})`);
        }
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = d.color === "white" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.25)";
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI * 2); ctx.stroke();

        ctx.fillStyle = `rgba(255,255,255,${light * 0.4})`;
        ctx.beginPath(); ctx.arc(cx2 - r * 0.3, cy2 - r * 0.3, r * 0.2, 0, Math.PI * 2); ctx.fill();
      });

      // 보드 주변 파티클(은은)
      ctx.globalCompositeOperation = "lighter";
      const center = quadLerp(TL, TR, BR, BL, 0.5, 0.5);
      for (let i = 0; i < 12; i++) {
        const px = center.x + Math.sin(t + i) * 40 + i;
        const py = center.y + Math.cos(t * 1.5 + i) * 18;
        const a2 = Math.sin(t * 3 + i) * 0.3 + 0.2;
        ctx.fillStyle = `rgba(255,215,0,${a2})`;
        ctx.beginPath(); ctx.arc(px, py, 1, 0, Math.PI * 2); ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [width, height, boardScale, perspectiveSkew, safeMargin, safeBottom, fpsCap, discs]);

  return <canvas ref={canvasRef} className={className} />;
};

export default OthelloStarCanvas;
export { OthelloStarCanvas };
