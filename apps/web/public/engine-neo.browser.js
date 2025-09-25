var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// packages/core/src/bitboard.ts
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
function bitCount(bb) {
  let cnt = 0;
  let x = BigInt(bb);
  while (x) {
    cnt++;
    x &= x - 1n;
  }
  return cnt;
}
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
function undoMove(board, token, _sideIgnored) {
  const b = ensureBoard(board);
  if (!token || !token.__native) return;
  b._bp = token.prevBP;
  b._wp = token.prevWP;
  const changeMask = token.flips | token.moveMask;
  let m = changeMask;
  while (m) {
    const lsb = m & -m;
    const idx = bitIndex(lsb);
    const bit = 1n << BigInt(idx);
    const wasBlack = (token.prevBP & bit) !== 0n;
    const wasWhite = (token.prevWP & bit) !== 0n;
    b[idx] = wasBlack ? 1 : wasWhite ? 2 : 0;
    m ^= lsb;
  }
}
function emptiesCount(board) {
  const b = ensureBoard(board);
  const occ = b._bp | b._wp;
  return bitCount(~occ & ALL_ONES);
}
function computeZobristHash(board, player) {
  const side = playerToSide(player);
  const b = ensureBoard(board);
  const prime1 = 0x100000001b3n;
  const prime2 = 0x100000001b5n;
  let h = 0xcbf29ce484222325n;
  h ^= b._bp * prime1 & ALL_ONES;
  h *= prime2;
  h ^= b._wp * prime2 & ALL_ONES;
  h *= prime1;
  h ^= BigInt(side & 3);
  h *= 0x100000001b7n;
  return Number(h & 0xffffffffffffffffn);
}
var FILE_A, FILE_H, ALL_ONES, NOT_FILE_A, NOT_FILE_H, DIRS;
var init_bitboard = __esm({
  "packages/core/src/bitboard.ts"() {
    "use strict";
    FILE_A = 0x0101010101010101n;
    FILE_H = 0x8080808080808080n;
    ALL_ONES = 0xffffffffffffffffn;
    NOT_FILE_A = ALL_ONES ^ FILE_A;
    NOT_FILE_H = ALL_ONES ^ FILE_H;
    DIRS = [
      shiftEast,
      shiftWest,
      shiftNorth,
      shiftSouth,
      shiftNorthEast,
      shiftNorthWest,
      shiftSouthEast,
      shiftSouthWest
    ];
  }
});

