import type { GameState } from "shared-types";

export function drawBoard(ctx: CanvasRenderingContext2D, state: GameState, size = 400) {
  const cell = size / 8;
  ctx.clearRect(0, 0, size, size);
  // board background
  ctx.fillStyle = "#0a6f2f";
  ctx.fillRect(0, 0, size, size);
  // grid
  ctx.strokeStyle = "#083d1a";
  for (let i = 0; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cell);
    ctx.lineTo(size, i * cell);
    ctx.stroke();
  }
  // discs
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const v = state.board[y][x];
      if (!v) continue;
      ctx.beginPath();
      ctx.arc(x * cell + cell / 2, y * cell + cell / 2, cell * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = v === 1 ? "#111" : "#eee";
      ctx.fill();
      ctx.strokeStyle = "#0008";
      ctx.stroke();
    }
  }
}

