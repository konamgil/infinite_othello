/**
 * React Hooks for Canvas FX System
 * 모바일 게임급 시각 효과를 React 컴포넌트에서 쉽게 사용
 */

import { useEffect, useRef, useCallback } from 'react';
import { fx, CanvasFX } from './CanvasFX';

export function useFXLayer(
  layerName: string,
  width: number,
  height: number,
  active: boolean = true
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 레이어 생성
    layerRef.current = fx.createLayer(
      layerName,
      containerRef.current,
      width,
      height
    );

    fx.setLayer(layerName, active);

    return () => {
      fx.setLayer(layerName, false);
    };
  }, [layerName, width, height, active]);

  return containerRef;
}

export function useFXAnimation() {
  const animationStarted = useRef(false);

  useEffect(() => {
    if (!animationStarted.current) {
      fx.start();
      animationStarted.current = true;
    }

    return () => {
      if (animationStarted.current) {
        fx.stop();
        animationStarted.current = false;
      }
    };
  }, []);
}

export function useFXEffects() {
  const starfield = useCallback((layerName: string, count?: number) => {
    fx.starfield(layerName, count);
  }, []);

  const portalRing = useCallback((element: HTMLElement) => {
    fx.portalRing(element);
  }, []);

  const glowPulse = useCallback((element: HTMLElement) => {
    fx.glowPulse(element);
  }, []);

  const discFlip = useCallback((x: number, y: number, color: string) => {
    fx.discFlip(x, y, color);
  }, []);

  const flipBurst = useCallback((x: number, y: number) => {
    fx.flipBurst(x, y);
  }, []);

  const landingRipple = useCallback((x: number, y: number) => {
    fx.landingRipple(x, y);
  }, []);

  const nodeSpark = useCallback((x: number, y: number) => {
    fx.nodeSpark(x, y);
  }, []);

  const errorShake = useCallback((element: HTMLElement) => {
    fx.errorShake(element);
  }, []);

  const emit = useCallback((eventName: string, detail: any) => {
    fx.emit(eventName, detail);
  }, []);

  return {
    starfield,
    portalRing,
    glowPulse,
    discFlip,
    flipBurst,
    landingRipple,
    nodeSpark,
    errorShake,
    emit
  };
}

export function useFXButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const effects = useFXEffects();

  const handleMouseEnter = useCallback(() => {
    if (buttonRef.current) {
      effects.glowPulse(buttonRef.current);
    }
  }, [effects]);

  const handlePointerDown = useCallback(() => {
    if (buttonRef.current) {
      effects.portalRing(buttonRef.current);
    }
  }, [effects]);

  const buttonProps = {
    ref: buttonRef,
    onMouseEnter: handleMouseEnter,
    onPointerDown: handlePointerDown,
    style: {
      transition: 'all 0.2s ease',
      position: 'relative' as const
    }
  };

  return { buttonRef, buttonProps };
}

export function useFXGameBoard() {
  const effects = useFXEffects();

  const onDiscPlace = useCallback((x: number, y: number) => {
    effects.landingRipple(x, y);
    effects.emit('game:place', { x, y });

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([10]);
    }
  }, [effects]);

  const onDiscFlip = useCallback((x: number, y: number, color: string) => {
    effects.emit('game:flipStart', { disc: { color }, x, y });

    // 중간 페이스 스왑
    setTimeout(() => {
      // Face swap effect at flip mid-point
      effects.emit('game:flipMid', { x, y, color });
    }, 80);
  }, [effects]);

  const onGameEnd = useCallback((result: 'victory' | 'defeat', finalScore: { player: number, opponent: number }) => {
    if (result === 'victory') {
      // 승리 폭발 효과
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          effects.emit('game:victoryBurst', {
            x: 195 + Math.cos(i * Math.PI / 4) * 60,
            y: 195 + Math.sin(i * Math.PI / 4) * 60
          });
        }, i * 50);
      }

      // Victory haptic
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    } else {
      // 패배 효과
      effects.emit('game:defeatEffect', { finalScore });

      // Defeat haptic
      if ('vibrate' in navigator) {
        navigator.vibrate([200]);
      }
    }
  }, [effects]);

  return {
    onDiscPlace,
    onDiscFlip,
    onGameEnd
  };
}

export function useFXTower() {
  const effects = useFXEffects();

  const onFloorUnlock = useCallback((floorNumber: number, x: number, y: number) => {
    effects.nodeSpark(x, y);
    effects.emit('tower:progress', { node: { x, y }, floor: floorNumber });

    // Floor unlock haptic
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 20, 30]);
    }
  }, [effects]);

  const onBossEncounter = useCallback((x: number, y: number) => {
    // 보스 인카운터 특수 효과
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        effects.nodeSpark(x, y);
      }, i * 200);
    }

    effects.emit('tower:bossEncounter', { x, y });

    // Boss encounter haptic
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 100, 50, 200]);
    }
  }, [effects]);

  return {
    onFloorUnlock,
    onBossEncounter
  };
}

export function useFXModal() {
  const modalRef = useRef<HTMLDivElement>(null);
  const effects = useFXEffects();

  const openModal = useCallback(() => {
    if (modalRef.current) {
      effects.portalRing(modalRef.current);
      effects.emit('ui:modalOpen', { element: modalRef.current });
    }
  }, [effects]);

  const closeModal = useCallback(() => {
    if (modalRef.current) {
      effects.emit('ui:modalClose', { element: modalRef.current });
    }
  }, [effects]);

  return {
    modalRef,
    openModal,
    closeModal
  };
}

export function useFXStats() {
  const getStats = useCallback(() => {
    return fx.getStats();
  }, []);

  return { getStats };
}