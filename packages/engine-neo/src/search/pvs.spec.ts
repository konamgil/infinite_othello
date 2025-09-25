
import { describe, it, expect } from 'vitest';
import { PVSEngine } from './pvs';
import type { Position } from 'shared-types';

type PruneSettings = {
  lmpBonus: number;
  lmrBase: number;
  lmrMaxReduction: number;
};

describe('PVSEngine pruning safeguards', () => {
  const baseSettings: PruneSettings = {
    lmpBonus: 0,
    lmrBase: 0,
    lmrMaxReduction: 2
  };

  const createEngine = () => new PVSEngine() as unknown as {
    shouldPruneMove: (
      moveCount: number,
      depth: number,
      alpha: number,
      beta: number,
      settings: PruneSettings
    ) => boolean;
    shouldReduceMove: (
      moveCount: number,
      depth: number,
      move: Position,
      settings: PruneSettings,
      empties: number
    ) => boolean;
  };

  it('never prunes the first six moves', () => {
    const engine = createEngine();
    expect(engine.shouldPruneMove(0, 6, -1000, 1000, baseSettings)).toBe(false);
    expect(engine.shouldPruneMove(5, 6, -1000, 1000, baseSettings)).toBe(false);
  });

  it('prunes late moves once threshold is reached', () => {
    const engine = createEngine();
    expect(engine.shouldPruneMove(12, 6, -1000, 1000, baseSettings)).toBe(true);
  });

  it('does not reduce moves when depth is shallow or empties are high', () => {
    const engine = createEngine();
    const move: Position = { row: 3, col: 3 };
    expect(engine.shouldReduceMove(5, 3, move, baseSettings, 30)).toBe(false);
    expect(engine.shouldReduceMove(5, 6, move, baseSettings, 60)).toBe(false);
  });

  it('does not reduce important (corner) moves', () => {
    const engine = createEngine();
    const corner: Position = { row: 0, col: 0 };
    expect(engine.shouldReduceMove(5, 6, corner, baseSettings, 20)).toBe(false);
  });

  it('reduces late non-critical moves under typical conditions', () => {
    const engine = createEngine();
    const move: Position = { row: 3, col: 3 };
    expect(engine.shouldReduceMove(5, 6, move, baseSettings, 20)).toBe(true);
  });
});