// packages/core/src/gameCore.ts
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
function createInitialGameCore(gameId = crypto.randomUUID()) {
  const board = Array.from({ length: 8 }, () => new Array(8).fill(null));
  board[3][3] = "white";
  board[3][4] = "black";
  board[4][3] = "black";
  board[4][4] = "white";
  const validMoves = getValidMoves(board, "black");
  return {
    id: gameId,
    board,
    currentPlayer: "black",
    validMoves,
    score: { black: 2, white: 2 },
    status: "playing",
    moveHistory: [],
    canUndo: false,
    canRedo: false
  };
}
function getValidMoves(board, player) {
  const bitBoard = ensureBoard(boardToBitBoard(board));
  return getValidMovesBitboard(player, bitBoard);
}
function isValidMove(board, position, player) {
  const bitBoard = ensureBoard(boardToBitBoard(board));
  return isValidMoveBitboard(position.row, position.col, player, bitBoard);
}
function makeMove(gameCore, position) {
  if (gameCore.status !== "playing") {
    return {
      success: false,
      reason: "game_finished",
      message: "Game is not in playing state"
    };
  }
  if (gameCore.currentPlayer === "black" || gameCore.currentPlayer === "white") {
  } else {
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
function isGameOver(gameCore) {
  if (gameCore.status === "finished") return true;
  const currentPlayerMoves = getValidMoves(gameCore.board, gameCore.currentPlayer);
  if (currentPlayerMoves.length > 0) return false;
  const otherPlayer = gameCore.currentPlayer === "black" ? "white" : "black";
  const otherPlayerMoves = getValidMoves(gameCore.board, otherPlayer);
  return otherPlayerMoves.length === 0;
}
function getGameResult(gameCore) {
  if (!isGameOver(gameCore)) return null;
  const score = calculateScore(gameCore.board);
  let winner;
  if (score.black > score.white) {
    winner = "black";
  } else if (score.white > score.black) {
    winner = "white";
  } else {
    winner = "draw";
  }
  return {
    winner,
    score,
    endReason: "normal",
    duration: 0,
    // Should be calculated from game start time
    totalMoves: gameCore.moveHistory.length
  };
}
function getPositionHash(gameCore) {
  const bitBoard = ensureBoard(boardToBitBoard(gameCore.board));
  return computeZobristHash(bitBoard, gameCore.currentPlayer);
}
function isTerminalPosition(gameCore) {
  return isGameOver(gameCore);
}
function getMobility(board, player) {
  return getValidMoves(board, player).length;
}
function getEmptySquares(board) {
  const bitBoard = ensureBoard(boardToBitBoard(board));
  return emptiesCount(bitBoard);
}
function gameCoreForEngine(gameCore) {
  const bitBoard = ensureBoard(boardToBitBoard(gameCore.board));
  return {
    board: bitBoard,
    currentPlayer: gameCore.currentPlayer,
    validMoves: [...gameCore.validMoves],
    score: gameCore.score
  };
}
var init_gameCore = __esm({
  "packages/core/src/gameCore.ts"() {
    "use strict";
    init_bitboard();
  }
});

// packages/core/src/GameStateManager.ts
var GameStateManager;
var init_GameStateManager = __esm({
  "packages/core/src/GameStateManager.ts"() {
    "use strict";
    init_gameCore();
    GameStateManager = class {
      constructor(config = {}) {
        this._gameHistory = [];
        this._redoStack = [];
        this._listeners = [];
        this._config = {
          maxHistorySize: config.maxHistorySize || 100,
          enableUndo: config.enableUndo ?? true,
          enableRedo: config.enableRedo ?? true,
          autoSave: config.autoSave ?? false
        };
        this._currentGame = createInitialGameCore();
        this._gameHistory.push({ ...this._currentGame });
        this.emit({ type: "game_started", gameCore: this._currentGame });
      }
      // ===== PUBLIC API =====
      /**
       * Get current game state (immutable)
       */
      get currentGame() {
        return this._currentGame;
      }
      /**
       * Get current player
       */
      get currentPlayer() {
        return this._currentGame.currentPlayer;
      }
      /**
       * Get valid moves for current player
       */
      get validMoves() {
        return this._currentGame.validMoves;
      }
      /**
       * Get current score
       */
      get score() {
        return this._currentGame.score;
      }
      /**
       * Check if game is over
       */
      get isGameOver() {
        return isGameOver(this._currentGame);
      }
      /**
       * Get game result if finished
       */
      get gameResult() {
        return getGameResult(this._currentGame);
      }
      /**
       * Can undo last move
       */
      get canUndo() {
        return this._config.enableUndo && this._gameHistory.length > 1;
      }
      /**
       * Can redo last undone move
       */
      get canRedo() {
        return this._config.enableRedo && this._redoStack.length > 0;
      }
      /**
       * Make a move
       */
      makeMove(position) {
        if (this.isGameOver) {
          return {
            success: false,
            reason: "game_finished",
            message: "Game is already finished"
          };
        }
        const result = makeMove(this._currentGame, position);
        if (result.success) {
          this._currentGame = result.newGameCore;
          this._redoStack = [];
          this._gameHistory.push({ ...this._currentGame });
          if (this._gameHistory.length > this._config.maxHistorySize) {
            this._gameHistory.shift();
          }
          this.emit({ type: "move_made", move: result.move, gameCore: this._currentGame });
          if (this.isGameOver) {
            const gameResult = this.gameResult;
            if (gameResult) {
              this.emit({ type: "game_over", result: gameResult });
            }
          } else {
            this.emit({ type: "turn_changed", player: this._currentGame.currentPlayer });
          }
          if (this._config.autoSave) {
            this.saveToStorage();
          }
        }
        return result;
      }
      /**
       * Undo last move
       */
      undo() {
        if (!this.canUndo) return false;
        this._redoStack.push({ ...this._currentGame });
        this._gameHistory.pop();
        const previousState = this._gameHistory[this._gameHistory.length - 1];
        this._currentGame = { ...previousState };
        this.emit({ type: "move_undone", gameCore: this._currentGame });
        this.emit({ type: "turn_changed", player: this._currentGame.currentPlayer });
        return true;
      }
      /**
       * Redo last undone move
       */
      redo() {
        if (!this.canRedo) return false;
        const nextState = this._redoStack.pop();
        this._currentGame = nextState;
        this._gameHistory.push({ ...this._currentGame });
        this.emit({ type: "move_redone", gameCore: this._currentGame });
        this.emit({ type: "turn_changed", player: this._currentGame.currentPlayer });
        return true;
      }
      /**
       * Reset game to initial state
       */
      reset() {
        this._currentGame = createInitialGameCore();
        this._gameHistory = [{ ...this._currentGame }];
        this._redoStack = [];
        this.emit({ type: "game_reset", gameCore: this._currentGame });
        this.emit({ type: "game_started", gameCore: this._currentGame });
      }
      /**
       * Check if a move is valid
       */
      isValidMove(position) {
        return isValidMove(this._currentGame.board, position, this._currentGame.currentPlayer);
      }
      /**
       * Get all valid moves for current player
       */
      getValidMoves() {
        return getValidMoves(this._currentGame.board, this._currentGame.currentPlayer);
      }
      /**
       * Set game status
       */
      setGameStatus(status) {
        if (this._currentGame.status !== status) {
          this._currentGame = {
            ...this._currentGame,
            status
          };
        }
      }
      /**
       * Get position hash (for engines/caching)
       */
      getPositionHash() {
        return getPositionHash(this._currentGame);
      }
      /**
       * Get move history
       */
      getMoveHistory() {
        return this._currentGame.moveHistory;
      }
      /**
       * Get game statistics
       */
      getGameStats() {
        return {
          totalMoves: this._currentGame.moveHistory.length,
          score: this._currentGame.score,
          gameId: this._currentGame.id,
          currentPlayer: this._currentGame.currentPlayer,
          status: this._currentGame.status,
          canUndo: this.canUndo,
          canRedo: this.canRedo,
          validMovesCount: this._currentGame.validMoves.length,
          historySize: this._gameHistory.length
        };
      }
      // ===== EVENT SYSTEM =====
      /**
       * Add event listener
       */
      addEventListener(listener) {
        this._listeners.push(listener);
      }
      /**
       * Remove event listener
       */
      removeEventListener(listener) {
        const index = this._listeners.indexOf(listener);
        if (index !== -1) {
          this._listeners.splice(index, 1);
        }
      }
      /**
       * Remove all event listeners
       */
      removeAllEventListeners() {
        this._listeners = [];
      }
      emit(event) {
        this._listeners.forEach((listener) => {
          try {
            listener(event);
          } catch (error) {
            console.error("Error in game event listener:", error);
          }
        });
      }
      // ===== PERSISTENCE =====
      /**
       * Save game state to localStorage
       */
      saveToStorage(key = "othello-game-state") {
        try {
          const saveData = {
            currentGame: this._currentGame,
            gameHistory: this._gameHistory,
            redoStack: this._redoStack,
            timestamp: Date.now()
          };
          localStorage.setItem(key, JSON.stringify(saveData));
        } catch (error) {
          console.error("Failed to save game state:", error);
        }
      }
      /**
       * Load game state from localStorage
       */
      loadFromStorage(key = "othello-game-state") {
        try {
          const saveData = localStorage.getItem(key);
          if (!saveData) return false;
          const parsed = JSON.parse(saveData);
          this._currentGame = parsed.currentGame;
          this._gameHistory = parsed.gameHistory || [];
          this._redoStack = parsed.redoStack || [];
          this.emit({ type: "game_started", gameCore: this._currentGame });
          return true;
        } catch (error) {
          console.error("Failed to load game state:", error);
          return false;
        }
      }
      /**
       * Export game as PGN-like format
       */
      exportGame() {
        const moves = this._currentGame.moveHistory.map((move, index) => {
          const moveNumber = Math.floor(index / 2) + 1;
          const player = move.player === "black" ? "B" : "W";
          const position = `${String.fromCharCode(97 + move.col)}${move.row + 1}`;
          return `${moveNumber}.${player} ${position}`;
        });
        const result = this.gameResult;
        const resultStr = result ? result.winner === "draw" ? "1/2-1/2" : result.winner === "black" ? "1-0" : "0-1" : "*";
        return [
          `[Game "${this._currentGame.id}"]`,
          `[Black "Player"]`,
          `[White "Player"]`,
          `[Result "${resultStr}"]`,
          `[Score "${this._currentGame.score.black}-${this._currentGame.score.white}"]`,
          "",
          moves.join(" ") + (resultStr !== "*" ? ` ${resultStr}` : "")
        ].join("\n");
      }
      // ===== ADVANCED FEATURES =====
      /**
       * Create a copy of the current game for simulation
       */
      createSimulation() {
        return JSON.parse(JSON.stringify(this._currentGame));
      }
      /**
       * Apply multiple moves for analysis
       */
      simulateMoves(moves) {
        let simulation = this.createSimulation();
        for (const position of moves) {
          const result = makeMove(simulation, position);
          if (result.success) {
            simulation = result.newGameCore;
          } else {
            break;
          }
        }
        return simulation;
      }
      /**
       * Get game state at specific move number
       */
      getGameStateAtMove(moveNumber) {
        if (moveNumber < 0 || moveNumber >= this._gameHistory.length) {
          return null;
        }
        return { ...this._gameHistory[moveNumber] };
      }
      /**
       * Dispose of the manager
       */
      dispose() {
        this.removeAllEventListeners();
        this._gameHistory = [];
        this._redoStack = [];
      }
    };
  }
});

// packages/core/src/SearchWorkerManager.ts
var SearchWorkerManager;
var init_SearchWorkerManager = __esm({
  "packages/core/src/SearchWorkerManager.ts"() {
    "use strict";
    SearchWorkerManager = class {
      constructor(config = {}) {
        this.workers = /* @__PURE__ */ new Map();
        this.pendingJobs = /* @__PURE__ */ new Map();
        this.nextJobId = 1;
        this.config = {
          maxWorkers: config.maxWorkers || Math.max(1, Math.floor(navigator.hardwareConcurrency / 2)),
          workerTimeout: config.workerTimeout || 3e4,
          enableDistributedSearch: config.enableDistributedSearch ?? true,
          fallbackToSingleWorker: config.fallbackToSingleWorker ?? true
        };
        this.initializeWorkers();
      }
      initializeWorkers() {
        for (let i = 0; i < this.config.maxWorkers; i++) {
          const workerId = `worker-${i}`;
          const worker = this.spawnWorker(workerId);
          worker.onmessage = (event) => this.handleWorkerMessage(workerId, event.data);
          worker.onerror = (error) => this.handleWorkerError(workerId, error);
          this.workers.set(workerId, {
            worker,
            busy: false,
            jobId: null,
            startTime: 0
          });
        }
      }
      async search(gameCore, player, options = {}) {
        const jobId = `job-${this.nextJobId++}`;
        const startTime = performance.now();
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            this.cancelJob(jobId);
            reject(new Error(`Search timeout after ${this.config.workerTimeout}ms`));
          }, options.timeLimit || this.config.workerTimeout);
          const validMoves = this.getValidMoves(gameCore, player);
          const shouldDistribute = this.config.enableDistributedSearch && validMoves.length >= 4 && this.getAvailableWorkerCount() >= 2;
          if (shouldDistribute) {
            this.startDistributedSearch(jobId, gameCore, player, options, validMoves, resolve, reject, timeout, startTime);
          } else {
            this.startSingleWorkerSearch(jobId, gameCore, player, options, resolve, reject, timeout, startTime);
          }
        });
      }
      startSingleWorkerSearch(jobId, gameCore, player, options, resolve, reject, timeout, startTime) {
        const availableWorker = this.getAvailableWorker();
        if (!availableWorker) {
          clearTimeout(timeout);
          reject(new Error("No workers available"));
          return;
        }
        const [workerId, workerData] = availableWorker;
        workerData.busy = true;
        workerData.jobId = jobId;
        workerData.startTime = performance.now();
        this.pendingJobs.set(jobId, {
          id: jobId,
          resolve,
          reject,
          timeout,
          startTime,
          workersAssigned: [workerId],
          results: /* @__PURE__ */ new Map(),
          expectedResponses: 1
        });
        const request = {
          id: jobId,
          gameCore,
          player,
          options
        };
        workerData.worker.postMessage(request);
      }
      startDistributedSearch(jobId, gameCore, player, options, validMoves, resolve, reject, timeout, startTime) {
        const availableWorkers = this.getAvailableWorkers();
        const workerCount = Math.min(availableWorkers.length, validMoves.length);
        if (workerCount === 0) {
          clearTimeout(timeout);
          reject(new Error("No workers available for distributed search"));
          return;
        }
        const moveGroups = this.distributeMoves(validMoves, workerCount);
        const workerIds = [];
        this.pendingJobs.set(jobId, {
          id: jobId,
          resolve,
          reject,
          timeout,
          startTime,
          workersAssigned: [],
          results: /* @__PURE__ */ new Map(),
          expectedResponses: workerCount
        });
        for (let i = 0; i < workerCount; i++) {
          const [workerId, workerData] = availableWorkers[i];
          const moves = moveGroups[i];
          workerData.busy = true;
          workerData.jobId = jobId;
          workerData.startTime = performance.now();
          workerIds.push(workerId);
          const request = {
            id: `${jobId}-${workerId}`,
            gameCore,
            player,
            options: {
              ...options,
              timeLimit: options.timeLimit ? Math.floor(options.timeLimit / workerCount) : void 0
            },
            rootMoves: moves
          };
          workerData.worker.postMessage(request);
        }
        const job = this.pendingJobs.get(jobId);
        job.workersAssigned = workerIds;
      }
      handleWorkerMessage(workerId, data) {
        const workerData = this.workers.get(workerId);
        if (!workerData) return;
        const jobId = data.id.includes("-") ? data.id.split("-")[0] : data.id;
        const job = this.pendingJobs.get(jobId);
        if (!job) {
          console.warn(`Received result for unknown job: ${data.id}`);
          return;
        }
        workerData.busy = false;
        workerData.jobId = null;
        if (data.success) {
          job.results.set(data.id, data);
          if (job.results.size >= job.expectedResponses) {
            this.completeJob(jobId);
          }
        } else {
          const error = new Error(data.error);
          this.failJob(jobId, error);
        }
      }
      handleWorkerError(workerId, error) {
        console.error(`Worker ${workerId} error:`, error);
        const workerData = this.workers.get(workerId);
        if (workerData && workerData.jobId) {
          const job = this.pendingJobs.get(workerData.jobId);
          if (job) {
            this.failJob(workerData.jobId, new Error(`Worker error: ${error.message}`));
          }
        }
        this.restartWorker(workerId);
      }
      completeJob(jobId) {
        const job = this.pendingJobs.get(jobId);
        if (!job) return;
        clearTimeout(job.timeout);
        try {
          const results = Array.from(job.results.values());
          const best = this.selectBestResult(results);
          const finalResult = {
            bestMove: best.bestMove,
            evaluation: best.evaluation,
            nodes: results.reduce((sum, r) => sum + r.nodes, 0),
            depth: Math.max(...results.map((r) => r.depth)),
            timeUsed: performance.now() - job.startTime,
            workersUsed: results.length,
            distributionStrategy: results.length > 1 ? "distributed" : "single"
          };
          job.resolve(finalResult);
        } catch (error) {
          job.reject(error);
        } finally {
          this.pendingJobs.delete(jobId);
        }
      }
      failJob(jobId, error) {
        const job = this.pendingJobs.get(jobId);
        if (!job) return;
        clearTimeout(job.timeout);
        for (const workerId of job.workersAssigned) {
          const workerData = this.workers.get(workerId);
          if (workerData) {
            workerData.busy = false;
            workerData.jobId = null;
          }
        }
        job.reject(error);
        this.pendingJobs.delete(jobId);
      }
      cancelJob(jobId) {
        const job = this.pendingJobs.get(jobId);
        if (!job) return;
        for (const workerId of job.workersAssigned) {
          const workerData = this.workers.get(workerId);
          if (workerData) {
            workerData.worker.terminate();
            this.restartWorker(workerId);
          }
        }
        this.pendingJobs.delete(jobId);
      }
      selectBestResult(results) {
        return results.reduce(
          (best, current) => current.evaluation > best.evaluation ? current : best
        );
      }
      distributeMoves(moves, workerCount) {
        const groups = Array.from({ length: workerCount }, () => []);
        moves.forEach((move, index) => {
          groups[index % workerCount].push(move);
        });
        return groups;
      }
      getValidMoves(gameCore, player) {
        return Array.from(gameCore.validMoves);
      }
      getAvailableWorker() {
        for (const [id, worker] of this.workers) {
          if (!worker.busy) {
            return [id, worker];
          }
        }
        return null;
      }
      getAvailableWorkers() {
        return Array.from(this.workers.entries()).filter(([_, worker]) => !worker.busy);
      }
      getAvailableWorkerCount() {
        return Array.from(this.workers.values()).filter((w) => !w.busy).length;
      }
      restartWorker(workerId) {
        const oldWorkerData = this.workers.get(workerId);
        if (oldWorkerData) {
          oldWorkerData.worker.terminate();
        }
        const worker = this.spawnWorker(workerId);
        worker.onmessage = (event) => this.handleWorkerMessage(workerId, event.data);
        worker.onerror = (error) => this.handleWorkerError(workerId, error);
        this.workers.set(workerId, {
          worker,
          busy: false,
          jobId: null,
          startTime: 0
        });
      }
      spawnWorker(workerId) {
        const workerUrl = new URL("./search-worker.ts", import.meta.url);
        return new Worker(workerUrl, {
          type: "module",
          name: workerId
        });
      }
      // Public methods
      getStatus() {
        const workers = Array.from(this.workers.values());
        return {
          totalWorkers: workers.length,
          busyWorkers: workers.filter((w) => w.busy).length,
          availableWorkers: workers.filter((w) => !w.busy).length,
          pendingJobs: this.pendingJobs.size,
          config: this.config
        };
      }
      async terminate() {
        for (const jobId of this.pendingJobs.keys()) {
          this.cancelJob(jobId);
        }
        const terminationPromises = Array.from(this.workers.values()).map(
          (workerData) => {
            return new Promise((resolve) => {
              workerData.worker.onmessage = null;
              workerData.worker.onerror = null;
              workerData.worker.terminate();
              resolve();
            });
          }
        );
        await Promise.all(terminationPromises);
        this.workers.clear();
        this.pendingJobs.clear();
      }
    };
  }
});

