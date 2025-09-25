// Transposition Table implementation with aging
// Converted from search-neo.js makeTT function

import type { Position } from '../../types';

export enum TTFlag {
  EXACT = 0,  // Exact score
  LOWER = 1,  // Lower bound (fail-high)
  UPPER = 2   // Upper bound (fail-low)
}

export interface TTEntry {
  depth: number;
  flag: TTFlag;
  score: number;
  bestMove?: Position;
  age: number;
}

/**
 * Transposition Table with aging eviction policy
 */
export class TranspositionTable {
  private table = new Map<string, TTEntry>();
  private currentAge = 0;
  private readonly maxSize: number;

  constructor(maxSize: number = 200000) {
    this.maxSize = maxSize;
  }

  /**
   * Get current age
   */
  getAge(): number {
    return this.currentAge;
  }

  /**
   * Increment age (called at start of each search)
   */
  bumpAge(): void {
    this.currentAge = (this.currentAge + 1) | 0;
  }

  /**
   * Get entry from table
   */
  get(key: string): TTEntry | undefined {
    return this.table.get(key);
  }

  /**
   * Store entry in table with eviction if needed
   */
  set(key: string, entry: TTEntry): void {
    // Check if table is full
    if (this.table.size >= this.maxSize) {
      this.evictOldEntries();
    }

    // Set the entry with current age
    this.table.set(key, { ...entry, age: this.currentAge });
  }

  /**
   * Evict old entries when table is full
   */
  private evictOldEntries(): void {
    // Remove ~2% of oldest entries
    const evictionCount = Math.max(1, Math.floor(this.maxSize * 0.02));
    let removed = 0;

    // First pass: remove entries from previous ages
    for (const [key, entry] of this.table.entries()) {
      if (entry.age !== this.currentAge) {
        this.table.delete(key);
        removed++;
        if (removed >= evictionCount) break;
      }
    }

    // If we still need more space, remove some current age entries
    if (this.table.size >= this.maxSize) {
      let fallbackRemoved = 0;
      const fallbackLimit = 64;

      for (const key of this.table.keys()) {
        this.table.delete(key);
        fallbackRemoved++;
        if (fallbackRemoved >= fallbackLimit) break;
      }
    }
  }

  /**
   * Clear the entire table
   */
  clear(): void {
    this.table.clear();
    this.currentAge = 0;
  }

  /**
   * Get table statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    age: number;
    fillRatio: number;
  } {
    return {
      size: this.table.size,
      maxSize: this.maxSize,
      age: this.currentAge,
      fillRatio: this.table.size / this.maxSize,
    };
  }

  /**
   * Check if entry is usable for given depth
   */
  isUsable(entry: TTEntry | undefined, depth: number): boolean {
    return entry !== undefined && entry.depth >= depth;
  }

  /**
   * Extract best move from entry
   */
  getBestMove(entry: TTEntry | undefined): Position | undefined {
    return entry?.bestMove;
  }

  /**
   * Check if entry provides cutoff for alpha-beta bounds
   */
  providesScoreCutoff(
    entry: TTEntry,
    alpha: number,
    beta: number,
    depth: number
  ): { cutoff: boolean; score?: number; newAlpha?: number; newBeta?: number } {
    if (!this.isUsable(entry, depth)) {
      return { cutoff: false };
    }

    const { flag, score } = entry;

    // Exact score
    if (flag === TTFlag.EXACT) {
      return { cutoff: true, score };
    }

    // Lower bound (fail-high)
    if (flag === TTFlag.LOWER && score >= beta) {
      return { cutoff: true, score };
    }

    // Upper bound (fail-low)
    if (flag === TTFlag.UPPER && score <= alpha) {
      return { cutoff: true, score };
    }

    // Window tightening
    let newAlpha = alpha;
    let newBeta = beta;

    if (flag === TTFlag.LOWER) {
      newAlpha = Math.max(alpha, score);
    } else if (flag === TTFlag.UPPER) {
      newBeta = Math.min(beta, score);
    }

    // Check for window closure
    if (newAlpha >= newBeta) {
      return { cutoff: true, score };
    }

    return {
      cutoff: false,
      newAlpha: newAlpha !== alpha ? newAlpha : undefined,
      newBeta: newBeta !== beta ? newBeta : undefined
    };
  }

  /**
   * Create TT entry for storage
   */
  createEntry(
    depth: number,
    score: number,
    bestMove: Position | undefined,
    alpha: number,
    beta: number
  ): TTEntry {
    let flag: TTFlag;

    if (score <= alpha) {
      flag = TTFlag.UPPER;
    } else if (score >= beta) {
      flag = TTFlag.LOWER;
    } else {
      flag = TTFlag.EXACT;
    }

    return {
      depth,
      flag,
      score,
      bestMove,
      age: this.currentAge,
    };
  }
}
