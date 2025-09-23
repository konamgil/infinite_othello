# **시스템 개요**

- **클라이언트**: React SPA(HUD/라우팅/설정), **Canvas 2D**(보드·애니메이션)
    - **CSS**: Tailwind + Custom CSS(성좌/우주 테마)
    - **아이콘**: lucide-react
    - **상태**: Zustand + xstate(FSM) → 경기 진행 충돌 방지
    - **오프라인**: IndexedDB(리플레이/설정) → **`apps/web/src/services/idb.ts`에서만** 사용
    - **PWA**: Vite PWA(프리캐시 + **새 버전 알림 토스트**)
- **DB/Auth/Storage**: Supabase(Postgres + Auth + Storage + RLS)
- **서버**: NestJS (REST + WebSocket Gateway + BullMQ/Redis jobs)
    - **서버 권위 판정**, WS 재접속/하트비트/멱등키, room.rejoin 스냅샷
    - 레이팅/랭킹 집계는 BullMQ 스케줄러
- **언어 규칙**
    - 모든 앱/패키지는 TypeScript(>=5.0)로 작성한다.
    - JS 파일은 허용하지 않으며, 외부 라이브러리 타입이 없는 경우 d.ts 선언을 추가한다
    - tsconfig.base.json을 루트에 두고, 각 앱/패키지는 이를 확장한다.
- **패키지 매니저**: **pnpm 고정 사용**
    - `corepack enable pnpm` 필수
    - `pnpm-lock.yaml` 하나만 유지, `npm`/`yarn` 혼용 금지
    - CI/CD에서도 `pnpm install` + 캐시 전략 적용

# 모노레포 (pnpm + Turborepo)

```
infinity-othello/
  apps/
    web/              # React SPA
    server/           # NestJS (REST + WS)

  packages/
    core/             # 규칙/판정/기보 (순수 TS)
    render/           # Canvas 렌더 엔진
    engine-a/         # AI 엔진 A (휴리스틱)
    engine-b/         # AI 엔진 B (MCTS)
    engine-c/         # AI 엔진 C (외부 WASM)
    engine-d/         # AI 엔진 D (LLM 멘토)
    shared-types/     # 공용 타입/DTO

  infra/
    supabase/         # SQL, 정책, RLS (policies.sql)
    docker/           # 로컬 Redis 등

  docs/               # 📚 프로젝트 문서 시스템 (AI Agents용)
    agents-guide-overview.md.md
    architecture/
    design/
    dev/
    engine_guide/
    features/
    glossary/
    mentor/
    reports/
    research_logs/
    strategy/
    data/
    experiments/
    testing/
    agents/

  package.json
  pnpm-workspace.yaml
  turbo.json

```

# 프런트 설계

```
apps/web/src/
  app/               # Router (code-split)
    App.tsx
    routes/{Home,Challenge,MultiPlay,Activity,Profile}.tsx
  store/
    gameStore.ts     # Zustand
    machine.ts       # xstate FSM
  services/
    supabase.ts
    ws.ts            # 재접속/하트비트/멱등키(ply)
    audio.ts
    haptics.ts
    idb.ts           # IndexedDB 래퍼(리플레이/설정 캐시)
  engine/
    useEngine.ts     # 워커 프록시(Tier 선택)
  ui/
    bottom-nav/{BottomNav,NavItem,NavIcons}.tsx
    common/{Hud,Toast,Toggle}.tsx
    theme/{tailwind.css,globals.css}

```

---

**프런트 JS AI 엔진(탐색/피쳐/웨이트) 위치**

# 서버 설계

```
apps/server/src/
  main.ts
  app.module.ts
  common/            # guards, pipes, interceptors
  auth/              # Supabase JWT 검증
  matchmaking/       # Gateway + Redis queue
  game/              # Gateway, referee(core 공유 룰)  ← 서버 권위
  rating/            # BullMQ processor(Glicko-2)
  replay/            # 사전서명 URL
  leaderboard/
  docs/swagger.ts    # OpenAPI 문서(/api)

```