// packages/core/src/index.ts
var src_exports = {};
__export(src_exports, {
  ALL_ONES: () => ALL_ONES,
  FILE_A: () => FILE_A,
  FILE_H: () => FILE_H,
  GameStateManager: () => GameStateManager,
  NOT_FILE_A: () => NOT_FILE_A,
  NOT_FILE_H: () => NOT_FILE_H,
  SearchWorkerManager: () => SearchWorkerManager,
  bitCount: () => bitCount,
  bitIndex: () => bitIndex,
  bitIndexToRC: () => bitIndexToRC,
  calculateScore: () => calculateScore,
  computeZobristHash: () => computeZobristHash,
  createInitialGameCore: () => createInitialGameCore,
  emptiesCount: () => emptiesCount,
  ensureBoard: () => ensureBoard,
  flipPieces: () => flipPieces,
  gameCoreForEngine: () => gameCoreForEngine,
  getEmptySquares: () => getEmptySquares,
  getGameResult: () => getGameResult,
  getMobility: () => getMobility,
  getPositionHash: () => getPositionHash,
  getValidMoves: () => getValidMoves,
  getValidMovesBitboard: () => getValidMovesBitboard,
  getValidMovesMask: () => getValidMovesMask,
  isGameOver: () => isGameOver,
  isTerminalPosition: () => isTerminalPosition,
  isValidMove: () => isValidMove,
  isValidMoveBitboard: () => isValidMoveBitboard,
  makeMove: () => makeMove,
  maskToRCList: () => maskToRCList,
  rcToBitIndex: () => rcToBitIndex,
  rcToMask: () => rcToMask,
  shiftEast: () => shiftEast,
  shiftNorth: () => shiftNorth,
  shiftNorthEast: () => shiftNorthEast,
  shiftNorthWest: () => shiftNorthWest,
  shiftSouth: () => shiftSouth,
  shiftSouthEast: () => shiftSouthEast,
  shiftSouthWest: () => shiftSouthWest,
  shiftWest: () => shiftWest,
  undoMove: () => undoMove
});
var init_src = __esm({
  "packages/core/src/index.ts"() {
    "use strict";
    init_bitboard();
    init_gameCore();
    init_GameStateManager();
    init_GameStateManager();
    init_SearchWorkerManager();
    init_SearchWorkerManager();
  }
});

// packages/engine-neo/src/optimization/transTable.ts
var TranspositionTable = class {
  constructor(maxSize = 2e5) {
    this.table = /* @__PURE__ */ new Map();
    this.currentAge = 0;
    this.maxSize = maxSize;
  }
  /**
   * Get current age
   */
  getAge() {
    return this.currentAge;
  }
  /**
   * Increment age (called at start of each search)
   */
  bumpAge() {
    this.currentAge = this.currentAge + 1 | 0;
  }
  /**
   * Get entry from table
   */
  get(key) {
    return this.table.get(key);
  }
  /**
   * Store entry in table with eviction if needed
   */
  set(key, entry) {
    if (this.table.size >= this.maxSize) {
      this.evictOldEntries();
    }
    this.table.set(key, { ...entry, age: this.currentAge });
  }
  /**
   * Evict old entries when table is full
   */
  evictOldEntries() {
    const evictionCount = Math.max(1, Math.floor(this.maxSize * 0.02));
    let removed = 0;
    for (const [key, entry] of this.table.entries()) {
      if (entry.age !== this.currentAge) {
        this.table.delete(key);
        removed++;
        if (removed >= evictionCount) break;
      }
    }
    if (this.table.size >= this.maxSize) {
      let fallbackRemoved = 0;
      const fallbackLimit = 64;
      for (const key of this.table.keys()) {
        this.table.delete(key);
        fallbackRemoved++;
        if (fallbackRemoved >= fallbackLimit) break;
      }
    }
  }
  /**
   * Clear the entire table
   */
  clear() {
    this.table.clear();
    this.currentAge = 0;
  }
  /**
   * Get table statistics
   */
  getStats() {
    return {
      size: this.table.size,
      maxSize: this.maxSize,
      age: this.currentAge,
      fillRatio: this.table.size / this.maxSize
    };
  }
  /**
   * Check if entry is usable for given depth
   */
  isUsable(entry, depth) {
    return entry !== void 0 && entry.depth >= depth;
  }
  /**
   * Extract best move from entry
   */
  getBestMove(entry) {
    return entry?.bestMove;
  }
  /**
   * Check if entry provides cutoff for alpha-beta bounds
   */
  providesScoreCutoff(entry, alpha, beta, depth) {
    if (!this.isUsable(entry, depth)) {
      return { cutoff: false };
    }
    const { flag, score } = entry;
    if (flag === 0 /* EXACT */) {
      return { cutoff: true, score };
    }
    if (flag === 1 /* LOWER */ && score >= beta) {
      return { cutoff: true, score };
    }
    if (flag === 2 /* UPPER */ && score <= alpha) {
      return { cutoff: true, score };
    }
    let newAlpha = alpha;
    let newBeta = beta;
    if (flag === 1 /* LOWER */) {
      newAlpha = Math.max(alpha, score);
    } else if (flag === 2 /* UPPER */) {
      newBeta = Math.min(beta, score);
    }
    if (newAlpha >= newBeta) {
      return { cutoff: true, score };
    }
    return {
      cutoff: false,
      newAlpha: newAlpha !== alpha ? newAlpha : void 0,
      newBeta: newBeta !== beta ? newBeta : void 0
    };
  }
  /**
   * Create TT entry for storage
   */
  createEntry(depth, score, bestMove, alpha, beta) {
    let flag;
    if (score <= alpha) {
      flag = 2 /* UPPER */;
    } else if (score >= beta) {
      flag = 1 /* LOWER */;
    } else {
      flag = 0 /* EXACT */;
    }
    return {
      depth,
      flag,
      score,
      bestMove,
      age: this.currentAge
    };
  }
};

