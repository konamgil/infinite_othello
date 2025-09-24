// Dynamic weights system based on game phase
// Converted from ai.js dynamicWeights function

export interface EvaluationWeights {
  mobility: number;        // Current move count advantage
  pmob: number;           // Potential mobility (empty squares adjacent to opponent)
  stability: number;      // Stable discs that cannot be flipped
  frontier: number;       // Frontier discs (adjacent to empty squares)
  corner: number;         // Corner control
  x: number;             // X-square penalty (diagonal to corners)
  c: number;             // C-square penalty (adjacent to corners)
  parity: number;         // Move parity advantage
  edge: number;          // Edge stability
  edgeOcc: number;       // Edge occupancy
}

/**
 * Get evaluation weights based on empty squares remaining
 * Dynamically adjusts strategy based on game phase
 */
export function getEvaluationWeights(empties: number): EvaluationWeights {
  // Early game (45+ empties): Focus on mobility and position
  if (empties >= 45) {
    return {
      mobility: 28,
      pmob: 12,
      stability: 6,
      frontier: 10,
      corner: 35,
      x: 18,
      c: 10,
      parity: 0,
      edge: 4,
      edgeOcc: -4,
    };
  }

  // Mid game (20-44 empties): Balanced approach
  if (empties >= 20) {
    return {
      mobility: 24,
      pmob: 16,
      stability: 10,
      frontier: 16,
      corner: 34,
      x: 22,
      c: 14,
      parity: 6,
      edge: 8,
      edgeOcc: -8,
    };
  }

  // End game (<20 empties): Prioritize stability and parity
  return {
    mobility: 8,
    pmob: 6,
    stability: 22,
    frontier: 8,
    corner: 40,
    x: 20,
    c: 12,
    parity: 18,
    edge: 12,
    edgeOcc: 6,
  };
}

/**
 * Static positional evaluation table
 * Higher values indicate better positions
 */
export const POSITIONAL_WEIGHTS = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120],
] as const;

/**
 * Corner data for X-square and C-square analysis
 */
export const CORNER_DATA = [
  {
    corner: [0, 0] as const,
    x: [1, 1] as const,
    c: [[0, 1], [1, 0]] as const,
  },
  {
    corner: [0, 7] as const,
    x: [1, 6] as const,
    c: [[0, 6], [1, 7]] as const,
  },
  {
    corner: [7, 0] as const,
    x: [6, 1] as const,
    c: [[6, 0], [7, 1]] as const,
  },
  {
    corner: [7, 7] as const,
    x: [6, 6] as const,
    c: [[6, 7], [7, 6]] as const,
  },
] as const;

/**
 * Directions for neighbor checking (8-directional)
 */
export const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
] as const;