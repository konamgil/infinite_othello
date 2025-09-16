import React from 'react';
import { GameMove } from '../../types/replay';

interface ReplayBoardProps {
  boardState: ('black' | 'white' | null)[][];
  currentMove?: GameMove;
  nextMove?: GameMove;
  showCoordinates?: boolean;
  highlightLastMove?: boolean;
}

export function ReplayBoard({
  boardState,
  currentMove,
  nextMove,
  showCoordinates = true,
  highlightLastMove = true
}: ReplayBoardProps) {

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
            ? 'ring-2 ring-yellow-400 ring-opacity-60 shadow-lg shadow-yellow-400/20'
            : ''
        } ${
          isFlipped
            ? 'animate-pulse scale-110'
            : ''
        }`}
      />
    );
  };

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

  const isLastMove = (row: number, col: number): boolean => {
    return currentMove ? currentMove.x === col && currentMove.y === row : false;
  };

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