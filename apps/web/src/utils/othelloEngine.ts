// Local type definitions to avoid import issues
export type Disc = -1 | 0 | 1; // -1: White, 1: Black, 0: Empty
export type Player = -1 | 1;
export interface Position { x: number; y: number; }

export type Board = Disc[][];

// 8방향 벡터 (상, 하, 좌, 우, 대각선)
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

export class OthelloEngine {
  private board: Board;

  constructor() {
    this.board = this.createInitialBoard();
  }

  private createInitialBoard(): Board {
    const board: Board = Array(8).fill(null).map(() => Array(8).fill(0));

    // 초기 4개 돌 배치
    board[3][3] = -1; // White
    board[4][4] = -1; // White
    board[3][4] = 1;  // Black
    board[4][3] = 1;  // Black

    return board;
  }

  public getBoard(): Board {
    return this.board.map(row => [...row]);
  }

  public setBoard(board: Board): void {
    this.board = board.map(row => [...row]);
  }

  public resetBoard(): void {
    this.board = this.createInitialBoard();
  }

  // 특정 위치에 돌을 놓을 수 있는지 확인
  public isValidMove(x: number, y: number, player: Player): boolean {
    if (x < 0 || x >= 8 || y < 0 || y >= 8) return false;
    if (this.board[y][x] !== 0) return false;

    // 8방향으로 상대 돌을 뒤집을 수 있는지 확인
    for (const [dx, dy] of DIRECTIONS) {
      if (this.canFlipInDirection(x, y, dx, dy, player)) {
        return true;
      }
    }

    return false;
  }

  // 특정 방향으로 돌을 뒤집을 수 있는지 확인
  private canFlipInDirection(x: number, y: number, dx: number, dy: number, player: Player): boolean {
    let nx = x + dx;
    let ny = y + dy;
    let hasOpponentPiece = false;

    while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
      const piece = this.board[ny][nx];

      if (piece === 0) return false; // 빈 칸을 만나면 뒤집을 수 없음
      if (piece === player) return hasOpponentPiece; // 같은 색 돌을 만나면 뒤집기 가능 여부 반환

      hasOpponentPiece = true; // 상대 돌을 발견
      nx += dx;
      ny += dy;
    }

    return false; // 보드 경계에 도달하면 뒤집을 수 없음
  }

  // 실제로 돌을 놓고 뒤집기
  public makeMove(x: number, y: number, player: Player): Position[] {
    if (!this.isValidMove(x, y, player)) {
      return [];
    }

    const flippedPositions: Position[] = [];
    this.board[y][x] = player;

    // 8방향으로 돌 뒤집기
    for (const [dx, dy] of DIRECTIONS) {
      const flipped = this.flipInDirection(x, y, dx, dy, player);
      flippedPositions.push(...flipped);
    }

    return flippedPositions;
  }

  // 특정 방향으로 돌 뒤집기
  private flipInDirection(x: number, y: number, dx: number, dy: number, player: Player): Position[] {
    const flipped: Position[] = [];
    let nx = x + dx;
    let ny = y + dy;

    // 뒤집을 돌들 임시 저장
    const toFlip: Position[] = [];

    while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
      const piece = this.board[ny][nx];

      if (piece === 0) return []; // 빈 칸을 만나면 뒤집지 않음
      if (piece === player) {
        // 같은 색 돌을 만나면 임시 저장된 돌들을 모두 뒤집기
        for (const pos of toFlip) {
          this.board[pos.y][pos.x] = player;
          flipped.push(pos);
        }
        return flipped;
      }

      // 상대 돌을 임시 저장
      toFlip.push({ x: nx, y: ny });
      nx += dx;
      ny += dy;
    }

    return []; // 보드 경계에 도달하면 뒤집지 않음
  }

  // 가능한 모든 수 찾기
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

  // 게임 종료 여부 확인
  public isGameOver(): boolean {
    const blackMoves = this.getValidMoves(1);
    const whiteMoves = this.getValidMoves(-1);
    return blackMoves.length === 0 && whiteMoves.length === 0;
  }

  // 점수 계산
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

  // 승자 판정
  public getWinner(): Player | 'draw' | null {
    if (!this.isGameOver()) return null;

    const { black, white } = this.getScore();
    if (black > white) return 1;
    if (white > black) return -1;
    return 'draw';
  }

  // 게임 상태를 수순으로부터 재구성
  public reconstructGameFromMoves(moves: Array<{position: Position, player: Player}>): Board[] {
    const boardStates: Board[] = [];
    this.resetBoard();

    // 초기 상태 저장
    boardStates.push(this.getBoard());

    // 각 수를 순서대로 적용
    for (const move of moves) {
      if (this.isValidMove(move.position.x, move.position.y, move.player)) {
        this.makeMove(move.position.x, move.position.y, move.player);
        boardStates.push(this.getBoard());
      } else {
        // 잘못된 수가 있으면 이전 상태 복사
        console.warn(`Invalid move: ${move.position.x}, ${move.position.y} for player ${move.player}`);
        boardStates.push(this.getBoard());
      }
    }

    return boardStates;
  }
}