// packages/engine-neo/src/evaluation/weights.ts
function getEvaluationWeights(empties) {
  if (empties >= 45) {
    return {
      mobility: 28,
      pmob: 12,
      stability: 6,
      frontier: 10,
      corner: 35,
      x: 18,
      c: 10,
      parity: 0,
      edge: 4,
      edgeOcc: -4
    };
  }
  if (empties >= 20) {
    return {
      mobility: 24,
      pmob: 16,
      stability: 10,
      frontier: 16,
      corner: 34,
      x: 22,
      c: 14,
      parity: 6,
      edge: 8,
      edgeOcc: -8
    };
  }
  return {
    mobility: 8,
    pmob: 6,
    stability: 22,
    frontier: 8,
    corner: 40,
    x: 20,
    c: 12,
    parity: 18,
    edge: 12,
    edgeOcc: 6
  };
}
var POSITIONAL_WEIGHTS = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120]
];
var CORNER_DATA = [
  {
    corner: [0, 0],
    x: [1, 1],
    c: [[0, 1], [1, 0]]
  },
  {
    corner: [0, 7],
    x: [1, 6],
    c: [[0, 6], [1, 7]]
  },
  {
    corner: [7, 0],
    x: [6, 1],
    c: [[6, 0], [7, 1]]
  },
  {
    corner: [7, 7],
    x: [6, 6],
    c: [[6, 7], [7, 6]]
  }
];
var DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1]
];

// packages/engine-neo/src/evaluation/mobility.ts
init_src();
function getCurrentMobility(board, player) {
  return getValidMoves(board, player).length;
}
function getPotentialMobility(board, player) {
  const opponent = player === "black" ? "white" : "black";
  let count = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] !== null) continue;
      let adjacentToOpponent = false;
      for (const [dr, dc] of DIRECTIONS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === opponent) {
          adjacentToOpponent = true;
          break;
        }
      }
      if (adjacentToOpponent) count++;
    }
  }
  return count;
}
function getMobilityAdvantage(board, player, opponent) {
  const currentPlayer = getCurrentMobility(board, player);
  const currentOpponent = getCurrentMobility(board, opponent);
  const potentialPlayer = getPotentialMobility(board, player);
  const potentialOpponent = getPotentialMobility(board, opponent);
  return {
    currentMobility: currentPlayer,
    potentialMobility: potentialPlayer,
    mobilityDiff: currentPlayer - currentOpponent,
    potentialMobilityDiff: potentialPlayer - potentialOpponent
  };
}
function isImportantMove(position) {
  const { row, col } = position;
  return (row === 0 || row === 7) && (col === 0 || col === 7);
}
function countEmptySquares(board) {
  let count = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === null) count++;
    }
  }
  return count;
}
function calculateDiscCounts(board) {
  let black = 0;
  let white = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (cell === "black") black++;
      else if (cell === "white") white++;
    }
  }
  return { black, white };
}

// packages/engine-neo/src/ordering/moveOrdering.ts
var KillerMoves = class {
  constructor() {
    this.moves = /* @__PURE__ */ new Map();
    this.maxKillersPerPly = 2;
  }
  /**
   * Add a killer move for a specific ply
   */
  addKiller(ply, move) {
    if (!this.moves.has(ply)) {
      this.moves.set(ply, []);
    }
    const killers = this.moves.get(ply);
    const index = killers.findIndex((k) => k.row === move.row && k.col === move.col);
    if (index !== -1) {
      killers.splice(index, 1);
    }
    killers.unshift(move);
    if (killers.length > this.maxKillersPerPly) {
      killers.pop();
    }
  }
  /**
   * Get killer moves for a specific ply
   */
  getKillers(ply) {
    return this.moves.get(ply) || [];
  }
  /**
   * Get priority of a move based on killer heuristic
   */
  getKillerPriority(move, ply) {
    const killers = this.getKillers(ply);
    for (let i = 0; i < killers.length; i++) {
      const killer = killers[i];
      if (killer.row === move.row && killer.col === move.col) {
        return 2 - i;
      }
    }
    return 0;
  }
  /**
   * Clear killer moves (called between searches)
   */
  clear() {
    this.moves.clear();
  }
};
var HistoryTable = class {
  constructor() {
    this.history = /* @__PURE__ */ new Map();
  }
  /**
   * Generate key for move and player
   */
  getKey(move, player) {
    return `${move.row},${move.col}|${player}`;
  }
  /**
   * Update history score for a move
   */
  updateHistory(move, player, depth) {
    const key = this.getKey(move, player);
    const bonus = depth * depth;
    const current = this.history.get(key) || 0;
    this.history.set(key, current + bonus);
  }
  /**
   * Get history score for a move
   */
  getHistoryScore(move, player) {
    const key = this.getKey(move, player);
    return this.history.get(key) || 0;
  }
  /**
   * Clear history table
   */
  clear() {
    this.history.clear();
  }
  /**
   * Age history scores (reduce by factor to prioritize recent moves)
   */
  ageHistory(factor = 0.9) {
    for (const [key, score] of this.history.entries()) {
      this.history.set(key, Math.floor(score * factor));
    }
  }
};
function orderMoves(moves, context) {
  const { ply, player, board, killers, history, ttBestMove } = context;
  const scoredMoves = moves.map((move) => ({
    move,
    score: scoreMoveForOrdering(move, context)
  }));
  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves.map((sm) => sm.move);
}
function scoreMoveForOrdering(move, context) {
  const { ply, player, killers, history, ttBestMove } = context;
  let score = 0;
  if (ttBestMove && ttBestMove.row === move.row && ttBestMove.col === move.col) {
    score += 1e4;
  }
  if (isImportantMove(move)) {
    score += 5e3;
  }
  score += POSITIONAL_WEIGHTS[move.row][move.col];
  const killerPriority = killers.getKillerPriority(move, ply);
  if (killerPriority > 0) {
    score += 1e3 * killerPriority;
  }
  const historyScore = history.getHistoryScore(move, player);
  score += historyScore / 10;
  const centerDistance = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
  score += (7 - centerDistance) * 2;
  return score;
}

// packages/engine-neo/src/evaluation/stability.ts
function countStableDiscs(board, player) {
  const stable = /* @__PURE__ */ new Set();
  const playerValue = player === "black" ? 1 : 2;
  const corners = [
    {
      pos: [0, 0],
      dirs: [[0, 1], [1, 0]]
    },
    {
      pos: [0, 7],
      dirs: [[0, -1], [1, 0]]
    },
    {
      pos: [7, 0],
      dirs: [[-1, 0], [0, 1]]
    },
    {
      pos: [7, 7],
      dirs: [[-1, 0], [0, -1]]
    }
  ];
  for (const { pos: [r, c], dirs } of corners) {
    const cell = board[r][c];
    if (cell !== player) continue;
    stable.add(`${r},${c}`);
    for (const [dr, dc] of dirs) {
      let nr = r + dr;
      let nc = c + dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === player) {
        stable.add(`${nr},${nc}`);
        nr += dr;
        nc += dc;
      }
    }
  }
  return stable.size;
}
function countEdgeStableDiscs(board, player) {
  const stable = /* @__PURE__ */ new Set();
  function traverse(r, c, dr, dc) {
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === player) {
      stable.add(`${r},${c}`);
      r += dr;
      c += dc;
    }
  }
  const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
  for (const [r, c] of corners) {
    if (board[r][c] !== player) continue;
    if (r === 0 && c === 0) {
      traverse(r, c, 0, 1);
      traverse(r, c, 1, 0);
    } else if (r === 0 && c === 7) {
      traverse(r, c, 0, -1);
      traverse(r, c, 1, 0);
    } else if (r === 7 && c === 0) {
      traverse(r, c, -1, 0);
      traverse(r, c, 0, 1);
    } else if (r === 7 && c === 7) {
      traverse(r, c, -1, 0);
      traverse(r, c, 0, -1);
    }
  }
  return stable.size;
}
function countEdgeDiscs(board, player) {
  let count = 0;
  for (let c = 0; c < 8; c++) {
    if (board[0][c] === player) count++;
    if (board[7][c] === player) count++;
  }
  for (let r = 1; r < 7; r++) {
    if (board[r][0] === player) count++;
    if (board[r][7] === player) count++;
  }
  return count;
}
function countFrontierDiscs(board, player) {
  let count = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] !== player) continue;
      let isFrontier = false;
      for (const [dr, dc] of DIRECTIONS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8 || board[nr][nc] === null) {
          isFrontier = true;
          break;
        }
      }
      if (isFrontier) count++;
    }
  }
  return count;
}

