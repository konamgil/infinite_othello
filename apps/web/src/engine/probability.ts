
export function scoreToProb(score: number): number {
  const clamped = Math.max(-1000, Math.min(1000, score));
  const exponent = -clamped / 120;
  const probability = 1 / (1 + Math.exp(exponent));
  return probability;
}

export default { scoreToProb };
