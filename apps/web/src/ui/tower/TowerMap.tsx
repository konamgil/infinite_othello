import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useFXLayer, useFXEffects, useFXTower } from '../fx/FXHooks';
import { haptic } from '../feedback/HapticFeedback';
import { Crown, Shield, Star, Zap, Trophy } from 'lucide-react';

interface FloorNode {
  floor: number;
  x: number;
  y: number;
  isUnlocked: boolean;
  isBoss: boolean;
  isMiniBoss: boolean;
  isCleared: boolean;
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare' | 'impossible';
}

interface TowerMapProps {
  onFloorSelect?: (floor: number) => void;
  showDetails?: boolean;
}

export function TowerMap({ onFloorSelect, showDetails = true }: TowerMapProps) {
  const { player } = useGameStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const effects = useFXEffects();

  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [viewportStart, setViewportStart] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // FX 레이어 설정
  const towerFXRef = useFXLayer('tower', 390, 600, true);

  // FX 타워 훅 사용
  const { onFloorUnlock, onBossEncounter } = useFXTower();

  // 노드 데이터 생성
  const generateFloorNodes = (): FloorNode[] => {
    const nodes: FloorNode[] = [];
    const MAP_WIDTH = 350;
    const NODE_SPACING_Y = 80;

    for (let floor = 1; floor <= 300; floor++) {
      // 지그재그 패턴으로 X 좌표 계산
      const rowIndex = Math.floor((floor - 1) / 10);
      const colIndex = (floor - 1) % 10;

      let x: number;
      if (rowIndex % 2 === 0) {
        // 왼쪽에서 오른쪽
        x = 30 + (colIndex * (MAP_WIDTH - 60) / 9);
      } else {
        // 오른쪽에서 왼쪽
        x = 30 + ((9 - colIndex) * (MAP_WIDTH - 60) / 9);
      }

      const y = (floor - 1) * (NODE_SPACING_Y / 10) + 50;

      const isBoss = floor % 50 === 0;
      const isMiniBoss = floor % 10 === 0 && !isBoss;
      const isUnlocked = floor <= player.towerProgress;
      const isCleared = floor < player.towerProgress;

      // 난이도 계산
      let difficulty: FloorNode['difficulty'];
      if (floor <= 50) difficulty = 'easy';
      else if (floor <= 150) difficulty = 'normal';
      else if (floor <= 250) difficulty = 'hard';
      else if (floor <= 290) difficulty = 'nightmare';
      else difficulty = 'impossible';

      nodes.push({
        floor,
        x,
        y,
        isUnlocked,
        isBoss,
        isMiniBoss,
        isCleared,
        difficulty
      });
    }

    return nodes;
  };

  const floorNodes = generateFloorNodes();

  // 스크롤 위치 업데이트
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = 8; // 대략적인 노드당 높이 (픽셀)
      const start = Math.floor(scrollTop / itemHeight);
      setViewportStart(start);
      setIsScrolling(true);

      // 스크롤 멈춤 감지
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTimeout = useRef<NodeJS.Timeout>();

  // 현재 층으로 자동 스크롤
  useEffect(() => {
    if (scrollRef.current && player.towerProgress > 5) {
      const targetY = (player.towerProgress - 1) * 8;
      scrollRef.current.scrollTo({
        top: Math.max(0, targetY - 200),
        behavior: 'smooth'
      });
    }
  }, [player.towerProgress]);

  // 층 선택 핸들러
  const handleFloorClick = useCallback((node: FloorNode) => {
    if (!node.isUnlocked) {
      // 잠긴 층 - 에러 효과
      const nodeElement = document.getElementById(`floor-${node.floor}`);
      if (nodeElement) {
        effects.errorShake(nodeElement);
      }
      return;
    }

    setSelectedFloor(node.floor);

    // FX 효과
    if (node.isBoss) {
      onBossEncounter(node.x, node.y);
    } else {
      onFloorUnlock(node.floor, node.x, node.y);
    }

    // 선택 콜백
    if (onFloorSelect) {
      onFloorSelect(node.floor);
    }

    // 햅틱 피드백
    if (node.isBoss) {
      haptic.bossEncounter();
    } else {
      haptic.floorUnlock();
    }
  }, [onFloorSelect, onBossEncounter, onFloorUnlock, effects]);

  // 렌더링 최적화를 위한 가상 스크롤
  const visibleNodes = floorNodes.slice(
    Math.max(0, viewportStart - 10),
    Math.min(floorNodes.length, viewportStart + 40)
  );

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {/* FX 레이어 */}
      <div ref={towerFXRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-b from-tower-deep-100 via-purple-900/20 to-tower-deep-200" />

      {/* 타워 맵 스크롤 컨테이너 */}
      <div
        ref={scrollRef}
        className="relative h-full overflow-y-auto scrollbar-thin scrollbar-thumb-tower-gold-400 scrollbar-track-tower-deep-300"
      >
        {/* 타워 배경 이미지/패턴 */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-repeat tower-map-pattern" />
        </div>

        {/* 스크롤 컨테이너 */}
        <div
          className="relative min-h-[2400px] w-full"
          style={{ height: `${300 * 8}px` }}
        >
          {/* 가상 스크롤된 노드들만 렌더링 */}
          {visibleNodes.map((node) => (
            <TowerNode
              key={node.floor}
              node={node}
              isSelected={selectedFloor === node.floor}
              onClick={() => handleFloorClick(node)}
              showDetails={showDetails}
            />
          ))}

          {/* 진행도 라인 */}
          <ProgressLine
            nodes={floorNodes.slice(0, player.towerProgress)}
            currentProgress={player.towerProgress}
          />

          {/* 상단 목표 표시 */}
          {player.towerProgress < 300 && (
            <div
              className="absolute left-1/2 transform -translate-x-1/2 z-20"
              style={{ top: `${(player.towerProgress) * 8}px` }}
            >
              <div className="bg-tower-gold-400 text-tower-deep-500 px-3 py-1 rounded-full text-sm font-bold animate-pulse shadow-lg">
                목표: {player.towerProgress + 1}층
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 진행도 요약 */}
      <div className="absolute bottom-0 left-0 right-0 bg-tower-deep-100/95 backdrop-blur-sm border-t border-tower-silver-500 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-tower-silver-400">진행도</div>
            <div className="text-lg font-bold text-tower-gold-400">
              {player.towerProgress}/300층
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs text-tower-silver-400">클리어</div>
              <div className="text-sm font-semibold text-green-400">
                {Math.max(0, player.towerProgress - 1)}
              </div>
            </div>

            <div className="text-center">
              <div className="text-xs text-tower-silver-400">보스</div>
              <div className="text-sm font-semibold text-red-400">
                {Math.floor((player.towerProgress - 1) / 50)}
              </div>
            </div>

            <div className="text-center">
              <div className="text-xs text-tower-silver-400">달성률</div>
              <div className="text-sm font-semibold text-purple-400">
                {Math.round((player.towerProgress / 300) * 100)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TowerNodeProps {
  node: FloorNode;
  isSelected: boolean;
  onClick: () => void;
  showDetails: boolean;
}

function TowerNode({ node, isSelected, onClick, showDetails }: TowerNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getNodeColor = () => {
    if (!node.isUnlocked) return 'bg-tower-silver-600';
    if (node.isCleared) return 'bg-green-500';
    if (node.isBoss) return 'bg-gradient-to-br from-red-500 to-red-600';
    if (node.isMiniBoss) return 'bg-gradient-to-br from-purple-500 to-purple-600';
    return 'bg-tower-gold-400';
  };

  const getNodeIcon = () => {
    if (node.isBoss) return <Crown size={16} className="text-white" />;
    if (node.isMiniBoss) return <Shield size={14} className="text-white" />;
    if (node.isCleared) return <Trophy size={12} className="text-white" />;
    if (!node.isUnlocked) return <span className="text-xs text-tower-silver-400">🔒</span>;
    return <Star size={12} className="text-tower-deep-500" />;
  };

  const getDifficultyColor = () => {
    switch (node.difficulty) {
      case 'easy': return 'text-green-400';
      case 'normal': return 'text-blue-400';
      case 'hard': return 'text-orange-400';
      case 'nightmare': return 'text-red-400';
      case 'impossible': return 'text-purple-400';
      default: return 'text-tower-silver-400';
    }
  };

  const nodeSize = node.isBoss ? 'w-12 h-12' : node.isMiniBoss ? 'w-10 h-10' : 'w-8 h-8';
  const textSize = node.isBoss ? 'text-xs' : node.isMiniBoss ? 'text-xs' : 'text-xs';

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: node.x, top: node.y }}
    >
      {/* 노드 */}
      <div
        id={`floor-${node.floor}`}
        className={`
          ${nodeSize} ${getNodeColor()} rounded-full
          flex items-center justify-center cursor-pointer
          transition-all duration-200 hover:scale-110
          ${isSelected ? 'ring-4 ring-tower-gold-400 ring-opacity-60' : ''}
          ${node.isUnlocked ? 'shadow-lg' : 'opacity-60'}
          ${isHovered && node.isUnlocked ? 'shadow-2xl' : ''}
        `}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {getNodeIcon()}

        {/* 보스 노드 글로우 효과 */}
        {node.isBoss && node.isUnlocked && (
          <div className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-20" />
        )}

        {/* 다음 도전 층 글로우 */}
        {node.floor === Math.min(300, node.isUnlocked ? node.floor + 1 : node.floor) && (
          <div className="absolute inset-0 rounded-full animate-pulse bg-tower-gold-400 opacity-30" />
        )}
      </div>

      {/* 층 번호 */}
      <div className={`${textSize} text-center mt-1 font-bold text-tower-silver-200`}>
        {node.floor}
      </div>

      {/* 상세 정보 툴팁 (호버 시) */}
      {isHovered && showDetails && node.isUnlocked && (
        <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-full -mt-2 z-30">
          <div className="bg-tower-deep-100 border border-tower-silver-500 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
            <div className="font-bold text-tower-silver-200">
              {node.floor}층
              {node.isBoss && <span className="ml-1 text-red-400">BOSS</span>}
              {node.isMiniBoss && <span className="ml-1 text-purple-400">미니보스</span>}
            </div>

            <div className={`text-xs ${getDifficultyColor()}`}>
              난이도: {node.difficulty.toUpperCase()}
            </div>

            {node.isCleared ? (
              <div className="text-green-400 text-xs">✓ 클리어 완료</div>
            ) : (
              <div className="text-tower-gold-400 text-xs">도전 가능</div>
            )}

            {/* 예상 보상 */}
            <div className="text-tower-silver-400 text-xs mt-1">
              보상: {node.isBoss ? '200 RP + 테마' : node.isMiniBoss ? '100 RP' : '50 RP'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ProgressLineProps {
  nodes: FloorNode[];
  currentProgress: number;
}

function ProgressLine({ nodes, currentProgress }: ProgressLineProps) {
  if (nodes.length < 2) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#facc15" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* 진행 경로 그리기 */}
      <path
        d={`M ${nodes[0].x} ${nodes[0].y} ${nodes
          .slice(1)
          .map(node => `L ${node.x} ${node.y}`)
          .join(' ')}`}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth="3"
        strokeDasharray="5,5"
        opacity="0.7"
      />
    </svg>
  );
}