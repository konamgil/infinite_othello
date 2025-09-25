import type { Engine, EngineRequest, EngineResponse, Position } from "../../types";
import { getValidMoves } from "../../core";

function pick<T>(arr: T[]): T | undefined {
  if (!arr.length) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

const engine: Engine = {
  name: "Random Engine",
  version: "1.0.0",
  author: "Infinite Othello",

  async analyze(req: EngineRequest): Promise<EngineResponse> {
    // Get valid moves using new game logic
    const moves = Array.from(getValidMoves(req.gameCore.board, req.gameCore.currentPlayer));
    const bestMove = pick(moves);

    return {
      bestMove,
      evaluation: 0, // Random engine doesn't evaluate
      nodes: moves.length,
      depth: 1,
      timeUsed: 1, // Minimal time for random selection
      pv: bestMove ? [bestMove] : undefined
    };
  }
};

export default engine;

