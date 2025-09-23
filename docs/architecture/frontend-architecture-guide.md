# Infinity Othello 프론트엔드 아키텍처 가이드

## 개요

Infinity Othello는 메타데이터 기반 라우팅과 Feature-based 아키텍처를 채택한 모던 React 애플리케이션입니다. 이 문서는 프로젝트의 전체적인 구조와 설계 철학, 그리고 각 구성 요소의 역할을 상세히 설명합니다.

## 목차
1. [프로젝트 구조](#프로젝트-구조)
2. [메타데이터 기반 라우팅 시스템](#메타데이터-기반-라우팅-시스템)
3. [Feature-based 아키텍처](#feature-based-아키텍처)
4. [상태 관리 시스템](#상태-관리-시스템)
5. [UI 컴포넌트 아키텍처](#ui-컴포넌트-아키텍처)
6. [장단점 분석](#장단점-분석)
7. [실제 구현 예시](#실제-구현-예시)
8. [개발 가이드라인](#개발-가이드라인)

---

## 프로젝트 구조

### 모노레포 구조
```
Infinity_Othello/
├── apps/
│   └── web/                 # 메인 웹 애플리케이션
│       ├── src/
│       │   ├── app/         # 애플리케이션 코어 (라우팅, 전역 설정)
│       │   ├── features/    # 기능별 모듈
│       │   ├── ui/          # 재사용 가능한 UI 컴포넌트
│       │   └── store/       # 전역 상태 관리
│       └── package.json
├── packages/                # 공유 패키지
│   ├── core/               # 비즈니스 로직
│   ├── engine-a/           # 게임 엔진
│   ├── render/             # 렌더링 엔진
│   └── shared-types/       # 공유 타입 정의
└── turbo.json              # Turbo 모노레포 설정
```

### 프론트엔드 디렉토리 구조
```
apps/web/src/
├── app/                    # 애플리케이션 코어
│   ├── router/            # 라우팅 관련 코드
│   │   ├── meta.ts        # 라우트 메타데이터 타입 정의
│   │   ├── routeFactories.tsx  # 라우트 생성 팩토리
│   │   ├── routeTree.tsx  # 라우트 트리 구성
│   │   └── index.ts       # 라우터 설정
│   └── App.tsx            # 메인 앱 컴포넌트
├── features/              # 기능별 모듈
│   ├── battle/           # 대전 기능
│   ├── tower/            # 탑 모드
│   ├── stella/           # 스텔라 시스템
│   └── more/             # 추가 기능
├── ui/                   # 재사용 UI 컴포넌트
│   ├── layout/          # 레이아웃 컴포넌트
│   ├── navigation/      # 네비게이션 컴포넌트
│   ├── game/            # 게임 관련 UI
│   └── theme/           # 테마 및 스타일
└── store/               # 전역 상태 관리
    ├── appStore.ts      # 앱 전역 상태
    ├── gameStore.ts     # 게임 상태
    ├── authStore.ts     # 인증 상태
    ├── networkStore.ts  # 네트워크 상태
    └── othelloStore.ts  # 오델로 게임 상태
```

---

## 메타데이터 기반 라우팅 시스템

### 핵심 개념

메타데이터 기반 라우팅은 각 라우트에 선언적 메타데이터를 첨부하여 자동화된 기능들을 제공하는 시스템입니다.

### 메타데이터 타입 정의

```typescript
// apps/web/src/app/router/meta.ts
export type BaseRouteMeta = {
  /** 하단 네비게이션 숨김 여부 */
  hideBottomNav?: boolean;
  /** 인증 필요 여부 */
  requiresAuth?: boolean;
  /** 브레드크럼 경로 */
  breadcrumb?: string[];
};

export type RootRouteMeta = BaseRouteMeta & {
  isRoot: true;
  title: string;           // 페이지 제목
  icon: LucideIcon;       // 네비게이션 아이콘
  navPath: string;        // 네비게이션 경로
};

export type ChildRouteMeta = BaseRouteMeta & {
  isRoot?: false;
  title?: string;
  icon?: LucideIcon;
  navPath?: string;
};
```

### Factory Pattern을 통한 라우트 생성

```typescript
// apps/web/src/app/router/routeFactories.tsx
export function createFeatureRoute(config: {
  id: string;
  path: string;
  meta: RouteMeta;
  layout?: React.ComponentType<any>;
  errorBoundary?: React.ReactElement;
  children: ChildDef[];
  catchAll?: { element: React.ReactElement; meta?: Partial<RouteMeta> };
}): AppRouteObject {
  // 메타데이터 상속 로직
  const toChildMeta = (parent: RouteMeta, overrides?: Partial<RouteMeta>): RouteMeta => ({
    hideBottomNav: overrides?.hideBottomNav ?? parent.hideBottomNav,
    requiresAuth: overrides?.requiresAuth ?? parent.requiresAuth,
    // ... 기타 속성 상속
  });

  return {
    id,
    path,
    handle: { meta },
    errorElement: errorBoundary,
    children: children.map(c => ({
      ...(c.index ? { index: true } : { path: c.path }),
      element: c.element,
      handle: { meta: toChildMeta(meta, c.meta) }
    }))
  };
}
```

### 자동화되는 기능들

1. **네비게이션 자동 생성**: 루트 메타데이터로부터 하단 네비게이션 자동 구성
2. **인증 가드**: `requiresAuth` 플래그로 자동 인증 검사
3. **레이아웃 제어**: `hideBottomNav`로 네비게이션 표시/숨김 제어
4. **에러 바운더리**: 기능별 에러 처리 컴포넌트 자동 적용
5. **브레드크럼**: 메타데이터 기반 경로 표시

### 기존 React Router 대비 장점

| 기능 | 기존 방식 | 메타데이터 방식 |
|------|-----------|----------------|
| 네비게이션 생성 | 수동으로 각 페이지 추가 | 메타데이터로 자동 생성 |
| 인증 검사 | 각 컴포넌트에서 개별 처리 | 메타데이터 플래그로 일괄 처리 |
| 레이아웃 제어 | 컴포넌트별 조건부 렌더링 | 메타데이터 기반 자동 제어 |
| 에러 처리 | 각 라우트에 개별 설정 | Factory Pattern으로 일관성 있는 처리 |

---

## Feature-based 아키텍처

### 기능별 모듈 구조

각 기능은 독립적인 모듈로 구성되며, 다음과 같은 구조를 가집니다:

```
features/battle/
├── route.tsx           # 라우트 정의 및 메타데이터
├── layouts/           # 기능별 레이아웃
│   └── BattleLayout.tsx
├── pages/             # 페이지 컴포넌트
│   ├── index/         # 메인 페이지
│   ├── quick/         # 빠른 매치
│   ├── ranked/        # 랭크 매치
│   └── tournament/    # 토너먼트
└── components/        # 기능별 컴포넌트
```

### 실제 구현 예시

```typescript
// apps/web/src/features/battle/route.tsx
const BATTLE_ROOT_META: RouteMeta = {
  isRoot: true,
  requiresAuth: false,
  title: '랭크전',
  icon: Swords,
  navPath: '/battle',
};

const BATTLE_DETAIL_META: RouteMeta = {
  requiresAuth: false,
  hideBottomNav: true,
  title: '배틀 상세',
  icon: Sword,
};

export const battleRoute: AppRouteObject = createFeatureRoute({
  id: 'battle-root',
  path: 'battle',
  meta: BATTLE_ROOT_META,
  layout: BattleLayout,
  errorBoundary: createFeatureErrorBoundary(BattleLayout, '전투 정보를 불러오지 못했습니다.'),
  children: [
    { index: true, element: <BattleHome /> },
    {
      path: 'quick',
      element: <QuickMatchPage />,
      meta: { ...BATTLE_DETAIL_META, title: '빠른 매치' }
    },
    {
      path: 'ranked',
      element: <RankedMatchPage />,
      meta: { ...BATTLE_DETAIL_META, title: '랭크 매치' }
    },
  ],
  catchAll: {
    element: createFeatureNotFound(BattleLayout, '해당 전투 페이지를 찾을 수 없습니다.'),
    meta: { ...BATTLE_DETAIL_META, title: '전투 없음' }
  },
});
```

### 장점

1. **모듈성**: 각 기능이 독립적으로 개발 및 배포 가능
2. **확장성**: 새로운 기능 추가 시 기존 코드에 영향 없음
3. **유지보수성**: 기능별로 코드가 분리되어 변경 영향도 최소화
4. **재사용성**: 공통 패턴을 Factory로 추상화

---

## 상태 관리 시스템

### Zustand 기반 전문화 스토어

총 5개의 전문화된 스토어로 상태를 분리 관리합니다:

#### 1. AppStore - 애플리케이션 전역 상태

```typescript
// apps/web/src/store/appStore.ts
export interface AppState {
  loading: {
    global: boolean;
    page: string | null;
    operation: string | null;
  };
  error: {
    global: Error | null;
    network: Error | null;
    game: Error | null;
  };
  notifications: NotificationItem[];
  settings: {
    language: 'ko' | 'en' | 'ja';
    timezone: string;
    debugMode: boolean;
    performanceMode: boolean;
  };
  device: {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    orientation: 'portrait' | 'landscape';
    online: boolean;
  };
}
```

**책임**: 로딩 상태, 에러 처리, 알림, 앱 설정, 디바이스 정보

#### 2. GameStore - 게임 상태 관리
**책임**: 게임 세션, 플레이어 정보, 게임 모드

#### 3. AuthStore - 인증 상태 관리
**책임**: 사용자 인증, 권한, 프로필 정보

#### 4. NetworkStore - 네트워크 상태 관리
**책임**: 소켓 연결, API 통신, 실시간 동기화

#### 5. OthelloStore - 오델로 게임 로직
**책임**: 게임 보드, 턴 관리, 게임 규칙

### 스토어 통합 및 편의성 훅

```typescript
// apps/web/src/store/index.ts
export * from './gameStore';
export * from './appStore';
export * from './othelloStore';
export * from './networkStore';
export * from './authStore';

// 편의성 훅 제공
export const useLoading = () => useAppStore((state) => state.loading);
export const useAppActions = () => useAppStore((state) => ({
  setLoading: state.setLoading,
  clearLoading: state.clearLoading,
  setError: state.setError,
  // ... 기타 액션들
}));
```

### 데이터 플로우

```
UI Component → Action Dispatch → Store Update → UI Re-render
     ↑                                              ↓
State Subscription ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

### 장점

1. **관심사 분리**: 각 스토어가 명확한 책임을 가짐
2. **성능 최적화**: 필요한 상태에만 구독하여 불필요한 리렌더링 방지
3. **타입 안전성**: TypeScript로 강타입 지원
4. **디버깅**: Zustand devtools로 상태 변화 추적
5. **지속성**: persist 미들웨어로 설정 정보 자동 저장

---

## UI 컴포넌트 아키텍처

### 계층적 레이아웃 구조

```
RootLayout (앱 전체 레이아웃)
├── Header (상단 헤더)
├── Feature Layout (기능별 레이아웃)
│   └── Page Content
└── BottomNav (하단 네비게이션)
```

### 모바일 퍼스트 디자인

```typescript
// apps/web/src/ui/navigation/BottomNav.tsx
export function BottomNav({ items, activePath }: BottomNavProps) {
  // 경로 정규화 및 활성 상태 계산
  const normalizedCurrent = normalizePath(location.pathname);
  const fallbackActive = getRootSegment(normalizedCurrent);

  return (
    <nav className="relative px-4 py-2 bg-gradient-to-t from-slate-800/60 via-purple-900/25 to-transparent backdrop-blur-3xl">
      {/* 파티클 애니메이션 */}
      <div className="absolute inset-0 opacity-40 overflow-hidden">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="absolute rounded-full animate-pulse" />
        ))}
      </div>

      {/* 네비게이션 아이템들 */}
      <div className="relative flex justify-around items-center">
        {items.map((item) => (
          <NavItem key={item.path} {...item} isActive={/* 자동 활성화 로직 */} />
        ))}
      </div>
    </nav>
  );
}
```

### Tailwind CSS 커스텀 테마

```typescript
// apps/web/tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Night Sky Space 테마
        space: {
          void: {
            50: '#0f0f23',
            500: '#000003',
          },
          cosmic: {
            star: '#ffffff',
            nebula: '#6366f1',
            galaxy: '#8b5cf6',
            meteor: '#f59e0b',
            aurora: '#10b981',
          },
        },
        tower: {
          deep: { /* 깊은 우주 색상 */ },
          gold: { /* 승리 골드 색상 */ },
          cyber: { /* 사이버 블루 */ },
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans KR', 'Exo 2', 'system-ui'],
        display: ['Orbitron', 'IBM Plex Sans KR'],
        korean: ['IBM Plex Sans KR', 'system-ui'],
      },
    },
  },
};
```

### 컴포넌트 설계 원칙

1. **단일 책임**: 각 컴포넌트는 하나의 명확한 목적
2. **합성 가능**: 작은 컴포넌트들을 조합하여 복잡한 UI 구성
3. **접근성**: ARIA 속성과 키보드 네비게이션 지원
4. **반응형**: 모바일 퍼스트로 다양한 화면 크기 대응

---

## 장단점 분석

### 장점

#### 메타데이터 기반 라우팅
✅ **자동화**: 네비게이션, 인증, 레이아웃 제어가 선언적으로 처리
✅ **일관성**: Factory Pattern으로 모든 라우트가 동일한 패턴 적용
✅ **유지보수성**: 메타데이터 변경만으로 여러 기능 동시 업데이트
✅ **타입 안전성**: TypeScript로 메타데이터 타입 검증

#### Feature-based 아키텍처
✅ **모듈성**: 기능별 독립 개발 및 테스트 가능
✅ **확장성**: 새 기능 추가 시 기존 코드 영향 없음
✅ **팀 협업**: 기능별로 담당자 분리 가능
✅ **코드 분할**: 번들 사이즈 최적화

#### 전문화 스토어
✅ **성능**: 필요한 상태에만 구독으로 리렌더링 최소화
✅ **디버깅**: 상태별 디버깅 도구 활용 가능
✅ **테스트**: 각 스토어를 독립적으로 테스트

### 단점

#### 메타데이터 기반 라우팅
❌ **학습 비용**: 팀원들이 새로운 패턴 이해 필요
❌ **복잡성**: 단순한 페이지도 메타데이터 정의 필수
❌ **디버깅**: 자동화된 부분의 문제 추적 어려움
❌ **유연성 제한**: 특수한 케이스 처리 시 제약

#### Feature-based 아키텍처
❌ **초기 설정**: 프로젝트 초기 구조 설정 복잡
❌ **코드 중복**: 기능 간 유사한 코드 중복 가능
❌ **의존성 관리**: 기능 간 의존성 관리 주의 필요

#### 전문화 스토어
❌ **복잡성**: 5개 스토어 간 상호작용 관리
❌ **보일러플레이트**: 각 스토어마다 유사한 코드 반복
❌ **상태 동기화**: 스토어 간 상태 동기화 이슈 가능

### 적용 시나리오

#### 적합한 경우
- 중대형 규모의 SPA 애플리케이션
- 여러 팀이 협업하는 프로젝트
- 기능이 명확히 분리되는 도메인
- 일관된 UX/UI 패턴이 중요한 프로젝트
- 장기 유지보수가 예상되는 프로젝트

#### 부적합한 경우
- 단순한 정적 웹사이트
- 프로토타입이나 MVP
- 팀 규모가 매우 작은 경우 (1-2명)
- 빠른 개발 속도가 최우선인 경우
- 기능 간 경계가 불분명한 경우

---

## 실제 구현 예시

### 새로운 기능 추가하기

1. **기능 디렉토리 생성**
```bash
mkdir src/features/shop
cd src/features/shop
```

2. **라우트 메타데이터 정의**
```typescript
// features/shop/route.tsx
const SHOP_ROOT_META: RouteMeta = {
  isRoot: true,
  requiresAuth: true,  // 상점은 로그인 필요
  title: '상점',
  icon: ShoppingBag,
  navPath: '/shop',
};

const SHOP_DETAIL_META: RouteMeta = {
  requiresAuth: true,
  hideBottomNav: true,
  title: '상품 상세',
  icon: Package,
};
```

3. **라우트 생성**
```typescript
export const shopRoute: AppRouteObject = createFeatureRoute({
  id: 'shop-root',
  path: 'shop',
  meta: SHOP_ROOT_META,
  layout: ShopLayout,
  errorBoundary: createFeatureErrorBoundary(ShopLayout, '상점 정보를 불러올 수 없습니다.'),
  children: [
    { index: true, element: <ShopHome /> },
    {
      path: 'item/:id',
      element: <ItemDetail />,
      meta: { ...SHOP_DETAIL_META }
    },
    {
      path: 'cart',
      element: <Cart />,
      meta: { ...SHOP_DETAIL_META, title: '장바구니' }
    },
  ],
  catchAll: {
    element: createFeatureNotFound(ShopLayout, '해당 상품을 찾을 수 없습니다.')
  },
});
```

4. **라우트 트리에 추가**
```typescript
// app/router/rootRoutes.ts
import { shopRoute } from '../../features/shop/route';

export const appRootChildren: AppRouteObject[] = [
  // ... 기존 라우트들
  shopRoute,
];
```

### 자동화 작동 원리

위 코드만으로 다음이 자동으로 처리됩니다:

1. **네비게이션 자동 추가**: 하단 네비게이션에 "상점" 탭 추가
2. **인증 가드**: `/shop` 경로 접근 시 자동 로그인 검증
3. **레이아웃 제어**: 상품 상세 페이지에서 하단 네비게이션 자동 숨김
4. **에러 처리**: 상점 관련 에러 시 일관된 에러 UI 표시
5. **404 처리**: 존재하지 않는 상품 페이지 접근 시 적절한 안내

### 상태 관리 패턴

```typescript
// store/shopStore.ts
export interface ShopState {
  products: Product[];
  cart: CartItem[];
  favorites: string[];
  loading: {
    products: boolean;
    cart: boolean;
  };
}

export const useShopStore = create<ShopStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 상태 초기화
        products: [],
        cart: [],
        favorites: [],
        loading: { products: false, cart: false },

        // 액션 정의
        addToCart: (product) => set((state) => ({
          cart: [...state.cart, { ...product, quantity: 1 }]
        })),

        // ... 기타 액션들
      }),
      {
        name: 'infinity-othello-shop-store',
        partialize: (state) => ({
          cart: state.cart,
          favorites: state.favorites,
        }),
      }
    )
  )
);
```

### UI 컴포넌트 패턴

```typescript
// features/shop/components/ProductCard.tsx
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onToggleFavorite: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart, onToggleFavorite }: ProductCardProps) {
  return (
    <div className="bg-space-void-100 rounded-lg p-4 border border-space-cosmic-nebula/20">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-32 object-cover rounded-md mb-3"
      />
      <h3 className="text-lg font-semibold text-white mb-2">{product.name}</h3>
      <p className="text-tower-gold-400 text-xl font-bold mb-3">{product.price} 코인</p>

      <div className="flex gap-2">
        <button
          onClick={() => onAddToCart(product)}
          className="flex-1 bg-tower-cyber-500 hover:bg-tower-cyber-400 text-white py-2 px-4 rounded-md transition-colors"
        >
          장바구니 추가
        </button>
        <button
          onClick={() => onToggleFavorite(product.id)}
          className="p-2 text-tower-gold-400 hover:text-tower-gold-300 transition-colors"
        >
          <Heart className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
```

---

## 개발 가이드라인

### 새로운 기능 개발 시 체크리스트

#### 라우팅
- [ ] 메타데이터 정의 (인증, 네비게이션 표시 등)
- [ ] Factory Pattern 사용한 라우트 생성
- [ ] 에러 바운더리 및 Not Found 컴포넌트 구현
- [ ] 루트 라우트에 추가

#### 상태 관리
- [ ] 기능별 전용 스토어 생성 고려
- [ ] 편의성 훅 제공
- [ ] TypeScript 타입 정의
- [ ] persist 필요한 상태 식별

#### UI 컴포넌트
- [ ] 모바일 퍼스트 반응형 디자인
- [ ] 접근성 속성 (ARIA) 추가
- [ ] 커스텀 테마 색상 활용
- [ ] 일관된 간격 및 타이포그래피 적용

#### 성능 최적화
- [ ] 코드 스플리팅 적용
- [ ] 이미지 최적화
- [ ] 불필요한 리렌더링 방지
- [ ] 메모이제이션 적절히 활용

### 코드 스타일 가이드

#### 파일 네이밍
```
PascalCase: 컴포넌트 파일 (ProductCard.tsx)
camelCase: 일반 함수/변수 파일 (routeFactories.tsx)
kebab-case: CSS, 설정 파일 (tailwind.config.ts)
```

#### 컴포넌트 구조
```typescript
// 1. 외부 라이브러리 import
import React from 'react';
import { useNavigate } from 'react-router-dom';

// 2. 내부 모듈 import
import { useShopStore } from '../../store';
import { Button } from '../../ui/Button';

// 3. 타입 정의
interface Props {
  // ...
}

// 4. 컴포넌트 구현
export function Component({ }: Props) {
  // hooks
  // state
  // handlers
  // render
}
```

### 테스트 전략

#### 단위 테스트
- Store 액션 및 상태 변화
- 유틸리티 함수
- 컴포넌트 렌더링 및 상호작용

#### 통합 테스트
- 라우팅 동작
- 전역 상태와 컴포넌트 연동
- API 호출 및 에러 처리

#### E2E 테스트
- 핵심 사용자 플로우
- 크로스 브라우저 호환성
- 성능 측정

---

## 결론

Infinity Othello의 프론트엔드 아키텍처는 메타데이터 기반 라우팅과 Feature-based 구조를 통해 확장 가능하고 유지보수가 용이한 시스템을 구축했습니다.

초기 학습 비용은 있지만, 중장기적으로 개발 효율성과 코드 품질 측면에서 큰 이점을 제공합니다. 특히 팀 협업과 기능 확장이 빈번한 프로젝트에서 그 진가를 발휘할 것입니다.

### 핵심 가치
- **자동화를 통한 개발 효율성 향상**
- **일관성 있는 UX/UI 패턴**
- **확장 가능한 모듈형 구조**
- **타입 안전성 보장**

이 아키텍처를 통해 개발자는 비즈니스 로직에 더 집중할 수 있으며, 반복적인 보일러플레이트 코드 작성에서 벗어날 수 있습니다.