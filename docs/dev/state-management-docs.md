---
title: 상태 관리 시스템 가이드
owner: ai-team
status: approved
last_update: 2025-01-13
tags: [zustand, state-management, architecture, development]
related: [architecture/architecture-docs.md, dev/dev-docs.md]
---

# 상태 관리 시스템

**문서 레벨**: Reference / Guide - 개발자를 위한 상태 관리 시스템 참조 가이드

Infinite Othello 프로젝트의 포괄적인 상태 관리 기초 구조입니다.

## 🏗️ 아키텍처 개요

### 상태 관리 레이어
- **Zustand**: 메인 상태 관리 라이브러리
- **5개의 전문 스토어**: 도메인별 분리된 상태 관리
- **미들웨어**: Persist, DevTools, 커스텀 직렬화
- **통합 훅**: 스토어 간 동기화 및 비즈니스 로직

### 스토어 구조
```
store/
├── index.ts                 # 중앙 export
├── gameStore.ts            # 게임 UI 상태 (기존)
├── appStore.ts             # 앱 전역 상태
├── authStore.ts            # 인증 및 사용자 관리
├── othelloStore.ts         # 오셀로 게임 로직
├── networkStore.ts         # 네트워크/멀티플레이어
├── providers/
│   └── StoreProvider.tsx   # 스토어 초기화
├── middleware/
│   └── persistMiddleware.ts # 커스텀 영속화
└── hooks/
    └── useStoreIntegration.ts # 통합 훅들
```

## 📦 스토어별 역할

### 1. GameStore (gameStore.ts)
> 기존 스토어 - UI 상태와 사용자 설정 관리

**상태**:
- `activeTab`: 현재 활성 탭
- `player`: 플레이어 정보 (레이팅, 랭크, 승부 기록)
- `theme`: 보드/돌 테마 설정
- `ui`: 폰트 크기, 애니메이션, 사운드 설정

**주요 액션**:
```typescript
const { setActiveTab, updatePlayer, setTheme, updateUISettings } = useGameStore();
```

### 2. AppStore (appStore.ts)
> 앱 전역 상태 - 로딩, 에러, 알림, 디바이스 정보

**상태**:
- `loading`: 글로벌/페이지/작업별 로딩 상태
- `error`: 도메인별 에러 관리
- `notifications`: 알림 시스템
- `settings`: 언어, 디버그 모드 등
- `device`: 디바이스 정보 및 온라인 상태

**사용 예시**:
```typescript
const { setLoading, addNotification, updateDevice } = useAppActions();

// 로딩 표시
setLoading('global', true);

// 알림 추가
addNotification({
  type: 'success',
  title: '게임 시작',
  message: '새로운 게임이 시작되었습니다.'
});
```

### 3. AuthStore (authStore.ts)
> 인증 및 사용자 관리 - OAuth, 게스트 계정, 세션 관리

**상태**:
- `user`: Supabase 사용자 객체
- `profile`: 게임 프로필 정보
- `guestProfile`: 게스트 계정 정보
- `isAuthenticated`: 인증 상태
- `sessionConflict`: 동시접속 충돌 정보

**핵심 기능**:
```typescript
const { createGuestAccount, signInWithOAuth, handleSessionConflict } = useAuthActions();

// 게스트 계정 생성
await createGuestAccount();

// OAuth 로그인
await signInWithOAuth('google');

// 세션 충돌 해결
await resolveSessionConflict('force');
```

### 4. OthelloStore (othelloStore.ts)
> 오셀로 게임 로직 - 보드 상태, 게임 규칙, AI

**상태**:
- `board`: 8x8 게임 보드 상태
- `gameStatus`: 게임 진행 상태
- `currentPlayer`: 현재 플레이어
- `validMoves`: 유효한 이동 위치들
- `history`: 게임 기록
- `score`: 현재 점수
- `stats`: 게임 통계

**주요 기능**:
```typescript
const { initializeGame, makeMove, calculateScore } = useOthelloActions();

// 게임 시작
initializeGame(8); // 8x8 보드

// 이동하기
const success = makeMove(3, 4);

// AI 이동
await makeAIMove();
```

### 5. NetworkStore (networkStore.ts)
> 네트워크 및 멀티플레이어 - 소켓 연결, 방 관리, 채팅

**상태**:
- `connection`: 소켓 연결 상태
- `room`: 게임 방 정보
- `players`: 방 내 플레이어들
- `gameSession`: 온라인 게임 세션
- `chat`: 채팅 메시지들
- `settings`: 네트워크 설정

**사용 예시**:
```typescript
const { connect, createRoom, joinRoom } = useNetworkActions();

// 서버 연결
await connect('ws://localhost:3001');

// 방 생성
const roomId = await createRoom('My Room', true);

// 방 참가
const joined = await joinRoom(roomId, 'ABCDEF');
```

## 🔧 미들웨어

### Persist 미들웨어
- **압축 저장**: JSON 압축 및 민감 정보 필터링
- **IndexedDB**: 대용량 데이터용 스토리지
- **마이그레이션**: 버전 관리 및 데이터 마이그레이션
- **프리셋**: 도메인별 최적화된 설정

```typescript
// 게임 데이터 저장
export const useGameStore = create<GameStore>()(
  devtools(
    createCustomPersist({
      name: 'infinity-othello-game-store',
      ...persistPresets.gameData('game-data'),
    })(storeImplementation),
    { name: 'GameStore' }
  )
);
```

