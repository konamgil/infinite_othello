
import { searchBestMove, type SearchOptions } from './search';
import { scoreToProb } from './probability';
import { isValidMove, flipPieces, type NumericBoard, type NumericPlayer, setWeightLevel } from './ai';

export interface AlgorithmMoveResult {
  row: number;
  col: number;
}

interface AlgorithmOptions extends Pick<SearchOptions, 'maxDepth' | 'timeLimitMs'> {}

const globalAny = globalThis as typeof globalThis & {
  OpeningBook?: {
    getBookMove?: (
      history: AlgorithmMoveResult[],
      aiPlayer: NumericPlayer,
      board: NumericBoard,
    ) => AlgorithmMoveResult | null;
  };
  GameMessages?: { openingBookPrefix?: string };
};

function formatMoveTag(move: AlgorithmMoveResult): string {
  return 'ABCDEFGH'[move.col] + String(move.row + 1);
}

export async function getMove(
  board: NumericBoard,
  player: NumericPlayer,
  aiPlayer: NumericPlayer,
  moveHistory: AlgorithmMoveResult[],
  { maxDepth, timeLimitMs }: AlgorithmOptions,
): Promise<AlgorithmMoveResult | null> {
  let bookMove: AlgorithmMoveResult | null = null;
  let bookProb = -1;

  const openingBook = globalAny.OpeningBook;
  if (openingBook?.getBookMove) {
    try {
      const candidate = openingBook.getBookMove(moveHistory, aiPlayer, board);
      if (candidate && isValidMove(candidate.row, candidate.col, aiPlayer, board)) {
        const boardCopy = board.map((row) => [...row]);
        flipPieces(boardCopy, candidate.row, candidate.col, aiPlayer);
        const { score } = searchBestMove(boardCopy, {
          maxDepth,
          timeLimitMs,
          player,
          aiPlayer,
          isMaximizing: false,
        });
        bookMove = candidate;
        bookProb = scoreToProb(score);
      }
    } catch {
      bookMove = null;
    }
  }

  const searchResult = searchBestMove(board, {
    maxDepth,
    timeLimitMs,
    player,
    aiPlayer,
    isMaximizing: true,
  });
  const searchProb = scoreToProb(searchResult.score);
  const searchMove = searchResult.move
    ? { row: searchResult.move[0], col: searchResult.move[1] }
    : null;

  let chosenMove = searchMove;
  if (bookMove && bookProb >= searchProb) {
    chosenMove = bookMove;
    const prefix = globalAny.GameMessages?.openingBookPrefix ?? '';
    console.log(`${prefix}${formatMoveTag(bookMove)}`);
  } else if (searchMove) {
    console.log(`Local search: ${formatMoveTag(searchMove)}`);
  }

  return chosenMove;
}

export default { getMove };
