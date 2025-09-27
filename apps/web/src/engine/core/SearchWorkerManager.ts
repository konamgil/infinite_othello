/* --------------------------------------------------------------------------
 * SearchWorkerManager.ts
 * - 워커 풀 생성/관리, 분산/단일 검색 오케스트레이션
 * - per-worker 시간예산 분배, per-move 시간예산 분배(워커 쪽), 하드 캔슬(재시작)
 * - 타임아웃 시 부분결과 집계 & 워커 정리, Early-Stop 지원
 * -------------------------------------------------------------------------- */

export type Player = 'black' | 'white';
export type Position = { row: number; col: number };

// 검색 옵션(필요에 따라 확장)
export interface SearchOptions {
  timeLimit?: number;    // ms
  depthLimit?: number;   // ply
  // 엔진 모듈 경로/심볼 (워커가 동적 import)
  engineModuleURL?: string;       // e.g. '/engine/index.js'
  engineExportName?: string;      // e.g. 'alphaBetaSearch'
  // 루트 강제 옵션 등은 워커에서 주입
}

// 엔진 결과(워커->매니저)
export interface SearchResponse {
  id: string;
  workerId: number;
  success: boolean;
  error?: string;

  mode: 'single' | 'distributed';
  player: Player;

  bestMove?: Position;
  evaluation?: number;   // player(요청자) 관점 점수
  nodes?: number;
  pv?: Position[];

  // 통계/부가정보
  elapsed: number;       // ms
  rootsTried?: number;   // 분산에서 처리한 루트 수
  rootBest?: Position;   // 해당 워커가 찾은 best 루트(분산)
}

export interface SearchAggregateResult {
  success: boolean;
  bestMove?: Position;
  evaluation?: number;
  nodes?: number;
  pv?: Position[];
  time: number;
  details: Array<Omit<SearchResponse, 'id'>>;
}

export interface WorkerConfig {
  poolSize: number;               // 워커 개수
  workerURL: string;              // 워커 파일 경로 (search-worker.ts 빌드 산출물)
  workerTimeout: number;          // 매니저 타임아웃(ms) 기본값(옵션 timeLimit 없을 때)
  earlyStopThreshold?: number;    // 이 값 이상 평가는 조기 종료(선택)
  consoleTag?: string;            // 로그 prefix
  // 엔진 모듈 동적 import 기본값 (워커 옵션에 미지정 시 사용)
  engineModuleURL?: string;       // e.g. '/engine-zenith.js'
  engineExportName?: string;      // e.g. 'alphaBetaSearch'
}

type JobId = string;

interface Job {
  id: JobId;
  distributed: boolean;
  start: number;
  timer: ReturnType<typeof setTimeout> | null;
  resolve: (v: SearchAggregateResult) => void;
  reject: (e: any) => void;

  // 분산 집계
  assignedWorkerIds: number[];
  responses: SearchResponse[];

  // 요청 메타
  player: Player;
}

interface WorkerSlot {
  id: number;
  worker: Worker;
  busy: boolean;
  currentJob?: JobId;
}

export class SearchWorkerManager {
  private config: WorkerConfig;
  private pool: WorkerSlot[] = [];
  private jobs = new Map<JobId, Job>();
  private jobSeq = 0;

  constructor(config: WorkerConfig) {
    const defaultPoolSize = (() => {
      try {
        const hc = (navigator as any)?.hardwareConcurrency;
        if (typeof hc === 'number' && hc > 0) return Math.min(8, Math.max(1, Math.floor(hc / 2)));
      } catch {}
      return 2;
    })();
    this.config = {
      poolSize: Math.max(1, (config.poolSize ?? defaultPoolSize)),
      workerURL: config.workerURL || '/search-worker.js',
      workerTimeout: Math.max(200, config.workerTimeout),
      earlyStopThreshold: config.earlyStopThreshold ?? Infinity,
      consoleTag: config.consoleTag ?? '[SearchMgr]',
      engineModuleURL: config.engineModuleURL ?? '/engine-zenith.js',
      engineExportName: config.engineExportName ?? 'alphaBetaSearch',
    };
    this.spawnPool();
  }

