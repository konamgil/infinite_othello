import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../store/gameStore';
import { haptic } from '../feedback/HapticFeedback';

// 햅틱 피드백을 위한 유틸리티 (누락된 함수들 추가)
if (!haptic.lightTap) {
  haptic.lightTap = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // 50ms 가벼운 진동
    }
  };
}

export interface BoardState {
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
  flippedDiscs?: Array<{x: number, y: number}>;
  showValidMoves?: boolean;
  disabled?: boolean;
  lastMove?: { x: number; y: number } | null;
}

const ANIMATION_DURATION = 400; // 400ms for a smooth flip

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
  const theme = useTheme();

  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [animatingDiscs, setAnimatingDiscs] = useState<AnimatingDisc[]>([]);
  const [prevBoard, setPrevBoard] = useState<number[][] | null>(null);
  const [pressedCell, setPressedCell] = useState<{ x: number; y: number } | null>(null);

  const prevBoardRef = useRef<number[][]>();
  useEffect(() => {
    prevBoardRef.current = boardState.board;
  });
  const previousBoard = prevBoardRef.current;

  useEffect(() => {
    if (flippedDiscs.length > 0) {
      haptic.discFlip();
      setAnimatingDiscs(flippedDiscs.map(d => ({ ...d, startTime: performance.now() })));
      setPrevBoard(previousBoard || boardState.board);
    }
  }, [flippedDiscs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const boardSize = canvas.getBoundingClientRect().width;
    if (boardSize === 0) return;
    const cellSize = boardSize / 8;
    const ctx = setupHiDPICanvas(canvas, boardSize);

    let activeAnimations = animatingDiscs.length > 0;

    const now = performance.now();
    const stillAnimating = animatingDiscs.filter(d => now - d.startTime < ANIMATION_DURATION);

    if (activeAnimations && stillAnimating.length === 0) {
      activeAnimations = false;
      setAnimatingDiscs([]);
      setPrevBoard(null);
    }

    drawBoard(ctx, boardState, theme, hoveredCell, showValidMoves, animatingDiscs, boardSize, cellSize, prevBoard, lastMove, pressedCell);

    if (activeAnimations) {
      animationFrameRef.current = requestAnimationFrame(() => {
        setAnimatingDiscs(current => [...current]);
      });
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [boardState, theme, hoveredCell, animatingDiscs]);

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

  const handleClick = (event: React.MouseEvent) => {
    if (disabled || !onCellClick) return;
    const coords = getGridCoordinates(event.clientX, event.clientY);
    if (coords) {
      const isValidMove = boardState.validMoves.some(move => move.x === coords.x && move.y === coords.y);
      if (isValidMove) {
        haptic.discPlace();
        onCellClick(coords.x, coords.y);
      } else {
        haptic.invalidMove();
      }
    }
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = (event: React.TouchEvent) => {
    if (disabled) return;
    event.preventDefault();
    const touch = event.touches[0];
    const coords = getGridCoordinates(touch.clientX, touch.clientY);
    if (coords) {
      const isValidMove = boardState.validMoves.some(move => move.x === coords.x && move.y === coords.y);
      if (isValidMove) {
        setPressedCell(coords);
        haptic.lightTap(); // 가벼운 햅틱 피드백
      }
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (disabled || !onCellClick) return;
    event.preventDefault();
    const touch = event.changedTouches[0];
    const coords = getGridCoordinates(touch.clientX, touch.clientY);

    if (coords && pressedCell && coords.x === pressedCell.x && coords.y === pressedCell.y) {
      const isValidMove = boardState.validMoves.some(move => move.x === coords.x && move.y === coords.y);
      if (isValidMove) {
        haptic.discPlace();
        onCellClick(coords.x, coords.y);
      } else {
        haptic.invalidMove();
      }
    }
    setPressedCell(null);
  };

  const handleTouchCancel = () => {
    setPressedCell(null);
  };

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
  prevBoard: number[][] | null,
  lastMove: { x: number; y: number } | null,
  pressedCell: { x: number; y: number } | null
) {
  ctx.clearRect(0, 0, boardSize, boardSize);
  drawBoardBackground(ctx, theme, boardSize, cellSize);
  drawGrid(ctx, boardSize, cellSize);

  const animationMap = new Map(animatingDiscs.map(d => [`${d.x}-${d.y}`, d]));

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const animation = animationMap.get(`${x}-${y}`);
      const discValue = boardState.board[y][x];

      if (animation) {
        const now = performance.now();
        const elapsed = now - animation.startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

        const fromColorValue = prevBoard ? prevBoard[y][x] : (discValue * -1);

        drawDisc(ctx, x, y, fromColorValue === 1 ? 'black' : 'white', theme, cellSize, progress, discValue === 1 ? 'black' : 'white');

      } else if (discValue !== 0) {
        drawDisc(ctx, x, y, discValue === 1 ? 'black' : 'white', theme, cellSize);
      }
    }
  }

  // 호버 효과 (데스크톱)
  if (hoveredCell) {
    const isValidMove = boardState.validMoves.some(move => move.x === hoveredCell.x && move.y === hoveredCell.y);
    if (isValidMove) {
      drawHoverEffect(ctx, hoveredCell.x, hoveredCell.y, cellSize, boardState.currentPlayer);
    }
  }

  // 프레스 효과 (모바일)
  if (pressedCell) {
    const isValidMove = boardState.validMoves.some(move => move.x === pressedCell.x && move.y === pressedCell.y);
    if (isValidMove) {
      drawPressEffect(ctx, pressedCell.x, pressedCell.y, cellSize, boardState.currentPlayer);
    }
  }

  // 마지막 둔 위치 표시
  if (lastMove) {
    drawLastMoveIndicator(ctx, lastMove.x, lastMove.y, cellSize);
  }

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
    // 매우 부드러운 회전 애니메이션 (번쩍임 완전 제거)
    const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const easedProgress = easeInOutQuad(animationProgress);

    // 안전한 회전 애니메이션 (최소 스케일 보장)
    const scaleY = Math.cos(easedProgress * Math.PI);
    const currentColor = easedProgress < 0.5 ? color : toColor;

    ctx.translate(centerX, centerY);
    // 번쩍임 방지를 위해 최소 스케일을 0.2로 설정
    const safeFinalScale = Math.max(0.2, Math.abs(scaleY));
    ctx.scale(1, safeFinalScale);
    ctx.translate(-centerX, -centerY);

    drawClassicDisc(ctx, centerX, centerY, radius, currentColor);

  } else {
    drawClassicDisc(ctx, centerX, centerY, radius, color);
  }

  ctx.restore();
}

