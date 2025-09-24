/**
 * 🤖 Engine Registry - AI 엔진 관리 시스템
 *
 * 기능:
 * - 동적 엔진 등록/해제
 * - 티어/난이도별 엔진 선택
 * - 엔진 성능 모니터링
 * - 타입 안전한 엔진 인터페이스
 *
 * 기존 문제 해결:
 * - 하드코딩된 switch 문 제거
 * - 새로운 엔진 추가 시 코드 변경 불필요
 * - 동적 import로 성능 최적화
 */

import {
  type Engine,
  type EngineRequest,
  type EngineResponse,
  type AIDifficulty,
  type GameCore
} from 'shared-types';

// ===== Engine Metadata =====

export interface EngineMetadata {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly description: string;
  readonly difficulty: AIDifficulty;
  readonly tier: string; // 'A', 'B', 'C' 등
  readonly performance: EnginePerformance;
  readonly features: readonly EngineFeature[];
}

export interface EnginePerformance {
  readonly avgResponseTime: number; // ms
  readonly maxDepth: number;
  readonly nodesPerSecond: number;
  readonly memoryUsage: number; // MB
  readonly rating: number; // ELO rating
}

export type EngineFeature =
  | 'opening_book'
  | 'endgame_db'
  | 'time_management'
  | 'skill_levels'
  | 'analysis_mode'
  | 'multi_threading';

// ===== Engine Registry Class =====

export class EngineRegistry {
  private engines = new Map<string, Engine>();
  private metadata = new Map<string, EngineMetadata>();
  private loadingCache = new Map<string, Promise<Engine>>();

  // 성능 추적
  private performanceStats = new Map<string, {
    totalRequests: number;
    totalTime: number;
    errors: number;
    lastUsed: number;
  }>();

  // ===== Engine Registration =====

  /**
   * 엔진 등록
   */
  register(engine: Engine, metadata: EngineMetadata): void {
    this.engines.set(metadata.id, engine);
    this.metadata.set(metadata.id, metadata);

    console.log(`[EngineRegistry] Registered engine: ${metadata.name} v${metadata.version}`);
  }

  /**
   * 엔진 등록 해제
   */
  unregister(engineId: string): boolean {
    const existed = this.engines.has(engineId);

    this.engines.delete(engineId);
    this.metadata.delete(engineId);
    this.loadingCache.delete(engineId);
    this.performanceStats.delete(engineId);

    if (existed) {
      console.log(`[EngineRegistry] Unregistered engine: ${engineId}`);
    }

    return existed;
  }

  // ===== Engine Retrieval =====

  /**
   * 엔진 ID로 검색
   */
  get(engineId: string): Engine | null {
    return this.engines.get(engineId) || null;
  }

  /**
   * 티어별 엔진 검색
   */
  getByTier(tier: string): Engine[] {
    const engines: Engine[] = [];

    for (const [id, metadata] of this.metadata.entries()) {
      if (metadata.tier === tier) {
        const engine = this.engines.get(id);
        if (engine) engines.push(engine);
      }
    }

    return engines;
  }

  /**
   * 난이도별 최적 엔진 선택
   */
  getBestForDifficulty(difficulty: AIDifficulty): Engine | null {
    let bestEngine: Engine | null = null;
    let bestRating = -1;

    for (const [id, metadata] of this.metadata.entries()) {
      if (metadata.difficulty === difficulty && metadata.performance.rating > bestRating) {
        const engine = this.engines.get(id);
        if (engine) {
          bestEngine = engine;
          bestRating = metadata.performance.rating;
        }
      }
    }

    return bestEngine;
  }

  /**
   * 추천 엔진 (성능 + 사용률 기반)
   */
  getRecommended(): Engine | null {
    let bestEngine: Engine | null = null;
    let bestScore = -1;

    for (const [id, metadata] of this.metadata.entries()) {
      const stats = this.performanceStats.get(id);
      const performanceScore = metadata.performance.rating;
      const usageScore = stats ? Math.log(stats.totalRequests + 1) : 0;
      const reliabilityScore = stats ? (1 - stats.errors / (stats.totalRequests + 1)) * 100 : 100;

      const totalScore = performanceScore * 0.5 + usageScore * 0.2 + reliabilityScore * 0.3;

      if (totalScore > bestScore) {
        const engine = this.engines.get(id);
        if (engine) {
          bestEngine = engine;
          bestScore = totalScore;
        }
      }
    }

    return bestEngine;
  }

  // ===== Dynamic Loading =====

  /**
   * 동적 엔진 로딩
   */
  async loadEngine(enginePath: string, metadata: EngineMetadata): Promise<Engine> {
    const cacheKey = `${enginePath}:${metadata.id}`;

    // 이미 로딩 중이면 기존 Promise 반환
    if (this.loadingCache.has(cacheKey)) {
      return this.loadingCache.get(cacheKey)!;
    }

    // 새로운 로딩 시작
    const loadingPromise = this.loadEngineInternal(enginePath, metadata);
    this.loadingCache.set(cacheKey, loadingPromise);

    try {
      const engine = await loadingPromise;
      this.register(engine, metadata);
      return engine;
    } catch (error) {
      this.loadingCache.delete(cacheKey);
      throw error;
    }
  }

