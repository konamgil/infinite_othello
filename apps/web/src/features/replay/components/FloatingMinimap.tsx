import React, { useState, useRef, useEffect } from 'react';
import { GameMove } from '../../../types/replay';
import { OthelloEngine } from '../../../utils/othelloEngine';
import { 
  Move, 
  GripVertical, 
  RotateCcw,
  Settings,
  X
} from 'lucide-react';

/**
 * @interface FloatingMinimapProps
 * `FloatingMinimap` 컴포넌트의 props를 정의합니다.
 */
interface FloatingMinimapProps {
  /** @property {any} gameReplay - 전체 게임 리플레이 데이터. */
  gameReplay: any;
  /** @property {number} currentMoveIndex - 현재 리플레이의 수 인덱스. */
  currentMoveIndex: number;
  /** @property {(moveIndex: number) => void} [onMoveSelect] - 사용자가 미니맵에서 특정 수를 선택했을 때 호출될 콜백. */
  onMoveSelect?: (moveIndex: number) => void;
  /** @property {string} [className] - 컴포넌트의 최상위 요소에 적용할 추가 CSS 클래스. */
  className?: string;
}

/** @typedef {-1 | 1} Player - 플레이어 타입. */
type Player = -1 | 1;
/** @typedef {-1 | 0 | 1} Disc - 돌의 상태 타입. */
type Disc = -1 | 0 | 1;
/** @typedef {Disc[][]} Board - 8x8 보드 상태 타입. */
type Board = Disc[][];
/** @typedef {{x: number, y: number}} Position - 좌표 타입. */
type Position = { x: number; y: number };

/**
 * 화면 위에 떠 다니며 드래그 가능한 미니맵 컴포넌트입니다.
 * 현재 게임 보드 상태를 간략하게 보여주며, 특정 수를 클릭하여 해당 시점으로 이동할 수 있습니다.
 * @param {FloatingMinimapProps} props - 컴포넌트 props.
 * @returns {JSX.Element | null} 미니맵 UI 또는 null.
 */
