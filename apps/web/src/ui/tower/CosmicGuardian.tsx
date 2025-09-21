import React, { useRef, useEffect } from 'react';

/**
 * @interface CosmicGuardianProps
 * `CosmicGuardian` 컴포넌트의 props를 정의합니다.
 */
interface CosmicGuardianProps {
  /** @property {string} [className] - 캔버스 요소에 적용할 추가적인 CSS 클래스입니다. */
  className?: string;
}

/**
 * @interface Particle
 * 애니메이션에 사용될 단일 파티클(입자)의 속성을 정의합니다.
 */
interface Particle {
  /** @property {number} x - 파티클의 x 좌표 */
  x: number;
  /** @property {number} y - 파티클의 y 좌표 */
  y: number;
  /** @property {number} r - 파티클의 반지름 */
  r: number;
  /** @property {number} alpha - 파티클의 투명도 */
  alpha: number;
  /** @property {number} phase - 파티클의 움직임 및 맥박 효과를 위한 위상(phase) 값 */
  phase: number;
}

/**
 * '우주 수호자'를 시각화하는 제너레이티브 아트 캔버스 애니메이션을 렌더링합니다.
 * 이 컴포넌트는 서로 연결되어 부드럽게 움직이고 맥박치는 파티클들의 집합을 그립니다.
 * @param {CosmicGuardianProps} props - 컴포넌트 props
 * @returns {JSX.Element} 캔버스 기반 애니메이션 컴포넌트
 */
export function CosmicGuardian({ className = '' }: CosmicGuardianProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Particle[] = [];
    const numParticles = 7; // 생성할 파티클의 수

    /**
     * 캔버스 크기를 컨테이너에 맞게 조정하고, 고해상도(HiDPI/Retina) 디스플레이를 지원합니다.
     * @returns {{width: number, height: number}} 조정된 캔버스의 논리적 너비와 높이
     */
    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1; // 디바이스 픽셀 비율
      canvas.width = width * dpr; // 물리적 픽셀 너비 설정
      canvas.height = height * dpr; // 물리적 픽셀 높이 설정
      ctx.scale(dpr, dpr); // 캔버스 컨텍스트의 스케일을 조정하여 선명하게 렌더링
      return { width, height };
    };

    const { width, height } = resizeCanvas();

    // 초기 파티클 생성
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 50, // 중앙 부근에 랜덤하게 배치
        y: height / 2 + (Math.random() - 0.5) * 50,
        r: Math.random() * 2 + 1, // 랜덤한 반지름
        alpha: Math.random() * 0.5 + 0.5, // 랜덤한 투명도
        phase: Math.random() * Math.PI // 랜덤한 시작 위상
      });
    }

    /**
     * 매 프레임마다 캔버스를 다시 그리는 메인 애니메이션 루프입니다.
     * @param {number} time - `requestAnimationFrame`으로부터 전달받는 타임스탬프
     */
    const animate = (time: number) => {
      // 이전 프레임 지우기
      ctx.clearRect(0, 0, width, height);

      // 각 파티클의 위치를 업데이트하여 부드러운 움직임 생성
      particles.forEach(p => {
        p.phase += 0.01;
        p.x += Math.sin(p.phase) * 0.1;
        p.y += Math.cos(p.phase * 0.7) * 0.1;
      });

      // 파티클들 사이에 연결선 그리기
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.2)'; // 반투명한 보라색
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }

      // 파티클(별) 그리기
      particles.forEach(p => {
        // sin 함수를 사용하여 0과 1 사이를 반복하는 맥박(pulse) 효과 생성
        const pulse = Math.sin(p.phase * 2) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * pulse + 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(221, 214, 254, ${p.alpha * pulse + 0.2})`;
        ctx.shadowColor = '#c4b5fd'; // 글로우 효과를 위한 그림자 색상
        ctx.shadowBlur = 10 * pulse; // 맥박에 따라 글로우 크기 조절
        ctx.fill();
      });
      ctx.shadowBlur = 0; // 다른 요소에 그림자 영향 없도록 초기화

      // 다음 프레임 요청
      animationFrameId = requestAnimationFrame(animate);
    };

    animate(0); // 애니메이션 시작

    // 창 크기가 변경될 때 캔버스 크기를 다시 조정
    window.addEventListener('resize', resizeCanvas);

    // 컴포넌트가 언마운트될 때 애니메이션 루프와 이벤트 리스너 정리
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []); // 빈 배열을 전달하여 컴포넌트 마운트 시 한 번만 실행되도록 함

  return <canvas ref={canvasRef} className={className} />;
}
