// components/GameBoard.tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTheme } from '../../store/gameStore';
import { haptic } from '../feedback/HapticFeedback';


export interface BoardState {
  // board[y][x], 1=black, -1=white, 0=empty
  board: number[][];
  currentPlayer: 'black' | 'white';
  validMoves: Array<{ x: number; y: number }>;
}

interface AnimatingDisc {
  x: number;
  y: number;
  startTime: number;
}

interface GameBoardProps {
  boardState: BoardState;
  onCellClick?: (x: number, y: number) => void;
  flippedDiscs?: Array<{ x: number; y: number }>;
  showValidMoves?: boolean;
  disabled?: boolean;
  lastMove?: { x: number; y: number } | null;
}

const ANIMATION_DURATION = 400; // ms

function setupHiDPICanvas(canvas: HTMLCanvasElement, logicalSize: number): CanvasRenderingContext2D {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  canvas.style.width = `${logicalSize}px`;
  canvas.style.height = `${logicalSize}px`;
  canvas.width = Math.round(logicalSize * dpr);
  canvas.height = Math.round(logicalSize * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/* 색 변환 유틸 */
function discToColor(d: number): 'black' | 'white' {
  return d === 1 ? 'black' : 'white';
}
function oppositeColor(c: 'black' | 'white'): 'white' | 'black' {
  return c === 'black' ? 'white' : 'black';
}

/** 마지막 착수자의 색을 보드 상태로부터 “확정적으로” 산출 */
function getLastMoverColor(
  boardState: BoardState,
  lastMove: { x: number; y: number } | null,
  flippedDiscs: Array<{ x: number; y: number }>
): 'black' | 'white' {
  // 1) lastMove 칸의 현재 보드 색 = 마지막 착수자 색
  if (lastMove) {
    const v = boardState.board[lastMove.y]?.[lastMove.x] ?? 0;
    if (v === 1 || v === -1) return discToColor(v);
  }
  // 2) 뒤집힌 디스크 중 하나의 "현재 보드 색" = 마지막 착수자 색
  if (flippedDiscs.length > 0) {
    const any = flippedDiscs[0];
    const v = boardState.board[any.y]?.[any.x] ?? 0;
    if (v === 1 || v === -1) return discToColor(v);
  }
  // 3) 최후 수단: 지금 둘 사람과 반대가 마지막 착수자
  return oppositeColor(boardState.currentPlayer);
}

export function GameBoard({
  boardState,
  onCellClick,
  flippedDiscs = [],
  showValidMoves = true,
  disabled = false,
  lastMove = null,
}: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastFlipScheduledAtRef = useRef(0); // 플리커 방지용 타임스탬프
  const theme = useTheme();

  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [animatingDiscs, setAnimatingDiscs] = useState<AnimatingDisc[]>([]);
  const [pressedCell, setPressedCell] = useState<{ x: number; y: number } | null>(null);

  // 새 뒤집힘 입력 → 애니메이션 시작 (페인트 전 보장)
  useLayoutEffect(() => {
    if (flippedDiscs.length > 0) {
      try { haptic.discFlip?.(); } catch {}
      const now = performance.now();
      lastFlipScheduledAtRef.current = now;
      setAnimatingDiscs(flippedDiscs.map(d => ({ ...d, startTime: now })));
    }
  }, [flippedDiscs]);

  // 캔버스 렌더 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const boardSize = canvas.getBoundingClientRect().width;
    if (boardSize === 0) return;
    const cellSize = boardSize / 8;
    const ctx = setupHiDPICanvas(canvas, boardSize);

    // 진행 중인 애니메이션 판별
    const now = performance.now();
    const still = animatingDiscs.filter(d => now - d.startTime < ANIMATION_DURATION);
    const active = still.length > 0;

    // 보드 그리기
    drawBoard(
      ctx,
      boardState,
      theme,
      hoveredCell,
      showValidMoves,
      animatingDiscs, // 현재 틱의 전체 목록 (셀 내부에서 progress 계산)
      boardSize,
      cellSize,
      lastMove,
      pressedCell,
      flippedDiscs,
      lastFlipScheduledAtRef.current
    );

    // 다음 프레임 스케줄링 (진행 중일 때만)
    if (active) {
      animationFrameRef.current = requestAnimationFrame(() => {
        // 동일 배열 재할당(아이덴티티 변경)로 리렌더 트리거
        setAnimatingDiscs(prev => [...prev]);
      });
    } else if (animatingDiscs.length > 0) {
      // 모든 애니메이션 종료 → 목록 비우기
      setAnimatingDiscs([]);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    boardState,
    theme,
    hoveredCell,
    animatingDiscs,
    flippedDiscs,
    lastMove,      // 의존성 보강
    pressedCell    // 의존성 보강
  ]);

  const getGridCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const boardSize = rect.width;
    const cellSize = boardSize / 8;
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    const x = Math.floor(canvasX / cellSize);
    const y = Math.floor(canvasY / cellSize);
    return (x >= 0 && x < 8 && y >= 0 && y < 8) ? { x, y } : null;
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (disabled) return;
    setHoveredCell(getGridCoordinates(event.clientX, event.clientY));
  };
  const handleMouseLeave = () => setHoveredCell(null);

  const placeIfValid = (x: number, y: number) => {
    if (!onCellClick) return;
    const isValidMove = boardState.validMoves.some(m => m.x === x && m.y === y);
    if (isValidMove) {
      try { haptic.discPlace?.(); } catch {}
      onCellClick(x, y);
    } else {
      try { haptic.invalidMove?.(); } catch {}
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    const c = getGridCoordinates(e.clientX, e.clientY);
    if (c) placeIfValid(c.x, c.y);
  };

  // 터치 이벤트
  const handleTouchStart = (event: React.TouchEvent) => {
    if (disabled) return;
    event.preventDefault();
    const t = event.touches[0];
    const c = getGridCoordinates(t.clientX, t.clientY);
    if (c) {
      const isValidMove = boardState.validMoves.some(m => m.x === c.x && m.y === c.y);
      if (isValidMove) {
        setPressedCell(c);
        haptic.lightTap();
      }
    }
  };
  const handleTouchEnd = (event: React.TouchEvent) => {
    if (disabled) return;
    event.preventDefault();
    const t = event.changedTouches[0];
    const c = getGridCoordinates(t.clientX, t.clientY);
    if (c && pressedCell && c.x === pressedCell.x && c.y === pressedCell.y) {
      placeIfValid(c.x, c.y);
    }
    setPressedCell(null);
  };
  const handleTouchCancel = () => setPressedCell(null);

  return (
    <div className="relative w-full aspect-square touch-manipulation">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-2xl shadow-2xl cursor-pointer
                   ring-1 ring-emerald-400/20 hover:ring-emerald-400/40
                   transition-all duration-300 bg-black/10 backdrop-blur-md
                   shadow-emerald-500/10"
        style={{ touchAction: 'none' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      />
      {showValidMoves && (
        <div className="absolute inset-0 pointer-events-none">
          {boardState.validMoves.map((move, index) => {
            const boardSize = canvasRef.current?.getBoundingClientRect().width || 0;
            if (boardSize === 0) return null;
            const cellSize = boardSize / 8;
            return (
              <div
                key={`${move.x}-${move.y}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-orange-400/80 rounded-full animate-pulse shadow-lg"
                style={{
                  left: (move.x * cellSize) + (cellSize / 2),
                  top: (move.y * cellSize) + (cellSize / 2),
                  animationDelay: `${index * 150}ms`,
                  animationDuration: '2s'
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  boardState: BoardState,
  theme: any,
  hoveredCell: { x: number; y: number } | null,
  showValidMoves: boolean,
  animatingDiscs: AnimatingDisc[],
  boardSize: number,
  cellSize: number,
  lastMove: { x: number; y: number } | null,
  pressedCell: { x: number; y: number } | null,
  flippedDiscs: Array<{ x: number; y: number }>,
  lastFlipScheduledAt: number
) {
  ctx.clearRect(0, 0, boardSize, boardSize);
  drawBoardBackground(ctx, theme, boardSize, cellSize);
  drawGrid(ctx, boardSize, cellSize);

  // 마지막 착수자 색 계산(확정)
  const lastMoverColor = getLastMoverColor(boardState, lastMove, flippedDiscs);
  const toColor = lastMoverColor;
  const fromColor = oppositeColor(lastMoverColor);

  const animMap = new Map(animatingDiscs.map(d => [`${d.x}-${d.y}`, d]));
  const flippedSet = new Set(flippedDiscs.map(d => `${d.x}-${d.y}`));

  // 등록 직후 첫 페인트에서 fromColor 강제 (레이아웃 타이밍 비껴가도 플리커 방지)
  const nowForForce = performance.now();
  const forceFromColor =
    animatingDiscs.length === 0 &&
    flippedDiscs.length > 0 &&
    (nowForForce - lastFlipScheduledAt) < 48; // 한 프레임 여유 버퍼

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const a = animMap.get(`${x}-${y}`);
      const v = boardState.board[y][x];

      if (a) {
        const now = performance.now();
        const elapsed = now - a.startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        // 뒤집힌 돌: fromColor(이전) → toColor(마지막 착수자)
        drawDisc(ctx, x, y, fromColor, theme, cellSize, progress, toColor);
      } else if (forceFromColor && flippedSet.has(`${x}-${y}`)) {
        // 애니메이션 등록과 보드 반영 사이 첫 페인트에서 옛 색 강제 표시
        drawDisc(ctx, x, y, fromColor, theme, cellSize);
      } else if (v !== 0) {
        // 정적 렌더: 보드 값 그대로
        drawDisc(ctx, x, y, discToColor(v), theme, cellSize);
      }
    }
  }

  // 호버/프레스 프리뷰
  if (hoveredCell && showValidMoves) {
    const ok = boardState.validMoves.some(m => m.x === hoveredCell.x && m.y === hoveredCell.y);
    if (ok) drawHoverEffect(ctx, hoveredCell.x, hoveredCell.y, cellSize, boardState.currentPlayer);
  }
  if (pressedCell && showValidMoves) {
    const ok = boardState.validMoves.some(m => m.x === pressedCell.x && m.y === pressedCell.y);
    if (ok) drawPressEffect(ctx, pressedCell.x, pressedCell.y, cellSize, boardState.currentPlayer);
  }

  if (lastMove) drawLastMoveIndicator(ctx, lastMove.x, lastMove.y, cellSize);
  drawCornerMarkers(ctx, cellSize);
}

function drawDisc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: 'black' | 'white',
  theme: any,
  cellSize: number,
  animationProgress: number | null = null,
  toColor?: 'black' | 'white'
) {
  const centerX = x * cellSize + cellSize / 2;
  const centerY = y * cellSize + cellSize / 2;
  const radius = cellSize * 0.4;

  ctx.save();

  if (animationProgress !== null && toColor) {
    // 부드러운 플립
    const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
    const eased = easeInOutQuad(animationProgress);
    const scaleY = Math.cos(eased * Math.PI);
    const currentColor = eased < 0.5 ? color : toColor;

    ctx.translate(centerX, centerY);
    ctx.scale(1, Math.max(0.2, Math.abs(scaleY))); // 완전 사라짐 방지
    ctx.translate(-centerX, -centerY);

    drawClassicDisc(ctx, centerX, centerY, radius, currentColor);
  } else {
    drawClassicDisc(ctx, centerX, centerY, radius, color);
  }

  ctx.restore();
}

/* --- 보드/디스크 데코 --- */

function drawBoardBackground(ctx: CanvasRenderingContext2D, theme: any, boardSize: number, cellSize: number) {
  const g = ctx.createLinearGradient(0, 0, boardSize, boardSize);
  g.addColorStop(0, '#064e3b');
  g.addColorStop(0.3, '#065f46');
  g.addColorStop(0.7, '#047857');
  g.addColorStop(1, '#059669');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, boardSize, boardSize);

  ctx.fillStyle = 'rgba(6, 78, 59, 0.1)';
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 2 === 0) ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
    }
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, boardSize: number, cellSize: number) {
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
  ctx.lineWidth = 0.8;
  ctx.shadowColor = 'rgba(16, 185, 129, 0.15)';
  ctx.shadowBlur = 1;

  for (let i = 1; i < 8; i++) {
    const p = i * cellSize;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, boardSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(boardSize, p); ctx.stroke();
  }

  ctx.shadowBlur = 2;
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, 0, boardSize, boardSize);
  ctx.shadowBlur = 0;
}

function drawClassicDisc(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: 'black' | 'white') {
  ctx.save();

  // 보드 그림자
  ctx.beginPath();
  ctx.arc(x, y + 1, radius + 1, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fill();

  // 디스크 본체
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color === 'black' ? '#1a1a1a' : '#f8f9fa';
  ctx.fill();

  // 미묘한 테두리
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color === 'black' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.restore();
}

function drawHoverEffect(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number, currentPlayer: 'black' | 'white') {
  const cx = x * cellSize + cellSize / 2;
  const cy = y * cellSize + cellSize / 2;
  const r = cellSize * 0.35;

  ctx.fillStyle = 'rgba(252, 211, 77, 0.15)';
  ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = currentPlayer === 'black' ? 'rgba(31,41,55,0.8)' : 'rgba(248,250,252,0.8)';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}

function drawPressEffect(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number, currentPlayer: 'black' | 'white') {
  const cx = x * cellSize + cellSize / 2;
  const cy = y * cellSize + cellSize / 2;
  const r = cellSize * 0.38;
  ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
  ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = currentPlayer === 'black' ? 'rgba(26,26,26,0.9)' : 'rgba(248,249,250,0.9)';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
  ctx.lineWidth = 3; ctx.shadowColor = 'rgba(34,197,94,0.4)'; ctx.shadowBlur = 8; ctx.stroke();
  ctx.restore();
}

function drawLastMoveIndicator(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number) {
  const cx = x * cellSize + cellSize / 2;
  const cy = y * cellSize + cellSize / 2;
  const r = cellSize * 0.45;

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

function drawCornerMarkers(ctx: CanvasRenderingContext2D, cellSize: number) {
  const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
  ctx.strokeStyle = 'rgba(252, 211, 77, 0.6)';
  ctx.lineWidth = 2;
  corners.forEach(([x, y]) => {
    const cellX = x * cellSize;
    const cellY = y * cellSize;
    const s = cellSize * 0.15;
    const cx = cellX + cellSize / 2;
    const cy = cellY + cellSize / 2;
    ctx.beginPath();
    ctx.moveTo(cx - s, cy + s * 0.5);
    ctx.lineTo(cx + s, cy + s * 0.5);
    ctx.lineTo(cx + s * 0.7, cy - s * 0.5);
    ctx.lineTo(cx + s * 0.3, cy);
    ctx.lineTo(cx, cy - s * 0.8);
    ctx.lineTo(cx - s * 0.3, cy);
    ctx.lineTo(cx - s * 0.7, cy - s * 0.5);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(252, 211, 77, 0.2)';
    ctx.fill();
  });
}
