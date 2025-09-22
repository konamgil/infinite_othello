---
title: 프론트엔드 개발 가이드라인
owner: ai-team
status: approved
last_update: 2025-09-21
tags: [frontend, zustand, react, architecture, development-guide]
related: [dev/state-management-docs.md, docs/agents-guide-overview.md]
---

# ⚛️ 프론트엔드 개발 가이드라인 (Zustand 기반)

프론트엔드(`apps/web`)는 React와 Zustand를 중심으로 한 상태 관리 아키텍처를 따릅니다. 새로운 기능을 개발하거나 코드를 수정할 때 다음 규칙을 준수해야 합니다.

## 1. 객체(타입) 정의: `types` 또는 `shared-types`

- **전역 공통 타입**: 여러 패키지(예: `server`, `web`)에서 함께 사용해야 하는 타입은 `packages/shared-types/src/index.ts`에 정의합니다.
- **프론트엔드 전용 타입**: `apps/web` 내부에서만 사용된다면 `apps/web/src/types/` 디렉토리 안에 파일 단위로 정의합니다.

## 2. "컨트롤러" (비즈니스 로직): Zustand 스토어의 `actions`

상태를 변경하는 모든 로직(API 호출, 사용자 입력 처리 등)은 **Zustand 스토어의 액션 함수**로 구현합니다. 컴포넌트가 직접 상태를 조작해서는 안 됩니다.

1.  **책임 결정**: 만들려는 기능이 어떤 도메인에 속하는지 먼저 파악하고, 적절한 스토어 파일을 선택합니다. (예: 인증 -> `authStore.ts`, 게임 로직 -> `othelloStore.ts`)
2.  **액션 구현**: 해당 스토어 파일의 `actions` 객체 안에 상태를 변경하는 함수를 작성합니다.

**예시: `authStore.ts`에 닉네임 변경 액션 추가**
```typescript
// actions 객체 내부에 함수로 구현
updateNickname: (newNickname: string) => {
  set((state) => ({
    profile: { ...state.profile, nickname: newNickname },
  }));
  // 필요 시 여기에 DB 업데이트와 같은 비동기 로직 추가
},
```

## 3. "뷰" (UI 컴포넌트): 훅(Hooks)을 통한 상태 구독 및 액션 호출

React 컴포넌트는 UI를 그리고, 사용자 이벤트에 반응하여 스토어의 액션을 호출하는 역할에 집중합니다.

- **상태 구독**: `useAuth()`와 같이 스토어에서 제공하는 **상태 선택 훅**을 사용하여 필요한 데이터만 읽어옵니다.
- **액션 호출**: `useAuthActions()`와 같이 **액션 전용 훅**을 사용하여 상태를 변경하는 함수를 호출합니다.

**예시: 컴포넌트에서 닉네임 변경 기능 사용**
```typescript
import { useAuth, useAuthActions } from './store';

function ProfileEditor() {
  const { profile } = useAuth(); // 상태 읽기
  const { updateNickname } = useAuthActions(); // 액션 가져오기

  const handleSave = (newNickname: string) => {
    // 컴포넌트는 액션을 호출할 뿐, 직접 로직을 수행하지 않음
    updateNickname(newNickname);
  };
  // ... JSX ...
}
```

## 4. 여러 스토어 연동: 통합 훅 (`useGameFlow` 등)

여러 도메인의 상태가 얽힌 복잡한 로직(예: 네트워크 연결 상태를 확인하고 게임 시작)은 `apps/web/src/store/hooks/`에 있는 통합 훅을 활용하거나 새로 만들어 처리합니다.

[📎 관련 문서: dev/state-management-docs.md]
[📎 관련 문서: docs/agents-guide-overview.md]
