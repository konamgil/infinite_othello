/**
 * 300층 타워 AI 엔진 시스템
 * 각 층마다 점진적으로 강해지는 AI 적수 제공
 */

import {
  getValidMoves,
  makeMove,
  calculateScore,
  type Board,
  type Player,
  type ValidMove,
} from './othelloLogic';

import type {
  Engine,
  EngineRequest,
  GameCore as SharedGameCore,
  Board as SharedBoard,
  Position as SharedPosition,
  Move as SharedMove
} from 'shared-types';

// === 타워 AI 설정 ===
export interface TowerAIConfig {
  floor: number; // 1-300층
  name: string;
  description: string;
  difficulty: AILevel;
  personality: AIPersonality;
  strategy: AIStrategy;
  thinkingTime: number; // ms
  mistakeRate: number; // 0-1 (실수할 확률)
  specialAbilities: AIAbility[];
}

export type AILevel =
  | 'tutorial'     // 1-10층: 초보자 학습용
  | 'beginner'     // 11-50층: 기본 패턴
  | 'intermediate' // 51-150층: 중급 전략
  | 'advanced'     // 151-250층: 고급 전략
  | 'master'       // 251-290층: 마스터급
  | 'grandmaster'  // 291-300층: 그랜드마스터
  | 'legendary';   // 300층: 전설급

export type AIPersonality =
  | 'aggressive'   // 공격적 - 많이 뒤집으려 함
  | 'defensive'    // 방어적 - 안전한 수 선호
  | 'positional'   // 위치 중심 - 모서리/가장자리 중시
  | 'tactical'     // 전술적 - 복합 전략
  | 'chaotic'      // 카오틱 - 예측 불가능
  | 'perfect';     // 완벽 - 최적 수만 선택

export type AIStrategy =
  | 'random'       // 랜덤 선택
  | 'greedy'       // 가장 많이 뒤집기
  | 'corners'      // 모서리 우선
  | 'edges'        // 가장자리 중시
  | 'mobility'     // 이동성 중시
  | 'minimax'      // 미니맥스 알고리즘
  | 'alphaBeta'    // 알파베타 프루닝
  | 'monteCarlo'   // 몬테카를로 트리 서치
  | 'hybrid';      // 복합 전략

export type AIAbility =
  | 'opening_book'     // 오프닝 북 사용
  | 'endgame_solver'   // 엔드게임 솔버
  | 'position_eval'    // 위치 평가 함수
  | 'pattern_matching' // 패턴 매칭
  | 'learning'         // 학습 능력
  | 'adaptation'       // 상대 적응
  | 'time_management'; // 시간 관리

// === 엔진 정책 ===
const TOWER_ENGINE_POLICY = {
  mode: 'neo' as 'neo' | 'legacy' | 'hybrid',
  neoStartFloor: 1
} as const;

const DIFFICULTY_SKILL_MAP: Record<AILevel, number> = {
  tutorial: 15,
  beginner: 30,
  intermediate: 55,
  advanced: 75,
  master: 90,
  grandmaster: 95,
  legendary: 100
};

const shouldUseNeoEngine = (floor: number): boolean => {
  switch (TOWER_ENGINE_POLICY.mode) {
    case 'legacy':
      return false;
    case 'hybrid':
      return floor >= TOWER_ENGINE_POLICY.neoStartFloor;
    case 'neo':
    default:
      return true;
  }
};

