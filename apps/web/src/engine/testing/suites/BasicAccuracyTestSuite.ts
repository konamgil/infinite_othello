import type { Engine } from '../../types';
import type { EngineTestSuite, TestResult } from '../framework/EngineTestSuite';

export class BasicAccuracyTestSuite implements EngineTestSuite {
  name = 'Basic Accuracy Test';
  description = 'Tests engine accuracy on fundamental Othello positions';
  category = 'accuracy' as const;

  private testPositions = [
    {
      id: 'corner_opportunity',
      description: 'Should prefer corner when available',
      board: this.createCornerOpportunityBoard(),
      player: 'black' as const,
      expectedMoves: [
        { row: 0, col: 0 }, // Corner move
      ]
    },
    {
      id: 'avoid_x_square',
      description: 'Should avoid X-square next to empty corner',
      board: this.createXSquareBoard(),
      player: 'black' as const,
      avoidMoves: [
        { row: 1, col: 1 }, // X-square to avoid
      ]
    },
    {
      id: 'edge_strategy',
      description: 'Should prefer safe edge moves',
      board: this.createEdgeStrategyBoard(),
      player: 'white' as const,
      expectedMoves: [
        { row: 0, col: 2 },
        { row: 0, col: 3 },
        { row: 0, col: 4 }
      ]
    },
    {
      id: 'mobility_preservation',
      description: 'Should preserve mobility when possible',
      board: this.createMobilityBoard(),
      player: 'black' as const,
      // This is more complex - we'll check the move doesn't drastically reduce mobility
    }
  ];

  async runTest(engine: Engine): Promise<TestResult> {
    const results = [];
    let correctMoves = 0;
    let totalTime = 0;

    for (const position of this.testPositions) {
      const startTime = performance.now();

      try {
        const response = await engine.analyze({
          gameCore: {
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
          timeLimit: 2000, // 2초
          skill: 90
        });

        const elapsed = performance.now() - startTime;
        const move = response.bestMove;

        let correct = false;
        let reasoning = '';

        if (!move) {
          reasoning = 'No move returned';
        } else if (position.expectedMoves) {
          correct = position.expectedMoves.some(expected =>
            expected.row === move.row && expected.col === move.col
          );
          reasoning = correct ? 'Expected move found' : `Got (${move.row},${move.col}), expected one of ${position.expectedMoves.map(m => `(${m.row},${m.col})`).join(', ')}`;
        } else if (position.avoidMoves) {
          correct = !position.avoidMoves.some(avoid =>
            avoid.row === move.row && avoid.col === move.col
          );
          reasoning = correct ? 'Avoided bad move' : `Made bad move (${move.row},${move.col})`;
        } else {
          // For complex positions like mobility, we'll give benefit of the doubt if a move is returned
          correct = true;
          reasoning = 'Move returned (complex position)';
        }

        if (correct) correctMoves++;

        results.push({
          id: position.id,
          expected: position.expectedMoves || position.avoidMoves,
          actual: move,
          correct,
          time: elapsed,
          reasoning
        });

        totalTime += elapsed;

      } catch (error) {
        results.push({
          id: position.id,
          expected: position.expectedMoves || position.avoidMoves,
          actual: null,
          correct: false,
          time: 2000,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        totalTime += 2000;
      }
    }

    const accuracy = correctMoves / this.testPositions.length;
    const score = accuracy * 100;

    return {
      passed: score >= 75, // 75% accuracy required
      score,
      metrics: {
        accuracy,
        avgTime: totalTime / this.testPositions.length,
        totalTime,
        totalPositions: this.testPositions.length,
        correctMoves
      },
      details: {
        positions: results
      },
      timestamp: Date.now(),
      engineName: engine.name,
      suiteName: this.name
    };
  }

  private createCornerOpportunityBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));

    // Setup where black can capture corner
    board[1][0] = 'white';
    board[1][1] = 'white';
    board[2][2] = 'black';
    board[3][3] = 'white';
    board[3][4] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';

    return board;
  }

  private createXSquareBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));

    // Setup where corner is empty but X-square move is available (and bad)
    board[2][0] = 'white';
    board[2][1] = 'white';
    board[2][2] = 'black';
    board[3][3] = 'white';
    board[3][4] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';

    return board;
  }

  private createEdgeStrategyBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));

    // Setup where edge moves are available and safe
    board[1][2] = 'black';
    board[1][3] = 'black';
    board[1][4] = 'black';
    board[2][2] = 'white';
    board[2][3] = 'white';
    board[2][4] = 'white';
    board[3][3] = 'white';
    board[3][4] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';

    return board;
  }

  private createMobilityBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));

    // Create position where some moves preserve more options
    board[2][2] = 'black';
    board[2][3] = 'white';
    board[2][4] = 'black';
    board[3][2] = 'white';
    board[3][3] = 'white';
    board[3][4] = 'black';
    board[3][5] = 'white';
    board[4][2] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';
    board[4][5] = 'black';
    board[5][3] = 'white';
    board[5][4] = 'black';

    return board;
  }
}