// public/js/ai/classic/bitboard.js
// Bitboard helpers + Kifu/UI <-> (row,col) <-> bit index/mask 蹂???좏떥 ?듯빀??

export const FILE_A = 0x0101010101010101n;
export const FILE_H = 0x8080808080808080n;
export const ALL_ONES = 0xffffffffffffffffn;

export const NOT_FILE_A = ALL_ONES ^ FILE_A;
export const NOT_FILE_H = ALL_ONES ^ FILE_H;

/** Shift bits one square east (left from white's perspective). */
export function shiftEast(bb)  { return (bb & NOT_FILE_H) << 1n; }
/** Shift bits one square west. */
export function shiftWest(bb)  { return (bb & NOT_FILE_A) >> 1n; }
/** Shift bits one square north. */
export function shiftNorth(bb) { return bb << 8n; }
/** Shift bits one square south. */
export function shiftSouth(bb) { return bb >> 8n; }
/** Shift bits one square to the north-east. */
export function shiftNorthEast(bb) { return (bb & NOT_FILE_H) << 9n; }
/** Shift bits one square to the north-west. */
export function shiftNorthWest(bb) { return (bb & NOT_FILE_A) << 7n; }
/** Shift bits one square to the south-east. */
export function shiftSouthEast(bb) { return (bb & NOT_FILE_H) >> 7n; }
/** Shift bits one square to the south-west. */
export function shiftSouthWest(bb) { return (bb & NOT_FILE_A) >> 9n; }

/** Count set bits in a 64-bit board representation. */
export function bitCount(bb) {
  let cnt = 0;
  let x = BigInt(bb);
  while (x) { cnt++; x &= x - 1n; }
  return cnt;
}

/** Return index (0..63) of least significant bit. */
export function bitIndex(lsb) {
  let i = 0n, t = BigInt(lsb);
  while (t > 1n) { t >>= 1n; i++; }
  return Number(i);
}

const INDEX_MASKS = Array.from({ length: 64 }, (_, i) => 1n << BigInt(i));

export const ADJACENT_MASKS = INDEX_MASKS.map((mask) =>
  shiftEast(mask)  |
  shiftWest(mask)  |
  shiftNorth(mask) |
  shiftSouth(mask) |
  shiftNorthEast(mask) |
  shiftNorthWest(mask) |
  shiftSouthEast(mask) |
  shiftSouthWest(mask)
);

// UI (row,col) -> "A1" (row,col: 0..7, row???꾩뿉???꾨옒濡?利앷?)
/** Convert row/col coordinates to kifu notation like "A1". */
export function toKifu(row, col) {
  return String.fromCharCode(65 + col) + (row + 1);
}

// "A1" -> (row,col)
/** Parse kifu notation into row/col coordinates. */
export function fromKifu(s) {
  const t = String(s).trim().toUpperCase();
  const col = t.charCodeAt(0) - 65;            // 'A'..'H' -> 0..7
  const row = parseInt(t.slice(1), 10) - 1;     // '1'..'8' -> 0..7
  if (col < 0 || col > 7 || row < 0 || row > 7) {
    throw new Error('Invalid kifu: ' + s);
  }
  return [row, col];
}

// (row,col) -> bit index(0..63), ?대? bit0=A1=醫뚰븯
/** Convert row/col to internal bit index. */
export function rcToBitIndex(row, col) {
  return (7 - row) * 8 + col;
}

// bit index(0..63) -> (row,col)
/** Convert internal bit index back to row/col. */
export function bitIndexToRC(idx) {
  if (idx < 0 || idx > 63) throw new Error('Invalid bit index: ' + idx);
  const rowFromBottom = (idx / 8) | 0;
  const row = 7 - rowFromBottom;
  const col = idx % 8;
  return [row, col];
}

// (row,col) -> BigInt mask
/** Create a bit mask for the given row/col coordinate. */
export function rcToMask(row, col) {
  return 1n << BigInt(rcToBitIndex(row, col));
}

// mask(BigInt) -> [(row,col), ...] : set 鍮꾪듃留??쒗쉶 (鍮좊쫫)
/** Convert a bit mask to a list of row/col pairs for each set bit. */
export function maskToRCList(mask) {
  const out = [];
  let bb = BigInt(mask);
  while (bb) {
    const lsb = bb & -bb;
    const idx = bitIndex(lsb);
    out.push(bitIndexToRC(idx));
    bb ^= lsb; // pop lsb
  }
  return out;
}

/** Backwards-compatible wrapper returning coordinates for set bits. */
export function maskToCoords(mask) {
  return maskToRCList(mask);
}

/** Parse kifu text into move object containing row/col and mask. */
export function parseMove(kifu) {
  const [row, col] = fromKifu(kifu);
  const idx = rcToBitIndex(row, col);
  const mask = 1n << BigInt(idx);
  return { row, col, idx, mask, kifu: toKifu(row, col) };
}

const _default = {
  // constants
  FILE_A, FILE_H, ALL_ONES, NOT_FILE_A, NOT_FILE_H,
  // shifts
  shiftEast, shiftWest, shiftNorth, shiftSouth,
  shiftNorthEast, shiftNorthWest, shiftSouthEast, shiftSouthWest,
  // bit ops & masks
  bitCount, bitIndex, ADJACENT_MASKS,
  // coords/kifu
  toKifu, fromKifu, rcToBitIndex, bitIndexToRC, rcToMask,
  maskToRCList, maskToCoords, parseMove,
};
export default _default;

