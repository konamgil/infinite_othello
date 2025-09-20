/** @type {-1 | 0 | 1} Disc - 보드 위의 돌 상태를 나타냅니다. -1: 백돌, 1: 흑돌, 0: 빈 칸. */
export type Disc = -1 | 0 | 1;
/** @type {-1 | 1} Player - 현재 차례인 플레이어를 나타냅니다. -1: 백, 1: 흑. */
export type Player = -1 | 1;
/** @interface Position - 보드 위의 좌표 (x, y)를 나타냅니다. */
export interface Position { x: number; y: number; }

/** @type {Disc[][]} Board - 8x8 오델로 보드 상태를 나타내는 2차원 배열입니다. */
export type Board = Disc[][];

/** 8방향(상, 하, 좌, 우, 대각선)을 나타내는 벡터 배열. */
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

/**
 * 오델로 게임의 핵심 로직을 관리하는 클래스입니다.
 * 보드 상태 관리, 수의 유효성 검사, 수 실행, 게임 종료 판정 등의 기능을 제공합니다.
 */
export class OthelloEngine {
  private board: Board;

  constructor() {
    this.board = this.createInitialBoard();
  }

  /**
   * 오델로 게임의 초기 보드 상태를 생성합니다.
   * @returns {Board} 중앙에 4개의 돌이 배치된 8x8 보드.
   */
  private createInitialBoard(): Board {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(0));
    board[3][3] = -1; // White
    board[4][4] = -1; // White
    board[3][4] = 1;  // Black
    board[4][3] = 1;  // Black
    return board;
  }

  /**
   * 현재 보드 상태의 깊은 복사본을 반환합니다.
   * @returns {Board} 현재 보드 상태.
   */
  public getBoard(): Board {
    return this.board.map(row => [...row]);
  }

  /**
   * 외부에서 제공된 보드 상태로 엔진의 보드를 설정합니다.
   * @param {Board} board - 설정할 새로운 보드 상태.
   */
  public setBoard(board: Board): void {
    this.board = board.map(row => [...row]);
  }

  /**
   * 보드를 게임 시작 상태로 초기화합니다.
   */
  public resetBoard(): void {
    this.board = this.createInitialBoard();
  }

  /**
   * 지정된 위치에 현재 플레이어가 돌을 놓을 수 있는지 확인합니다.
   * @param {number} x - x 좌표 (0-7).
   * @param {number} y - y 좌표 (0-7).
   * @param {Player} player - 현재 플레이어.
   * @returns {boolean} 해당 위치에 수를 둘 수 있으면 true, 아니면 false.
   */
  public isValidMove(x: number, y: number, player: Player): boolean {
    if (x < 0 || x >= 8 || y < 0 || y >= 8 || this.board[y][x] !== 0) {
      return false;
    }
    // 8방향 중 하나라도 뒤집을 수 있는 돌이 있는지 확인합니다.
    for (const [dx, dy] of DIRECTIONS) {
      if (this.canFlipInDirection(x, y, dx, dy, player)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 특정 방향으로 상대방의 돌을 뒤집을 수 있는지 확인하는 내부 헬퍼 함수입니다.
   * @private
   */
  private canFlipInDirection(x: number, y: number, dx: number, dy: number, player: Player): boolean {
    let nx = x + dx;
    let ny = y + dy;
    let hasOpponentPiece = false;

    while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
      const piece = this.board[ny][nx];
      if (piece === 0) return false; // 빈 칸을 만나면 이 방향으로는 뒤집을 수 없음
      if (piece === player) return hasOpponentPiece; // 자신의 돌을 만나면, 그 사이에 상대 돌이 있었는지 여부를 반환
      hasOpponentPiece = true; // 상대 돌을 발견
      nx += dx;
      ny += dy;
    }
    return false; // 보드 경계를 벗어나면 뒤집을 수 없음
  }

  /**
   * 지정된 위치에 돌을 놓고, 뒤집히는 모든 상대 돌의 색을 바꿉니다.
   * @param {number} x - x 좌표 (0-7).
   * @param {number} y - y 좌표 (0-7).
   * @param {Player} player - 현재 플레이어.
   * @returns {Position[]} 이번 수로 인해 뒤집힌 돌들의 위치 배열. 유효하지 않은 수일 경우 빈 배열을 반환합니다.
   */
  public makeMove(x: number, y: number, player: Player): Position[] {
    if (!this.isValidMove(x, y, player)) {
      return [];
    }

    const flippedPositions: Position[] = [];
    this.board[y][x] = player;

    for (const [dx, dy] of DIRECTIONS) {
      const flipped = this.flipInDirection(x, y, dx, dy, player);
      flippedPositions.push(...flipped);
    }

    return flippedPositions;
  }

  /**
   * 특정 방향의 상대 돌들을 실제로 뒤집는 내부 헬퍼 함수입니다.
   * @private
   */
  private flipInDirection(x: number, y: number, dx: number, dy: number, player: Player): Position[] {
    const flipped: Position[] = [];
    let nx = x + dx;
    let ny = y + dy;
    const toFlip: Position[] = [];

    while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
      const piece = this.board[ny][nx];
      if (piece === 0) return [];
      if (piece === player) {
        // 자신의 돌을 만나면, 그동안 저장해둔 상대 돌들을 모두 뒤집습니다.
        for (const pos of toFlip) {
          this.board[pos.y][pos.x] = player;
          flipped.push(pos);
        }
        return flipped;
      }
      toFlip.push({ x: nx, y: ny });
      nx += dx;
      ny += dy;
    }
    return [];
  }

  /**
   * 현재 플레이어가 둘 수 있는 모든 유효한 수의 위치를 반환합니다.
   * @param {Player} player - 현재 플레이어.
   * @returns {Position[]} 가능한 모든 수의 위치 배열.
   */
  public getValidMoves(player: Player): Position[] {
    const validMoves: Position[] = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (this.isValidMove(x, y, player)) {
          validMoves.push({ x, y });
        }
      }
    }
    return validMoves;
  }

  /**
   * 게임이 종료되었는지 확인합니다.
   * 양쪽 플레이어 모두 둘 곳이 없으면 게임이 종료됩니다.
   * @returns {boolean} 게임이 종료되었으면 true, 아니면 false.
   */
  public isGameOver(): boolean {
    const blackMoves = this.getValidMoves(1);
    const whiteMoves = this.getValidMoves(-1);
    return blackMoves.length === 0 && whiteMoves.length === 0;
  }

  /**
   * 현재 보드의 흑돌과 백돌의 개수를 계산하여 반환합니다.
   * @returns {{black: number, white: number}} 흑돌과 백돌의 점수.
   */
  public getScore(): { black: number; white: number } {
    let black = 0;
    let white = 0;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (this.board[y][x] === 1) black++;
        else if (this.board[y][x] === -1) white++;
      }
    }
    return { black, white };
  }

  /**
   * 게임의 승자를 결정합니다.
   * @returns {Player | 'draw' | null} 승자(1 또는 -1), 무승부('draw'), 또는 게임이 아직 끝나지 않았을 경우 null.
   */
  public getWinner(): Player | 'draw' | null {
    if (!this.isGameOver()) return null;
    const { black, white } = this.getScore();
    if (black > white) return 1;
    if (white > black) return -1;
    return 'draw';
  }

  /**
   * 수순(move history) 배열로부터 게임을 재구성하고 각 수 이후의 보드 상태 배열을 반환합니다.
   * 리플레이 기능에 유용합니다.
   * @param {Array<{position: Position, player: Player}>} moves - 게임의 수순 배열.
   * @returns {Board[]} 각 턴 이후의 보드 상태를 담은 배열.
   */
  public reconstructGameFromMoves(moves: Array<{position: Position, player: Player}>): Board[] {
    const boardStates: Board[] = [];
    this.resetBoard();
    boardStates.push(this.getBoard());

    for (const move of moves) {
      if (this.isValidMove(move.position.x, move.position.y, move.player)) {
        this.makeMove(move.position.x, move.position.y, move.player);
        boardStates.push(this.getBoard());
      } else {
        // 유효하지 않은 수가 기보에 포함된 경우 경고를 출력하고 이전 상태를 그대로 유지합니다.
        console.warn(`Invalid move: ${move.position.x}, ${move.position.y} for player ${move.player}`);
        boardStates.push(this.getBoard());
      }
    }
    return boardStates;
  }
}