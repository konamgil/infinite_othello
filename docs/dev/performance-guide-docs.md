---
title: 성능 최적화 개발 가이드
owner: ai-team
status: approved
last_update: 2025-09-24
tags: [development, performance, optimization, guide]
related: [features/performance-optimization-docs.md, architecture/performance-architecture-docs.md]
---

# 🚀 성능 최적화 개발 가이드

## 📋 개발자 가이드 개요

이 문서는 Infinity Othello 프로젝트에서 성능 최적화 기능을 개발하고 유지보수하는 개발자를 위한 실용적인 가이드입니다. 코드 작성부터 테스트, 배포까지의 전체 과정을 다룹니다.

## 🛠️ 개발 환경 설정

### 1. 필수 도구
```bash
# Node.js 18+ 필요
node --version

# pnpm 패키지 매니저
npm install -g pnpm

# 프로젝트 의존성 설치
pnpm install
```

### 2. 개발 서버 실행
```bash
# 웹 앱 개발 서버
cd apps/web
pnpm dev

# 성능 모니터링과 함께 실행
pnpm dev -- --profile
```

### 3. 성능 테스트 도구
```bash
# Lighthouse 성능 테스트
pnpm lighthouse http://localhost:5173 --output=html --output-path=./lighthouse-report.html

# 번들 분석
pnpm build --analyze
```

## 🔧 성능 최적화 개발 패턴

### 1. 성능 훅 개발 패턴

#### 기본 훅 구조
```typescript
// src/hooks/usePerformanceOptimizations.ts
import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

export function usePerformanceOptimizations() {
  const { ui, updateUISettings } = useGameStore();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>();
  
  // 디바이스 성능 감지
  useEffect(() => {
    const detectPerformance = async () => {
      // 성능 감지 로직
    };
    
    detectPerformance();
  }, []);
  
  // 최적화 제안
  const suggestOptimizations = useCallback(() => {
    // 제안 로직
  }, [deviceInfo, ui.performanceMode]);
  
  return {
    deviceInfo,
    suggestOptimizations,
    // ... 기타 반환값
  };
}
```

#### 새로운 최적화 훅 추가
```typescript
// 새로운 최적화 훅 예시
export function useOptimizedTextureQuality(baseQuality: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
  const { ui } = useGameStore();
  
  if (ui.performanceMode) {
    // 성능 모드에서는 품질을 한 단계 낮춤
    switch (baseQuality) {
      case 'high': return 'medium';
      case 'medium': return 'low';
      case 'low': return 'low';
    }
  }
  
  return baseQuality;
}
```

### 2. 컴포넌트 최적화 패턴

#### 조건부 렌더링 패턴
```typescript
// 성능 모드에 따른 컴포넌트 선택
import { useGameStore } from '../store/gameStore';
import { HighPerformanceComponent } from './HighPerformanceComponent';
import { LowPerformanceComponent } from './LowPerformanceComponent';

export function PerformanceAwareComponent() {
  const { ui } = useGameStore();
  
  return (
    <div>
      {ui.performanceMode ? (
        <LowPerformanceComponent />
      ) : (
        <HighPerformanceComponent />
      )}
    </div>
  );
}
```

#### 메모이제이션 패턴
```typescript
import { memo, useMemo } from 'react';

// 무거운 컴포넌트 메모이제이션
export const ExpensiveComponent = memo(({ data }: { data: any[] }) => {
  const processedData = useMemo(() => {
    // 무거운 계산 로직
    return data.map(item => expensiveCalculation(item));
  }, [data]);
  
  return <div>{/* 렌더링 */}</div>;
});
```

### 3. 상태 관리 최적화 패턴

#### 선택적 구독 패턴
```typescript
// 필요한 상태만 구독
const performanceMode = useGameStore(state => state.ui.performanceMode);
const animations = useGameStore(state => state.ui.animations);

// 전체 UI 상태를 구독하지 않음 (비효율적)
// const ui = useGameStore(state => state.ui);
```

#### 배치 업데이트 패턴
```typescript
// 여러 상태를 한 번에 업데이트
const updateMultipleSettings = useCallback(() => {
  updateUISettings({
    performanceMode: true,
    animations: false,
    soundEnabled: true
  });
}, [updateUISettings]);
```

## 🧪 테스트 가이드

### 1. 성능 테스트

#### 단위 테스트
```typescript
// src/hooks/__tests__/usePerformanceOptimizations.test.ts
import { renderHook } from '@testing-library/react';
import { usePerformanceOptimizations } from '../usePerformanceOptimizations';

describe('usePerformanceOptimizations', () => {
  it('should detect low-end device correctly', () => {
    // 메모리 4GB 미만 시뮬레이션
    Object.defineProperty(performance, 'memory', {
      value: { jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 }, // 2GB
      writable: true
    });
    
    const { result } = renderHook(() => usePerformanceOptimizations());
    
    expect(result.current.deviceInfo.isLowEnd).toBe(true);
  });
});
```

#### 통합 테스트
```typescript
// src/features/more/pages/__tests__/settings.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsPage from '../index/page';

describe('Settings Page Performance Mode', () => {
  it('should toggle performance mode', () => {
    render(<SettingsPage />);
    
    const toggle = screen.getByRole('button', { name: /애니메이션 최적화/i });
    fireEvent.click(toggle);
    
    // 성능 모드가 활성화되었는지 확인
    expect(screen.getByText(/ON/i)).toBeInTheDocument();
  });
});
```

