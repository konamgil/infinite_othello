import React from 'react';
import { Crown } from 'lucide-react';

interface HologramTowerProps {
  currentFloor: number;
  maxFloor: number;
  className?: string;
}

export function HologramTower({ currentFloor, maxFloor, className = '' }: HologramTowerProps) {
  return (
    <div className={`relative ${className}`}>
      {/* 탑 주변 에너지 필드 */}
      <div className="tower-energy-field" />

      <div className="hologram-tower">
        {/* 기단부 (베이스) */}
        <div className="tower-base">
          <div className="base-platform" />
          <div className="base-glow" />
        </div>

        {/* 탑의 층들 - 더 세밀하게 */}
        {[...Array(9)].map((_, index) => {
          const level = 9 - index; // 9층부터 1층까지
          const progress = (currentFloor / maxFloor) * 100;
          const levelThreshold = ((level - 1) / 8) * 100; // 8단계로 나누기
          const nextThreshold = (level / 8) * 100;
          const levelProgress = Math.max(0, Math.min(100, ((progress - levelThreshold) / (nextThreshold - levelThreshold)) * 100));
          const isActive = progress >= levelThreshold;
          const isCurrentLevel = progress >= levelThreshold && progress < nextThreshold;

          return (
            <div key={level} className="tower-level-container">
              {/* 메인 층 블록 */}
              <div
                className={`tower-level level-${level} ${isActive ? 'active' : ''} ${isCurrentLevel ? 'current' : ''}`}
                style={{
                  '--level-progress': `${levelProgress}%`,
                  '--glow-intensity': isActive ? 1 : 0.15,
                  '--pulse-delay': `${index * 0.1}s`
                } as React.CSSProperties}
              >
                {/* 층 내부 디테일 */}
                <div className="level-interior" />
                <div className="level-edge-glow" />

                {/* 홀로그램 스캔라인 */}
                {isActive && <div className="scan-line" />}

                {/* 에너지 파티클 */}
                {isCurrentLevel && (
                  <>
                    <div className="energy-particle particle-1" />
                    <div className="energy-particle particle-2" />
                    <div className="energy-particle particle-3" />
                  </>
                )}
              </div>

              {/* 층간 연결부 */}
              {level > 1 && <div className="level-connector" />}
            </div>
          );
        })}

        {/* 탑 꼭대기 성소 */}
        <div className={`tower-sanctuary ${currentFloor >= maxFloor ? 'completed' : ''}`}>
          <div className="sanctuary-base" />
          <div className="sanctuary-crystal">
            <Crown size={14} className="text-yellow-400" />
          </div>
          <div className="sanctuary-beam" />
          {currentFloor >= maxFloor && (
            <>
              <div className="completion-burst" />
              <div className="victory-aura" />
            </>
          )}
        </div>

        {/* 홀로그램 프레임 */}
        <div className="holo-frame">
          <div className="frame-corner tl" />
          <div className="frame-corner tr" />
          <div className="frame-corner bl" />
          <div className="frame-corner br" />
        </div>
      </div>

      {/* 고급 진행도 표시 */}
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-center gap-2">
          <div className="progress-indicator">
            <div className="progress-current">{currentFloor}</div>
            <div className="progress-separator">/</div>
            <div className="progress-total">{maxFloor}</div>
          </div>
        </div>

        <div className="progress-bar-container">
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${(currentFloor / maxFloor) * 100}%` }}
            />
            <div className="progress-bar-glow" />
          </div>
          <div className="progress-percentage">
            {Math.round((currentFloor / maxFloor) * 100)}%
          </div>
        </div>

        <div className="achievement-status">
          {currentFloor >= maxFloor
            ? "🏆 무한의 탑 정복 완료"
            : `🔥 다음 구간까지 ${Math.ceil(((Math.ceil(currentFloor / 50) * 50) - currentFloor))}층`
          }
        </div>
      </div>

      <style jsx>{`
        /* === 프리미엄 홀로그램 타워 === */

        /* 에너지 필드 */
        .tower-energy-field {
          position: absolute;
          top: -20px;
          left: -20px;
          right: -20px;
          bottom: -20px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%);
          animation: energyFieldPulse 4s ease-in-out infinite;
          pointer-events: none;
        }

        .hologram-tower {
          position: relative;
          width: 80px;
          height: 140px;
          margin: 0 auto;
          filter: drop-shadow(0 0 15px rgba(6, 182, 212, 0.4));
        }

        /* 기단부 */
        .tower-base {
          position: absolute;
          bottom: 2px;
          left: 50%;
          width: 68px;
          height: 5px;
          transform: translateX(-50%);
        }

        .base-platform {
          width: 100%;
          height: 100%;
          background: linear-gradient(to right,
            transparent 0%,
            rgba(6, 182, 212, 0.3) 20%,
            rgba(6, 182, 212, 0.6) 50%,
            rgba(6, 182, 212, 0.3) 80%,
            transparent 100%
          );
          border: 1px solid rgba(6, 182, 212, 0.8);
          border-radius: 2px;
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.5);
        }

        .base-glow {
          position: absolute;
          inset: -2px;
          background: rgba(6, 182, 212, 0.2);
          border-radius: 4px;
          filter: blur(5px);
          animation: baseGlow 3s ease-in-out infinite;
        }

        /* 탑 층 컨테이너 */
        .tower-level-container {
          position: relative;
        }

        /* 메인 층 블록 */
        .tower-level {
          position: absolute;
          left: 50%;
          border: 1px solid rgba(6, 182, 212, 0.4);
          background: linear-gradient(135deg,
            transparent 0%,
            rgba(6, 182, 212, 0.05) 25%,
            rgba(6, 182, 212, calc(var(--level-progress, 0%) * 0.004)) 50%,
            rgba(6, 182, 212, calc(var(--level-progress, 0%) * 0.006)) 75%,
            transparent 100%
          );
          box-shadow:
            0 0 8px rgba(6, 182, 212, var(--glow-intensity, 0.2)),
            inset 0 0 15px rgba(6, 182, 212, calc(var(--glow-intensity, 0.2) * 0.4));
          animation: hologramFlicker 4s ease-in-out infinite;
          animation-delay: var(--pulse-delay, 0s);
          transition: all 0.3s ease;
          border-radius: 1px;
        }

        /* 각 층의 크기와 위치 (정교한 석가탑) */
        .level-1 { bottom: 3px; width: 64px; height: 12px; transform: translateX(-50%); }
        .level-2 { bottom: 15px; width: 58px; height: 12px; transform: translateX(-50%); }
        .level-3 { bottom: 27px; width: 52px; height: 12px; transform: translateX(-50%); }
        .level-4 { bottom: 39px; width: 46px; height: 11px; transform: translateX(-50%); }
        .level-5 { bottom: 50px; width: 40px; height: 11px; transform: translateX(-50%); }
        .level-6 { bottom: 61px; width: 34px; height: 10px; transform: translateX(-50%); }
        .level-7 { bottom: 71px; width: 28px; height: 10px; transform: translateX(-50%); }
        .level-8 { bottom: 81px; width: 22px; height: 9px; transform: translateX(-50%); }
        .level-9 { bottom: 90px; width: 16px; height: 9px; transform: translateX(-50%); }

        /* 활성화 상태 */
        .tower-level.active {
          border-color: rgba(6, 182, 212, 0.8);
          background: linear-gradient(135deg,
            rgba(6, 182, 212, 0.1) 0%,
            rgba(6, 182, 212, 0.3) 50%,
            rgba(168, 85, 247, 0.2) 100%
          );
          box-shadow:
            0 0 15px rgba(6, 182, 212, 0.6),
            inset 0 0 20px rgba(6, 182, 212, 0.3);
        }

        /* 현재 층 강조 */
        .tower-level.current {
          border-color: rgba(168, 85, 247, 0.9);
          animation: currentLevelPulse 2s ease-in-out infinite;
        }

        /* 층 내부 디테일 */
        .level-interior {
          position: absolute;
          top: 2px;
          left: 2px;
          right: 2px;
          bottom: 2px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(6, 182, 212, 0.1) var(--level-progress, 0%),
            transparent calc(var(--level-progress, 0%) + 5%)
          );
          border-radius: 1px;
        }

        .level-edge-glow {
          position: absolute;
          inset: -1px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(6, 182, 212, 0.3) 50%,
            transparent 100%
          );
          opacity: var(--glow-intensity, 0.2);
          border-radius: 2px;
          filter: blur(1px);
        }

        /* 홀로그램 스캔라인 */
        .scan-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 2px;
          height: 100%;
          background: linear-gradient(to bottom,
            transparent 0%,
            rgba(6, 182, 212, 0.8) 50%,
            transparent 100%
          );
          animation: scanAcross 3s linear infinite;
        }

        /* 에너지 파티클 */
        .energy-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(168, 85, 247, 0.8);
          border-radius: 50%;
          box-shadow: 0 0 4px rgba(168, 85, 247, 0.6);
        }

        .particle-1 {
          top: 25%;
          left: 20%;
          animation: particleFloat 2s ease-in-out infinite;
        }

        .particle-2 {
          top: 75%;
          right: 20%;
          animation: particleFloat 2.5s ease-in-out infinite reverse;
        }

        .particle-3 {
          top: 50%;
          left: 80%;
          animation: particleFloat 1.8s ease-in-out infinite;
          animation-delay: 0.5s;
        }

        /* 층간 연결부 */
        .level-connector {
          position: absolute;
          left: 50%;
          width: 1px;
          height: 3px;
          background: linear-gradient(to bottom,
            rgba(6, 182, 212, 0.6) 0%,
            rgba(6, 182, 212, 0.3) 100%
          );
          transform: translateX(-50%);
          bottom: -3px;
        }

        /* 탑 꼭대기 성소 */
        .tower-sanctuary {
          position: absolute;
          top: -8px;
          left: 50%;
          width: 20px;
          height: 20px;
          transform: translateX(-50%);
        }

        .sanctuary-base {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 16px;
          height: 6px;
          transform: translateX(-50%);
          background: linear-gradient(135deg,
            rgba(251, 191, 36, 0.2) 0%,
            rgba(251, 191, 36, 0.4) 100%
          );
          border: 1px solid rgba(251, 191, 36, 0.6);
          border-radius: 2px;
        }

        .sanctuary-crystal {
          position: absolute;
          top: 4px;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0.4;
          transition: all 0.5s ease;
        }

        .sanctuary-beam {
          position: absolute;
          top: -10px;
          left: 50%;
          width: 2px;
          height: 20px;
          transform: translateX(-50%);
          background: linear-gradient(to top,
            rgba(251, 191, 36, 0.6) 0%,
            transparent 100%
          );
          opacity: 0;
          transition: all 0.5s ease;
        }

        .tower-sanctuary.completed .sanctuary-crystal {
          opacity: 1;
          filter: drop-shadow(0 0 20px gold);
          animation: sanctuaryPulse 2s ease-in-out infinite;
        }

        .tower-sanctuary.completed .sanctuary-beam {
          opacity: 1;
          animation: beamPulse 3s ease-in-out infinite;
        }

        .completion-burst {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 60px;
          height: 60px;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle,
            rgba(251, 191, 36, 0.4) 0%,
            rgba(251, 191, 36, 0.1) 50%,
            transparent 100%
          );
          animation: completionBurst 4s ease-out infinite;
        }

        .victory-aura {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100px;
          height: 100px;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle,
            rgba(251, 191, 36, 0.1) 0%,
            transparent 70%
          );
          animation: victoryAura 6s ease-in-out infinite;
        }

        /* 홀로그램 프레임 */
        .holo-frame {
          position: absolute;
          inset: -5px;
          pointer-events: none;
        }

        .frame-corner {
          position: absolute;
          width: 8px;
          height: 8px;
          border: 1px solid rgba(6, 182, 212, 0.6);
          opacity: 0.8;
          animation: frameFlicker 4s ease-in-out infinite;
        }

        .frame-corner.tl {
          top: 0;
          left: 0;
          border-right: none;
          border-bottom: none;
          border-top-left-radius: 2px;
        }

        .frame-corner.tr {
          top: 0;
          right: 0;
          border-left: none;
          border-bottom: none;
          border-top-right-radius: 2px;
        }

        .frame-corner.bl {
          bottom: 0;
          left: 0;
          border-right: none;
          border-top: none;
          border-bottom-left-radius: 2px;
        }

        .frame-corner.br {
          bottom: 0;
          right: 0;
          border-left: none;
          border-top: none;
          border-bottom-right-radius: 2px;
        }

        /* 고급 진행도 표시 */
        .progress-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Courier New', monospace;
          font-weight: bold;
        }

        .progress-current {
          color: rgba(6, 182, 212, 1);
          font-size: 16px;
          text-shadow: 0 0 8px rgba(6, 182, 212, 0.5);
        }

        .progress-separator {
          color: rgba(255, 255, 255, 0.4);
          font-size: 12px;
        }

        .progress-total {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
        }

        .progress-bar-container {
          position: relative;
          width: 160px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .progress-bar-bg {
          position: relative;
          flex: 1;
          height: 6px;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.3);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg,
            rgba(6, 182, 212, 0.8) 0%,
            rgba(168, 85, 247, 0.8) 100%
          );
          border-radius: 2px;
          transition: width 0.5s ease;
          position: relative;
          overflow: hidden;
        }

        .progress-bar-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: -50px;
          width: 50px;
          height: 100%;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.4) 50%,
            transparent 100%
          );
          animation: progressShine 2s ease-in-out infinite;
        }

        .progress-bar-glow {
          position: absolute;
          inset: -2px;
          background: rgba(6, 182, 212, 0.2);
          border-radius: 5px;
          filter: blur(4px);
          animation: progressGlow 3s ease-in-out infinite;
        }

        .progress-percentage {
          color: rgba(6, 182, 212, 0.9);
          font-size: 12px;
          font-weight: bold;
          min-width: 30px;
          text-align: center;
        }

        .achievement-status {
          color: rgba(255, 255, 255, 0.7);
          font-size: 11px;
          font-weight: 500;
          text-align: center;
        }

        /* === 프리미엄 애니메이션 컬렉션 === */

        @keyframes energyFieldPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.05);
          }
        }

        @keyframes baseGlow {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes hologramFlicker {
          0%, 100% {
            opacity: 0.85;
            border-color: rgba(6, 182, 212, 0.6);
          }
          25% {
            opacity: 0.7;
            border-color: rgba(6, 182, 212, 0.4);
          }
          50% {
            opacity: 1;
            border-color: rgba(6, 182, 212, 0.9);
          }
          75% {
            opacity: 0.9;
            border-color: rgba(6, 182, 212, 0.7);
          }
        }

        @keyframes currentLevelPulse {
          0%, 100% {
            border-color: rgba(168, 85, 247, 0.9);
            box-shadow: 0 0 15px rgba(168, 85, 247, 0.6);
          }
          50% {
            border-color: rgba(168, 85, 247, 1);
            box-shadow: 0 0 25px rgba(168, 85, 247, 0.8);
          }
        }

        @keyframes scanAcross {
          0% {
            left: 0;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            left: calc(100% - 2px);
            opacity: 0;
          }
        }

        @keyframes particleFloat {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-3px);
            opacity: 1;
          }
        }

        @keyframes sanctuaryPulse {
          0%, 100% {
            transform: translateX(-50%) scale(1);
            filter: drop-shadow(0 0 20px gold);
          }
          50% {
            transform: translateX(-50%) scale(1.15);
            filter: drop-shadow(0 0 30px gold);
          }
        }

        @keyframes beamPulse {
          0%, 100% {
            opacity: 0.6;
            height: 20px;
          }
          50% {
            opacity: 1;
            height: 25px;
          }
        }

        @keyframes completionBurst {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }

        @keyframes victoryAura {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1) rotate(180deg);
            opacity: 0.6;
          }
        }

        @keyframes progressShine {
          0% {
            left: -50px;
          }
          100% {
            left: 100%;
          }
        }

        @keyframes progressGlow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes frameFlicker {
          0%, 100% {
            opacity: 0.8;
            border-color: rgba(6, 182, 212, 0.6);
          }
          25% {
            opacity: 0.4;
            border-color: rgba(6, 182, 212, 0.3);
          }
          50% {
            opacity: 1;
            border-color: rgba(6, 182, 212, 0.8);
          }
          75% {
            opacity: 0.6;
            border-color: rgba(6, 182, 212, 0.5);
          }
        }

        /* 반응형 조정 */
        @media (max-width: 480px) {
          .hologram-tower {
            width: 70px;
            height: 120px;
          }

          .progress-bar-container {
            width: 140px;
          }

          .progress-indicator {
            gap: 6px;
          }

          .progress-current {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}