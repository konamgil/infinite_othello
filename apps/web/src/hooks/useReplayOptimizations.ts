import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { GameReplay, GameMove } from '../types/replay';

// Virtual scrolling configuration
interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number;
}

// Performance monitoring
interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  frameDrop: number;
  lastUpdate: number;
}

// Optimized data structures
export interface OptimizedReplayData {
  boardStates: Array<Array<Array<number>>>;
  moveIndices: Map<string, number>;
  evaluationCache: Map<number, number>;
  positionKeys: string[];
  turningPoints: number[];
}

/**
 * Hook for virtual scrolling large move lists
 */
export function useVirtualScrolling(
  items: any[],
  config: VirtualScrollConfig
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(config.containerHeight);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / config.itemHeight) - config.overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / config.itemHeight) + config.overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, config.itemHeight, config.overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      ...item,
      originalIndex: visibleRange.startIndex + index,
      offsetTop: (visibleRange.startIndex + index) * config.itemHeight
    }));
  }, [items, visibleRange, config.itemHeight]);

  const totalHeight = items.length * config.itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    visibleRange,
    setContainerHeight
  };
}

/**
 * Hook for optimized move processing and memoization
 */
export function useOptimizedMoves(moves: GameMove[]) {
  const moveCache = useRef(new Map<string, any>());
  const lastMovesRef = useRef<GameMove[]>([]);

  const optimizedMoves = useMemo(() => {
    // Check if moves array has changed
    if (moves === lastMovesRef.current) {
      return lastMovesRef.current;
    }

    // Create cache key for the entire moves array
    const cacheKey = `${moves.length}_${moves[0]?.timestamp}_${moves[moves.length - 1]?.timestamp}`;

    if (moveCache.current.has(cacheKey)) {
      return moveCache.current.get(cacheKey);
    }

    // Process moves with optimizations
    const processed = moves.map((move, index) => ({
      ...move,
      // Pre-calculate frequently used values
      positionKey: `${move.x},${move.y}`,
      displayPosition: `${String.fromCharCode(65 + move.x)}${move.y + 1}`,
      isLastMove: index === moves.length - 1,
      isFirstMove: index === 0,
      // Cache evaluation calculations
      qualityScore: calculateMoveQuality(move),
      // Pre-calculate time differences
      timeDiff: index > 0 ? move.timestamp - moves[index - 1].timestamp : 0
    }));

    // Store in cache with size limit
    if (moveCache.current.size > 10) {
      const firstKey = moveCache.current.keys().next().value;
      moveCache.current.delete(firstKey);
    }
    moveCache.current.set(cacheKey, processed);
    lastMovesRef.current = moves;

    return processed;
  }, [moves]);

  return optimizedMoves;
}

/**
 * Hook for performance monitoring and optimization suggestions
 */
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    frameDrop: 0,
    lastUpdate: Date.now()
  });

  const frameTimeRef = useRef<number[]>([]);
  const renderStartRef = useRef<number>(0);

  const startRenderTiming = useCallback(() => {
    renderStartRef.current = performance.now();
  }, []);

  const endRenderTiming = useCallback(() => {
    const renderTime = performance.now() - renderStartRef.current;
    frameTimeRef.current.push(renderTime);

    // Keep only last 60 frame times
    if (frameTimeRef.current.length > 60) {
      frameTimeRef.current.shift();
    }

    // Calculate metrics
    const avgRenderTime = frameTimeRef.current.reduce((a, b) => a + b, 0) / frameTimeRef.current.length;
    const frameDrop = frameTimeRef.current.filter(time => time > 16.67).length; // 60fps = 16.67ms

    setMetrics(prev => ({
      ...prev,
      renderTime: avgRenderTime,
      frameDrop,
      lastUpdate: Date.now()
    }));
  }, []);

  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return null;
  }, []);

  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: string[] = [];

    if (metrics.renderTime > 16) {
      suggestions.push('렌더링 시간이 느립니다. 가상 스크롤링을 고려해보세요.');
    }

    if (metrics.frameDrop > 5) {
      suggestions.push('프레임 드롭이 감지되었습니다. 애니메이션을 단순화하세요.');
    }

    const memory = getMemoryUsage();
    if (memory && memory.used > memory.limit * 0.8) {
      suggestions.push('메모리 사용량이 높습니다. 데이터 캐시를 정리하세요.');
    }

    if (suggestions.length === 0) {
      suggestions.push('성능이 최적화되어 있습니다.');
    }

    return suggestions;
  }, [metrics, getMemoryUsage]);

  return {
    metrics,
    startRenderTiming,
    endRenderTiming,
    getMemoryUsage,
    getOptimizationSuggestions
  };
}

/**
 * Hook for efficient board state calculations
 */
