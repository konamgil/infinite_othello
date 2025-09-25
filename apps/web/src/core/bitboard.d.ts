import type { Board, Player, Position } from '../types';
export declare const FILE_A = 72340172838076673n;
export declare const FILE_H = 9259542123273814144n;
export declare const ALL_ONES = 18446744073709551615n;
export declare const NOT_FILE_A: bigint;
export declare const NOT_FILE_H: bigint;
export declare function shiftEast(bb: bigint): bigint;
export declare function shiftWest(bb: bigint): bigint;
export declare function shiftNorth(bb: bigint): bigint;
export declare function shiftSouth(bb: bigint): bigint;
export declare function shiftNorthEast(bb: bigint): bigint;
export declare function shiftNorthWest(bb: bigint): bigint;
export declare function shiftSouthEast(bb: bigint): bigint;
export declare function shiftSouthWest(bb: bigint): bigint;
export declare function bitCount(bb: bigint): number;
export declare function bitIndex(lsb: bigint): number;
export declare function rcToBitIndex(row: number, col: number): number;
export declare function bitIndexToRC(idx: number): [number, number];
export declare function rcToMask(row: number, col: number): bigint;
export declare function maskToRCList(mask: bigint): Position[];
export interface BitBoard extends Uint8Array {
    _bp?: bigint;
    _wp?: bigint;
}
/** Ensure 1D Uint8Array board and attach bitboards cache. */
export declare function ensureBoard(board: Board | BitBoard | Uint8Array | any): BitBoard;
export declare function getValidMovesMask(side: number, board: Board | BitBoard): bigint;
export declare function getValidMovesBitboard(player: Player, board: Board | BitBoard): Position[];
export declare function isValidMoveBitboard(row: number, col: number, player: Player, board: Board | BitBoard): boolean;
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
export declare function flipPieces(board: Board | BitBoard, row: number, col: number, player: Player): MoveToken | undefined;
export declare function undoMove(board: Board | BitBoard, token: MoveToken, _sideIgnored?: number): void;
export declare function emptiesCount(board: Board | BitBoard): number;
export declare function computeZobristHash(board: Board | BitBoard, player: Player): number;
