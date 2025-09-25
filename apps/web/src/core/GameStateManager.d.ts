import type { GameCore, Player, Position, Move, MoveResult, GameResult, GameStatus } from '../types';
export type GameEvent = {
    type: 'move_made';
    move: Move;
    gameCore: GameCore;
} | {
    type: 'game_over';
    result: GameResult;
} | {
    type: 'turn_changed';
    player: Player;
} | {
    type: 'game_started';
    gameCore: GameCore;
} | {
    type: 'game_reset';
    gameCore: GameCore;
} | {
    type: 'move_undone';
    gameCore: GameCore;
} | {
    type: 'move_redone';
    gameCore: GameCore;
};
export type GameEventListener = (event: GameEvent) => void;
export interface GameStateManagerConfig {
    maxHistorySize: number;
    enableUndo: boolean;
    enableRedo: boolean;
    autoSave: boolean;
}
export declare class GameStateManager {
    private _currentGame;
    private _gameHistory;
    private _redoStack;
    private _listeners;
    private _config;
    constructor(config?: Partial<GameStateManagerConfig>);
    /**
     * Get current game state (immutable)
     */
    get currentGame(): Readonly<GameCore>;
    /**
     * Get current player
     */
    get currentPlayer(): Player;
    /**
     * Get valid moves for current player
     */
    get validMoves(): readonly Position[];
    /**
     * Get current score
     */
    get score(): import("../types").Score;
    /**
     * Check if game is over
     */
    get isGameOver(): boolean;
    /**
     * Get game result if finished
     */
    get gameResult(): GameResult | null;
    /**
     * Can undo last move
     */
    get canUndo(): boolean;
    /**
     * Can redo last undone move
     */
    get canRedo(): boolean;
    /**
     * Make a move
     */
    makeMove(position: Position): MoveResult;
    /**
     * Undo last move
     */
    undo(): boolean;
    /**
     * Redo last undone move
     */
    redo(): boolean;
    /**
     * Reset game to initial state
     */
    reset(): void;
    /**
     * Check if a move is valid
     */
    isValidMove(position: Position): boolean;
    /**
     * Get all valid moves for current player
     */
    getValidMoves(): Position[];
    /**
     * Set game status
     */
    setGameStatus(status: GameStatus): void;
    /**
     * Get position hash (for engines/caching)
     */
    getPositionHash(): number;
    /**
     * Get move history
     */
    getMoveHistory(): readonly Move[];
    /**
     * Get game statistics
     */
    getGameStats(): {
        totalMoves: number;
        score: import("../types").Score;
        gameId: string;
        currentPlayer: Player;
        status: GameStatus;
        canUndo: boolean;
        canRedo: boolean;
        validMovesCount: number;
        historySize: number;
    };
    /**
     * Add event listener
     */
    addEventListener(listener: GameEventListener): void;
    /**
     * Remove event listener
     */
    removeEventListener(listener: GameEventListener): void;
    /**
     * Remove all event listeners
     */
    removeAllEventListeners(): void;
    private emit;
    /**
     * Save game state to localStorage
     */
    saveToStorage(key?: string): void;
    /**
     * Load game state from localStorage
     */
    loadFromStorage(key?: string): boolean;
    /**
     * Export game as PGN-like format
     */
    exportGame(): string;
    /**
     * Create a copy of the current game for simulation
     */
    createSimulation(): GameCore;
    /**
     * Apply multiple moves for analysis
     */
    simulateMoves(moves: Position[]): GameCore;
    /**
     * Get game state at specific move number
     */
    getGameStateAtMove(moveNumber: number): GameCore | null;
    /**
     * Dispose of the manager
     */
    dispose(): void;
}
