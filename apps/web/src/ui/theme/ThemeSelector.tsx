import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Check, Eye } from 'lucide-react';
import { haptic } from '../feedback/HapticFeedback';

/**
 * @interface ThemeOption
 * 단일 테마 옵션의 데이터 구조를 정의합니다.
 */
interface ThemeOption {
  id: string;
  name: string;
  description: string;
  isLocked?: boolean;
  unlockCondition?: string;
}

/** 보드 테마 목록 정의 */
const BOARD_THEMES: ThemeOption[] = [
  { id: 'classic', name: '클래식', description: '전통적인 녹색 펠트 보드' },
  { id: 'dark', name: '암흑탑', description: '어두운 돌바닥, 빛나는 문양', isLocked: false, unlockCondition: '탑 10층 클리어 ✓' },
  { id: 'galaxy', name: '은하수', description: '별자리가 빛나는 우주 보드', isLocked: true, unlockCondition: '탑 25층 클리어' },
  // ...
];

/** 돌 테마 목록 정의 */
const STONE_THEMES: ThemeOption[] = [
  { id: 'classic', name: '클래식 흑백', description: '기본 흑백 디스크' },
  { id: 'ruby-sapphire', name: '루비 & 사파이어', description: '붉은 보석 vs 푸른 보석', isLocked: false, unlockCondition: '랭크 실버 달성 ✓' },
  { id: 'sun-moon', name: '태양 & 달', description: '황금빛 태양 vs 은빛 달', isLocked: true, unlockCondition: '연승 10승 달성' },
  // ...
];

/**
 * @interface ThemeSelectorProps
 * `ThemeSelector` 컴포넌트의 props를 정의합니다.
 */
interface ThemeSelectorProps {
  /** @property {'board' | 'stone'} type - 선택할 테마의 종류 ('보드' 또는 '돌'). */
  type: 'board' | 'stone';
  onClose?: () => void;
}

/**
 * 게임의 보드 또는 돌의 테마를 선택하는 UI를 렌더링하는 컴포넌트입니다.
 * 사용자는 잠금 해제된 테마를 선택하거나, 잠긴 테마의 해제 조건을 확인할 수 있습니다.
 * @param {ThemeSelectorProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 테마 선택기 UI.
 */
export function ThemeSelector({ type, onClose }: ThemeSelectorProps) {
  const { theme, setTheme } = useGameStore(); // Zustand 스토어에서 현재 테마 및 설정 함수 가져오기
  /** @state {string | null} previewTheme - 사용자가 미리보기 중인 테마의 ID. */
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  const themes = type === 'board' ? BOARD_THEMES : STONE_THEMES;
  const currentTheme = type === 'board' ? theme.board : theme.stone;

  /**
   * 사용자가 테마를 선택했을 때 호출되는 핸들러.
   * `useGameStore`를 통해 전역 상태를 업데이트합니다.
   * @param {string} themeId - 선택된 테마의 ID.
   */
  const handleSelect = (themeId: string) => {
    haptic.themeChange();
    if (type === 'board') setTheme({ board: themeId as any });
    else setTheme({ stone: themeId as any });
  };

  /** 사용자가 미리보기 버튼을 클릭했을 때 호출되는 핸들러. */
  const handlePreview = (themeId: string) => {
    haptic.buttonTap();
    setPreviewTheme(themeId);
  };

  return (
    <div className="space-y-2 min-h-full animate-in fade-in-0 duration-700">
      {/* 테마 아이템 목록 */}
      <div className="space-y-2">
        {themes.map((themeOption, index) => (
          <div key={themeOption.id} className="animate-in slide-in-from-left-4 fade-in-0 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
            <ThemeItem
              theme={themeOption}
              isSelected={currentTheme === themeOption.id}
              isPreviewing={previewTheme === themeOption.id}
              onSelect={handleSelect}
              onPreview={handlePreview}
            />
          </div>
        ))}
      </div>

      {/* 미리보기 모달 */}
      {previewTheme && (
        <div className="card bg-gradient-to-br from-tower-deep-50 to-purple-900/20 border border-tower-gold-400/30">
          {/* ... 미리보기 UI ... */}
        </div>
      )}
    </div>
  );
}

/**
 * @interface ThemeItemProps
 * `ThemeItem` 컴포넌트의 props를 정의합니다.
 */
interface ThemeItemProps {
  theme: ThemeOption;
  isSelected: boolean;
  isPreviewing: boolean;
  onSelect: (id: string) => void;
  onPreview: (id: string) => void;
}

/**
 * 테마 목록의 개별 항목을 렌더링하는 내부 컴포넌트입니다.
 * @param {ThemeItemProps} props - 컴포넌트 props.
 */
function ThemeItem({ theme, isSelected, isPreviewing, onSelect, onPreview }: ThemeItemProps) {
  const isLocked = theme.isLocked;
  // 간단한 로직으로 보드/돌 테마 구분 (더 나은 방법이 있을 수 있음)
  const isBoard = !['stone', 'ruby', 'sun', 'fire', 'techno', 'galaxy-stone', 'ancient'].some(s => theme.id.includes(s));

  return (
    <div className={`group py-3 px-3 rounded-xl ... ${isSelected ? '...' : ''} ${isLocked ? '...' : ''}`}>
      <div className="flex items-center gap-4">
        {/* 미니 프리뷰 */}
        <div className="flex-shrink-0 relative ...">
          {/* ... */}
        </div>
        {/* 테마 정보 */}
        <div className="flex-1 min-w-0">
          {/* ... */}
        </div>
        {/* 선택 버튼 */}
        <div className="flex-shrink-0">
          {/* ... */}
        </div>
      </div>
    </div>
  );
}

/** 테마 ID에 해당하는 이모지 아이콘을 반환하는 간단한 헬퍼 컴포넌트. */
function ThemeIcon({ themeId }: { themeId: string }) {
  // ...
  return <span className="text-xl">{/* ... */}</span>;
}

/** 테마 목록 항목 내에 표시될 작은 크기의 미리보기 컴포넌트. */
function MiniThemePreview({ themeId, type }: { themeId: string; type: 'board' | 'stone' }) {
  const getBoardStyle = (id: string): string => { /* ... */ return ''; };
  const getStoneStyle = (id: string, isBlack: boolean): string => { /* ... */ return ''; };

  return <div className="relative">{/* ... */}</div>;
}

/** 미리보기 모달에 표시될 더 큰 크기의 보드/돌 미리보기 컴포넌트. */
function ThemePreviewBoard({ themeId, type }: { themeId: string; type: 'board' | 'stone' }) {
  const getBoardStyle = (id: string): string => { /* ... */ return ''; };
  const getStoneStyle = (id:string, isBlack: boolean): string => { /* ... */ return ''; };

  return <div className="relative">{/* ... */}</div>;
}