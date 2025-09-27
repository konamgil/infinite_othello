부드러운 의사결정: log-sum-exp로 근사한 Soft Minimax → 분기 노이즈에 강하고, 인간처럼 “선호”를 반영.

전략장 + 정보장: 9축 prior/guard로 “의미 있는 분기”만 깊게, 상대 합법수의 **엔트로피(불확실성)**를 줄이는 방향으로 유도(誘)·봉쇄(封).

설명 가능: 후보수마다 축별 이유·리스크·가드 패널티·소프트값을 그대로 반환.


바로 쓰는 법
import { CosmicAgent, DefaultRules } from './NineAxesStrategy';

const agent = new CosmicAgent({ maxDepth: 4, topK: 6 }, DefaultRules);
const { move, value, candidates } = agent.chooseMove(board, 'black');
// move: 추천 수, value: [-1,1] 기대값, candidates: 우선순위/이유/패널티/소프트값

전술은 9축이 정렬하고,

판 전체는 엔트로피로 조율하며,

결정은 소프트 미니맥스로 매끄럽게 집계한다.


폴더 트리 (요약)
src/
  core/
  strategy/
  eval/
  search/
  config/
  telemetry/
  adapt/
  web/worker/
  ui/
  cli/
scripts/
tests/
docs/

MVP (당장 돌아가는 최소 6파일)
1) src/core/types.ts

역할: 공통 타입/상수.

exports

export type Player = 'black' | 'white';
export interface Position { row: number; col: number; }
export type Cell = Player | null;
export type Board = Cell[][];
export const DIRS: ReadonlyArray<[number,number]>;
export const opposite: Record<Player, Player>;
export const inBounds: (N:number,r:number,c:number)=>boolean;

2) src/core/rules.ts

역할: 포터블 룰(합법수/착수/터미널).

exports

import { Board, Player, Position } from '../core/types';
export function getValidMoves(board:Board, p:Player): Position[];
export function makeMove(board:Board, p:Player, m:Position): Board;
export function isTerminal(board:Board): boolean;
export const RulesAdapter: {
  getValidMoves: typeof getValidMoves;
  makeMove: typeof makeMove;
  isTerminal: typeof isTerminal;
};

3) src/strategy/NineAxesDirector.ts

역할: 9축 prior/guard/evaluate + 트리거/리스크.

exports

import { Board, Player, Position } from '../core/types';
export type AxisKey = 'SEN'|'BANG'|'AK'|'YUU'|'BONG'|'HEE'|'HEO'|'SIL'|'YEON'|'DAN'|'GIU';
export interface MoveAnalysis { move:Position; total:number; contributions:any[]; quickScorecard:any; flags:string[]; }
export interface RankedMove extends MoveAnalysis { rank:number; }
export interface GuardDecision { allow:boolean; penalty:number; reasons:string[]; }
export interface NineAxesConfig { /* weights/risk/phase/… */ }
export class NineAxesDirector {
  constructor(cfg?: Partial<NineAxesConfig>, adapters?: { rules?: typeof RulesAdapter });
  rankMoves(board:Board, p:Player): RankedMove[];
  getOrderingHint(board:Board, p:Player): { byMove: Map<string,number> };
  guardMove(board:Board, p:Player, m:Position): GuardDecision;
  evaluateMove(board:Board, p:Player, m:Position): MoveAnalysis;
  explainPlan(board:Board, p:Player, topK?:number): RankedMove[];
}

4) src/eval/leafEval.ts

역할: 패리티/프론티어/안정 + 엔트로피 리프 평가.

exports

import { Board, Player } from '../core/types';
export interface LeafEvalConfig { lambdaAxes:number; betaEntropy:number; }
export function leafEval(board:Board, root:Player, cfg:LeafEvalConfig): number; // [-1,1]

5) src/search/CosmicAgent.ts

역할: Soft Minimax(log-sum-exp) + Top-K 확장 + 9축 블렌딩.

exports

import { Board, Player, Position } from '../core/types';
export interface CosmicConfig { maxDepth:number; topK:number; lambdaAxes:number; betaEntropy:number; tauEarly:number; tauMid:number; tauLate:number; }
export interface MoveChoice { move:Position|null; value:number; candidates:Array<{move:Position; prior:number; softValue:number; guardPenalty:number; axesTotal:number; reasons:string[]}>; }
export class CosmicAgent {
  constructor(cfg?:Partial<CosmicConfig>, rulesAdapter?: typeof import('../core/rules').RulesAdapter);
  chooseMove(board:Board, toPlay:Player, cfg?:Partial<CosmicConfig>): MoveChoice;
}

6) src/index.ts

역할: 외부 공개 API.

exports

export * from './core/types';
export * from './core/rules';
export * from './strategy/NineAxesDirector';
export * from './eval/leafEval';
export * from './search/CosmicAgent';

Core (권장 기본 세트)
core
src/core/bitboard.ts

역할: 비트보드 구현(속도↑).

exports

