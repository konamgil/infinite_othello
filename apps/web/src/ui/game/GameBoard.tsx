import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../store/gameStore';
// import { useFXLayer, useFXEffects, useFXGameBoard } from '../fx/FXHooks'; // 성능 최적화를 위해 비활성화
import { haptic } from '../feedback/HapticFeedback';

// 보드 상태 타입 정의 (임시) - 디스크로 용어 변경
export interface BoardState {
  board: number[][]; // -1: 백디스크, 0: 빈칸, 1: 흑디스크
  currentPlayer: 'black' | 'white';
  validMoves: Array<{ x: number; y: number }>;
}

interface GameBoardProps {
  boardState: BoardState;
  onCellClick?: (x: number, y: number) => void;
  showValidMoves?: boolean;
  disabled?: boolean;
  onDiscFlip?: (discs: Array<{ x: number; y: number; from: 'black' | 'white'; to: 'black' | 'white' }>) => void;
  onGameEnd?: (result: 'victory' | 'defeat', score: { player: number; opponent: number }) => void;
}

// HiDPI Canvas 설정 함수
function setupHiDPICanvas(canvas: HTMLCanvasElement, logicalSize: number): CanvasRenderingContext2D {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2)); // 2x 제한
  canvas.style.width = logicalSize + 'px';
  canvas.style.height = logicalSize + 'px';
  canvas.width = Math.round(logicalSize * dpr);
  canvas.height = Math.round(logicalSize * dpr);

  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 논리좌표로 그리기
  return ctx;
}

