// Engine Zenith - The pinnacle of Othello AI
// Strong & stable: Alpha-Beta (ID+TT+LMR+Aspiration) as PRIMARY move chooser,
// with AdvancedEvaluation / Strategy / OpponentAnalysis / PredictiveSearch / AdaptiveStrategy as assistants.

import type {
  Board,
  Player,
  Position,
  EngineRequest,
  EngineResponse
} from '../../types';

import { EngineBase } from '../core/EngineBase';
import {
  ensureBoard,
  getValidMovesMask,
  maskToRCList,
  rcToBitIndex,
  flipPieces,
  undoMove,
  bitCount,
  computeZobristHash,
  emptiesCount,
} from '../core/bitboard';
import type { BitBoard, MoveToken } from '../core/bitboard';

const DEBUG_SEARCH = false;
import { AdvancedEvaluation } from './evaluation/AdvancedEvaluation';
import { StrategicAnalysis, StrategicAnalysisResult } from './strategy/StrategicAnalysis';
import { OpponentAnalysis } from './analysis/OpponentAnalysis';
import { PredictiveSearch } from './search/PredictiveSearch';
import { AdaptiveStrategy } from './strategy/AdaptiveStrategy';
import { makeMove } from '../core/gameCore';

// -------------------- Config --------------------

export interface ZenithConfig {
  level: number;                    // 1-20 (20 = 최고)
  enableLearning: boolean;
  enableOpponentAnalysis: boolean;
  enablePredictiveSearch: boolean;
  enableAdaptiveStrategy: boolean;

  // NEW: 메인 서치 온/오프 및 파라미터
  enableAlphaBetaSearch?: boolean;
  search?: {
    depthLimit?: number;
    timeLimitMs?: number;
    aspirationWindow?: number;
    useLMR?: boolean;
    useAspiration?: boolean;
  };

  // Think-time guide (fallback budget; 실제는 request.timeLimit 우선)
  timeConfig?: {
    totalTime: number;
    increment: number;
    minThinkTime: number;
    maxThinkTime: number;
  };
}

export const DEFAULT_ZENITH_CONFIG: ZenithConfig = {
  level: 18,
  enableLearning: true,
  enableOpponentAnalysis: true,
  enablePredictiveSearch: true,
  enableAdaptiveStrategy: true,
  enableAlphaBetaSearch: true,
  search: {
    depthLimit: 10,
    timeLimitMs: 1200,
    aspirationWindow: 64,
    useLMR: true,
    useAspiration: true,
  },
  timeConfig: {
    totalTime: 30000,
    increment: 1000,
    minThinkTime: 500,
    maxThinkTime: 10000
  }
};

// -------------------- Engine --------------------

export class EngineZenith extends EngineBase {
  readonly name = 'Engine-Zenith';
  readonly version = '1.1.0';
  readonly author = 'Zenith Research Team';

  private config: ZenithConfig;
  private evaluation: AdvancedEvaluation;
  private strategy: StrategicAnalysis;
  private opponentAnalysis: OpponentAnalysis;
  private predictiveSearch: PredictiveSearch;
  private adaptiveStrategy: AdaptiveStrategy;

  private gameHistory: GameHistory = [];
  private opponentProfile: OpponentProfile | null = null;
  private learningData: LearningData = {
    wins: 0,
    losses: 0,
    totalMoves: 0,
    positiveMoves: 0,
    patterns: new Map(),
    mistakes: []
  };

  // 안정성을 위한 추가 상태 관리
  private isAnalyzing: boolean = false;
  private lastAnalysisTime: number = 0;
  private analysisCache: Map<string, any> = new Map();

  constructor(config: Partial<ZenithConfig> = {}) {
    super();
    this.config = { ...DEFAULT_ZENITH_CONFIG, ...config };
    this.evaluation = new AdvancedEvaluation();
    this.strategy = new StrategicAnalysis();
    this.opponentAnalysis = new OpponentAnalysis();
    this.predictiveSearch = new PredictiveSearch();
    this.adaptiveStrategy = new AdaptiveStrategy();
  }

  // -------------------- Public API --------------------