  /* ------------------------ Public API ------------------------ */

  async searchSingle(
    gameCore: any,
    player: Player,
    options: SearchOptions
  ): Promise<SearchAggregateResult> {
    const jobId = this.newJobId();
    const timeBudget = options.timeLimit ?? this.config.workerTimeout;

    const worker = this.getFreeWorker();
    if (!worker) throw new Error('No available workers');

    return new Promise<SearchAggregateResult>((resolve, reject) => {
      const job: Job = {
        id: jobId,
        distributed: false,
        start: performance.now(),
        timer: null,
        resolve, reject,
        assignedWorkerIds: [worker.id],
        responses: [],
        player,
      };
      this.jobs.set(jobId, job);

      // 타임아웃: 부분결과 있으면 그것으로 종료
      job.timer = setTimeout(() => {
        this.log('Timeout(single):', jobId);
        this.finishWithBest(jobId, /*hardCancel=*/true);
      }, timeBudget);

      worker.busy = true;
      worker.currentJob = jobId;

      const msg = {
        type: 'search',
        payload: {
          id: jobId,
          mode: 'single' as const,
          player,
          gameCore,
          options: {
            ...options,
            engineModuleURL: options.engineModuleURL ?? this.config.engineModuleURL,
            engineExportName: options.engineExportName ?? this.config.engineExportName,
          },
        },
      };
      worker.worker.postMessage(msg);
    });
  }

  async searchDistributed(
    gameCore: any,
    player: Player,
    options: SearchOptions,
    rootMoves: Position[]
  ): Promise<SearchAggregateResult> {
    if (!rootMoves || rootMoves.length === 0) {
      return this.searchSingle(gameCore, player, options);
    }

    const jobId = this.newJobId();
    const timeBudget = options.timeLimit ?? this.config.workerTimeout;

    const freeWorkers = this.getFreeWorkers(Math.min(this.pool.length, rootMoves.length));
    if (freeWorkers.length === 0) throw new Error('No available workers');

    const workerCount = freeWorkers.length;
    // per-worker 시간 예산 분배(10% 버퍼)
    const timePerWorker = Math.max(50, Math.floor((timeBudget * 0.9) / workerCount));

    // 루트 수 정렬 후 분할 (안전한 수 우선)
    const orderedMoves = orderRootMoves(rootMoves);
    const splits = splitEvenly(orderedMoves, workerCount);

    return new Promise<SearchAggregateResult>((resolve, reject) => {
      const job: Job = {
        id: jobId,
        distributed: true,
        start: performance.now(),
        timer: null,
        resolve, reject,
        assignedWorkerIds: [],
        responses: [],
        player,
      };
      this.jobs.set(jobId, job);

      // 타임아웃: 부분결과라도 집계해서 반환
      job.timer = setTimeout(() => {
        this.log('Timeout(distributed):', jobId);
        this.finishWithBest(jobId, /*hardCancel=*/true);
      }, timeBudget);

      // 워커별로 배정 후 실행
      for (let i = 0; i < freeWorkers.length; i++) {
        const slot = freeWorkers[i];
        const movesForThisWorker = splits[i];

        job.assignedWorkerIds.push(slot.id);
        slot.busy = true;
        slot.currentJob = jobId;

        const msg = {
          type: 'search',
          payload: {
            id: jobId,
            mode: 'distributed' as const,
            player,
            gameCore,
            options: {
              ...options,
              timeLimit: timePerWorker,
              engineModuleURL: options.engineModuleURL ?? this.config.engineModuleURL,
              engineExportName: options.engineExportName ?? this.config.engineExportName,
            },
            rootMoves: movesForThisWorker,
          },
        };
        slot.worker.postMessage(msg);
      }
    });
  }