---

# AI 엔진 공용 인터페이스 가이드

## 원칙

- 엔진은 여러 종류(A/B/C/D 등)가 공존한다.
- **모든 엔진은 동일한 인터페이스(`Engine`)를 구현**한다.
- 프런트(React)는 **엔진 교체를 인터페이스로만** 하며, UI/게임 로직을 수정하지 않는다.
- 무거운 연산은 **Web Worker/WASM**로 분리하되, **인터페이스는 동일**하게 유지한다.

## 폴더 권장

```
packages/
  shared-types/     # 공용 타입/인터페이스
  engine-a/         # 휴리스틱
  engine-b/         # MCTS/깊은 탐색
  engine-c/         # 외부 WASM 어댑터
  engine-d/         # LLM 멘토

```

## 공용 인터페이스 (shared-types/src/engine.ts)

```tsx
export type EngineID = 'A' | 'B' | 'C' | 'D';
export type Color = 'black' | 'white';
export type FlatBoard = number[]; // 64칸: 0=빈, 1=흑, -1=백

export interface EngineRequest {
  board: FlatBoard;
  turn: Color;
  timeLimitMs?: number; // 예산 기반 탐색(B/C)
  depth?: number;       // 깊이 기반 탐색(A/B)
  seed?: number;        // 재현성
}

export interface EngineResponse {
  bestMove: [number, number] | null; // 패스면 null
  score?: number;     // 상대적 평가(높을수록 turn 유리)
  nodes?: number;     // 탐색 노드(선택)
  analysis?: string;  // LLM 멘토 코멘트(D)
  version?: string;   // 엔진 버전
}

export interface Engine {
  id: EngineID;
  name: string;
  analyze(req: EngineRequest): Promise<EngineResponse>;
}

```

## 엔진 구현 규칙

- 각 엔진 패키지는 **`index.ts`에서 `export default engineX`*를 노출.
- **반드시 `Engine` 인터페이스를 구현**하고, `analyze()`만으로 호출 가능하게 할 것.
- WASM/Worker 등 내부 구현은 자유. **외부에 노출되는 API는 위 인터페이스로 고정.**

### 예시 (engine-a)

```tsx
import type { Engine, EngineRequest, EngineResponse } from 'shared-types';

const engineA: Engine = {
  id: 'A',
  name: 'Heuristic-A',
  async analyze(req: EngineRequest): Promise<EngineResponse> {
    // TODO: features×weights + 얕은 탐색
    return { bestMove: null, score: 0, version: 'A-0.1.0' };
  }
};
export default engineA;

```

## 프런트 사용 규칙 (동적 로딩)

- 프런트는 엔진을 **동적 import**로 로드하고, 선택만 바꾼다.

```tsx
// apps/web/src/engine/useEngine.ts
import type { EngineID, Engine, EngineRequest, EngineResponse } from 'shared-types';

let current: Engine | null = null;

export async function selectEngine(id: EngineID) {
  switch (id) {
    case 'A': current = (await import('engine-a')).default; break;
    case 'B': current = (await import('engine-b')).default; break;
    case 'C': current = (await import('engine-c')).default; break;
    case 'D': current = (await import('engine-d')).default; break;
    default:  current = (await import('engine-a')).default;
  }
}

export async function bestMove(req: EngineRequest): Promise<EngineResponse> {
  if (!current) await selectEngine('A'); // 기본 A
  return current!.analyze(req);
}

```

---

# 📚 Docs 폴더 구조 제안