// === 층별 AI 구성 ===
export const TOWER_AI_CONFIGS: TowerAIConfig[] = [
  // 1-10층: 튜토리얼 (실수 많이 함)
  ...Array.from({ length: 10 }, (_, i) => ({
    floor: i + 1,
    name: `튜토리얼 봇 ${i + 1}`,
    description: '오델로를 배우는 초보 AI',
    difficulty: 'tutorial' as AILevel,
    personality: 'chaotic' as AIPersonality,
    strategy: 'random' as AIStrategy,
    thinkingTime: 500 + i * 100,
    mistakeRate: 0.8 - i * 0.05, // 80% → 35% 실수율
    specialAbilities: [],
  })),

  // 11-50층: 초급 (기본 패턴 학습)
  ...Array.from({ length: 40 }, (_, i) => ({
    floor: i + 11,
    name: `초급 AI ${i + 1}`,
    description: '기본적인 오델로 규칙을 이해하는 AI',
    difficulty: 'beginner' as AILevel,
    personality: i % 2 === 0 ? 'aggressive' : 'defensive',
    strategy: i < 20 ? 'greedy' : 'corners',
    thinkingTime: 800 + i * 25,
    mistakeRate: 0.3 - i * 0.005, // 30% → 10% 실수율
    specialAbilities: i > 20 ? ['opening_book'] : [],
  })),

  // 51-150층: 중급 (전략적 사고)
  ...Array.from({ length: 100 }, (_, i) => ({
    floor: i + 51,
    name: `중급 AI ${i + 1}`,
    description: '전략적 사고가 가능한 AI',
    difficulty: 'intermediate' as AILevel,
    personality: ['aggressive', 'defensive', 'positional'][i % 3] as AIPersonality,
    strategy: ['corners', 'edges', 'mobility'][i % 3] as AIStrategy,
    thinkingTime: 1000 + i * 10,
    mistakeRate: 0.1 - i * 0.0008, // 10% → 2% 실수율
    specialAbilities: ['opening_book', 'position_eval'],
  })),

  // 151-250층: 고급 (복합 전략)
  ...Array.from({ length: 100 }, (_, i) => ({
    floor: i + 151,
    name: `고급 AI ${i + 1}`,
    description: '복합적인 전략을 구사하는 AI',
    difficulty: 'advanced' as AILevel,
    personality: ['positional', 'tactical'][i % 2] as AIPersonality,
    strategy: i < 50 ? 'minimax' : 'alphaBeta',
    thinkingTime: 1500 + i * 15,
    mistakeRate: 0.02 - i * 0.0001, // 2% → 1% 실수율
    specialAbilities: ['opening_book', 'position_eval', 'pattern_matching'],
  })),

  // 251-290층: 마스터급 (거의 완벽)
  ...Array.from({ length: 40 }, (_, i) => ({
    floor: i + 251,
    name: `마스터 AI ${i + 1}`,
    description: '마스터급 실력의 강력한 AI',
    difficulty: 'master' as AILevel,
    personality: 'tactical' as AIPersonality,
    strategy: 'alphaBeta' as AIStrategy,
    thinkingTime: 2000 + i * 25,
    mistakeRate: 0.01 - i * 0.0002, // 1% → 0.2% 실수율
    specialAbilities: ['opening_book', 'position_eval', 'pattern_matching', 'endgame_solver'],
  })),

  // 291-299층: 그랜드마스터급 (최고 수준)
  ...Array.from({ length: 9 }, (_, i) => ({
    floor: i + 291,
    name: `그랜드마스터 AI ${i + 1}`,
    description: '인간을 능가하는 그랜드마스터급 AI',
    difficulty: 'grandmaster' as AILevel,
    personality: 'perfect' as AIPersonality,
    strategy: 'monteCarlo' as AIStrategy,
    thinkingTime: 3000 + i * 100,
    mistakeRate: 0.001, // 0.1% 실수율
    specialAbilities: ['opening_book', 'position_eval', 'pattern_matching', 'endgame_solver', 'learning'],
  })),

  // 300층: 전설급 (최종 보스)
  {
    floor: 300,
    name: '인피니티 마스터',
    description: '모든 것을 초월한 전설의 AI 마스터',
    difficulty: 'legendary',
    personality: 'perfect',
    strategy: 'hybrid',
    thinkingTime: 5000,
    mistakeRate: 0, // 실수 없음
    specialAbilities: ['opening_book', 'position_eval', 'pattern_matching', 'endgame_solver', 'learning', 'adaptation', 'time_management'],
  },
];