## 🪝 통합 훅

### useStoreIntegration
스토어 간 자동 동기화
```typescript
const { isConnected, isGameActive, canMakeMove } = useStoreIntegration();
```

### useGameFlow
게임 진행을 위한 통합 로직
```typescript
const { handleMove, startNewGame, canPlay, isMyTurn } = useGameFlow();

// 통합 이동 처리 (로컬/온라인 자동 구분)
const success = await handleMove(3, 4);
```

### useThemeIntegration
테마와 UI 설정 통합
```typescript
const { applyTheme, toggleAnimations, toggleSound } = useThemeIntegration();
```

## 🚀 사용 방법

### 1. 프로바이더 설정
```typescript
// main.tsx 또는 App.tsx
import { StoreProvider } from './store/providers/StoreProvider';

function App() {
  return (
    <StoreProvider>
      {/* 앱 컴포넌트들 */}
    </StoreProvider>
  );
}
```

### 2. 컴포넌트에서 사용
```typescript
import { useGameStore, useOthelloActions, useStoreIntegration } from './store';

function GameComponent() {
  // 개별 스토어 사용
  const { theme, activeTab } = useGameStore();
  const { makeMove, gameStatus } = useOthelloActions();

  // 통합 훅 사용
  const { isGameActive, canMakeMove } = useStoreIntegration();
  const { handleMove } = useGameFlow();

  const onCellClick = async (row: number, col: number) => {
    if (canMakeMove) {
      await handleMove(row, col);
    }
  };

  return (
    <div>
      {/* 게임 UI */}
    </div>
  );
}
```

### 3. 인증 시스템 통합
```typescript
import { useAuth, useAuthActions } from './store';

function AuthComponent() {
  const { isGuest, profile, sessionConflict } = useAuth();
  const { createGuestAccount, signInWithOAuth } = useAuthActions();

  const handleGuestStart = async () => {
    await createGuestAccount();
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    await signInWithOAuth(provider);
  };

  return (
    <div>
      {isGuest ? (
        <div>게스트 모드 - 제한된 기능 사용 중</div>
      ) : (
        <div>{profile?.display_name}님 환영합니다!</div>
      )}
    </div>
  );
}
```

## 🛠️ 확장 가이드

### 새로운 상태 추가
1. 해당 스토어에 타입 추가
2. 초기 상태 정의
3. 액션 구현
4. 편의 훅 추가

### 새로운 스토어 추가
1. `store/newStore.ts` 생성
2. `store/index.ts`에 export 추가
3. 필요시 통합 훅에 동기화 로직 추가

### 커스텀 미들웨어
```typescript
const customMiddleware = (config) => (set, get, api) =>
  config((args) => {
    // 커스텀 로직
    set(args);
  }, get, api);
```

## 🔍 디버깅

### Redux DevTools
모든 스토어가 DevTools와 연결되어 있습니다:
- **GameStore**: 게임 상태 변화 추적
- **AuthStore**: 인증 및 세션 상태 모니터링
- **OthelloStore**: 게임 로직 디버깅
- **NetworkStore**: 네트워크 이벤트 모니터링
- **AppStore**: 전역 상태 추적

### 로깅
```typescript
// 개발 모드에서 자동으로 액션 로깅
console.log('Action:', actionName, 'State:', newState);
```

## 📊 성능 최적화

### 선택적 구독
```typescript
// 전체 상태 구독 (비효율)
const state = useGameStore();

// 특정 상태만 구독 (효율적)
const theme = useGameStore(state => state.theme);
```

### 액션 분리
```typescript
// 액션만 사용 (리렌더링 없음)
const actions = useGameActions();
```

### 메모이제이션
```typescript
const memoizedValue = useMemo(() =>
  complexCalculation(gameState), [gameState]
);
```

## 🔒 보안 고려사항

### 세션 관리
- **동시접속 방지**: 디바이스별 단일 세션 강제
- **자동 만료**: 2분 비활성 시 세션 종료
- **충돌 감지**: 실시간 세션 하이재킹 탐지

### 데이터 보호
- **민감 정보 필터링**: Persist 시 토큰/세션 정보 제외
- **게스트 데이터 격리**: 30일 자동 만료
- **RLS 정책**: Supabase 행 수준 보안

## 🎯 베스트 프랙티스

1. **단일 책임**: 각 스토어는 명확한 도메인 담당
2. **불변성**: 상태 변경 시 새로운 객체 생성
3. **타입 안전성**: TypeScript 완전 활용
4. **비동기 처리**: 적절한 로딩/에러 상태 관리
5. **테스트**: 순수 함수로 액션 분리하여 테스트 용이성 확보
6. **보안 우선**: 민감 정보 노출 방지 및 세션 보안

## 📎 관련 문서

[📎 관련 문서: architecture/architecture-docs.md]
[📎 관련 문서: dev/supabase-setup-docs.md]
[📎 관련 문서: dev/oauth-integration-docs.md]

이 상태 관리 시스템은 확장 가능하고 유지보수하기 쉬운 구조로 설계되었습니다. OAuth 전용 인증, 동시접속 방지, 게스트 계정 시스템이 통합된 현대적인 아키텍처를 제공합니다.