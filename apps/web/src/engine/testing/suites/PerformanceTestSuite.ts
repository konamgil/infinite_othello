import type { Engine } from '../../types';
import type { EngineTestSuite, TestResult } from '../framework/EngineTestSuite';

export class PerformanceTestSuite implements EngineTestSuite {
  name = 'Performance Benchmark';
  description = 'Tests engine speed and efficiency across different positions';
  category = 'performance' as const;

  private testPositions = [
    // Opening position
    {
      id: 'opening',
      board: this.createInitialBoard(),
      player: 'black' as const,
      expectedMinNPS: 10000
    },
    // Mid-game position
    {
      id: 'midgame',
      board: this.createMidGameBoard(),
      player: 'black' as const,
      expectedMinNPS: 8000
    },
    // Complex position
    {
      id: 'complex',
      board: this.createComplexBoard(),
      player: 'white' as const,
      expectedMinNPS: 5000
    }
  ];

  async runTest(engine: Engine): Promise<TestResult> {
    const results = [];
    let totalTime = 0;
    let totalNodes = 0;

    for (const position of this.testPositions) {
      const startTime = performance.now();

      try {
        const response = await engine.analyze({
            id: 'test-' + position.id,
            board: position.board,
            currentPlayer: position.player,
            validMoves: [],
            score: { black: 0, white: 0 },
            status: 'playing',
            moveHistory: [],
            canUndo: false,
            canRedo: false
          },
          timeLimit: 3000, // 3초
          skill: 80
        });

        const elapsed = performance.now() - startTime;
        const nps = response.nodes ? Math.round(response.nodes / (elapsed / 1000)) : 0;

        results.push({
          id: position.id,
          expected: position.expectedMinNPS,
          actual: nps,
          correct: nps >= position.expectedMinNPS,
          time: elapsed,
          nodes: response.nodes || 0
        });

        totalTime += elapsed;
        totalNodes += response.nodes || 0;

      } catch (error) {
        results.push({
          id: position.id,
          expected: position.expectedMinNPS,
          actual: 0,
          correct: false,
          time: 3000,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        totalTime += 3000;
      }
    }

    const passedPositions = results.filter(r => r.correct).length;
    const avgNPS = totalTime > 0 ? Math.round(totalNodes / (totalTime / 1000)) : 0;
    const score = (passedPositions / results.length) * 100;

    return {
      passed: score >= 70, // 70% of positions meet NPS requirements
      score,
      metrics: {
        avgTime: totalTime / results.length,
        totalTime,
        nodesPerSecond: avgNPS,
        totalPositions: results.length,
        correctMoves: passedPositions
      },
      details: {
        positions: results
      },
      timestamp: Date.now(),
      engineName: engine.name,
      suiteName: this.name
    };
  }

  private createInitialBoard() {
    // Standard Othello starting position
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[3][3] = 'white';
    board[3][4] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';
    return board;
  }

  private createMidGameBoard() {
    // Mid-game position with more pieces
    const board = Array(8).fill(null).map(() => Array(8).fill(null));

    // Add some scattered pieces to simulate mid-game
    board[2][2] = 'black';
    board[2][3] = 'white';
    board[2][4] = 'black';
    board[3][2] = 'white';
    board[3][3] = 'white';
    board[3][4] = 'black';
    board[3][5] = 'black';
    board[4][2] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';
    board[4][5] = 'white';
    board[5][3] = 'black';
    board[5][4] = 'white';
    board[5][5] = 'black';

    return board;
  }

  private createComplexBoard() {
    // More complex position requiring deeper analysis
    const board = Array(8).fill(null).map(() => Array(8).fill(null));

    // Create a complex tactical position
    const pieces = [
      [1, 1, 'black'], [1, 2, 'white'], [1, 3, 'black'], [1, 4, 'white'],
      [2, 1, 'white'], [2, 2, 'black'], [2, 3, 'white'], [2, 4, 'black'], [2, 5, 'white'],
      [3, 1, 'black'], [3, 2, 'white'], [3, 3, 'black'], [3, 4, 'white'], [3, 5, 'black'], [3, 6, 'white'],
      [4, 1, 'white'], [4, 2, 'black'], [4, 3, 'white'], [4, 4, 'black'], [4, 5, 'white'], [4, 6, 'black'],
      [5, 2, 'white'], [5, 3, 'black'], [5, 4, 'white'], [5, 5, 'black'],
      [6, 3, 'black'], [6, 4, 'white'], [6, 5, 'black']
    ];

    for (const [row, col, color] of pieces) {
      (board as any)[row][col] = color;
    }

    return board;
  }
}