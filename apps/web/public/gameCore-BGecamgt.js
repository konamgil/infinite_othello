const FILE_A = 0x0101010101010101n;
const FILE_H = 0x8080808080808080n;
const ALL_ONES = 0xffffffffffffffffn;
const NOT_FILE_A = ALL_ONES ^ FILE_A;
const NOT_FILE_H = ALL_ONES ^ FILE_H;
function shiftEast(bb) {
  return (bb & NOT_FILE_H) << 1n;
}
function shiftWest(bb) {
  return (bb & NOT_FILE_A) >> 1n;
}
function shiftNorth(bb) {
  return bb << 8n;
}
function shiftSouth(bb) {
  return bb >> 8n;
}
function shiftNorthEast(bb) {
  return (bb & NOT_FILE_H) << 9n;
}
function shiftNorthWest(bb) {
  return (bb & NOT_FILE_A) << 7n;
}
function shiftSouthEast(bb) {
  return (bb & NOT_FILE_H) >> 7n;
}
function shiftSouthWest(bb) {
  return (bb & NOT_FILE_A) >> 9n;
}
const DIRS = [
  shiftEast,
  shiftWest,
  shiftNorth,
  shiftSouth,
  shiftNorthEast,
  shiftNorthWest,
  shiftSouthEast,
  shiftSouthWest
];
function bitIndex(lsb) {
  let i = 0n, t = BigInt(lsb);
  while (t > 1n) {
    t >>= 1n;
    i++;
  }
  return Number(i);
}
function rcToBitIndex(row, col) {
  return (7 - row) * 8 + col;
}
function bitIndexToRC(idx) {
  if (idx < 0 || idx > 63) throw new Error("Invalid bit index: " + idx);
  const rowFromBottom = idx / 8 | 0;
  const row = 7 - rowFromBottom;
  const col = idx % 8;
  return [row, col];
}
function rcToMask(row, col) {
  return 1n << BigInt(rcToBitIndex(row, col));
}
function maskToRCList(mask) {
  const out = [];
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
function isTypedArray(a) {
  return a && typeof a.length === "number" && typeof a.subarray === "function";
}
function flattenBoard(board2d) {
  const out = new Uint8Array(64);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board2d[r][c];
      out[r * 8 + c] = cell === "black" ? 1 : cell === "white" ? 2 : 0;
    }
  }
  return out;
}
function computeBitboards(cells) {
  let bp = 0n, wp = 0n;
  for (let i = 0; i < 64; i++) {
    const v = cells[i] | 0;
    if (v === 0) continue;
    const r = i / 8 | 0;
    const c = i % 8;
    const idx = rcToBitIndex(r, c);
    const mask = 1n << BigInt(idx);
    if (v === 1) bp |= mask;
    else if (v === 2) wp |= mask;
  }
  return { bp, wp };
}
function ensureBoard(board) {
  let b;
  if (!isTypedArray(board)) {
    if (Array.isArray(board) && Array.isArray(board[0])) {
      b = flattenBoard(board);
    } else if (Array.isArray(board)) {
      b = Uint8Array.from(board);
    } else if (board && board.cells && isTypedArray(board.cells)) {
      b = board.cells;
    } else {
      b = new Uint8Array(64);
    }
  } else {
    b = board;
  }
  if (b._bp === void 0 || b._wp === void 0) {
    const { bp, wp } = computeBitboards(b);
    b._bp = bp;
    b._wp = wp;
  }
  return b;
}
function dirMoveGen(p, o, shiftFn) {
  let m = shiftFn(p) & o;
  m |= shiftFn(m) & o;
  m |= shiftFn(m) & o;
  m |= shiftFn(m) & o;
  m |= shiftFn(m) & o;
  m |= shiftFn(m) & o;
  return shiftFn(m);
}
function getValidMovesMask(side, board) {
  const b = ensureBoard(board);
  const p = side === 1 ? b._bp : b._wp;
  const o = side === 1 ? b._wp : b._bp;
  const empty = ~(p | o) & ALL_ONES;
  let moves = 0n;
  for (const f of DIRS) {
    moves |= dirMoveGen(p, o, f);
  }
  return moves & empty;
}
function playerToSide(player) {
  return player === "black" ? 1 : 2;
}
function getValidMovesBitboard(player, board) {
  const side = playerToSide(player);
  const mask = getValidMovesMask(side, board);
  return maskToRCList(mask);
}
function flipsForMove(p, o, moveMask) {
  let flips = 0n;
  let x, cap;
  x = shiftEast(moveMask);
  cap = 0n;
  while (x && x & o) {
    cap |= x;
    x = shiftEast(x);
  }
  if (x & p) flips |= cap;
  x = shiftWest(moveMask);
  cap = 0n;
  while (x && x & o) {
    cap |= x;
    x = shiftWest(x);
  }
  if (x & p) flips |= cap;
  x = shiftNorth(moveMask);
  cap = 0n;
  while (x && x & o) {
    cap |= x;
    x = shiftNorth(x);
  }
  if (x & p) flips |= cap;
  x = shiftSouth(moveMask);
  cap = 0n;
  while (x && x & o) {
    cap |= x;
    x = shiftSouth(x);
  }
  if (x & p) flips |= cap;
  x = shiftNorthEast(moveMask);
  cap = 0n;
  while (x && x & o) {
    cap |= x;
    x = shiftNorthEast(x);
  }
  if (x & p) flips |= cap;
  x = shiftNorthWest(moveMask);
  cap = 0n;
  while (x && x & o) {
    cap |= x;
    x = shiftNorthWest(x);
  }
  if (x & p) flips |= cap;
  x = shiftSouthEast(moveMask);
  cap = 0n;
  while (x && x & o) {
    cap |= x;
    x = shiftSouthEast(x);
  }
  if (x & p) flips |= cap;
  x = shiftSouthWest(moveMask);
  cap = 0n;
  while (x && x & o) {
    cap |= x;
    x = shiftSouthWest(x);
  }
  if (x & p) flips |= cap;
  return flips;
}
function isValidMoveBitboard(row, col, player, board) {
  const side = playerToSide(player);
  const b = ensureBoard(board);
  const moveMask = rcToMask(row, col);
  const p = side === 1 ? b._bp : b._wp;
  const o = side === 1 ? b._wp : b._bp;
  if ((moveMask & (p | o)) !== 0n) return false;
  const flips = flipsForMove(p, o, moveMask);
  return flips !== 0n;
}
function flipPieces(board, row, col, player) {
  const side = playerToSide(player);
  const b = ensureBoard(board);
  const moveMask = rcToMask(row, col);
  const p = side === 1 ? b._bp : b._wp;
  const o = side === 1 ? b._wp : b._bp;
  if ((moveMask & (p | o)) !== 0n) return void 0;
  const flips = flipsForMove(p, o, moveMask);
  if (!flips) return void 0;
  const prevBP = b._bp;
  const prevWP = b._wp;
  const newP = p | moveMask | flips;
  const newO = o & ~flips;
  if (side === 1) {
    b._bp = newP;
    b._wp = newO;
  } else {
    b._wp = newP;
    b._bp = newO;
  }
  const changeMask = flips | moveMask;
  let m = changeMask;
  while (m) {
    const lsb = m & -m;
    const idx = bitIndex(lsb);
    b[idx] = side;
    m ^= lsb;
  }
  const token = { __native: true, side, row, col, moveMask, flips, prevBP, prevWP };
  return token;
}