export type Bitboard = { me:bigint; opp:bigint };
export function bbFromBoard(board:Board, me:Player): Bitboard;
export function bbGetMoves(bb:Bitboard): Position[];
export function bbMakeMove(bb:Bitboard, m:Position): Bitboard;
export function bbToBoard(bb:Bitboard, me:Player): Board;

src/core/zobrist.ts

역할: 포지션 해시/캐시 키.

exports

export function initZobrist(N:number): void;
export function hashBoard(board:Board, toPlay:Player): number;

src/core/regions.ts

역할: 빈칸 연결성, 패리티 보조.

exports

export function emptyRegions(board:Board): number[]; // region sizes
export function parityFavor(board:Board, p:Player): number; // [-1,1]

strategy
src/strategy/axesConfig.ts

역할: 9축 가중치/리스크/페이즈 프리셋.

exports

export const AXES_DEFAULTS: { weights: Record<AxisKey,number>; risk:{xSquare:number;cSquare:number;openDiag:number;overSeal:number}; phase:{midThreshold:number;lateThreshold:number}; };
export const AXES_PRESETS: { balanced:any; aggressive:any; safe:any; };

src/strategy/axesExplainer.ts

역할: 분석 결과 → UI 친화 포맷.

exports

export interface ExplainCard { label:string; reasons:string[]; risks:string[]; quick:{ oppMovesDelta:number; frontierDelta:number; parity:number; corner:number }; }
export function toExplainCards(analysis:RankedMove[]): ExplainCard[];

eval
src/eval/stability.ts

역할: 코너 기반 안정성 근사.

exports

export function stableFromCorners(board:Board, p:Player): number; // rough score

src/eval/entropy.ts

역할: 합법수 개수 → 정규화 엔트로피.

exports

export function normalizedEntropy(board:Board, p:Player): number; // [0,1]

src/eval/scorecard.ts

역할: 퀵 점수표 산출.

exports

export interface QuickScorecard { oppMovesDelta:number; myFrontierDelta:number; parityFavor:number; cornerExpect:number; xOrCExposure:number; diagOpenRisk:number; overSeal:number; }
export function makeQuickScorecard(prev:Board, next:Board, p:Player): QuickScorecard;

search
src/search/policy.ts

역할: 9축 prior → softmax 정책/Top-K.

exports

export function rankByPrior(board:Board, p:Player, director:NineAxesDirector, topK:number): RankedMove[];
export function softmaxPick(weights:number[], tau:number): number; // index

src/search/guard.ts

역할: X/C, 대각선 오픈, 오버봉쇄 가드.

exports

export function guardMove(board:Board, p:Player, m:Position, director:NineAxesDirector): { penalty:number; allow:boolean; reasons:string[] };

src/search/timeManager.ts

역할: 제한시간/노드 버짓.

exports

export interface TimeConfig { moveTimeMs?:number; maxDepth?:number; }
export function startTimer(cfg:TimeConfig): { timeout():boolean; elapsed():number };

config
src/config/defaults.ts

역할: 엔진 전역 기본값.

exports

export const COSMIC_DEFAULTS: CosmicConfig;
export const AXES_DEFAULTS: any;

src/config/presets.ts

역할: 공격형/균형형/보수형 프리셋.

exports

export const PRESETS: { aggressive: Partial<CosmicConfig>; balanced: Partial<CosmicConfig>; safe: Partial<CosmicConfig> };

telemetry
src/telemetry/schema.ts

역할: 로그 스키마 정의.

exports

export interface TelemetryRecord {
  posId:string; toPlay:Player;
  candidates: Array<{ move:string; prior:number; guard:number; axesTotal:number; picked:boolean }>;
  depth:number; result?:{ finalDiff:number };
}

src/telemetry/logger.ts

역할: JSONL 로깅.

exports

export interface Logger { write(rec:TelemetryRecord): void; flush(): Promise<void>; }
export function createLogger(path?:string): Logger;

adapt
src/adapt/opponentModel.ts

역할: 상대 성향 추정(많이 뒤집기/모빌리티/엣지 집착 등).

exports

export interface OpponentProfile { flipBias:number; mobilityBias:number; edgeBias:number; riskTolerance:number; }
export class OpponentModel {
  update(board:Board, oppMove:Position): void;
  snapshot(): OpponentProfile;
}

src/adapt/adaptiveStrategy.ts

역할: 9축 가중/리스크 임계치 동적 조정.

exports

export function adaptAxes(weights:Record<AxisKey,number>, profile:OpponentProfile, gamePhase:'early'|'mid'|'late', scoreDiff:number): Record<AxisKey,number>;

scripts
scripts/tuneAxes.ts

역할: 오토튜닝(축 가중치/λ/β/τ/Top-K).

사용/exports

# 예: 가벼운 랜덤 탐색
node scripts/tuneAxes.js --trials 200 --preset balanced --depth 4 --league 200

// 내부 인터페이스(필요 시 모듈 호출)
interface TuneResult { best:any; history:Array<{params:any; elo:number}>; }
export async function runTuner(opts:any): Promise<TuneResult>;
