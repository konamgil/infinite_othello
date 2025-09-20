import React, { useRef, useEffect, useState } from 'react';

/**
 * @interface StellaCanvasProps
 * `StellaCanvas` 컴포넌트의 props를 정의합니다.
 */
interface StellaCanvasProps {
  /** @property {string} [className] - 컴포넌트의 최상위 `<canvas>` 요소에 적용할 추가 CSS 클래스. */
  className?: string;
  /** @property {boolean} [isActive=true] - 애니메이션 활성화 여부. false이면 애니메이션이 정지됩니다. */
  isActive?: boolean;
}

/** @interface Star 배경에 렌더링될 별의 속성을 정의합니다. */
interface Star {
  x: number; y: number; size: number; brightness: number;
  twinkleSpeed: number; phase: number; color: string;
}

/** @interface StellaParticle AI 코어에서 방출되는 파티클의 속성을 정의합니다. */
interface StellaParticle {
  x: number; y: number; vx: number; vy: number; size: number;
  life: number; maxLife: number; color: string;
}

/** @interface KnowledgeOrb AI 코어 주위를 맴도는 '지식 오브'의 속성을 정의합니다. */
interface KnowledgeOrb {
  x: number; y: number; baseX: number; baseY: number; size: number;
  phase: number; speed: number; color: string; symbol: string;
}

/**
 * "스텔라" AI 어시스턴트 화면을 위한 동적이고 아름다운 Canvas 배경을 렌더링하는 컴포넌트입니다.
 * AI의 '사고 과정'을 시각적으로 표현하기 위해 중앙 코어, 지식 오브, 파티클 등 다양한 효과를 사용합니다.
 * @param {StellaCanvasProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 애니메이션 배경을 위한 `<canvas>` 요소.
 */
export function StellaCanvas({ className = '', isActive = true }: StellaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  /** @state {boolean} isVisible - IntersectionObserver에 의해 결정되는 캔버스의 화면 내 표시 여부. */
  const [isVisible, setIsVisible] = useState(false);

  /**
   * IntersectionObserver를 설정하여 캔버스가 뷰포트에 들어올 때만 애니메이션을 실행합니다.
   * 이는 성능 최적화를 위해 중요합니다.
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
   * `isVisible`과 `isActive` 상태가 모두 true일 때만 실행되는 메인 애니메이션 로직입니다.
   */
  useEffect(() => {
    if (!isVisible || !isActive) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

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

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    // --- 파티클 및 오브젝트 초기화 ---
    const stars: Star[] = Array.from({ length: 80 }, () => ({ /* ... */ } as Star));
    const stellaParticles: StellaParticle[] = [];
    const knowledgeOrbs: KnowledgeOrb[] = Array.from({ length: 12 }, (v, i) => ({ /* ... */ } as KnowledgeOrb));

    let animationTime = 0;

    /** 매 프레임 실행되는 핵심 애니메이션 루프. */
    const animate = () => {
      animationTime += 0.016;
      ctx.clearRect(0, 0, width, height);

      // 1. 배경 그리기 (그라데이션, 성운, 별)
      // ...

      // 2. 스텔라 AI 중앙 홀로그램 그리기 (코어, 회전 링)
      // ...

      // 3. 지식 오브(Knowledge Orbs) 그리기
      // ...

      // 4. 스텔라 AI 파티클 시스템 처리 및 그리기
      // ...

      // 5. 지식 오브들 사이의 연결선 그리기
      // ...

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => setCanvasSize();
    window.addEventListener('resize', handleResize);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [isVisible, isActive]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  );
}