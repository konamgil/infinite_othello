---
title: Infinity Othello 시스템 아키텍처
owner: ai-team
status: approved
last_update: 2025-09-19
tags: [architecture, system-design, monorepo, typescript, pnpm, frontend, backend, engine]
related: [dev/dev-docs.md, engine_guide/engine-guide-docs.md, features/features-docs.md]
---

# 📏 Infinity Othello 시스템 아키텍처

**문서 레벨**: Guide / Reference

이 문서는 Infinity Othello 프로젝트의 전체 시스템 아키텍처, 기술 스택, 설계 원칙을 설명합니다.

## 1. 시스템 개요

Infinity Othello는 고급 오델로 AI 엔진과 모던 웹 인터페이스를 제공하는 PWA(Progressive Web App)입니다. 프로젝트는 pnpm과 Turborepo를 사용한 모노레포 구조로 관리됩니다.

### 1.1. 기술 스택

-   **언어**: TypeScript (>=5.0)
-   **패키지 관리**: pnpm (Corepack 활성화) + Turborepo
-   **프론트엔드**: React, Vite, Tailwind CSS
-   **상태 관리**: Zustand (전역 상태), xstate (복잡한 게임 상태 FSM)
-   **백엔드**: NestJS (REST API + WebSocket)
-   **데이터베이스/인증**: Supabase (Postgres, Auth, Storage, RLS)
-   **배포**: Cloudflare Pages (프론트엔드), Fly.io (백엔드)
-   **테스팅**: Vitest (유닛/통합), Playwright (E2E)

### 1.2. 모노레포 구조

```
infinity-othello/
├── apps/
│   ├── web/              # React SPA (Vite 기반)
│   └── server/           # NestJS 백엔드 서버
├── packages/
│   ├── core/             # 오델로 핵심 로직 (규칙, 판정)
│   ├── render/           # Canvas 2D 렌더링 엔진
│   ├── engine-a/         # AI 엔진 A (휴리스틱)
│   ├── engine-b/         # AI 엔진 B (MCTS)
│   ├── engine-c/         # AI 엔진 C (WASM 연동)
│   ├── engine-d/         # AI 엔진 D (LLM 멘토)
│   └── shared-types/     # 공용 타입 정의 (DTO, Engine Interface)
├── infra/
│   ├── supabase/         # SQL 스키마, RLS 정책
│   └── docker/           # 로컬 개발 환경 (Redis 등)
└── docs/                 # 프로젝트 문서
```

## 2. 프론트엔드 아키텍처 (`apps/web`)

프론트엔드는 사용자 인터페이스와 AI 엔진과의 상호작용을 담당합니다.

### 2.1. 폴더 구조

```
apps/web/src/
├── app/              # 애플리케이션 진입점 및 라우팅
├── components/       # 재사용 가능한 UI 컴포넌트 (Dumb Components)
├── features/         # 특정 도메인/기능 관련 컴포넌트 및 로직
├── hooks/            # 공통 React Hooks
├── lib/              # 외부 라이브러리 설정 (e.g., Supabase client)
├── services/         # 외부 서비스 연동 (API, WebSocket, IndexedDB)
├── store/            # 전역 상태 관리 (Zustand, xstate)
├── types/            # 프론트엔드 전용 타입
├── ui/               # 기본 UI 요소 (Button, Input 등) - shadcn/ui 기반
└── utils/            # 순수 함수 유틸리티
```

### 2.2. 데이터 흐름 및 상태 관리

-   **사용자 입력**: UI 컴포넌트에서 이벤트 발생
-   **상태 변경**: Zustand 스토어의 액션을 호출하여 상태 업데이트. 복잡한 게임 진행 로직은 xstate FSM으로 관리하여 상태 충돌 방지.
-   **API 요청**: `services/` 레이어를 통해 백엔드 API 또는 Supabase 직접 호출. React Query (`@tanstack/react-query`)를 사용하여 데이터 페칭, 캐싱, 동기화 관리.
-   **실시간 통신**: WebSocket (`services/ws.ts`)을 통해 서버와 실시간 게임 데이터 교환.

