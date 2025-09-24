// Selectivity and difficulty configuration system
// Converted from search-neo.js LEVEL tables and selectivity system

export interface SelectivityConfig {
  depth: number;
  selectivity: number; // 0 (aggressive) to 5 (conservative)
}

export interface SelectivitySettings {
  lmrBase: number;      // Late move reduction base factor
  lmpBonus: number;     // Late move pruning bonus allowance
  futMul: number;       // Futility pruning margin multiplier
  razorMul: number;     // Razor pruning margin multiplier
  useNWS: boolean;      // Enable null window search
}

// Selectivity table for different difficulty levels and empty squares
// LEVEL[level][empties] -> { depth, selectivity }
const LEVEL_TABLE: SelectivityConfig[][] = [];

/**
 * Initialize the level table
 */
function buildLevelTable(): void {
  // Initialize with default values
  for (let L = 0; L <= 60; L++) {
    LEVEL_TABLE[L] = [];
    for (let e = 0; e <= 60; e++) {
      LEVEL_TABLE[L][e] = { depth: 0, selectivity: 5 };
    }
  }

  // Build level configurations
  for (let L = 0; L <= 60; L++) {
    for (let e = 0; e <= 60; e++) {
      if (L <= 0) {
        LEVEL_TABLE[L][e] = { depth: 0, selectivity: 5 };
        continue;
      }

      if (L <= 10) {
        LEVEL_TABLE[L][e] = {
          depth: e <= 2 * L ? e : L,
          selectivity: 5
        };
        continue;
      }

      // Define selectivity bands based on difficulty level
      const bands = [
        { lim: 12, sel: [[21, 5], [24, 3], [99, 0]] },
        { lim: 18, sel: [[21, 5], [24, 3], [27, 1], [99, 0]] },
        { lim: 24, sel: [[24, 5], [27, 4], [30, 2], [33, 0], [99, 0]] },
        { lim: 33, sel: [[30, 5], [33, 4], [36, 2], [39, 0], [99, 0]] },
        { lim: 35, sel: [[30, 5], [33, 4], [36, 3], [39, 1], [99, 0]] },
      ];

      let handled = false;
      for (const band of bands) {
        if (L <= band.lim) {
          let selectivity = 0;
          let config = { depth: e, selectivity: 0 };

          for (const [threshold, sel] of band.sel) {
            selectivity = sel;
            if (e <= threshold) {
              config = { depth: e, selectivity };
              break;
            }
          }

          LEVEL_TABLE[L][e] = config;
          handled = true;
          break;
        }
      }

      if (!handled) {
        // High difficulty levels (L > 35)
        let selectivity = 0;
        if (e <= L - 6) selectivity = 5;
        else if (e <= L - 3) selectivity = 4;
        else if (e <= L) selectivity = 3;
        else if (e <= L + 3) selectivity = 2;
        else if (e <= L + 6) selectivity = 1;
        else selectivity = 0;

        LEVEL_TABLE[L][e] = {
          depth: e <= L + 9 ? e : L,
          selectivity
        };
      }
    }
  }
}

// Initialize the table
buildLevelTable();

/**
 * Get configuration for a specific difficulty level and empty squares
 */
export function getLevelConfig(level: number, empties: number): SelectivityConfig {
  const clampedLevel = Math.max(0, Math.min(60, level));
  const clampedEmpties = Math.max(0, Math.min(60, empties));

  return LEVEL_TABLE[clampedLevel][clampedEmpties];
}

/**
 * Convert selectivity level to search settings
 */
export function getSelectivitySettings(selectivity: number): SelectivitySettings {
  const NO_SELECTIVITY = 5;
  const clampedSel = Math.max(0, Math.min(NO_SELECTIVITY, selectivity));

  // Calculate scaling factor: 0 (aggressive) to 1 (conservative)
  const t = (NO_SELECTIVITY - clampedSel) / NO_SELECTIVITY;

  return {
    lmrBase: 0.75 + 1.75 * t,              // 0.75 to 2.5
    lmpBonus: Math.round(12 * t),          // 0 to 12
    futMul: 1 + 1.0 * t,                   // 1.0 to 2.0
    razorMul: 1 + 0.8 * t,                 // 1.0 to 1.8
    useNWS: t > 0.15,                      // Enable NWS for selectivity <= 4
  };
}

/**
 * Predefined difficulty mappings
 */
export enum DifficultyLevel {
  BEGINNER = 8,
  EASY = 12,
  MEDIUM = 18,
  HARD = 24,
  EXPERT = 33,
  MASTER = 40,
  GRANDMASTER = 50
}

/**
 * Get difficulty level from string
 */
export function getDifficultyLevel(difficulty: string): number {
  switch (difficulty.toLowerCase()) {
    case 'beginner': return DifficultyLevel.BEGINNER;
    case 'easy': return DifficultyLevel.EASY;
    case 'medium': return DifficultyLevel.MEDIUM;
    case 'hard': return DifficultyLevel.HARD;
    case 'expert': return DifficultyLevel.EXPERT;
    case 'master': return DifficultyLevel.MASTER;
    case 'grandmaster': return DifficultyLevel.GRANDMASTER;
    default: return DifficultyLevel.MEDIUM;
  }
}

/**
 * Stability thresholds for different pruning techniques
 */
export const STABILITY_THRESHOLDS = {
  // NWS (Null Window Search) stability thresholds
  NWS: Array.from({ length: 61 }, (_, i) => {
    if (i < 4) return 99;
    if (i <= 8) return 8;
    if (i <= 24) return 26 + Math.floor((i - 8) * 1.2);
    return Math.min(64, 40 + Math.floor((i - 24) * 1.0));
  }),

  // PVS (Principal Variation Search) stability thresholds
  PVS: Array.from({ length: 61 }, (_, i) => {
    if (i < 4) return 99;
    if (i <= 8) return 0;
    if (i <= 24) return 12 + Math.floor((i - 8) * 1.2);
    return Math.min(62, 32 + Math.floor((i - 24) * 1.0));
  }),
};

/**
 * Pruning parameters
 */
export const PRUNING_PARAMS = {
  // Late Move Pruning table
  LMP_TABLE: [0, 0, 3, 5, 7, 9, 12],

  // Futility pruning margins by depth
  FUTILITY_MARGINS: [0, 120, 200, 280],

  // Razor pruning margins by depth
  RAZOR_MARGINS: [0, 300, 500],

  // Null move parameters
  NULL_MOVE_R: 2,
  NULL_MOVE_MIN_DEPTH: 2,
};

/**
 * Endgame detection threshold
 */
export const ENDGAME_THRESHOLD = 20;