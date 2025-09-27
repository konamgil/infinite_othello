// EngineBase: 모든 엔진의 공통 베이스 클래스
// core의 공통 로직을 제공하고 각 엔진이 특화된 기능을 구현할 수 있도록 함

import type {
  Engine,
  EngineRequest,
  EngineResponse,
  GameCore,
  Board,
  Player,
  Position,
  Score,
  MoveResult
} from 'shared-types';

import {
  // 게임 로직
  createInitialGameCore,
  getValidMoves,
  isValidMove,
  makeMove,
  calculateScore,
  isGameOver,
  getGameResult,
  getPositionHash,
  getMobility,
  getEmptySquares,
  gameCoreForEngine,
  
  // 비트보드
  BitBoard,
  ensureBoard,
  boardToBitBoard,
  bitBoardToBoard,
  flipPieces,
  undoMove,
  MoveToken,
  
  // 게임 상태 관리
  GameStateManager,
  
  // 평가
  getStoneDifference,
  mapEvaluationToStoneScale,
  summarizeEvaluation
} from './index';

export abstract class EngineBase implements Engine {
  protected gameCore: GameCore;
  protected gameStateManager: GameStateManager;
  protected bitboard: BitBoard | null = null;
  
  // 엔진 메타데이터 (각 엔진에서 오버라이드)
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly author: string;

  constructor() {
    this.gameCore = createInitialGameCore();
    this.gameStateManager = new GameStateManager();
  }

  // ===== 공통 게임 로직 메서드들 =====

  /**
   * 유효한 수 목록 반환
   */
  protected getValidMoves(board: Board, player: Player): Position[] {
    return getValidMoves(board, player);
  }

  /**
   * 수의 유효성 검증
   */
  protected isValidMove(board: Board, position: Position, player: Player): boolean {
    return isValidMove(board, position, player);
  }

  /**
   * 수 시뮬레이션 (비트보드 기반 고속)
   */
  protected simulateMove(board: Board, position: Position, player: Player): Board | null {
    try {
      const bitBoard = ensureBoard(boardToBitBoard(board));
      const moveToken = flipPieces(bitBoard, position.row, position.col, player);
      
      if (!moveToken) {
        return null; // 유효하지 않은 수
      }
      
      return bitBoardToBoard(bitBoard);
    } catch (error) {
      console.warn('SimulateMove error:', error);
      return null;
    }
  }

  /**
   * 수 적용 (게임 상태 업데이트)
   */
  protected applyMove(gameCore: GameCore, position: Position): MoveResult {
    return makeMove(gameCore, position);
  }

  /**
   * 점수 계산
   */
  protected calculateScore(board: Board): Score {
    return calculateScore(board);
  }

  /**
   * 빈 칸 수 계산
   */
  protected getEmptySquares(board: Board): number {
    return getEmptySquares(board);
  }

  /**
   * 이동성 계산 (유효한 수의 개수)
   */
  protected getMobility(board: Board, player: Player): number {
    return getMobility(board, player);
  }

  /**
   * 게임 종료 여부 확인
   */
  protected isGameOver(gameCore: GameCore): boolean {
    return isGameOver(gameCore);
  }

  /**
   * 게임 결과 반환
   */
  protected getGameResult(gameCore: GameCore) {
    return getGameResult(gameCore);
  }

  /**
   * 위치 해시 (트랜스포지션 테이블용)
   */
  protected getPositionHash(gameCore: GameCore): number {
    return getPositionHash(gameCore);
  }

  // ===== 비트보드 관련 메서드들 =====

  /**
   * 보드를 비트보드로 변환
   */
  protected boardToBitBoard(board: Board): BitBoard {
    return ensureBoard(boardToBitBoard(board));
  }

  /**
   * 비트보드를 보드로 변환
   */
  protected bitBoardToBoard(bitBoard: BitBoard): Board {
    return bitBoardToBoard(bitBoard);
  }

  /**
   * 비트보드에서 수 적용
   */
  protected flipPiecesBitboard(bitBoard: BitBoard, row: number, col: number, player: Player): MoveToken | null {
    return flipPieces(bitBoard, row, col, player);
  }

  /**
   * 비트보드에서 수 되돌리기
   */
  protected undoMoveBitboard(bitBoard: BitBoard, moveToken: MoveToken): void {
    undoMove(bitBoard, moveToken);
  }