  async analyze(request: EngineRequest): Promise<EngineResponse> {
    const t0 = Date.now();
    
    // 동시 분석 방지
    if (this.isAnalyzing) {
      console.warn('Zenith: 이미 분석 중입니다. 요청을 무시합니다.');
      return this.getFallbackResponse(t0);
    }
    
    this.isAnalyzing = true;
    
    try {
      const { gameCore, timeLimit, skill } = request;
      
      // 입력 검증 (EngineBase의 공통 메서드 사용)
      this.validateRequest(request);
      
      const { board, currentPlayer } = request.gameCore;

      // 즉시 방어: 유효한 수가 없으면 패스 응답
      const legalAtRoot = this.getValidMoves(board, currentPlayer);
      if (!legalAtRoot || legalAtRoot.length === 0) {
        const timeUsed = Date.now() - t0;
        this.isAnalyzing = false;
        return {
          bestMove: undefined,
          evaluation: 0,
          depth: 0,
          nodes: 0,
          timeUsed,
          pv: []
        };
      }

      // Level/skill 보정
      const level = this.resolveLevel(skill, this.config.level);

      // Phase (EngineBase의 공통 메서드 사용)
      const gamePhase = this.analyzeGamePhase(board);

      // Opponent analysis (lightweight; keep enabled)
      if (this.config.enableOpponentAnalysis) {
        this.opponentProfile = this.opponentAnalysis.analyzeOpponent(
          this.gameHistory,
          (request as any).opponentMoves || []
        );
      }

      // Strategic analysis (root only; 서치용은 비용 절감 위해 생략)
      const strategicAnalysis = this.strategy.analyzePosition(
        board,
        currentPlayer,
        gamePhase,
        this.opponentProfile
      );

      // Root static evaluation (정보용)
      const rootEval = this.evaluation.evaluateBoard(
        board,
        currentPlayer,
        gamePhase,
        strategicAnalysis
      );

      // Predictive (옵션, 보조/설명용) — 예산/국면 기반 게이팅
      const effectiveTL = typeof timeLimit === 'number' ? timeLimit : (this.config.search?.timeLimitMs ?? 1200);
      const emptiesNow = this.getEmptySquares(board);
      let predictiveInsights: PredictiveInsights | null = null;
      const allowPredictive = this.config.enablePredictiveSearch && effectiveTL >= 1200 && emptiesNow <= 56;
      if (allowPredictive) {
        const scenarioDepth = effectiveTL >= 5000 ? (emptiesNow <= 20 ? 6 : 5)
                           : effectiveTL >= 2500 ? 4
                           : 3;
        predictiveInsights = this.predictiveSearch.analyzeFutureScenarios(
          board,
          currentPlayer,
          scenarioDepth
        );
      }

      // Adaptive (옵션, 보조 신호/오더링 보정용)
      const allowAdaptive = this.config.enableAdaptiveStrategy && effectiveTL >= 800;
      const adaptedPlan = allowAdaptive
        ? this.adaptiveStrategy.adaptStrategy(
            strategicAnalysis,
            this.opponentProfile,
            this.learningData
          )
        : null;

      // ---------- Endgame: 완전 탐색 전환 (≤ 17 empties) ----------
      const empties = this.getEmptySquares(board);
      if (empties <= 17) {
        const endStart = Date.now();
        const solved = this.solveEndgame(board, currentPlayer, timeLimit);
        const timeUsed = Date.now() - endStart;
        if (DEBUG_SEARCH) console.log('[Zenith] Endgame solve', { empties, depth: empties, timeLimit, timeUsed, eval: solved.evaluation, nodes: solved.nodes });
        this.updateGameHistory(request.gameCore, solved.bestMove);
        return {
          bestMove: solved.bestMove,
          evaluation: solved.evaluation,
          depth: solved.depth,
          nodes: solved.nodes,
          timeUsed,
          pv: solved.pv
        };
      }

      // ---------- PRIMARY: Alpha-Beta Search ----------
      const budget = this.computeSearchBudget(level, timeLimit);
      const abResult = this.runAlphaBetaBit(ensureBoard(board), currentPlayer, budget);
      if (DEBUG_SEARCH) console.log('[Zenith] AB result', {
        depth: abResult.depth,
        score: abResult.score,
        nodes: abResult.nodes,
        pvLen: abResult.pv?.length ?? 0,
        budget
      });

      // 베스트 무브 선택: 휴리스틱 사용
      const bestMove = this.heuristicBestMove(
        board,
        currentPlayer,
        rootEval,
        strategicAnalysis,
        predictiveInsights,
        adaptedPlan
      );

      // Learning
      if (this.config.enableLearning) {
        this.updateLearningData(bestMove, rootEval, strategicAnalysis);
      }

      // History 기록
      this.updateGameHistory(request.gameCore, bestMove);

      const timeUsed = Date.now() - t0;
      this.lastAnalysisTime = timeUsed;

      // 응답: 서치 결과를 우선 반영, 없으면 루트 평가
      const evalOut: EvaluationResult = abResult
        ? {
            score: abResult.score,
            depth: abResult.depth,
            nodes: abResult.nodes,
            confidence: this.estimateConfidence(abResult.depth, abResult.nodes),
            pv: abResult.pv
          }
        : {
            score: rootEval.score,
            depth: rootEval.depth ?? 0,
            nodes: rootEval.nodes ?? 0,
            confidence: rootEval.confidence ?? 0.5,
            pv: rootEval.pv || []
          };

      const response = {
        bestMove,
        evaluation: Number.isFinite(evalOut.score) ? evalOut.score : 0,
        depth: evalOut.depth,
        nodes: evalOut.nodes,
        timeUsed,
        pv: evalOut.pv || [],
        stats: {
          gamePhase,
          strategicAnalysis: strategicAnalysis?.summary || '분석 실패',
          opponentProfile: this.opponentProfile?.summary || '프로필 없음',
          predictiveInsights: predictiveInsights?.summary || '예측 없음',
          adaptiveStrategy: adaptedPlan?.name || '적응 없음',
          confidence: evalOut.confidence,
          learningProgress: this.getLearningProgress(),
          ...(abResult
            ? { ttHits: abResult.ttHits, ttStores: abResult.ttStores }
            : {})
        }
      };

      return response;
    } catch (error) {
      console.error('Engine-Zenith analysis error:', error);
      const fallbackMove = await this.getFallbackMove(
        (request as any)?.gameCore?.board,
        (request as any)?.gameCore?.currentPlayer
      );
      const timeUsed = Date.now() - t0;
      return {
        bestMove: fallbackMove,
        evaluation: 0,
        depth: 1,
        nodes: 0,
        timeUsed,
        pv: [],
        stats: {
          error: error instanceof Error ? error.message : 'Unknown error',
          fallback: true
        }
      };
    } finally {
      this.isAnalyzing = false;
    }
  }

  // -------------------- Search Core --------------------
  // AlphaBeta 메인 서치

