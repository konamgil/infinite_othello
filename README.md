# 🌌 Infinite Othello

무한한 가능성의 오델로 게임 - AI 엔진 통합 플랫폼

## 📋 프로젝트 개요

Infinite Othello는 다양한 AI 엔진과 최신 웹 기술을 결합한 오델로(리버시) 게임 플랫폼입니다. React SPA, NestJS 서버, 그리고 여러 종류의 AI 엔진을 통합하여 차세대 보드게임 경험을 제공합니다.

## ✨ 주요 특징

- 🎮 **인터랙티브 게임플레이**: Canvas 2D 기반 부드러운 애니메이션
- 🤖 **다양한 AI 엔진**: 휴리스틱, MCTS, WASM, LLM 멘토링 엔진
- 🌐 **실시간 멀티플레이**: WebSocket 기반 실시간 대전
- 📱 **PWA 지원**: 모바일 친화적 Progressive Web App
- 🎨 **우주 테마**: 성좌와 우주를 테마로 한 독특한 디자인
- 🏆 **랭킹 시스템**: Glicko-2 기반 레이팅 시스템
- 🔄 **오프라인 지원**: IndexedDB를 활용한 리플레이 저장

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18+
- pnpm (권장 패키지 매니저)

### 설치 및 실행

```bash
# pnpm 활성화 (필수)
corepack enable pnpm

# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev
```

### 사용 가능한 명령어

```bash
pnpm build    # 프로덕션 빌드
pnpm test     # 테스트 실행
pnpm lint     # 코드 린팅
```

## 🏗️ 아키텍처

### 시스템 구조

```
🌐 Client (React SPA)
    ├── 🎨 Canvas 2D (게임 보드 & 애니메이션)
    ├── 🧠 Zustand + XState (상태 관리)
    ├── 📱 PWA (오프라인 지원)
    └── 🎯 WebSocket (실시간 통신)

⚡ Server (NestJS)
    ├── 🔌 WebSocket Gateway
    ├── 🏆 Rating System (BullMQ)
    ├── 🛡️ Auth (Supabase JWT)
    └── 📊 Match Making

🗄️ Database (Supabase)
    ├── 🐘 PostgreSQL
    ├── 🔐 Row Level Security
    └── 📁 Storage
```

### 모노레포 구조

```
infinity-othello/
├── apps/
│   ├── web/              # React SPA 클라이언트
│   └── server/           # NestJS 서버
├── packages/
│   ├── core/             # 게임 규칙 & 판정 로직
│   ├── render/           # Canvas 렌더링 엔진
│   ├── engine-a/         # AI 엔진 A (휴리스틱)
│   ├── engine-b/         # AI 엔진 B (MCTS)
│   ├── engine-c/         # AI 엔진 C (WASM)
│   ├── engine-d/         # AI 엔진 D (LLM 멘토)
│   └── shared-types/     # 공용 타입 정의
├── infra/
│   ├── supabase/         # 데이터베이스 스키마
│   └── docker/           # 로컬 개발 환경
└── docs/                 # 프로젝트 문서
```

## 🤖 AI 엔진 시스템

모든 AI 엔진은 통일된 인터페이스를 구현하여 플러그인 방식으로 교체 가능합니다.

### 엔진 타입

- **Engine A**: 휴리스틱 기반 빠른 판단
- **Engine B**: Monte Carlo Tree Search (MCTS)
- **Engine C**: WebAssembly 최적화 엔진
- **Engine D**: LLM 기반 멘토링 시스템

### 공통 인터페이스

```typescript
interface Engine {
  id: EngineID;
  name: string;
  analyze(req: EngineRequest): Promise<EngineResponse>;
}
```

## 💻 기술 스택

### 프론트엔드
- **React 18** - 컴포넌트 기반 UI
- **TypeScript** - 타입 안전성
- **Zustand** - 상태 관리
- **XState** - 게임 상태 머신
- **Tailwind CSS** - 유틸리티 우선 스타일링
- **Canvas 2D API** - 게임 렌더링
- **Vite** - 빌드 도구
- **PWA** - 오프라인 지원

### 백엔드
- **NestJS** - Node.js 프레임워크
- **WebSocket** - 실시간 통신
- **BullMQ** - 작업 큐 (Redis)
- **Supabase** - 백엔드 서비스
- **PostgreSQL** - 데이터베이스

### 개발 도구
- **pnpm** - 패키지 관리
- **Turborepo** - 모노레포 빌드 시스템
- **Vitest** - 단위 테스트
- **Playwright** - E2E 테스트
- **ESLint** - 코드 품질

## 🎮 게임 기능

### 게임 모드
- 🤖 **AI 대전**: 다양한 난이도의 AI와 대전
- 👥 **멀티플레이**: 실시간 온라인 대전
- 🎓 **멘토 모드**: LLM 기반 학습 도우미
- 📚 **리플레이**: 게임 복기 및 분석

### 특별 기능
- ⚡ **실시간 분석**: 게임 중 실시간 포지션 분석
- 🎯 **힌트 시스템**: AI 추천 수 제안
- 📊 **통계**: 상세한 게임 통계 및 성장 추적
- 🏅 **업적**: 다양한 도전 과제

## 🛡️ 보안 및 성능

- **Row Level Security (RLS)**: 데이터베이스 레벨 보안
- **JWT 인증**: Supabase 기반 안전한 인증
- **WebSocket 신뢰성**: 하트비트 및 재접속 로직
- **멱등성**: 중복 요청 방지
- **Web Worker**: UI 블로킹 없는 AI 계산

## 📱 PWA 기능

- 📱 **모바일 최적화**: 반응형 디자인
- 💾 **오프라인 캐시**: 게임 자료 프리캐시
- 🔄 **자동 업데이트**: 새 버전 알림
- 🏠 **홈 화면 추가**: 네이티브 앱 경험

## 🧪 테스트

```bash
# 단위 테스트
pnpm test

# E2E 테스트
pnpm e2e

# 테스트 커버리지
pnpm test:coverage
```

## 📚 문서

프로젝트의 상세한 문서는 `docs/` 폴더에서 확인할 수 있습니다:

- **Architecture**: 시스템 아키텍처 설계
- **Engine Guide**: AI 엔진 개발 가이드
- **Features**: 기능 명세서
- **Strategy**: 오델로 전략 가이드

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 개발 규칙

- **TypeScript 필수**: 모든 코드는 TypeScript로 작성
- **ESLint 준수**: 코드 품질 기준 준수
- **테스트 작성**: 새로운 기능에 대한 테스트 필수
- **pnpm 사용**: 패키지 관리는 pnpm으로 통일

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 🙏 감사의 말

- 오델로 게임의 수학적 아름다움에 영감을 받아
- 현대 웹 기술의 가능성을 탐구하며
- AI와 인간이 함께 학습하는 미래를 꿈꾸며

---

⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!

🐛 버그를 발견하거나 개선 사항이 있다면 Issue를 남겨주세요!

🚀 함께 더 나은 오델로 게임을 만들어가요!