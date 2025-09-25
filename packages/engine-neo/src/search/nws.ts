// Null Window Search (Zero Window Scout) implementation
// Converted from search-neo.js NWS algorithm

import type { Board, Player, Position, GameCore } from 'shared-types';
import { TranspositionTable, TTFlag } from '../optimization/transTable';
import { KillerMoves, HistoryTable, orderMoves } from '../ordering/moveOrdering';
import { evaluateBoard } from '../evaluation/heuristic';
import { getValidMoves, makeMove as coreMakeMove } from 'core';
import { getLevelConfig, getSelectivitySettings, STABILITY_THRESHOLDS, PRUNING_PARAMS } from '../config/selectivity';

export interface NWSResult {
  score: number;
  nodes: number;
  cutoff: boolean;
}

/**
 * Null Window Search for efficient move ordering and pruning
 */
export class NWSEngine {
  private tt: TranspositionTable;
  private killers: KillerMoves;
  private history: HistoryTable;
  private nodes = 0;

  constructor(tt: TranspositionTable, killers: KillerMoves, history: HistoryTable) {
    this.tt = tt;
    this.killers = killers;
    this.history = history;
  }

  /**
   * Null window search with scout algorithm
   */
  search(
    board: Board,
    player: Player,
    depth: number,
    beta: number,
    ply: number,
    level: number
  ): NWSResult {
    this.nodes = 0;

    const empties = this.countEmptySquares(board);
    const levelConfig = getLevelConfig(level, empties);
    const selectivitySettings = getSelectivitySettings(levelConfig.selectivity);

    const score = this.nws(
      board,
      player,
      depth,
      beta - 1,
      beta,
      ply,
      selectivitySettings
    );

    return {
      score,
      nodes: this.nodes,
      cutoff: score >= beta
    };
  }

  /**
   * Null Window Search implementation
   */
  private nws(
    board: Board,
    player: Player,
    depth: number,
    alpha: number,
    beta: number,
    ply: number,
    settings: any
  ): number {
    this.nodes++;

    // Terminal conditions
    if (depth <= 0) {
      return this.quiescenceSearch(board, player, alpha, beta);
    }

    // Transposition table lookup
    const ttKey = this.generateBoardKey(board, player);
    const ttEntry = this.tt.get(ttKey);

    if (ttEntry && this.tt.isUsable(ttEntry, depth)) {
      const cutoff = this.tt.providesScoreCutoff(ttEntry, alpha, beta, depth);
      if (cutoff.cutoff && cutoff.score !== undefined) {
        return cutoff.score;
      }
    }

    // Stability pruning - use NWS thresholds
    const empties = this.countEmptySquares(board);
    const stabilityThreshold = STABILITY_THRESHOLDS.NWS[Math.min(empties, 60)];

    if (depth > stabilityThreshold && empties > 4) {
      const reducedScore = this.nws(board, player, stabilityThreshold, alpha, beta, ply, settings);
      if (Math.abs(reducedScore) < 100) { // Not near game end
        return reducedScore;
      }
    }

    // Generate and order moves
    const moves = getValidMoves(board, player);
    if (moves.length === 0) {
      return this.handleNoMoves(board, player, depth, alpha, beta, ply, settings);
    }

    const orderedMoves = orderMoves(moves, {
      ply,
      player,
      board,
      killers: this.killers,
      history: this.history,
      ttBestMove: ttEntry?.bestMove
    });

    let bestScore = -Infinity;
    let bestMove: Position | undefined;
    let moveCount = 0;

    for (const move of orderedMoves) {
      // Late move pruning
      if (this.shouldPruneMove(moveCount, depth, settings)) {
        break;
      }

      // Futility pruning
      if (this.shouldFutilityPrune(depth, alpha, beta, board, player, move, settings)) {
        moveCount++;
        continue;
      }

      // Razoring
      if (this.shouldRazor(depth, alpha, board, player, settings)) {
        const razorScore = evaluateBoard(board, player) + PRUNING_PARAMS.RAZOR_MARGINS[Math.min(depth, 2)] * settings.razorMul;
        if (razorScore < alpha) {
          moveCount++;
          continue;
        }
      }

      const newBoard = this.makeMove(board, move, player);
      if (!newBoard) {
        continue;
      }

    if (!newBoard) {

      continue;

    }
      const opponent = player === 'black' ? 'white' : 'black';

      // Late move reduction
      let reduction = 0;
      if (this.shouldReduceMove(moveCount, depth, move, settings)) {
        reduction = Math.floor(settings.lmrBase + Math.log(depth) * Math.log(moveCount + 1) / 3);
        reduction = Math.max(0, Math.min(reduction, depth - 2));
      }

      const score = -this.nws(
        newBoard,
        opponent,
        depth - 1 - reduction,
        -beta,
        -alpha,
        ply + 1,
        settings
      );

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }

      if (score >= beta) {
        // Beta cutoff
        this.killers.addKiller(ply, move);
        this.history.updateHistory(move, player, depth);

        // Store in transposition table
        if (bestMove) {
          const entry = this.tt.createEntry(depth, bestScore, bestMove, alpha, beta);
          this.tt.set(ttKey, entry);
        }

        return score;
      }

      if (score > alpha) {
        alpha = score;
      }

      moveCount++;
    }

