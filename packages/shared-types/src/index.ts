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

// === 리플레이 시스템 타입들 ===

export interface Position {
  x: number;
  y: number;
}

export interface GameMove {
  position: Position;
  player: Player;
  timestamp: number;
  capturedDiscs: Position[];
}

export interface MoveAnalysis {
  position: Position;
  evaluation: number; // -100 ~ +100 (+ 좋음 for Black, - 좋음 for White)
  category: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  alternatives: {
    move: Position;
    evaluation: number;
    reason: string;
  }[];
  comment: string;
}

export interface GameResult {
  winner: Player | 'draw';
  blackScore: number;
  whiteScore: number;
  endReason: 'normal' | 'forfeit' | 'timeout';
}

export interface GameRecord {
  id: string;
  date: Date;
  mode: 'tower' | 'ranked' | 'quick' | 'practice';
  opponent: {
    name: string;
    type: 'ai' | 'human';
    difficulty?: string;
    rank?: string;
  };
  player: {
    color: Player;
    name: string;
    rank?: string;
  };
  moves: GameMove[];
  result: GameResult;
  duration: number; // seconds
  aiAnalysis?: MoveAnalysis[];
  tags?: string[];
}

export interface GameReplay {
  record: GameRecord;
  currentMoveIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
}

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalPlayTime: number; // seconds
  averageGameTime: number; // seconds
  analyzedGames: number;
}

