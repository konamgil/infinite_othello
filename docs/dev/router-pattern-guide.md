# Infinity Othello 라우터 패턴 가이드

## 개요

Infinity Othello 프로젝트는 **Feature 기반 아키텍처**와 **React Router DOM**을 사용하여 모듈화된 라우팅 시스템을 구현하고 있습니다. 이 문서는 프로젝트의 라우터 패턴을 이해하고 일관되게 적용할 수 있도록 하는 종합 가이드입니다.

## 프로젝트 구조

### Feature 기반 디렉토리 구조

```
apps/web/src/
├── features/
│   ├── home/
│   │   ├── route.tsx           # 홈 라우트 정의
│   │   └── pages/
│   ├── battle/
│   │   ├── route.tsx           # 배틀 라우트 정의
│   │   ├── layouts/
│   │   └── pages/
│   ├── tower/
│   │   ├── route.tsx           # 타워 라우트 정의
│   │   ├── layouts/
│   │   └── pages/
│   ├── stella/
│   │   └── route.tsx           # 스텔라 라우트 정의
│   └── more/
│       └── route.tsx           # 기타 라우트 정의
└── app/router/
    ├── meta.ts                 # 메타데이터 타입 정의
    ├── RootLayout.tsx          # 루트 레이아웃 컴포넌트
    └── rootRoutes.ts           # 루트 라우트 통합 관리
```

## 메타데이터 시스템

### 타입 정의

프로젝트는 TypeScript 기반의 강력한 메타데이터 시스템을 사용합니다:

```typescript
// apps/web/src/app/router/meta.ts

export type BaseRouteMeta = {
  hideBottomNav?: boolean;     // 하단 네비게이션 숨김 여부
  requiresAuth?: boolean;      // 인증 필요 여부
  breadcrumb?: string[];       // 브레드크럼프 경로
};

export type RootRouteMeta = BaseRouteMeta & {
  isRoot: true;               // 루트 라우트 식별자
  title: string;              // 페이지 제목
  icon: LucideIcon;           // 네비게이션 아이콘
  navPath: string;            // 네비게이션 경로
};

export type ChildRouteMeta = BaseRouteMeta & {
  isRoot?: false;             // 자식 라우트 (기본값)
  title?: string;             // 선택적 페이지 제목
  icon?: LucideIcon;          // 선택적 아이콘
  navPath?: string;           // 선택적 네비게이션 경로
};

export type RouteMeta = RootRouteMeta | ChildRouteMeta;
```

### 메타데이터 사용 패턴

#### 1. **루트 라우트 메타데이터**

```typescript
// features/battle/route.tsx

const BATTLE_ROOT_META: RouteMeta = {
  isRoot: true,               // 루트 라우트 지정
  requiresAuth: false,        // 인증 불필요
  title: '랭크전',            // 페이지 제목
  icon: Swords,              // 네비게이션 아이콘
  navPath: '/battle',        // 네비게이션 경로
};
```

#### 2. **자식 라우트 메타데이터**

```typescript
// features/battle/route.tsx

const BATTLE_DETAIL_META: RouteMeta = {
  requiresAuth: false,        // 인증 불필요
  hideBottomNav: true,        // 하단 네비게이션 숨김
  title: '배틀 상세',         // 페이지 제목
  icon: Sword,               // 아이콘
};

// 동적 메타데이터 생성
{
  path: 'quick',
  element: <QuickMatchPage />,
  handle: {
    meta: {
      ...BATTLE_DETAIL_META,
      title: '빠른 매치'      // 제목 오버라이드
    }
  },
}
```

## 라우트 구조 패턴

### 1. **기본 라우트 구조**

각 feature는 다음과 같은 표준 구조를 따릅니다:

```typescript
// features/[feature]/route.tsx

export const [feature]Route: AppRouteObject = {
  id: '[feature]-root',                    // 고유 라우트 ID
  path: '[feature]',                       // URL 경로
  handle: { meta: [FEATURE]_ROOT_META },   // 루트 메타데이터
  errorElement: <[Feature]ErrorBoundary />, // 에러 바운더리
  children: [
    {
      index: true,                         // 인덱스 라우트
      element: <[Feature]Screen />,
      handle: { meta: [FEATURE]_ROOT_META },
    },
    // 자식 라우트들...
  ],
};
```

