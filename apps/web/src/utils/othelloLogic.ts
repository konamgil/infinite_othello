/**
 * 오델로 게임 로직 유틸리티
 * 실제 오델로 규칙에 따른 게임 로직 구현
 */

export type Player = 'black' | 'white';
export type Cell = Player | null;
export type Board = Cell[][];

export interface Position {
  row: number;
  col: number;
}

export interface ValidMove extends Position {
  flipsCount: number; // 이 수로 뒤집을 수 있는 돌의 개수
  flippedPositions: Position[]; // 뒤집힐 돌들의 위치
}

// 8방향 (상, 하, 좌, 우, 대각선 4방향)
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],  // 위 대각선, 위, 위 대각선
  [0, -1],           [0, 1],   // 좌, 우
  [1, -1],  [1, 0],  [1, 1]    // 아래 대각선, 아래, 아래 대각선
];

/**
 * 새로운 8x8 오델로 보드를 생성합니다
 */
export const createInitialBoard = (): Board => {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

  // 초기 4개 돌 배치 (표준 오델로 규칙)
  board[3][3] = 'white';
  board[3][4] = 'black';
  board[4][3] = 'black';
  board[4][4] = 'white';

  return board;
};

/**
 * 보드 위치가 유효한지 확인합니다
 */
export const isValidPosition = (row: number, col: number): boolean => {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
};

/**
 * 특정 방향으로 뒤집을 수 있는 돌들을 찾습니다
 */
const getFlippedInDirection = (
  board: Board,
  row: number,
  col: number,
  dirRow: number,
  dirCol: number,
  player: Player
): Position[] => {
  const flipped: Position[] = [];
  const opponent = player === 'black' ? 'white' : 'black';

  let currentRow = row + dirRow;
  let currentCol = col + dirCol;

  // 첫 번째로 만나는 돌이 상대방 돌이어야 함
  while (isValidPosition(currentRow, currentCol) && board[currentRow][currentCol] === opponent) {
    flipped.push({ row: currentRow, col: currentCol });
    currentRow += dirRow;
    currentCol += dirCol;
  }

  // 마지막에 자신의 돌을 만나야 유효한 방향
  if (isValidPosition(currentRow, currentCol) && board[currentRow][currentCol] === player && flipped.length > 0) {
    return flipped;
  }

  return []; // 유효하지 않은 방향
};

/**
 * 특정 위치에 돌을 놓았을 때 뒤집힐 모든 돌들을 계산합니다
 */
export const getFlippedPositions = (board: Board, row: number, col: number, player: Player): Position[] => {
  if (!isValidPosition(row, col) || board[row][col] !== null) {
    return [];
  }

  const allFlipped: Position[] = [];

  // 8방향 모두 검사
  for (const [dirRow, dirCol] of DIRECTIONS) {
    const flippedInDirection = getFlippedInDirection(board, row, col, dirRow, dirCol, player);
    allFlipped.push(...flippedInDirection);
  }

  return allFlipped;
};

/**
 * 특정 플레이어의 모든 유효한 수를 계산합니다
 */
export const getValidMoves = (board: Board, player: Player): ValidMove[] => {
  const validMoves: ValidMove[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === null) {
        const flippedPositions = getFlippedPositions(board, row, col, player);

        if (flippedPositions.length > 0) {
          validMoves.push({
            row,
            col,
            flipsCount: flippedPositions.length,
            flippedPositions
          });
        }
      }
    }
  }

  return validMoves;
};

/**
 * 실제로 수를 두고 돌들을 뒤집습니다
 */
export const makeMove = (board: Board, row: number, col: number, player: Player): Board | null => {
  const flippedPositions = getFlippedPositions(board, row, col, player);

  if (flippedPositions.length === 0) {
    return null; // 유효하지 않은 수
  }

  // 새로운 보드 생성 (불변성 유지)
  const newBoard = board.map(row => [...row]);

  // 새 돌 놓기
  newBoard[row][col] = player;

  // 돌들 뒤집기
  for (const pos of flippedPositions) {
    newBoard[pos.row][pos.col] = player;
  }

  return newBoard;
};

/**
 * 현재 보드의 점수를 계산합니다
 */
export const calculateScore = (board: Board): { black: number; white: number } => {
  let black = 0;
  let white = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === 'black') black++;
      else if (board[row][col] === 'white') white++;
    }
  }

  return { black, white };
};

/**
 * 게임이 끝났는지 확인합니다
 * 오델로는 양 플레이어 모두 둘 수 없을 때 끝납니다
 */
export const isGameFinished = (board: Board): boolean => {
  const blackMoves = getValidMoves(board, 'black');
  const whiteMoves = getValidMoves(board, 'white');

  // 양쪽 모두 둘 수 없거나, 보드가 꽉 찼을 때
  return (blackMoves.length === 0 && whiteMoves.length === 0) || isBoardFull(board);
};

/**
 * 보드가 완전히 찼는지 확인합니다
 */
export const isBoardFull = (board: Board): boolean => {
  return board.every(row => row.every(cell => cell !== null));
};

/**
 * 승자를 결정합니다
 */
export const getWinner = (board: Board): 'black' | 'white' | 'tie' => {
  const { black, white } = calculateScore(board);

  if (black > white) return 'black';
  if (white > black) return 'white';
  return 'tie';
};

/**
 * 플레이어가 패스해야 하는지 확인합니다
 * (유효한 수가 없을 때)
 */
export const shouldPass = (board: Board, player: Player): boolean => {
  return getValidMoves(board, player).length === 0;
};

/**
 * 게임 상태를 문자열로 출력 (디버깅용)
 */
export const boardToString = (board: Board): string => {
  return board.map(row =>
    row.map(cell => {
      if (cell === 'black') return '●';
      if (cell === 'white') return '○';
      return '·';
    }).join(' ')
  ).join('\n');
};