// === AI 엔진 클래스 ===
export class TowerAIEngine {
  private readonly floor: number;
  private readonly config: TowerAIConfig;
  private readonly useNeo: boolean;
  private openingBook: Map<string, ValidMove[]> = new Map();
  private gameHistory: Array<{ board: Board; move: ValidMove }> = [];
  private neoEngine: Engine | null = null;
  private neoLoadingPromise: Promise<Engine> | null = null;
  private neoConfigured = false;

  constructor(floor: number) {
    this.floor = floor;
    this.config = TOWER_AI_CONFIGS[floor - 1];
    this.useNeo = shouldUseNeoEngine(floor);
    this.initializeOpeningBook();
  }

  /**
   * AI의 다음 수를 계산합니다
   */
  async calculateMove(board: Board, player: Player): Promise<ValidMove | null> {
    const validMoves = getValidMoves(board, player);
    if (validMoves.length === 0) return null;

    // 생각 시간 시뮬레이션
    await this.think();

    let selectedMove: ValidMove | null = null;

    if (this.useNeo) {
      selectedMove = await this.calculateWithNeo(board, player, validMoves);
    }

    if (!selectedMove) {
      // 능력별 처리 (레거시 로직)
      if (this.hasAbility('opening_book') && this.gameHistory.length < 10) {
        const bookMove = this.getOpeningBookMove(board);
        if (bookMove) {
          return bookMove;
        }
      }

      if (this.hasAbility('endgame_solver') && this.isEndgame(board)) {
        selectedMove = this.solveEndgame(board, validMoves);
      } else {
        selectedMove = this.selectMoveByStrategy(board, validMoves, player);
      }
    }

    // 안정성 위해 fallback
    if (!selectedMove) {
      selectedMove = validMoves[0];
    }

    // 실수 확률 적용
    const skillForMistake = this.estimateSkillLevel();
    const mistakeScale = skillForMistake >= 85 ? 0.2 : skillForMistake >= 70 ? 0.4 : skillForMistake >= 55 ? 0.7 : 1;
    const effectiveMistakeRate = this.config.mistakeRate * mistakeScale;
    if (effectiveMistakeRate > 0 && Math.random() < effectiveMistakeRate) {
      selectedMove = this.makeMistake(validMoves, selectedMove);
    }

    // 게임 기록 저장 (학습용)
    if (this.hasAbility('learning')) {
      this.gameHistory.push({ board: board.map(row => [...row]), move: selectedMove });
    }

    return selectedMove;
  }

  private async calculateWithNeo(
    board: Board,
    player: Player,
    validMoves: ValidMove[]
  ): Promise<ValidMove | null> {
    try {
      const engine = await this.ensureNeoEngine();
      const score = calculateScore(board);

      const sharedValidMoves = validMoves.map(({ row, col }) => ({ row, col } as SharedPosition));

      const gameCore: SharedGameCore = {
        id: `tower-floor-${this.floor}`,
        board: board as SharedBoard,
        currentPlayer: player,
        validMoves: sharedValidMoves,
        score: { black: score.black, white: score.white },
        status: 'playing',
        moveHistory: [] as SharedMove[],
        canUndo: false,
        canRedo: false
      };



      const skill = this.estimateSkillLevel();
      const intensity = Math.min(1, Math.max(0, skill / 100));
      const empties = 64 - (score.black + score.white);

      const baseThinking = Math.max(800, this.config.thinkingTime);
      let timeLimit = Math.round(baseThinking * (0.9 + intensity * 1.25));
      if (this.hasAbility('time_management')) {
        timeLimit = Math.round(timeLimit * 1.2);
      }
      if (empties <= 18) {
        timeLimit = Math.round(timeLimit * 1.5);
      }
      if (empties <= 10) {
        timeLimit = Math.round(timeLimit * 2);
      }
      timeLimit = Math.min(timeLimit, 12000);

      const request: EngineRequest = {
        gameCore,
        timeLimit,
        skill,
        depth: undefined
      };

      let response = await engine.analyze(request);

      const needsDeeperSearch =
        response.bestMove &&
        typeof response.evaluation === 'number' &&
        intensity >= 0.75 &&
        empties <= 32 &&
        (response.evaluation ?? 0) < 0;

      if (needsDeeperSearch && timeLimit < 9000) {
        const secondTimeLimit = Math.min(12000, Math.round(timeLimit * 1.6));
        const deeperResponse = await engine.analyze({
          ...request,
          timeLimit: secondTimeLimit,
          skill: Math.min(100, skill + 3)
        });

        if (
          deeperResponse.bestMove &&
          typeof deeperResponse.evaluation === 'number' &&
          deeperResponse.evaluation > (response.evaluation ?? -Infinity)
        ) {
          response = deeperResponse;
        }
      }

      if (!response.bestMove) {
        return null;
      }

      const match = validMoves.find(move =>
        move.row === response.bestMove!.row && move.col === response.bestMove!.col
      );

      return match ?? null;
    } catch (error) {
      console.warn('[TowerAI] Engine-Neo 실패, 레거시 전략으로 대체합니다.', error);
      return null;
    }
  }