### 2. **Battle Feature 구조 예시**

```typescript
// features/battle/route.tsx

export const battleRoute: AppRouteObject = {
  id: 'battle-root',
  path: 'battle',
  handle: { meta: BATTLE_ROOT_META },
  errorElement: <BattleErrorBoundary />,
  children: [
    {
      index: true,
      element: <BattleHome />,
      handle: { meta: BATTLE_ROOT_META },
    },
    {
      path: 'quick',                       // /battle/quick
      element: <QuickMatchPage />,
      handle: { meta: { ...BATTLE_DETAIL_META, title: '빠른 매치' } },
    },
    {
      path: 'ranked',                      // /battle/ranked
      element: <RankedMatchPage />,
      handle: { meta: { ...BATTLE_DETAIL_META, title: '랭크 매치' } },
    },
    {
      path: 'tournament',                  // /battle/tournament
      element: <BattleTournamentScreen />,
      handle: { meta: { ...BATTLE_DETAIL_META, title: '토너먼트', icon: Trophy } },
    },
    {
      path: '*',                          // 404 처리
      element: <BattleNotFound />,
      handle: { meta: { ...BATTLE_DETAIL_META, title: '전투 없음' } },
    },
  ],
};
```

### 3. **Tower Feature의 접근 권한 검증**

Tower feature는 게임 진행 상황에 따른 접근 권한 검증을 구현합니다:

```typescript
// features/tower/route.tsx

const TOWER_GAME_META: RouteMeta = {
  requiresAuth: true,          // 인증 필요
  title: '탑 도전',
  icon: Gamepad2,
};

// 동적 라우트와 접근 권한
{
  path: ':floor',              // /tower/123
  element: <GameScreen />,
  handle: { meta: { ...TOWER_GAME_META, hideBottomNav: true } },
}
```

## Layout 패턴

### 1. **RootLayout 컴포넌트**

RootLayout은 전체 애플리케이션의 레이아웃을 관리합니다:

```typescript
// app/router/RootLayout.tsx

export function RootLayout() {
  const matches = useMatches();
  const location = useLocation();

  // 메타데이터 추출
  const { rootMeta, activeMeta } = useMemo(() => {
    let root: RootRouteMeta | undefined;
    let active: RouteMeta | undefined;

    for (const match of matches) {
      const meta = pickMeta(match.handle as RouteHandle | undefined);
      if (!meta) continue;
      if (meta.isRoot) {
        root = meta;
      }
      active = meta;
    }

    return { rootMeta: root, activeMeta: active };
  }, [matches]);

  // 페이지 제목 설정
  useEffect(() => {
    const title = activeMeta?.title ?? rootMeta?.title;
    document.title = title ? `Infinity Othello | ${title}` : 'Infinity Othello';
  }, [activeMeta?.title, rootMeta?.title]);

  // 하단 네비게이션 표시 조건
  const shouldShowBottomNav = useMemo(() => {
    if (activeMeta?.hideBottomNav) {
      return false;
    }
    if (!rootMeta || rootMeta.hideBottomNav) {
      return false;
    }
    // 루트 네비게이션 경로인지 확인
    const normalized = normalizePath(location.pathname);
    const rootSegment = getRootSegment(normalized);
    return rootNavSet.has(rootSegment);
  }, [location.pathname, rootMeta, activeMeta, rootNavSet]);

  return (
    <AppShell>
      <div className="w-full overflow-x-hidden flex flex-col" style={{ height: '100dvh' }}>
        <div className="flex-1 min-h-0 relative">
          <Suspense fallback={<LoadingOverlay inline />}>
            <Outlet />
          </Suspense>
          {isNavigating && <LoadingOverlay />}
        </div>
        {shouldShowBottomNav && (
          <div className="flex-shrink-0">
            <BottomNav items={rootNavItems} activePath={activeNavPath} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
```

### 2. **Feature별 Layout 컴포넌트**

각 feature는 자체 레이아웃을 가질 수 있습니다:

```typescript
// features/battle/layouts/BattleLayout.tsx
// features/tower/layouts/TowerLayout.tsx

// 테마별 배경과 스타일링 제공
// 일관된 사용자 경험 보장
```

## 네비게이션 패턴

