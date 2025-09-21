import React from 'react';
import { GameMove } from '../../../types/replay';

/**
 * @interface ReplayBoardProps
 * `ReplayBoard` 컴포넌트의 props를 정의합니다.
 */
interface ReplayBoardProps {
  /** @property {('black' | 'white' | null)[][]} boardState 현재 오델로 보드의 8x8 상태. 각 셀은 흑돌, 백돌, 또는 빈 칸을 나타냅니다. */
  boardState: ('black' | 'white' | null)[][];
  /** @property {GameMove} [currentMove] 현재 수에 대한 정보. 마지막으로 둔 수와 뒤집힌 돌들을 강조하는 데 사용됩니다. */
  currentMove?: GameMove;
  /** @property {GameMove} [nextMove] 다음 수에 대한 정보. 보드 위에 다음 수를 미리 보여주는 데 사용됩니다. */
  nextMove?: GameMove;
  /** @property {boolean} [showCoordinates=true] 보드 주변에 좌표(A-H, 1-8)를 표시할지 여부. */
  showCoordinates?: boolean;
  /** @property {boolean} [highlightLastMove=true] 마지막으로 둔 수를 강조 표시할지 여부. */
  highlightLastMove?: boolean;
}

/**
 * 게임 리플레이를 위한 오델로 보드를 렌더링하는 컴포넌트입니다.
 * 현재 보드 상태, 마지막 수, 다음 수 미리보기, 좌표 등을 표시하는 기능을 제공합니다.
 * @param {ReplayBoardProps} props - 컴포넌트 props
 * @returns {JSX.Element} 오델로 리플레이 보드 UI
 */