  private runAlphaBetaBit(
    board: BitBoard,
    player: Player,
    budget: { depthLimit: number; timeLimitMs: number; aspirationWindow?: number; useLMR?: boolean; useAspiration?: boolean }
  ): { bestMove: Position | undefined; score: number; depth: number; nodes: number; pv: Position[]; ttHits?: number; ttStores?: number } {
    const start = Date.now();
    const deadline = start + Math.max(100, Math.floor(budget.timeLimitMs));

    let nodes = 0;
    let ttHits = 0;
    let ttStores = 0;

    type TTEntry = { depth: number; value: number; flag: 'exact' | 'lower' | 'upper'; best?: Position };
    const tt = new Map<number, TTEntry>();

    // Killer / History heuristics
    const killer1: Array<Position | undefined> = new Array(128);
    const killer2: Array<Position | undefined> = new Array(128);
    const history: number[] = new Array(64).fill(0);

    const keyOf = (b: BitBoard, p: Player): number => computeZobristHash(b, p);

    const orderMoves = (moves: Position[], b: BitBoard, ttBest: Position | undefined, ply: number): Position[] => {
      const scoreMove = (m: Position): number => {
        let s = 0;
        if (ttBest && m.row === ttBest.row && m.col === ttBest.col) s += 10000;
        const k1 = killer1[ply];
        const k2 = killer2[ply];
        if (k1 && m.row === k1.row && m.col === k1.col) s += 5000;
        else if (k2 && m.row === k2.row && m.col === k2.col) s += 3000;
        const idx = m.row * 8 + m.col;
        s += history[idx] | 0;
        s += this.isCorner(m) ? 200 : 0;
        const edge = (m.row === 0 || m.row === 7 || m.col === 0 || m.col === 7) ? 1 : 0;
        s += edge ? 50 : 0;
        return s;
      };
      const arr = moves.slice();
      arr.sort((a, b2) => scoreMove(b2) - scoreMove(a));
      return arr;
    };

    const evalLeaf = (b: BitBoard, toMove: Player): number => {
      // 하이브리드 리프 평가: 재료(돌수차) + 기동성(정규화) + 코너 가중
      const myBB = toMove === 'black' ? b._bp! : b._wp!;
      const opBB = toMove === 'black' ? b._wp! : b._bp!;

      // 1) 재료 (돌수차)
      const materialDiff = bitCount(myBB) - bitCount(opBB); // [-64,64]

      // 2) 기동성 (정규화된 ±100 스케일)
      const myMovesMask = getValidMovesMask(toMove === 'black' ? 1 : 2, b);
      const opMovesMask = getValidMovesMask(toMove === 'black' ? 2 : 1, b);
      const myMob = Number(bitCount(myMovesMask));
      const opMob = Number(bitCount(opMovesMask));
      const totMob = myMob + opMob;
      const mobilityNorm = totMob > 0 ? ((myMob - opMob) / totMob) * 100 : 0; // [-100,100]

      // 3) 코너 가중 (소수의 코너 차에도 충분한 영향)
      const cornerIdx = [0, 7, 56, 63];
      let myCorners = 0, opCorners = 0;
      for (const idx of cornerIdx) {
        const m = 1n << BigInt(idx);
        if ((myBB & m) !== 0n) myCorners++;
        else if ((opBB & m) !== 0n) opCorners++;
      }
      const cornerDiff = myCorners - opCorners; // [-4,4]

      // 4) 페이즈 스케일링 (중반부 신호 확대, 종반은 절제)
      const e = emptiesCount(b);
      const phaseScale = e >= 44 ? 2.0 : e >= 28 ? 1.5 : e >= 12 ? 1.2 : 1.0;
      const materialW = e <= 20 ? 1.5 : 1.0;
      const mobilityW = 0.5;
      const cornerW = 50; // 1 코너 ≈ 50 점수 영향

      const raw = (materialDiff * materialW) + (mobilityNorm * mobilityW) + (cornerDiff * cornerW);
      // 전역 안정 범위로 경계
      const widened = phaseScale * raw;
      return Math.max(-999, Math.min(999, widened));
    };

    // Quiescence search (bitboard) — explore only noisy moves a few plies
    const QDEPTH = 4;
    const isCorner = (m: Position) => (m.row === 0 || m.row === 7) && (m.col === 0 || m.col === 7);
    const cornerEmpty = (bb: BitBoard, r: number, c: number): boolean => {
      const idx = rcToBitIndex(r, c);
      const mask = 1n << BigInt(idx);
      return ((BigInt(bb._bp!) | BigInt(bb._wp!)) & mask) === 0n;
    };
    const isXSq = (m: Position) => (m.row===1&&m.col===1)||(m.row===1&&m.col===6)||(m.row===6&&m.col===1)||(m.row===6&&m.col===6);
    const isCSq = (m: Position) => (m.row===0&&m.col===1)||(m.row===1&&m.col===0)||(m.row===0&&m.col===6)||(m.row===1&&m.col===7)
                                       ||(m.row===7&&m.col===1)||(m.row===6&&m.col===0)||(m.row===7&&m.col===6)||(m.row===6&&m.col===7);
    const isNoisy = (bb: BitBoard, m: Position): boolean => {
      if (isCorner(m)) return true;
      if (isXSq(m)) {
        const corner = (m.row===1&&m.col===1)?[0,0]: (m.row===1&&m.col===6)?[0,7]: (m.row===6&&m.col===1)?[7,0]: [7,7];
        return cornerEmpty(bb, corner[0], corner[1]);
      }
      if (isCSq(m)) {
        // related corner
        const map: Record<string,[number,number]> = { '0,1':[0,0], '1,0':[0,0], '0,6':[0,7], '1,7':[0,7], '7,1':[7,0], '6,0':[7,0], '7,6':[7,7], '6,7':[7,7] } as any;
        const key = `${m.row},${m.col}`;
        const cr = map[key];
        if (cr) return cornerEmpty(bb, cr[0], cr[1]);
      }
      // edges adjacent to corners
      if (m.row===0||m.row===7||m.col===0||m.col===7) {
        if (m.row===0 && (m.col<=1||m.col>=6)) return true;
        if (m.row===7 && (m.col<=1||m.col>=6)) return true;
        if (m.col===0 && (m.row<=1||m.row>=6)) return true;
        if (m.col===7 && (m.row<=1||m.row>=6)) return true;
      }
      return false;
    };
    const qSearch = (bb: BitBoard, toMove: Player, alpha: number, beta: number, qd: number, ply: number): number => {
      const stand = evalLeaf(bb, toMove);
      if (stand >= beta) return beta;
      if (alpha < stand) alpha = stand;
      if (qd <= 0) return stand;
      const moves = maskToRCList(getValidMovesMask(toMove === 'black' ? 1 : 2, bb)).filter((m: Position) => isNoisy(bb, m));
      if (moves.length === 0) return stand;
      const opp: Player = toMove === 'black' ? 'white' : 'black';
      for (const m of moves) {
        const t = flipPieces(bb, m.row, m.col, toMove) as MoveToken | undefined;
        if (!t) continue;
        const score = -qSearch(bb, opp, -beta, -alpha, qd - 1, ply + 1);
        undoMove(bb, t);
        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
      }
      return alpha;
    };

    const negamax = (
      b: BitBoard,
      toMove: Player,
      depth: number,
      alpha: number,
      beta: number,
      pv: Position[],
      ply: number
    ): number => {
      if (Date.now() > deadline) throw new Error('ab_timeout');

      const key = keyOf(b, toMove);
      const tte = tt.get(key);
      if (tte && tte.depth >= depth) {
        ttHits++;
        if (tte.flag === 'exact') return tte.value;
        if (tte.flag === 'lower') alpha = Math.max(alpha, tte.value);
        else if (tte.flag === 'upper') beta = Math.min(beta, tte.value);
        if (alpha >= beta) return tte.value;
      }

      const myMoves = maskToRCList(getValidMovesMask(toMove === 'black' ? 1 : 2, b));
      const opp: Player = toMove === 'black' ? 'white' : 'black';

      // Static evaluation (for pruning heuristics)
      const staticEval = evalLeaf(b, toMove);

      // Stand-pat / razoring style quick cutoff
      if (depth <= 2 && staticEval >= beta) return staticEval;

      if (depth === 0 || myMoves.length === 0) {
        if (myMoves.length === 0) {
          const oppMoves = maskToRCList(getValidMovesMask(opp === 'black' ? 1 : 2, b));
          if (oppMoves.length === 0) {
            // 양측 패스 => 종단. 돌수 차
            const diff = (toMove === 'black' ? (bitCount(b._bp!) - bitCount(b._wp!)) : (bitCount(b._wp!) - bitCount(b._bp!)));
            return diff;
          }
          // 패스
          const childPV: Position[] = [];
          return -negamax(b, opp, depth, -beta, -alpha, childPV, ply + 1);
        }
        // Quiescence at leaf
        return qSearch(b, toMove, alpha, beta, QDEPTH, ply);
      }

      let best: Position | undefined;
      let value = -Infinity;
      const ttBest = tte?.best;
      const ordered = orderMoves(myMoves, b, ttBest, ply);
      const alphaOrig = alpha;
      for (let i = 0; i < ordered.length; i++) {
        const move = ordered[i];
        const token = flipPieces(b, move.row, move.col, toMove) as MoveToken | undefined;
        if (!token) continue;
        nodes++;
        const childPV: Position[] = [];
        let nextDepth = depth - 1;
        let v: number;
        const isTT = ttBest && move.row === ttBest.row && move.col === ttBest.col;

        // Simple futility at shallow depth (skip clearly poor moves)
        if (depth === 1 && staticEval + 2 <= alpha && !this.isCorner(move)) {
          undoMove(b, token);
          continue;
        }

        if (i === 0) {
          // First move: full window, with LMR when applicable
          if (budget.useLMR && depth >= 3 && i >= 3 && !isTT) {
            const reduced = Math.max(1, nextDepth - 1);
            v = -negamax(b, opp, reduced, -beta, -alpha, childPV, ply + 1);
            if (v > alpha) {
              v = -negamax(b, opp, nextDepth, -beta, -alpha, childPV, ply + 1);
            }
          } else {
            v = -negamax(b, opp, nextDepth, -beta, -alpha, childPV, ply + 1);
          }
        } else {
          // Principal Variation Search for non-first moves
          v = -negamax(b, opp, nextDepth, -(alpha + 1), -alpha, childPV, ply + 1);
          if (v > alpha && v < beta) {
            v = -negamax(b, opp, nextDepth, -beta, -alpha, childPV, ply + 1);
          }
        }
        undoMove(b, token);
        if (v > value) {
          value = v;
          best = move;
          pv.length = 0;
          pv.push(move, ...childPV);
        }
        if (value > alpha) alpha = value;
        if (alpha >= beta) {
          // update history/killer
          const idx = move.row * 8 + move.col;
          history[idx] += depth * depth;
          const k1 = killer1[ply];
          if (!k1 || k1.row !== move.row || k1.col !== move.col) {
            killer2[ply] = killer1[ply];
            killer1[ply] = move;
          }
          break; // cutoff
        }
      }

      let flag: 'exact' | 'lower' | 'upper' = 'exact';
      if (value <= alphaOrig) flag = 'upper';
      else if (value >= beta) flag = 'lower';
      tt.set(key, { depth, value, flag, best });
      ttStores++;
      // TT size cap (simple aging): clear if too large
      if (ttStores % 8192 === 0 && tt.size > 150000) {
        tt.clear();
      }
      return value;
    };

    let bestSoFar: Position | undefined;
    let bestScore = -Infinity;
    let bestDepth = 0;
    let bestPV: Position[] = [];

    let lastScore = 0;
    for (let d = 4; d <= Math.max(4, budget.depthLimit); d++) {
      const pv: Position[] = [];
      try {
        if (budget.useAspiration && d > 4) {
          let window = Math.max(4, budget.aspirationWindow ?? 16);
          let alpha = lastScore - window;
          let beta = lastScore + window;
          for (let t = 0; t < 3; t++) {
            const score = negamax(board, player, d, alpha, beta, pv, 0);
            if (score <= alpha) { alpha -= window; window *= 2; }
            else if (score >= beta) { beta += window; window *= 2; }
            else { lastScore = score; break; }
          }
          bestScore = lastScore;
        } else {
          const score = negamax(board, player, d, -Infinity, Infinity, pv, 0);
          bestScore = score;
          lastScore = score;
        }
        bestSoFar = pv[0];
        bestDepth = d;
        bestPV = pv.slice();
      } catch (e) {
        if ((e as Error).message === 'ab_timeout') break;
        throw e;
      }
    }

    return { bestMove: bestSoFar, score: bestScore, depth: bestDepth, nodes, pv: bestPV, ttHits, ttStores };
  }