function boardToBitBoard(board) {
  const bitBoard = new Uint8Array(64);
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board[row][col];
      const index = row * 8 + col;
      if (cell === "black") {
        bitBoard[index] = 1;
      } else if (cell === "white") {
        bitBoard[index] = 2;
      } else {
        bitBoard[index] = 0;
      }
    }
  }
  return bitBoard;
}
function bitBoardToBoard(bitBoard) {
  const board = [];
  for (let row = 0; row < 8; row++) {
    const rowCells = [];
    for (let col = 0; col < 8; col++) {
      const index = row * 8 + col;
      const value = bitBoard[index];
      if (value === 1) {
        rowCells.push("black");
      } else if (value === 2) {
        rowCells.push("white");
      } else {
        rowCells.push(null);
      }
    }
    board.push(rowCells);
  }
  return board;
}
function getValidMoves(board, player) {
  const bitBoard = ensureBoard(boardToBitBoard(board));
  return getValidMovesBitboard(player, bitBoard);
}
function makeMove(gameCore, position) {
  if (gameCore.status !== "playing") {
    return {
      success: false,
      reason: "game_finished",
      message: "Game is not in playing state"
    };
  }
  if (gameCore.currentPlayer === "black" || gameCore.currentPlayer === "white") ; else {
    return {
      success: false,
      reason: "not_your_turn",
      message: "Invalid current player"
    };
  }
  const bitBoard = ensureBoard(boardToBitBoard(gameCore.board));
  if (!isValidMoveBitboard(position.row, position.col, gameCore.currentPlayer, bitBoard)) {
    if (bitBoard[position.row * 8 + position.col] !== 0) {
      return {
        success: false,
        reason: "occupied",
        message: "Position is already occupied"
      };
    } else {
      return {
        success: false,
        reason: "no_captures",
        message: "Move would not capture any pieces"
      };
    }
  }
  const moveToken = flipPieces(bitBoard, position.row, position.col, gameCore.currentPlayer);
  if (!moveToken) {
    return {
      success: false,
      reason: "invalid_position",
      message: "Failed to apply move"
    };
  }
  const newBoard = bitBoardToBoard(bitBoard);
  const capturedCells = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (gameCore.board[row][col] !== newBoard[row][col] && !(row === position.row && col === position.col)) {
        capturedCells.push({ row, col });
      }
    }
  }
  const move = {
    row: position.row,
    col: position.col,
    player: gameCore.currentPlayer,
    capturedCells,
    timestamp: Date.now()
  };
  const newScore = calculateScore(newBoard);
  const nextPlayer = gameCore.currentPlayer === "black" ? "white" : "black";
  const nextValidMoves = getValidMoves(newBoard, nextPlayer);
  let actualNextPlayer = nextPlayer;
  let finalValidMoves = nextValidMoves;
  let gameStatus = "playing";
  if (nextValidMoves.length === 0) {
    const currentPlayerMoves = getValidMoves(newBoard, gameCore.currentPlayer);
    if (currentPlayerMoves.length === 0) {
      gameStatus = "finished";
      finalValidMoves = [];
    } else {
      actualNextPlayer = gameCore.currentPlayer;
      finalValidMoves = currentPlayerMoves;
    }
  }
  const newGameCore = {
    ...gameCore,
    board: newBoard,
    currentPlayer: actualNextPlayer,
    validMoves: finalValidMoves,
    score: newScore,
    status: gameStatus,
    moveHistory: [...gameCore.moveHistory, move],
    canUndo: true,
    canRedo: false
  };
  return {
    success: true,
    move,
    newGameCore,
    capturedCells
  };
}
function calculateScore(board) {
  let black = 0;
  let white = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board[row][col];
      if (cell === "black") black++;
      else if (cell === "white") white++;
    }
  }
  return { black, white };
}

export { bitBoardToBoard, boardToBitBoard, calculateScore, getValidMoves, makeMove };
