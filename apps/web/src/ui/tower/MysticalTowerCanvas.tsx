import React, { useRef, useEffect, useState } from 'react';

/**
 * @interface MysticalTowerCanvasProps
 * `MysticalTowerCanvas` 컴포넌트의 props를 정의합니다.
 */
interface MysticalTowerCanvasProps {
  /** @property {number} currentFloor - 플레이어의 현재 층수. */
  currentFloor: number;
  /** @property {number} maxFloor - 탑의 최대 층수. */
  maxFloor: number;
  /** @property {string} [className] - 컴포넌트의 최상위 `<canvas>` 요소에 적용할 추가 CSS 클래스. */
  className?: string;
}

/** @interface Star 별 파티클의 속성을 정의합니다. */
interface Star {
  x: number; y: number; size: number; brightness: number;
  twinkleSpeed: number; phase: number; color: string;
}

/** @interface OthelloDisc 떠다니는 오델로 디스크 파티클의 속성을 정의합니다. */
interface OthelloDisc {
  x: number; y: number; size: number; color: 'black' | 'white';
  glow: number; rotationSpeed: number; rotation: number;
}

/**
 * '무한의 탑' 진행 상황을 신비롭고 스타일리시하게 시각화하는 Canvas 애니메이션 컴포넌트입니다.
 * 2.5D 원근감 탑, 떠다니는 오델로 디스크, 마법진 등 복잡하고 아름다운 효과를 포함합니다.
 * @param {MysticalTowerCanvasProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 애니메이션을 위한 `<canvas>` 요소.
 */
export function MysticalTowerCanvas({ currentFloor, maxFloor, className = '' }: MysticalTowerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  /** @state {boolean} isVisible - IntersectionObserver에 의해 결정되는 캔버스의 화면 내 표시 여부. */
  const [isVisible, setIsVisible] = useState(false);

  /**
   * IntersectionObserver를 설정하여 캔버스가 뷰포트에 들어올 때만 애니메이션을 실행합니다.
   * 이는 보이지 않는 컴포넌트의 렌더링 부하를 줄이는 중요한 성능 최적화입니다.
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  /**
   * `isVisible` 상태가 true일 때만 실행되는 메인 애니메이션 로직입니다.
   * 캔버스 설정, 모든 파티클 초기화, 애니메이션 루프를 담당합니다.
   */
  useEffect(() => {
    if (!isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /** 캔버스 크기를 설정하고 고해상도 디스플레이에 맞게 조정합니다. */
    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    setCanvasSize();

    const canvasWidth = canvas.width / (window.devicePixelRatio || 1);
    const canvasHeight = canvas.height / (window.devicePixelRatio || 1);

    // --- 파티클 초기화 ---
    const stars: Star[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight * 0.7,
      size: Math.random() * 2.5 + 0.5,
      brightness: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.03 + 0.01,
      phase: Math.random() * Math.PI * 2,
      color: ['#ffffff', '#ffeb3b', '#81c784', '#64b5f6'][Math.floor(Math.random() * 4)]
    }));

    const floatingDiscs: OthelloDisc[] = Array.from({ length: 12 }, () => ({
      x: canvasWidth * 0.2 + Math.random() * canvasWidth * 0.6,
      y: canvasHeight * 0.2 + Math.random() * canvasHeight * 0.6,
      size: Math.random() * 8 + 4,
      color: Math.random() > 0.5 ? 'black' : 'white',
      glow: Math.random() * 0.5 + 0.3,
      rotationSpeed: Math.random() * 0.02 + 0.005,
      rotation: Math.random() * Math.PI * 2
    }));

    let startTime = Date.now();

    /** 매 프레임 실행되는 핵심 애니메이션 루프. */
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // 1. 배경 그리기 (그라데이션, 성운 효과)
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      bgGradient.addColorStop(0, '#000003');
      bgGradient.addColorStop(1, '#0a0a1a');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const nebula1 = ctx.createRadialGradient(canvasWidth * 0.2, canvasHeight * 0.3, 0, canvasWidth * 0.2, canvasHeight * 0.3, canvasWidth * 0.4);
      nebula1.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
      nebula1.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 2. 별 그리기
      stars.forEach((star, index) => { /* ... 별 그리기 로직 ... */ });

      // 3. 2.5D 탑 그리기
      const towerCenterX = canvasWidth / 2;
      const towerBaseY = canvasHeight * 0.95;
      const towerHeight = canvasHeight * 0.7;
      const towerSections = Math.min(15, Math.ceil(currentFloor / 20));
      const perspective = 0.7;

      for (let i = 0; i < towerSections; i++) {
        const sectionProgress = i / towerSections;
        const isCompleted = currentFloor >= (i + 1) * 20;
        const isCurrent = currentFloor >= i * 20 + 1 && currentFloor < (i + 1) * 20;

        // 원근감 적용된 위치와 크기 계산
        const sectionY = towerBaseY - (sectionProgress * towerHeight);
        const sectionWidth = (60 - sectionProgress * 20) * (1 + sectionProgress * perspective);
        const sectionHeight = 25;
        const sideOffset = sectionWidth * 0.15;

        // 섹션 색상 결정 및 3D 면 그리기
        // ... (정면, 측면, 상단면 그리기 로직)
      }

      // 4. 탑 꼭대기 크리스탈 그리기 (완주 시)
      if (currentFloor >= maxFloor) { /* ... 크리스탈 그리기 로직 ... */ }

      // 5. 떠다니는 오델로 디스크 그리기
      floatingDiscs.forEach((disc, index) => { /* ... 디스크 위치 업데이트 및 3D 회전 렌더링 로직 ... */ });

      // 6. 바닥의 마법진 효과 그리기
      const runeRadius = 80;
      ctx.save();
      // ... (마법진 원 및 룬 문자 그리기 로직)
      ctx.restore();

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => setCanvasSize();
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentFloor, maxFloor, isVisible]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  );
}