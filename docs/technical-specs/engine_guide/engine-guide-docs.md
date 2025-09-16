---
title: Infinity Othello AI 엔진 모듈 설명 문서
owner: ai-team
status: approved
last_update: 2025-09-14
tags: [engine, ai, search, algorithms, interface, mcts, wasm, llm]
related: [architecture/architecture-docs.md, strategy/strategy-docs.md, glossary/glossary-docs.md, data/data-docs.md]
---

# 🔍 Infinity Othello AI 엔진 모듈 설명 문서

**문서 레벨**: Reference / Guide

## AI 엔진 공용 인터페이스

모든 AI 엔진은 동일한 TypeScript 인터페이스를 구현하여 완전한 호환성을 보장합니다.

### 핵심 타입 정의
```typescript
// shared-types/src/engine.ts
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

## 엔진별 상세 설명

### Engine A: 휴리스틱 기반 (`packages/engine-a/`)
- **특징**: 빠른 응답, 가중치 기반 평가
- **적합한 용도**: 초보자 상대, 빠른 플레이
- **핵심 기술**:
  - 정적 가중치 평가 함수
  - 얕은 탐색 (3-5 깊이)
  - 패턴 매칭

```typescript
// 구현 예시
const engineA: Engine = {
  id: 'A',
  name: 'Heuristic-A',
  async analyze(req: EngineRequest): Promise<EngineResponse> {
    // 가중치 기반 휴리스틱 계산
    const evaluation = evaluatePosition(req.board, req.turn);
    const bestMove = findBestMove(req.board, evaluation);
    return {
      bestMove,
      score: evaluation.score,
      version: 'A-0.1.0'
    };
  }
};
```

### Engine B: MCTS 탐색 (`packages/engine-b/`)
- **특징**: 깊은 탐색, 확률적 접근
- **적합한 용도**: 중급자 이상, 정확한 판단
- **핵심 기술**:
  - Monte Carlo Tree Search
  - UCB1 선택 정책
  - 시간 기반 탐색 중단

### Engine C: WASM 최적화 (`packages/engine-c/`)
- **특징**: 최고 성능, 네이티브 속도
- **적합한 용도**: 고급자, 토너먼트 플레이
- **핵심 기술**:
  - Rust/C++ WASM 바인딩
  - SIMD 최적화
  - 멀티스레드 탐색

### Engine D: LLM 멘토 (`packages/engine-d/`)
- **특징**: 자연어 해설, 교육용
- **적합한 용도**: 학습자, 전략 설명
- **핵심 기술**:
  - GPT/Claude API 통합
  - 컨텍스트 기반 해설
  - 한국어 친화적 표현

## 동적 엔진 로딩 시스템

프런트엔드에서는 엔진을 동적으로 교체할 수 있습니다.

```typescript
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

## 성능 및 품질 기준

### 공통 요구사항
- **인터페이스 준수**: 모든 엔진은 `Engine` 인터페이스 구현 필수
- **합법수 검증**: 반환된 수는 항상 유효해야 함
- **시간 제한**: `timeLimitMs` 준수 (Worker/WASM 사용)
- **메인 스레드 보호**: UI 블로킹 금지

### 테스트 규칙
```typescript
// 동일한 보드 상황에서 모든 엔진 테스트
const testBoard = [/* 표준 테스트 보드 */];
const testRequest: EngineRequest = {
  board: testBoard,
  turn: 'black',
  timeLimitMs: 1000
};

// 모든 엔진이 형식/범위 동일한 응답 반환 확인
```

## 난이도별 설정

### 초급 (Engine A)
- 깊이: 3-4
- 시간 제한: 500ms
- 실수 확률: 15%

### 중급 (Engine B)
- 깊이: 6-8
- 시간 제한: 2000ms
- 실수 확률: 5%

### 고급 (Engine C)
- 깊이: 12+
- 시간 제한: 5000ms
- 실수 확률: 1%

### 멘토 (Engine D)
- 해설 중심
- 교육적 가치 우선
- 상세한 분석 제공

## 개발 및 테스트 가이드

### 새 엔진 추가 시
1. `shared-types` 인터페이스 준수 확인
2. `packages/engine-x/` 폴더 생성
3. `index.ts`에서 `Engine` 객체 export
4. 테스트 케이스 작성 및 검증
5. 동적 로딩 시스템에 등록

### 성능 벤치마크
```bash
pnpm bench:search    # 탐색 성능 측정
pnpm sweep:tt        # 시간 제한 테스트
```

## 관련 문서
[📎 관련 문서: architecture/architecture-docs.md]
[📎 관련 문서: strategy/strategy-docs.md]
[📎 관련 문서: glossary/glossary-docs.md]
[📎 관련 문서: data/data-docs.md]

---
*이 문서는 Infinity Othello AI 엔진 시스템 이해를 위한 참조 가이드입니다.*