export function FloatingMinimap({ 
  gameReplay, 
  currentMoveIndex, 
  onMoveSelect,
  className = '' 
}: FloatingMinimapProps) {
  // --- State and Refs ---
  /** @state {boolean} isDragging - 미니맵을 드래그 중인지 여부. */
  const [isDragging, setIsDragging] = useState(false);
  /** @state {boolean} isVisible - 미니맵 전체의 표시 여부. */
  const [isVisible, setIsVisible] = useState(true);
  /** @state {{x: number, y: number}} position - 미니맵의 화면상 위치 (top, left). */
  const [position, setPosition] = useState({ x: 20, y: 100 });
  /** @state {{x: number, y: number}} dragOffset - 드래그 시작 시 마우스 포인터와 미니맵 좌상단 간의 오프셋. */
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  /** @state {boolean} showSettings - 설정 패널 표시 여부. */
  const [showSettings, setShowSettings] = useState(false);
  /** @state {number} opacity - 미니맵의 불투명도. */
  const [opacity, setOpacity] = useState(0.9);
  /** @state {number} scale - 미니맵의 크기 배율. */
  const [scale, setScale] = useState(1);
  
  /** @ref {HTMLDivElement} minimapRef - 미니맵 DOM 요소에 대한 참조. */
  const minimapRef = useRef<HTMLDivElement>(null);

  /**
   * `gameReplay` prop으로부터 보드 상태들을 재구성합니다.
   * 이 컴포넌트가 독립적으로 보드 상태를 가질 수 있도록 memoization합니다.
   */
  const { boardStates, moves } = React.useMemo(() => {
    const legacyMoves = gameReplay.moves.map((move: any) => ({
      position: { x: move.x, y: move.y },
      player: move.player === 'black' ? 1 : -1
    }));

    const engine = new OthelloEngine();
    let states: Board[] = [];
    try {
      const s = (engine.reconstructGameFromMoves(legacyMoves) || []) as Board[];
      states = Array.isArray(s) && s.length ? s : [];
    } catch {
      states = [];
    }

    return { boardStates: states, moves: legacyMoves };
  }, [gameReplay]);

  // 현재 수에 해당하는 보드 상태를 계산합니다.
  const hasInitialState = boardStates.length === moves.length + 1;
  const boardIdx = Math.min(
    Math.max(hasInitialState ? currentMoveIndex + 1 : currentMoveIndex, 0),
    Math.max(boardStates.length - 1, 0)
  );
  const currentBoard = boardStates[boardIdx] || Array.from({ length: 8 }, () => Array(8).fill(0) as Disc[]);
  const currentMove = moves[currentMoveIndex];

  // --- Drag Handlers ---

  /**
   * 드래그 시작 이벤트를 처리합니다 (마우스 및 터치).
   * @param {React.MouseEvent | React.TouchEvent} e - 이벤트 객체.
   */
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragOffset({ x: clientX - position.x, y: clientY - position.y });
    
    if (navigator.vibrate) navigator.vibrate(10);
  };

  /**
   * 드래그 중 이동 이벤트를 처리합니다.
   * 화면 경계 내에서 미니맵 위치를 업데이트합니다.
   * @param {MouseEvent | TouchEvent} e - 이벤트 객체.
   */
  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const newX = clientX - dragOffset.x;
    const newY = clientY - dragOffset.y;
    
    // 화면 경계를 벗어나지 않도록 위치를 제한합니다.
    const maxX = window.innerWidth - (minimapRef.current?.offsetWidth || 200);
    const maxY = window.innerHeight - (minimapRef.current?.offsetHeight || 200);
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  /** 드래그 종료 이벤트를 처리합니다. */
  const handleDragEnd = () => {
    setIsDragging(false);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  /**
   * 드래그 상태일 때 전역 이벤트 리스너를 설정하여
   * 미니맵 외부에서도 드래그가 가능하도록 합니다.
   */
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove);
      document.addEventListener('touchend', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, dragOffset]);

  /**
   * 미니맵의 셀 클릭 이벤트를 처리합니다.
   * 해당 위치에 수가 있었던 경우, `onMoveSelect` 콜백을 호출합니다.
   * @param {React.MouseEvent | React.TouchEvent} e - 이벤트 객체.
   * @param {number} x - 클릭된 셀의 x 좌표.
   * @param {number} y - 클릭된 셀의 y 좌표.
   */
  const handleBoardClick = (e: React.MouseEvent | React.TouchEvent, x: number, y: number) => {
    e.stopPropagation(); // 부모의 드래그 이벤트와 충돌 방지
    
    const moveIndex = moves.findIndex((move: any) => 
      move.position.x === x && move.position.y === y
    );
    
    if (moveIndex !== -1 && onMoveSelect) {
      onMoveSelect(moveIndex);
      if (navigator.vibrate) navigator.vibrate(15);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* 미니맵 메인 컨테이너 */}
      <div
        ref={minimapRef}
        className={`fixed z-50 select-none ${className}`}
        style={{
          left: position.x,
          top: position.y,
          opacity: opacity,
          transform: `scale(${scale})`,
          transition: isDragging ? 'none' : 'all 0.3s ease'
        }}
      >
        {/* 미니맵 컨테이너 */}
        <div
          className="bg-black/80 backdrop-blur-md border border-purple-400/30 rounded-2xl shadow-2xl p-3 transition-all duration-300"
          style={{
            boxShadow: isDragging 
              ? `0 10px 40px rgba(147, 51, 234, 0.4)` 
              : '0 10px 40px rgba(0, 0, 0, 0.3)',
            transform: isDragging ? 'scale(1.05)' : 'scale(1)'
          }}
        >
          {/* 확장된 드래그 핸들 영역 - 모바일 터치 영역 확장 */}
          <div
            className="relative cursor-grab active:cursor-grabbing py-4 px-3 -mx-3 -mt-3 mb-2"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            {/* 드래그 가능 영역 표시 */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent rounded-t-2xl opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            
            {/* 헤더 콘텐츠 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical size={12} className="text-purple-400" />
                <span className="text-xs font-display text-white/80">미니맵</span>
              </div>
              
              {/* 모바일 최적화된 버튼들 - 터치 영역 확장 */}
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSettings(!showSettings);
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                  title="설정"
                >
                  <Settings size={14} className="text-white/60" />
                </button>
              </div>
            </div>
          </div>

          {/* 미니 보드 */}
          <div className="grid grid-cols-8 gap-0.5 bg-green-800/20 rounded-lg p-1 border border-green-400/20 w-32 h-32">
            {currentBoard.map((row, y) =>
              row.map((disc, x) => {
                const isLastMove = !!currentMove && currentMove.position.x === x && currentMove.position.y === y;
                const isClickable = moves.some((move: any) => 
                  move.position.x === x && move.position.y === y
                );
                
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`aspect-square bg-green-600/40 border border-green-400/20 rounded-sm
                               flex items-center justify-center transition-all duration-200
                               ${isClickable ? 'cursor-pointer hover:bg-green-500/40 active:bg-green-400/50' : ''}
                               ${isLastMove ? 'ring-1 ring-yellow-400' : ''}`}
                    onClick={(e) => handleBoardClick(e, x, y)}
                    onTouchStart={(e) => {
                      // 터치 시작 시 즉시 클릭 처리 (모바일 최적화)
                      if (isClickable) {
                        handleBoardClick(e, x, y);
                      }
                    }}
                    style={{
                      transform: isLastMove ? 'scale(1.1)' : 'scale(1)',
                      minHeight: '12px',
                      minWidth: '12px'
                    }}
                  >
                    {disc !== 0 && (
                      <div
                        className={`rounded-full border transition-all duration-300
                                  ${disc === 1 ? 'bg-black border-white/40' : 'bg-white border-gray-300'}
                                  w-3 h-3
                                  ${isLastMove ? 'shadow-lg shadow-yellow-400/50' : ''}`}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 게임 정보 */}
          <div className="mt-2 text-center">
            <div className="text-xs text-white/60 font-display">
              {currentMoveIndex + 1}/{moves.length}수
            </div>
            {currentMove && (
              <div className="text-xs text-purple-300 font-display">
                {String.fromCharCode(65 + currentMove.position.x)}{currentMove.position.y + 1}
              </div>
            )}
          </div>

          {/* 설정 패널 - 미니맵 아래에 부착 */}
          {showSettings && (
            <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-sm border-2 border-purple-400/50 rounded-xl p-3 mt-2 shadow-2xl shadow-purple-500/20">
              {/* 설정 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-display font-semibold text-purple-300">미니맵 설정</div>
                <button
                  onClick={() => {
                    setShowSettings(false);
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                  title="설정 닫기"
                >
                  <X size={14} className="text-white/60" />
                </button>
              </div>
              
              {/* 가로 슬라이더들 */}
              <div className="space-y-4">
                {/* 불투명도 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-display text-white/80">불투명도</span>
                    <span className="text-xs text-purple-300 font-semibold">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1"
                    step="0.1"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgba(147, 51, 234, 0.6) 0%, rgba(147, 51, 234, 0.6) ${(opacity - 0.3) / 0.7 * 100}%, rgba(255, 255, 255, 0.2) ${(opacity - 0.3) / 0.7 * 100}%, rgba(255, 255, 255, 0.2) 100%)`
                    }}
                  />
                </div>
                
                {/* 크기 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-display text-white/80">크기</span>
                    <span className="text-xs text-purple-300 font-semibold">{Math.round(scale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.3"
                    step="0.1"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgba(147, 51, 234, 0.6) 0%, rgba(147, 51, 234, 0.6) ${(scale - 0.7) / 0.6 * 100}%, rgba(255, 255, 255, 0.2) ${(scale - 0.7) / 0.6 * 100}%, rgba(255, 255, 255, 0.2) 100%)`
                    }}
                  />
                </div>
              </div>
              
              {/* 초기화 버튼 */}
              <button
                onClick={() => {
                  setPosition({ x: 20, y: 100 });
                  setOpacity(0.9);
                  setScale(1);
                  if (navigator.vibrate) navigator.vibrate(15);
                }}
                className="w-full mt-3 text-xs bg-purple-500/30 text-purple-200 rounded-lg p-3 hover:bg-purple-500/40 active:bg-purple-500/50 transition-all font-display font-semibold border border-purple-400/30 hover:border-purple-400/50 min-h-[44px] flex items-center justify-center"
              >
                <RotateCcw size={14} className="inline mr-2" />
                초기화
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 모바일 최적화된 슬라이더 스타일 */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #9333ea;
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 8px rgba(147, 51, 234, 0.5);
          transition: all 0.2s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(147, 51, 234, 0.7);
        }
        
        .slider::-webkit-slider-thumb:active {
          transform: scale(1.2);
          background: #7c3aed;
        }
        
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #9333ea;
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 8px rgba(147, 51, 234, 0.5);
          transition: all 0.2s ease;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(147, 51, 234, 0.7);
        }
        
        .slider::-webkit-slider-track {
          background: rgba(255, 255, 255, 0.2);
          height: 12px;
          border-radius: 6px;
        }
        
        .slider::-moz-range-track {
          background: rgba(255, 255, 255, 0.2);
          height: 12px;
          border-radius: 6px;
          border: none;
        }
        
        /* 모바일 터치 최적화 */
        @media (max-width: 768px) {
          .slider::-webkit-slider-thumb {
            width: 28px;
            height: 28px;
            border: 4px solid #ffffff;
          }
          
          .slider::-moz-range-thumb {
            width: 28px;
            height: 28px;
            border: 4px solid #ffffff;
          }
          
          .slider::-webkit-slider-track {
            height: 14px;
          }
          
          .slider::-moz-range-track {
            height: 14px;
          }
        }
      `}</style>
    </>
  );
}