### 2.3. AI 엔진 연동

-   AI 엔진은 Web Worker에서 실행되어 메인 스레드 블로킹을 방지합니다.
-   `useEngine.ts` 훅을 통해 현재 선택된 AI 엔진과 상호작용하며, 모든 엔진은 `packages/shared-types`에 정의된 공통 `Engine` 인터페이스를 따릅니다.
-   엔진은 동적 `import()`를 통해 필요 시점에 로드됩니다.

## 3. 백엔드 아키텍처 (`apps/server`)

백엔드는 NestJS 프레임워크를 기반으로 하며, 게임 로직의 서버 권위(Server Authority)를 가집니다.

### 3.1. 폴더 구조

```
apps/server/src/
├── auth/             # 인증 (Supabase JWT Guard)
├── game/             # 게임 관리 (매치메이킹, 게임 상태)
├── leaderboard/      # 리더보드
├── replay/           # 리플레이 저장/조회
├── user/             # 사용자 프로필
├── common/           # 공통 모듈 (Guards, Pipes)
└── app.module.ts     # 루트 모듈
```

### 3.2. 주요 기능

-   **인증**: 클라이언트에서 받은 Supabase JWT를 검증하여 사용자 인증.
-   **매치메이킹**: Redis와 같은 인메모리 스토어를 활용하여 실시간 매치메이킹 큐 구현.
-   **게임 게이트웨이**: WebSocket을 통해 클라이언트와 게임 상태를 동기화. `packages/core`의 로직을 사용하여 서버 측에서 게임 규칙을 강제.
-   **레이팅 시스템**: Glicko-2와 같은 레이팅 알고리즘을 사용하여 유저 랭킹 산정 (BullMQ를 사용한 백그라운드 잡 처리).

## 4. AI 엔진 아키텍처 (`packages/engine-*`)

### 4.1. 설계 원칙

-   **모듈성**: 각 AI 엔진은 독립된 패키지로 개발.
-   **통일된 인터페이스**: 모든 엔진은 `packages/shared-types`에 정의된 `Engine` 인터페이스를 구현해야 함.
-   **교체 가능성**: 프론트엔드는 `Engine` 인터페이스에만 의존하므로, UI 수정 없이 AI 엔진을 동적으로 교체 가능.

### 4.2. 공용 `Engine` 인터페이스

```typescript
// From: packages/shared-types/src/index.ts
export interface Engine {
  id: string;
  name: string;
  analyze(req: EngineRequest): Promise<EngineResponse>;
}

export interface EngineRequest {
  board: number[]; // 64칸 배열
  turn: 'black' | 'white';
  timeLimitMs?: number;
  // ... 기타 필요한 파라미터
}

export interface EngineResponse {
  bestMove: [number, number] | null;
  score?: number;
  analysis?: string; // LLM 멘토링용
  // ... 기타 반환 데이터
}
```

## 5. 데이터베이스 (`infra/supabase`)

-   **스키마 관리**: `infra/supabase/migrations`를 통해 DB 스키마 버전 관리.
-   **보안**: RLS(Row-Level Security) 정책을 적극적으로 사용하여 데이터 접근 제어. `policies.sql` 파일에 정책 정의.
-   **스토리지**: 사용자 프로필 이미지, 게임 리소스 등 정적 파일 저장.

## 6. 핵심 설계 결정

-   **서버 권위 (Server Authority)**: 최종 게임 판정은 항상 서버에서 이루어져 치팅을 방지합니다.
-   **상태 관리 분리**: 단순 UI 상태는 컴포넌트 내부 (`useState`) 또는 Zustand로, 복잡하고 예측 가능한 게임 흐름은 xstate FSM으로 관리하여 역할 분리.
-   **타입 공유**: `packages/shared-types`를 통해 프론트엔드, 백엔드, AI 엔진 간의 데이터 구조 일관성을 유지. 변경 시 모든 의존 패키지에 영향.

## 7. 관련 문서

[📎 관련 문서: dev/dev-docs.md]
[📎 관련 문서: engine_guide/engine-guide-docs.md]
[📎 관련 문서: features/features-docs.md]