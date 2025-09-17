---
title: Mobile UI Guide (Fixed Layout)
owner: ui-team
status: approved
last_update: 2025-09-16
tags: [ui, mobile, design, layout, canvas]
related: [design/design-docs.md, design/bottom-navigation-planning.md]
---

# 📱 Mobile UI Guide (Fixed Layout)

**문서 레벨**: Reference / Guide

# 🎯 아트보드 개념

- **고정 논리폭**: `390px` (iPhone 12/13/14 표준폭)
- **데스크톱 진입 시**: 뷰포트 중앙에 390px 고정, **좌우는 비움(배경만)**
- **세로 기준**: 가변. 상단 헤더 + 보드 + 하단 바텀탭로 구성

# 🧱 레이아웃 구조(단일 컬럼)

- **헤더(56px)**: 뒤로/제목/옵션
- **콘텐츠**
    - 전투 화면: **캔버스 보드(330~344px 정사각)** + 우측 패널 없음
    - 홈/탑/스텔라: 카드 리스트(스크롤)
- **바텀 네비(72px)**: 5탭, 터치 타겟 48×48px 이상
- **세이프에어리어**: iOS 홈 인디케이터 대응
    - CSS: `padding-bottom: max(16px, env(safe-area-inset-bottom));`

# 🎨 비가변 사이징(권장 수치)

- **앱 폭**: 390px 고정
- **보드 영역**: 344px(여유) 또는 336px(8×42) / 320px(8×40) 중 택1
    - 예) 336px → **셀 42px** × 8 = 336px, 보드 패딩 8~12px
- **상/하 마진**: 12~16px
- **카드 라인 높이**: 56~64px
- **아이콘**: 24px(탭), 20px(툴바)

# 🖼️ 데스크톱에서 중앙 고정시키는 CSS

```css
html, body { height: 100%; background:#0b1220; }
.app-shell {
  width: 390px; min-height: 100%;
  margin: 0 auto; background: #0e1329;
  box-shadow: 0 0 40px rgba(0,0,0,.35);
}
.gutters {
  position: fixed; inset: 0;
  background:
    radial-gradient(60% 80% at 50% -20%, rgba(99,102,241,.25), transparent 60%),
    linear-gradient(180deg, #0b1220 0%, #0b1220 40%, #0e1329 100%);
  /* 가운데 390px 영역은 .app-shell가 차지하므로 자연스럽게 좌우가 비어 보임 */
}

```

# 🧭 뷰포트 & 확대 제어

```html
<meta name="viewport"
      content="width=390, initial-scale=1, maximum-scale=1, user-scalable=no" />

```

- **반응형 미지원**이므로 `width=390` 고정.
- 접근성 확대가 필요하면 `user-scalable=no`는 빼고, 대신 글자 확대 토글 제공.

# 🧩 캔버스(보드) 스케일링 표준

- *선명도 확보(레티나)**를 위해 논리픽셀과 실제 픽셀 분리:

```jsx
function setupHiDPICanvas(canvas, logicalSize) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.style.width  = logicalSize + 'px';
  canvas.style.height = logicalSize + 'px';
  canvas.width  = Math.round(logicalSize * dpr);
  canvas.height = Math.round(logicalSize * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 논리좌표로 그리기
  return ctx;
}
// 사용
const BOARD_SIZE = 336; // 또는 344/320 중 택1
const ctx = setupHiDPICanvas(document.querySelector('#board'), BOARD_SIZE);

```

# 🎮 보드 그리드/돌 규격

- 셀 크기 예: **42px**
- 돌 반지름: `cell * 0.42`
- 착수 가능 하이라이트: 내부 원 `alpha 0.35` + 외곽선
- X/C 위험 칸: 얇은 테두리/코너 마커 오버레이
- 터치 타겟: 셀 전체(42×42)로 히트 테스트

# 🫧 애니메이션 가이드(2D 캔버스)

- 뒤집기: **스케일 Y 1→0→-1**(또는 회전 180°), 120~180ms
- 추천 수(스텔라 힌트): 알파 펄스(1.0↔0.5), 800ms 루프
- 승패 연출: 보드 상단에서 파티클 낙하/확산 600~900ms

# 🖱️ 제스처/터치 UX

- 탭: 착수
- 길게 누름(400ms): 해당 칸 설명 툴팁(스텔라 요약 3줄)
- 두 손가락 탭: 빠른 되돌리기(옵션)
- 스크롤 충돌 방지: `touch-action: manipulation; overscroll-behavior: contain;`

# ♿ 접근성(모바일 고정 레이아웃용)

- 하단탭 버튼: 터치 영역 **48×48px 이상**, 라벨 텍스트 표시
- 캔버스 보조 라벨: 시각장애 지원은 **보드 상태를 별도 DOM로 동기화**해 `aria-live="polite"`로 공지
- 고정폭이라도 **폰트 사이즈 옵션(작게/기본/크게)** 제공

# 🧳 페이지별 레이아웃 셋업(요약)

- **홈**: 390px 폭 카드 2~4개(레이팅/탑진행/오늘의 미션/최근 대전)
- **탑**: 가상 스크롤 리스트(층 카드 높이 64~72px)
- **랭크 대전**: 큼직한 CTA 섹션(빠른 매칭/친선/2:2/토너)
- **스텔라**: 탭 내부 카드형(기보/미션/연습)
- **More**: 단순 리스트(테마/상점/설정)

# ✅ 품질 체크리스트(모바일 고정 레이아웃 전용)

- [ ]  390px 외 해상도에서도 **항상 중앙 정렬**
- [ ]  좌우 여백 배경은 **스크롤 동행**(고정 배경 OK)
- [ ]  캔버스 HiDPI 스케일링 적용 여부
- [ ]  바텀탭 **안전영역** 겹침 없음
- [ ]  30/60fps 애니메이션 유지(저성능 폰에서 파티클 강도 낮춤)

---
[📎 관련 문서: design/design-docs.md]
[📎 관련 문서: design/bottom-navigation-planning.md]