export function GameBoard({
  boardState,
  onCellClick,
  showValidMoves = true,
  disabled = false,
  onDiscFlip,
  onGameEnd
}: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  // const effects = useFXEffects(); // 성능 최적화를 위해 비활성화

  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [flippingDiscs, setFlippingDiscs] = useState<Set<string>>(new Set());

  // FX 레이어 설정 - 게임보드용 (성능 최적화를 위해 비활성화)
  // const fxLayerRef = useFXLayer('battle', 390, 400, true);

  // FX 게임보드 훅 사용 (성능 최적화를 위해 비활성화)
  // const { onDiscPlace, onDiscFlip: fxDiscFlip, onGameEnd: fxGameEnd } = useFXGameBoard();
  const onDiscPlace = () => {};
  const fxDiscFlip = () => {};
  const fxGameEnd = () => {};

  const BOARD_SIZE = 336; // 42px × 8 = 336px
  const CELL_SIZE = 42;

  // 보드 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = setupHiDPICanvas(canvas, BOARD_SIZE);
    drawBoard(ctx, boardState, theme, hoveredCell, showValidMoves, flippingDiscs);
  }, [boardState, theme, hoveredCell, showValidMoves, flippingDiscs]);

  // FX 레이어 배치 (비활성화)
  // useEffect(() => {
  //   if (containerRef.current && fxLayerRef.current) {
  //     const container = containerRef.current;
  //     const fxCanvas = fxLayerRef.current.querySelector('canvas');

  //     if (fxCanvas) {
  //       fxCanvas.style.position = 'absolute';
  //       fxCanvas.style.top = '0';
  //       fxCanvas.style.left = '0';
  //       fxCanvas.style.pointerEvents = 'none';
  //       fxCanvas.style.zIndex = '10';
  //     }
  //   }
  // }, [fxLayerRef]);

  // 마우스 이벤트 핸들링
  const handleMouseMove = (event: React.MouseEvent) => {
    if (disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((event.clientY - rect.top) / CELL_SIZE);

    if (x >= 0 && x < 8 && y >= 0 && y < 8) {
      setHoveredCell({ x, y });

      // 유효한 수 위에 마우스 올렸을 때 미묘한 효과 (비활성화)
      // if (boardState.validMoves.some(move => move.x === x && move.y === y)) {
      //   const cellCenterX = (x * CELL_SIZE) + (CELL_SIZE / 2);
      //   const cellCenterY = (y * CELL_SIZE) + (CELL_SIZE / 2);

      //   // 미묘한 글로우 펄스
      //   effects.emit('battle:validHover', { x: cellCenterX, y: cellCenterY });
      // }
    } else {
      setHoveredCell(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  const handleClick = (event: React.MouseEvent) => {
    if (disabled || !onCellClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((event.clientY - rect.top) / CELL_SIZE);

    if (x >= 0 && x < 8 && y >= 0 && y < 8) {
      // 유효한 수인지 확인
      const isValidMove = boardState.validMoves.some(move => move.x === x && move.y === y);

      if (isValidMove) {
        const cellCenterX = (x * CELL_SIZE) + (CELL_SIZE / 2);
        const cellCenterY = (y * CELL_SIZE) + (CELL_SIZE / 2);

        // 햅틱 피드백 - 디스크 배치
        haptic.discPlace();

        // 착수 FX 효과 (성능 최적화로 비활성화)
        // onDiscPlace(cellCenterX, cellCenterY);

        // 디스크 뒤집기 애니메이션 시작
        simulateDiscFlipping(x, y);

        onCellClick(x, y);
      } else {
        // 무효한 수 햅틱 피드백
        haptic.invalidMove();

        // 잘못된 수 - 에러 효과 (성능 최적화로 비활성화)
        // const errorElement = canvas;
        // effects.errorShake(errorElement);
      }
    }
  };

  const simulateDiscFlipping = (clickX: number, clickY: number) => {
    // 실제 게임 로직에서는 어떤 디스크들이 뒤집히는지 계산해야 함
    // 여기서는 데모용으로 주변 디스크들을 뒤집는 것으로 시뮬레이션
    const directions = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
    const flipCandidates: Array<{x: number, y: number, from: 'black'|'white', to: 'black'|'white'}> = [];

    directions.forEach(([dx, dy]) => {
      let checkX = clickX + dx;
      let checkY = clickY + dy;

      // 보드 범위 내에서 opponent 디스크가 있는 곳들
      if (checkX >= 0 && checkX < 8 && checkY >= 0 && checkY < 8) {
        const currentDisc = boardState.board[checkY][checkX];
        if (currentDisc !== 0) {
          const from = currentDisc === 1 ? 'black' : 'white';
          const to = boardState.currentPlayer;

          if (from !== to) {
            flipCandidates.push({ x: checkX, y: checkY, from, to });
          }
        }
      }
    });

    // 디스크 뒤집기 최적화: Canvas FX 비활성화하고 순수 CSS 애니메이션 사용
    if (flipCandidates.length > 0) {
      // 햅틱 피드백 한 번만
      haptic.discFlip();

      // 뒤집기 상태 일괄 설정
      const flipKeys = flipCandidates.map(disc => `${disc.x}-${disc.y}`);
      setFlippingDiscs(new Set(flipKeys));

      // 애니메이션 완료 후 상태 정리
      setTimeout(() => {
        setFlippingDiscs(new Set());
      }, 200);
    }

    // 콜백 호출
    if (onDiscFlip && flipCandidates.length > 0) {
      setTimeout(() => {
        onDiscFlip(flipCandidates);
      }, 100);
    }
  };

  // 게임 종료 시 FX 효과
  useEffect(() => {
    // 게임 종료 조건 체크 (데모용)
    const totalDiscs = boardState.board.flat().filter(cell => cell !== 0).length;
    if (totalDiscs >= 60) { // 보드가 거의 찼을 때
      const playerDiscs = boardState.board.flat().filter(cell => cell === 1).length;
      const opponentDiscs = boardState.board.flat().filter(cell => cell === -1).length;

      const result = playerDiscs > opponentDiscs ? 'victory' : 'defeat';
      const score = { player: playerDiscs, opponent: opponentDiscs };

      // FX 게임 종료 효과
      fxGameEnd(result, score);

      // 게임 종료 햅틱 피드백
      if (result === 'victory') {
        haptic.gameWin();
      } else {
        haptic.gameLose();
      }

      if (onGameEnd) {
        onGameEnd(result, score);
      }
    }
  }, [boardState, onGameEnd, fxGameEnd]);

  return (
    <div
      ref={containerRef}
      className="relative touch-manipulation"
      style={{ width: BOARD_SIZE, height: BOARD_SIZE }}
    >
      {/* FX 레이어 (성능 최적화를 위해 비활성화) */}
      {/* <div ref={fxLayerRef} className="absolute inset-0 pointer-events-none" /> */}

      {/* 게임 보드 캔버스 */}
      <canvas
        ref={canvasRef}
        className="relative rounded-xl shadow-2xl cursor-pointer
                   ring-2 ring-tower-gold-400/20 hover:ring-tower-gold-400/40
                   transition-all duration-200"
        style={{
          width: BOARD_SIZE,
          height: BOARD_SIZE,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onTouchStart={(e) => {
          // 터치 이벤트도 처리
          e.preventDefault();
          const touch = e.touches[0];
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const x = Math.floor((touch.clientX - rect.left) / CELL_SIZE);
            const y = Math.floor((touch.clientY - rect.top) / CELL_SIZE);

            if (x >= 0 && x < 8 && y >= 0 && y < 8 && onCellClick) {
              const isValidMove = boardState.validMoves.some(move => move.x === x && move.y === y);

              if (isValidMove) {
                const cellCenterX = (x * CELL_SIZE) + (CELL_SIZE / 2);
                const cellCenterY = (y * CELL_SIZE) + (CELL_SIZE / 2);

                // 햅틱 피드백 - 디스크 배치
                haptic.discPlace();

                // onDiscPlace(cellCenterX, cellCenterY); // 성능 최적화로 비활성화
                simulateDiscFlipping(x, y);
                onCellClick(x, y);
              } else {
                // 무효한 수 햅틱 피드백
                haptic.invalidMove();
              }
            }
          }
        }}
        aria-label="오델로 게임 보드 - 디스크를 놓을 위치를 선택하세요"
        role="grid"
      />

      {/* 유효한 수 가이드 (DOM 오버레이) */}
      {showValidMoves && (
        <div className="absolute inset-0 pointer-events-none">
          {boardState.validMoves.map((move, index) => (
            <div
              key={`${move.x}-${move.y}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2
                       w-2 h-2 bg-tower-gold-400 rounded-full animate-pulse"
              style={{
                left: (move.x * CELL_SIZE) + (CELL_SIZE / 2),
                top: (move.y * CELL_SIZE) + (CELL_SIZE / 2),
                animationDelay: `${index * 100}ms`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Canvas 그리기 함수들 (디스크로 용어 변경)
function drawBoard(
  ctx: CanvasRenderingContext2D,
  boardState: BoardState,
  theme: any,
  hoveredCell: { x: number; y: number } | null,
  showValidMoves: boolean,
  flippingDiscs: Set<string>
) {
  const BOARD_SIZE = 336;
  const CELL_SIZE = 42;

  // 배경 클리어
  ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

  // 보드 배경 그리기
  drawBoardBackground(ctx, theme, BOARD_SIZE, CELL_SIZE);

  // 격자 그리기
  drawGrid(ctx, BOARD_SIZE, CELL_SIZE);

  // 디스크 그리기
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const disc = boardState.board[y][x];
      if (disc !== 0) {
        const isFlipping = flippingDiscs.has(`${x}-${y}`);
        drawDisc(ctx, x, y, disc === 1 ? 'black' : 'white', theme, CELL_SIZE, isFlipping);
      }
    }
  }

  // 호버 효과 (유효한 수일 때만)
  if (hoveredCell) {
    const isValidMove = boardState.validMoves.some(
      move => move.x === hoveredCell.x && move.y === hoveredCell.y
    );
    if (isValidMove) {
      drawHoverEffect(ctx, hoveredCell.x, hoveredCell.y, CELL_SIZE, boardState.currentPlayer);
    }
  }

  // 코너 마킹 (특수 칸 표시)
  drawCornerMarkers(ctx, CELL_SIZE);
}

function drawBoardBackground(ctx: CanvasRenderingContext2D, theme: any, boardSize: number, cellSize: number) {
  // 테마에 따른 배경색 및 특수 효과
  switch (theme.board) {
    case 'classic':
      ctx.fillStyle = '#16a34a'; // 녹색
      ctx.fillRect(0, 0, boardSize, boardSize);
      break;

    case 'dark':
      // 어두운 석조 패턴
      const darkGradient = ctx.createLinearGradient(0, 0, boardSize, boardSize);
      darkGradient.addColorStop(0, '#1f2937');
      darkGradient.addColorStop(1, '#111827');
      ctx.fillStyle = darkGradient;
      ctx.fillRect(0, 0, boardSize, boardSize);

      // 석조 패턴 오버레이
      ctx.fillStyle = 'rgba(75, 85, 99, 0.3)';
      for (let i = 0; i < 8; i += 2) {
        for (let j = 0; j < 8; j += 2) {
          if ((i + j) % 4 === 0) {
            ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
          }
        }
      }
      break;

    case 'galaxy':
      // 은하수 그라데이션 + 별 효과
      const galaxyGradient = ctx.createRadialGradient(
        boardSize / 2, boardSize / 2, 0,
        boardSize / 2, boardSize / 2, boardSize / 2
      );
      galaxyGradient.addColorStop(0, '#312e81');
      galaxyGradient.addColorStop(0.7, '#1e1b4b');
      galaxyGradient.addColorStop(1, '#0f0f23');
      ctx.fillStyle = galaxyGradient;
      ctx.fillRect(0, 0, boardSize, boardSize);

      // 별 효과
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * boardSize;
        const y = Math.random() * boardSize;
        const size = Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case 'magic':
      // 마법진 배경 + 룬 문자
      const magicGradient = ctx.createRadialGradient(
        boardSize / 2, boardSize / 2, 0,
        boardSize / 2, boardSize / 2, boardSize / 2
      );
      magicGradient.addColorStop(0, '#581c87');
      magicGradient.addColorStop(0.7, '#3b0764');
      magicGradient.addColorStop(1, '#1a0b2e');
      ctx.fillStyle = magicGradient;
      ctx.fillRect(0, 0, boardSize, boardSize);

      // 마법진 패턴
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.lineWidth = 1;

      // 중심 원
      ctx.beginPath();
      ctx.arc(boardSize / 2, boardSize / 2, boardSize * 0.4, 0, Math.PI * 2);
      ctx.stroke();

      // 룬 문자 시뮬레이션 (단순화된 패턴)
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = boardSize / 2 + Math.cos(angle) * boardSize * 0.35;
        const y = boardSize / 2 + Math.sin(angle) * boardSize * 0.35;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.5)';
        ctx.fill();
      }
      break;

    default:
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, 0, boardSize, boardSize);
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, boardSize: number, cellSize: number) {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 1;

  // 세로선
  for (let x = 1; x < 8; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cellSize, 0);
    ctx.lineTo(x * cellSize, boardSize);
    ctx.stroke();
  }

  // 가로선
  for (let y = 1; y < 8; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellSize);
    ctx.lineTo(boardSize, y * cellSize);
    ctx.stroke();
  }
}

function drawDisc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: 'black' | 'white',
  theme: any,
  cellSize: number,
  isFlipping: boolean = false
) {
  const centerX = x * cellSize + cellSize / 2;
  const centerY = y * cellSize + cellSize / 2;
  const radius = cellSize * 0.4; // 디스크 반지름

  ctx.save();

  // 부드러운 뒤집기 애니메이션
  if (isFlipping) {
    const time = Date.now() * 0.01;
    const scale = 0.8 + Math.abs(Math.sin(time)) * 0.4; // 0.8 ~ 1.2 사이로 부드럽게
    const rotation = Math.sin(time) * 0.2; // 살짝 회전

    ctx.globalAlpha = 0.9;
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.scale(scale, 1); // X축만 스케일링으로 뒤집는 효과
    ctx.translate(-centerX, -centerY);
  }

  // 테마에 따른 디스크 스타일
  switch (theme.stone) {
    case 'classic':
      drawClassicDisc(ctx, centerX, centerY, radius, color);
      break;
    case 'ruby-sapphire':
      drawGemDisc(ctx, centerX, centerY, radius, color === 'black' ? '#dc2626' : '#2563eb');
      break;
    case 'sun-moon':
      drawCelestialDisc(ctx, centerX, centerY, radius, color);
      break;
    case 'fire-ice':
      drawElementalDisc(ctx, centerX, centerY, radius, color);
      break;
    case 'techno':
      drawTechnoDisc(ctx, centerX, centerY, radius, color);
      break;
    default:
      drawClassicDisc(ctx, centerX, centerY, radius, color);
  }

  ctx.restore();
}

// 디스크 그리기 함수들 - 깔끔한 평평한 스타일
function drawClassicDisc(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: 'black' | 'white') {
  // 그림자 효과
  ctx.beginPath();
  ctx.arc(x + 1, y + 2, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fill();

  // 메인 디스크 - 깔끔한 색상
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);

  if (color === 'black') {
    // 진짜 검은색 디스크
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    gradient.addColorStop(0, '#4a4a4a'); // 부드러운 검정
    gradient.addColorStop(0.7, '#2a2a2a'); // 중간 검정
    gradient.addColorStop(1, '#000000'); // 순검정
    ctx.fillStyle = gradient;
  } else {
    // 진짜 흰색 디스크
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    gradient.addColorStop(0, '#ffffff'); // 순백
    gradient.addColorStop(0.8, '#f8f8f8'); // 거의 백색
    gradient.addColorStop(1, '#e0e0e0'); // 연한 회색 테두리
    ctx.fillStyle = gradient;
  }

  ctx.fill();

  // 깔끔한 테두리
  ctx.strokeStyle = color === 'black' ? '#333333' : '#cccccc';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 상단 하이라이트 (평평함 강조)
  ctx.beginPath();
  ctx.arc(x - radius * 0.2, y - radius * 0.2, radius * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = color === 'black' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.9)';
  ctx.fill();
}

function drawGemDisc(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  // 보석 효과
  const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.6, color);
  gradient.addColorStop(1, '#000000');

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // 반짝임 효과
  ctx.beginPath();
  ctx.arc(x - radius * 0.4, y - radius * 0.4, radius * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fill();

  // 보석 내부 반사
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
  ctx.stroke();
}

function drawCelestialDisc(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: 'black' | 'white') {
  if (color === 'black') {
    // 달 (은색) - 더 세련되게
    const moonGradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    moonGradient.addColorStop(0, '#f1f5f9');
    moonGradient.addColorStop(0.7, '#94a3b8');
    moonGradient.addColorStop(1, '#475569');

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = moonGradient;
    ctx.fill();

    // 달 표면 크레이터
    ctx.fillStyle = 'rgba(71, 85, 105, 0.3)';
    ctx.beginPath();
    ctx.arc(x + radius * 0.2, y - radius * 0.1, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x - radius * 0.3, y + radius * 0.2, radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 태양 (금색) - 더 화려하게
    const sunGradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    sunGradient.addColorStop(0, '#fef3c7');
    sunGradient.addColorStop(0.5, '#f59e0b');
    sunGradient.addColorStop(1, '#d97706');

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = sunGradient;
    ctx.fill();

    // 태양광 광선들
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * radius * 0.8, y + Math.sin(angle) * radius * 0.8);
      ctx.lineTo(x + Math.cos(angle) * radius * 1.2, y + Math.sin(angle) * radius * 1.2);
      ctx.stroke();
    }
  }
}

function drawElementalDisc(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: 'black' | 'white') {
  if (color === 'black') {
    // 불꽃 효과 - 더 역동적으로
    const fireGradient = ctx.createRadialGradient(x, y + radius * 0.3, 0, x, y, radius);
    fireGradient.addColorStop(0, '#fef3c7');
    fireGradient.addColorStop(0.3, '#fbbf24');
    fireGradient.addColorStop(0.6, '#f59e0b');
    fireGradient.addColorStop(1, '#dc2626');

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fireGradient;
    ctx.fill();

    // 불꽃 파티클 효과
    ctx.fillStyle = '#fed7aa';
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = radius * 0.3 + Math.random() * radius * 0.4;
      const particleX = x + Math.cos(angle) * distance;
      const particleY = y + Math.sin(angle) * distance;

      ctx.beginPath();
      ctx.arc(particleX, particleY, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // 얼음 효과 - 더 차갑게
    const iceGradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    iceGradient.addColorStop(0, '#f0f9ff');
    iceGradient.addColorStop(0.4, '#bae6fd');
    iceGradient.addColorStop(0.7, '#0ea5e9');
    iceGradient.addColorStop(1, '#0369a1');

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = iceGradient;
    ctx.fill();

    // 얼음 결정 패턴 - 더 복잡하게
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;

    // 6각형 얼음 결정
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * radius * 0.7, y + Math.sin(angle) * radius * 0.7);
      ctx.stroke();

      // 부결정
      const subAngle1 = angle - Math.PI / 6;
      const subAngle2 = angle + Math.PI / 6;
      const subLength = radius * 0.3;

      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * subLength, y + Math.sin(angle) * subLength);
      ctx.lineTo(x + Math.cos(subAngle1) * subLength * 0.5, y + Math.sin(subAngle1) * subLength * 0.5);
      ctx.moveTo(x + Math.cos(angle) * subLength, y + Math.sin(angle) * subLength);
      ctx.lineTo(x + Math.cos(subAngle2) * subLength * 0.5, y + Math.sin(subAngle2) * subLength * 0.5);
      ctx.stroke();
    }
  }
}

function drawTechnoDisc(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: 'black' | 'white') {
  const mainColor = color === 'black' ? '#1f2937' : '#f1f5f9';
  const accentColor = color === 'black' ? '#06b6d4' : '#8b5cf6';
  const glowColor = color === 'black' ? 'rgba(6, 182, 212, 0.5)' : 'rgba(139, 92, 246, 0.5)';

  // 그림자와 글로우
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 8;

  // 메인 원
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = mainColor;
  ctx.fill();

  // 네온 테두리
  ctx.shadowBlur = 0;
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 내부 회로 패턴 - 더 복잡하게
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1;

  // 중앙 십자 패턴
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.6, y);
  ctx.lineTo(x + radius * 0.6, y);
  ctx.moveTo(x, y - radius * 0.6);
  ctx.lineTo(x, y + radius * 0.6);
  ctx.stroke();

  // 대각선 패턴
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.4, y - radius * 0.4);
  ctx.lineTo(x + radius * 0.4, y + radius * 0.4);
  ctx.moveTo(x + radius * 0.4, y - radius * 0.4);
  ctx.lineTo(x - radius * 0.4, y + radius * 0.4);
  ctx.stroke();

  // 코너 LED들
  const ledRadius = radius * 0.08;
  [-0.4, 0.4].forEach(dx => {
    [-0.4, 0.4].forEach(dy => {
      ctx.beginPath();
      ctx.arc(x + dx * radius, y + dy * radius, ledRadius, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();

      // LED 글로우
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  });

  // 중앙 코어
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = accentColor;
  ctx.fill();
}

function drawHoverEffect(ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number, currentPlayer: 'black' | 'white') {
  const centerX = x * cellSize + cellSize / 2;
  const centerY = y * cellSize + cellSize / 2;
  const radius = cellSize * 0.35;

  // 배경 하이라이트
  ctx.fillStyle = 'rgba(252, 211, 77, 0.15)';
  ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

  // 미리보기 디스크 (반투명)
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

  // 미리보기 테두리
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

function drawCornerMarkers(ctx: CanvasRenderingContext2D, cellSize: number) {
  // 코너 칸들 (0,0), (0,7), (7,0), (7,7) 특별 표시
  const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];

  ctx.strokeStyle = 'rgba(252, 211, 77, 0.6)';
  ctx.lineWidth = 2;

  corners.forEach(([x, y]) => {
    const cellX = x * cellSize;
    const cellY = y * cellSize;
    const markerSize = cellSize * 0.15;

    // 코너 왕관 마커
    ctx.beginPath();

    // 간단한 왕관 모양
    const crownX = cellX + cellSize / 2;
    const crownY = cellY + cellSize / 2;

    // 왕관 베이스
    ctx.moveTo(crownX - markerSize, crownY + markerSize * 0.5);
    ctx.lineTo(crownX + markerSize, crownY + markerSize * 0.5);

    // 왕관 꼭지들
    ctx.lineTo(crownX + markerSize * 0.7, crownY - markerSize * 0.5);
    ctx.lineTo(crownX + markerSize * 0.3, crownY);
    ctx.lineTo(crownX, crownY - markerSize * 0.8);
    ctx.lineTo(crownX - markerSize * 0.3, crownY);
    ctx.lineTo(crownX - markerSize * 0.7, crownY - markerSize * 0.5);
    ctx.closePath();

    ctx.stroke();

    // 왕관 내부 채우기
    ctx.fillStyle = 'rgba(252, 211, 77, 0.2)';
    ctx.fill();
  });
}