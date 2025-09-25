// Principal Variation Search (PVS) implementation
// Converted from search-neo.js PVS algorithm

import type { Board, Player, Position } from '../../../types';
import { TranspositionTable, TTFlag, type TTEntry } from '../optimization/transTable';
import { KillerMoves, HistoryTable, orderMoves, type MoveOrderingContext } from '../ordering/moveOrdering';
import { evaluateBoard, isEndgamePhase } from '../evaluation/heuristic';
import { getCurrentMobility } from '../evaluation/mobility';
import { getValidMoves } from '../../../core/gameCore';
import { getLevelConfig, getSelectivitySettings, STABILITY_THRESHOLDS, PRUNING_PARAMS } from '../config/selectivity';

export interface SearchResult {
  bestMove?: Position;
  score: number;
  depth: number;
  nodes: number;
  time: number;
  pv: Position[];
  ttHits: number;
  ttStores: number;
}

export interface SearchConfig {
  level: number;
  timeLimit?: number;
  depthLimit?: number;
  enableTT: boolean;
  enableKillers: boolean;
  enableHistory: boolean;
}

/**
 * Principal Variation Search Engine
 */
export class PVSEngine {
  private tt: TranspositionTable;
  private killers: KillerMoves;
  private history: HistoryTable;
  private nodes = 0;
  private ttHits = 0;
  private ttStores = 0;
  private startTime = 0;
  private timeLimit = Infinity;

  constructor() {
    this.tt = new TranspositionTable(200000);
    this.killers = new KillerMoves();
    this.history = new HistoryTable();
  }

  /**
   * Main search entry point
   */
  search(
    board: Board,
    player: Player,
    config: SearchConfig
  ): SearchResult {
    this.initializeSearch(config);

    const empties = this.countEmptySquares(board);
    const levelConfig = getLevelConfig(config.level, empties);
    const selectivitySettings = getSelectivitySettings(levelConfig.selectivity);

    let bestMove: Position | undefined;
    let bestScore = -Infinity;
    let pv: Position[] = [];

    // Iterative deepening
    for (let depth = 1; depth <= levelConfig.depth; depth++) {
      if (this.shouldStop()) break;

      const result = this.pvs(
        board,
        player,
        depth,
        -Infinity,
        Infinity,
        0,
        true,
        selectivitySettings
      );

      if (!this.shouldStop()) {
        bestMove = result.move;
        bestScore = result.score;
        pv = result.pv;
      }
    }

    return {
      bestMove,
      score: bestScore,
      depth: levelConfig.depth,
      nodes: this.nodes,
      time: Date.now() - this.startTime,
      pv,
      ttHits: this.ttHits,
      ttStores: this.ttStores
    };
  }