  private solveEndgame(board: Board, player: Player, timeLimit?: number): { bestMove: Position | undefined; evaluation: number; depth: number; nodes: number; pv: Position[] } {
    const rootPlayer: Player = player;
    const empties = this.getEmptySquares(board);
    const deadline = typeof timeLimit === 'number' && timeLimit > 0 ? Date.now() + Math.max(100, Math.floor(timeLimit * 0.95)) : Number.POSITIVE_INFINITY;

    let nodesVisited = 0;
    const tt = new Map<string, { depth: number; value: number; best?: Position; flag: 'exact' | 'lower' | 'upper' }>();

    const keyOf = (b: Board, p: Player): string => {
      let s = p === 'black' ? 'b|' : 'w|';
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const cell = b[r][c];
          s += cell === null ? '0' : (cell === 'black' ? '1' : '2');
        }
      }
      return s;
    };

    const orderMoves = (list: Position[], b: Board): Position[] => {
      return list.slice().sort((a, b2) => {
        const aCorner = this.isCorner(a) ? 1 : 0;
        const bCorner = this.isCorner(b2) ? 1 : 0;
        if (aCorner !== bCorner) return bCorner - aCorner;
        const aEdge = (a.row === 0 || a.row === 7 || a.col === 0 || a.col === 7) ? 1 : 0;
        const bEdge = (b2.row === 0 || b2.row === 7 || b2.col === 0 || b2.col === 7) ? 1 : 0;
        return bEdge - aEdge;
      });
    };

    const evaluateTerminal = (b: Board): number => {
      const s = this.calculateScore(b);
      const diff = rootPlayer === 'black' ? (s.black - s.white) : (s.white - s.black);
      return diff;
    };

    const negamax = (b: Board, toMove: Player, depth: number, alpha: number, beta: number, pv: Position[]): number => {
      if (Date.now() > deadline) {
        throw new Error('endgame_timeout');
      }
      const key = keyOf(b, toMove);
      const probe = tt.get(key);
      if (probe && probe.depth >= depth) {
        if (probe.flag === 'exact') return probe.value;
        if (probe.flag === 'lower') alpha = Math.max(alpha, probe.value);
        else if (probe.flag === 'upper') beta = Math.min(beta, probe.value);
        if (alpha >= beta) return probe.value;
      }

      const myMoves = this.getValidMoves(b, toMove);
      const opp: Player = toMove === 'black' ? 'white' : 'black';
      const oppMoves = this.getValidMoves(b, opp);
      const noMoveMe = myMoves.length === 0;
      const noMoveOpp = oppMoves.length === 0;

      if (noMoveMe && noMoveOpp || depth === 0) {
        const v = evaluateTerminal(b);
        tt.set(key, { depth, value: v, flag: 'exact' });
        return v;
      }

      let best: Position | undefined;
      let value = -Infinity;

      if (noMoveMe) {
        const childPV: Position[] = [];
        const v = -negamax(b, opp, depth, -beta, -alpha, childPV);
        value = v;
      } else {
        const ordered = orderMoves(myMoves, b);
        for (const move of ordered) {
          const nb = this.simulateMove(b, move, toMove);
          if (!nb) continue;
          nodesVisited++;
          const childPV: Position[] = [];
          const v = -negamax(nb, opp, depth - 1, -beta, -alpha, childPV);
          if (v > value) {
            value = v;
            best = move;
            pv.length = 0;
            pv.push(move, ...childPV);
          }
          alpha = Math.max(alpha, value);
          if (alpha >= beta) break;
        }
      }

      let flag: 'exact' | 'lower' | 'upper' = 'exact';
      if (value <= alpha) flag = 'upper';
      else if (value >= beta) flag = 'lower';
      tt.set(key, { depth, value, best, flag });
      return value;
    };

    const pv: Position[] = [];
    let evalScore = 0;
    try {
      evalScore = negamax(board, player, empties, -Infinity, Infinity, pv);
    } catch (e) {
      // timeout: fall back to shallow evaluation of PV if available
      if ((e as Error).message !== 'endgame_timeout') throw e;
      if (pv.length === 0) {
        const s = this.calculateScore(board);
        evalScore = rootPlayer === 'black' ? (s.black - s.white) : (s.white - s.black);
      }
    }

    const bestMove = pv[0];
    return { bestMove, evaluation: evalScore, depth: empties, nodes: nodesVisited, pv };
  }

  // Search용 빠른 평가(전략 분석 생략, 단계 블렌딩은 AdvancedEvaluation 내부에서 처리)
  private evalForSearch(b: Board, p: Player): number {
    const empties = this.getEmptySquares(b); // EngineBase의 공통 메서드 사용
    const phase: GamePhase =
      empties >= 45 ? 'opening' :
      empties >= 20 ? 'midgame' :
      empties >= 10 ? 'late_midgame' : 'endgame';

    const strategic = this.strategy.analyzePosition(
      b,
      p,
      phase,
      this.opponentProfile
    );

    const { score } = this.evaluation.evaluateBoard(b, p, phase, strategic);
    return score;
  }

  private computeSearchBudget(level: number, reqTimeLimit?: number) {
    // 우선순위: request.timeLimit -> config.search.timeLimitMs -> timeConfig 가이드
    const cfgSearch = this.config.search || {};
    const tc = this.config.timeConfig!;
    const cap = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    // depth 맵핑(대략): 1~20 → 12~20
    const depthLimit = (cfgSearch.depthLimit ??
      Math.round(10 + Math.min(10, Math.max(1, level)))
    );
    const targetDepth = cap(depthLimit, 12, 20);

    // 시간 예산: 요청이 있으면 그것을 기반으로 clamp
    const baseTL = (typeof reqTimeLimit === 'number' ? reqTimeLimit : (cfgSearch.timeLimitMs ?? 1200));
    const timeLimitMs = cap(Math.floor(baseTL * 0.95), tc.minThinkTime, tc.maxThinkTime);

    // LMR/Aspiration은 level ↑일수록 적극
    const useLMR = cfgSearch.useLMR ?? (level >= 8);
    const useAspiration = cfgSearch.useAspiration ?? (level >= 6);
    const aspirationWindow = cfgSearch.aspirationWindow ?? (level >= 14 ? 48 : 64);

    return { depthLimit: targetDepth, timeLimitMs, aspirationWindow, useLMR, useAspiration };
  }

  private estimateConfidence(depth: number, nodes: number): number {
    // 간단한 휴리스틱: 깊이↑, 노드↑ ⇒ 신뢰도↑ (0.55~0.98)
    const d = Math.min(14, Math.max(3, depth));
    const n = Math.log10(Math.max(1000, nodes));
    const base = 0.45 + (d - 3) * 0.03 + (n - 3) * 0.025;
    return Math.max(0.55, Math.min(0.98, base));
  }

  // -------------------- Heuristic Fallback --------------------

  private heuristicBestMove(
    board: Board,
    player: Player,
    rootEval: EvaluationResult,
    strategicAnalysis: StrategicAnalysisResult,
    predictive: PredictiveInsights | null,
    adapted: AdaptiveStrategy | null
  ): Position | undefined {
    const moves = this.getValidMoves(board, player);
    if (moves.length === 0) return undefined;

    const scored = moves
      .map((move: Position) => ({
        move,
        score: this.calculateMoveScore(
          move,
          board,
          player,
          rootEval,
          strategicAnalysis,
          predictive,
          adapted
        )
      }))
      .sort((a: any, b: any) => b.score - a.score);

    return scored[0].move;
  }

  private calculateMoveScore(
    move: Position,
    board: Board,
    player: Player,
    evaluation: EvaluationResult,
    strategicAnalysis: StrategicAnalysisResult,
    predictiveInsights: PredictiveInsights | null,
    adaptiveStrategy: AdaptiveStrategy | null
  ): number {
    const baseScore = (evaluation.score ?? 0) * 0.15;
    const strategyScore = strategicAnalysis.getMoveValue?.(move) ?? 0;
    const predictiveScore = predictiveInsights?.getMoveValue(move) ?? 0;
    const adaptiveScore = adaptiveStrategy?.getMoveValue?.(move) ?? 0;
    const safetyScore = this.assessMoveSafety(move, board, player) * 0.15;

    return (
      baseScore +
      strategyScore * 0.35 +
      predictiveScore * 0.25 +
      adaptiveScore * 0.15 +
      safetyScore
    );
  }

  // -------------------- Safety / Helpers --------------------

  private assessMoveSafety(move: Position, board: Board, player: Player): number {
    if (this.isDangerousSquare(move, board)) return -100;
    if (this.isCorner(move)) return 100;
    if (this.isEdgeSafe(move, board)) return 50;
    return 0;
  }

  private isDangerousSquare(move: Position, board: Board): boolean {
    const { row, col } = move;
    
    // 빈 칸 수 확인 - 초반에는 더 엄격하게
    const empties = this.getEmptySquares(board);
    const isEarlyGame = empties > 30;
    
    // X-squares
    const xSquares: [number, number][] = [[1,1],[1,6],[6,1],[6,6]];
    for (const [r, c] of xSquares) {
      if (row === r && col === c) {
        const cornerRow = r === 1 ? 0 : 7;
        const cornerCol = c === 1 ? 0 : 7;
        if (board[cornerRow][cornerCol] === null) {
          // 초반에는 X 자리를 더 위험하게 간주
          if (isEarlyGame) return true;
          
          // 중후반에도 X 자리는 위험하지만, 특별한 경우 예외 허용
          // 상대방이 이미 다른 코너를 차지했거나, 우리가 패스 상황인 경우 등
          const opponentCorners = this.countOpponentCorners(board);
          if (opponentCorners > 0) return true; // 상대방이 코너를 차지했다면 X 자리는 위험
          
          return true; // 기본적으로 X 자리는 위험
        }
      }
    }
    
    // C-squares (adjacent to corner when corner empty)
    const corners: [number, number][][] = [
      [[0,0],[0,1],[1,0]],
      [[0,7],[0,6],[1,7]],
      [[7,0],[6,0],[7,1]],
      [[7,7],[6,7],[7,6]]
    ];
    for (const group of corners) {
      const [corner, c1, c2] = group;
      if (board[corner[0]][corner[1]] === null) {
        if ((row === c1[0] && col === c1[1]) || (row === c2[0] && col === c2[1])) {
          // C 자리도 초반에는 더 위험하게 간주
          if (isEarlyGame) return true;
          
          // 중후반에는 C 자리를 상대적으로 덜 위험하게 간주
          const opponentCorners = this.countOpponentCorners(board);
          if (opponentCorners >= 2) return true; // 상대방이 2개 이상 코너를 차지했다면 C 자리도 위험
          
          return false; // 중후반에는 C 자리를 허용
        }
      }
    }
    return false;
  }
  
  private countOpponentCorners(board: Board): number {
    const corners: [number, number][] = [[0,0],[0,7],[7,0],[7,7]];
    let count = 0;
    for (const [r, c] of corners) {
      if (board[r][c] !== null) count++;
    }
    return count;
  }

  private isCorner(move: Position): boolean {
    const { row, col } = move;
    return (row === 0 || row === 7) && (col === 0 || col === 7);
  }

  private isEdgeSafe(move: Position, board: Board): boolean {
    const { row, col } = move;
    const onEdge = (row === 0 || row === 7 || col === 0 || col === 7);
    if (!onEdge) return false;

    const adjCorners: [number, number][] = [];
    if (row === 0) { if (col === 1) adjCorners.push([0,0]); if (col === 6) adjCorners.push([0,7]); }
    if (row === 7) { if (col === 1) adjCorners.push([7,0]); if (col === 6) adjCorners.push([7,7]); }
    if (col === 0) { if (row === 1) adjCorners.push([0,0]); if (row === 6) adjCorners.push([7,0]); }
    if (col === 7) { if (row === 1) adjCorners.push([0,7]); if (row === 6) adjCorners.push([7,7]); }

    for (const [r, c] of adjCorners) {
      if (board[r][c] === null) return false;
    }
    return true;
  }

  private async getFallbackMove(board: Board, player: Player): Promise<Position | undefined> {
    const moves = this.getValidMoves(board, player); // EngineBase의 공통 메서드 사용
    if (moves.length === 0) return undefined;

    const corners = moves.filter(m => this.isCorner(m));
    if (corners.length) return corners[0];

    const safeEdges = moves.filter(m => this.isEdgeSafe(m, board));
    if (safeEdges.length) return safeEdges[0];

    const safeMoves = moves.filter(m => !this.isDangerousSquare(m, board));
    if (safeMoves.length) return safeMoves[0];

    return moves[0];
  }

  // -------------------- Phase / Learning / State --------------------

  protected analyzeGamePhase(board: Board): 'opening' | 'midgame' | 'endgame' {
    const empties = this.getEmptySquares(board); // EngineBase의 공통 메서드 사용
    if (empties >= 45) return 'opening';
    if (empties >= 20) return 'midgame';
    return 'endgame';
  }

  private resolveLevel(skill?: number, fallbackLevel?: number): number {
    if (typeof skill === 'number' && skill >= 1) {
      return Math.max(1, Math.min(20, Math.floor(skill / 5) + 10));
    }
    return Math.max(1, Math.min(20, fallbackLevel ?? 16));
  }

  private updateLearningData(
    move: Position | undefined,
    evaluation: EvaluationResult,
    strategicAnalysis: StrategicAnalysisResult
  ): void {
    if (!move) return;
    const pattern = this.extractMovePattern(move, evaluation, strategicAnalysis);
    this.learningData.patterns.set(pattern.key, pattern);
    this.learningData.totalMoves++;
    if (evaluation.score > 0) this.learningData.positiveMoves++;
  }

  private extractMovePattern(
    move: Position,
    evaluation: EvaluationResult,
    strategicAnalysis: StrategicAnalysisResult
  ): MovePattern {
    return {
      key: `${move.row}-${move.col}`,
      move,
      score: evaluation.score,
      strategicValue: strategicAnalysis.getMoveValue?.(move) ?? 0,
      timestamp: Date.now()
    };
  }

  private updateGameHistory(gameCore: any, move: Position | undefined): void {
    if (!gameCore) return;
    this.gameHistory.push({
      board: gameCore.board,
      move,
      timestamp: Date.now()
    });
    if (this.gameHistory.length > 50) this.gameHistory.shift();
  }

  private getLearningProgress(): LearningProgress {
    const games = this.learningData.wins + this.learningData.losses;
    return {
      totalMoves: this.learningData.totalMoves,
      positiveMoves: this.learningData.positiveMoves,
      patternsLearned: this.learningData.patterns.size,
      winRate: games ? this.learningData.wins / games : 0
    };
  }

  // countEmptySquares 메서드는 EngineBase의 getEmptySquares로 대체됨

  updateConfig(newConfig: Partial<ZenithConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  clearState(): void {
    this.gameHistory = [];
    this.opponentProfile = null;
    this.learningData = {
      wins: 0,
      losses: 0,
      totalMoves: 0,
      positiveMoves: 0,
      patterns: new Map(),
      mistakes: []
    };
  }

  getStats(): ZenithStats {
    return {
      name: this.name,
      version: this.version,
      config: this.config,
      learningProgress: this.getLearningProgress(),
      gameHistory: this.gameHistory.length,
      opponentProfile: this.opponentProfile
    };
  }

  // -------------------- 안전성 및 유틸리티 메서드 --------------------

  protected getFallbackResponse(startTime: number): EngineResponse {
    const timeUsed = Date.now() - startTime;
    return {
      bestMove: undefined,
      evaluation: 0,
      depth: 0,
      nodes: 0,
      timeUsed,
      pv: [],
      stats: {
        error: '분석 중복 요청',
        fallback: true
      }
    };
  }

  private validateBoard(board: Board): boolean {
    if (!board || !Array.isArray(board) || board.length !== 8) {
      return false;
    }
    
    for (let i = 0; i < 8; i++) {
      if (!Array.isArray(board[i]) || board[i].length !== 8) {
        return false;
      }
      for (let j = 0; j < 8; j++) {
        const cell = board[i][j];
        if (cell !== null && cell !== 'black' && cell !== 'white') {
          return false;
        }
      }
    }
    return true;
  }

  private cleanupCache(): void {
    // 캐시 크기 제한 및 정리
    if (this.analysisCache.size > 1000) {
      const entries = Array.from(this.analysisCache.entries());
      // 오래된 항목들 제거 (간단한 LRU 구현)
      entries.slice(0, 200).forEach(([key]) => {
        this.analysisCache.delete(key);
      });
    }
  }

  private getCacheKey(board: Board, player: Player): string {
    // 간단한 보드 해시 생성
    let hash = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = board[r][c];
        hash += cell === null ? '0' : cell === 'black' ? '1' : '2';
      }
    }
    return `${player}_${hash}`;
  }
}

