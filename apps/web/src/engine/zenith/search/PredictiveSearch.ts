// Predictive Search System for Engine Zenith — Fixed & Pragmatic MC Rollout
// - Legal move gen & flipping
// - Pass/terminal handling
// - ε-greedy playout policy with X/C risk
// - Scenario probability via softmax(score)
// - Best path = highest-score playout (simple but consistent)
// - getMoveValue: start-move frequency × scenario probability
//
// Assumed types:
//   Board: (Player | null)[][]
//   Player: 'black' | 'white'
//   Position: { row: number; col: number; }
//   PredictiveInsights: {
//     scenarios: Board[]; probabilities: number[]; bestPaths: Position[][];
//     summary: string; getMoveValue(move: Position): number;
//   }

import type { Board, Player, Position } from '../../../types';
import { ensureBoard, computeZobristHash } from '../../../core';
import type { PredictiveInsights } from '../index';

export interface ScenarioData {
  board: Board;
  moves: Position[];   // from root perspective (alternating players)
  score: number;       // rollout score
  depth: number;
  probability: number; // filled after softmax
}

export interface PredictionHistory {
  timestamp: number;
  board: Board;
  player: Player;
  insights: PredictiveInsights;
  accuracy: number;
}

export interface PredictionStats {
  totalPredictions: number;
  averageAccuracy: number;
  cacheSize: number;
  averageScenarios: number;
}

export class PredictiveSearch {
  private scenarioCache: Map<string, ScenarioData[]> = new Map();
  private predictionHistory: PredictionHistory[] = [];

  // playout params
  private SCENARIOS = 24;      // number of rollouts
  private MAX_DEPTH = 16;      // playout depth cap (in plies)
  private EPSILON = 0.25;      // ε-greedy

  constructor() {
    this.initializePredictionModels();
  }

  analyzeFutureScenarios(board: Board, player: Player, depth: number): PredictiveInsights {
    // 입력 검증
    if (!board || !player || typeof depth !== 'number' || depth < 0) {
      console.warn('PredictiveSearch: 잘못된 입력 매개변수');
      return this.getDefaultInsights();
    }

    const d = Math.min(depth, this.MAX_DEPTH);
    const scenariosData = this.generateScenarios(board, player, d);

    // softmax over scenario scores to get probabilities
    const probs = this.softmax(scenariosData.map(s => s.score));
    scenariosData.forEach((s, i) => (s.probability = probs[i]));

    const scenarios = scenariosData.map(s => s.board);
    const probabilities = scenariosData.map(s => s.probability);

    // bestPaths: pick top-K paths (here, all; first is best)
    const sorted = [...scenariosData].sort((a, b) => b.score - a.score);
    const bestPaths = sorted.map(s => s.moves);

    const insights: PredictiveInsights = {
      scenarios,
      probabilities,
      bestPaths,
      summary: this.generateSummary(scenarios, probabilities, bestPaths),
      getMoveValue: (move: Position) => this.getMoveValue(move, scenariosData)
    };

    this.storePrediction(insights, board, player);
    return insights;
  }

  // ---------------------------------------------------------------------
  // Scenario generation (MC rollouts with ε-greedy)
  // ---------------------------------------------------------------------
  private generateScenarios(board: Board, player: Player, depth: number): ScenarioData[] {
    const key = this.generateCacheKey(board, player, depth);
    const cached = this.scenarioCache.get(key);
    if (cached) return cached;

    const scenarios: ScenarioData[] = [];
    for (let i = 0; i < this.SCENARIOS; i++) {
      scenarios.push(this.simulateGame(board, player, depth));
    }

    this.scenarioCache.set(key, scenarios);
    return scenarios;
  }

  private simulateGame(rootBoard: Board, rootPlayer: Player, maxDepth: number): ScenarioData {
    let board = this.copyBoard(rootBoard);
    let player = rootPlayer;
    const moves: Position[] = [];

    let ply = 0;
    let passes = 0;

    while (ply < maxDepth) {
      const legal = this.getValidMoves(board, player);
      if (legal.length === 0) {
        passes++;
        if (passes === 2) break; // both passed -> terminal
        player = this.getOpponent(player);
        ply++;
        continue;
      }
      passes = 0;

      const move = this.selectMoveEpsilonGreedy(board, player, legal);
      const next = this.makeMove(board, move, player);
      if (!next) {
        // should not happen if legal, but guard
        break;
      }

      board = next;
      moves.push(move);
      player = this.getOpponent(player);
      ply++;
    }

    // rollout score from root perspective
    const score = this.evaluateBoard(board, rootPlayer);

    return {
      board,
      moves,
      score,
      depth: moves.length,
      probability: 0
    };
  }