  /**
   * Principal Variation Search with alpha-beta pruning
   */
  private pvs(
    board: Board,
    player: Player,
    depth: number,
    alpha: number,
    beta: number,
    ply: number,
    isPV: boolean,
    settings: any
  ): { score: number; move?: Position; pv: Position[] } {
    this.nodes++;

    // Terminal conditions
    if (depth <= 0) {
      return {
        score: this.quiescenceSearch(board, player, alpha, beta, ply),
        move: undefined,
        pv: []
      };
    }

    if (this.shouldStop()) {
      return { score: evaluateBoard(board, player), move: undefined, pv: [] };
    }

    // Transposition table lookup
    const ttKey = this.generateBoardKey(board, player);
    const ttEntry = this.tt.get(ttKey);
    let ttMove: Position | undefined;

    if (ttEntry && this.tt.isUsable(ttEntry, depth)) {
      this.ttHits++;
      const cutoff = this.tt.providesScoreCutoff(ttEntry, alpha, beta, depth);

      if (cutoff.cutoff && cutoff.score !== undefined) {
        return { score: cutoff.score, move: ttEntry.bestMove, pv: [] };
      }

      if (cutoff.newAlpha !== undefined) alpha = cutoff.newAlpha;
      if (cutoff.newBeta !== undefined) beta = cutoff.newBeta;
      ttMove = ttEntry.bestMove;
    }

    // Generate and order moves
    const moves = getValidMoves(board, player);
    if (moves.length === 0) {
      // Pass move or game over
      const opponent = player === 'black' ? 'white' : 'black';
      const opponentMoves = getValidMoves(board, opponent);

      if (opponentMoves.length === 0) {
        // Game over - count material
        return { score: this.evaluateGameEnd(board, player), move: undefined, pv: [] };
      } else {
        // Pass - search opponent
        const result = this.pvs(board, opponent, depth - 1, -beta, -alpha, ply + 1, isPV, settings);
        return { score: -result.score, move: undefined, pv: result.pv };
      }
    }

    const orderedMoves = orderMoves(moves, {
      ply,
      player,
      board,
      killers: this.killers,
      history: this.history,
      ttBestMove: ttMove
    });

    let bestMove: Position | undefined;
    let bestScore = -Infinity;
    let pv: Position[] = [];
    let moveCount = 0;

    for (const move of orderedMoves) {
      // Late move pruning
      if (this.shouldPruneMove(moveCount, depth, alpha, beta, settings)) {
        break;
      }

      const newBoard = this.makeMove(board, move, player);
      const opponent = player === 'black' ? 'white' : 'black';
      let score: number;

      if (moveCount === 0) {
        // Principal variation - full window search
        const result = this.pvs(newBoard, opponent, depth - 1, -beta, -alpha, ply + 1, isPV, settings);
        score = -result.score;
        if (score > alpha) {
          pv = [move, ...result.pv];
        }
      } else {
        // Late move reduction
        let reduction = 0;
        if (this.shouldReduceMove(moveCount, depth, move, settings)) {
          reduction = Math.floor(settings.lmrBase + Math.log(depth) * Math.log(moveCount) / 3);
          reduction = Math.max(0, Math.min(reduction, depth - 2));
        }

        // Null window search
        const result = this.pvs(
          newBoard,
          opponent,
          depth - 1 - reduction,
          -alpha - 1,
          -alpha,
          ply + 1,
          false,
          settings
        );
        score = -result.score;

        // Re-search if necessary
        if (score > alpha && score < beta && (reduction > 0 || !isPV)) {
          const fullResult = this.pvs(newBoard, opponent, depth - 1, -beta, -alpha, ply + 1, isPV, settings);
          score = -fullResult.score;
          if (score > alpha) {
            pv = [move, ...fullResult.pv];
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }

      if (score > alpha) {
        alpha = score;
        if (!pv.length) pv = [move];
      }

      if (alpha >= beta) {
        // Beta cutoff - killer move
        this.killers.addKiller(ply, move);
        this.history.updateHistory(move, player, depth);
        break;
      }

      moveCount++;
    }

    // Store in transposition table
    if (bestMove) {
      const entry = this.tt.createEntry(depth, bestScore, bestMove, alpha, beta);
      this.tt.set(ttKey, entry);
      this.ttStores++;
    }

    return { score: bestScore, move: bestMove, pv };
  }

  /**
   * Quiescence search for tactical stability
   */
  private quiescenceSearch(
    board: Board,
    player: Player,
    alpha: number,
    beta: number,
    ply: number
  ): number {
    this.nodes++;

    const standPat = evaluateBoard(board, player);
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;

    const moves = getValidMoves(board, player);
    if (moves.length === 0) return standPat;

    // Only search tactical moves in quiescence
    const tacticalMoves = this.filterTacticalMoves(moves, board);

    for (const move of tacticalMoves) {
      const newBoard = this.makeMove(board, move, player);
      const opponent = player === 'black' ? 'white' : 'black';
      const score = -this.quiescenceSearch(newBoard, opponent, -beta, -alpha, ply + 1);

      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }

    return alpha;
  }

  private initializeSearch(config: SearchConfig): void {
    this.nodes = 0;
    this.ttHits = 0;
    this.ttStores = 0;
    this.startTime = Date.now();
    this.timeLimit = config.timeLimit || Infinity;
    this.tt.bumpAge();
  }

  private shouldStop(): boolean {
    return Date.now() - this.startTime >= this.timeLimit;
  }

  private shouldPruneMove(
    moveCount: number,
    depth: number,
    alpha: number,
    beta: number,
    settings: any
  ): boolean {
    if (depth >= 6 && moveCount >= PRUNING_PARAMS.LMP_TABLE[Math.min(depth, 6)] + settings.lmpBonus) {
      return true;
    }
    return false;
  }

  private shouldReduceMove(
    moveCount: number,
    depth: number,
    move: Position,
    settings: any
  ): boolean {
    return depth >= 3 && moveCount >= 4 && !this.isImportantMove(move);
  }

  private isImportantMove(move: Position): boolean {
    const { row, col } = move;
    return (row === 0 || row === 7) && (col === 0 || col === 7);
  }

  private filterTacticalMoves(moves: Position[], board: Board): Position[] {
    return moves.filter(move => this.isImportantMove(move)).slice(0, 4);
  }

  private makeMove(board: Board, move: Position, player: Player): Board {
    // Use core makeMove for proper game logic with flipping
    const { makeMove } = require('../../core');
    const gameCore = {
      board,
      currentPlayer: player,
      gamePhase: 'midgame' as const
    };

    const result = makeMove(gameCore, move);
    return result.success ? result.newGameCore!.board : board;
  }

  private generateBoardKey(board: Board, player: Player): string {
    return `${JSON.stringify(board)}_${player}`;
  }

  private countEmptySquares(board: Board): number {
    let count = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === null) count++;
      }
    }
    return count;
  }

  private evaluateGameEnd(board: Board, player: Player): number {
    let playerCount = 0;
    let opponentCount = 0;
    const opponent = player === 'black' ? 'white' : 'black';

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = board[r][c];
        if (cell === player) playerCount++;
        else if (cell === opponent) opponentCount++;
      }
    }

    return playerCount - opponentCount;
  }
}
