---
title: Infinity Othello 시스템 및 엔진 아키텍처 문서
owner: ai-team
status: approved
last_update: 2025-09-14
tags: [architecture, engine, system, monorepo]
related: [engine_guide/engine-guide-docs.md, dev/dev-docs.md, features/features-docs.md]
---

# 📏 Infinity Othello 시스템 및 엔진 아키텍처 문서

**문서 레벨**: Reference / Guide

## 전체 시스템 개요

Infinity Othello는 고급 오델로 AI 엔진과 웹 인터페이스를 제공하는 모노레포 기반 프로젝트입니다.

### 기술 스택
- **클라이언트**: React SPA + Canvas 2D (보드 렌더링)
- **상태관리**: Zustand + xstate (FSM)
- **스타일**: Tailwind CSS + Custom CSS (성좌/우주 테마)
- **서버**: NestJS (REST + WebSocket)
- **데이터베이스**: Supabase (Postgres + Auth + Storage + RLS)
- **패키지 관리**: pnpm + Turborepo
- **언어**: TypeScript (>=5.0) 전용

## 모노레포 구조

```
infinity-othello/
├── apps/
│   ├── web/              # React SPA 클라이언트
│   └── server/           # NestJS 백엔드 서버
├── packages/
│   ├── core/             # 오델로 규칙/판정/기보 (순수 TS)
│   ├── render/           # Canvas 렌더링 엔진
│   ├── engine-a/         # AI 엔진 A (휴리스틱)
│   ├── engine-b/         # AI 엔진 B (MCTS)
│   ├── engine-c/         # AI 엔진 C (외부 WASM)
│   ├── engine-d/         # AI 엔진 D (LLM 멘토)
│   └── shared-types/     # 공용 타입/DTO 정의
├── infra/
│   ├── supabase/         # SQL 스키마, RLS 정책
│   └── docker/           # 로컬 개발용 Redis 등
└── docs/                 # AI 에이전트용 문서 시스템
```

## AI 엔진 아키텍처

### 공용 인터페이스
모든 AI 엔진은 동일한 `Engine` 인터페이스를 구현합니다:

```typescript
export interface Engine {
  id: EngineID;
  name: string;
  analyze(req: EngineRequest): Promise<EngineResponse>;
}
```

### 엔진별 특성
- **Engine A**: 휴리스틱 기반 빠른 판단
- **Engine B**: MCTS 깊은 탐색
- **Engine C**: WASM 최적화 고성능
- **Engine D**: LLM 기반 멘토링 해설

## 데이터 흐름

```
사용자 입력 → React UI → Zustand Store → WebSocket/REST → NestJS → Supabase
                ↓                                               ↑
         AI 엔진 선택 → Worker/WASM → Engine Interface → 게임 판정
```

## 주요 모듈 의존성

### 클라이언트 (apps/web)
```
React App
├── store/ (Zustand + xstate)
├── services/ (Supabase, WebSocket, Audio)
├── engine/ (AI 엔진 동적 로딩)
└── ui/ (컴포넌트, 테마)
```

### 서버 (apps/server)
```
NestJS App
├── auth/ (Supabase JWT 검증)
├── matchmaking/ (Redis 큐)
├── game/ (서버 권위 판정)
└── rating/ (BullMQ Glicko-2)
```

## 변경 영향 범위

### shared-types 변경 시
- 모든 패키지 재빌드 필요
- 엔진 인터페이스 동시 업데이트 필수

### core 패키지 변경 시
- 서버 판정 로직 동기화 필요
- 모든 AI 엔진 검증 필요

### 개별 엔진 변경 시
- 해당 엔진만 영향
- 인터페이스 준수 확인 필요

## 관련 문서
[📎 관련 문서: engine_guide/engine-guide-docs.md]
[📎 관련 문서: dev/dev-docs.md]
[📎 관련 문서: features/features-docs.md]

---
*이 문서는 Infinity Othello 프로젝트의 전체 아키텍처 이해를 위한 참조 가이드입니다.*