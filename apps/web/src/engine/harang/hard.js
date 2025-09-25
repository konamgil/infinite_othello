import { getMove as algorithmMove } from './algorithm.js';

export function getMove(board, player, aiPlayer, moveHistory) {
  const moveCount = moveHistory.length;
  const emptySquares = board.reduce(
    (count, row) => count + row.filter(cell => cell === 0).length,
    0
  );

  // Strengthen search windows:
  // - Early game (opening): depth 9 / 7000ms
  // - Midgame: depth 10 / 9000ms
  // - Late/endgame: depth 11 / 8000ms (exact search often kicks in)
  let maxDepth = 10;
  let timeLimitMs = 9000;

  if (emptySquares <= 16) {
    maxDepth = 11;
    timeLimitMs = 8000;
  } else if (moveCount < 12 || emptySquares > 44) {
    maxDepth = 9;
    timeLimitMs = 7000;
  }

  return algorithmMove(board, player, aiPlayer, moveHistory, { maxDepth, timeLimitMs });
}

export default { getMove };
