
import type { NumericBoard, NumericPlayer } from './ai';
import { getMove as runAlgorithm } from './algorithm';

export function getMove(
  board: NumericBoard,
  player: NumericPlayer,
  aiPlayer: NumericPlayer,
  moveHistory: { row: number; col: number }[],
): Promise<{ row: number; col: number } | null> {
  const moveCount = moveHistory.length;
  const emptySquares = board.reduce(
    (count, row) => count + row.filter((cell) => cell === 0).length,
    0,
  );

  let maxDepth = 10;
  let timeLimitMs = 9000;

  if (emptySquares <= 16) {
    maxDepth = 11;
    timeLimitMs = 8000;
  } else if (moveCount < 12 || emptySquares > 44) {
    maxDepth = 9;
    timeLimitMs = 7000;
  }

  return runAlgorithm(board, player, aiPlayer, moveHistory, { maxDepth, timeLimitMs });
}

export default { getMove };
