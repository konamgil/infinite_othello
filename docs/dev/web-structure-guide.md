---
title: Web 경로 별칭과 UI 구조 가이드
owner: web-team
status: draft
last_update: 2025-09-21
tags: [web, vite, tsconfig, alias]
related: [docs/agents-guide-overview.md, design/ui-design-patterns.md, dev/dev-docs.md]
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
[📎 관련 문서: dev/dev-docs.md]
