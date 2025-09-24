// AI search worker supporting multiple engines with distributed root evaluation
// Supports parallel search with smart work distribution across multiple workers

import type {
  Engine,
  EngineRequest,
  EngineResponse,
  GameCore,
  Player,
  Position,
  AIDifficulty
} from 'shared-types';

// Dynamic engine imports for code splitting
type EngineModule = {
  default: Engine;
};

type InternalSearchResult = Omit<SearchResponse, 'id' | 'success' | 'timeUsed'> & {
  timeUsed?: number;
};

// Worker message types
export interface SearchRequest {
  id: string;
  gameCore: GameCore;
  player: Player;
  options: SearchOptions;
  rootMoves?: readonly Position[]; // For distributed search
}

export interface SearchOptions {
  timeLimit?: number; // ms
  depth?: number;
  difficulty?: AIDifficulty;
  engineName?: string;
}

export interface SearchResponse {
  id: string;
  success: true;
  bestMove: Position | null;
  evaluation: number;
  nodes: number;
  depth: number;
  timeUsed: number;
  pv?: Position[];
}

export interface SearchError {
  id: string;
  success: false;
  error: string;
  timeUsed: number;
}

type SearchResult = SearchResponse | SearchError;

// Engine registry
class EngineRegistry {
  private engines = new Map<string, Promise<Engine>>();

  async getEngine(name: string, difficulty: AIDifficulty = 'medium'): Promise<Engine> {
    const key = `${name}-${difficulty}`;

    if (!this.engines.has(key)) {
      const enginePromise = this.loadEngine(name, difficulty);
      this.engines.set(key, enginePromise);
    }

    return this.engines.get(key)!;
  }

  private async loadEngine(name: string, difficulty: AIDifficulty): Promise<Engine> {
    try {
      let engineModule: EngineModule;

      switch (name.toLowerCase()) {
        case 'random':
        case 'engine-a':
          engineModule = await import('../../engine-a/src/index');
          break;

        case 'neo':
        case 'engine-neo':
        case 'engine neo':
          engineModule = await import('../../engine-neo/src/index');
          break;

        default:
          // Fallback to engine-a (random)
          engineModule = await import('../../engine-a/src/index');
          break;
      }

      return engineModule.default;
    } catch (error) {
      console.warn(`Failed to load engine ${name}, falling back to random:`, error);
      const fallbackModule = await import('../../engine-a/src/index');
      return fallbackModule.default;
    }
  }
}

const engineRegistry = new EngineRegistry();

// Utility functions
function now(): number {
  return (typeof performance !== 'undefined' && performance.now)
    ? performance.now()
    : Date.now();
}

function normalizePosition(pos: any): Position | null {
  if (!pos) return null;
  if (typeof pos.row === 'number' && typeof pos.col === 'number') {
    return { row: pos.row, col: pos.col };
  }
  if (Array.isArray(pos) && pos.length >= 2) {
    return { row: pos[0], col: pos[1] };
  }
  return null;
}

// Main search functions
async function runFullSearch(
  request: SearchRequest
): Promise<InternalSearchResult> {
  const engine = await engineRegistry.getEngine(
    request.options.engineName || 'random',
    request.options.difficulty
  );

  const engineRequest: EngineRequest = {
    gameCore: request.gameCore,
    timeLimit: request.options.timeLimit,
    depth: request.options.depth,
    skill: difficultyToSkill(request.options.difficulty)
  };

  const response = await engine.analyze(engineRequest);

  return {
    bestMove: response.bestMove || null,
    evaluation: response.evaluation,
    nodes: response.nodes,
    depth: response.depth,
    timeUsed: response.timeUsed,
    pv: response.pv ? Array.from(response.pv) : undefined
  };
}

async function runDistributedSearch(
  request: SearchRequest
): Promise<InternalSearchResult> {
  const { rootMoves = [], options } = request;
  const rootMoveList = Array.from(rootMoves);

  if (rootMoveList.length === 0) {
    throw new Error('No root moves provided for distributed search');
  }

  const engine = await engineRegistry.getEngine(
    options.engineName || 'random',
    options.difficulty
  );

  // Distribute time budget across root moves
  const timePerMove = options.timeLimit
    ? Math.max(100, Math.floor(options.timeLimit / rootMoveList.length))
    : undefined;

  let bestMove: Position | null = null;
  let bestEvaluation = -Infinity;
  let totalNodes = 0;
  let maxDepth = 0;
  let combinedPV: Position[] = [];

  // Evaluate each root move
  for (const rootMove of rootMoveList) {
    try {
      // Create a copy of game state and apply the root move
      const testGameCore = applyMoveToGameCore(request.gameCore, rootMove, request.player);

      // Search from opponent's perspective (negated evaluation)
      const engineRequest: EngineRequest = {
        gameCore: testGameCore,
        timeLimit: timePerMove,
        depth: options.depth,
        skill: difficultyToSkill(options.difficulty)
      };

      const response = await engine.analyze(engineRequest);

      // Negate evaluation since we're searching from opponent's perspective
      const evaluation = -response.evaluation;

      totalNodes += response.nodes;
      maxDepth = Math.max(maxDepth, response.depth);

      if (evaluation > bestEvaluation) {
        bestEvaluation = evaluation;
        bestMove = rootMove;
        const variation = response.pv ? Array.from(response.pv) : [];
        combinedPV = [rootMove, ...variation];
      }
    } catch (error) {
      console.warn(`Failed to evaluate root move ${rootMove.row},${rootMove.col}:`, error);
      continue;
    }
  }

  return {
    bestMove,
    evaluation: bestEvaluation,
    nodes: totalNodes,
    depth: maxDepth,
    pv: combinedPV
  };
}

// Helper functions
function difficultyToSkill(difficulty: AIDifficulty = 'medium'): number {
  const skillMap: Record<AIDifficulty, number> = {
    'easy': 25,
    'medium': 50,
    'hard': 75,
    'expert': 90,
    'master': 100
  };
  return skillMap[difficulty] || 50;
}

function applyMoveToGameCore(gameCore: GameCore, move: Position, player: Player): GameCore {
  // This is a simplified version - in real implementation, you'd use the actual game logic
  // For now, we'll create a basic copy with the move applied
  // This should be replaced with actual move application logic from your game core

  const newBoard = gameCore.board.map(row => [...row]);
  // Apply the move logic here...

  return {
    ...gameCore,
    board: newBoard,
    currentPlayer: player === 'black' ? 'white' : 'black',
    // Update other fields as needed
  };
}

// Worker message handler
self.onmessage = async (event: MessageEvent<SearchRequest>) => {
  const request = event.data;
  const startTime = now();

  try {
    const result = request.rootMoves && request.rootMoves.length > 0
      ? await runDistributedSearch(request)
      : await runFullSearch(request);

    const elapsed = now() - startTime;

    const response: SearchResponse = {
      id: request.id,
      success: true,
      ...result,
      timeUsed: result.timeUsed ?? elapsed
    };

    self.postMessage(response);
  } catch (error) {
    const errorResponse: SearchError = {
      id: request.id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timeUsed: now() - startTime
    };

    self.postMessage(errorResponse);
  }
};

// Export types for use in main thread
export type { SearchResult };