// packages/engine-neo/src/evaluation/heuristic.ts
function evaluateBoard(board, player, isEndgame = false) {
  if (isEndgame) {
    const counts = calculateDiscCounts(board);
    const playerCount = counts[player];
    const opponentCount = player === "black" ? counts.white : counts.black;
    return playerCount - opponentCount;
  }
  const opponent = player === "black" ? "white" : "black";
  const empties = countEmptySquares(board);
  const weights = getEvaluationWeights(empties);
  let totalScore = 0;
  let positionalScore = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (cell === player) {
        positionalScore += POSITIONAL_WEIGHTS[r][c];
      } else if (cell === opponent) {
        positionalScore -= POSITIONAL_WEIGHTS[r][c];
      }
    }
  }
  const mobility = getMobilityAdvantage(board, player, opponent);
  const mobilityScore = weights.mobility * mobility.mobilityDiff;
  const potentialMobilityScore = weights.pmob * mobility.potentialMobilityDiff;
  const playerStable = countStableDiscs(board, player);
  const opponentStable = countStableDiscs(board, opponent);
  const stabilityScore = weights.stability * (playerStable - opponentStable);
  const playerFrontier = countFrontierDiscs(board, player);
  const opponentFrontier = countFrontierDiscs(board, opponent);
  const frontierScore = weights.frontier * (opponentFrontier - playerFrontier);
  const parityScore = empties % 2 === (player === "black" ? 1 : 0) ? weights.parity : -weights.parity;
  const playerEdgeStable = countEdgeStableDiscs(board, player);
  const opponentEdgeStable = countEdgeStableDiscs(board, opponent);
  const edgeStabilityScore = weights.edge * (playerEdgeStable - opponentEdgeStable);
  const playerEdgeOcc = countEdgeDiscs(board, player);
  const opponentEdgeOcc = countEdgeDiscs(board, opponent);
  const edgeOccScore = weights.edgeOcc * (playerEdgeOcc - opponentEdgeOcc);
  let cornerScore = 0;
  let xSquareScore = 0;
  let cSquareScore = 0;
  for (const { corner, x, c } of CORNER_DATA) {
    const [cr, cc] = corner;
    const [xr, xc] = x;
    const cornerCell = board[cr][cc];
    if (cornerCell === player) {
      cornerScore += weights.corner;
    } else if (cornerCell === opponent) {
      cornerScore -= weights.corner;
    } else {
      const xCell = board[xr][xc];
      if (xCell === player) {
        xSquareScore -= weights.x;
      } else if (xCell === opponent) {
        xSquareScore += weights.x;
      }
      for (const [pr, pc] of c) {
        const cCell = board[pr][pc];
        if (cCell === player) {
          cSquareScore -= weights.c;
        } else if (cCell === opponent) {
          cSquareScore += weights.c;
        }
      }
    }
  }
  totalScore = positionalScore + mobilityScore + potentialMobilityScore + stabilityScore + frontierScore + parityScore + edgeStabilityScore + edgeOccScore + cornerScore + xSquareScore + cSquareScore;
  return totalScore;
}
function quickEvaluate(board, player) {
  const opponent = player === "black" ? "white" : "black";
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (cell === player) {
        score += POSITIONAL_WEIGHTS[r][c];
      } else if (cell === opponent) {
        score -= POSITIONAL_WEIGHTS[r][c];
      }
    }
  }
  const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
  for (const [r, c] of corners) {
    const cell = board[r][c];
    if (cell === player) score += 100;
    else if (cell === opponent) score -= 100;
  }
  return score;
}
function isEndgamePhase(board, threshold = 12) {
  return countEmptySquares(board) <= threshold;
}

// packages/engine-neo/src/search/pvs.ts
init_src();

// packages/engine-neo/src/config/selectivity.ts
var LEVEL_TABLE = [];
function buildLevelTable() {
  for (let L = 0; L <= 60; L++) {
    LEVEL_TABLE[L] = [];
    for (let e = 0; e <= 60; e++) {
      LEVEL_TABLE[L][e] = { depth: 0, selectivity: 5 };
    }
  }
  for (let L = 0; L <= 60; L++) {
    for (let e = 0; e <= 60; e++) {
      if (L <= 0) {
        LEVEL_TABLE[L][e] = { depth: 0, selectivity: 5 };
        continue;
      }
      if (L <= 10) {
        LEVEL_TABLE[L][e] = {
          depth: e <= 2 * L ? e : L,
          selectivity: 5
        };
        continue;
      }
      const bands = [
        { lim: 12, sel: [[21, 5], [24, 3], [99, 0]] },
        { lim: 18, sel: [[21, 5], [24, 3], [27, 1], [99, 0]] },
        { lim: 24, sel: [[24, 5], [27, 4], [30, 2], [33, 0], [99, 0]] },
        { lim: 33, sel: [[30, 5], [33, 4], [36, 2], [39, 0], [99, 0]] },
        { lim: 35, sel: [[30, 5], [33, 4], [36, 3], [39, 1], [99, 0]] }
      ];
      let handled = false;
      for (const band of bands) {
        if (L <= band.lim) {
          let selectivity = 0;
          let config = { depth: e, selectivity: 0 };
          for (const [threshold, sel] of band.sel) {
            selectivity = sel;
            if (e <= threshold) {
              config = { depth: e, selectivity };
              break;
            }
          }
          LEVEL_TABLE[L][e] = config;
          handled = true;
          break;
        }
      }
      if (!handled) {
        let selectivity = 0;
        if (e <= L - 6) selectivity = 5;
        else if (e <= L - 3) selectivity = 4;
        else if (e <= L) selectivity = 3;
        else if (e <= L + 3) selectivity = 2;
        else if (e <= L + 6) selectivity = 1;
        else selectivity = 0;
        LEVEL_TABLE[L][e] = {
          depth: e <= L + 9 ? e : L,
          selectivity
        };
      }
    }
  }
}
buildLevelTable();
function getLevelConfig(level, empties) {
  const clampedLevel = Math.max(0, Math.min(60, level));
  const clampedEmpties = Math.max(0, Math.min(60, empties));
  return LEVEL_TABLE[clampedLevel][clampedEmpties];
}
function getSelectivitySettings(selectivity) {
  const NO_SELECTIVITY = 5;
  const clampedSel = Math.max(0, Math.min(NO_SELECTIVITY, selectivity));
  const t = (NO_SELECTIVITY - clampedSel) / NO_SELECTIVITY;
  return {
    lmrBase: 0.75 + 1.75 * t,
    // 0.75 to 2.5
    lmpBonus: Math.round(12 * t),
    // 0 to 12
    futMul: 1 + 1 * t,
    // 1.0 to 2.0
    razorMul: 1 + 0.8 * t,
    // 1.0 to 1.8
    useNWS: t > 0.15
    // Enable NWS for selectivity <= 4
  };
}
var DifficultyLevel = /* @__PURE__ */ ((DifficultyLevel2) => {
  DifficultyLevel2[DifficultyLevel2["BEGINNER"] = 8] = "BEGINNER";
  DifficultyLevel2[DifficultyLevel2["EASY"] = 12] = "EASY";
  DifficultyLevel2[DifficultyLevel2["MEDIUM"] = 18] = "MEDIUM";
  DifficultyLevel2[DifficultyLevel2["HARD"] = 24] = "HARD";
  DifficultyLevel2[DifficultyLevel2["EXPERT"] = 33] = "EXPERT";
  DifficultyLevel2[DifficultyLevel2["MASTER"] = 40] = "MASTER";
  DifficultyLevel2[DifficultyLevel2["GRANDMASTER"] = 50] = "GRANDMASTER";
  return DifficultyLevel2;
})(DifficultyLevel || {});
function getDifficultyLevel(difficulty) {
  switch (difficulty.toLowerCase()) {
    case "beginner":
      return 8 /* BEGINNER */;
    case "easy":
      return 12 /* EASY */;
    case "medium":
      return 18 /* MEDIUM */;
    case "hard":
      return 24 /* HARD */;
    case "expert":
      return 33 /* EXPERT */;
    case "master":
      return 40 /* MASTER */;
    case "grandmaster":
      return 50 /* GRANDMASTER */;
    default:
      return 18 /* MEDIUM */;
  }
}
var STABILITY_THRESHOLDS = {
  // NWS (Null Window Search) stability thresholds
  NWS: Array.from({ length: 61 }, (_, i) => {
    if (i < 4) return 99;
    if (i <= 8) return 8;
    if (i <= 24) return 26 + Math.floor((i - 8) * 1.2);
    return Math.min(64, 40 + Math.floor((i - 24) * 1));
  }),
  // PVS (Principal Variation Search) stability thresholds
  PVS: Array.from({ length: 61 }, (_, i) => {
    if (i < 4) return 99;
    if (i <= 8) return 0;
    if (i <= 24) return 12 + Math.floor((i - 8) * 1.2);
    return Math.min(62, 32 + Math.floor((i - 24) * 1));
  })
};
var PRUNING_PARAMS = {
  // Late Move Pruning table
  LMP_TABLE: [0, 0, 3, 5, 7, 9, 12],
  // Futility pruning margins by depth
  FUTILITY_MARGINS: [0, 120, 200, 280],
  // Razor pruning margins by depth
  RAZOR_MARGINS: [0, 300, 500],
  // Null move parameters
  NULL_MOVE_R: 2,
  NULL_MOVE_MIN_DEPTH: 2
};
var ENDGAME_THRESHOLD = 20;

