
export interface DifficultyWeights {
  STABLE_DISC_WEIGHT: number;
  CORNER_WEIGHT: number;
  X_SQUARE_PENALTY: number;
  C_SQUARE_PENALTY: number;
  FRONTIER_WEIGHT: number;
  PARITY_BONUS: number;
  EDGE_STABILITY_WEIGHT: number;
}

export type DifficultyKey = 'easy' | 'medium' | 'hard' | 'very-hard' | 'normal';

export const difficultyWeights: Record<DifficultyKey, DifficultyWeights> = {
  easy: {
    STABLE_DISC_WEIGHT: 40,
    CORNER_WEIGHT: 25,
    X_SQUARE_PENALTY: 15,
    C_SQUARE_PENALTY: 10,
    FRONTIER_WEIGHT: 10,
    PARITY_BONUS: 5,
    EDGE_STABILITY_WEIGHT: 15,
  },
  medium: {
    STABLE_DISC_WEIGHT: 50,
    CORNER_WEIGHT: 30,
    X_SQUARE_PENALTY: 20,
    C_SQUARE_PENALTY: 15,
    FRONTIER_WEIGHT: 15,
    PARITY_BONUS: 10,
    EDGE_STABILITY_WEIGHT: 25,
  },
  hard: {
    STABLE_DISC_WEIGHT: 60,
    CORNER_WEIGHT: 35,
    X_SQUARE_PENALTY: 25,
    C_SQUARE_PENALTY: 20,
    FRONTIER_WEIGHT: 20,
    PARITY_BONUS: 15,
    EDGE_STABILITY_WEIGHT: 35,
  },
  'very-hard': {
    STABLE_DISC_WEIGHT: 70,
    CORNER_WEIGHT: 38,
    X_SQUARE_PENALTY: 26,
    C_SQUARE_PENALTY: 22,
    FRONTIER_WEIGHT: 24,
    PARITY_BONUS: 18,
    EDGE_STABILITY_WEIGHT: 40,
  },
  normal: {
    STABLE_DISC_WEIGHT: 50,
    CORNER_WEIGHT: 30,
    X_SQUARE_PENALTY: 20,
    C_SQUARE_PENALTY: 15,
    FRONTIER_WEIGHT: 15,
    PARITY_BONUS: 10,
    EDGE_STABILITY_WEIGHT: 25,
  },
};

difficultyWeights.normal = difficultyWeights.medium;

export function getWeights(level: DifficultyKey = 'medium'): DifficultyWeights {
  return difficultyWeights[level] || difficultyWeights.medium;
}

export default { difficultyWeights, getWeights };