// Default instance export
export const engineZenith = new EngineZenith();
export default engineZenith;

// Worker-compatible search function
export async function alphaBetaSearch(
  gameCore: any,
  player: Player,
  options: { timeLimit?: number; rootMove?: Position; depthLimit?: number }
): Promise<{ bestMove?: Position; evaluation: number; nodes?: number; pv?: Position[] }> {
  // rootMove가 지정된 경우, 해당 수를 먼저 적용하고 평가
  if (options.rootMove) {
    const { row, col } = options.rootMove;
    if (gameCore.board[row][col] !== null) {
      // 이미 돌이 있는 위치 - 유효하지 않은 수
      return {
        bestMove: options.rootMove,
        evaluation: -Infinity,
        nodes: 1,
        pv: [options.rootMove]
      };
    }
    
    // 수를 적용한 후 평가
    const newGameCore = { ...gameCore };
    const result = makeMove(newGameCore, options.rootMove!);
    
    if (!result.success) {
      return {
        bestMove: options.rootMove,
        evaluation: -Infinity,
        nodes: 1,
        pv: [options.rootMove]
      };
    }
    
    // 상대방 관점에서 평가 (부호 반전)
    const request: EngineRequest = {
      gameCore: result.newGameCore,
      timeLimit: options.timeLimit,
      skill: 18
    };
    
    const response = await engineZenith.analyze(request);
    
    return {
      bestMove: options.rootMove,
      evaluation: response.evaluation, // 부호 반전 제거 - 이미 올바른 관점
      nodes: response.nodes,
      pv: [options.rootMove, ...(response.pv || [])]
    };
  }
  
  // rootMove가 없는 경우 전체 탐색
  const request: EngineRequest = {
    gameCore,
    timeLimit: options.timeLimit,
    skill: 18
  };
  
  const response = await engineZenith.analyze(request);
  
  return {
    bestMove: response.bestMove,
    evaluation: response.evaluation,
    nodes: response.nodes,
    pv: response.pv ? [...response.pv] : undefined
  };
}