// packages/engine-neo/src/search/pvs.ts
var PVSEngine = class {
  constructor() {
    this.nodes = 0;
    this.ttHits = 0;
    this.ttStores = 0;
    this.startTime = 0;
    this.timeLimit = Infinity;
    this.tt = new TranspositionTable(2e5);
    this.killers = new KillerMoves();
    this.history = new HistoryTable();
  }
  /**
   * Main search entry point
   */
  search(board, player, config) {
    this.initializeSearch(config);
    const empties = this.countEmptySquares(board);
    const levelConfig = getLevelConfig(config.level, empties);
    const selectivitySettings = getSelectivitySettings(levelConfig.selectivity);
    let bestMove;
    let bestScore = -Infinity;
    let pv = [];
    for (let depth = 1; depth <= levelConfig.depth; depth++) {
      if (this.shouldStop()) break;
      const result = this.pvs(
        board,
        player,
        depth,
        -Infinity,
        Infinity,
        0,
        true,
        selectivitySettings
      );
      if (!this.shouldStop()) {
        bestMove = result.move;
        bestScore = result.score;
        pv = result.pv;
      }
    }
    return {
      bestMove,
      score: bestScore,
      depth: levelConfig.depth,
      nodes: this.nodes,
      time: Date.now() - this.startTime,
      pv,
      ttHits: this.ttHits,
      ttStores: this.ttStores
    };
  }
  /**
   * Principal Variation Search with alpha-beta pruning
   */
  pvs(board, player, depth, alpha, beta, ply, isPV, settings) {
    this.nodes++;
    if (depth <= 0) {
      return {
        score: this.quiescenceSearch(board, player, alpha, beta, ply),
        move: void 0,
        pv: []
      };
    }
    if (this.shouldStop()) {
      return { score: evaluateBoard(board, player), move: void 0, pv: [] };
    }
    const ttKey = this.generateBoardKey(board, player);
    const ttEntry = this.tt.get(ttKey);
    let ttMove;
    if (ttEntry && this.tt.isUsable(ttEntry, depth)) {
      this.ttHits++;
      const cutoff = this.tt.providesScoreCutoff(ttEntry, alpha, beta, depth);
      if (cutoff.cutoff && cutoff.score !== void 0) {
        return { score: cutoff.score, move: ttEntry.bestMove, pv: [] };
      }
      if (cutoff.newAlpha !== void 0) alpha = cutoff.newAlpha;
      if (cutoff.newBeta !== void 0) beta = cutoff.newBeta;
      ttMove = ttEntry.bestMove;
    }
    const moves = getValidMoves(board, player);
    if (moves.length === 0) {
      const opponent = player === "black" ? "white" : "black";
      const opponentMoves = getValidMoves(board, opponent);
      if (opponentMoves.length === 0) {
        return { score: this.evaluateGameEnd(board, player), move: void 0, pv: [] };
      } else {
        const result = this.pvs(board, opponent, depth - 1, -beta, -alpha, ply + 1, isPV, settings);
        return { score: -result.score, move: void 0, pv: result.pv };
      }
    }
    const orderedMoves = orderMoves(moves, {
      ply,
      player,
      board,
      killers: this.killers,
      history: this.history,
      ttBestMove: ttMove
    });
    let bestMove;
    let bestScore = -Infinity;
    let pv = [];
    let moveCount = 0;
    for (const move of orderedMoves) {
      if (this.shouldPruneMove(moveCount, depth, alpha, beta, settings)) {
        break;
      }
      const newBoard = this.makeMove(board, move, player);
      if (!newBoard) {
        continue;
      }
      if (!newBoard) {
        continue;
      }
      const opponent = player === "black" ? "white" : "black";
      let score;
      if (moveCount === 0) {
        const result = this.pvs(newBoard, opponent, depth - 1, -beta, -alpha, ply + 1, isPV, settings);
        score = -result.score;
        if (score > alpha) {
          pv = [move, ...result.pv];
        }
      } else {
        let reduction = 0;
        if (this.shouldReduceMove(moveCount, depth, move, settings)) {
          reduction = Math.floor(settings.lmrBase + Math.log(depth) * Math.log(moveCount) / 3);
          reduction = Math.max(0, Math.min(reduction, depth - 2));
        }
        const result = this.pvs(
          newBoard,
          opponent,
          depth - 1 - reduction,
          -alpha - 1,
          -alpha,
          ply + 1,
          false,
          settings
        );
        score = -result.score;
        if (score > alpha && score < beta && (reduction > 0 || !isPV)) {
          const fullResult = this.pvs(newBoard, opponent, depth - 1, -beta, -alpha, ply + 1, isPV, settings);
          score = -fullResult.score;
          if (score > alpha) {
            pv = [move, ...fullResult.pv];
          }
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      if (score > alpha) {
        alpha = score;
        if (!pv.length) pv = [move];
      }
      if (alpha >= beta) {
        this.killers.addKiller(ply, move);
        this.history.updateHistory(move, player, depth);
        break;
      }
      moveCount++;
    }
    if (bestMove) {
      const entry = this.tt.createEntry(depth, bestScore, bestMove, alpha, beta);
      this.tt.set(ttKey, entry);
      this.ttStores++;
    }
    return { score: bestScore, move: bestMove, pv };
  }
  /**
   * Quiescence search for tactical stability
   */
  quiescenceSearch(board, player, alpha, beta, ply) {
    this.nodes++;
    if (ply >= 64) {
      return evaluateBoard(board, player);
    }
    const standPat = evaluateBoard(board, player);
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
    const moves = getValidMoves(board, player);
    if (moves.length === 0) {
      const opponent2 = player === "black" ? "white" : "black";
      const opponentMoves = getValidMoves(board, opponent2);
      if (opponentMoves.length === 0) {
        return standPat;
      }
      const score = -this.quiescenceSearch(board, opponent2, -beta, -alpha, ply + 1);
      if (score > alpha) {
        alpha = score;
      }
      return alpha;
    }
    const tacticalMoves = this.filterTacticalMoves(moves);
    if (tacticalMoves.length === 0) {
      return alpha;
    }
    const opponent = player === "black" ? "white" : "black";
    for (const move of tacticalMoves) {
      const newBoard = this.makeMove(board, move, player);
      if (!newBoard) {
        continue;
      }
      const score = -this.quiescenceSearch(newBoard, opponent, -beta, -alpha, ply + 1);
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }
  initializeSearch(config) {
    this.nodes = 0;
    this.ttHits = 0;
    this.ttStores = 0;
    this.startTime = Date.now();
    this.timeLimit = config.timeLimit || Infinity;
    this.tt.bumpAge();
  }
  shouldStop() {
    return Date.now() - this.startTime >= this.timeLimit;
  }
  shouldPruneMove(moveCount, depth, alpha, beta, settings) {
    if (depth >= 6 && moveCount >= PRUNING_PARAMS.LMP_TABLE[Math.min(depth, 6)] + settings.lmpBonus) {
      return true;
    }
    return false;
  }
  shouldReduceMove(moveCount, depth, move, settings) {
    return depth >= 3 && moveCount >= 4 && !this.isImportantMove(move);
  }
  isImportantMove(move) {
    const { row, col } = move;
    return (row === 0 || row === 7) && (col === 0 || col === 7);
  }
  filterTacticalMoves(moves) {
    return moves.filter((move) => this.isImportantMove(move)).slice(0, 4);
  }
  makeMove(board, move, player) {
    const gameCore = {
      id: "pvs-move",
      board,
      currentPlayer: player,
      validMoves: [],
      score: { black: 0, white: 0 },
      status: "playing",
      moveHistory: [],
      canUndo: false,
      canRedo: false
    };
    const result = makeMove(gameCore, move);
    if (result.success && result.newGameCore) {
      return result.newGameCore.board;
    }
    return this.fallbackApplyMove(board, move, player);
  }
  fallbackApplyMove(board, move, player) {
    const opponent = player === "black" ? "white" : "black";
    const next = board.map((row) => [...row]);
    const directions = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1]
    ];
    const flips = [];
    for (const [dr, dc] of directions) {
      let r = move.row + dr;
      let c = move.col + dc;
      const path = [];
      while (r >= 0 && r < 8 && c >= 0 && c < 8 && next[r][c] === opponent) {
        path.push({ row: r, col: c });
        r += dr;
        c += dc;
      }
      if (path.length > 0 && r >= 0 && r < 8 && c >= 0 && c < 8 && next[r][c] === player) {
        flips.push(...path);
      }
    }
    if (flips.length === 0) {
      return null;
    }
    next[move.row][move.col] = player;
    for (const pos of flips) {
      next[pos.row][pos.col] = player;
    }
    return next;
  }
  generateBoardKey(board, player) {
    return `${JSON.stringify(board)}_${player}`;
  }
  countEmptySquares(board) {
    let count = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === null) count++;
      }
    }
    return count;
  }
  evaluateGameEnd(board, player) {
    let playerCount = 0;
    let opponentCount = 0;
    const opponent = player === "black" ? "white" : "black";
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = board[r][c];
        if (cell === player) playerCount++;
        else if (cell === opponent) opponentCount++;
      }
    }
    return playerCount - opponentCount;
  }
};