```
infinity-othello/
  docs/
    architecture/     # 시스템/엔진 아키텍처 문서
    design/           # UI/UX 및 게임 화면 설계
    dev/              # 개발 환경, 빌드/배포, 코드 스타일
    engine_guide/     # 오델로 AI 엔진 모듈 설명
    features/         # 기능 정의 및 모듈별 스펙
    glossary/         # 용어 사전
    mentor/           # 멘토링 해설, 설명 규칙
    reports/          # 연구 결과 보고서, 성능 분석
    research_logs/    # 연구 일지, 실험 기록
    strategy/         # 오델로 전략·전술 가이드
    data/             # 오프닝북/튜닝 가중치/데이터셋 설명
    experiments/      # 실험 환경, 튜닝 결과
    testing/          # QA/테스트 계획·결과 문서
    agents/           # 에이전트별 가이드라인 (Codex, Claude 등)
    Agents-Guide-overview.md  # 전체 규칙 설명 문서 (네가 작성한 내용)
```

## 테스트/품질 기준

- 모든 엔진은 동일한 테스트 케이스(동일 보드 입력)에 대해 **형식/범위가 동일한 응답**을 반환해야 한다.
- 코어 규칙(`packages/core`)과 **일치 검증**: 엔진이 반환한 수는 항상 합법수여야 한다.
- 성능 사양: `timeLimitMs`를 준수해야 하며, **메인 스레드 블로킹 금지**(Worker/WASM 사용).

## 금지/주의

- 프런트(UI)에서 엔진별 내부 함수를 직접 호출하지 말 것 → **`analyze()`만** 호출.
- 인터페이스를 변경해야 할 때는 **`shared-types` 먼저 업데이트**하고 전 엔진을 동시 반영.
- 브라우저 API(IndexedDB 등)는 엔진 패키지에서 직접 사용하지 말 것(프런트 서비스 레이어에서 처리).

# 환경/운영

- **PWA**: 엔진 워커/오프닝북/폰트 프리캐시, **업데이트 토스트**로 재로딩 유도
- **COOP/COEP**: WASM Threads/SIMD 대비(Cloudflare Pages `_headers`)
- **오디오/햅틱**: 첫 사용자 입력 후 초기화(모바일 정책)
- **에러/분석**: Sentry(웹+서버, **소스맵 업로드 & release tag**) + Supabase Analytics(핵심 이벤트 5종)
- **테스트**: Vitest(코어) + Playwright(E2E, 모바일 뷰포트)
- **린트(lint)**: ESLint (+ @typescript-eslint) → 코드 품질 & 일관성 유지
- **CI/CD**: GitHub Actions(환경별 `.env` 주입, build/test/deploy)
- **RLS 스크립트 고정**: `infra/supabase/policies.sql`에 Profiles/Events/Replays 최소 정책 명시

---

# WS 신뢰성 표준

- **클라**(`ws.ts`): 하트비트 30초, 응답 없으면 재접속 / **멱등키 = (matchId:ply)**
- **서버**: 중복 무시, `room.rejoin` 시 최신 스냅샷 브로드캐스트

---

# 코딩 에이전트 지시(요약)

- **폴더 고정 + 네이밍** 준수(PascalCase, 지정 경로)
- **스타일은 Tailwind만**, custom CSS는 `ui/theme/globals.css`에서만
- **아이콘은 lucide-react 고정**
- **상태/흐름**: Zustand는 `gameStore.ts`, FSM은 `machine.ts`만 수정
- **Supabase**: `services/supabase.ts`만 통해 접근, **.env 하드코딩 금지**
- **WS**: `services/ws.ts`만 수정(재접속/하트비트/멱등키)
- **테스트/빌드**: `pnpm test`(Vitest) + `pnpm e2e`(Playwright) + `pnpm build` 모두 통과

---

# 프리플라이트 체크(6)

- [ ]  `.env.dev/.env.prod` 분리, Actions에서 주입
- [ ]  `packages/core` 규칙 테스트 통과(서버 심판과 일치)
- [ ]  `ws.ts` 하트비트/재접속/멱등키 E2E 1케이스
- [ ]  Tailwind `content`에 `../../packages/**/*` 포함
- [ ]  PWA 프리캐시에 엔진 워커/오프닝북 포함 + 업데이트 토스트 동작
- [ ]  Sentry 소스맵 업로드 & Swagger(/api) 오픈