
import type { Board, Player } from 'shared-types';
import { calculateScore } from '../gameCore';

const MAX_STONES = 64;

/**
 * Returns the stone difference from the given perspective (positive means advantage).
 */
export function getStoneDifference(board: Board, perspective: Player = 'black'): number {
  const { black, white } = calculateScore(board);
  const diff = perspective === 'black' ? black - white : white - black;
  return diff;
}

/**
 * Maps an evaluation score to the -64..+64 range using a smooth compression.
 * The mapping does not guarantee exact stone parity but keeps the scale intuitive.
 */
export function mapEvaluationToStoneScale(evaluation: number | undefined): number {
  if (evaluation === undefined || Number.isNaN(evaluation)) {
    return 0;
  }
  const compressed = Math.tanh(evaluation / 120);
  const scaled = Math.round(compressed * MAX_STONES);
  return Math.max(-MAX_STONES, Math.min(MAX_STONES, scaled));
}

export interface EvaluationSummary {
  perspective: Player;
  stoneDiff: number;
  normalizedEval: number;
}

/**
 * Provides both the actual stone difference and a normalized evaluation score.
 */
export function summarizeEvaluation(
  board: Board,
  evaluation: number | undefined,
  perspective: Player = 'black'
): EvaluationSummary {
  return {
    perspective,
    stoneDiff: getStoneDifference(board, perspective),
    normalizedEval: mapEvaluationToStoneScale(evaluation),
  };
}
