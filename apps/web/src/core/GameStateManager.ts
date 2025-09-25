// High-level game state manager with undo/redo, validation, and history
// Manages complete game lifecycle with event system

import type {
  GameCore,
  Player,
  Position,
  Move,
  MoveResult,
  GameResult,
  GameStatus
} from '../types';

import {
  createInitialGameCore,
  makeMove,
  isValidMove,
  getValidMoves,
  isGameOver,
  getGameResult,
  calculateScore,
  getPositionHash
} from './gameCore';

// Event system
export type GameEvent =
  | { type: 'move_made'; move: Move; gameCore: GameCore }
  | { type: 'game_over'; result: GameResult }
  | { type: 'turn_changed'; player: Player }
  | { type: 'game_started'; gameCore: GameCore }
  | { type: 'game_reset'; gameCore: GameCore }
  | { type: 'move_undone'; gameCore: GameCore }
  | { type: 'move_redone'; gameCore: GameCore };

export type GameEventListener = (event: GameEvent) => void;

export interface GameStateManagerConfig {
  maxHistorySize: number;
  enableUndo: boolean;
  enableRedo: boolean;
  autoSave: boolean;
}

export class GameStateManager {
  private _currentGame: GameCore;
  private _gameHistory: GameCore[] = [];
  private _redoStack: GameCore[] = [];
  private _listeners: GameEventListener[] = [];
  private _config: GameStateManagerConfig;

  constructor(config: Partial<GameStateManagerConfig> = {}) {
    this._config = {
      maxHistorySize: config.maxHistorySize || 100,
      enableUndo: config.enableUndo ?? true,
      enableRedo: config.enableRedo ?? true,
      autoSave: config.autoSave ?? false
    };

    this._currentGame = createInitialGameCore();
    this._gameHistory.push({ ...this._currentGame });

    this.emit({ type: 'game_started', gameCore: this._currentGame });
  }

  // ===== PUBLIC API =====

  /**
   * Get current game state (immutable)
   */
  get currentGame(): Readonly<GameCore> {
    return this._currentGame;
  }

  /**
   * Get current player
   */
  get currentPlayer(): Player {
    return this._currentGame.currentPlayer;
  }

  /**
   * Get valid moves for current player
   */
  get validMoves(): readonly Position[] {
    return this._currentGame.validMoves;
  }

  /**
   * Get current score
   */
  get score() {
    return this._currentGame.score;
  }

  /**
   * Check if game is over
   */
  get isGameOver(): boolean {
    return isGameOver(this._currentGame);
  }

  /**
   * Get game result if finished
   */
  get gameResult(): GameResult | null {
    return getGameResult(this._currentGame);
  }

  /**
   * Can undo last move
   */
  get canUndo(): boolean {
    return this._config.enableUndo && this._gameHistory.length > 1;
  }

  /**
   * Can redo last undone move
   */
  get canRedo(): boolean {
    return this._config.enableRedo && this._redoStack.length > 0;
  }

  /**
   * Make a move
   */
  makeMove(position: Position): MoveResult {
    if (this.isGameOver) {
      return {
        success: false,
        reason: 'game_finished',
        message: 'Game is already finished'
      };
    }

    const result = makeMove(this._currentGame, position);

    if (result.success) {
      // Update state
      this._currentGame = result.newGameCore;

      // Clear redo stack when new move is made
      this._redoStack = [];

      // Add to history (with size limit)
      this._gameHistory.push({ ...this._currentGame });
      if (this._gameHistory.length > this._config.maxHistorySize) {
        this._gameHistory.shift();
      }

      // Emit events
      this.emit({ type: 'move_made', move: result.move, gameCore: this._currentGame });

      if (this.isGameOver) {
        const gameResult = this.gameResult;
        if (gameResult) {
          this.emit({ type: 'game_over', result: gameResult });
        }
      } else {
        this.emit({ type: 'turn_changed', player: this._currentGame.currentPlayer });
      }

      // Auto-save if enabled
      if (this._config.autoSave) {
        this.saveToStorage();
      }
    }

    return result;
  }

  /**
   * Undo last move
   */
  undo(): boolean {
    if (!this.canUndo) return false;

    // Move current state to redo stack
    this._redoStack.push({ ...this._currentGame });

    // Remove current state from history
    this._gameHistory.pop();

    // Restore previous state
    const previousState = this._gameHistory[this._gameHistory.length - 1];
    this._currentGame = { ...previousState };

    this.emit({ type: 'move_undone', gameCore: this._currentGame });
    this.emit({ type: 'turn_changed', player: this._currentGame.currentPlayer });

    return true;
  }

  /**
   * Redo last undone move
   */
  redo(): boolean {
    if (!this.canRedo) return false;

    // Get state from redo stack
    const nextState = this._redoStack.pop()!;
    this._currentGame = nextState;

    // Add to history
    this._gameHistory.push({ ...this._currentGame });

    this.emit({ type: 'move_redone', gameCore: this._currentGame });
    this.emit({ type: 'turn_changed', player: this._currentGame.currentPlayer });

    return true;
  }

