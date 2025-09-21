import React from 'react';
import { Crown, Zap } from 'lucide-react';

interface MajesticHologramTowerProps {
  currentFloor: number;
  maxFloor: number;
  className?: string;
}

export function MajesticHologramTower({ currentFloor, maxFloor, className = '' }: MajesticHologramTowerProps) {
  const progress = Math.min(currentFloor / maxFloor, 1);
  const completionPercentage = Math.round(progress * 100);
  
  return (
    <div className={`relative ${className}`}>
      {/* 홀로그램 프레임 컨테이너 */}
      <div className="relative w-32 h-48 mx-auto">
        
        {/* 외부 에너지 필드 */}
        <div className="absolute -inset-6 bg-gradient-radial from-cyan-400/10 via-cyan-400/5 to-transparent rounded-full animate-pulse" />
        
        {/* 홀로그램 프레임 */}
        <div className="absolute inset-0 border border-cyan-400/40 rounded-lg">
          {/* 프레임 코너 장식 */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-cyan-400/60" />
          <div className="absolute -top-1 -right-1 w-3 h-3 border-r-2 border-t-2 border-cyan-400/60" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-l-2 border-b-2 border-cyan-400/60" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-cyan-400/60" />
        </div>

        {/* 메인 타워 구조 */}
        <div className="absolute inset-2 flex flex-col items-center justify-end">
          
          {/* 석탑 층들 (12층으로 단순화) */}
          {[...Array(12)].map((_, index) => {
            const level = 12 - index; // 12층부터 1층까지 (아래에서 위로)
            const progressThreshold = (level / 12) * 100; // 각 레벨의 진행률 임계점
            const currentProgress = (currentFloor / maxFloor) * 100;
            const isActive = currentProgress >= progressThreshold;
            const isCurrent = Math.floor(currentProgress / (100/12)) === level - 1;
            const isSpecial = level % 4 === 0; // 4층마다 특별층
            
            // 층별 크기 계산 (아래층이 더 큼)
            const width = 8 + level * 1.5; // 아래층이 더 큼
            const height = isSpecial ? 4 : 3;
            
            return (
              <div
                key={level}
                className={`mb-1 relative transition-all duration-500 rounded-sm border ${
                  isActive 
                    ? isSpecial
                      ? 'bg-cyan-400/80 border-cyan-300 shadow-lg shadow-cyan-400/50'
                      : isCurrent
                        ? 'bg-cyan-500/90 border-cyan-400 shadow-lg shadow-cyan-400/60 animate-pulse'
                        : 'bg-cyan-400/60 border-cyan-400/80 shadow-md shadow-cyan-400/30'
                    : 'bg-cyan-900/30 border-cyan-900/50'
                }`}
                style={{ 
                  width: `${width}px`, 
                  height: `${height}px`,
                }}
              >
                {/* 현재 층 파티클 */}
                {isCurrent && (
                  <>
                    <div className="absolute -top-0.5 left-1/4 w-0.5 h-0.5 bg-white rounded-full animate-ping" />
                    <div className="absolute -top-0.5 right-1/4 w-0.5 h-0.5 bg-cyan-200 rounded-full animate-ping delay-300" />
                  </>
                )}
                
                {/* 특별층 효과 */}
                {isSpecial && isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent animate-pulse" />
                )}
              </div>
            );
          })}

          {/* 기단부 - 가장 아래 */}
          <div className="w-28 h-2 bg-gradient-to-r from-cyan-400/30 via-cyan-400/60 to-cyan-400/30 border border-cyan-400/70 rounded-sm shadow-lg shadow-cyan-400/30 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent animate-pulse rounded-sm" />
          </div>
        </div>

        {/* 탑 꼭대기 성소 */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2">
          {currentFloor >= maxFloor ? (
            /* 완성된 성소 */
            <div className="relative">
              <div className="w-6 h-6 bg-gradient-to-br from-yellow-400/80 via-yellow-300/90 to-orange-400/80 rounded border border-yellow-400/90 shadow-lg shadow-yellow-400/60 animate-pulse">
                <Crown size={14} className="text-white m-auto mt-1" />
              </div>
              {/* 승리 광선 */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-t from-yellow-400/80 to-transparent animate-pulse" />
              {/* 승리 오라 */}
              <div className="absolute -inset-2 bg-gradient-radial from-yellow-400/20 to-transparent rounded-full animate-ping" />
            </div>
          ) : (
            /* 미완성 성소 */
            <div className="w-4 h-4 bg-gradient-to-br from-gray-400/40 to-gray-600/40 rounded border border-gray-500/50">
              <div className="w-1 h-1 bg-gray-300/60 rounded-full mx-auto mt-1.5" />
            </div>
          )}
        </div>

        {/* 홀로그램 스캔라인 */}
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent animate-pulse" 
               style={{ animationDelay: '0s', animationDuration: '3s' }} />
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-pulse" 
               style={{ animationDelay: '1.5s', animationDuration: '3s' }} />
        </div>

        {/* 측면 에너지 빔 */}
        <div className="absolute top-4 -left-2 w-0.5 h-8 bg-gradient-to-b from-cyan-400/50 to-transparent animate-pulse" 
             style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-4 -right-2 w-0.5 h-8 bg-gradient-to-b from-cyan-400/50 to-transparent animate-pulse" 
             style={{ animationDelay: '2s' }} />
        
        {/* 홀로그램 데이터 스트림 */}
        <div className="absolute top-2 right-0 text-[8px] text-cyan-400/60 font-mono leading-tight">
          <div className="animate-pulse">{'>'}</div>
          <div className="animate-pulse delay-200">{'>'}</div>
          <div className="animate-pulse delay-400">{'>'}</div>
        </div>
        <div className="absolute bottom-8 left-0 text-[8px] text-cyan-400/60 font-mono leading-tight">
          <div className="animate-pulse delay-100">{'<'}</div>
          <div className="animate-pulse delay-300">{'<'}</div>
          <div className="animate-pulse delay-500">{'<'}</div>
        </div>
      </div>

      {/* 하단 진행도 및 상태 정보 */}
      <div className="mt-4 text-center space-y-2">
        {/* 진행도 표시 */}
        <div className="flex items-center justify-center gap-2">
          <div className="text-cyan-400 text-lg font-bold font-mono tracking-wider">
            {currentFloor.toString().padStart(3, '0')}
          </div>
          <div className="text-cyan-300/60 text-sm">/</div>
          <div className="text-cyan-300/80 text-sm font-mono">
            {maxFloor.toString().padStart(3, '0')}
          </div>
        </div>

        {/* 진행 바 */}
        <div className="w-40 h-1 bg-cyan-900/30 rounded-full mx-auto overflow-hidden border border-cyan-400/20">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 transition-all duration-1000 relative"
            style={{ width: `${completionPercentage}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          </div>
        </div>

        {/* 완료율 및 상태 */}
        <div className="text-cyan-300/80 text-xs font-mono">
          {currentFloor >= maxFloor ? (
            <div className="flex items-center justify-center gap-1 text-yellow-400 animate-pulse">
              <Crown size={12} />
              <span>TOWER CONQUERED</span>
              <Crown size={12} />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1">
              <Zap size={10} className="text-cyan-400" />
              <span>{completionPercentage}% COMPLETE</span>
              <span className="text-cyan-400/60">• NEXT: FLOOR {currentFloor + 1}</span>
            </div>
          )}
        </div>

        {/* 홀로그램 식별 코드 */}
        <div className="text-cyan-400/40 text-[10px] font-mono tracking-widest">
          HOLO-ID: TWR-{currentFloor.toString().padStart(3, '0')} | MAX-{maxFloor}
        </div>
      </div>
    </div>
  );
}