  /** 현재 진행 중인 잡을 강제 취소(하드 캔슬 + 재시작) */
  cancelJob(jobId: JobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    this.log('Cancel job:', jobId);

    this.jobs.delete(jobId);
    if (job.timer) clearTimeout(job.timer);

    // 해당 워커들 하드캔슬(terminate & spawn)
    for (const wid of job.assignedWorkerIds) {
      this.restartWorker(wid);
    }

    const elapsed = performance.now() - job.start;
    job.reject(new Error(`Job cancelled: ${jobId} (${elapsed.toFixed(1)}ms)`));
  }

  /** 풀 정리 */
  destroy() {
    for (const slot of this.pool) {
      try { slot.worker.terminate(); } catch {}
    }
    this.pool = [];
    for (const [, job] of this.jobs) {
      if (job.timer) clearTimeout(job.timer);
      job.reject(new Error('Manager destroyed'));
    }
    this.jobs.clear();
  }

  /* ------------------------ Internals ------------------------ */

  private spawnPool() {
    for (let i = 0; i < this.config.poolSize; i++) {
      this.pool.push(this.spawnWorker(i));
    }
  }

  private spawnWorker(id: number): WorkerSlot {
    const w = new Worker(this.config.workerURL, { type: 'module' });
    const slot: WorkerSlot = { id, worker: w, busy: false };

    w.onmessage = (ev: MessageEvent) => {
      const data = ev.data as SearchResponse;
      this.onWorkerMessage(slot, data);
    };
    w.onerror = (err) => {
      this.log('Worker error:', id, err);
      // 예외 발생 시 슬롯 재시작
      this.restartWorker(id);
    };
    return slot;
  }

  private restartWorker(workerId: number) {
    const idx = this.pool.findIndex(p => p.id === workerId);
    if (idx < 0) return;
    try {
      this.pool[idx].worker.terminate();
    } catch {}
    const newSlot = this.spawnWorker(workerId);
    this.pool[idx] = newSlot;
  }

  private onWorkerMessage(slot: WorkerSlot, res: SearchResponse) {
    // 늦게 온 결과거나 이미 다른 잡이면 무시 + 워커는 비움
    const job = this.jobs.get(res.id);
    slot.busy = false;
    slot.currentJob = undefined;

    if (!job) {
      this.log('Stale response from worker', slot.id, res.id);
      // 안전: 유휴 워커 상태 유지(필요 시 재시작 가능)
      return;
    }

    // 응답 수집
    job.responses.push(res);

    // Early-Stop: 충분히 좋은 점수면 조기 종료
    if (
      res.success &&
      typeof res.evaluation === 'number' &&
      Math.abs(res.evaluation) >= this.config.earlyStopThreshold!
    ) {
      this.log('Early stop by worker', slot.id, 'score', res.evaluation);
      this.finishWithBest(job.id, /*hardCancel=*/true);
      return;
    }

    // 분산: 모든 워커가 응답하면 집계
    if (job.distributed) {
      const allDone = job.assignedWorkerIds.every(
        wid => this.pool.find(p => p.id === wid)?.busy === false
      );
      if (allDone) {
        this.finishWithBest(job.id, /*hardCancel=*/false);
      }
    } else {
      // 단일
      this.finishWithBest(job.id, /*hardCancel=*/false);
    }
  }

  private finishWithBest(jobId: JobId, hardCancel: boolean) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    this.jobs.delete(jobId);
    if (job.timer) clearTimeout(job.timer);

    // 모든 할당 워커 정리
    for (const wid of job.assignedWorkerIds) {
      if (hardCancel) this.restartWorker(wid);
      else {
        const slot = this.pool.find(p => p.id === wid);
        if (slot) { slot.busy = false; slot.currentJob = undefined; }
      }
    }

    const elapsed = performance.now() - job.start;