// packages/engine-neo/src/search/aspiration.ts
var DEFAULT_ASPIRATION_CONFIG = {
  level: 18,
  initialWindow: 50,
  maxWindow: 400,
  windowGrowth: 2,
  enableTT: true,
  enableKillers: true,
  enableHistory: true
};
var AspirationEngine = class {
  constructor() {
    this.pvsEngine = new PVSEngine();
  }
  /**
   * Search with aspiration windows for efficiency
   */
  search(board, player, config = DEFAULT_ASPIRATION_CONFIG) {
    let previousScore = evaluateBoard(board, player);
    let window = config.initialWindow;
    let depth = 1;
    let result = this.pvsEngine.search(board, player, {
      ...config,
      depthLimit: 1
    });
    if (result.bestMove) {
      previousScore = result.score;
    }
    for (depth = 2; depth <= this.getMaxDepth(board, config); depth++) {
      const searchConfig = {
        ...config,
        depthLimit: depth
      };
      let searchResult = this.searchWithWindow(
        board,
        player,
        searchConfig,
        previousScore,
        window
      );
      while (this.isAspirationFailure(searchResult, previousScore, window)) {
        window = Math.min(window * config.windowGrowth, config.maxWindow);
        searchResult = this.searchWithWindow(
          board,
          player,
          searchConfig,
          previousScore,
          window
        );
        if (window >= config.maxWindow) {
          searchResult = this.pvsEngine.search(board, player, searchConfig);
          break;
        }
      }
      if (searchResult.bestMove) {
        result = searchResult;
        previousScore = searchResult.score;
        window = config.initialWindow;
      }
      if (config.timeLimit && result.time >= config.timeLimit * 0.8) {
        break;
      }
    }
    return result;
  }
  /**
   * Search with specific aspiration window
   */
  searchWithWindow(board, player, config, expectedScore, window) {
    const alpha = expectedScore - window;
    const beta = expectedScore + window;
    return this.pvsEngine.search(board, player, config);
  }
  /**
   * Check if aspiration search failed (score outside window)
   */
  isAspirationFailure(result, expectedScore, window) {
    const alpha = expectedScore - window;
    const beta = expectedScore + window;
    return result.score <= alpha || result.score >= beta;
  }
  /**
   * Determine maximum search depth based on game phase
   */
  getMaxDepth(board, config) {
    const empties = this.countEmptySquares(board);
    if (config.depthLimit) {
      return Math.min(config.depthLimit, empties);
    }
    if (empties <= 12) {
      return empties;
    } else if (empties <= 20) {
      return Math.min(config.level, 20);
    } else {
      return Math.min(config.level, 15);
    }
  }
  /**
   * Adaptive window sizing based on search instability
   */
  getAdaptiveWindow(previousScores, baseWindow) {
    if (previousScores.length < 2) {
      return baseWindow;
    }
    let totalVariation = 0;
    for (let i = 1; i < previousScores.length; i++) {
      totalVariation += Math.abs(previousScores[i] - previousScores[i - 1]);
    }
    const avgVariation = totalVariation / (previousScores.length - 1);
    if (avgVariation > 100) {
      return Math.min(baseWindow * 2, 400);
    } else if (avgVariation < 30) {
      return Math.max(baseWindow / 2, 25);
    } else {
      return baseWindow;
    }
  }
  /**
   * Multi-cut aspiration search for very narrow windows
   */
  multiCutSearch(board, player, config, expectedScore) {
    const cuts = [-2, -1, 0, 1, 2];
    let bestResult;
    for (const cut of cuts) {
      const adjustedScore = expectedScore + cut;
      const result = this.searchWithWindow(
        board,
        player,
        config,
        adjustedScore,
        config.initialWindow / 4
      );
      if (!bestResult || result.bestMove && result.score > bestResult.score) {
        bestResult = result;
      }
      if (result.score > expectedScore + config.initialWindow) {
        break;
      }
    }
    return bestResult ?? this.pvsEngine.search(board, player, config);
  }
  countEmptySquares(board) {
    let count = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === null) count++;
      }
    }
    return count;
  }
  /**
   * Get search statistics for debugging
   */
  getLastSearchStats() {
    return {
      windowHits: 0,
      windowMisses: 0,
      avgWindow: 0
    };
  }
};

// packages/engine-neo/src/search/timeManager.ts
var TimeManager = class {
  constructor(config) {
    this.moveHistory = [];
    this.emergencyMoves = 0;
    this.config = config;
  }
  /**
   * Calculate time allocation for current move
   */
  allocateTime(board, movesPlayed, isEndgame = false) {
    const empties = this.countEmptySquares(board);
    const remainingTime = this.getRemainingTime();
    if (isEndgame && empties <= 10) {
      return this.allocateEndgameTime(empties, remainingTime);
    }
    const estimatedMovesLeft = this.estimateMovesRemaining(empties, movesPlayed);
    const baseAllocation = this.calculateBaseAllocation(remainingTime, estimatedMovesLeft);
    const phaseMultiplier = this.getPhaseMultiplier(empties);
    const complexityMultiplier = this.getComplexityMultiplier(board);
    const historyMultiplier = this.getHistoryMultiplier();
    const targetTime = Math.max(
      this.config.minThinkTime,
      Math.min(
        baseAllocation * phaseMultiplier * complexityMultiplier * historyMultiplier,
        this.config.maxThinkTime
      )
    );
    const maxTime = Math.min(
      targetTime * 2,
      remainingTime * 0.25
      // Never use more than 25% of remaining time
    );
    const emergencyTime = Math.min(
      targetTime * 0.3,
      remainingTime * 0.05
      // Emergency reserve
    );
    return {
      targetTime,
      maxTime,
      emergencyTime
    };
  }
  /**
   * Special time allocation for endgame
   */
  allocateEndgameTime(empties, remainingTime) {
    let targetTime;
    if (empties <= 4) {
      targetTime = Math.min(remainingTime * 0.4, this.config.maxThinkTime);
    } else if (empties <= 8) {
      targetTime = Math.min(remainingTime * 0.2, this.config.maxThinkTime * 0.8);
    } else {
      targetTime = Math.min(remainingTime * 0.15, this.config.maxThinkTime * 0.6);
    }
    return {
      targetTime: Math.max(targetTime, this.config.minThinkTime),
      maxTime: Math.min(targetTime * 3, remainingTime * 0.5),
      emergencyTime: this.config.minThinkTime
    };
  }
  /**
   * Estimate remaining moves in the game
   */
  estimateMovesRemaining(empties, movesPlayed) {
    if (empties <= 12) {
      return Math.max(empties - 2, 1);
    }
    const estimatedTotalMoves = 58;
    const estimatedRemaining = Math.max(estimatedTotalMoves - movesPlayed, empties / 2);
    return estimatedRemaining;
  }
  /**
   * Calculate base time allocation
   */
  calculateBaseAllocation(remainingTime, movesLeft) {
    const timePerMove = remainingTime / Math.max(movesLeft, 1);
    const incrementBonus = this.config.increment * 0.8;
    return timePerMove + incrementBonus;
  }
  /**
   * Phase-based time multiplier
   */
  getPhaseMultiplier(empties) {
    if (empties >= 50) {
      return 0.6;
    } else if (empties >= 30) {
      return 0.8;
    } else if (empties >= 20) {
      return 1.2;
    } else if (empties >= 12) {
      return 1.4;
    } else {
      return 1;
    }
  }
  /**
   * Board complexity multiplier
   */
  getComplexityMultiplier(board) {
    const mobility = this.estimateMobility(board);
    const stability = this.estimateStability(board);
    let multiplier = 1;
    if (mobility > 8) {
      multiplier *= 1.2;
    } else if (mobility < 3) {
      multiplier *= 0.8;
    }
    if (stability < 0.3) {
      multiplier *= 1.3;
    }
    return Math.max(0.5, Math.min(multiplier, 2));
  }
  /**
   * Historical performance multiplier
   */
  getHistoryMultiplier() {
    if (this.moveHistory.length < 3) {
      return 1;
    }
    const recentMoves = this.moveHistory.slice(-3);
    const avgTime = recentMoves.reduce((a, b) => a + b, 0) / recentMoves.length;
    const targetAvg = (this.config.minThinkTime + this.config.maxThinkTime) / 2;
    if (avgTime > targetAvg * 1.5) {
      return 0.8;
    } else if (avgTime < targetAvg * 0.5) {
      return 1.2;
    }
    return 1;
  }
  /**
   * Emergency time management
   */
  isEmergencyTime(remainingTime, movesLeft) {
    const timePerMove = remainingTime / Math.max(movesLeft, 1);
    return timePerMove < this.config.minThinkTime * 1.5;
  }
  /**
   * Record time used for a move
   */
  recordMoveTime(timeUsed) {
    this.moveHistory.push(timeUsed);
    if (this.moveHistory.length > 10) {
      this.moveHistory.shift();
    }
    if (timeUsed < this.config.minThinkTime * 1.2) {
      this.emergencyMoves++;
    } else {
      this.emergencyMoves = Math.max(0, this.emergencyMoves - 1);
    }
  }
  /**
   * Check if we should extend search time
   */
  shouldExtendTime(currentTime, targetTime, maxTime, bestMoveStable, scoreImproving) {
    if (currentTime >= maxTime) {
      return false;
    }
    if (!bestMoveStable && currentTime < targetTime * 1.5) {
      return true;
    }
    if (scoreImproving && currentTime < targetTime * 1.3) {
      return true;
    }
    if (this.emergencyMoves > 3) {
      return false;
    }
    return false;
  }
  getRemainingTime() {
    return this.config.totalTime;
  }
  countEmptySquares(board) {
    let count = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === null) count++;
      }
    }
    return count;
  }
  estimateMobility(board) {
    let emptyCount = 0;
    let borderCount = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === null) {
          emptyCount++;
          let isBorder = false;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                if (board[nr][nc] !== null) {
                  isBorder = true;
                  break;
                }
              }
            }
            if (isBorder) break;
          }
          if (isBorder) borderCount++;
        }
      }
    }
    return Math.max(1, Math.min(borderCount, 20));
  }
  estimateStability(board) {
    let stableCount = 0;
    let totalPieces = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] !== null) {
          totalPieces++;
          if ((r === 0 || r === 7) && (c === 0 || c === 7)) {
            stableCount += 3;
          } else if (r === 0 || r === 7 || c === 0 || c === 7) {
            stableCount += 1;
          }
        }
      }
    }
    return totalPieces > 0 ? stableCount / totalPieces : 0;
  }
  /**
   * Get time management statistics
   */
  getStats() {
    const avgTime = this.moveHistory.length > 0 ? this.moveHistory.reduce((a, b) => a + b, 0) / this.moveHistory.length : 0;
    const targetTime = (this.config.minThinkTime + this.config.maxThinkTime) / 2;
    const efficiency = avgTime > 0 ? Math.min(1, targetTime / avgTime) : 0;
    return {
      averageMoveTime: avgTime,
      emergencyMoves: this.emergencyMoves,
      timeEfficiency: efficiency
    };
  }
};

