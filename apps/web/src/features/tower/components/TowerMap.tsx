import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useFXLayer, useFXEffects, useFXTower } from '../fx/FXHooks';
import { haptic } from '../feedback/HapticFeedback';
import { Crown, Shield, Star, Zap, Trophy } from 'lucide-react';

/**
 * @interface FloorNode
 * 탑 맵의 각 층(노드)에 대한 데이터 구조를 정의합니다.
 */
interface FloorNode {
  floor: number;
  x: number; y: number;
  isUnlocked: boolean;
  isBoss: boolean;
  isMiniBoss: boolean;
  isCleared: boolean;
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare' | 'impossible';
}

/**
 * @interface TowerMapProps
 * `TowerMap` 컴포넌트의 props를 정의합니다.
 */
interface TowerMapProps {
  /** @property {(floor: number) => void} [onFloorSelect] - 사용자가 층을 선택했을 때 호출될 콜백. */
  onFloorSelect?: (floor: number) => void;
  /** @property {boolean} [showDetails=true] - 노드에 마우스를 올렸을 때 상세 정보 툴팁을 표시할지 여부. */
  showDetails?: boolean;
}

/**
 * '무한의 탑' 전체 맵을 표시하고 상호작용하는 메인 컴포넌트입니다.
 * 수백 개의 층을 효율적으로 렌더링하기 위해 가상 스크롤링을 사용합니다.
 * @param {TowerMapProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 타워 맵 UI.
 */
export function TowerMap({ onFloorSelect, showDetails = true }: TowerMapProps) {
  const { player } = useGameStore(); // Zustand 스토어에서 플레이어 진행 상황 가져오기
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const effects = useFXEffects(); // 시각 효과 훅
  const scrollTimeout = useRef<NodeJS.Timeout>();

  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  /** @state {number} viewportStart - 가상 스크롤링을 위해 현재 뷰포트의 시작 노드 인덱스를 추적. */
  const [viewportStart, setViewportStart] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // FX (시각 효과) 관련 훅 설정
  const towerFXRef = useFXLayer('tower', 390, 600, true);
  const { onFloorUnlock, onBossEncounter } = useFXTower();

  /**
   * 300층 전체에 대한 노드 데이터를 절차적으로 생성합니다.
   * 각 노드의 위치, 속성(보스, 난이도 등)을 계산합니다.
   * @returns {FloorNode[]} 생성된 모든 층 노드의 배열.
   */
  const generateFloorNodes = (): FloorNode[] => {
    const nodes: FloorNode[] = [];
    const MAP_WIDTH = 350;
    const NODE_SPACING_Y = 80;

    for (let floor = 1; floor <= 300; floor++) {
      // 지그재그 패턴으로 X 좌표 계산
      const rowIndex = Math.floor((floor - 1) / 10);
      const colIndex = (floor - 1) % 10;
      const x = (rowIndex % 2 === 0)
        ? 30 + (colIndex * (MAP_WIDTH - 60) / 9)
        : 30 + ((9 - colIndex) * (MAP_WIDTH - 60) / 9);
      const y = (floor - 1) * (NODE_SPACING_Y / 10) + 50;

      // 층 속성 결정
      const isBoss = floor % 50 === 0;
      const isMiniBoss = floor % 10 === 0 && !isBoss;
      const isUnlocked = floor <= player.towerProgress;
      const isCleared = floor < player.towerProgress;
      let difficulty: FloorNode['difficulty'] = 'easy';
      if (floor > 290) difficulty = 'impossible';
      else if (floor > 250) difficulty = 'nightmare';
      else if (floor > 150) difficulty = 'hard';
      else if (floor > 50) difficulty = 'normal';

      nodes.push({ floor, x, y, isUnlocked, isBoss, isMiniBoss, isCleared, difficulty });
    }
    return nodes;
  };

  const floorNodes = generateFloorNodes();

  /**
   * 스크롤 이벤트를 감지하여 가상 스크롤링을 위한 `viewportStart` 상태를 업데이트합니다.
   * 성능을 위해 스크롤이 멈추면 `isScrolling` 상태를 false로 변경합니다.
   */
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop } = container;
      const itemHeight = 8; // 노드당 대략적인 픽셀 높이
      setViewportStart(Math.floor(scrollTop / itemHeight));
      setIsScrolling(true);
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => setIsScrolling(false), 150);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  /** 컴포넌트 마운트 시 현재 진행 중인 층으로 부드럽게 스크롤합니다. */
  useEffect(() => {
    if (scrollRef.current && player.towerProgress > 5) {
      const targetY = (player.towerProgress - 1) * 8;
      scrollRef.current.scrollTo({ top: Math.max(0, targetY - 200), behavior: 'smooth' });
    }
  }, [player.towerProgress]);

  /** 층 노드 클릭 이벤트를 처리합니다. */
  const handleFloorClick = useCallback((node: FloorNode) => {
    if (!node.isUnlocked) {
      const nodeElement = document.getElementById(`floor-${node.floor}`);
      if (nodeElement) effects.errorShake(nodeElement);
      return;
    }
    setSelectedFloor(node.floor);
    if (node.isBoss) onBossEncounter(node.x, node.y);
    else onFloorUnlock(node.floor, node.x, node.y);
    onFloorSelect?.(node.floor);
    if (node.isBoss) haptic.bossEncounter();
    else haptic.floorUnlock();
  }, [onFloorSelect, onBossEncounter, onFloorUnlock, effects]);

  // 가상 스크롤링: 현재 뷰포트에 보이는 노드들만 필터링합니다.
  const visibleNodes = floorNodes.slice(
    Math.max(0, viewportStart - 10),
    Math.min(floorNodes.length, viewportStart + 40)
  );