  // ε-greedy: with prob ε random; else pick best by quick heuristic
  private selectMoveEpsilonGreedy(board: Board, player: Player, legal: Position[]): Position {
    if (Math.random() < this.EPSILON) {
      return legal[Math.floor(Math.random() * legal.length)];
    }
    let best = legal[0];
    let bestV = -Infinity;
    for (const m of legal) {
      const v = this.quickMoveHeuristic(board, player, m);
      if (v > bestV) { bestV = v; best = m; }
    }
    return best;
  }

  // quick heuristic for playout policy (cheap but Othello-aware)
  private quickMoveHeuristic(board: Board, player: Player, move: Position): number {
    // Positional weight + X/C risk (if corner empty) + mobility delta (cheap)
    const pos = this.getPositionalWeight(move.row, move.col);
    const risk = this.xcRisk(move, board);
    const temp = this.makeMove(board, move, player);
    if (!temp) return -999;

    const myMoves = this.getValidMoves(temp, player).length;
    const opMoves = this.getValidMoves(temp, this.getOpponent(player)).length;

    return pos - risk + (myMoves - opMoves) * 2;
  }

  private xcRisk(move: Position, board: Board): number {
    // Penalize X/C only when corresponding corner is empty
    const { row, col } = move;
    // X
    const x = [[1,1,0,0],[1,6,0,7],[6,1,7,0],[6,6,7,7]];
    for (const [r,c,cr,cc] of x) {
      if (row === r && col === c && board[cr][cc] === null) return 30;
    }
    // C
    const cgs = [
      { corner:[0,0], cells:[[0,1],[1,0]] },
      { corner:[0,7], cells:[[0,6],[1,7]] },
      { corner:[7,0], cells:[[6,0],[7,1]] },
      { corner:[7,7], cells:[[6,7],[7,6]] },
    ];
    for (const g of cgs) {
      const [cr,cc] = g.corner;
      if (board[cr][cc] !== null) continue;
      for (const [r,c] of g.cells) if (row === r && col === c) return 18;
    }
    return 0;
  }

