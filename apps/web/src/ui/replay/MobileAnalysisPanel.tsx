import React, { useState, useRef, useEffect } from 'react';
import { GameMove } from '../../types/replay';
import {
  Brain,
  TrendingUp,
  Target,
  Zap,
  Activity,
  ChevronUp,
  ChevronDown,
  Minimize2,
  Maximize2,
  GripVertical,
  X,
  Eye
} from 'lucide-react';

interface MobileAnalysisPanelProps {
  currentMove?: GameMove;
  currentMoveIndex: number;
  totalMoves: number;
  isVisible: boolean;
  onToggle: () => void;
  onMinimapToggle?: () => void;
  showMinimap?: boolean;
}

type PanelHeight = 'minimal' | 'half' | 'full';
type AnalysisTab = 'move' | 'position' | 'simulation' | 'stats';

export function MobileAnalysisPanel({
  currentMove,
  currentMoveIndex,
  totalMoves,
  isVisible,
  onToggle,
  onMinimapToggle,
  showMinimap = false
}: MobileAnalysisPanelProps) {
  const [panelHeight, setPanelHeight] = useState<PanelHeight>('half'); // 기본값을 half로 유지 (이제 더 넓어짐)
  const [activeTab, setActiveTab] = useState<AnalysisTab>('move');
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0); // 드래그 진행도 (0-1)
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const lastDragTime = useRef(0);

  // Panel height configurations (모바일 전용) - 향후 많은 내용을 고려하여 높이 증가
  const heightConfig = {
    minimal: 'h-20', // 탭 헤더만 (16px에서 20px로 증가)
    half: 'h-[50vh]', // 화면의 50% (기존 40%에서 50%로 증가)
    full: 'h-[80vh]'  // 화면의 80% (기존 70%에서 80%로 증가, 보드는 20%만 표시)
  };

  const getMoveQuality = (move?: GameMove) => {
    if (!move || move.evaluationScore === undefined) return null;

    if (move.isOptimal) {
      return { label: '최적수', color: 'text-green-400', bgColor: 'bg-green-400/20' };
    } else if (move.evaluationScore > 10) {
      return { label: '좋은 수', color: 'text-blue-400', bgColor: 'bg-blue-400/20' };
    } else if (move.evaluationScore < -20) {
      return { label: '실수', color: 'text-red-400', bgColor: 'bg-red-400/20' };
    } else if (move.evaluationScore < -10) {
      return { label: '부정확', color: 'text-yellow-400', bgColor: 'bg-yellow-400/20' };
    }
    return { label: '평균', color: 'text-white/70', bgColor: 'bg-white/10' };
  };

  // 터치 드래그로 높이 조절 (개선된 버전)
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    
    // 현재 높이를 픽셀로 변환해서 저장
    const currentHeight = panelRef.current?.offsetHeight || 0;
    startHeight.current = currentHeight;
    lastDragTime.current = Date.now();
    
    // 햅틱 피드백 (지원되는 경우)
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const currentY = e.touches[0].clientY;
    const deltaY = startY.current - currentY; // 위로 드래그하면 양수
    const screenHeight = window.innerHeight;
    
    // 드래그 진행도 계산 (0-1)
    const maxDragDistance = screenHeight * 0.4; // 최대 드래그 거리
    const progress = Math.max(0, Math.min(1, Math.abs(deltaY) / maxDragDistance));
    setDragProgress(progress);
    
    // 실시간 높이 계산
    const newHeight = startHeight.current + deltaY;
    const clampedHeight = Math.max(screenHeight * 0.1, Math.min(screenHeight * 0.8, newHeight));
    
    // 높이에 따라 패널 상태 결정 (임계값 조정) - 새로운 높이 설정에 맞게 조정
    const minimalThreshold = screenHeight * 0.25; // 20%에서 25%로 증가
    const halfThreshold = screenHeight * 0.65; // 50%에서 65%로 증가
    
    if (clampedHeight < minimalThreshold) {
      setPanelHeight('minimal');
    } else if (clampedHeight < halfThreshold) {
      setPanelHeight('half');
    } else {
      setPanelHeight('full');
    }
    
    // 드래그 중 햅틱 피드백 (제한적으로)
    const now = Date.now();
    if (now - lastDragTime.current > 100) { // 100ms마다 최대
      if (navigator.vibrate && progress > 0.5) {
        navigator.vibrate(5);
      }
      lastDragTime.current = now;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    setDragProgress(0);
    
    // 최종 햅틱 피드백
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  // 마우스 드래그 지원 (데스크톱)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startY.current = e.clientY;
    
    const currentHeight = panelRef.current?.offsetHeight || 0;
    startHeight.current = currentHeight;
    lastDragTime.current = Date.now();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const currentY = e.clientY;
    const deltaY = startY.current - currentY;
    const screenHeight = window.innerHeight;
    
    const maxDragDistance = screenHeight * 0.4;
    const progress = Math.max(0, Math.min(1, Math.abs(deltaY) / maxDragDistance));
    setDragProgress(progress);
    
    const newHeight = startHeight.current + deltaY;
    const clampedHeight = Math.max(screenHeight * 0.1, Math.min(screenHeight * 0.8, newHeight));
    
    const minimalThreshold = screenHeight * 0.25; // 20%에서 25%로 증가
    const halfThreshold = screenHeight * 0.65; // 50%에서 65%로 증가
    
    if (clampedHeight < minimalThreshold) {
      setPanelHeight('minimal');
    } else if (clampedHeight < halfThreshold) {
      setPanelHeight('half');
    } else {
      setPanelHeight('full');
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    setDragProgress(0);
  };

  // 전역 마우스 이벤트 리스너
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const tabs = [
    { id: 'move' as const, label: '수 분석', icon: Brain },
    { id: 'position' as const, label: '포지션', icon: Target },
    { id: 'simulation' as const, label: '시뮬레이션', icon: Activity },
    { id: 'stats' as const, label: '통계', icon: TrendingUp }
  ];

  if (!isVisible) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onToggle}
      />

      {/* 슬라이딩 패널 */}
      <div
        ref={panelRef}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md
                   border-t border-white/20 rounded-t-3xl transition-all duration-300
                   ${heightConfig[panelHeight]} ${isDragging ? 'transition-none' : ''}`}
        style={{
          transform: isDragging ? `scale(${1 + dragProgress * 0.02})` : 'scale(1)',
          boxShadow: isDragging 
            ? `0 -10px 40px rgba(147, 51, 234, ${0.3 + dragProgress * 0.2}), 
               0 0 0 1px rgba(147, 51, 234, ${0.3 + dragProgress * 0.3})` 
            : '0 -10px 40px rgba(0, 0, 0, 0.3)',
          borderColor: isDragging ? `rgba(147, 51, 234, ${0.5 + dragProgress * 0.3})` : 'rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* 드래그 핸들 (개선된 버전) */}
        <div
          className={`w-full h-8 flex items-center justify-center cursor-grab active:cursor-grabbing
                     ${isDragging ? 'bg-purple-500/10' : 'hover:bg-white/5'} transition-all duration-200`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="flex flex-col items-center gap-1">
            <GripVertical 
              size={16} 
              className={`text-white/50 transition-colors duration-200 ${
                isDragging ? 'text-purple-400' : 'group-hover:text-white/70'
              }`} 
            />
            <div className={`w-12 h-1 rounded-full transition-all duration-200 ${
              isDragging 
                ? 'bg-purple-400 w-16' 
                : 'bg-white/30 hover:bg-white/50'
            }`} />
            {isDragging && (
              <div className="text-xs text-purple-300 font-display mt-1 animate-pulse">
                드래그 중...
              </div>
            )}
          </div>
        </div>

        {/* 헤더 & 탭 */}
        <div className="px-4 py-2 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Brain size={20} className="text-purple-400" />
              AI 분석
            </h3>
            <div className="flex items-center gap-2">
              {onMinimapToggle && (
                <button
                  onClick={() => {
                    onMinimapToggle();
                    if (navigator.vibrate) {
                      navigator.vibrate(10);
                    }
                  }}
                  className={`p-2 rounded-lg transition-all hover:scale-105 active:scale-95
                             ${showMinimap 
                               ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' 
                               : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                  title={showMinimap ? '미니맵 숨기기' : '미니맵 보기'}
                >
                  <Eye size={16} />
                </button>
              )}
              <button
                onClick={() => {
                  const nextHeight = panelHeight === 'full' ? 'half' : 
                                   panelHeight === 'half' ? 'minimal' : 'full';
                  setPanelHeight(nextHeight);
                  
                  // 햅틱 피드백
                  if (navigator.vibrate) {
                    navigator.vibrate(15);
                  }
                }}
                className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-all
                           hover:scale-105 active:scale-95"
                title={`${panelHeight === 'full' ? '축소 (80%)' : panelHeight === 'half' ? '최소화 (50%)' : '확대 (20%)'}`}
              >
                {panelHeight === 'full' ? <Minimize2 size={16} /> : 
                 panelHeight === 'half' ? <ChevronDown size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => {
                  onToggle();
                  if (navigator.vibrate) {
                    navigator.vibrate(25);
                  }
                }}
                className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all
                           hover:scale-105 active:scale-95"
                title="패널 닫기"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  // 햅틱 피드백
                  if (navigator.vibrate) {
                    navigator.vibrate(10);
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-lg transition-all
                           hover:scale-105 active:scale-95 ${
                  activeTab === id
                    ? 'bg-purple-500/30 text-purple-300 shadow-lg shadow-purple-500/20'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/10'
                }`}
              >
                <Icon size={14} />
                <span className="text-xs font-display">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'move' && (
            <div className="space-y-4">
              {currentMove ? (
                <>
                  {/* 수 품질 */}
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/10">
                    <h4 className="text-sm font-medium text-white/80 mb-3 font-display">수 품질</h4>
                    {(() => {
                      const quality = getMoveQuality(currentMove);
                      if (!quality) return <div className="text-white/60 text-sm">분석 없음</div>;

                      return (
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${quality.bgColor}`} />
                          <div>
                            <div className={`font-semibold ${quality.color} font-display`}>
                              {quality.label}
                            </div>
                            <div className="text-xs text-white/60">
                              평가: {currentMove.evaluationScore && currentMove.evaluationScore > 0 ? '+' : ''}{currentMove.evaluationScore || 0}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 수 정보 */}
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/10">
                    <h4 className="text-sm font-medium text-white/80 mb-3 font-display">수 정보</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-white/60">위치</span>
                        <div className="text-white/90 font-semibold">
                          {String.fromCharCode(65 + currentMove.x)}{currentMove.y + 1}
                        </div>
                      </div>
                      <div>
                        <span className="text-white/60">플레이어</span>
                        <div className="text-white/90 font-semibold">
                          {currentMove.player === 'black' ? '⚫ 흑돌' : '⚪ 백돌'}
                        </div>
                      </div>
                      <div>
                        <span className="text-white/60">뒤집힌 돌</span>
                        <div className="text-white/90 font-semibold">
                          {currentMove.flippedDiscs.length}개
                        </div>
                      </div>
                      <div>
                        <span className="text-white/60">수 번호</span>
                        <div className="text-white/90 font-semibold">
                          {currentMove.moveNumber}수
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 대안 수 */}
                  {currentMove.alternativeMoves && currentMove.alternativeMoves.length > 0 && (
                    <div className="p-4 rounded-2xl bg-black/30 border border-white/10">
                      <h4 className="text-sm font-medium text-white/80 mb-3 font-display">더 나은 수</h4>
                      <div className="space-y-2">
                        {currentMove.alternativeMoves.slice(0, 3).map((alt, index) => (
                          <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                            <span className="text-white/80 font-display">
                              {String.fromCharCode(65 + alt.x)}{alt.y + 1}
                            </span>
                            <span className={`text-sm font-semibold ${
                              alt.score > 0 ? 'text-green-400' :
                              alt.score < 0 ? 'text-red-400' : 'text-white/70'
                            }`}>
                              {alt.score > 0 ? '+' : ''}{alt.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Brain size={32} className="text-white/40 mx-auto mb-2" />
                  <p className="text-white/60 font-display">수를 선택하면 분석을 볼 수 있습니다</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'position' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10">
                <h4 className="text-sm font-medium text-white/80 mb-3 font-display">포지션 평가</h4>
                <div className="text-center py-4">
                  <div className="text-2xl font-bold text-purple-400 mb-1">+0.8</div>
                  <div className="text-xs text-white/60">흑돌 유리</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/30 border border-white/10">
                <h4 className="text-sm font-medium text-white/80 mb-3 font-display">모빌리티</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-white/60">흑돌 이동성</span>
                    <div className="text-white/90 font-semibold">8칸</div>
                  </div>
                  <div>
                    <span className="text-white/60">백돌 이동성</span>
                    <div className="text-white/90 font-semibold">6칸</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'simulation' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10">
                <h4 className="text-sm font-medium text-white/80 mb-3 font-display">What-If 시뮬레이션</h4>
                <p className="text-white/60 text-sm mb-3">
                  보드에서 원하는 위치를 탭해서 "만약 여기에 뒀다면?" 시뮬레이션을 실행하세요.
                </p>
                <button className="w-full py-3 bg-purple-500/20 border border-purple-400/30 text-purple-300 rounded-xl
                               hover:bg-purple-500/30 transition-all font-display">
                  시뮬레이션 모드 활성화
                </button>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10">
                <h4 className="text-sm font-medium text-white/80 mb-3 font-display">게임 통계</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-white/60">총 수</span>
                    <div className="text-white/90 font-semibold">{totalMoves}</div>
                  </div>
                  <div>
                    <span className="text-white/60">현재 수</span>
                    <div className="text-white/90 font-semibold">{currentMoveIndex + 1}</div>
                  </div>
                  <div>
                    <span className="text-white/60">정확도</span>
                    <div className="text-green-400 font-semibold">87%</div>
                  </div>
                  <div>
                    <span className="text-white/60">블런더</span>
                    <div className="text-red-400 font-semibold">2개</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}