    // best 집계
    const best = pickBest(job.responses, job.player);
    if (best) {
      const totalNodes = job.responses.reduce((s, r) => s + (r.nodes ?? 0), 0);
      job.resolve({
        success: true,
        bestMove: best.bestMove,
        evaluation: best.evaluation,
        nodes: totalNodes,
        pv: best.pv ?? [],
        time: elapsed,
        details: job.responses.map(({ id, ...rest }) => rest),
      });
    } else {
      job.resolve({
        success: false,
        time: elapsed,
        details: job.responses.map(({ id, ...rest }) => rest),
      });
    }
  }

  private newJobId(): JobId {
    return `job-${++this.jobSeq}-${Date.now()}`;
  }

  private getFreeWorker(): WorkerSlot | undefined {
    return this.pool.find(p => !p.busy);
  }
  private getFreeWorkers(n: number): WorkerSlot[] {
    const out: WorkerSlot[] = [];
    for (const p of this.pool) {
      if (!p.busy) out.push(p);
      if (out.length >= n) break;
    }
    return out;
  }

  private log(...args: any[]) {
    if (this.config.consoleTag) {
      // eslint-disable-next-line no-console
      console.log(this.config.consoleTag, ...args);
    }
  }
}

/* ------------------------ helpers ------------------------ */

function splitEvenly<T>(arr: T[], parts: number): T[][] {
  const res: T[][] = Array.from({ length: parts }, () => []);
  for (let i = 0; i < arr.length; i++) {
    res[i % parts].push(arr[i]);
  }
  return res;
}

function pickBest(responses: SearchResponse[], player: Player): SearchResponse | null {
  const valid = responses.filter(r => r.success && typeof r.evaluation === 'number');
  if (valid.length === 0) return null;
  
  // 안전성과 평가값을 함께 고려한 선택
  let best = valid[0];
  for (let i = 1; i < valid.length; i++) {
    const current = valid[i];
    const currentEval = current.evaluation as number;
    const bestEval = best.evaluation as number;
    
    // X-square나 위험한 수는 피하기
    const currentMove = current.bestMove;
    const bestMove = best.bestMove;
    
    if (currentMove && bestMove) {
      const currentIsDangerous = isDangerousMove(currentMove);
      const bestIsDangerous = isDangerousMove(bestMove);
      
      // 둘 다 위험하거나 둘 다 안전하면 평가값으로 선택
      if (currentIsDangerous === bestIsDangerous) {
        if (currentEval > bestEval) best = current;
      } else if (!currentIsDangerous && bestIsDangerous) {
        // 현재가 안전하고 기존이 위험하면 현재 선택 (평가값 차이가 크지 않을 때)
        if (currentEval >= bestEval - 20) best = current;
      }
      // 현재가 위험하고 기존이 안전하면 기존 유지
    } else {
      // move 정보가 없으면 평가값으로만 선택
      if (currentEval > bestEval) best = current;
    }
  }
  return best;
}

function isDangerousMove(move: { row: number; col: number }): boolean {
  const { row, col } = move;
  // X-squares
  if ((row === 1 && col === 1) || (row === 1 && col === 6) ||
      (row === 6 && col === 1) || (row === 6 && col === 6)) {
    return true;
  }
  return false;
}

function orderRootMoves(moves: Position[]): Position[] {
  return moves.slice().sort((a, b) => {
    // 코너 > 안전한 엣지 > 일반 > 위험한 수 순서
    const aIsCorner = (a.row === 0 || a.row === 7) && (a.col === 0 || a.col === 7);
    const bIsCorner = (b.row === 0 || b.row === 7) && (b.col === 0 || b.col === 7);
    
    if (aIsCorner && !bIsCorner) return -1;
    if (!aIsCorner && bIsCorner) return 1;
    
    const aIsDangerous = isDangerousMove(a);
    const bIsDangerous = isDangerousMove(b);
    
    if (!aIsDangerous && bIsDangerous) return -1;
    if (aIsDangerous && !bIsDangerous) return 1;
    
    // 둘 다 같은 카테고리면 위치 가중치로 정렬
    const aEdge = (a.row === 0 || a.row === 7 || a.col === 0 || a.col === 7) ? 1 : 0;
    const bEdge = (b.row === 0 || b.row === 7 || b.col === 0 || b.col === 7) ? 1 : 0;
    
    return bEdge - aEdge;
  });
}
