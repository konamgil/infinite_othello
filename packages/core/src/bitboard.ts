// public/js/ai/neo/bitboard.ts
// BigInt Bitboard Kernel + Kifu utils + Legacy-compatible Board API
// 기본 1D Uint8Array(길이 64, 0/1/2) 보드를 기반으로 동작함
// 내부적으로 BigInt 비트보드(bp/wp)로 계산하고, flip/undo의 고속 기능(__native)제공

import type { Board, Player, Position } from 'shared-types';

export const FILE_A = 0x0101010101010101n;
export const FILE_H = 0x8080808080808080n;
export const ALL_ONES = 0xffffffffffffffffn;

export const NOT_FILE_A = ALL_ONES ^ FILE_A;
export const NOT_FILE_H = ALL_ONES ^ FILE_H;

// 방향 shift 함수들
export function shiftEast(bb: bigint): bigint { return (bb & NOT_FILE_H) << 1n; }
export function shiftWest(bb: bigint): bigint { return (bb & NOT_FILE_A) >> 1n; }
export function shiftNorth(bb: bigint): bigint { return bb << 8n; }
export function shiftSouth(bb: bigint): bigint { return bb >> 8n; }
export function shiftNorthEast(bb: bigint): bigint { return (bb & NOT_FILE_H) << 9n; }
export function shiftNorthWest(bb: bigint): bigint { return (bb & NOT_FILE_A) << 7n; }
export function shiftSouthEast(bb: bigint): bigint { return (bb & NOT_FILE_H) >> 7n; }
export function shiftSouthWest(bb: bigint): bigint { return (bb & NOT_FILE_A) >> 9n; }

type ShiftFunction = (bb: bigint) => bigint;

const DIRS: ShiftFunction[] = [
  shiftEast, shiftWest, shiftNorth, shiftSouth,
  shiftNorthEast, shiftNorthWest, shiftSouthEast, shiftSouthWest
];

// 비트 연산 유틸리티
export function bitCount(bb: bigint): number {
  let cnt = 0;
  let x = BigInt(bb);
  while (x) { cnt++; x &= x - 1n; }
  return cnt;
}

export function bitIndex(lsb: bigint): number {
  let i = 0n, t = BigInt(lsb);
  while (t > 1n) { t >>= 1n; i++; }
  return Number(i);
}

// 좌표 변환 함수

export function rcToBitIndex(row: number, col: number): number { 
  return (7 - row) * 8 + col; 
}

export function bitIndexToRC(idx: number): [number, number] {
  if (idx < 0 || idx > 63) throw new Error('Invalid bit index: ' + idx);
  const rowFromBottom = (idx / 8) | 0;
  const row = 7 - rowFromBottom;
  const col = idx % 8;
  return [row, col];
}

export function rcToMask(row: number, col: number): bigint { 
  return 1n << BigInt(rcToBitIndex(row, col)); 
}

export function maskToRCList(mask: bigint): Position[] {
  const out: Position[] = [];
  let bb = BigInt(mask);
  while (bb) {
    const lsb = bb & -bb;
    const idx = bitIndex(lsb);
    const [row, col] = bitIndexToRC(idx);
    out.push({ row, col });
    bb ^= lsb;
  }
  return out;
}


// 내부 헬퍼 함수들
function isTypedArray(a: any): a is Uint8Array {
  return a && typeof a.length === 'number' && typeof a.subarray === 'function';
}

function flattenBoard(board2d: Board): Uint8Array {
  const out = new Uint8Array(64);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board2d[r][c];
      out[r * 8 + c] = cell === 'black' ? 1 : cell === 'white' ? 2 : 0;
    }
  }
  return out;
}

function computeBitboards(cells: Uint8Array): { bp: bigint; wp: bigint } {
  let bp = 0n, wp = 0n;
  for (let i = 0; i < 64; i++) {
    const v = cells[i] | 0;
    if (v === 0) continue;
    const r = (i / 8) | 0;
    const c = i % 8;
    const idx = rcToBitIndex(r, c);
    const mask = 1n << BigInt(idx);
    if (v === 1) bp |= mask;
    else if (v === 2) wp |= mask;
  }
  return { bp, wp };
}

