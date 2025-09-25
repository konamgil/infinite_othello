
import { describe, it, expect } from 'vitest';
import { orderMoves, KillerMoves, HistoryTable } from './moveOrdering';
import type { Board, Position } from 'shared-types';

const createEmptyBoard = (): Board =>
  Array.from({ length: 8 }, () => Array(8).fill(null));

const makeMove = (row: number, col: number): Position => ({ row, col });

describe('orderMoves TT bias safeguards', () => {
  it('does not force TT move to front in early plies', () => {
    const board = createEmptyBoard();
    const ttMove = makeMove(1, 1); // Poor positional score
    const strongMove = makeMove(2, 2); // Better positional score

    const moves = [ttMove, strongMove];

    const ordered = orderMoves(moves, {
      ply: 4,
      player: 'black',
      board,
      killers: new KillerMoves(),
      history: new HistoryTable(),
      ttBestMove: ttMove
    });

    expect(ordered[0]).toEqual(strongMove);
    expect(ordered[1]).toEqual(ttMove);
  });

  it('applies TT boost on deeper plies', () => {
    const board = createEmptyBoard();
    const ttMove = makeMove(1, 1);
    const strongMove = makeMove(2, 2);

    const moves = [strongMove, ttMove];

    const ordered = orderMoves(moves, {
      ply: 8,
      player: 'black',
      board,
      killers: new KillerMoves(),
      history: new HistoryTable(),
      ttBestMove: ttMove
    });

    expect(ordered[0]).toEqual(ttMove);
  });
});
