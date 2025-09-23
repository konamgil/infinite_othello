import { useEffect, useState, useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * 성능 최적화를 위한 커스텀 훅
 * 
 * 디바이스 성능을 감지하고 자동으로 최적화 설정을 제안합니다.
 */
export function usePerformanceOptimizations() {
  const { ui, updateUISettings } = useGameStore();
  const [deviceInfo, setDeviceInfo] = useState({
    isLowEnd: false,
    memoryGB: 0,
    cores: 0,
    gpuTier: 'unknown' as 'low' | 'medium' | 'high' | 'unknown'
  });

  // 디바이스 성능 감지
  useEffect(() => {
    const detectDevicePerformance = () => {
      const info = {
        isLowEnd: false,
        memoryGB: 0,
        cores: 0,
        gpuTier: 'unknown' as 'low' | 'medium' | 'high' | 'unknown'
      };

      // 메모리 정보 (Chrome/Edge)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        info.memoryGB = Math.round(memory.jsHeapSizeLimit / (1024 * 1024 * 1024));
      }

      // CPU 코어 수
      info.cores = navigator.hardwareConcurrency || 4;

      // GPU 티어 감지 (간단한 WebGL 테스트)
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl && 'getExtension' in gl) {
          const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            // 간단한 GPU 분류
            if (renderer.includes('Intel') || renderer.includes('Mali') || renderer.includes('Adreno 4')) {
              info.gpuTier = 'low';
            } else if (renderer.includes('Adreno 5') || renderer.includes('Mali-G')) {
              info.gpuTier = 'medium';
            } else {
              info.gpuTier = 'high';
            }
          }
        }
      } catch (e) {
        info.gpuTier = 'unknown';
      }

      // 저성능 디바이스 판단
      info.isLowEnd = (
        info.memoryGB < 4 || // 4GB 미만
        info.cores < 4 || // 4코어 미만
        info.gpuTier === 'low' ||
        /Android.*Chrome\/[0-5][0-9]/.test(navigator.userAgent) // 구형 Android
      );

      setDeviceInfo(info);
    };

    detectDevicePerformance();
  }, []);

  // 자동 성능 최적화 제안
  const suggestOptimizations = useCallback(() => {
    if (deviceInfo.isLowEnd && !ui.performanceMode) {
      return {
        shouldEnablePerformanceMode: true,
        reason: '디바이스 성능을 감지하여 최적화 모드를 권장합니다.'
      };
    }
    return null;
  }, [deviceInfo.isLowEnd, ui.performanceMode]);

  // 성능 모드 토글
  const togglePerformanceMode = useCallback(() => {
    updateUISettings({ performanceMode: !ui.performanceMode });
  }, [ui.performanceMode, updateUISettings]);

  // 자동 최적화 적용
  const applyAutoOptimizations = useCallback(() => {
    if (deviceInfo.isLowEnd) {
      updateUISettings({ 
        performanceMode: true,
        animations: false // 저성능 디바이스에서는 애니메이션도 비활성화
      });
    }
  }, [deviceInfo.isLowEnd, updateUISettings]);

  return {
    deviceInfo,
    suggestOptimizations,
    togglePerformanceMode,
    applyAutoOptimizations,
    isPerformanceMode: ui.performanceMode
  };
}

/**
 * 애니메이션 프레임 최적화 훅
 * 성능 모드에 따라 프레임 레이트를 조절합니다.
 */
export function useOptimizedAnimationFrame(
  callback: (time: number) => void,
  enabled: boolean = true
) {
  const { ui } = useGameStore();
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const targetFPS = ui.performanceMode ? 30 : 60;
    const targetInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      if (currentTime - lastTimeRef.current >= targetInterval) {
        callback(currentTime);
        lastTimeRef.current = currentTime;
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [callback, enabled, ui.performanceMode]);
}

/**
 * 파티클 수 최적화 훅
 * 성능 모드에 따라 파티클 수를 조절합니다.
 */
export function useOptimizedParticleCount(baseCount: number): number {
  const { ui } = useGameStore();
  
  if (ui.performanceMode) {
    return Math.floor(baseCount * 0.3); // 30%로 감소
  }
  
  return baseCount;
}

/**
 * 캔버스 해상도 최적화 훅
 * 성능 모드에 따라 캔버스 해상도를 조절합니다.
 */
export function useOptimizedCanvasResolution(
  baseWidth: number, 
  baseHeight: number
): { width: number; height: number; dpr: number } {
  const { ui } = useGameStore();
  
  const maxDPR = ui.performanceMode ? 1.0 : 2.0;
  const dpr = Math.min(window.devicePixelRatio || 1, maxDPR);
  
  return {
    width: Math.round(baseWidth * dpr),
    height: Math.round(baseHeight * dpr),
    dpr
  };
}