// 확장된 보드 타입 (비트보드 캐시 포함)
export interface BitBoard extends Uint8Array {
  _bp?: bigint;  // black pieces bitboard
  _wp?: bigint;  // white pieces bitboard
}

function sideBB(board: BitBoard, side: number): bigint {
  return side === 1 ? board._bp! : board._wp!;
}

function oppBB(board: BitBoard, side: number): bigint {
  return side === 1 ? board._wp! : board._bp!;
}

function setSideBB(board: BitBoard, side: number, bb: bigint): void {
  if (side === 1) board._bp = bb;
  else board._wp = bb;
}

// 공개 API
/** Ensure 1D Uint8Array board and attach bitboards cache. */
export function ensureBoard(board: Board | BitBoard | Uint8Array | any): BitBoard {
  let b: BitBoard;
  if (!isTypedArray(board)) {
    if (Array.isArray(board) && Array.isArray(board[0])) {
      b = flattenBoard(board as Board) as BitBoard;
    } else if (Array.isArray(board)) {
      b = Uint8Array.from(board) as BitBoard;
    } else if (board && board.cells && isTypedArray(board.cells)) {
      b = board.cells as BitBoard;
    } else {
      b = new Uint8Array(64) as BitBoard; // fallback empty
    }
  } else {
    b = board as BitBoard;
  }
  
  if (b._bp === undefined || b._wp === undefined) {
    const { bp, wp } = computeBitboards(b);
    b._bp = bp;
    b._wp = wp;
  }
  return b;
}

function dirMoveGen(p: bigint, o: bigint, shiftFn: ShiftFunction): bigint {
  // Repeatedly expand opponent rays, then one more shift into empty squares
  let m = shiftFn(p) & o;
  // up to 5 more steps sufficient on 8x8
  m |= shiftFn(m) & o;
  m |= shiftFn(m) & o;
  m |= shiftFn(m) & o;
  m |= shiftFn(m) & o;
  m |= shiftFn(m) & o;
  return shiftFn(m);
}

export function getValidMovesMask(side: number, board: Board | BitBoard): bigint {
  const b = ensureBoard(board);
  const p = side === 1 ? b._bp! : b._wp!;
  const o = side === 1 ? b._wp! : b._bp!;
  const empty = ~(p | o) & ALL_ONES;

  let moves = 0n;
  for (const f of DIRS) {
    moves |= dirMoveGen(p, o, f);
  }
  return moves & empty;
}

// Convert Player to numeric side for internal bitboard operations
function playerToSide(player: Player): number {
  return player === 'black' ? 1 : 2;
}

export function getValidMovesBitboard(player: Player, board: Board | BitBoard): Position[] {
  const side = playerToSide(player);
  const mask = getValidMovesMask(side, board);
  return maskToRCList(mask);
}

function flipsForMove(p: bigint, o: bigint, moveMask: bigint): bigint {
  let flips = 0n;
  // For each dir, accumulate opponent until we meet own piece
  let x: bigint, cap: bigint;
  
  // East
  x = shiftEast(moveMask); cap = 0n;
  while (x && (x & o)) { cap |= x; x = shiftEast(x); }
  if (x & p) flips |= cap;
  
  // West
  x = shiftWest(moveMask); cap = 0n;
  while (x && (x & o)) { cap |= x; x = shiftWest(x); }
  if (x & p) flips |= cap;
  
  // North
  x = shiftNorth(moveMask); cap = 0n;
  while (x && (x & o)) { cap |= x; x = shiftNorth(x); }
  if (x & p) flips |= cap;
  
  // South
  x = shiftSouth(moveMask); cap = 0n;
  while (x && (x & o)) { cap |= x; x = shiftSouth(x); }
  if (x & p) flips |= cap;
  
  // NE
  x = shiftNorthEast(moveMask); cap = 0n;
  while (x && (x & o)) { cap |= x; x = shiftNorthEast(x); }
  if (x & p) flips |= cap;
  
  // NW
  x = shiftNorthWest(moveMask); cap = 0n;
  while (x && (x & o)) { cap |= x; x = shiftNorthWest(x); }
  if (x & p) flips |= cap;
  
  // SE
  x = shiftSouthEast(moveMask); cap = 0n;
  while (x && (x & o)) { cap |= x; x = shiftSouthEast(x); }
  if (x & p) flips |= cap;
  
  // SW
  x = shiftSouthWest(moveMask); cap = 0n;
  while (x && (x & o)) { cap |= x; x = shiftSouthWest(x); }
  if (x & p) flips |= cap;

  return flips;
}