  /**
   * Reset game to initial state
   */
  reset(): void {
    this._currentGame = createInitialGameCore();
    this._gameHistory = [{ ...this._currentGame }];
    this._redoStack = [];

    this.emit({ type: 'game_reset', gameCore: this._currentGame });
    this.emit({ type: 'game_started', gameCore: this._currentGame });
  }

  /**
   * Check if a move is valid
   */
  isValidMove(position: Position): boolean {
    return isValidMove(this._currentGame.board, position, this._currentGame.currentPlayer);
  }

  /**
   * Get all valid moves for current player
   */
  getValidMoves(): Position[] {
    return getValidMoves(this._currentGame.board, this._currentGame.currentPlayer) as Position[];
  }

  /**
   * Set game status
   */
  setGameStatus(status: GameStatus): void {
    if (this._currentGame.status !== status) {
      this._currentGame = {
        ...this._currentGame,
        status
      };
    }
  }

  /**
   * Get position hash (for engines/caching)
   */
  getPositionHash(): number {
    return getPositionHash(this._currentGame);
  }

  /**
   * Get move history
   */
  getMoveHistory(): readonly Move[] {
    return this._currentGame.moveHistory;
  }

  /**
   * Get game statistics
   */
  getGameStats() {
    return {
      totalMoves: this._currentGame.moveHistory.length,
      score: this._currentGame.score,
      gameId: this._currentGame.id,
      currentPlayer: this._currentGame.currentPlayer,
      status: this._currentGame.status,
      canUndo: this.canUndo,
      canRedo: this.canRedo,
      validMovesCount: this._currentGame.validMoves.length,
      historySize: this._gameHistory.length
    };
  }

  // ===== EVENT SYSTEM =====

  /**
   * Add event listener
   */
  addEventListener(listener: GameEventListener): void {
    this._listeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: GameEventListener): void {
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllEventListeners(): void {
    this._listeners = [];
  }

  private emit(event: GameEvent): void {
    this._listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in game event listener:', error);
      }
    });
  }

  // ===== PERSISTENCE =====

  /**
   * Save game state to localStorage
   */
  saveToStorage(key: string = 'othello-game-state'): void {
    try {
      const saveData = {
        currentGame: this._currentGame,
        gameHistory: this._gameHistory,
        redoStack: this._redoStack,
        timestamp: Date.now()
      };

      localStorage.setItem(key, JSON.stringify(saveData));
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }

  /**
   * Load game state from localStorage
   */
  loadFromStorage(key: string = 'othello-game-state'): boolean {
    try {
      const saveData = localStorage.getItem(key);
      if (!saveData) return false;

      const parsed = JSON.parse(saveData);

      this._currentGame = parsed.currentGame;
      this._gameHistory = parsed.gameHistory || [];
      this._redoStack = parsed.redoStack || [];

      this.emit({ type: 'game_started', gameCore: this._currentGame });
      return true;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return false;
    }
  }

  /**
   * Export game as PGN-like format
   */
  exportGame(): string {
    const moves = this._currentGame.moveHistory.map((move, index) => {
      const moveNumber = Math.floor(index / 2) + 1;
      const player = move.player === 'black' ? 'B' : 'W';
      const position = `${String.fromCharCode(97 + move.col)}${move.row + 1}`;
      return `${moveNumber}.${player} ${position}`;
    });

    const result = this.gameResult;
    const resultStr = result
      ? result.winner === 'draw' ? '1/2-1/2' : result.winner === 'black' ? '1-0' : '0-1'
      : '*';

    return [
      `[Game "${this._currentGame.id}"]`,
      `[Black "Player"]`,
      `[White "Player"]`,
      `[Result "${resultStr}"]`,
      `[Score "${this._currentGame.score.black}-${this._currentGame.score.white}"]`,
      '',
      moves.join(' ') + (resultStr !== '*' ? ` ${resultStr}` : '')
    ].join('\n');
  }

  // ===== ADVANCED FEATURES =====

  /**
   * Create a copy of the current game for simulation
   */
  createSimulation(): GameCore {
    return JSON.parse(JSON.stringify(this._currentGame));
  }

  /**
   * Apply multiple moves for analysis
   */
  simulateMoves(moves: Position[]): GameCore {
    let simulation = this.createSimulation();

    for (const position of moves) {
      const result = makeMove(simulation, position);
      if (result.success) {
        simulation = result.newGameCore;
      } else {
        break; // Stop on invalid move
      }
    }

    return simulation;
  }

  /**
   * Get game state at specific move number
   */
  getGameStateAtMove(moveNumber: number): GameCore | null {
    if (moveNumber < 0 || moveNumber >= this._gameHistory.length) {
      return null;
    }
    return { ...this._gameHistory[moveNumber] };
  }

  /**
   * Dispose of the manager
   */
  dispose(): void {
    this.removeAllEventListeners();
    this._gameHistory = [];
    this._redoStack = [];
  }
}