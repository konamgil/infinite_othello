
import type { Board, Engine, EngineRequest, EngineResponse, Player, Position } from '../../types';
import './dist/edax.js';

// Edax WASM module exposes a global `Module` symbol when loaded.
// We declare the minimal surface we rely on so TypeScript is happy.
declare const Module: {
  onRuntimeInitialized?: () => void;
  cwrap: (name: string, returnType: string | null, argTypes: (string | null)[]) => (...args: unknown[]) => unknown;
};

type EdaxSolveFn = (fen: string, level: number) => string;

let edaxReady: Promise<void> | null = null;
let edaxSolve: EdaxSolveFn | null = null;

function ensureEdax(): Promise<void> {
  if (edaxReady) {
    return edaxReady;
  }

  edaxReady = new Promise<void>((resolve, reject) => {
    if (typeof Module === 'undefined') {
      reject(new Error('Edax WASM module is not available.'));
      return;
    }

    Module.onRuntimeInitialized = () => {
      try {
        const initEngine = Module.cwrap('init_engine', null, []);
        initEngine();
        const solver = Module.cwrap('edax_solve', 'string', ['string', 'number']);
        edaxSolve = (fen: string, level: number) => String(solver(fen, level));
        resolve();
      } catch (error) {
        reject(error as Error);
      }
    };
  });

  return edaxReady;
}

function flattenBoard(board: Board): number[] {
  const out: number[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board[row][col];
      out.push(cell === 'black' ? 1 : cell === 'white' ? 2 : 0);
    }
  }
  return out;
}

function boardToFen(flatBoard: number[], currentPlayer: Player): string {
  let fen = '';
  for (let r = 0; r < 8; r++) {
    let emptyCount = 0;
    for (let c = 0; c < 8; c++) {
      const piece = flatBoard[r * 8 + c];
      if (piece === 0) {
        emptyCount += 1;
      } else {
        if (emptyCount > 0) {
          fen += emptyCount;
          emptyCount = 0;
        }
        const isCurrentBlack = currentPlayer === 'black';
        if (isCurrentBlack) {
          fen += piece === 1 ? 'p' : 'P';
        } else {
          fen += piece === 2 ? 'p' : 'P';
        }
      }
    }
    if (emptyCount > 0) {
      fen += emptyCount;
    }
    if (r < 7) {
      fen += '/';
    }
  }
  fen += currentPlayer === 'black' ? ' b' : ' w';
  return fen;
}

function moveStringToPosition(moveStr: string | null | undefined): Position | null {
  if (!moveStr || moveStr === 'pass' || moveStr === 'null') {
    return null;
  }
  const col = moveStr.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = parseInt(moveStr.substring(1), 10) - 1;
  if (Number.isNaN(row) || Number.isNaN(col) || row < 0 || row >= 8 || col < 0 || col >= 8) {
    return null;
  }
  return { row, col };
}

function mapSkillToDepth(skill?: number): number {
  if (typeof skill !== 'number') {
    return 10;
  }
  const clamped = Math.max(0, Math.min(100, skill));
  return Math.max(6, Math.min(20, Math.round(6 + (clamped / 100) * 14)));
}

const edaxEngine: Engine = {
  name: 'Edax WASM',
  version: '1.0.0',
  author: 'Edax Project / Infinity Othello',

  async analyze(request: EngineRequest): Promise<EngineResponse> {
    const start = performance.now();
    await ensureEdax();

    if (!edaxSolve) {
      throw new Error('Edax solver not initialised');
    }

    const flat = flattenBoard(request.gameCore.board);
    const fen = boardToFen(flat, request.gameCore.currentPlayer);
    const depth = mapSkillToDepth(request.skill ?? (request.depth ? request.depth * 2 : undefined));

    const moveStr = edaxSolve(fen, depth);
    const bestMove = moveStringToPosition(moveStr);
    const timeUsed = performance.now() - start;

    return {
      bestMove: bestMove ?? undefined,
      evaluation: 0, // Edax solver binding currently returns only the move
      nodes: 0,
      depth,
      timeUsed,
    };
  },

  stop() {
    // Edax WASM API does not expose an explicit stop function.
  },
};

export default edaxEngine;