function drawBoardBackground(ctx: CanvasRenderingContext2D, theme: any, boardSize: number, cellSize: number) {
  // 부드럽고 고급스러운 녹색 오델로 보드
  const gradient = ctx.createLinearGradient(0, 0, boardSize, boardSize);
  gradient.addColorStop(0, '#064e3b');    // 깊은 에메랄드
  gradient.addColorStop(0.3, '#065f46');  // 중간 에메랄드
  gradient.addColorStop(0.7, '#047857');  // 밝은 에메랄드
  gradient.addColorStop(1, '#059669');    // 가장 밝은 에메랄드

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, boardSize, boardSize);

  // 미묘한 체스판 패턴으로 오델로 느낌
  ctx.fillStyle = 'rgba(6, 78, 59, 0.1)';
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 2 === 0) {
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, boardSize: number, cellSize: number) {
  // 부드럽고 고급스러운 그리드 라인 (녹색 테마)
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)'; // 부드러운 에메랄드
  ctx.lineWidth = 0.8; // 적당한 두께

  // 미묘한 녹색 글로우
  ctx.shadowColor = 'rgba(16, 185, 129, 0.15)';
  ctx.shadowBlur = 1;

  for (let i = 1; i < 8; i++) {
    const pos = i * cellSize;
    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, boardSize);
    ctx.stroke();

    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(boardSize, pos);
    ctx.stroke();
  }

  // 보드 외곽 테두리 (녹색 테마)
  ctx.shadowBlur = 2;
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, 0, boardSize, boardSize);

  ctx.shadowBlur = 0;
}

