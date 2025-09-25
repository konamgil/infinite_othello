
import type { Board, Player } from 'shared-types';
import {
  getStoneDifference,
  mapEvaluationToStoneScale,
  summarizeEvaluation,
  type EvaluationSummary,
} from 'core';

export type { EvaluationSummary };

export { getStoneDifference, mapEvaluationToStoneScale, summarizeEvaluation };

export function formatStoneDiff(value: number, perspective: Player = 'black'): string {
  const sign = value === 0 ? '' : value > 0 ? '+' : '';
  const label = perspective === 'black' ? 'B' : 'W';
  return `${label} ${sign}${value}`;
}

export function summarizePretty(
  board: Board,
  evaluation: number | undefined,
  perspective: Player = 'black'
): string {
  const summary = summarizeEvaluation(board, evaluation, perspective);
  const diff = formatStoneDiff(summary.stoneDiff, perspective);
  const normalized = summary.normalizedEval;
  const normalizedSign = normalized === 0 ? '' : normalized > 0 ? '+' : '';
  return `${diff} | eval ${normalizedSign}${normalized}`;
}
