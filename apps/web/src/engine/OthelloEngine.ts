/**
 * 🧠 Othello Game Engine - 새로운 타입 시스템 기반
 *
 * 핵심 기능:
 * - 게임 규칙 구현 (오델로 표준)
 * - 보드 상태 조작
 * - 유효한 수 계산
 * - 점수 계산
 * - 게임 종료 판정
 *
 * 성능 최적화:
 * - 비트마스크 없이 단순하고 빠른 구현
 * - 불필요한 메모리 할당 최소화
 * - 직관적이고 디버그 용이한 코드
 */

import {
  type Board,
  type Cell,
  type Player,
  type Position,
  type Score,
  getOpponent,
  isValidPosition,
  GAME_CONSTANTS
} from 'shared-types';

// ===== Move Result Interface =====

interface MoveEngineResult {
  success: boolean;
  newBoard: Board;
  capturedCells: Position[];
}

// ===== Othello Engine Class =====

export class OthelloEngine {
  // 8방향 벡터 (시계방향)
  private static readonly DIRECTIONS: readonly [number, number][] = [
    [-1, -1], [-1, 0], [-1, 1],  // 위쪽 3방향
    [0, -1],           [0, 1],   // 좌우
    [1, -1],  [1, 0],  [1, 1]    // 아래쪽 3방향
  ] as const;

  // ===== Board Creation =====