### 1. **절대경로 패턴 권장**

일관성과 예측 가능성을 위해 절대경로를 사용합니다:

```typescript
// ✅ 권장: 절대경로
navigate('/tower/123', {
  state: {
    mode: 'tower',
    towerFloor: currentFloor,
    title: `Tower Floor ${currentFloor}`,
  },
});

// ❌ 비권장: 상대경로
navigate('../tower/123');
navigate('tower/123');
```

### 2. **상태 전달 패턴**

라우트 간 데이터 전달은 `state`를 활용합니다:

```typescript
// features/tower/pages/index/page.tsx

const handleChallengeStart = () => {
  haptic.bossEncounter();
  navigate(`/tower/${currentFloor}`, {
    state: {
      mode: 'tower',                    // 게임 모드
      towerFloor: currentFloor,         // 현재 층
      title: `Tower Floor ${currentFloor}`, // 페이지 제목
    },
  });
};
```

## 에러 처리 패턴

### 1. **ErrorBoundary 구현**

각 feature는 일관된 에러 처리를 제공합니다:

```typescript
// features/battle/route.tsx

const BattleErrorBoundary = () => (
  <BattleLayout>
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-white">전투 정보를 불러오지 못했습니다.</h2>
      <p className="text-sm text-white/60">잠시 후 다시 시도하거나 네트워크 상태를 확인해 주세요.</p>
    </div>
  </BattleLayout>
);
```

### 2. **404 처리**

각 feature는 고유한 404 페이지를 제공합니다:

```typescript
// features/battle/route.tsx

const BattleNotFound = () => (
  <BattleLayout detail>
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-white/90">해당 전투 페이지를 찾을 수 없습니다.</h2>
      <p className="text-sm text-white/60">목록으로 돌아가 다시 시도해 주세요.</p>
    </div>
  </BattleLayout>
);

// 라우트 정의
{
  path: '*',
  element: <BattleNotFound />,
  handle: { meta: { ...BATTLE_DETAIL_META, title: '전투 없음' } },
}
```

## 접근 권한 검증

### 1. **인증 기반 접근 제어**

메타데이터의 `requiresAuth` 속성을 활용합니다:

```typescript
// features/tower/route.tsx

const TOWER_GAME_META: RouteMeta = {
  requiresAuth: true,          // 게임 플레이는 인증 필요
  title: '탑 도전',
  icon: Gamepad2,
};
```

### 2. **게임 진행도 기반 접근 제어**

Tower feature에서 구현된 층별 접근 제어:

```typescript
// features/tower/pages/game/page.tsx

export default function TowerGamePage() {
  const navigate = useNavigate();
  const { player } = useGameStore();
  const params = useParams<{ floor: string }>();

  // 엄격한 숫자 검증
  const floorParam = params.floor;
  const isValidNumber = floorParam && /^\d+$/.test(floorParam);
  const floor = isValidNumber ? parseInt(floorParam, 10) : NaN;

  useEffect(() => {
    // 1. floor가 숫자가 아닌 경우
    if (isNaN(floor)) {
      navigate('/tower', { replace: true });
      return;
    }

    // 2. 사용자가 아직 도달하지 못한 층인 경우
    if (floor > player.towerProgress) {
      navigate('/tower', { replace: true });
      return;
    }

    // 3. 최대 층수를 초과한 경우
    if (floor > 300) {
      navigate('/tower', { replace: true });
      return;
    }
  }, [floor, player.towerProgress, navigate]);
}
```

## 루트 통합 관리

### 1. **rootRoutes.ts 구조**

모든 feature 라우트는 중앙에서 통합 관리됩니다:

```typescript
// app/router/rootRoutes.ts

import { homeRoute } from '../../features/home/route';
import { battleRoute } from '../../features/battle/route';
import { towerRoute } from '../../features/tower/route';
import { stellaRoute } from '../../features/stella/route';
import { moreRoute } from '../../features/more/route';

export const appRootChildren: AppRouteObject[] = [
  homeRoute,
  battleRoute,
  towerRoute,
  stellaRoute,
  moreRoute,
];
```

### 2. **네비게이션 아이템 자동 추출**

루트 라우트에서 네비게이션 아이템을 자동으로 추출합니다:

