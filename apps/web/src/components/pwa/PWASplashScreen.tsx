import React, { useState, useEffect } from 'react';

interface PWASplashScreenProps {
  /** PWA 스플래시 화면 표시 여부 */
  isVisible: boolean;
  /** 스플래시 화면 완료 시 호출되는 콜백 */
  onComplete: () => void;
  /** 스플래시 화면 총 지속 시간 (ms) */
  duration?: number;
}

/**
 * PWA 스플래시 스크린 컴포넌트
 *
 * 앱 시작 시 표시되는 홀로그램 스타일의 로딩 화면입니다.
 * LOADING COMBAT MATRIX 디자인을 기반으로 하여 앱의 브랜딩을 포함합니다.
 */
export function PWASplashScreen({
  isVisible,
  onComplete,
  duration = 4000
}: PWASplashScreenProps) {
  const [matrixActive, setMatrixActive] = useState(false);
  const [phase, setPhase] = useState<'MATRIX_LOAD'>('MATRIX_LOAD');

  useEffect(() => {
    if (!isVisible) return;

    const timeline = [
      { delay: 500, action: () => setMatrixActive(true) },
      { delay: duration, action: onComplete }
    ];

    const timeouts = timeline.map(({ delay, action }) =>
      setTimeout(action, delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [isVisible, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      {/* 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-green-900/10 via-transparent to-transparent" />
        {/* 전술 격자 배경 */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto px-8">

        {/* 앱 로고 영역 */}
        <div className="mb-8">
          <div className="text-4xl font-mono font-black text-green-400 mb-2 tracking-wider">
            ∞ OTHELLO
          </div>
          <div className="text-sm font-mono text-green-300/70 tracking-widest">
            INFINITY STRATEGY MATRIX
          </div>
        </div>

        {/* 매트릭스 로드 단계 */}
        {phase === 'MATRIX_LOAD' && (
          <div className="animate-[fade-in_0.5s_ease-out]">
            <div className="text-xl font-mono font-light text-green-400 mb-6">
              LOADING COMBAT MATRIX
            </div>

            {/* 전술 보드 홀로그램 */}
            <div className="relative w-72 h-72 mx-auto mb-6">
              {/* 홀로그램 보드 */}
              <div className="absolute inset-0 border border-green-400/50 bg-black/60 backdrop-blur-sm">
                {/* 8x8 격자 */}
                <div className="grid grid-cols-8 gap-0 w-full h-full p-2">
                  {Array.from({ length: 64 }).map((_, i) => {
                    const row = Math.floor(i / 8);
                    const col = i % 8;
                    const isCenter = (row === 3 || row === 4) && (col === 3 || col === 4);
                    const isWhite = isCenter && ((row === 3 && col === 3) || (row === 4 && col === 4));
                    const isBlack = isCenter && ((row === 3 && col === 4) || (row === 4 && col === 3));

                    return (
                      <div
                        key={i}
                        className="border border-green-400/20 bg-green-900/10 relative"
                        style={{
                          animation: `cell-materialize 0.6s ease-out ${i * 0.01}s both`
                        }}
                      >
                        {/* 초기 디스크 */}
                        {matrixActive && (isWhite || isBlack) && (
                          <div
                            className={`absolute inset-1 rounded-full ${
                              isWhite
                                ? 'bg-gradient-to-br from-white to-gray-300'
                                : 'bg-gradient-to-br from-gray-800 to-black'
                            }`}
                            style={{
                              animation: `disc-spawn 0.8s ease-out ${0.5 + (isWhite ? 0 : 0.2)}s both`
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 홀로그램 스캔라인 */}
                <div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/30 to-transparent h-1"
                  style={{ animation: 'scan-line 2s infinite ease-in-out' }}
                />
              </div>

              {/* 홀로그램 노이즈 */}
              <div
                className="absolute inset-0 bg-green-400/5 mix-blend-screen"
                style={{ animation: 'hologram-flicker 0.1s infinite' }}
              />
            </div>

            {/* 로딩 상태 표시 */}
            <div className="text-green-300 font-mono text-sm">
              MATRIX SYNCHRONIZATION IN PROGRESS...
            </div>
          </div>
        )}
      </div>

      {/* CSS 애니메이션 스타일 */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes cell-materialize {
          from {
            opacity: 0;
            transform: scale(0.8) rotateY(45deg);
            background-color: transparent;
          }
          to {
            opacity: 1;
            transform: scale(1) rotateY(0deg);
            background-color: rgba(34, 197, 94, 0.1);
          }
        }

        @keyframes disc-spawn {
          from {
            opacity: 0;
            transform: scale(0) rotateY(180deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotateY(90deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotateY(0deg);
          }
        }

        @keyframes scan-line {
          0%, 100% {
            top: -2px;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            top: 50%;
            opacity: 0.8;
          }
          90% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }

        @keyframes hologram-flicker {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}