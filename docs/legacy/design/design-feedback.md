> **[문서 보관 안내]**
>
> 이 문서는 2025-09-19에 보관 처리되었습니다.
> 이 문서의 내용은 최신화되어 **[docs/design/design-docs.md](../design-docs.md)** 로 통합되었습니다.
> 최신 정보는 해당 문서를 참고해 주세요.

---
title: Design Feedback - Reducing Clutter
owner: design-team
status: approved
last_update: 2025-09-16
tags: [design, feedback, ui, fx]
related: [design/design-docs.md, design/design-concept-guide.md]
---

# Design Feedback - Reducing Clutter

**문서 레벨**: Reference / Guide

지금 “조잡·과함” 느낌은 모션·광량·입자·색 대비가 동시에 높아서 생겨.
핵심은 **“고요한 기본 + 순간 피크”**로 재구성하는 거야. 아래 값만 적용해도 인상이 확 달라져.

0) 원칙 (Less but better)

항상 1화면 = 지속 애니 1개 이하. 나머지는 정지 또는 이벤트 때만.

색상 60/30/10: 배경(60)·표면(30)·강조색(10, 골드 1색만).

글로우/보더 최소화: 경계는 간격·그림자로, 라인은 금지(경고/포커스만 예외).

1) 홈(히어로) — “고요한 포탈”

지속 애니 1개만 유지: 포탈 코어의 아주 느린 호흡(2.5s).

공전 디스크 1개로 축소(트레일 8pps → 4pps).

별/네뷸라 파티클 60→28개, α 0.35→0.18.

CTA 누를 때만 이중 링 버스트(180ms) 발생.

파라미터 패치

ring radius: 38→120px (기존 140), glow alpha: 0.35→0.22

fps: 30 그대로, but idle 시 15fps로 다운스케일(배터리 절약)

2) 탑(노드맵) — “정적 지도 + 포인트 점등”

상시 글로우 제거 → 보스 노드만 2.0s 미세 펄스(scale 0.98↔1.0, α 0.4↔0.6).

스크롤 중에는 모든 FX OFF, 스크롤 멈춘 뒤 300ms 후 점등.

한 번에 점등하는 노드 3개 이하(현재층 ±1).

파라미터 패치

NODE_SPARK: 24발→10발, 300ms→200ms

보스 글로우 반경: 12→9px, 합성 screen→normal+lighten

3) 전투(디스크) — “짧고 정확한 피크”

뒤집기 시간 160ms 유지, 파티클 총량 디스크당 36→14.

Follow trail 28pps→8pps, tail 수명 600→360ms.

FaceSwap 스파크(중간점) 18→6발, LandingRipple 1겹만.

여러 디스크 동시 뒤집기 시 순차 60ms 지연(폭발음처럼 ‘탁탁’).

스로틀러(필수)

전투 파티클 상한 480→320, 초과 시 spawn rate와 lifespan 자동 50% 컷.

4) UI-FX(버튼/모달) — “결정 순간만 반짝”

버튼 hover 글로우 삭제, press 시에만 링 1회(180ms).

모달 열림/닫힘 160ms 고정, 배경 블러 강도 60%→35%.

토스트 등장 FX 제거(페이드인만), 강조는 색·아이콘으로.

5) 색·타이포 톤다운

골드 채도 #F59E0B → #E7B142, 보라 #8B5CF6 → #7C6AF0.

타이틀 Black Han Sans 유지하되 그라디언트/글로우 삭제, 평면+얕은 그림자.

숫자 Orbitron weight 700→600, 자간 0→-0.25% (더 정제된 인상).

6) 이벤트 게이트(겹침 방지)

동시 FX 최대 1개. 새 FX가 들어오면 큐에 넣고 끝난 뒤 재생.

같은 카테고리(예: 버튼 press) 200ms 내 중복 입력 → 탈락(디바운스).

스크롤/드래그 중엔 모든 캔버스 FX 일시 중지.

// 간단 FX 큐
const fxQueue=[]; let busy=false;
function playFX(fn){ if(busy) return fxQueue.push(fn); busy=true; fn(()=>{ busy=false; (fxQueue.shift()?.(arguments.callee)); }); }

7) 정량 “과함” 지표(체크)

홈: 지속 애니 1개 이하, 파티클 ≤ 120(기존 280).

탑: 정지 시에만 점등, 파티클 ≤ 60.

전투: 평균 ≥ 55fps, 프레임 < 45 발생률 < 5%.

화면 내 동시에 빛나는 요소(글로우/링) 3개 초과 금지.

8) 적용 우선순위 (반나절 코스)

FX 스로틀러/큐 먼저 붙이기(겹침 제거).

홈 히어로 파티클/공전/글로우 숫자 절반으로 컷.

전투 파티클 스폰/수명 절반, 순차 60ms 지연 도입.

버튼 hover FX 제거 → press 전용. 모달 160ms 고정.

색/폰트 톤다운 토큰 적용.

9) “고요한 기본 + 순간 피크”가 지키는 선

기본 상태는 거의 정지처럼 보여야 한다.

클릭/착수/뒤집기/승패 같은 순간에만 짧게 터진다.

500ms 이상 지속되는 FX는 히어로 1개 외 금지.

---
[📎 관련 문서: design/design-docs.md]
[📎 관련 문서: design/design-concept-guide.md]