    // Store in transposition table
    if (bestMove) {
      const entry = this.tt.createEntry(depth, bestScore, bestMove, alpha, beta);
      this.tt.set(ttKey, entry);
    }

    return bestScore;
  }

  /**
   * Quiescence search for NWS
   */
  private quiescenceSearch(
    board: Board,
    player: Player,
    alpha: number,
    beta: number
  ): number {
    this.nodes++;

    const standPat = evaluateBoard(board, player);
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;

    // In null window, we typically don't search further in quiescence
    return standPat;
  }

  /**
   * Handle positions with no valid moves
   */
  private handleNoMoves(
    board: Board,
    player: Player,
    depth: number,
    alpha: number,
    beta: number,
    ply: number,
    settings: any
  ): number {
    const opponent = player === 'black' ? 'white' : 'black';
    const opponentMoves = getValidMoves(board, opponent);

    if (opponentMoves.length === 0) {
      // Game over - material count
      return this.evaluateGameEnd(board, player);
    } else {
      // Pass move - search opponent
      return -this.nws(board, opponent, depth - 1, -beta, -alpha, ply + 1, settings);
    }
  }

  private shouldPruneMove(moveCount: number, depth: number, settings: any): boolean {
    if (depth >= 6) {
      const threshold = PRUNING_PARAMS.LMP_TABLE[Math.min(depth, 6)] + settings.lmpBonus;
      return moveCount >= threshold;
    }
    return false;
  }

  private shouldFutilityPrune(
    depth: number,
    alpha: number,
    beta: number,
    board: Board,
    player: Player,
    move: Position,
    settings: any
  ): boolean {
    if (depth <= 3 && depth > 0) {
      const staticEval = evaluateBoard(board, player);
      const margin = PRUNING_PARAMS.FUTILITY_MARGINS[Math.min(depth, 3)] * settings.futMul;

      if (staticEval + margin <= alpha && !this.isImportantMove(move)) {
        return true;
      }
    }
    return false;
  }

  private shouldRazor(
    depth: number,
    alpha: number,
    board: Board,
    player: Player,
    settings: any
  ): boolean {
    return depth <= 2 && depth > 0;
  }

  private shouldReduceMove(
    moveCount: number,
    depth: number,
    move: Position,
    settings: any
  ): boolean {
    return (
      depth >= 3 &&
      moveCount >= 4 &&
      !this.isImportantMove(move) &&
      settings.useNWS
    );
  }

  private isImportantMove(move: Position): boolean {
    const { row, col } = move;
    return (row === 0 || row === 7) && (col === 0 || col === 7);
  }

  private makeMove(board: Board, move: Position, player: Player): Board | null {
    // Prefer the core implementation for accuracy when available
    const gameCore: GameCore = {
      id: 'nws-move',
      board,
      currentPlayer: player,
      validMoves: [],
      score: { black: 0, white: 0 },
      status: 'playing',
      moveHistory: [],
      canUndo: false,
      canRedo: false
    };
    const result = coreMakeMove(gameCore, move);
    if (result.success && result.newGameCore) {
      return result.newGameCore.board;
    }
    return this.fallbackApplyMove(board, move, player);
  }

  private fallbackApplyMove(board: Board, move: Position, player: Player): Board | null {
    const opponent = player === 'black' ? 'white' : 'black';
    const next = board.map(row => [...row]);
    const directions = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0],            [1, 0],
      [-1, 1],  [0, 1],   [1, 1]
    ];
    const flips: Position[] = [];
    for (const [dr, dc] of directions) {
      let r = move.row + dr;
      let c = move.col + dc;
      const path: Position[] = [];
      while (r >= 0 && r < 8 && c >= 0 && c < 8 && next[r][c] === opponent) {
        path.push({ row: r, col: c });
        r += dr;
        c += dc;
      }
      if (path.length > 0 && r >= 0 && r < 8 && c >= 0 && c < 8 && next[r][c] === player) {
        flips.push(...path);
      }
    }
    if (flips.length === 0) {
      return null;
    }
    next[move.row][move.col] = player;
    for (const pos of flips) {
      next[pos.row][pos.col] = player;
    }
    return next;
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

    return (playerCount - opponentCount) * 1000; // High score for game end
  }

  getNodes(): number {
    return this.nodes;
  }
}
