import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Check, Eye } from 'lucide-react';
import { haptic } from '../feedback/HapticFeedback';

interface ThemeOption {
  id: string;
  name: string;
  description: string;
  isLocked?: boolean;
  unlockCondition?: string;
}

const BOARD_THEMES: ThemeOption[] = [
  {
    id: 'classic',
    name: '클래식',
    description: '전통적인 녹색 펠트 보드',
  },
  {
    id: 'dark',
    name: '암흑탑',
    description: '어두운 돌바닥, 빛나는 문양',
    isLocked: false, // 잠금 해제
    unlockCondition: '탑 10층 클리어 ✓'
  },
  {
    id: 'galaxy',
    name: '은하수',
    description: '별자리가 빛나는 우주 보드',
    isLocked: false, // 잠금 해제
    unlockCondition: '탑 25층 클리어 ✓'
  },
  {
    id: 'magic',
    name: '마법진',
    description: '원형 마법진과 룬 문자',
    isLocked: false, // 잠금 해제
    unlockCondition: '탑 50층 클리어 ✓'
  },
  {
    id: 'crystal',
    name: '수정 동굴',
    description: '반짝이는 수정과 보석 패턴',
    isLocked: false, // 새 테마 추가
    unlockCondition: '100층 클리어 ✓'
  },
  {
    id: 'neon',
    name: '네온 사이버',
    description: '사이버펑크 네온 그리드',
    isLocked: false, // 새 테마 추가
    unlockCondition: '전설 랭크 달성 ✓'
  }
];

const STONE_THEMES: ThemeOption[] = [
  {
    id: 'classic',
    name: '클래식 흑백',
    description: '기본 흑백 디스크',
  },
  {
    id: 'ruby-sapphire',
    name: '루비 & 사파이어',
    description: '붉은 보석 vs 푸른 보석',
    isLocked: false, // 잠금 해제
    unlockCondition: '랭크 실버 달성 ✓'
  },
  {
    id: 'sun-moon',
    name: '태양 & 달',
    description: '황금빛 태양 vs 은빛 달',
    isLocked: false, // 잠금 해제
    unlockCondition: '연승 10승 달성 ✓'
  },
  {
    id: 'fire-ice',
    name: '불꽃 & 얼음',
    description: '타오르는 불꽃 vs 얼어붙은 얼음',
    isLocked: false, // 잠금 해제
    unlockCondition: '토너먼트 우승 ✓'
  },
  {
    id: 'techno',
    name: '테크노 디스크',
    description: '네온 라인과 전자칩 패턴',
    isLocked: false, // 잠금 해제
    unlockCondition: '프리미엄 구매 ✓'
  },
  {
    id: 'galaxy-stone',
    name: '은하 디스크',
    description: '별빛이 흐르는 우주 디스크',
    isLocked: false, // 새 테마 추가
    unlockCondition: '우주 마스터 ✓'
  },
  {
    id: 'ancient',
    name: '고대 유물',
    description: '고대 문명의 신비로운 원판',
    isLocked: false, // 새 테마 추가
    unlockCondition: '탑 200층 클리어 ✓'
  }
];

interface ThemeSelectorProps {
  type: 'board' | 'stone';
  onClose?: () => void;
}

