
import type { Board, Engine, EngineRequest, EngineResponse, Player, Position } from '../../types';
import { getValidMoves } from '../../core/gameCore';
import { getMove as getHardMove } from './hard';
import type { NumericBoard, NumericPlayer } from './ai';

function toNumericPlayer(player: Player): NumericPlayer {
  return player === 'black' ? 1 : 2;
}

function toNumericBoard(board: Board): NumericBoard {
  return board.map((row) =>
    row.map((cell) => (cell === 'black' ? 1 : cell === 'white' ? 2 : 0))
  ) as NumericBoard;
}

function toPosition(move: { row: number; col: number } | null | undefined): Position | undefined {
  if (!move) return undefined;
  return { row: move.row, col: move.col };
}

const harangEngine: Engine = {
  name: 'Harang AI',
  version: '1.0.0',
  author: 'Harang Project',

  async analyze(request: EngineRequest): Promise<EngineResponse> {
    const { gameCore, timeLimit, depth, skill } = request;
    const { board, currentPlayer } = gameCore;

    const numericBoard = toNumericBoard(board);
    const aiPlayer = toNumericPlayer(currentPlayer);
    const moveHistory: { row: number; col: number }[] = [];

    const maxDepth = depth ?? Math.min(12, Math.max(7, Math.floor((skill ?? 60) / 8)));
    const timeLimitMs = timeLimit ?? 6000;

    const best = await getHardMove(numericBoard, aiPlayer, aiPlayer, moveHistory, {
      maxDepth,
      timeLimitMs,
    } as any);

    const bestMove = toPosition(best);

    // We do not have a reliable evaluation score from Harang’s API.
    // Fallbacks keep the interface contract while signalling lack of info.
    const evaluation = 0;
    const nodes = 0;
    const resultDepth = maxDepth;

    if (!bestMove) {
      const fallback = getValidMoves(board, currentPlayer)[0];
      return {
        bestMove: fallback,
        evaluation,
        nodes,
        depth: resultDepth,
        timeUsed: timeLimitMs,
      };
    }

    return {
      bestMove,
      evaluation,
      nodes,
      depth: resultDepth,
      timeUsed: timeLimitMs,
    };
  },
};

export default harangEngine;
