import type { Engine, EngineRequest, EngineResponse, Move } from "shared-types";
import { getValidMoves } from "core";

function pick<T>(arr: T[]): T | undefined {
  if (!arr.length) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

const engine: Engine = {
  async analyze(req: EngineRequest): Promise<EngineResponse> {
    const moves: Move[] = getValidMoves(req.state);
    const move = pick(moves);
    return { move, nodes: moves.length, evaluation: 0 };
  },
};

export default engine;

