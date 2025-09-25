import type { GameCore, Player, Position } from '../types';
import type { SearchOptions } from './search-worker';
export interface WorkerConfig {
    maxWorkers: number;
    workerTimeout: number;
    enableDistributedSearch: boolean;
    fallbackToSingleWorker: boolean;
}
export interface SearchJobResult {
    bestMove: Position | null;
    evaluation: number;
    nodes: number;
    depth: number;
    timeUsed: number;
    workersUsed: number;
    distributionStrategy: 'single' | 'distributed' | 'fallback';
}
export declare class SearchWorkerManager {
    private workers;
    private pendingJobs;
    private config;
    private nextJobId;
    constructor(config?: Partial<WorkerConfig>);
    private initializeWorkers;
    search(gameCore: GameCore, player: Player, options?: SearchOptions): Promise<SearchJobResult>;
    private startSingleWorkerSearch;
    private startDistributedSearch;
    private handleWorkerMessage;
    private handleWorkerError;
    private completeJob;
    private failJob;
    private cancelJob;
    private selectBestResult;
    private distributeMoves;
    private getValidMoves;
    private getAvailableWorker;
    private getAvailableWorkers;
    private getAvailableWorkerCount;
    private restartWorker;
    getStatus(): {
        totalWorkers: number;
        busyWorkers: number;
        availableWorkers: number;
        pendingJobs: number;
        config: WorkerConfig;
    };
    terminate(): Promise<void>;
}
