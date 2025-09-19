---
title: Infinity Othello 기능 정의 및 스펙 문서
owner: ai-team
status: approved
last_update: 2025-09-19
tags: [features, requirements, specifications, user-stories]
related: [engine_guide/engine-guide-docs.md, design/design-docs.md, architecture/architecture-docs.md]
---

# ⚙️ Infinity Othello 기능 정의 및 스펙 문서

**문서 레벨**: Reference / Guide

## 핵심 기능 개요

Infinity Othello는 고급 AI 엔진과 교육 기능을 갖춘 웹 기반 오델로 게임입니다.

## 1. AI 엔진 시스템

### 기능 요구사항
- 4개 엔진 (A: 휴리스틱, B: MCTS, C: WASM, D: LLM 멘토) 지원
- 동적 엔진 교체 및 난이도 조정
- Worker/WASM 기반 비블로킹 연산

### 사용자 스토리
- **게이머**: "다양한 난이도의 AI와 게임하고 싶다"
- **학습자**: "AI의 판단 과정을 이해하고 싶다"
- **고급자**: "최고 성능의 AI와 대전하고 싶다"

### API 계약
```typescript
// 엔진 선택
POST /api/engine/select
{
  "engineId": "A" | "B" | "C" | "D",
  "difficulty": 1-10
}

// 수 계산 요청
POST /api/engine/analyze
{
  "board": number[64],
  "turn": "black" | "white",
  "timeLimitMs": 1000
}
```

### 완료 기준
- [ ] 모든 엔진이 Engine 인터페이스 구현
- [ ] 동적 로딩 시스템 동작
- [ ] 성능 테스트 통과 (시간 제한 준수)
- [ ] 합법수 검증 테스트 통과

**상태**: ✅ 완료

## 2. 실시간 멀티플레이

### 기능 요구사항
- WebSocket 기반 실시간 대전
- 매치메이킹 시스템
- 재접속 및 하트비트 지원

### 사용자 스토리
- **플레이어**: "다른 사람과 실시간으로 게임하고 싶다"
- **일반 사용자**: "접속이 끊어져도 게임을 이어가고 싶다"

### API 계약
```typescript
// WebSocket 연결
WS /api/game/connect
{
  "matchId": string,
  "playerId": string,
  "token": string // Supabase JWT
}

// 수 두기 (멱등키 포함)
{
  "type": "move",
  "matchId": string,
  "ply": number, // 멱등키
  "move": [x, y]
}
```

### 완료 기준
- [ ] WebSocket 연결/재연결 안정성
- [ ] 멱등키 기반 중복 방지
- [ ] 서버 권위 판정 시스템
- [ ] E2E 테스트 통과

**상태**: 🚧 개발 중

## 3. 레이팅 및 랭킹

### 기능 요구사항
- Glicko-2 레이팅 시스템
- BullMQ 기반 비동기 집계
- 리더보드 실시간 업데이트

### 사용자 스토리
- **경쟁자**: "내 실력을 정확히 평가받고 싶다"
- **커뮤니티**: "상위 플레이어들을 보고 싶다"

### 데이터 계약
```sql
-- 레이팅 테이블
CREATE TABLE ratings (
  user_id UUID PRIMARY KEY,
  rating FLOAT DEFAULT 1500,
  rd FLOAT DEFAULT 200,
  volatility FLOAT DEFAULT 0.06,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 완료 기준
- [ ] Glicko-2 알고리즘 구현
- [ ] BullMQ 스케줄러 동작
- [ ] 실시간 리더보드 업데이트
- [ ] 부하 테스트 통과

**상태**: ⏳ 대기 중

## 4. 리플레이 및 분석

### 기능 요구사항
- 게임 기보 저장/조회
- 수별 분석 및 해설
- 다운로드/공유 기능

### 사용자 스토리
- **학습자**: "내 게임을 돌아보며 실수를 찾고 싶다"
- **교육자**: "좋은 게임을 학생들과 공유하고 싶다"

### API 계약
```typescript
// 리플레이 저장
POST /api/replays
{
  "matchId": string,
  "pgn": string, // 게임 기보
  "metadata": {
    "players": string[],
    "result": "black" | "white" | "draw",
    "date": Date
  }
}
```

### 완료 기준
- [ ] PGN 형식 기보 저장
- [ ] Supabase Storage 통합
- [ ] 분석 모드 UI
- [ ] 공유 링크 생성

**상태**: 📋 계획 중

## 5. PWA 및 오프라인 지원

### 기능 요구사항
- 오프라인 AI 대전 지원
- 설정/리플레이 로컬 저장
- 자동 업데이트 알림

### 사용자 스토리
- **모바일 유저**: "지하철에서도 AI와 게임하고 싶다"
- **일반 사용자**: "새 버전이 나오면 알림받고 싶다"

### 기술 요구사항
- Service Worker 기반 프리캐시
- IndexedDB 로컬 데이터 관리
- Vite PWA 플러그인 활용

### 완료 기준
- [ ] 오프라인 모드 동작
- [ ] 업데이트 토스트 알림
- [ ] 모바일 설치 프롬프트
- [ ] 캐시 전략 최적화

**상태**: 📋 계획 중

## 6. 멘토링 및 교육 시스템

### 기능 요구사항
- LLM 기반 수 해설
- 한국어 친화적 설명
- 단계별 학습 가이드

### 사용자 스토리
- **초심자**: "왜 이 수가 좋은지 쉬운 말로 설명 들었으면 좋겠다"
- **중급자**: "고급 전략을 체계적으로 배우고 싶다"

### API 계약
```typescript
// 멘토 해설 요청
POST /api/mentor/explain
{
  "board": number[64],
  "move": [x, y],
  "level": "beginner" | "intermediate" | "advanced"
}

// 응답
{
  "analysis": string, // 자연어 해설
  "pros": string[],   // 장점들
  "cons": string[],   // 단점들
  "alternatives": Array<{move: [x,y], reason: string}>
}
```

### 완료 기준
- [ ] GPT/Claude API 통합
- [ ] 한국어 해설 품질 검증
- [ ] 비용 최적화 (캐싱)
- [ ] 교육 콘텐츠 체계화

**상태**: 📋 계획 중

## 기능 우선순위 및 로드맵

### Phase 1 (MVP)
1. ✅ AI 엔진 시스템
2. 🚧 실시간 멀티플레이
3. ⏳ 기본 UI/UX

### Phase 2 (확장)
4. 📋 레이팅 및 랭킹
5. 📋 리플레이 시스템
6. 📋 PWA 기능

### Phase 3 (고도화)
7. 📋 멘토링 시스템
8. 📋 고급 분석 도구
9. 📋 소셜 기능

## 관련 문서
[📎 관련 문서: engine_guide/engine-guide-docs.md]
[📎 관련 문서: design/design-docs.md]
[📎 관련 문서: architecture/architecture-docs.md]

---
*이 문서는 Infinity Othello 프로젝트의 기능 명세를 위한 참조 가이드입니다.*