export function useOptimizedBoardStates(replay: GameReplay) {
  const boardStatesCache = useRef(new Map<string, OptimizedReplayData>());

  const optimizedData = useMemo(() => {
    const cacheKey = `${replay.id}_${replay.moves.length}`;

    if (boardStatesCache.current.has(cacheKey)) {
      return boardStatesCache.current.get(cacheKey)!;
    }

    // Pre-calculate all board states
    const boardStates: Array<Array<Array<number>>> = [];
    const moveIndices = new Map<string, number>();
    const evaluationCache = new Map<number, number>();
    const positionKeys: string[] = [];
    const turningPoints: number[] = [];

    // Initialize empty board
    let currentBoard = Array.from({ length: 8 }, () => Array(8).fill(0));
    boardStates.push(JSON.parse(JSON.stringify(currentBoard)));

    // Process each move
    replay.moves.forEach((move, index) => {
      // Update board state
      currentBoard[move.y][move.x] = move.player === 'black' ? 1 : -1;

      // Apply flipped discs
      move.flippedDiscs.forEach(pos => {
        currentBoard[pos.y][pos.x] = move.player === 'black' ? 1 : -1;
      });

      // Store optimized data
      boardStates.push(JSON.parse(JSON.stringify(currentBoard)));
      moveIndices.set(`${move.x},${move.y}`, index);
      positionKeys.push(`${move.x},${move.y}`);

      if (move.evaluationScore !== undefined) {
        evaluationCache.set(index, move.evaluationScore);
      }

      // Detect turning points
      if (index > 0 && move.evaluationScore !== undefined && replay.moves[index - 1].evaluationScore !== undefined) {
        const scoreDiff = Math.abs(move.evaluationScore - replay.moves[index - 1].evaluationScore!);
        if (scoreDiff > 20) {
          turningPoints.push(index);
        }
      }
    });

    const optimizedData: OptimizedReplayData = {
      boardStates,
      moveIndices,
      evaluationCache,
      positionKeys,
      turningPoints
    };

    // Cache with size limit
    if (boardStatesCache.current.size > 5) {
      const firstKey = boardStatesCache.current.keys().next().value;
      boardStatesCache.current.delete(firstKey);
    }
    boardStatesCache.current.set(cacheKey, optimizedData);

    return optimizedData;
  }, [replay.id, replay.moves]);

  return optimizedData;
}

/**
 * Hook for debounced state updates to prevent excessive re-renders
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for optimized animation frames
 */
export function useOptimizedAnimation(
  callback: () => void,
  deps: React.DependencyList,
  enabled: boolean = true
) {
  const requestRef = useRef<number>();
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);

  const animate = useCallback(() => {
    if (enabled) {
      callbackRef.current();
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      requestRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [enabled, animate]);

  const stop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  }, []);

  return { stop };
}

/**
 * Hook for managing large datasets with pagination
 */
export function usePaginatedData<T>(
  data: T[],
  pageSize: number = 50
) {
  const [currentPage, setCurrentPage] = useState(0);
  const [loadedPages, setLoadedPages] = useState(new Set([0]));

  const totalPages = Math.ceil(data.length / pageSize);

  const visibleData = useMemo(() => {
    const result: T[] = [];
    for (const page of loadedPages) {
      const start = page * pageSize;
      const end = Math.min(start + pageSize, data.length);
      result.push(...data.slice(start, end));
    }
    return result.sort((a: any, b: any) => {
      // Assuming items have an index or can be sorted
      const aIndex = data.indexOf(a);
      const bIndex = data.indexOf(b);
      return aIndex - bIndex;
    });
  }, [data, pageSize, loadedPages]);

  const loadPage = useCallback((page: number) => {
    if (page >= 0 && page < totalPages) {
      setLoadedPages(prev => new Set([...prev, page]));
      setCurrentPage(page);
    }
  }, [totalPages]);

  const preloadNextPage = useCallback(() => {
    const nextPage = currentPage + 1;
    if (nextPage < totalPages && !loadedPages.has(nextPage)) {
      loadPage(nextPage);
    }
  }, [currentPage, totalPages, loadedPages, loadPage]);

  return {
    visibleData,
    currentPage,
    totalPages,
    loadPage,
    preloadNextPage,
    isPageLoaded: (page: number) => loadedPages.has(page)
  };
}

// Helper function for move quality calculation
function calculateMoveQuality(move: GameMove): number {
  if (move.isOptimal) return 100;
  if (move.evaluationScore === undefined) return 50;

  // Normalize evaluation score to 0-100 range
  return Math.max(0, Math.min(100, 50 + move.evaluationScore));
}

/**
 * Hook for memory cleanup and garbage collection optimization
 */
export function useMemoryCleanup() {
  const cleanupCallbacks = useRef<(() => void)[]>([]);

  const addCleanupCallback = useCallback((callback: () => void) => {
    cleanupCallbacks.current.push(callback);
  }, []);

  const cleanup = useCallback(() => {
    cleanupCallbacks.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Cleanup callback failed:', error);
      }
    });
    cleanupCallbacks.current = [];
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { addCleanupCallback, cleanup };
}

/**
 * Combined optimization hook that provides all optimizations
 */
export function useReplayOptimizations(replay: GameReplay, options?: {
  enableVirtualScrolling?: boolean;
  enablePerformanceMonitoring?: boolean;
  pageSize?: number;
}) {
  const {
    enableVirtualScrolling = true,
    enablePerformanceMonitoring = true,
    pageSize = 50
  } = options || {};

  const optimizedMoves = useOptimizedMoves(replay.moves);
  const optimizedBoardData = useOptimizedBoardStates(replay);
  const performanceMonitoring = enablePerformanceMonitoring ? usePerformanceMonitoring() : null;
  const paginatedData = usePaginatedData(optimizedMoves, pageSize);
  const memoryCleanup = useMemoryCleanup();

  // Virtual scrolling for move list
  const virtualScrolling = enableVirtualScrolling
    ? useVirtualScrolling(optimizedMoves, {
        itemHeight: 40,
        containerHeight: 400,
        overscan: 5
      })
    : null;

  return {
    optimizedMoves,
    optimizedBoardData,
    performanceMonitoring,
    paginatedData,
    virtualScrolling,
    memoryCleanup
  };
}