function drawClassicDisc(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: 'black' | 'white') {
  // 고급스러운 평평한 오델로 디스크 - 미묘한 그림자만
  ctx.save();

  // 보드에 미묘한 그림자
  ctx.beginPath();
  ctx.arc(x, y + 1, radius + 1, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fill();

  // 메인 디스크 - 완전히 평평하고 고급스러운 단색
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  if (color === 'black') {
    // 깔끔하고 고급스러운 검은색
    ctx.fillStyle = '#1a1a1a';
  } else {
    // 깔끔하고 고급스러운 흰색
    ctx.fillStyle = '#f8f9fa';
  }
  ctx.fill();

  // 디스크 가장자리에 미묘한 테두리 - 평평함을 강조
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = color === 'black' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.restore();
}

function drawHoverEffect(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number, currentPlayer: 'black' | 'white') {
  const centerX = x * cellSize + cellSize / 2;
  const centerY = y * cellSize + cellSize / 2;
  const radius = cellSize * 0.35;

  ctx.fillStyle = 'rgba(252, 211, 77, 0.15)';
  ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

  ctx.save();
  ctx.globalAlpha = 0.6;
  const previewColor = currentPlayer;
  if (previewColor === 'black') {
    ctx.fillStyle = 'rgba(31, 41, 55, 0.8)';
  } else {
    ctx.fillStyle = 'rgba(248, 250, 252, 0.8)';
  }
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawPressEffect(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number, currentPlayer: 'black' | 'white') {
  const centerX = x * cellSize + cellSize / 2;
  const centerY = y * cellSize + cellSize / 2;
  const radius = cellSize * 0.38;

  // 더 강한 프레스 피드백
  ctx.fillStyle = 'rgba(34, 197, 94, 0.3)'; // 에메랄드 테마
  ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

  ctx.save();
  ctx.globalAlpha = 0.8;

  // 프레스된 디스크 프리뷰 (더 선명하게)
  const previewColor = currentPlayer;
  if (previewColor === 'black') {
    ctx.fillStyle = 'rgba(26, 26, 26, 0.9)';
  } else {
    ctx.fillStyle = 'rgba(248, 249, 250, 0.9)';
  }
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // 에메랄드 글로우 효과
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(34, 197, 94, 0.4)';
  ctx.shadowBlur = 8;
  ctx.stroke();

  ctx.restore();
}

function drawLastMoveIndicator(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number) {
  const centerX = x * cellSize + cellSize / 2;
  const centerY = y * cellSize + cellSize / 2;
  const radius = cellSize * 0.45;

  ctx.save();

  // 미묘한 글로우 링
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)'; // 에메랄드 테마
  ctx.lineWidth = 2;
  ctx.stroke();

  // 더 작은 내부 링
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 4, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawCornerMarkers(ctx: CanvasRenderingContext2D, cellSize: number) {
  const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
  ctx.strokeStyle = 'rgba(252, 211, 77, 0.6)';
  ctx.lineWidth = 2;
  corners.forEach(([x, y]) => {
    const cellX = x * cellSize;
    const cellY = y * cellSize;
    const markerSize = cellSize * 0.15;
    const crownX = cellX + cellSize / 2;
    const crownY = cellY + cellSize / 2;
    ctx.beginPath();
    ctx.moveTo(crownX - markerSize, crownY + markerSize * 0.5);
    ctx.lineTo(crownX + markerSize, crownY + markerSize * 0.5);
    ctx.lineTo(crownX + markerSize * 0.7, crownY - markerSize * 0.5);
    ctx.lineTo(crownX + markerSize * 0.3, crownY);
    ctx.lineTo(crownX, crownY - markerSize * 0.8);
    ctx.lineTo(crownX - markerSize * 0.3, crownY);
    ctx.lineTo(crownX - markerSize * 0.7, crownY - markerSize * 0.5);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(252, 211, 77, 0.2)';
    ctx.fill();
  });
}