  /**
   * 표준 오델로 초기 보드 생성
   */
  createInitialBoard(): Board {
    // 8x8 빈 보드 생성
    const board: Board = Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => null)
    );

    // 초기 4개 돌 배치 (중앙 2x2)
    board[3][3] = 'white';
    board[3][4] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';

    return board;
  }

  // ===== Valid Moves Calculation =====

  /**
   * 주어진 플레이어의 모든 유효한 수 계산
   */
  getValidMoves(board: Board, player: Player): Position[] {
    const validMoves: Position[] = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const position: Position = { row, col };

        if (this.isValidMove(board, position, player)) {
          validMoves.push(position);
        }
      }
    }

    return validMoves;
  }

  /**
   * 특정 위치가 유효한 수인지 검사
   */
  isValidMove(board: Board, position: Position, player: Player): boolean {
    // 범위 검사
    if (!isValidPosition(position)) return false;

    // 이미 돌이 있는지 검사
    if (board[position.row][position.col] !== null) return false;

    // 8방향 중 하나라도 뒤집을 수 있으면 유효
    return OthelloEngine.DIRECTIONS.some(([dRow, dCol]) =>
      this.canCaptureInDirection(board, position, player, dRow, dCol)
    );
  }

  /**
   * 특정 방향으로 돌을 뒤집을 수 있는지 검사
   */
  private canCaptureInDirection(
    board: Board,
    position: Position,
    player: Player,
    dRow: number,
    dCol: number
  ): boolean {
    const opponent = getOpponent(player);
    let currentRow = position.row + dRow;
    let currentCol = position.col + dCol;
    let hasOpponentPieces = false;

    // 방향을 따라 탐색
    while (
      currentRow >= 0 && currentRow < 8 &&
      currentCol >= 0 && currentCol < 8
    ) {
      const cell = board[currentRow][currentCol];

      if (cell === null) {
        // 빈 칸 만나면 뒤집을 수 없음
        return false;
      } else if (cell === opponent) {
        // 상대방 돌 발견
        hasOpponentPieces = true;
      } else if (cell === player) {
        // 자신의 돌 발견 - 사이에 상대방 돌이 있어야 뒤집기 가능
        return hasOpponentPieces;
      }

      currentRow += dRow;
      currentCol += dCol;
    }

    // 보드 끝까지 갔는데 자신의 돌을 만나지 못함
    return false;
  }

  // ===== Move Execution =====

  /**
   * 이동을 실행하고 새로운 보드 상태 반환
   */
  makeMove(board: Board, position: Position, player: Player): MoveEngineResult {
    if (!this.isValidMove(board, position, player)) {
      return {
        success: false,
        newBoard: board,
        capturedCells: []
      };
    }

    // 새 보드 생성 (deep copy)
    const newBoard: Board = board.map(row => [...row]);
    const capturedCells: Position[] = [];

    // 돌 배치
    newBoard[position.row][position.col] = player;

    // 8방향으로 돌 뒤집기
    for (const [dRow, dCol] of OthelloEngine.DIRECTIONS) {
      const captured = this.captureInDirection(
        newBoard,
        position,
        player,
        dRow,
        dCol
      );
      capturedCells.push(...captured);
    }

    return {
      success: true,
      newBoard,
      capturedCells
    };
  }

  /**
   * 특정 방향으로 돌 뒤집기 실행
   */
  private captureInDirection(
    board: Board,
    position: Position,
    player: Player,
    dRow: number,
    dCol: number
  ): Position[] {
    if (!this.canCaptureInDirection(board, position, player, dRow, dCol)) {
      return [];
    }

    const opponent = getOpponent(player);
    const captured: Position[] = [];
    let currentRow = position.row + dRow;
    let currentCol = position.col + dCol;

    // 상대방 돌들을 뒤집기
    while (
      currentRow >= 0 && currentRow < 8 &&
      currentCol >= 0 && currentCol < 8 &&
      board[currentRow][currentCol] === opponent
    ) {
      board[currentRow][currentCol] = player;
      captured.push({ row: currentRow, col: currentCol });

      currentRow += dRow;
      currentCol += dCol;
    }

    return captured;
  }

  // ===== Score Calculation =====

  /**
   * 현재 보드의 점수 계산
   */
  calculateScore(board: Board): Score {
    let black = 0;
    let white = 0;

    for (const row of board) {
      for (const cell of row) {
        if (cell === 'black') black++;
        else if (cell === 'white') white++;
      }
    }

    return { black, white };
  }

  // ===== Game End Detection =====

  /**
   * 게임이 끝났는지 판정
   */
  isGameFinished(board: Board, validMoves?: Position[]): boolean {
    // 유효한 수가 주어졌으면 사용, 아니면 계산
    const blackMoves = validMoves || this.getValidMoves(board, 'black');
    const whiteMoves = this.getValidMoves(board, 'white');

    // 둘 다 둘 수 없으면 게임 종료
    if (blackMoves.length === 0 && whiteMoves.length === 0) {
      return true;
    }

    // 보드가 가득 찼으면 게임 종료
    return this.isBoardFull(board);
  }

  /**
   * 보드가 가득 찼는지 검사
   */
  private isBoardFull(board: Board): boolean {
    return board.every(row => row.every(cell => cell !== null));
  }

  /**
   * 승자 결정
   */
  getWinner(score: Score): Player | 'draw' {
    if (score.black > score.white) return 'black';
    if (score.white > score.black) return 'white';
    return 'draw';
  }

  // ===== Utility Methods =====

  /**
   * 보드 상태를 문자열로 변환 (디버깅용)
   */
  boardToString(board: Board): string {
    const rows = board.map((row, rowIndex) => {
      const cells = row.map(cell => {
        if (cell === 'black') return '●';
        if (cell === 'white') return '○';
        return '·';
      }).join(' ');
      return `${rowIndex + 1} ${cells}`;
    });

    const header = '  a b c d e f g h';
    return [header, ...rows].join('\n');
  }

  /**
   * 보드 복사 (deep copy)
   */
  cloneBoard(board: Board): Board {
    return board.map(row => [...row]);
  }

  /**
   * 두 보드가 같은지 비교
   */
  boardsEqual(board1: Board, board2: Board): boolean {
    return board1.every((row, rowIndex) =>
      row.every((cell, colIndex) =>
        cell === board2[rowIndex][colIndex]
      )
    );
  }

  /**
   * 보드 상태 유효성 검사
   */
  validateBoard(board: Board): boolean {
    // 크기 검사
    if (board.length !== 8) return false;
    if (!board.every(row => row.length === 8)) return false;

    // 셀 값 검사
    return board.every(row =>
      row.every(cell =>
        cell === null || cell === 'black' || cell === 'white'
      )
    );
  }

  // ===== Performance Benchmarking =====

  /**
   * 성능 측정용 - 대량 유효 수 계산
   */
  benchmarkValidMoves(board: Board, iterations: number = 1000): number {
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      this.getValidMoves(board, 'black');
      this.getValidMoves(board, 'white');
    }

    const end = performance.now();
    return end - start;
  }
}