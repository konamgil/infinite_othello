---
title: Test Failure Report - 2025-09-21
owner: ai-team
status: draft
last_update: 2025-09-21
tags: [test, failure, supabase, web]
related: [dev/dev-docs.md]
---

# 📉 Test Failure Report: 2025-09-21

**문서 레벨**: Summary / Reports

## 1. 실패 요약 (Summary)

- **패키지 (Package)**: `apps/web`
- **테스트 파일 (Test File)**: `src/tests/supabase.test.ts`
- **실패 원인 (Cause)**: Supabase 클라이언트 초기화 실패. 테스트 환경에 `SUPABASE_URL` 및 `SUPABASE_ANON_KEY` 환경 변수가 설정되어 있지 않아 테스트가 중단되었습니다.

## 2. 오류 로그 (Error Log)

테스트 실행 시 다음 오류가 발생했습니다.

```
Error: Supabase URL 또는 Anon Key가 설정되지 않았습니다. .env.local 파일을 확인하세요.
 ❯ src/services/supabase.ts:9:9
      7|
      8| if (!supabaseUrl || !supabaseAnonKey) {
      9|   throw new Error(
       |         ^
     10|     'Supabase URL 또는 Anon Key가 설정되지 않았습니다. ' +
     11|     '.env.local 파일을 확인하세요.'
 ❯ src/tests/supabase.test.ts:2:31
```

## 3. 분석 및 권고 사항 (Analysis & Recommendation)

현재 `apps/web`의 테스트 스위트는 외부 환경 변수(Supabase 인증 정보)에 의존하고 있어, CI/CD 환경이나 다른 개발자의 로컬 환경에서 `.env.local` 파일 없이는 항상 실패하게 됩니다.

**권고 사항**:
1.  **Supabase 클라이언트 모킹 (Mocking)**: `vitest`의 모킹 기능을 사용하여 `supabase.ts` 모듈을 모의(mock) 처리합니다. 이렇게 하면 실제 Supabase에 연결하지 않고도 테스트를 실행할 수 있습니다.
2.  **테스트 전용 환경 변수 제공**: 테스트 실행 스크립트에서 `.env.test`와 같은 테스트 전용 환경 설정 파일을 로드하여, 가짜(dummy) 또는 테스트용 Supabase 인증 정보를 제공합니다.

위 조치들을 통해 테스트가 외부 환경 의존성 없이 독립적으로 실행될 수 있도록 개선해야 합니다.

[📎 관련 문서: dev/dev-docs.md]