  private async loadEngineInternal(enginePath: string, metadata: EngineMetadata): Promise<Engine> {
    try {
      console.log(`[EngineRegistry] Loading engine from: ${enginePath}`);

      // 동적 import
      const engineModule = await import(enginePath);
      const EngineClass = engineModule.default || engineModule[metadata.name];

      if (!EngineClass) {
        throw new Error(`Engine class not found in module: ${enginePath}`);
      }

      // 엔진 인스턴스 생성
      const engine: Engine = new EngineClass();

      // 메타데이터 검증
      if (!this.validateEngine(engine, metadata)) {
        throw new Error(`Engine validation failed: ${metadata.name}`);
      }

      return engine;
    } catch (error) {
      console.error(`[EngineRegistry] Failed to load engine ${metadata.name}:`, error);
      throw error;
    }
  }

  // ===== Engine Analysis with Tracking =====

  /**
   * 엔진 분석 수행 (성능 추적 포함)
   */
  async analyze(engineId: string, request: EngineRequest): Promise<EngineResponse> {
    const engine = this.get(engineId);
    if (!engine) {
      throw new Error(`Engine not found: ${engineId}`);
    }

    const startTime = performance.now();
    let stats = this.performanceStats.get(engineId);

    if (!stats) {
      stats = { totalRequests: 0, totalTime: 0, errors: 0, lastUsed: 0 };
      this.performanceStats.set(engineId, stats);
    }

    try {
      stats.totalRequests++;
      stats.lastUsed = Date.now();

      const response = await engine.analyze(request);

      // 성능 추적
      const duration = performance.now() - startTime;
      stats.totalTime += duration;

      // 응답 검증 및 강화
      return {
        ...response,
        timeUsed: duration
      };

    } catch (error) {
      stats.errors++;
      console.error(`[EngineRegistry] Engine analysis failed (${engineId}):`, error);
      throw error;
    }
  }

  // ===== Engine Information =====

  /**
   * 등록된 모든 엔진 정보
   */
  listEngines(): EngineMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * 엔진 메타데이터 조회
   */
  getMetadata(engineId: string): EngineMetadata | null {
    return this.metadata.get(engineId) || null;
  }

  /**
   * 엔진 성능 통계
   */
  getPerformanceStats(engineId: string) {
    const stats = this.performanceStats.get(engineId);
    if (!stats) return null;

    return {
      ...stats,
      avgResponseTime: stats.totalRequests > 0 ? stats.totalTime / stats.totalRequests : 0,
      errorRate: stats.totalRequests > 0 ? stats.errors / stats.totalRequests : 0
    };
  }

  /**
   * 전체 시스템 통계
   */
  getSystemStats() {
    let totalEngines = this.engines.size;
    let totalRequests = 0;
    let totalTime = 0;
    let totalErrors = 0;

    for (const stats of this.performanceStats.values()) {
      totalRequests += stats.totalRequests;
      totalTime += stats.totalTime;
      totalErrors += stats.errors;
    }

    return {
      totalEngines,
      totalRequests,
      avgResponseTime: totalRequests > 0 ? totalTime / totalRequests : 0,
      errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
      uptime: Date.now() - this.startTime
    };
  }

  // ===== Validation & Utility =====

  private validateEngine(engine: Engine, metadata: EngineMetadata): boolean {
    // 기본 인터페이스 검증
    if (!engine.name || !engine.version || !engine.analyze) {
      return false;
    }

    // 메타데이터 일치성 검증
    if (engine.name !== metadata.name || engine.version !== metadata.version) {
      return false;
    }

    return true;
  }

  /**
   * 엔진 존재 여부 확인
   */
  has(engineId: string): boolean {
    return this.engines.has(engineId);
  }

  /**
   * 모든 엔진 제거
   */
  clear(): void {
    this.engines.clear();
    this.metadata.clear();
    this.loadingCache.clear();
    this.performanceStats.clear();
  }

  // 시스템 시작 시간 (통계용)
  private readonly startTime = Date.now();
}

// ===== Global Registry Instance =====

export const engineRegistry = new EngineRegistry();

// ===== Preset Engine Configurations =====

export const ENGINE_PRESETS = {
  BEGINNER: {
    tier: 'C',
    difficulty: 'easy' as AIDifficulty,
    maxDepth: 3,
    timeLimit: 500
  },
  INTERMEDIATE: {
    tier: 'B',
    difficulty: 'medium' as AIDifficulty,
    maxDepth: 5,
    timeLimit: 2000
  },
  ADVANCED: {
    tier: 'A',
    difficulty: 'hard' as AIDifficulty,
    maxDepth: 7,
    timeLimit: 5000
  },
  EXPERT: {
    tier: 'A',
    difficulty: 'expert' as AIDifficulty,
    maxDepth: 9,
    timeLimit: 10000
  }
} as const;

// ===== Convenience Functions =====

/**
 * 간편한 엔진 분석 함수
 */
export async function analyzePosition(
  gameCore: GameCore,
  difficulty: AIDifficulty = 'medium',
  timeLimit?: number
): Promise<EngineResponse> {
  const engine = engineRegistry.getBestForDifficulty(difficulty);

  if (!engine) {
    throw new Error(`No engine available for difficulty: ${difficulty}`);
  }

  return engineRegistry.analyze(engine.name, {
    gameCore,
    timeLimit
  });
}

/**
 * 추천 엔진으로 분석
 */
export async function analyzeWithRecommended(
  gameCore: GameCore,
  timeLimit?: number
): Promise<EngineResponse> {
  const engine = engineRegistry.getRecommended();

  if (!engine) {
    throw new Error('No recommended engine available');
  }

  return engineRegistry.analyze(engine.name, {
    gameCore,
    timeLimit
  });
}