export function ThemeSelector({ type, onClose }: ThemeSelectorProps) {
  const { theme, setTheme } = useGameStore();
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  const themes = type === 'board' ? BOARD_THEMES : STONE_THEMES;
  const currentTheme = type === 'board' ? theme.board : theme.stone;

  const handleSelect = (themeId: string) => {
    // 테마 변경 햅틱 피드백
    haptic.themeChange();

    if (type === 'board') {
      setTheme({ board: themeId as any });
    } else {
      setTheme({ stone: themeId as any });
    }
  };

  const handlePreview = (themeId: string) => {
    // 미리보기 햅틱 피드백
    haptic.buttonTap();
    setPreviewTheme(themeId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-tower-silver-200">
          {type === 'board' ? '보드 테마' : '스톤 테마'} 선택
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-tower-silver-400 hover:text-tower-silver-200"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {themes.map((themeOption) => (
          <ThemeItem
            key={themeOption.id}
            theme={themeOption}
            isSelected={currentTheme === themeOption.id}
            isPreviewing={previewTheme === themeOption.id}
            onSelect={handleSelect}
            onPreview={handlePreview}
          />
        ))}
      </div>

      {previewTheme && (
        <div className="card bg-gradient-to-br from-tower-deep-50 to-purple-900/20 border border-tower-gold-400/30">
          <div className="text-center mb-4">
            <h4 className="text-lg font-bold text-tower-gold-400 mb-2">
              테마 미리보기
            </h4>
            <p className="text-sm text-tower-silver-400">
              {themes.find(t => t.id === previewTheme)?.name} - {themes.find(t => t.id === previewTheme)?.description}
            </p>
          </div>

          <div className="flex items-center justify-center mb-4">
            <ThemePreviewBoard themeId={previewTheme} type={type} />
          </div>

          <div className="flex gap-2">
            <button
              className="btn-primary flex-1 glow-gold"
              onClick={() => {
                handleSelect(previewTheme);
                setPreviewTheme(null);
              }}
            >
              ✨ 이 테마로 적용!
            </button>
            <button
              className="btn-secondary flex-1"
              onClick={() => setPreviewTheme(null)}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ThemeItemProps {
  theme: ThemeOption;
  isSelected: boolean;
  isPreviewing: boolean;
  onSelect: (id: string) => void;
  onPreview: (id: string) => void;
}

function ThemeItem({ theme, isSelected, isPreviewing, onSelect, onPreview }: ThemeItemProps) {
  return (
    <div
      className={`card-hover relative ${
        isSelected ? 'ring-2 ring-tower-gold-400' : ''
      } ${
        isPreviewing ? 'ring-2 ring-blue-400' : ''
      }`}
    >
      <div className="flex items-center">
        {/* 테마 미리보기 아이콘 */}
        <div className="w-12 h-12 rounded-lg mr-4 flex items-center justify-center bg-tower-deep-200">
          <ThemeIcon themeId={theme.id} />
        </div>

        {/* 테마 정보 */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-tower-silver-200">{theme.name}</h4>
            {theme.unlockCondition && (
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                해금됨
              </span>
            )}
            {isSelected && (
              <Check size={16} className="text-tower-gold-400" />
            )}
          </div>
          <p className="text-sm text-tower-silver-400">{theme.description}</p>
          {theme.unlockCondition && (
            <p className="text-xs text-green-400 mt-1">
              🏆 {theme.unlockCondition}
            </p>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="flex gap-2">
          <button
            onClick={() => onPreview(theme.id)}
            className="touch-target hover:bg-tower-deep-50 rounded-lg transition-colors p-2"
            aria-label="미리보기"
          >
            <Eye size={16} className="text-tower-gold-400" />
          </button>

          {!isSelected && (
            <button
              onClick={() => onSelect(theme.id)}
              className="btn-primary text-sm px-4 py-1"
            >
              적용
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ThemeIcon({ themeId }: { themeId: string }) {
  const iconMap: Record<string, string> = {
    classic: '🟢',
    dark: '⚫',
    galaxy: '🌌',
    magic: '🔮',
    crystal: '💎',
    neon: '⚡',
    'ruby-sapphire': '💎',
    'sun-moon': '🌞',
    'fire-ice': '🔥',
    techno: '🔲',
    'galaxy-stone': '🌟',
    ancient: '🏺'
  };

  return (
    <span className="text-xl">
      {iconMap[themeId] || '🎨'}
    </span>
  );
}

// 테마 미리보기 보드 컴포넌트
function ThemePreviewBoard({ themeId, type }: { themeId: string; type: 'board' | 'stone' }) {
  const getBoardStyle = (id: string) => {
    switch (id) {
      case 'classic':
        return 'bg-green-600 border-green-700';
      case 'dark':
        return 'bg-gradient-to-br from-gray-800 to-black border-purple-500';
      case 'galaxy':
        return 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black border-blue-400';
      case 'magic':
        return 'bg-gradient-to-br from-purple-800 to-indigo-900 border-purple-400';
      case 'crystal':
        return 'bg-gradient-to-br from-cyan-200 to-blue-400 border-cyan-300';
      case 'neon':
        return 'bg-gradient-to-br from-gray-900 to-black border-green-400';
      default:
        return 'bg-tower-deep-200 border-tower-silver-500';
    }
  };

  const getStoneStyle = (id: string, isBlack: boolean) => {
    switch (id) {
      case 'classic':
        return isBlack ? 'bg-black border-gray-600' : 'bg-white border-gray-300';
      case 'ruby-sapphire':
        return isBlack ? 'bg-red-600 border-red-700' : 'bg-blue-600 border-blue-700';
      case 'sun-moon':
        return isBlack ? 'bg-yellow-400 border-yellow-500' : 'bg-gray-300 border-gray-400';
      case 'fire-ice':
        return isBlack ? 'bg-orange-500 border-red-600' : 'bg-cyan-300 border-blue-400';
      case 'techno':
        return isBlack ? 'bg-gray-800 border-green-400' : 'bg-gray-200 border-blue-400';
      case 'galaxy-stone':
        return isBlack ? 'bg-purple-600 border-purple-400' : 'bg-cyan-400 border-cyan-300';
      case 'ancient':
        return isBlack ? 'bg-amber-700 border-amber-800' : 'bg-stone-300 border-stone-400';
      default:
        return isBlack ? 'bg-black border-gray-600' : 'bg-white border-gray-300';
    }
  };

  return (
    <div className="relative">
      <div
        className={`w-40 h-40 rounded-lg border-2 grid grid-cols-4 gap-1 p-2 ${
          type === 'board' ? getBoardStyle(themeId) : getBoardStyle('classic')
        }`}
      >
        {/* 4x4 미니 보드 */}
        {Array.from({ length: 16 }, (_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const hasStone = (row === 1 && col === 1) || (row === 1 && col === 2) ||
                          (row === 2 && col === 1) || (row === 2 && col === 2);
          const isBlack = (row === 1 && col === 1) || (row === 2 && col === 2);

          return (
            <div
              key={i}
              className="aspect-square bg-black/20 rounded-sm flex items-center justify-center"
            >
              {hasStone && (
                <div
                  className={`w-6 h-6 rounded-full border ${
                    type === 'stone'
                      ? getStoneStyle(themeId, isBlack)
                      : getStoneStyle('classic', isBlack)
                  } shadow-md`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 반짝이는 효과 */}
      <div className="absolute inset-0 rounded-lg animate-pulse bg-tower-gold-400/10 pointer-events-none" />

      {/* 테마별 특수 효과 */}
      {(themeId === 'galaxy' || themeId === 'galaxy-stone') && (
        <div className="absolute inset-2 rounded-lg overflow-hidden pointer-events-none">
          <div className="w-1 h-1 bg-white rounded-full absolute top-2 left-3 animate-ping" style={{ animationDelay: '0s' }} />
          <div className="w-1 h-1 bg-white rounded-full absolute top-8 right-4 animate-ping" style={{ animationDelay: '1s' }} />
          <div className="w-1 h-1 bg-white rounded-full absolute bottom-6 left-6 animate-ping" style={{ animationDelay: '2s' }} />
        </div>
      )}

      {themeId === 'neon' && (
        <div className="absolute inset-0 rounded-lg border border-green-400 animate-pulse pointer-events-none" />
      )}
    </div>
  );
}