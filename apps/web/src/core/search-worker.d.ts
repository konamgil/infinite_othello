import type { GameCore, Player, Position, AIDifficulty } from '../types';
export interface SearchRequest {
    id: string;
    gameCore: GameCore;
    player: Player;
    options: SearchOptions;
    rootMoves?: Position[];
}
export interface SearchOptions {
    timeLimit?: number;
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
export type { SearchResult };
