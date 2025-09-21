import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { GameReplay, GameMove } from '../types/replay';

/**
 * @interface VirtualScrollConfig
 * 가상 스크롤링 설정을 위한 인터페이스.
 */
interface VirtualScrollConfig {
  itemHeight: number;      // 각 항목의 높이
  containerHeight: number; // 스크롤 컨테이너의 높이
  overscan: number;        // 렌더링할 여분의 항목 수
}

/**
 * @interface PerformanceMetrics
 * 성능 모니터링을 위한 데이터 구조.
 */
interface PerformanceMetrics {
  renderTime: number;      // 평균 렌더링 시간
  memoryUsage: number;     // 메모리 사용량
  frameDrop: number;       // 프레임 드롭 횟수
  lastUpdate: number;      // 마지막 업데이트 시간
}

/**
 * @interface OptimizedReplayData
 * 최적화된 리플레이 데이터를 위한 구조.
 */
export interface OptimizedReplayData {
  boardStates: Array<Array<Array<number>>>; // 모든 턴의 보드 상태
  moveIndices: Map<string, number>;        // 'x,y' 좌표 문자열로 수의 인덱스를 찾는 맵
  evaluationCache: Map<number, number>;    // 수 인덱스로 평가 점수를 찾는 캐시
  positionKeys: string[];                  // 모든 수의 좌표 문자열 배열
  turningPoints: number[];                 // 게임의 전환점이 된 수의 인덱스 배열
}

/**
 * 긴 목록에 대한 가상 스크롤링을 구현하는 커스텀 훅.
 *
 * 스크롤 위치, 컨테이너 높이, 항목 높이를 기반으로 현재 보여야 할 항목들을 계산합니다.
 * 이를 통해 보이는 항목만 렌더링하여 긴 목록의 성능을 크게 향상시킵니다.
 *
 * @param {any[]} items - 가상화할 전체 항목 목록.
 * @param {VirtualScrollConfig} config - 항목 높이, 컨테이너 높이, overscan 개수 설정 객체.
 * @returns 보이는 항목, 리스트의 총 높이, 스크롤 핸들러를 포함한 객체.
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
 * 최적화된 렌더링을 위해 게임의 수 목록을 처리하고 메모이제이션하는 커스텀 훅.
 *
 * UI에서 자주 사용되는 값들(좌표 키, 시간 차이 등)을 미리 계산하고,
 * 처리된 수 목록을 캐시하여 리렌더링 시 중복 계산을 방지합니다.
 *
 * @param {GameMove[]} moves - 게임의 수 배열.
 * @returns 처리되고 메모이제이션된 수 목록.
 */
