import type { Board, Disc, GameState, Move, Player } from "shared-types";

const DIRS: Array<[number, number]> = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

export function createInitialState(): GameState {
  const board: Board = Array.from({ length: 8 }, () => Array<Disc>(8).fill(0));
  board[3][3] = -1; // W
  board[4][4] = -1; // W
  board[3][4] = 1; // B
  board[4][3] = 1; // B
  return { board, current: 1 };
}

function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < 8 && y >= 0 && y < 8;
}

export function nextPlayer(p: Player): Player {
  return (p === 1 ? -1 : 1) as Player;
}

export function isValidMove(state: GameState, move: Move): boolean {
  const { board, current } = state;
  if (!inBounds(move.x, move.y) || board[move.y][move.x] !== 0) return false;
  const opponent: Disc = (current === 1 ? -1 : 1) as Disc;
  for (const [dx, dy] of DIRS) {
    let x = move.x + dx;
    let y = move.y + dy;
    let seenOpp = false;
    while (inBounds(x, y) && board[y][x] === opponent) {
      seenOpp = true;
      x += dx;
      y += dy;
    }
    if (seenOpp && inBounds(x, y) && board[y][x] === current) return true;
  }
  return false;
}

export function getValidMoves(state: GameState): Move[] {
  const moves: Move[] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (state.board[y][x] === 0 && isValidMove(state, { x, y })) {
        moves.push({ x, y });
      }
    }
  }
  return moves;
}

export function applyMove(state: GameState, move: Move): GameState {
  if (!isValidMove(state, move)) return state; // ignore invalid
  const { board, current } = state;
  const next: Board = board.map((row) => row.slice()) as Board;
  const opponent: Disc = (current === 1 ? -1 : 1) as Disc;
  next[move.y][move.x] = current;
  for (const [dx, dy] of DIRS) {
    let x = move.x + dx;
    let y = move.y + dy;
    const toFlip: Array<[number, number]> = [];
    while (inBounds(x, y) && next[y][x] === opponent) {
      toFlip.push([x, y]);
      x += dx;
      y += dy;
    }
    if (toFlip.length && inBounds(x, y) && next[y][x] === current) {
      for (const [fx, fy] of toFlip) next[fy][fx] = current;
    }
  }
  return { board: next, current: nextPlayer(current) };
}

export function score(board: Board): { black: number; white: number } {
  let black = 0,
    white = 0;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (board[y][x] === 1) black++;
      else if (board[y][x] === -1) white++;
    }
  }
  return { black, white };
}

export function hasAnyMove(state: GameState): boolean {
  return getValidMoves(state).length > 0;
}

export function isGameOver(state: GameState): boolean {
  if (hasAnyMove(state)) return false;
  const oppState: GameState = { board: state.board, current: nextPlayer(state.current) };
  return !hasAnyMove(oppState);
}

