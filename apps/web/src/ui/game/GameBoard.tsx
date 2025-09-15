import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../store/gameStore';
import { haptic } from '../feedback/HapticFeedback';

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
}: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const theme = useTheme();

  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [animatingDiscs, setAnimatingDiscs] = useState<AnimatingDisc[]>([]);
  const [prevBoard, setPrevBoard] = useState<number[][] | null>(null);

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

    drawBoard(ctx, boardState, theme, hoveredCell, showValidMoves, animatingDiscs, boardSize, cellSize, prevBoard);

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

  return (
    <div className="relative w-full aspect-square touch-manipulation">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-2xl shadow-2xl cursor-pointer ring-2 ring-orange-400/30 hover:ring-orange-400/50 transition-all duration-300 bg-black/20 backdrop-blur-sm"
        style={{ touchAction: 'none' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
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
  prevBoard: number[][] | null
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

  if (hoveredCell) {
    const isValidMove = boardState.validMoves.some(move => move.x === hoveredCell.x && move.y === hoveredCell.y);
    if (isValidMove) {
      drawHoverEffect(ctx, hoveredCell.x, hoveredCell.y, cellSize, boardState.currentPlayer);
    }
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
    const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const easedProgress = easeInOutQuad(animationProgress);

    const scaleY = Math.cos(easedProgress * Math.PI);
    const currentColor = easedProgress < 0.5 ? color : toColor;

    ctx.translate(centerX, centerY);
    ctx.scale(1, Math.abs(scaleY));
    ctx.translate(-centerX, -centerY);
    
    drawClassicDisc(ctx, centerX, centerY, radius, currentColor);

  } else {
    drawClassicDisc(ctx, centerX, centerY, radius, color);
  }

  ctx.restore();
}

function drawBoardBackground(ctx: CanvasRenderingContext2D, theme: any, boardSize: number, cellSize: number) {
  ctx.fillStyle = '#16a34a'; // Traditional Othello green
  ctx.fillRect(0, 0, boardSize, boardSize);
}

function drawGrid(ctx: CanvasRenderingContext2D, boardSize: number, cellSize: number) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
  ctx.shadowBlur = 3;

  for (let i = 1; i < 8; i++) {
    const pos = i * cellSize;
    // Vertical
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, boardSize);
    ctx.stroke();
    // Horizontal
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(boardSize, pos);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function drawClassicDisc(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: 'black' | 'white') {
  // Base shadow on the board
  ctx.beginPath();
  ctx.arc(x, y + radius * 0.1, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Main disc body
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  if (color === 'black') {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, '#3a3d4a'); // Softer black
    gradient.addColorStop(0.8, '#1e2028');
    gradient.addColorStop(1, '#101218');
    ctx.fillStyle = gradient;
  } else {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, '#f0f2f8'); // Softer white
    gradient.addColorStop(0.8, '#c8cdd8');
    gradient.addColorStop(1, '#b0b5c0');
    ctx.fillStyle = gradient;
  }
  ctx.fill();

  // Inner shadow for depth
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = color === 'black' ? -2 : 2;
  ctx.shadowBlur = 4;
  ctx.globalCompositeOperation = 'source-atop';
  ctx.stroke();
  ctx.restore();

  // Top sheen/highlight
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.8, -Math.PI * 0.75, -Math.PI * 0.25);
  const sheenGradient = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
  if (color === 'black') {
      sheenGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      sheenGradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
  } else {
      sheenGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      sheenGradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
  }
  ctx.strokeStyle = sheenGradient;
  ctx.lineWidth = radius * 0.1;
  ctx.stroke();
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