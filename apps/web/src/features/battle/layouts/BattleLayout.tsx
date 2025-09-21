import React, { ReactNode } from 'react';
import { BattleStarCanvas } from '../../../ui/battle/BattleStarCanvas';

type BattleLayoutProps = {
  children: ReactNode;
  detail?: boolean;
};

/**
 * '대전' 기능(feature)을 위한 레이아웃 컴포넌트입니다.
 *
 * 이 컴포넌트는 '대전' 기능 내의 모든 페이지에 일관된 레이아웃을 제공합니다.
 * 별이 빛나는 캔버스 배경(`BattleStarCanvas`)을 포함하고 콘텐츠 영역의 구조를 잡습니다.
 * '상세' 페이지를 위한 레이아웃 변형을 지원하며, 이 경우 약간 다른 구조
 * (예: 전체 화면 높이)가 적용됩니다.
 *
 * @param {object} props - 컴포넌트 props.
 * @param {React.ReactNode} props.children - 레이아웃 내에 렌더링될 콘텐츠.
 * @param {boolean} [props.detail=false] - true일 경우, 상세 페이지용 레이아웃 변형을 적용합니다.
 * @returns {React.ReactElement} 렌더링된 레이아웃 컴포넌트.
 */
export function BattleLayout({ children, detail = false }: BattleLayoutProps) {
  // 'detail' prop에 따라 다른 루트 클래스를 적용하여 기본 레이아웃과 상세 페이지 레이아웃을 구분합니다.
  const rootClasses = detail
    ? 'min-h-screen w-full overflow-hidden relative flex flex-col' // 상세 페이지: 최소 화면 높이 차지
    : 'h-full w-full overflow-hidden relative'; // 기본: 부모 높이 100%

  // 콘텐츠를 감싸는 오버레이 클래스
  const overlayClasses = detail
    ? 'relative z-10 flex-1 flex flex-col overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain'
    : 'relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain';

  // 실제 콘텐츠가 담길 컨테이너의 클래스
  const contentClasses = detail
    ? 'content-padding pt-12 pb-12 flex flex-col gap-8 min-h-[calc(100vh-6rem)]' // 상세 페이지용 패딩 및 최소 높이
    : 'content-padding section-spacing pb-32'; // 기본 패딩

  return (
    <div className={rootClasses}>
      {/* 배경: 캔버스 애니메이션을 절대 위치로 배치 */}
      <div className="absolute inset-0">
        <BattleStarCanvas className="w-full h-full" />
      </div>
      {/* 콘텐츠 오버레이 */}
      <div className={overlayClasses}>
        <div className={contentClasses}>{children}</div>
      </div>
    </div>
  );
}
