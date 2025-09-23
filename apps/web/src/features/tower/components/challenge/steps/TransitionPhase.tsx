import React, { useEffect, useState } from 'react';
import { haptic } from '../../../../../ui/feedback/HapticFeedback';

interface TransitionPhaseProps {
  floor: number;
  onComplete: () => void;
  onSkip?: () => void;
}

/**
 * 전술 보드 물질화 시퀀스 - 하이테크 홀로그램 스타일
 * 
 * 전투 시스템에서 전술 격자로의 매끄러운 전환
 */
export function TransitionPhase({ floor, onComplete, onSkip }: TransitionPhaseProps) {
  const [phase, setPhase] = useState<'INIT' | 'GRID_DEPLOY' | 'MATRIX_LOAD' | 'COMBAT_READY'>('INIT');
  const [gridProgress, setGridProgress] = useState(0);
  const [matrixActive, setMatrixActive] = useState(false);
  const [tacticalGrid, setTacticalGrid] = useState(false);
  const [combatReady, setCombatReady] = useState(false);

  useEffect(() => {
    const sequence = [
      { delay: 0, action: () => {
        setPhase('INIT');
        haptic.buttonTap();
      }},
      { delay: 500, action: () => {
        setPhase('GRID_DEPLOY');
        // 그리드 진행도 애니메이션 (더 천천히)
        const gridTimer = setInterval(() => {
          setGridProgress(prev => {
            if (prev >= 100) {
              clearInterval(gridTimer);
              return 100;
            }
            return prev + 3; // 더 천천히 진행
          });
        }, 80); // 더 부드러운 애니메이션
      }},
      { delay: 2000, action: () => { // 더 늦게 시작
        setPhase('MATRIX_LOAD');
        setMatrixActive(true);
        setTacticalGrid(true);
        haptic.bossEncounter();
        if (navigator.vibrate) {
          navigator.vibrate([300, 100, 300]);
        }
      }},
      { delay: 3000, action: () => { // 더 늦게 시작
        setPhase('COMBAT_READY');
        setCombatReady(true);
        haptic.gameWin();
      }},
      { delay: 4000, action: onComplete } // 전환 시간 증가
    ];

    const timers = sequence.map(({ delay, action }) =>
      setTimeout(action, delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // 터치/클릭으로 스킵
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  return (
    <div 
      className="relative w-full h-full flex flex-col items-center justify-center cursor-pointer"
      onClick={handleSkip}
      onTouchStart={handleSkip}
    >
      {/* 전술 배경 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-green-900/10 via-transparent to-transparent" />
        {/* 전술 격자 배경 */}
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 ${
            tacticalGrid ? 'opacity-30' : 'opacity-10'
          }`}
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,0,0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,0,0.2) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto px-8">
        
        {/* 초기화 단계 */}
        {phase === 'INIT' && (
          <div className="animate-[fade-in_0.5s_ease-out]">
            <div className="text-2xl font-mono font-light text-green-400 mb-4">
              TACTICAL GRID INITIALIZATION
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-green-400 to-transparent mb-6" />
            <div className="text-green-300 font-mono text-sm">
              PREPARING COMBAT MATRIX
            </div>
          </div>
        )}

        {/* 그리드 전개 단계 */}
        {phase === 'GRID_DEPLOY' && (
          <div className="animate-[fade-in_0.5s_ease-out]">
            <div className="text-2xl font-mono font-light text-green-400 mb-6">
              DEPLOYING TACTICAL GRID
            </div>
            
            {/* 진행률 표시 */}
            <div className="mb-8">
              <div className="flex justify-between text-xs font-mono text-green-300 mb-2">
                <span>GRID DEPLOYMENT</span>
                <span>{Math.floor(gridProgress)}%</span>
              </div>
              <div className="h-2 bg-green-900/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-cyan-400 transition-all duration-300"
                  style={{ width: `${gridProgress}%` }}
                />
              </div>
            </div>

            {/* 그리드 프리뷰 */}
            <div className="relative w-64 h-64 mx-auto border border-green-400/30 bg-black/40">
              {/* 격자 생성 애니메이션 */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={`h-${i}`}>
                  <div 
                    className="absolute left-0 right-0 h-px bg-green-400/50"
                    style={{ 
                      top: `${(i + 1) * 12.5}%`,
                      animation: `grid-line 0.8s ease-out ${i * 0.1}s both`
                    }}
                  />
                  <div 
                    className="absolute top-0 bottom-0 w-px bg-green-400/50"
                    style={{ 
                      left: `${(i + 1) * 12.5}%`,
                      animation: `grid-line 0.8s ease-out ${i * 0.1 + 0.4}s both`
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 매트릭스 로드 단계 */}
        {phase === 'MATRIX_LOAD' && (
          <div className="animate-[fade-in_0.5s_ease-out]">
            <div className="text-2xl font-mono font-light text-green-400 mb-6">
              LOADING COMBAT MATRIX
            </div>
            
            {/* 전술 보드 홀로그램 */}
            <div className="relative w-80 h-80 mx-auto">
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
          </div>
        )}

        {/* 전투 준비 완료 */}
        {phase === 'COMBAT_READY' && (
          <div className="animate-[fade-in_0.5s_ease-out]">
            <div className="text-3xl font-mono font-black text-green-400 mb-4 animate-pulse">
              COMBAT MATRIX ONLINE
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-green-400 to-transparent mb-6" />
            
            <div className="text-green-300 font-mono text-lg mb-6">
              TACTICAL GRID FULLY OPERATIONAL
            </div>
            
            {/* 시스템 상태 */}
            <div className="grid grid-cols-3 gap-4 text-xs font-mono">
              <div className="text-green-400">
                <div className="text-white/60 mb-1">MATRIX</div>
                <div>ACTIVE</div>
              </div>
              <div className="text-green-400">
                <div className="text-white/60 mb-1">GRID</div>
                <div>DEPLOYED</div>
              </div>
              <div className="text-green-400">
                <div className="text-white/60 mb-1">STATUS</div>
                <div>READY</div>
              </div>
            </div>
            
            {/* 전환 완료 표시 */}
            <div className="mt-6 text-cyan-300 font-mono text-sm">
              INITIATING COMBAT SEQUENCE...
            </div>
          </div>
        )}

        {/* 전술 데이터 스트림 */}
        <div className="absolute top-1/3 -left-8 transform -translate-y-1/2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-px h-4 bg-green-400/40 mb-1"
              style={{
                animation: `data-stream 2s infinite ease-in-out ${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        <div className="absolute top-1/3 -right-8 transform -translate-y-1/2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-px h-4 bg-green-400/40 mb-1"
              style={{
                animation: `data-stream 2s infinite ease-in-out ${i * 0.1 + 0.5}s`,
              }}
            />
          ))}
        </div>

        {/* 스킵 안내 제거됨 - 오른쪽 상단에 이미 있음 */}
      </div>
    </div>
  );
}