export function ReplayBoard({
  boardState,
  currentMove,
  nextMove,
  showCoordinates = true,
  highlightLastMove = true
}: ReplayBoardProps) {

  /**
   * 보드 위의 단일 돌(disc)을 렌더링합니다.
   * @param {'black' | 'white' | null} piece - 렌더링할 돌의 종류 (흑, 백, 또는 없음).
   * @param {boolean} [isLastMove=false] - 이 돌이 마지막으로 둔 수인지 여부.
   * @param {boolean} [isFlipped=false] - 이 돌이 마지막 수에 의해 뒤집혔는지 여부.
   * @returns {JSX.Element | null} 렌더링된 돌의 JSX 요소 또는 null.
   */
  const renderDisc = (piece: 'black' | 'white' | null, isLastMove = false, isFlipped = false) => {
    if (!piece) return null;

    return (
      <div
        className={`w-7 h-7 rounded-full transition-all duration-300 ${
          piece === 'black'
            ? 'bg-gradient-to-br from-gray-800 to-black border-2 border-gray-600'
            : 'bg-gradient-to-br from-white to-gray-100 border-2 border-gray-300'
        } ${
          isLastMove && highlightLastMove
            ? 'ring-2 ring-yellow-400 ring-opacity-60 shadow-lg shadow-yellow-400/20' // 마지막 수 강조
            : ''
        } ${
          isFlipped
            ? 'animate-pulse scale-110' // 뒤집힌 돌 애니메이션
            : ''
        }`}
      />
    );
  };

  /**
   * 다음 수에 대한 미리보기를 렌더링합니다.
   * @param {number} row - 현재 셀의 행 인덱스.
   * @param {number} col - 현재 셀의 열 인덱스.
   * @returns {JSX.Element | null} 렌더링된 미리보기의 JSX 요소 또는 null.
   */
  const renderMovePreview = (row: number, col: number) => {
    if (!nextMove) return null;
    if (nextMove.x !== col || nextMove.y !== row) return null;

    return (
      <div className={`absolute inset-0 rounded-lg border-2 border-dashed transition-all duration-500 ${
        nextMove.player === 'black'
          ? 'border-gray-400 bg-gray-800/30'
          : 'border-gray-300 bg-gray-100/30'
      }`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-6 h-6 rounded-full border-2 border-dashed ${
            nextMove.player === 'black'
              ? 'border-gray-400'
              : 'border-gray-600'
          } opacity-60`} />
        </div>
      </div>
    );
  };

  /**
   * 주어진 좌표가 마지막으로 둔 수의 위치인지 확인합니다.
   * @param {number} row - 확인할 셀의 행 인덱스.
   * @param {number} col - 확인할 셀의 열 인덱스.
   * @returns {boolean} 마지막 수의 위치인 경우 true.
   */
  const isLastMove = (row: number, col: number): boolean => {
    return currentMove ? currentMove.x === col && currentMove.y === row : false;
  };

  /**
   * 주어진 좌표의 돌이 현재 수에 의해 뒤집혔는지 확인합니다.
   * @param {number} row - 확인할 셀의 행 인덱스.
   * @param {number} col - 확인할 셀의 열 인덱스.
   * @returns {boolean} 뒤집힌 돌인 경우 true.
   */
  const isFlippedInLastMove = (row: number, col: number): boolean => {
    if (!currentMove) return false;
    return currentMove.flippedDiscs.some(disc => disc.x === col && disc.y === row);
  };

  return (
    <div className="relative">
      {/* Coordinate Labels */}
      {showCoordinates && (
        <>
          {/* Top coordinates (A-H) */}
          <div className="flex justify-center mb-2">
            <div className="grid grid-cols-8 gap-1" style={{ width: '320px' }}>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="w-9 h-6 flex items-center justify-center">
                  <span className="text-white/60 text-xs font-smooth font-bold">
                    {String.fromCharCode(65 + i)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Left coordinates (1-8) */}
          <div className="absolute -left-8 top-8 flex flex-col gap-1">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="w-6 h-9 flex items-center justify-center">
                <span className="text-white/60 text-xs font-smooth font-bold">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Game Board */}
      <div className="relative bg-gradient-to-br from-green-800/80 to-green-900/90
                     rounded-2xl p-4 border-4 border-amber-600/60 shadow-2xl
                     backdrop-blur-md">
        {/* Board Grid */}
        <div className="grid grid-cols-8 gap-1">
          {boardState.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="relative w-9 h-9 bg-green-700/50 border border-green-600/40
                         rounded-md flex items-center justify-center
                         hover:bg-green-600/30 transition-colors duration-200"
              >
                {/* Move Preview */}
                {renderMovePreview(rowIndex, colIndex)}

                {/* Game Piece */}
                {renderDisc(
                  cell,
                  isLastMove(rowIndex, colIndex),
                  isFlippedInLastMove(rowIndex, colIndex)
                )}

                {/* Move Number for Last Move */}
                {isLastMove(rowIndex, colIndex) && currentMove && highlightLastMove && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-black
                                text-xs rounded-full flex items-center justify-center font-bold">
                    {currentMove.moveNumber}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Board edges highlighting */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/10 to-transparent pointer-events-none" />

        {/* Subtle board pattern */}
        <div className="absolute inset-4 rounded-xl opacity-30 pointer-events-none"
             style={{
               backgroundImage: `
                 linear-gradient(45deg, transparent 40%, rgba(34, 197, 94, 0.1) 50%, transparent 60%),
                 linear-gradient(-45deg, transparent 40%, rgba(34, 197, 94, 0.1) 50%, transparent 60%)
               `,
               backgroundSize: '20px 20px'
             }}
        />
      </div>

      {/* Right coordinates (1-8) - mirror left */}
      {showCoordinates && (
        <div className="absolute -right-8 top-8 flex flex-col gap-1">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="w-6 h-9 flex items-center justify-center">
              <span className="text-white/60 text-xs font-smooth font-bold">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom coordinates (A-H) - mirror top */}
      {showCoordinates && (
        <div className="flex justify-center mt-2">
          <div className="grid grid-cols-8 gap-1" style={{ width: '320px' }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="w-9 h-6 flex items-center justify-center">
                <span className="text-white/60 text-xs font-smooth font-bold">
                  {String.fromCharCode(65 + i)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}