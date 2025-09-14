export type Disc = -1 | 0 | 1; // -1: White, 1: Black, 0: Empty
export type Player = -1 | 1;

export interface Move {
  x: number; // 0..7
  y: number; // 0..7
}

export type Board = Disc[][]; // 8x8

export interface GameState {
  board: Board;
  current: Player; // whose turn
}

export interface EngineRequest {
  state: GameState;
  timeLimitMs?: number;
  skill?: number;
}

export interface EngineResponse {
  move?: Move; // best move, if any
  nodes?: number; // nodes searched or evaluated
  evaluation?: number; // + good for Black, - good for White
  stats?: Record<string, unknown>;
}

export interface Engine {
  analyze(req: EngineRequest): Promise<EngineResponse>;
}