// -------------------- Types --------------------

export type GamePhase = 'opening' | 'midgame' | 'late_midgame' | 'endgame';

export type GameHistory = Array<{
  board: Board;
  move?: Position;
  timestamp: number;
}>;

export interface OpponentProfile {
  style: 'aggressive' | 'defensive' | 'balanced';
  preferences: string[];
  weaknesses: string[];
  summary: string;
}

export interface LearningData {
  wins: number;
  losses: number;
  totalMoves: number;
  positiveMoves: number;
  patterns: Map<string, MovePattern>;
  mistakes: string[];
}

export interface MovePattern {
  key: string;
  move: Position;
  score: number;
  strategicValue: number;
  timestamp: number;
}

export interface LearningProgress {
  totalMoves: number;
  positiveMoves: number;
  patternsLearned: number;
  winRate: number;
}

export interface ZenithStats {
  name: string;
  version: string;
  config: ZenithConfig;
  learningProgress: LearningProgress;
  gameHistory: number;
  opponentProfile: OpponentProfile | null;
}

export interface EvaluationResult {
  score: number;
  depth: number;
  nodes: number;
  confidence: number;
  pv?: Position[];
}

export interface PredictiveInsights {
  scenarios: Board[];
  probabilities: number[];
  bestPaths: Position[][];
  summary: string;
  getMoveValue(move: Position): number;
}

export interface AdaptiveStrategyResult {
  name: string;
  adaptStrategy(
    strategicAnalysis: StrategicAnalysis,
    opponentProfile: OpponentProfile | null,
    learningData: LearningData
  ): AdaptiveStrategyResult;
  getMoveValue(move: Position): number;
}
