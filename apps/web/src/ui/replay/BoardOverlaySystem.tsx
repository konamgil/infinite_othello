import React, { useState, useEffect, useMemo } from 'react';
import { AnalysisData } from './AdvancedAnalysisSystem';

/* ──────────────────────────────────────────────────────────────────
   Types & Interfaces
   ────────────────────────────────────────────────────────────────── */

export interface BoardOverlayProps {
  board: Array<Array<-1 | 0 | 1>>;
  analysisData: AnalysisData | null;
  overlayMode: 'scores' | 'heatmap' | 'mobility' | 'frontier' | null;
  simulationMode: boolean;
  currentMove?: { x: number; y: number };
  onCellClick?: (x: number, y: number) => void;
  onSimulationMove?: (x: number, y: number) => void;
  className?: string;
}

interface CellOverlay {
  x: number;
  y: number;
  value: number;
  color: string;
  intensity: number;
  label?: string;
  category?: 'best' | 'good' | 'neutral' | 'bad' | 'terrible';
}

/* ──────────────────────────────────────────────────────────────────
   Board Overlay System Component
   ────────────────────────────────────────────────────────────────── */

export function BoardOverlaySystem({
  board,
  analysisData,
  overlayMode,
  simulationMode,
  currentMove,
  onCellClick,
  onSimulationMove,
  className = ''
}: BoardOverlayProps) {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const [simulationPreview, setSimulationPreview] = useState<{ x: number; y: number } | null>(null);

  // Generate overlay data based on mode
  const overlayData = useMemo<CellOverlay[]>(() => {
    if (!analysisData || !overlayMode) return [];

    switch (overlayMode) {
      case 'scores':
        return analysisData.legalMoves.map(move => ({
          x: move.x,
          y: move.y,
          value: move.score,
          color: getCategoryColor(move.category),
          intensity: Math.min(Math.abs(move.score) / 50, 1),
          label: move.score.toString(),
          category: move.category
        }));

      case 'mobility':
        // Generate mobility heatmap for empty cells
        return board.flatMap((row, y) =>
          row.map((cell, x) => {
            if (cell !== 0) return null;
            // Simulate mobility calculation for this position
            const mobilityScore = calculateMobilityScore(x, y, board);
            return {
              x,
              y,
              value: mobilityScore,
              color: getMobilityColor(mobilityScore),
              intensity: mobilityScore / 10,
              label: mobilityScore > 0 ? '+' + mobilityScore.toString() : mobilityScore.toString()
            };
          }).filter(Boolean)
        ).filter((item): item is CellOverlay => item !== null);

      case 'frontier':
        // Show frontier analysis for occupied cells
        return board.flatMap((row, y) =>
          row.map((cell, x) => {
            if (cell === 0) return null;
            const isEdge = isFrontierCell(x, y, board);
            const stability = calculateStability(x, y, board);
            return isEdge ? {
              x,
              y,
              value: stability,
              color: getStabilityColor(stability),
              intensity: 1 - (stability / 100),
              label: stability + '%'
            } : null;
          }).filter(Boolean)
        ).filter((item): item is CellOverlay => item !== null);

      case 'heatmap':
        // General position evaluation heatmap
        return board.flatMap((row, y) =>
          row.map((cell, x) => {
            const positionValue = getPositionValue(x, y);
            return {
              x,
              y,
              value: positionValue,
              color: getHeatmapColor(positionValue),
              intensity: Math.abs(positionValue) / 100,
              label: positionValue > 0 ? '+' + positionValue.toString() : positionValue.toString()
            };
          })
        );

      default:
        return [];
    }
  }, [board, analysisData, overlayMode]);

  // Handle cell interaction
  const handleCellClick = (x: number, y: number) => {
    if (simulationMode && board[y][x] === 0) {
      onSimulationMove?.(x, y);
    }
    onCellClick?.(x, y);
  };

  const handleCellHover = (x: number, y: number) => {
    setHoveredCell({ x, y });
    if (simulationMode && board[y][x] === 0) {
      setSimulationPreview({ x, y });
    }
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
    setSimulationPreview(null);
  };

  return (
    <div className={`grid grid-cols-8 gap-1 p-3 sm:p-4 ${className}`}>
      {board.map((row, y) =>
        row.map((disc, x) => {
          const overlay = overlayData.find(o => o.x === x && o.y === y);
          const isLastMove = currentMove && currentMove.x === x && currentMove.y === y;
          const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
          const isSimulationPreview = simulationPreview?.x === x && simulationPreview?.y === y;
          const isClickable = simulationMode && disc === 0;

          return (
            <div
              key={`${x}-${y}`}
              className={`aspect-square bg-green-600/30 border border-green-400/20 rounded-md sm:rounded-lg
                          flex items-center justify-center transition-all duration-300 relative
                          ${isLastMove ? 'ring-2 ring-yellow-400 ring-opacity-80' : ''}
                          ${isClickable ? 'cursor-pointer hover:bg-green-500/40' : ''}
                          ${isHovered ? 'bg-green-500/50' : ''}`}
              onClick={() => handleCellClick(x, y)}
              onMouseEnter={() => handleCellHover(x, y)}
              onMouseLeave={handleCellLeave}
            >
              {/* Game Disc */}
              {disc !== 0 && (
                <div
                  className={`w-[70%] h-[70%] rounded-full border-2 transition-all duration-500 z-10
                              ${disc === 1 ? 'bg-black border-white/30 shadow-lg' : 'bg-white border-gray-300 shadow-lg'}
                              ${isLastMove ? 'scale-110 shadow-yellow-400/50' : ''}`}
                />
              )}

              {/* Simulation Preview */}
              {isSimulationPreview && (
                <div className="w-[60%] h-[60%] rounded-full border-2 border-cyan-400 bg-cyan-400/20
                               animate-pulse z-20 absolute" />
              )}

              {/* Overlay Information */}
              {overlay && (
                <>
                  {/* Background Color */}
                  <div
                    className="absolute inset-0 rounded-md sm:rounded-lg transition-all duration-300"
                    style={{
                      backgroundColor: overlay.color,
                      opacity: overlay.intensity * 0.6
                    }}
                  />

                  {/* Score/Value Label */}
                  {overlayMode === 'scores' && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <span className={`text-xs font-bold font-display
                                       ${overlay.category === 'best' ? 'text-green-100' :
                                         overlay.category === 'good' ? 'text-blue-100' :
                                         overlay.category === 'neutral' ? 'text-yellow-100' :
                                         overlay.category === 'bad' ? 'text-orange-100' : 'text-red-100'}
                                       drop-shadow-lg`}>
                        {overlay.label}
                      </span>
                    </div>
                  )}

                  {/* Mobility Indicators */}
                  {overlayMode === 'mobility' && disc === 0 && (
                    <div className="absolute top-0.5 right-0.5 z-20">
                      <div className={`w-2 h-2 rounded-full ${
                        overlay.value > 5 ? 'bg-green-400' :
                        overlay.value > 2 ? 'bg-yellow-400' :
                        overlay.value > 0 ? 'bg-orange-400' : 'bg-red-400'
                      } shadow-lg`} />
                    </div>
                  )}

                  {/* Frontier Indicators */}
                  {overlayMode === 'frontier' && disc !== 0 && (
                    <div className="absolute top-0.5 left-0.5 z-20">
                      <div className={`w-1.5 h-1.5 ${
                        overlay.value > 80 ? 'bg-green-400' :
                        overlay.value > 60 ? 'bg-yellow-400' :
                        overlay.value > 40 ? 'bg-orange-400' : 'bg-red-400'
                      } rotate-45 shadow-lg`} />
                    </div>
                  )}

                  {/* Heatmap Gradient */}
                  {overlayMode === 'heatmap' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 z-20">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          background: `linear-gradient(90deg, transparent 0%, ${overlay.color} 100%)`,
                          width: `${overlay.intensity * 100}%`
                        }}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Hover Tooltip */}
              {isHovered && overlay && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-30">
                  <div className="px-2 py-1 bg-black/80 backdrop-blur-sm border border-white/20 rounded text-xs font-display text-white whitespace-nowrap">
                    {overlayMode === 'scores' && `점수: ${overlay.label}`}
                    {overlayMode === 'mobility' && `이동성: ${overlay.label}`}
                    {overlayMode === 'frontier' && `안정성: ${overlay.label}`}
                    {overlayMode === 'heatmap' && `위치값: ${overlay.label}`}
                  </div>
                </div>
              )}

              {/* Grid Coordinates (for debugging) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="absolute bottom-0 right-0 text-[8px] text-white/30 font-mono">
                  {String.fromCharCode(65 + x)}{y + 1}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Helper Functions
   ────────────────────────────────────────────────────────────────── */

function getCategoryColor(category: 'best' | 'good' | 'neutral' | 'bad' | 'terrible'): string {
  switch (category) {
    case 'best': return '#10b981'; // green-500
    case 'good': return '#3b82f6'; // blue-500
    case 'neutral': return '#f59e0b'; // amber-500
    case 'bad': return '#f97316'; // orange-500
    case 'terrible': return '#ef4444'; // red-500
    default: return '#6b7280'; // gray-500
  }
}

function getMobilityColor(score: number): string {
  if (score > 5) return '#10b981'; // green-500
  if (score > 2) return '#f59e0b'; // amber-500
  if (score > 0) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

function getStabilityColor(stability: number): string {
  if (stability > 80) return '#10b981'; // green-500
  if (stability > 60) return '#f59e0b'; // amber-500
  if (stability > 40) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

function getHeatmapColor(value: number): string {
  if (value > 50) return '#8b5cf6'; // violet-500
  if (value > 20) return '#3b82f6'; // blue-500
  if (value > 0) return '#10b981'; // green-500
  if (value > -20) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
}

function calculateMobilityScore(x: number, y: number, board: Array<Array<-1 | 0 | 1>>): number {
  // Simplified mobility calculation
  // In a real implementation, this would check for legal moves and their impact
  let score = 0;
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  directions.forEach(([dx, dy]) => {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
      if (board[ny][nx] !== 0) score += 1;
    }
  });

  return score;
}

function isFrontierCell(x: number, y: number, board: Array<Array<-1 | 0 | 1>>): boolean {
  if (board[y][x] === 0) return false;

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  return directions.some(([dx, dy]) => {
    const nx = x + dx;
    const ny = y + dy;
    return nx >= 0 && nx < 8 && ny >= 0 && ny < 8 && board[ny][nx] === 0;
  });
}

function calculateStability(x: number, y: number, board: Array<Array<-1 | 0 | 1>>): number {
  // Simplified stability calculation
  // In a real implementation, this would consider corner proximity, edge stability, etc.
  let stability = 50; // base stability

  // Corner bonus
  if ((x === 0 || x === 7) && (y === 0 || y === 7)) {
    stability += 40;
  }
  // Edge bonus
  else if (x === 0 || x === 7 || y === 0 || y === 7) {
    stability += 20;
  }

  // Penalty for being near empty cells
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  let emptyNeighbors = 0;
  directions.forEach(([dx, dy]) => {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8 && board[ny][nx] === 0) {
      emptyNeighbors++;
    }
  });

  stability -= emptyNeighbors * 5;

  return Math.max(0, Math.min(100, stability));
}

function getPositionValue(x: number, y: number): number {
  // Static position evaluation based on strategic importance
  // Corner squares are most valuable
  if ((x === 0 || x === 7) && (y === 0 || y === 7)) {
    return 100;
  }

  // Squares adjacent to corners are dangerous
  if (((x === 1 || x === 6) && (y === 0 || y === 7)) ||
      ((x === 0 || x === 7) && (y === 1 || y === 6))) {
    return -50;
  }

  // Diagonal to corners are also risky
  if ((x === 1 && y === 1) || (x === 1 && y === 6) ||
      (x === 6 && y === 1) || (x === 6 && y === 6)) {
    return -30;
  }

  // Edge squares are moderately valuable
  if (x === 0 || x === 7 || y === 0 || y === 7) {
    return 20;
  }

  // Central squares
  if ((x >= 2 && x <= 5) && (y >= 2 && y <= 5)) {
    return 10;
  }

  return 0;
}

export default BoardOverlaySystem;