  // ===== 평가 관련 메서드들 =====

  /**
   * 돌 차이 계산
   */
  protected getStoneDifference(board: Board, perspective: Player = 'black'): number {
    return getStoneDifference(board, perspective);
  }

  /**
   * 평가 점수를 돌 스케일로 매핑
   */
  protected mapEvaluationToStoneScale(evaluation: number | undefined): number {
    return mapEvaluationToStoneScale(evaluation);
  }

  /**
   * 평가 요약
   */
  protected summarizeEvaluation(board: Board, evaluation: number | undefined, perspective: Player = 'black') {
    return summarizeEvaluation(board, evaluation, perspective);
  }

  // ===== 게임 상태 관리 =====

  /**
   * 게임 상태 관리자 반환
   */
  protected getGameStateManager(): GameStateManager {
    return this.gameStateManager;
  }

  /**
   * 현재 게임 상태 반환
   */
  protected getCurrentGameCore(): GameCore {
    return this.gameCore;
  }

  /**
   * 게임 상태 업데이트
   */
  protected updateGameCore(newGameCore: GameCore): void {
    this.gameCore = newGameCore;
  }

  // ===== 유틸리티 메서드들 =====

  /**
   * 상대방 플레이어 반환
   */
  protected getOpponent(player: Player): Player {
    return player === 'black' ? 'white' : 'black';
  }

  /**
   * 보드 복사
   */
  protected copyBoard(board: Board): Board {
    return board.map(row => [...row]);
  }

  /**
   * 게임 단계 분석 (빈 칸 수 기반)
   */
  protected analyzeGamePhase(board: Board): 'opening' | 'midgame' | 'endgame' {
    const empties = this.getEmptySquares(board);
    
    if (empties > 50) return 'opening';
    if (empties > 20) return 'midgame';
    return 'endgame';
  }

  /**
   * 난이도를 스킬 레벨로 변환
   */
  protected difficultyToSkill(difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'master'): number {
    const skillMap = {
      'easy': 25,
      'medium': 50,
      'hard': 75,
      'expert': 90,
      'master': 100
    };
    return skillMap[difficulty] || 50;
  }

  /**
   * 스킬 레벨을 난이도로 변환
   */
  protected skillToDifficulty(skill: number): 'easy' | 'medium' | 'hard' | 'expert' | 'master' {
    if (skill <= 30) return 'easy';
    if (skill <= 60) return 'medium';
    if (skill <= 80) return 'hard';
    if (skill <= 95) return 'expert';
    return 'master';
  }

  // ===== 추상 메서드 (각 엔진에서 구현) =====

  /**
   * 메인 분석 메서드 - 각 엔진에서 구현
   */
  abstract analyze(request: EngineRequest): Promise<EngineResponse>;

  // ===== 선택적 오버라이드 메서드들 =====

  /**
   * 엔진 초기화 (필요시 오버라이드)
   */
  protected initialize(): void {
    // 기본 구현은 비어있음
  }

  /**
   * 엔진 정리 (필요시 오버라이드)
   */
  protected cleanup(): void {
    // 기본 구현은 비어있음
  }

  /**
   * 설정 업데이트 (필요시 오버라이드)
   */
  protected updateConfig(config: any): void {
    // 기본 구현은 비어있음
  }

  // ===== 공통 오류 처리 =====

  /**
   * 폴백 응답 생성
   */
  protected getFallbackResponse(startTime: number): EngineResponse {
    const validMoves = this.getValidMoves(this.gameCore.board, this.gameCore.currentPlayer);
    const randomMove = validMoves.length > 0 
      ? validMoves[Math.floor(Math.random() * validMoves.length)]
      : undefined;

    return {
      bestMove: randomMove,
      evaluation: 0,
      depth: 0,
      nodes: 1,
      timeUsed: Date.now() - startTime
    };
  }

  /**
   * 입력 검증
   */
  protected validateRequest(request: EngineRequest): void {
    if (!request.gameCore) {
      throw new Error('GameCore is required');
    }
    
    if (!request.gameCore.board) {
      throw new Error('Board is required');
    }
    
    if (!request.gameCore.currentPlayer) {
      throw new Error('Current player is required');
    }
  }
}