export function isValidMoveBitboard(row: number, col: number, player: Player, board: Board | BitBoard): boolean {
  const side = playerToSide(player);
  const b = ensureBoard(board);
  const moveMask = rcToMask(row, col);
  const p = side === 1 ? b._bp! : b._wp!;
  const o = side === 1 ? b._wp! : b._bp!;
  if ((moveMask & (p | o)) !== 0n) return false;
  const flips = flipsForMove(p, o, moveMask);
  return flips !== 0n;
}

export interface MoveToken {
  __native: true;
  side: number;
  row: number;
  col: number;
  moveMask: bigint;
  flips: bigint;
  prevBP: bigint;
  prevWP: bigint;
}

export function flipPieces(board: Board | BitBoard, row: number, col: number, player: Player): MoveToken | undefined {
  const side = playerToSide(player);
  const b = ensureBoard(board);
  const moveMask = rcToMask(row, col);
  const p = side === 1 ? b._bp! : b._wp!;
  const o = side === 1 ? b._wp! : b._bp!;
  if ((moveMask & (p | o)) !== 0n) return undefined; // occupied
  const flips = flipsForMove(p, o, moveMask);
  if (!flips) return undefined; // illegal

  const prevBP = b._bp!;
  const prevWP = b._wp!;

  // apply
  const newP = p | moveMask | flips;
  const newO = o & ~flips;
  if (side === 1) { b._bp = newP; b._wp = newO; }
  else { b._wp = newP; b._bp = newO; }

  // update cells only for changed bits
  const changeMask = flips | moveMask;
  let m = changeMask;
  while (m) {
    const lsb = m & -m;
    const idx = bitIndex(lsb);
    b[idx] = side;
    m ^= lsb;
  }

  const token: MoveToken = { __native: true, side, row, col, moveMask, flips, prevBP, prevWP };
  return token;
}

export function undoMove(board: Board | BitBoard, token: MoveToken, _sideIgnored?: number): void {
  const b = ensureBoard(board);
  if (!token || !token.__native) return;
  // revert bitboards
  b._bp = token.prevBP;
  b._wp = token.prevWP;

  // revert cells only where changed (move cell + flips)
  const changeMask = token.flips | token.moveMask;
  let m = changeMask;
  while (m) {
    const lsb = m & -m;
    const idx = bitIndex(lsb);
    // Determine original color from prev bitboards
    const bit = 1n << BigInt(idx);
    const wasBlack = (token.prevBP & bit) !== 0n;
    const wasWhite = (token.prevWP & bit) !== 0n;
    b[idx] = wasBlack ? 1 : wasWhite ? 2 : 0;
    m ^= lsb;
  }
}

export function emptiesCount(board: Board | BitBoard): number {
  const b = ensureBoard(board);
  const occ = b._bp! | b._wp!;
  return bitCount((~occ) & ALL_ONES);
}

// Deterministic lightweight hash
export function computeZobristHash(board: Board | BitBoard, player: Player): number {
  const side = playerToSide(player);
  const b = ensureBoard(board);
  // simple mixing of bigints; not true zobrist, but fast and stable
  const prime1 = 0x100000001b3n;
  const prime2 = 0x100000001b5n;
  let h = 0xcbf29ce484222325n;
  h ^= (b._bp! * prime1) & ALL_ONES; h *= prime2;
  h ^= (b._wp! * prime2) & ALL_ONES; h *= prime1;
  h ^= BigInt(side & 3);
  h *= 0x100000001b7n;
  return Number(h & 0xffffffffffffffffn);
}