export function useOptimizedMoves(moves: GameMove[]) {
  const moveCache = useRef(new Map<string, any>());
  const lastMovesRef = useRef<GameMove[]>([]);

  const optimizedMoves = useMemo(() => {
    if (moves === lastMovesRef.current) {
      return lastMovesRef.current;
    }
    const cacheKey = `${moves.length}_${moves[0]?.timestamp}_${moves[moves.length - 1]?.timestamp}`;
    if (moveCache.current.has(cacheKey)) {
      return moveCache.current.get(cacheKey);
    }

    const processed = moves.map((move, index) => ({
      ...move,
      positionKey: `${move.x},${move.y}`,
      displayPosition: `${String.fromCharCode(65 + move.x)}${move.y + 1}`,
      isLastMove: index === moves.length - 1,
      isFirstMove: index === 0,
      qualityScore: calculateMoveQuality(move),
      timeDiff: index > 0 ? move.timestamp - moves[index - 1].timestamp : 0
    }));

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
 * 컴포넌트의 성능을 모니터링하기 위한 커스텀 훅.
 *
 * 평균 렌더링 시간, 프레임 드롭과 같은 메트릭을 추적하고, 이를 기반으로
 * 최적화 제안을 제공할 수 있습니다.
 *
 * @returns 성능 메트릭과 타이밍 제어 함수를 포함한 객체.
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

    if (frameTimeRef.current.length > 60) {
      frameTimeRef.current.shift();
    }

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
 * 주어진 리플레이의 모든 보드 상태를 미리 계산하고 캐시하는 커스텀 훅.
 *
 * 각 수 이후의 보드 상태를 계산하여 저장하는 무거운 최적화 작업입니다.
 * 이를 통해 리플레이의 어느 시점으로든 처음부터 다시 계산할 필요 없이 즉시 이동할 수 있습니다.
 *
 * @param {GameReplay} replay - 게임 리플레이 객체.
 * @returns {OptimizedReplayData} 모든 보드 상태를 포함한 최적화된 데이터.
 */
export function useOptimizedBoardStates(replay: GameReplay) {
  const boardStatesCache = useRef(new Map<string, OptimizedReplayData>());

  const optimizedData = useMemo(() => {
    const cacheKey = `${replay.id}_${replay.moves.length}`;
    if (boardStatesCache.current.has(cacheKey)) {
      return boardStatesCache.current.get(cacheKey)!;
    }

    const boardStates: Array<Array<Array<number>>> = [];
    const moveIndices = new Map<string, number>();
    const evaluationCache = new Map<number, number>();
    const positionKeys: string[] = [];
    const turningPoints: number[] = [];

    let currentBoard = Array.from({ length: 8 }, () => Array(8).fill(0));
    boardStates.push(JSON.parse(JSON.stringify(currentBoard)));

    replay.moves.forEach((move, index) => {
      currentBoard[move.y][move.x] = move.player === 'black' ? 1 : -1;
      move.flippedDiscs.forEach(pos => {
        currentBoard[pos.y][pos.x] = move.player === 'black' ? 1 : -1;
      });

      boardStates.push(JSON.parse(JSON.stringify(currentBoard)));
      moveIndices.set(`${move.x},${move.y}`, index);
      positionKeys.push(`${move.x},${move.y}`);

      if (move.evaluationScore !== undefined) {
        evaluationCache.set(index, move.evaluationScore);
      }
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
 * 값을 디바운스(debounce)하는 커스텀 훅.
 *
 * 원본 값이 변경된 후 지정된 딜레이 시간 동안 추가 변경이 없을 때만 새 값을 반환합니다.
 * 빠르게 변경되는 상태로 인한 과도한 리렌더링을 방지하는 데 유용합니다.
 *
 * @param {T} value - 디바운스할 값.
 * @param {number} delay - 디바운스 딜레이 (밀리초).
 * @returns {T} 디바운스된 값.
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
 * `requestAnimationFrame`을 사용하여 애니메이션을 실행하는 커스텀 훅.
 *
 * 브라우저의 렌더링 주기에 애니메이션을 동기화하여 부드럽고 효율적인 애니메이션을 보장합니다.
 *
 * @param {() => void} callback - 각 프레임에서 실행될 애니메이션 콜백 함수.
 * @param {React.DependencyList} deps - 콜백의 의존성 배열.
 * @param {boolean} [enabled=true] - 애니메이션 활성화 여부.
 * @returns 애니메이션을 중지하는 함수를 포함한 객체.
 */
export function useOptimizedAnimation(
  callback: () => void,
  deps: React.DependencyList,
  enabled: boolean = true
) {
  const requestRef = useRef<number>();
  const callbackRef = useRef(callback);

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
 * 대규모 데이터셋에 대한 페이지네이션을 관리하는 커스텀 훅.
 *
 * 현재 보이는 데이터와 페이지 로드 및 사전 로드 함수를 제공하여,
 * 무한 스크롤 구현에 유용할 수 있습니다.
 *
 * @param {T[]} data - 전체 데이터셋.
 * @param {number} [pageSize=50] - 페이지당 항목 수.
 * @returns 페이지네이션된 데이터와 제어 함수를 포함한 객체.
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

// 수 품질 계산을 위한 헬퍼 함수
function calculateMoveQuality(move: GameMove): number {
  if (move.isOptimal) return 100;
  if (move.evaluationScore === undefined) return 50;
  // 평가 점수를 0-100 범위로 정규화
  return Math.max(0, Math.min(100, 50 + move.evaluationScore));
}

/**
 * 정리(cleanup) 콜백을 관리하는 커스텀 훅.
 *
 * 컴포넌트가 언마운트될 때 호출될 정리 함수를 등록할 수 있게 해줍니다.
 * 메모리 누수 방지에 유용할 수 있습니다.
 *
 * @returns 정리 콜백을 추가하고 실행하는 함수를 포함한 객체.
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
        console.warn('정리 콜백 실패:', error);
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
 * 이 파일의 다른 모든 최적화 훅을 결합하는 포괄적인 훅.
 *
 * 리플레이 뷰어에 성능 최적화를 적용하기 위한 메인 진입점입니다.
 * 제공된 옵션에 따라 다양한 훅을 조건부로 적용합니다.
 *
 * @param {GameReplay} replay - 최적화할 게임 리플레이.
 * @param {object} [options] - 특정 최적화를 활성화/비활성화하는 옵션.
 * @returns 모든 최적화 데이터와 도구를 포함하는 객체.
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