  private async ensureNeoEngine(): Promise<Engine> {
    if (this.neoEngine) {
      if (!this.neoConfigured) {
        this.configureNeoEngine(this.neoEngine);
      }
      return this.neoEngine;
    }

    if (!this.neoLoadingPromise) {
      this.neoLoadingPromise = import('engine-neo').then(module => {
        let engineInstance: Engine | null = null;

        if (typeof module.EngineNeo === 'function') {
          engineInstance = new module.EngineNeo(this.getNeoConfig());
        } else {
          const candidate = module.engineNeo ?? module.default;
          if (candidate && typeof (candidate as Engine).analyze === 'function') {
            engineInstance = candidate as Engine;
          }
        }

        if (!engineInstance) {
          throw new Error('Engine-Neo 모듈에서 사용 가능한 엔진을 찾을 수 없습니다.');
        }

        this.neoEngine = engineInstance;
        this.configureNeoEngine(engineInstance);
        return engineInstance;
      });
    }

    return this.neoLoadingPromise;
  }

  private configureNeoEngine(engine: Engine): void {
    if (typeof (engine as any).clearState === 'function') {
      (engine as any).clearState();
    }

    const config = this.getNeoConfig();
    if (typeof (engine as any).updateConfig === 'function') {
      (engine as any).updateConfig(config);
    }

    this.neoConfigured = true;
  }

  private getNeoConfig(): Record<string, unknown> {
    const skill = this.estimateSkillLevel();
    const intensity = Math.min(1, Math.max(0, skill / 100));

    const level = Math.max(16, Math.min(45, Math.round(18 + intensity * 22)));

    const timeManagementBoost = this.hasAbility('time_management') ? 0.3 : 0;
    const baseThinking = Math.max(800, this.config.thinkingTime);
    let maxThinkTime = Math.round(
      Math.max(1800, baseThinking * (1 + intensity * 1.1 + timeManagementBoost))
    );
    maxThinkTime = Math.min(maxThinkTime, 12000);
    const minThinkTime = Math.max(350, Math.min(1200, Math.round(maxThinkTime * 0.25)));

    const totalTime = Math.max(
      18000,
      Math.round(maxThinkTime * (4.5 + intensity * 2.5))
    );
    const increment = Math.min(1500, Math.round(maxThinkTime * 0.12));

    return {
      level,
      ttSize: intensity >= 0.75 ? 400000 : 250000,
      enableOpeningBook: this.hasAbility('opening_book'),
      enableEndgameTablebase: this.hasAbility('endgame_solver'),
      timeConfig: {
        totalTime,
        increment,
        minThinkTime,
        maxThinkTime
      },
      aspirationConfig: {
        level,
        initialWindow: intensity >= 0.8 ? 35 : 45,
        maxWindow: intensity >= 0.8 ? 320 : 380,
        windowGrowth: intensity >= 0.9 ? 1.7 : 1.9,
        enableTT: true,
        enableKillers: true,
        enableHistory: true
      }
    };
  }

