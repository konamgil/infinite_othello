---
title: Infinity Othello 개발 환경 및 가이드 문서
owner: ai-team
status: approved
last_update: 2025-09-14
tags: [development, environment, build, deployment, pnpm, typescript]
related: [architecture/architecture-docs.md, features/features-docs.md]
---

# 🛠️ Infinity Othello 개발 환경 및 가이드 문서

**문서 레벨**: Reference / Guide

## 5분 내 실행 가능한 개발 환경 설정

### 필수 요구사항
- Node.js >= 18.0
- pnpm (패키지 매니저 고정)
- Git

### 빠른 시작
```bash
# 1. pnpm 활성화
corepack enable pnpm

# 2. 의존성 설치
pnpm install

# 3. 개발 서버 실행
pnpm dev

# 4. 테스트 실행
pnpm test
```

## 패키지 매니저 정책

### pnpm 고정 사용 규칙
- **pnpm만 사용**: npm, yarn 혼용 금지
- **lockfile 관리**: `pnpm-lock.yaml` 하나만 유지
- **CI/CD 일관성**: 모든 환경에서 pnpm 사용

```bash
# pnpm 설치 및 활성화
corepack enable pnpm
pnpm --version
```

## TypeScript 설정

### 언어 규칙
- **TypeScript 전용**: JS 파일 허용하지 않음
- **타입 선언**: 외부 라이브러리는 d.ts 선언 추가
- **버전**: TypeScript >= 5.0

### tsconfig 구조
```
tsconfig.base.json (루트)
├── apps/web/tsconfig.json (extends base)
├── apps/server/tsconfig.json (extends base)
└── packages/*/tsconfig.json (extends base)
```

## 모노레포 관리 (Turborepo)

### 워크스페이스 설정
```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 빌드 최적화
```json
# turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

## 코딩 규칙 및 스타일

### AI 에이전트 지시사항
- **폴더 고정**: 지정된 경로 준수
- **네이밍**: PascalCase 컴포넌트, camelCase 변수
- **스타일**: Tailwind CSS만 사용
- **아이콘**: lucide-react 고정
- **상태관리**: Zustand + xstate만 수정

### 스타일 가이드
```typescript
// 컴포넌트 예시
export function GameBoard({ board }: GameBoardProps) {
  return (
    <div className="flex flex-col items-center p-4">
      {/* Tailwind만 사용 */}
    </div>
  );
}
```

### 금지 사항
- `.env` 하드코딩 금지
- `services/supabase.ts` 외부에서 Supabase 직접 접근 금지
- custom CSS는 `ui/theme/globals.css`에서만

## 테스트 및 품질 관리

### 테스트 스택
- **유닛 테스트**: Vitest
- **E2E 테스트**: Playwright (모바일 뷰포트 포함)
- **린트**: ESLint + @typescript-eslint

### 실행 명령어
```bash
# 전체 테스트 스위트
pnpm test          # Vitest 유닛 테스트
pnpm e2e          # Playwright E2E
pnpm lint         # ESLint 코드 품질
pnpm build        # 전체 빌드 검증
```

### 품질 기준
- 모든 엔진은 동일한 테스트 케이스 통과
- 메인 스레드 블로킹 금지 (Worker/WASM 사용)
- `timeLimitMs` 제한 준수

## 환경 변수 관리

### 환경별 분리
```
.env.dev          # 개발 환경
.env.prod         # 프로덕션 환경
.env.local        # 로컬 오버라이드 (gitignore)
```

### GitHub Actions 주입
CI/CD에서 환경별 변수를 자동 주입합니다.

## PWA 및 성능 최적화

### 프리캐시 정책
- AI 엔진 워커 파일
- 오프닝북 데이터
- 폰트 및 핵심 에셋

### 업데이트 전략
- 새 버전 감지 시 토스트 알림
- 사용자 확인 후 재로딩

## 프리플라이트 체크리스트

개발 완료 전 필수 확인 사항:

- [ ] `.env.dev/.env.prod` 분리 완료
- [ ] `packages/core` 규칙 테스트 통과
- [ ] WebSocket 재접속/하트비트 E2E 테스트
- [ ] Tailwind `content`에 packages 경로 포함
- [ ] PWA 프리캐시 + 업데이트 토스트 동작
- [ ] Sentry 소스맵 업로드 설정

## 관련 문서
[📎 관련 문서: architecture/architecture-docs.md]
[📎 관련 문서: features/features-docs.md]

---
*이 문서는 Infinity Othello 개발 환경 설정을 위한 참조 가이드입니다.*

---
title: Web 경로 별칭과 UI 구조 가이드
owner: web-team
status: draft
last_update: 2025-09-21
tags: [web, vite, tsconfig, alias]
related: [docs/agents-guide-overview.md, design/ui-design-patterns.md]
---

### 문서 레벨: Guide

## 경로 별칭(Path Aliases)
Vite/TypeScript에 다음 별칭이 설정되었습니다.

- @ui/* → apps/web/src/ui/*
- @features/* → apps/web/src/features/*
- @store/* → apps/web/src/store/*
- @utils/* → apps/web/src/utils/*
- @types/* → apps/web/src/types/*
- @hooks/* → apps/web/src/hooks/*
- @services/* → apps/web/src/services/*

설정 위치:
- apps/web/tsconfig.json: compilerOptions.paths
- apps/web/vite.config.ts: resolve.alias

## UI 폴더 구조 (관심사 기준)
- ui/layout: AppShell, Header, Layout
- ui/navigation: BottomNav, NavItem
- ui/effects: CanvasFX, FXHooks, FXThrottler, ParticleSystem
- ui/feedback: HapticFeedback
- ui/stats: StatsDisplay
- ui/theme: ThemeSelector, globals.css
- ui/game: GameBoard, GameController, OthelloStarCanvas
- ui/replay: ReplayViewer, Enhanced/Ultimate/Advanced, ReplayControls/Board/Filters 등

## import 예시
```ts
import { AppShell } from '@ui/layout/AppShell';
import { BottomNav } from '@ui/navigation/BottomNav';
import { GameController } from '@ui/game/GameController';
import { ReplayViewer } from '@ui/replay/ReplayViewer';
```

## 마이그레이션 가이드
- 기존 상대 경로(../../.. )는 가능하면 별칭으로 교체합니다.
- 기능 전용 컴포넌트는 `features/*`에, 재사용 가능한 UI는 `ui/*`에 둡니다.

[📎 관련 문서: docs/agents-guide-overview.md]