```typescript
// app/router/rootRoutes.ts

const extractNavItem = (route: AppRouteObject): NavItem | null => {
  const meta = (route.handle as { meta?: RouteMeta } | undefined)?.meta;
  if (meta?.isRoot !== true) {
    return null;  // 루트 라우트가 아닌 경우 제외
  }

  return {
    path: meta.navPath,    // 네비게이션 경로
    label: meta.title,     // 표시 라벨
    icon: meta.icon,       // 아이콘
  };
};

export const rootNavItems: NavItem[] = appRootChildren
  .map(extractNavItem)
  .filter((item): item is NavItem => item !== null);
```

## 모범 사례

### 1. **타입 안전성**

- 모든 라우트 메타데이터는 TypeScript 타입을 사용
- `AppRouteObject` 타입으로 라우트 객체 정의
- 메타데이터 접근 시 타입 가드 활용

### 2. **일관된 패턴**

- 모든 feature는 동일한 라우트 구조 패턴 따름
- 메타데이터 네이밍 컨벤션 준수 (`[FEATURE]_ROOT_META`, `[FEATURE]_DETAIL_META`)
- 에러 처리와 404 페이지 일관성 유지

### 3. **성능 최적화**

- `Suspense`를 활용한 코드 스플리팅
- `useMemo`를 통한 불필요한 재계산 방지
- 메타데이터 기반 조건부 렌더링

### 4. **사용자 경험**

- 일관된 로딩 상태 표시
- 적절한 에러 메시지 제공
- 하단 네비게이션 표시/숨김 제어

## 주의사항

### 1. **메타데이터 일관성**

```typescript
// ✅ 올바른 패턴
const BATTLE_ROOT_META: RouteMeta = {
  isRoot: true,
  title: '랭크전',
  icon: Swords,
  navPath: '/battle',
};

// ❌ 잘못된 패턴 - navPath와 실제 경로 불일치
const WRONG_META: RouteMeta = {
  isRoot: true,
  navPath: '/battles',  // 실제 경로는 '/battle'
  // ...
};
```

### 2. **에러 바운더리 래핑**

에러 바운더리는 반드시 적절한 Layout으로 래핑해야 합니다:

```typescript
// ✅ 올바른 패턴
const TowerErrorBoundary = () => (
  <TowerLayout>
    <div>에러 내용</div>
  </TowerLayout>
);

// ❌ 잘못된 패턴 - Layout 없음
const WrongErrorBoundary = () => (
  <div>에러 내용</div>
);
```

### 3. **접근 권한 검증**

클라이언트 사이드 검증만으로는 보안이 충분하지 않습니다:

```typescript
// ✅ 클라이언트 사이드 UX 개선
const handleChallengeStart = () => {
  if (currentFloor > maxFloor) {
    alert('이미 모든 층을 완료했습니다!');
    return;
  }
  // 서버 사이드에서도 검증 필요
};
```

## 새로운 Feature 추가 가이드

새로운 feature를 추가할 때는 다음 단계를 따르세요:

### 1. **디렉토리 구조 생성**

```
features/[new-feature]/
├── route.tsx
├── layouts/
│   └── [NewFeature]Layout.tsx
└── pages/
    └── index/
        └── page.tsx
```

### 2. **메타데이터 정의**

```typescript
// features/[new-feature]/route.tsx

const [NEW_FEATURE]_ROOT_META: RouteMeta = {
  isRoot: true,
  title: '[기능명]',
  icon: [IconComponent],
  navPath: '/[new-feature]',
};
```

### 3. **라우트 구조 구현**

```typescript
export const [newFeature]Route: AppRouteObject = {
  id: '[new-feature]-root',
  path: '[new-feature]',
  handle: { meta: [NEW_FEATURE]_ROOT_META },
  errorElement: <[NewFeature]ErrorBoundary />,
  children: [
    // 라우트 정의
  ],
};
```

### 4. **루트 라우트에 등록**

```typescript
// app/router/rootRoutes.ts

import { [newFeature]Route } from '../../features/[new-feature]/route';

export const appRootChildren: AppRouteObject[] = [
  // 기존 라우트들...
  [newFeature]Route,
];
```

이 가이드를 따라 일관되고 확장 가능한 라우터 시스템을 구축할 수 있습니다.