  private estimateSkillLevel(): number {
    const difficultyWeight = DIFFICULTY_SKILL_MAP[this.config.difficulty];
    const mistakePenalty = Math.round(Math.max(0, 1 - this.config.mistakeRate) * 100);
    const blended = Math.round(difficultyWeight * 0.6 + mistakePenalty * 0.4);
    return Math.max(10, Math.min(100, blended));
  }

  dispose(): void {
    if (this.neoEngine && typeof this.neoEngine.stop === 'function') {
      try {
        this.neoEngine.stop();
      } catch (error) {
        console.warn('[TowerAI] Engine-Neo stop 호출 실패', error);
      }
    }
    if (this.neoEngine && typeof (this.neoEngine as any).clearState === 'function') {
      try {
        (this.neoEngine as any).clearState();
      } catch (error) {
        console.warn('[TowerAI] Engine-Neo clearState 호출 실패', error);
      }
    }
    this.neoEngine = null;
    this.neoLoadingPromise = null;
    this.neoConfigured = false;
  }

  /**
   * 전략에 따른 수 선택
   */
  private selectMoveByStrategy(board: Board, validMoves: ValidMove[], player: Player): ValidMove {
    switch (this.config.strategy) {
      case 'random':
        return validMoves[Math.floor(Math.random() * validMoves.length)];

      case 'greedy':
        return validMoves.reduce((best, current) =>
          current.flipsCount > best.flipsCount ? current : best
        );

      case 'corners':
        return this.selectCornerStrategy(validMoves);

      case 'edges':
        return this.selectEdgeStrategy(validMoves);

      case 'mobility':
        return this.selectMobilityStrategy(board, validMoves, player);

      case 'minimax':
        return this.minimax(board, validMoves, player, 3); // 3수 앞까지

      case 'alphaBeta':
        return this.alphaBeta(board, validMoves, player, 5); // 5수 앞까지

      case 'monteCarlo':
        return this.monteCarlo(board, validMoves, player, 1000); // 1000회 시뮬레이션

      case 'hybrid':
        return this.hybridStrategy(board, validMoves, player);

      default:
        return validMoves[0];
    }
  }

  /**
   * 모서리 우선 전략
   */
  private selectCornerStrategy(validMoves: ValidMove[]): ValidMove {
    // 모서리 위치 (0,0), (0,7), (7,0), (7,7)
    const cornerMoves = validMoves.filter(move =>
      (move.row === 0 || move.row === 7) && (move.col === 0 || move.col === 7)
    );

    if (cornerMoves.length > 0) {
      return cornerMoves[0];
    }

    // 모서리가 없으면 가장자리
    const edgeMoves = validMoves.filter(move =>
      move.row === 0 || move.row === 7 || move.col === 0 || move.col === 7
    );

    if (edgeMoves.length > 0) {
      return edgeMoves.reduce((best, current) =>
        current.flipsCount > best.flipsCount ? current : best
      );
    }

    // 가장자리도 없으면 가장 많이 뒤집는 수
    return validMoves.reduce((best, current) =>
      current.flipsCount > best.flipsCount ? current : best
    );
  }

  /**
   * 가장자리 전략
   */
  private selectEdgeStrategy(validMoves: ValidMove[]): ValidMove {
    const edgeMoves = validMoves.filter(move =>
      move.row === 0 || move.row === 7 || move.col === 0 || move.col === 7
    );

    if (edgeMoves.length > 0) {
      return edgeMoves.reduce((best, current) =>
        current.flipsCount > best.flipsCount ? current : best
      );
    }

    return validMoves.reduce((best, current) =>
      current.flipsCount > best.flipsCount ? current : best
    );
  }

  /**
   * 이동성 전략 (상대방의 선택지를 줄이는 수)
   */
  private selectMobilityStrategy(board: Board, validMoves: ValidMove[], player: Player): ValidMove {
    const opponent = player === 'black' ? 'white' : 'black';
    let bestMove = validMoves[0];
    let minOpponentMoves = Infinity;

    for (const move of validMoves) {
      const newBoard = makeMove(board, move.row, move.col, player);
      if (newBoard) {
        const opponentMoves = getValidMoves(newBoard, opponent);
        if (opponentMoves.length < minOpponentMoves) {
          minOpponentMoves = opponentMoves.length;
          bestMove = move;
        }
      }
    }

    return bestMove;
  }