### 2. 성능 벤치마크

#### 렌더링 성능 테스트
```typescript
// src/__tests__/performance/rendering.test.ts
import { performance } from 'perf_hooks';

describe('Rendering Performance', () => {
  it('should render tower component within 16ms', async () => {
    const start = performance.now();
    
    render(<CinematicHologramTower currentFloor={1} maxFloor={300} />);
    
    const end = performance.now();
    const renderTime = end - start;
    
    expect(renderTime).toBeLessThan(16); // 60fps 기준
  });
});
```

#### 메모리 사용량 테스트
```typescript
// 메모리 누수 테스트
describe('Memory Usage', () => {
  it('should not leak memory on component unmount', () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    const { unmount } = render(<ExpensiveComponent />);
    unmount();
    
    // 가비지 컬렉션 대기
    setTimeout(() => {
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      expect(finalMemory).toBeLessThanOrEqual(initialMemory * 1.1); // 10% 허용
    }, 1000);
  });
});
```

## 📊 성능 모니터링

### 1. 개발 중 모니터링

#### React DevTools Profiler
```typescript
// 성능 프로파일링을 위한 컴포넌트 래핑
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration) {
  console.log('Render:', { id, phase, actualDuration });
}

<Profiler id="TowerComponent" onRender={onRenderCallback}>
  <CinematicHologramTower />
</Profiler>
```

#### 커스텀 성능 훅
```typescript
// 성능 모니터링 훅
export function usePerformanceMonitoring(componentName: string) {
  useEffect(() => {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      console.log(`${componentName} render time: ${end - start}ms`);
    };
  });
}
```

### 2. 프로덕션 모니터링

#### Web Vitals 수집
```typescript
// src/utils/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals(metric: any) {
  // 성능 지표를 분석 도구로 전송
  console.log(metric);
  
  // 예: Google Analytics
  gtag('event', metric.name, {
    value: Math.round(metric.value),
    event_category: 'Web Vitals',
  });
}

// 앱 초기화 시 Web Vitals 수집 시작
getCLS(reportWebVitals);
getFID(reportWebVitals);
getFCP(reportWebVitals);
getLCP(reportWebVitals);
getTTFB(reportWebVitals);
```

## 🚀 배포 및 최적화

### 1. 빌드 최적화

#### Vite 설정 최적화
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'performance': ['./src/hooks/usePerformanceOptimizations.ts'],
          'tower': ['./src/features/tower'],
        }
      }
    }
  }
});
```

#### 번들 분석
```bash
# 번들 크기 분석
pnpm build --analyze

# 성능 모드별 번들 크기 비교
pnpm build:performance
pnpm build:normal
```

### 2. 런타임 최적화

#### 지연 로딩
```typescript
// 성능 모드에 따른 지연 로딩
const LowPerformanceComponent = lazy(() => 
  import('./LowPerformanceComponent')
);
const HighPerformanceComponent = lazy(() => 
  import('./HighPerformanceComponent')
);

export function PerformanceAwareComponent() {
  const { ui } = useGameStore();
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {ui.performanceMode ? (
        <LowPerformanceComponent />
      ) : (
        <HighPerformanceComponent />
      )}
    </Suspense>
  );
}
```

## 🔍 디버깅 가이드

### 1. 성능 문제 진단

#### 일반적인 성능 문제
```typescript
// 1. 불필요한 리렌더링 확인
const ExpensiveComponent = memo(({ data }) => {
  console.log('ExpensiveComponent rendered'); // 디버깅용
  return <div>{/* 렌더링 */}</div>;
});

// 2. 메모리 누수 확인
useEffect(() => {
  const interval = setInterval(() => {
    console.log('Memory usage:', (performance as any).memory?.usedJSHeapSize);
  }, 1000);
  
  return () => clearInterval(interval);
}, []);
```

#### 성능 프로파일링 도구
```bash
# Chrome DevTools Performance 탭 사용
# 1. Record 시작
# 2. 성능 문제 재현
# 3. Record 중지
# 4. Flame Chart 분석
```

### 2. 성능 최적화 체크리스트

#### 개발 시 체크리스트
- [ ] 불필요한 리렌더링 방지 (memo, useMemo, useCallback)
- [ ] 큰 컴포넌트 분할
- [ ] 지연 로딩 적용
- [ ] 이미지 최적화
- [ ] 번들 크기 최적화

#### 배포 전 체크리스트
- [ ] Lighthouse 성능 점수 90+ 확인
- [ ] Core Web Vitals 지표 확인
- [ ] 메모리 누수 테스트
- [ ] 다양한 디바이스에서 테스트
- [ ] 네트워크 제한 환경에서 테스트

## 🔗 관련 문서

[📎 관련 문서: features/performance-optimization-docs.md]
[📎 관련 문서: architecture/performance-architecture-docs.md]
[📎 관련 문서: testing/performance-testing-docs.md]

## 📝 변경 이력

- **2025-09-24**: 초기 개발 가이드 작성
- **2025-09-24**: 성능 테스트 가이드 추가
- **2025-09-24**: 모니터링 및 디버깅 가이드 추가
- **2025-09-24**: 배포 최적화 가이드 추가

---

**문서 레벨**: Guide (참조용 가이드)
**최종 검토**: 2025-09-24
**다음 검토 예정**: 2025-10-24