  // ---------------------------------------------------------------------
  // Scenario probability & value
  // ---------------------------------------------------------------------
  private softmax(xs: number[]): number[] {
    if (xs.length === 0) return [];
    const max = Math.max(...xs);
    const exps = xs.map(v => Math.exp((v - max) / 100)); // temperature=100 (tune)
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / (sum || 1));
  }

  private getMoveValue(move: Position, scenarios: ScenarioData[]): number {
    // weight: sum(probability) over scenarios whose first move == move
    // + small bonus for appearance anywhere in bestPath (later moves)
    let v = 0;
    for (const s of scenarios) {
      if (s.moves.length > 0) {
        const first = s.moves[0];
        if (first.row === move.row && first.col === move.col) {
          v += s.probability * 100;
        } else if (s.moves.some(m => m.row === move.row && m.col === move.col)) {
          v += s.probability * 20;
        }
      }
    }
    return v;
  }

  private generateSummary(scenarios: Board[], probabilities: number[], paths: Position[][]): string {
    const n = scenarios.length || 1;
    const avgP = probabilities.reduce((a,b)=>a+b,0) / n;
    const avgL = paths.reduce((a,p)=>a+p.length,0) / n;
    return `Scenarios=${n}, avgP=${(avgP*100).toFixed(1)}%, avgLen=${avgL.toFixed(1)}`;
  }

  private storePrediction(insights: PredictiveInsights, board: Board, player: Player): void {
    const prediction: PredictionHistory = {
      timestamp: Date.now(),
      board: this.copyBoard(board),
      player,
      insights,
      accuracy: 0
    };
    this.predictionHistory.push(prediction);
    if (this.predictionHistory.length > 200) this.predictionHistory.shift();
  }

  getPredictionStats(): PredictionStats {
    const n = this.predictionHistory.length || 1;
    return {
      totalPredictions: this.predictionHistory.length,
      averageAccuracy: this.predictionHistory.reduce((s,p)=>s+p.accuracy,0) / n,
      cacheSize: this.scenarioCache.size,
      averageScenarios: this.predictionHistory.reduce((s,p)=>s+p.insights.scenarios.length,0) / n
    };
  }

  private initializePredictionModels(): void {
    // hook for future learned policies/value heads
  }

  private getDefaultInsights(): PredictiveInsights {
    return {
      scenarios: [],
      probabilities: [],
      bestPaths: [],
      summary: '예측 실패',
      getMoveValue: () => 0
    };
  }

  // ---------------------------------------------------------------------
  // Real Othello mechanics (2D; swap to bitboards later)
  // ---------------------------------------------------------------------
  private getValidMoves(board: Board, player: Player): Position[] {
    const ms: Position[] = [];
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
      if (board[r][c] !== null) continue;
      if (this.isValidMove(board, {row:r,col:c}, player)) ms.push({row:r,col:c});
    }
    return ms;
  }

  private isValidMove(board: Board, m: Position, player: Player): boolean {
    const { row, col } = m;
    if (board[row][col] !== null) return false;
    const opp = this.getOpponent(player);
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr,dc] of dirs) if (this.canFlip(board, row, col, dr, dc, player, opp)) return true;
    return false;
  }

  private canFlip(board: Board, row:number, col:number, dr:number, dc:number, me:Player, opp:Player): boolean {
    let r=row+dr, c=col+dc, seenOpp=false;
    while (r>=0&&r<8&&c>=0&&c<8) {
      const cell = board[r][c];
      if (cell === opp) seenOpp=true;
      else if (cell === me) return seenOpp;
      else break;
      r+=dr; c+=dc;
    }
    return false;
  }

  private makeMove(board: Board, m: Position, player: Player): Board | null {
    if (!this.isValidMove(board, m, player)) return null;
    const nb = this.copyBoard(board);
    nb[m.row][m.col] = player;
    const opp = this.getOpponent(player);
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr,dc] of dirs) {
      const flips = this.collectFlips(nb, m.row, m.col, dr, dc, player, opp);
      for (const f of flips) nb[f.row][f.col] = player;
    }
    return nb;
  }

  private collectFlips(board: Board, row:number, col:number, dr:number, dc:number, me:Player, opp:Player): Position[] {
    const acc: Position[] = [];
    let r=row+dr, c=col+dc;
    while (r>=0&&r<8&&c>=0&&c<8) {
      const cell = board[r][c];
      if (cell === opp) {
        acc.push({row:r,col:c});
      } else if (cell === me) {
        return acc.length ? acc : [];
      } else break;
      r+=dr; c+=dc;
    }
    return [];
  }

  private evaluateBoard(board: Board, me: Player): number {
    // Cheap but informative: positional + mobility + disc diff (endgame-ish)
    const opp = this.getOpponent(me);
    let pos = 0, myDiscs=0, opDiscs=0;

    for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
      const cell = board[r][c];
      if (cell === me) { pos += this.getPositionalWeight(r,c); myDiscs++; }
      else if (cell === opp) { pos -= this.getPositionalWeight(r,c); opDiscs++; }
    }

    const myMoves = this.getValidMoves(board, me).length;
    const opMoves = this.getValidMoves(board, opp).length;

    const discDiff = myDiscs - opDiscs;
    const mobility = (myMoves - opMoves) * 4;

    // blend; tune as needed
    return pos + mobility + discDiff * 1.5;
  }

  private getPositionalWeight(row:number, col:number): number {
    const w = [
      [120,-20, 20,  5,  5, 20,-20,120],
      [-20,-40,-5, -5, -5, -5,-40,-20],
      [ 20, -5, 15,  3,  3, 15, -5, 20],
      [  5, -5,  3,  3,  3,  3, -5,  5],
      [  5, -5,  3,  3,  3,  3, -5,  5],
      [ 20, -5, 15,  3,  3, 15, -5, 20],
      [-20,-40,-5, -5, -5, -5,-40,-20],
      [120,-20, 20,  5,  5, 20,-20,120],
    ];
    return w[row][col];
  }

  private copyBoard(board: Board): Board {
    return board.map(r => [...r]);
  }

  private generateCacheKey(board: Board, player: Player, depth: number): string {
    const bb = ensureBoard(board);
    const h = computeZobristHash(bb, player);
    return `${player}_${depth}_${h}`;
  }

  private getOpponent(p: Player): Player {
    return p === 'black' ? 'white' : 'black';
  }
}