  /**
   * 미니맥스 알고리즘 (간단한 구현)
   */
  private minimax(board: Board, validMoves: ValidMove[], player: Player, depth: number): ValidMove {
    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    for (const move of validMoves) {
      const newBoard = makeMove(board, move.row, move.col, player);
      if (newBoard) {
        const score = this.minimaxScore(newBoard, depth - 1, false, player);
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    return bestMove;
  }

  private minimaxScore(board: Board, depth: number, isMaximizing: boolean, originalPlayer: Player): number {
    if (depth === 0) {
      const scores = calculateScore(board);
      return originalPlayer === 'black' ? scores.black - scores.white : scores.white - scores.black;
    }

    const currentPlayer = isMaximizing ? originalPlayer : (originalPlayer === 'black' ? 'white' : 'black');
    const validMoves = getValidMoves(board, currentPlayer);

    if (validMoves.length === 0) {
      const scores = calculateScore(board);
      return originalPlayer === 'black' ? scores.black - scores.white : scores.white - scores.black;
    }

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const move of validMoves) {
        const newBoard = makeMove(board, move.row, move.col, currentPlayer);
        if (newBoard) {
          const score = this.minimaxScore(newBoard, depth - 1, false, originalPlayer);
          maxScore = Math.max(maxScore, score);
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const move of validMoves) {
        const newBoard = makeMove(board, move.row, move.col, currentPlayer);
        if (newBoard) {
          const score = this.minimaxScore(newBoard, depth - 1, true, originalPlayer);
          minScore = Math.min(minScore, score);
        }
      }
      return minScore;
    }
  }

  /**
   * 알파베타 프루닝 (미니맥스 최적화)
   */
  private alphaBeta(board: Board, validMoves: ValidMove[], player: Player, depth: number): ValidMove {
    // 간단한 구현 - 실제로는 더 복잡한 알고리즘 필요
    return this.minimax(board, validMoves, player, depth);
  }

  /**
   * 몬테카를로 트리 서치 (간단한 구현)
   */
  private monteCarlo(board: Board, validMoves: ValidMove[], player: Player, simulations: number): ValidMove {
    const scores = new Map<string, number>();

    for (const move of validMoves) {
      let totalScore = 0;
      const moveKey = `${move.row},${move.col}`;

      for (let i = 0; i < simulations / validMoves.length; i++) {
        const score = this.simulateRandomGame(board, move, player);
        totalScore += score;
      }

      scores.set(moveKey, totalScore);
    }

    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    for (const move of validMoves) {
      const moveKey = `${move.row},${move.col}`;
      const score = scores.get(moveKey) || 0;
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  /**
   * 랜덤 게임 시뮬레이션
   */
  private simulateRandomGame(board: Board, firstMove: ValidMove, player: Player): number {
    let currentBoard = makeMove(board, firstMove.row, firstMove.col, player);
    if (!currentBoard) return 0;

    let currentPlayer = player === 'black' ? 'white' : 'black';
    let moveCount = 0;
    const maxMoves = 60; // 무한 루프 방지

    while (moveCount < maxMoves) {
      const validMoves = getValidMoves(currentBoard, currentPlayer);
      if (validMoves.length === 0) {
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
        const nextValidMoves = getValidMoves(currentBoard, currentPlayer);
        if (nextValidMoves.length === 0) break;
        continue;
      }

      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      const newBoard = makeMove(currentBoard, randomMove.row, randomMove.col, currentPlayer);
      if (!newBoard) break;

      currentBoard = newBoard;
      currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
      moveCount++;
    }

    const finalScores = calculateScore(currentBoard);
    return player === 'black' ? finalScores.black - finalScores.white : finalScores.white - finalScores.black;
  }

  /**
   * 복합 전략 (여러 전략 조합)
   */
  private hybridStrategy(board: Board, validMoves: ValidMove[], player: Player): ValidMove {
    // 게임 단계에 따른 전략 선택
    const totalPieces = calculateScore(board).black + calculateScore(board).white;

    if (totalPieces < 20) {
      // 초반: 이동성 중시
      return this.selectMobilityStrategy(board, validMoves, player);
    } else if (totalPieces < 50) {
      // 중반: 위치 중시
      return this.selectCornerStrategy(validMoves);
    } else {
      // 후반: 최대 점수
      return validMoves.reduce((best, current) =>
        current.flipsCount > best.flipsCount ? current : best
      );
    }
  }

  /**
   * 실수 만들기
   */
  private makeMistake(validMoves: ValidMove[], bestMove: ValidMove): ValidMove {
    // 최선수가 아닌 다른 수 중에서 선택
    const otherMoves = validMoves.filter(move => move !== bestMove);
    if (otherMoves.length === 0) return bestMove;

    // 난이도에 따라 실수의 정도 조절
    if (this.config.difficulty === 'tutorial') {
      // 완전 랜덤
      return otherMoves[Math.floor(Math.random() * otherMoves.length)];
    } else {
      // 차선책 선택
      return otherMoves.reduce((best, current) =>
        current.flipsCount > best.flipsCount ? current : best
      );
    }
  }

  /**
   * 엔드게임 솔버
   */
  private solveEndgame(board: Board, validMoves: ValidMove[]): ValidMove {
    // 남은 빈 칸이 10개 이하일 때 완전 탐색
    return validMoves.reduce((best, current) =>
      current.flipsCount > best.flipsCount ? current : best
    );
  }

  /**
   * 오프닝 북 초기화
   */
  private initializeOpeningBook(): void {
    // 표준 오델로 오프닝 패턴들
    // 실제로는 더 많은 패턴 필요
    const standardOpenings = [
      { row: 2, col: 3 }, { row: 3, col: 2 }, { row: 4, col: 5 }, { row: 5, col: 4 }
    ];

    // 간단한 구현
    this.openingBook.set('initial', standardOpenings.map(pos => ({
      ...pos,
      flipsCount: 1,
      flippedPositions: []
    })));
  }

  /**
   * 오프닝 북에서 수 선택
   */
  private getOpeningBookMove(board: Board): ValidMove | null {
    const moves = this.openingBook.get('initial');
    if (!moves) return null;

    const validMoves = getValidMoves(board, 'black'); // 임시로 black 플레이어 가정
    for (const bookMove of moves) {
      const validMove = validMoves.find(vm => vm.row === bookMove.row && vm.col === bookMove.col);
      if (validMove) return validMove;
    }

    return null;
  }

  /**
   * 엔드게임 판정
   */
  private isEndgame(board: Board): boolean {
    const scores = calculateScore(board);
    const totalPieces = scores.black + scores.white;
    return totalPieces >= 54; // 빈 칸 10개 이하
  }

  /**
   * 능력 보유 여부 확인
   */
  private hasAbility(ability: AIAbility): boolean {
    return this.config.specialAbilities.includes(ability);
  }

  /**
   * 생각 시간 시뮬레이션
   */
  private async think(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, this.config.thinkingTime);
    });
  }

  /**
   * AI 정보 반환
   */
  getInfo(): TowerAIConfig {
    return { ...this.config };
  }
}

/**
 * 층 번호로 AI 엔진 생성
 */
export const createTowerAI = (floor: number): TowerAIEngine => {
  if (floor < 1 || floor > 300) {
    throw new Error(`Invalid floor: ${floor}. Must be between 1 and 300.`);
  }
  return new TowerAIEngine(floor);
};

/**
 * 층별 AI 정보만 조회
 */
export const getTowerAIInfo = (floor: number): TowerAIConfig => {
  if (floor < 1 || floor > 300) {
    throw new Error(`Invalid floor: ${floor}. Must be between 1 and 300.`);
  }
  return TOWER_AI_CONFIGS[floor - 1];
};
