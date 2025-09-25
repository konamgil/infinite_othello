// SearchWorkerManager: Coordinates multiple AI search workers for optimal performance
// Handles work distribution, load balancing, and result aggregation

import type {
  GameCore,
  Player,
  Position,
  AIDifficulty
} from '../types';

import type {
  SearchRequest,
  SearchResponse,
  SearchError,
  SearchResult,
  SearchOptions
} from './search-worker';

export interface WorkerConfig {
  maxWorkers: number;
  workerTimeout: number; // ms
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

interface ActiveWorker {
  worker: Worker;
  busy: boolean;
  jobId: string | null;
  startTime: number;
}

interface PendingJob {
  id: string;
  resolve: (result: SearchJobResult) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  startTime: number;
  workersAssigned: string[];
  results: Map<string, SearchResponse>;
  expectedResponses: number;
}

export class SearchWorkerManager {
  private workers: Map<string, ActiveWorker> = new Map();
  private pendingJobs: Map<string, PendingJob> = new Map();
  private config: WorkerConfig;
  private nextJobId = 1;

  constructor(config: Partial<WorkerConfig> = {}) {
    this.config = {
      maxWorkers: config.maxWorkers || Math.max(1, Math.floor(navigator.hardwareConcurrency / 2)),
      workerTimeout: config.workerTimeout || 30000,
      enableDistributedSearch: config.enableDistributedSearch ?? true,
      fallbackToSingleWorker: config.fallbackToSingleWorker ?? true
    };

    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.config.maxWorkers; i++) {
      const workerId = `worker-${i}`;
      const worker = this.spawnWorker(workerId);

      worker.onmessage = (event) => this.handleWorkerMessage(workerId, event.data);
      worker.onerror = (error) => this.handleWorkerError(workerId, error);

      this.workers.set(workerId, {
        worker,
        busy: false,
        jobId: null,
        startTime: 0
      });
    }
  }