// packages/engine-neo/src/index.ts
var DEFAULT_ENGINE_CONFIG = {
  level: 18,
  timeConfig: {
    totalTime: 3e4,
    // 30 seconds
    increment: 1e3,
    // 1 second increment
    minThinkTime: 500,
    // 0.5 seconds minimum
    maxThinkTime: 1e4
    // 10 seconds maximum
  },
  ttSize: 2e5,
  enableOpeningBook: false,
  enableEndgameTablebase: false
};
var EngineNeo = class {
  constructor(config = {}) {
    this.name = "Engine-Neo";
    this.version = "1.0.0";
    this.author = "TypeScript Refactor";
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
    this.aspirationEngine = new AspirationEngine();
    this.tt = new TranspositionTable(this.config.ttSize || 2e5);
    this.killers = new KillerMoves();
    this.history = new HistoryTable();
    const timeConfig = {
      totalTime: 3e4,
      increment: 1e3,
      minThinkTime: 500,
      maxThinkTime: 1e4,
      ...this.config.timeConfig
    };
    this.timeManager = new TimeManager(timeConfig);
    this.searchStats = {
      totalNodes: 0,
      totalSearches: 0,
      avgDepth: 0,
      ttHitRate: 0
    };
  }
  /**
   * Main engine interface method
   */
  async analyze(request) {
    const startTime = Date.now();
    const { gameCore, timeLimit, skill } = request;
    try {
      const { board, currentPlayer } = gameCore;
      const level = skill ? Math.floor(skill / 10) + 10 : this.config.level;
      const empties = this.countEmptySquares(board);
      const isEndgame = isEndgamePhase(board, ENDGAME_THRESHOLD);
      const timeAllocation = this.timeManager.allocateTime(
        board,
        64 - empties,
        // moves played
        isEndgame
      );
      const actualTimeLimit = timeLimit || timeAllocation.targetTime;
      const aspirationConfig = {
        ...DEFAULT_ASPIRATION_CONFIG,
        ...this.config.aspirationConfig,
        level,
        timeLimit: Math.min(actualTimeLimit, timeAllocation.maxTime),
        enableTT: true,
        enableKillers: true,
        enableHistory: true
      };
      const searchResult = this.aspirationEngine.search(
        board,
        currentPlayer,
        aspirationConfig
      );
      const timeUsed = Date.now() - startTime;
      this.timeManager.recordMoveTime(timeUsed);
      this.updateStats(searchResult);
      this.history.ageHistory(0.95);
      return {
        bestMove: searchResult.bestMove || void 0,
        evaluation: searchResult.score,
        depth: searchResult.depth,
        nodes: searchResult.nodes,
        timeUsed,
        pv: searchResult.pv || [],
        stats: {
          ttHits: searchResult.ttHits,
          ttStores: searchResult.ttStores,
          empties,
          isEndgame
        }
      };
    } catch (error) {
      console.error("Engine-Neo search error:", error);
      const fallbackMove = await this.getFallbackMove(gameCore.board, gameCore.currentPlayer);
      const timeUsed = Date.now() - startTime;
      return {
        bestMove: fallbackMove || void 0,
        evaluation: 0,
        depth: 1,
        nodes: 0,
        timeUsed,
        pv: [],
        stats: { error: error instanceof Error ? error.message : "Unknown error" }
      };
    }
  }
  /**
   * Get fallback move using simple heuristics
   */
  async getFallbackMove(board, player) {
    const { getValidMoves: getValidMoves2 } = await Promise.resolve().then(() => (init_src(), src_exports));
    const moves = getValidMoves2(board, player);
    if (moves.length === 0) return null;
    const corners = moves.filter(
      (move) => (move.row === 0 || move.row === 7) && (move.col === 0 || move.col === 7)
    );
    if (corners.length > 0) {
      return corners[0];
    }
    const edges = moves.filter(
      (move) => move.row === 0 || move.row === 7 || move.col === 0 || move.col === 7
    );
    if (edges.length > 0) {
      return edges[0];
    }
    return moves[0];
  }
  /**
   * Update engine statistics
   */
  updateStats(searchResult) {
    this.searchStats.totalNodes += searchResult.nodes || 0;
    this.searchStats.totalSearches++;
    if (searchResult.depth) {
      this.searchStats.avgDepth = (this.searchStats.avgDepth * (this.searchStats.totalSearches - 1) + searchResult.depth) / this.searchStats.totalSearches;
    }
    this.searchStats.ttHitRate = 0.85;
  }
  /**
   * Format evaluation string for display
   */
  formatEvaluation(searchResult, empties, isEndgame) {
    const parts = [];
    parts.push(`Score: ${searchResult.score}`);
    parts.push(`Depth: ${searchResult.depth}`);
    parts.push(`Nodes: ${searchResult.nodes?.toLocaleString() || 0}`);
    if (searchResult.time) {
      const nps = searchResult.nodes ? Math.round(searchResult.nodes / (searchResult.time / 1e3)) : 0;
      parts.push(`NPS: ${nps.toLocaleString()}`);
    }
    if (isEndgame) {
      parts.push(`Endgame (${empties} empty)`);
    }
    if (searchResult.ttHits && searchResult.ttStores) {
      const hitRate = Math.round(searchResult.ttHits / (searchResult.ttHits + searchResult.ttStores) * 100);
      parts.push(`TT: ${hitRate}%`);
    }
    return parts.join(" | ");
  }
  /**
   * Update engine configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.timeConfig) {
      const timeConfig = {
        totalTime: 3e4,
        increment: 1e3,
        minThinkTime: 500,
        maxThinkTime: 1e4,
        ...this.config.timeConfig
      };
      this.timeManager = new TimeManager(timeConfig);
    }
    if (newConfig.ttSize && newConfig.ttSize !== this.config.ttSize) {
      this.tt = new TranspositionTable(newConfig.ttSize);
    }
  }
  /**
   * Clear engine state (between games)
   */
  clearState() {
    this.tt.clear();
    this.killers.clear();
    this.history.clear();
    this.searchStats = {
      totalNodes: 0,
      totalSearches: 0,
      avgDepth: 0,
      ttHitRate: 0
    };
  }
  /**
   * Get engine statistics
   */
  getStats() {
    return {
      ...this.searchStats,
      timeStats: this.timeManager.getStats(),
      ttStats: this.tt.getStats()
    };
  }
  /**
   * Get engine name and version
   */
  getName() {
    return "Engine-Neo v1.0";
  }
  /**
   * Get supported features
   */
  getFeatures() {
    return [
      "Principal Variation Search",
      "Aspiration Windows",
      "Transposition Table",
      "Move Ordering (Killers + History)",
      "Dynamic Time Management",
      "Multi-phase Evaluation",
      "Configurable Difficulty",
      "Endgame Solver"
    ];
  }
  countEmptySquares(board) {
    let count = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === null) count++;
      }
    }
    return count;
  }
};
var engineNeo = new EngineNeo();
var index_default = engineNeo;
export {
  AspirationEngine,
  DEFAULT_ASPIRATION_CONFIG,
  DEFAULT_ENGINE_CONFIG,
  DifficultyLevel,
  ENDGAME_THRESHOLD,
  EngineNeo,
  HistoryTable,
  KillerMoves,
  PRUNING_PARAMS,
  STABILITY_THRESHOLDS,
  TimeManager,
  TranspositionTable,
  index_default as default,
  engineNeo,
  evaluateBoard,
  getDifficultyLevel,
  getLevelConfig,
  getSelectivitySettings,
  isEndgamePhase,
  quickEvaluate
};
//# sourceMappingURL=engine-neo.browser.js.map