  async search(
    gameCore: GameCore,
    player: Player,
    options: SearchOptions = {}
  ): Promise<SearchJobResult> {
    const jobId = `job-${this.nextJobId++}`;
    const startTime = performance.now();

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.cancelJob(jobId);
        reject(new Error(`Search timeout after ${this.config.workerTimeout}ms`));
      }, options.timeLimit || this.config.workerTimeout);

      // Get available moves for potential distribution
      const validMoves = this.getValidMoves(gameCore, player);

      // Determine search strategy
      const shouldDistribute =
        this.config.enableDistributedSearch &&
        validMoves.length >= 4 &&
        this.getAvailableWorkerCount() >= 2;

      if (shouldDistribute) {
        this.startDistributedSearch(jobId, gameCore, player, options, validMoves, resolve, reject, timeout, startTime);
      } else {
        this.startSingleWorkerSearch(jobId, gameCore, player, options, resolve, reject, timeout, startTime);
      }
    });
  }

  private startSingleWorkerSearch(
    jobId: string,
    gameCore: GameCore,
    player: Player,
    options: SearchOptions,
    resolve: (result: SearchJobResult) => void,
    reject: (error: Error) => void,
    timeout: NodeJS.Timeout,
    startTime: number
  ): void {
    const availableWorker = this.getAvailableWorker();

    if (!availableWorker) {
      clearTimeout(timeout);
      reject(new Error('No workers available'));
      return;
    }

    const [workerId, workerData] = availableWorker;

    // Mark worker as busy
    workerData.busy = true;
    workerData.jobId = jobId;
    workerData.startTime = performance.now();

    // Create pending job
    this.pendingJobs.set(jobId, {
      id: jobId,
      resolve,
      reject,
      timeout,
      startTime,
      workersAssigned: [workerId],
      results: new Map(),
      expectedResponses: 1
    });

    // Send search request
    const request: SearchRequest = {
      id: jobId,
      gameCore,
      player,
      options
    };

    workerData.worker.postMessage(request);
  }

  private startDistributedSearch(
    jobId: string,
    gameCore: GameCore,
    player: Player,
    options: SearchOptions,
    validMoves: Position[],
    resolve: (result: SearchJobResult) => void,
    reject: (error: Error) => void,
    timeout: NodeJS.Timeout,
    startTime: number
  ): void {
    const availableWorkers = this.getAvailableWorkers();
    const workerCount = Math.min(availableWorkers.length, validMoves.length);

    if (workerCount === 0) {
      clearTimeout(timeout);
      reject(new Error('No workers available for distributed search'));
      return;
    }

    // Distribute moves among workers
    const moveGroups = this.distributeMoves(validMoves, workerCount);
    const workerIds: string[] = [];

    // Create pending job
    this.pendingJobs.set(jobId, {
      id: jobId,
      resolve,
      reject,
      timeout,
      startTime,
      workersAssigned: [],
      results: new Map(),
      expectedResponses: workerCount
    });

    // Assign work to each worker
    for (let i = 0; i < workerCount; i++) {
      const [workerId, workerData] = availableWorkers[i];
      const moves = moveGroups[i];

      workerData.busy = true;
      workerData.jobId = jobId;
      workerData.startTime = performance.now();
      workerIds.push(workerId);

      const request: SearchRequest = {
        id: `${jobId}-${workerId}`,
        gameCore,
        player,
        options: {
          ...options,
          timeLimit: options.timeLimit ? Math.floor(options.timeLimit / workerCount) : undefined
        },
        rootMoves: moves
      };

      workerData.worker.postMessage(request);
    }

    // Update job with assigned workers
    const job = this.pendingJobs.get(jobId)!;
    job.workersAssigned = workerIds;
  }

  private handleWorkerMessage(workerId: string, data: SearchResult): void {
    const workerData = this.workers.get(workerId);
    if (!workerData) return;

    // Extract job ID (handle both single and distributed formats)
    const jobId = data.id.includes('-') ? data.id.split('-')[0] : data.id;
    const job = this.pendingJobs.get(jobId);

    if (!job) {
      console.warn(`Received result for unknown job: ${data.id}`);
      return;
    }

    // Mark worker as available
    workerData.busy = false;
    workerData.jobId = null;

    if (data.success) {
      job.results.set(data.id, data);

      // Check if we have all expected results
      if (job.results.size >= job.expectedResponses) {
        this.completeJob(jobId);
      }
    } else {
      // Handle error
      const error = new Error(data.error);
      this.failJob(jobId, error);
    }
  }

  private handleWorkerError(workerId: string, error: ErrorEvent): void {
    console.error(`Worker ${workerId} error:`, error);

    const workerData = this.workers.get(workerId);
    if (workerData && workerData.jobId) {
      const job = this.pendingJobs.get(workerData.jobId);
      if (job) {
        this.failJob(workerData.jobId, new Error(`Worker error: ${error.message}`));
      }
    }

    // Restart the worker
    this.restartWorker(workerId);
  }

  private completeJob(jobId: string): void {
    const job = this.pendingJobs.get(jobId);
    if (!job) return;

    clearTimeout(job.timeout);

    try {
      // Aggregate results from all workers
      const results = Array.from(job.results.values());
      const best = this.selectBestResult(results);

      const finalResult: SearchJobResult = {
        bestMove: best.bestMove,
        evaluation: best.evaluation,
        nodes: results.reduce((sum, r) => sum + r.nodes, 0),
        depth: Math.max(...results.map(r => r.depth)),
        timeUsed: performance.now() - job.startTime,
        workersUsed: results.length,
        distributionStrategy: results.length > 1 ? 'distributed' : 'single'
      };

      job.resolve(finalResult);
    } catch (error) {
      job.reject(error as Error);
    } finally {
      this.pendingJobs.delete(jobId);
    }
  }

  private failJob(jobId: string, error: Error): void {
    const job = this.pendingJobs.get(jobId);
    if (!job) return;

    clearTimeout(job.timeout);

    // Free up assigned workers
    for (const workerId of job.workersAssigned) {
      const workerData = this.workers.get(workerId);
      if (workerData) {
        workerData.busy = false;
        workerData.jobId = null;
      }
    }

    job.reject(error);
    this.pendingJobs.delete(jobId);
  }

  private cancelJob(jobId: string): void {
    const job = this.pendingJobs.get(jobId);
    if (!job) return;

    // Terminate workers assigned to this job
    for (const workerId of job.workersAssigned) {
      const workerData = this.workers.get(workerId);
      if (workerData) {
        workerData.worker.terminate();
        this.restartWorker(workerId);
      }
    }

    this.pendingJobs.delete(jobId);
  }

  private selectBestResult(results: SearchResponse[]): SearchResponse {
    return results.reduce((best, current) =>
      current.evaluation > best.evaluation ? current : best
    );
  }

  private distributeMoves(moves: Position[], workerCount: number): Position[][] {
    const groups: Position[][] = Array.from({ length: workerCount }, () => []);

    // Round-robin distribution for balanced load
    moves.forEach((move, index) => {
      groups[index % workerCount].push(move);
    });

    return groups;
  }

  private getValidMoves(gameCore: GameCore, player: Player): Position[] {
    // This should use your actual game logic
    // For now, return the valid moves from the game core
    return Array.from(gameCore.validMoves);
  }

  private getAvailableWorker(): [string, ActiveWorker] | null {
    for (const [id, worker] of this.workers) {
      if (!worker.busy) {
        return [id, worker];
      }
    }
    return null;
  }

  private getAvailableWorkers(): [string, ActiveWorker][] {
    return Array.from(this.workers.entries()).filter(([_, worker]) => !worker.busy);
  }

  private getAvailableWorkerCount(): number {
    return Array.from(this.workers.values()).filter(w => !w.busy).length;
  }

  private restartWorker(workerId: string): void {
    const oldWorkerData = this.workers.get(workerId);
    if (oldWorkerData) {
      oldWorkerData.worker.terminate();
    }

    // Create new worker
    const worker = this.spawnWorker(workerId);

    worker.onmessage = (event) => this.handleWorkerMessage(workerId, event.data);
    worker.onerror = (error) => this.handleWorkerError(workerId, error);

    this.workers.set(workerId, {
      worker,
      busy: false,
      jobId: null,
      startTime: 0
    });
  }

  private spawnWorker(workerId: string): Worker {
    const workerUrl = new URL('./search-worker.ts', import.meta.url);
    return new Worker(workerUrl, {
      type: 'module',
      name: workerId
    });
  }

  // Public methods
  getStatus() {
    const workers = Array.from(this.workers.values());
    return {
      totalWorkers: workers.length,
      busyWorkers: workers.filter(w => w.busy).length,
      availableWorkers: workers.filter(w => !w.busy).length,
      pendingJobs: this.pendingJobs.size,
      config: this.config
    };
  }

  async terminate(): Promise<void> {
    // Cancel all pending jobs
    for (const jobId of this.pendingJobs.keys()) {
      this.cancelJob(jobId);
    }

    // Terminate all workers
    const terminationPromises = Array.from(this.workers.values()).map(
      workerData => {
        return new Promise<void>(resolve => {
          workerData.worker.onmessage = null;
          workerData.worker.onerror = null;
          workerData.worker.terminate();
          resolve();
        });
      }
    );

    await Promise.all(terminationPromises);

    this.workers.clear();
    this.pendingJobs.clear();
  }
}
