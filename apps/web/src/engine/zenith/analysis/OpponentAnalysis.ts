// Opponent Analysis System for Engine Zenith — Context-Aware Complete Version
// - Supports context-aware analysis (boardBefore + move + player)
// - X/C risk only when corresponding corner is empty
// - Edge safety check considering empty-corner adjacency
// - Consistency fix: based on category-switch rate
// - Mobility / timing / endgame tendencies use real board deltas when available
// - Safe stats guards (no NaN)
// - Self-contained minimal Othello ops (simulateMove/getValidMoves); can be swapped with engine bitboards.
//
// Assumed external types:
//   Board: (Player | null)[][]
//   Player: 'black' | 'white'
//   Position: { row: number; col: number; }
//   GameHistory: (opaque here; we only use counts)
//   OpponentProfile: { style: 'aggressive'|'defensive'|'balanced'; preferences: string[]; weaknesses: string[]; summary: string }
//
// Optional context event type (exported below):
//   OppMoveEvent: { move: Position; boardBefore: Board; player: Player }

import type { Board, Player, Position } from '../../../types';
import { GameHistory, OpponentProfile } from '../index';

// ---------- Public helper type for context-aware analysis ----------
export type OppMoveEvent = {
  move: Position;
  boardBefore: Board;   // state before opponent plays 'move'
  player: Player;       // opponent color for that move
};

// ---------- Main class ----------
export class OpponentAnalysis {
  private analysisHistory: OpponentAnalysisHistory[] = [];
  private patternDatabase: Map<string, PatternData> = new Map();

  constructor() {
    this.initializePatternDatabase();
  }

  // ------------------------------------------------------------------
  // PUBLIC API
  // ------------------------------------------------------------------

  /**
   * Fallback: Analyze opponent from moves only (no board context).
   * If possible, prefer analyzeOpponentWithContext for higher fidelity.
   */
  analyzeOpponent(
    gameHistory: GameHistory,
    opponentMoves: Position[]
  ): OpponentProfile {
    // 입력 검증
    if (!gameHistory || !opponentMoves || !Array.isArray(opponentMoves)) {
      console.warn('OpponentAnalysis: 잘못된 입력 매개변수');
      return this.getDefaultProfile();
    }

    // Move-only patterns (geometry-based)
    const movePatterns = this.analyzeMovePatternsFallback(opponentMoves);

    // Preferences (geometry-based, conservative)
    const strategicPreferences = this.analyzeStrategicPreferencesFallback(opponentMoves);

    // Weakness-like tendencies (conservative without board)
    const weaknesses = this.analyzeWeaknessTendenciesFallback(opponentMoves, gameHistory);

    const style = this.determinePlayingStyle(movePatterns, strategicPreferences);

    const profile: OpponentProfile = {
      style,
      preferences: strategicPreferences,
      weaknesses,
      summary: this.generateProfileSummary(style, strategicPreferences, weaknesses)
    };

    this.storeAnalysis(profile, opponentMoves);
    return profile;
  }

  /**
   * Preferred: Analyze opponent using per-move board context.
   * events: array ordered in time (earliest -> latest).
   */
  analyzeOpponentWithContext(
    gameHistory: GameHistory,
    events: OppMoveEvent[]
  ): OpponentProfile {
    const opponentMoves = events.map(e => e.move);

    // Context-aware metrics
    const movePatterns = this.analyzeMovePatternsCtx(events);
    const strategicPreferences = this.analyzeStrategicPreferencesCtx(events);

    // Context-aware tendencies
    const weaknesses = this.analyzeWeaknessTendenciesCtx(events, gameHistory);

    const style = this.determinePlayingStyle(movePatterns, strategicPreferences);

    const profile: OpponentProfile = {
      style,
      preferences: strategicPreferences,
      weaknesses,
      summary: this.generateProfileSummary(style, strategicPreferences, weaknesses)
    };

    this.storeAnalysis(profile, opponentMoves);
    return profile;
  }

  /** Stats with NaN guards */
  getAnalysisStats(): OpponentAnalysisStats {
    const n = this.analysisHistory.length || 1;
    return {
      totalAnalyses: this.analysisHistory.length,
      // If a real opponentId exists, prefer it. Fallback to summary signature.
      uniqueOpponents: new Set(
        this.analysisHistory.map(a => (a as any).opponentId ?? a.profile.summary)
      ).size,
      averageMoves: this.analysisHistory.reduce((sum, a) => sum + a.moves.length, 0) / n,
      patternCount: this.patternDatabase.size
    };
  }

  // ------------------------------------------------------------------
  // MOVE PATTERN ANALYSIS
  // ------------------------------------------------------------------

  /** Fallback (no board): geometry-based ratios */
  private analyzeMovePatternsFallback(moves: Position[]): MovePatternAnalysis {
    const base: MovePatternAnalysis = {
      cornerPreference: 0, edgePreference: 0, centerPreference: 0,
      mobilityStyle: 0.5, riskTolerance: 0.5, consistency: 1
    };
    if (moves.length === 0) return base;

    const corners = moves.filter(m => this.isCorner(m)).length;
    const edges   = moves.filter(m => this.isEdge(m)).length;
    const centers = moves.filter(m => this.isCenter(m)).length;

    base.cornerPreference = corners / moves.length;
    base.edgePreference   = edges   / moves.length;
    base.centerPreference = centers / moves.length;

    base.mobilityStyle    = this.analyzeMobilityStyleFallback(moves);
    base.riskTolerance    = this.analyzeRiskToleranceFallback(moves);
    base.consistency      = this.analyzeConsistency(moves);
    return base;
  }

  /** Context-aware: mobility/risk/stability with boardBefore */
  private analyzeMovePatternsCtx(events: OppMoveEvent[]): MovePatternAnalysis {
    const moves = events.map(e => e.move);
    const base = this.analyzeMovePatternsFallback(moves); // start from geometry

    // Override with context-aware metrics where possible
    base.mobilityStyle = this.analyzeMobilityStyleCtx(events);
    base.riskTolerance = this.analyzeRiskToleranceCtx(events);
    base.consistency   = this.analyzeConsistency(moves); // consistency is geometric category switches
    return base;
  }

  // ------------------------------------------------------------------
  // STRATEGIC PREFERENCES
  // ------------------------------------------------------------------

  private analyzeStrategicPreferencesFallback(moves: Position[]): string[] {
    const prefs: string[] = [];
    if (moves.length === 0) return prefs;

    const corners = moves.filter(m => this.isCorner(m)).length / moves.length;
    const edges   = moves.filter(m => this.isEdge(m)).length / moves.length;
    const centers = moves.filter(m => this.isCenter(m)).length / moves.length;

    if (corners > 0.30) prefs.push('corner_control');
    if (edges   > 0.40) prefs.push('edge_control');
    if (centers > 0.20) prefs.push('center_control');

    const mobility = this.analyzeMobilityStyleFallback(moves);
    if (mobility > 0.55) prefs.push('mobility_focus');

    const stability = this.analyzeStabilityPreferenceFallback(moves);
    if (stability > 0.55) prefs.push('stability_focus');

    return prefs;
  }

  private analyzeStrategicPreferencesCtx(events: OppMoveEvent[]): string[] {
    const moves = events.map(e => e.move);
    if (moves.length === 0) return [];
    const prefs = this.analyzeStrategicPreferencesFallback(moves);

    // Replace stability with context-aware version
    const stability = this.analyzeStabilityPreferenceCtx(events);
    const idx = prefs.indexOf('stability_focus');
    if (stability > 0.55) {
      if (idx === -1) prefs.push('stability_focus');
    } else if (idx !== -1) {
      prefs.splice(idx, 1);
    }
    return prefs;
  }

  // ------------------------------------------------------------------
  // WEAKNESS / TENDENCY ANALYSIS
  // ------------------------------------------------------------------

  /** Fallback: do not label "mistake" strongly without context */
  private analyzeWeaknessTendenciesFallback(moves: Position[], gameHistory: GameHistory): string[] {
    const out: string[] = [];
    if (moves.length === 0) return out;

    // Risky squares used
    if (moves.some(m => this.isXSquare(m))) out.push('x_square_risky_tendency');
    if (moves.some(m => this.isCSquare(m))) out.push('c_square_risky_tendency');

    // Mobility risky tendency (cluster/X/C heuristic)
    const mobRisk = this.analyzeMobilityRiskFallback(moves);
    if (mobRisk > 0.30) out.push('mobility_risky_tendency');

    // Timing tendency (weak)
    const timeRisk = this.analyzeTimingTendencyFallback(moves);
    if (timeRisk > 0.30) out.push('timing_tendency');

    // Endgame risky tendency (weak)
    const endRisk = this.analyzeEndgameTendencyFallback(moves);
    if (endRisk > 0.30) out.push('endgame_risky_tendency');

    return out;
  }

  private analyzeWeaknessTendenciesCtx(events: OppMoveEvent[], gameHistory: GameHistory): string[] {
    const out: string[] = [];
    if (events.length === 0) return out;
    const moves = events.map(e => e.move);

    // Context-aware X/C risk (corner must be empty)
    if (events.some(e => this.isDangerousSquareOn(e.boardBefore, e.move))) out.push('x_or_c_empty_corner_risk');

    // Mobility risky: reduces own mobility and increases opponent mobility
    const mobRisk = this.analyzeMobilityRiskCtx(events);
    if (mobRisk > 0.30) out.push('mobility_risky_tendency');

    // Timing tendency (context-aware corners early/late)
    const timeRisk = this.analyzeTimingTendencyCtx(events);
    if (timeRisk > 0.30) out.push('timing_tendency');

    // Endgame risky (X/C in late, low corner ratio late)
    const endRisk = this.analyzeEndgameTendencyCtx(events);
    if (endRisk > 0.30) out.push('endgame_risky_tendency');

    // Also keep geometric risky tendencies
    if (moves.some(m => this.isXSquare(m))) out.push('x_square_usage');
    if (moves.some(m => this.isCSquare(m))) out.push('c_square_usage');

    return out;
  }

  // ------------------------------------------------------------------
  // STYLE DETERMINATION
  // ------------------------------------------------------------------

  private determinePlayingStyle(
    p: MovePatternAnalysis,
    prefs: string[]
  ): 'aggressive' | 'defensive' | 'balanced' {
    let A = 0, D = 0;

    // Aggressive cues
    if (p.riskTolerance > 0.60) A += 2;
    if (prefs.includes('mobility_focus')) A += 1;
    if (p.consistency < 0.50) A += 1;

    // Defensive cues
    if (p.edgePreference > 0.50) D += 1;
    if (p.centerPreference < 0.20 && p.cornerPreference > 0.25) D += 2; // corner-oriented, center-averse
    if (prefs.includes('stability_focus')) D += 2;
    if (p.consistency > 0.70) D += 1;

    if (A > D + 1) return 'aggressive';
    if (D > A + 1) return 'defensive';
    return 'balanced';
  }

  private generateProfileSummary(
    style: 'aggressive'|'defensive'|'balanced',
    preferences: string[],
    weaknesses: string[]
  ): string {
    const parts: string[] = [];
    parts.push(style === 'aggressive' ? 'Aggressive player'
             : style === 'defensive' ? 'Defensive player'
             : 'Balanced player');

    if (preferences.length) parts.push(`Prefers: ${preferences.join(', ')}`);
    if (weaknesses.length)  parts.push(`Tendencies: ${weaknesses.join(', ')}`);
    return parts.join(' | ');
  }

  private storeAnalysis(profile: OpponentProfile, moves: Position[]): void {
    const h: OpponentAnalysisHistory = {
      timestamp: Date.now(),
      profile,
      moves: [...moves],
      patterns: this.extractPatterns(moves)
    };
    this.analysisHistory.push(h);
    if (this.analysisHistory.length > 100) this.analysisHistory.shift();
  }

  // ------------------------------------------------------------------
  // SUPPORT: PATTERN EXTRACTION (geometric)
  // ------------------------------------------------------------------

  private extractPatterns(moves: Position[]): string[] {
    const ps: string[] = [];
    if (moves.some(m => this.isCorner(m))) ps.push('corner_play');
    if (moves.some(m => this.isEdge(m)))   ps.push('edge_play');
    if (moves.some(m => this.isCenter(m))) ps.push('center_play');
    if (moves.some(m => this.isXSquare(m))) ps.push('x_square_play');
    if (moves.some(m => this.isCSquare(m))) ps.push('c_square_play');
    return ps;
  }

  // ------------------------------------------------------------------
  // GEOMETRY HELPERS
  // ------------------------------------------------------------------

  private isCorner(m: Position): boolean {
    const { row, col } = m;
    return (row === 0 || row === 7) && (col === 0 || col === 7);
  }
  private isEdge(m: Position): boolean {
    const { row, col } = m;
    return row === 0 || row === 7 || col === 0 || col === 7;
  }
  private isCenter(m: Position): boolean {
    const { row, col } = m;
    return row >= 3 && row <= 4 && col >= 3 && col <= 4;
  }
  private isXSquare(m: Position): boolean {
    const { row, col } = m;
    return (row === 1 && col === 1) || (row === 1 && col === 6) ||
           (row === 6 && col === 1) || (row === 6 && col === 6);
  }
  private isCSquare(m: Position): boolean {
    const { row, col } = m;
    return (row === 0 && (col === 1 || col === 6)) ||
           (row === 1 && (col === 0 || col === 7)) ||
           (row === 6 && (col === 0 || col === 7)) ||
           (row === 7 && (col === 1 || col === 6));
  }

  // ------------------------------------------------------------------
  // CONSISTENCY (FIXED)
  // ------------------------------------------------------------------

  private analyzeConsistency(moves: Position[]): number {
    if (moves.length < 2) return 1;
    const label = (m: Position) =>
      this.isCorner(m) ? 'corner' :
      this.isXSquare(m) ? 'x' :
      this.isCSquare(m) ? 'c' :
      this.isEdge(m)   ? 'edge' :
      this.isCenter(m) ? 'center' : 'other';

    let switches = 0;
    let prev = label(moves[0]);
    for (let i = 1; i < moves.length; i++) {
      const cur = label(moves[i]);
      if (cur !== prev) switches++;
      prev = cur;
    }
    // Fewer switches → higher consistency
    return 1 - (switches / (moves.length - 1));
  }

  // ------------------------------------------------------------------
  // MOBILITY STYLE
  // ------------------------------------------------------------------

  private analyzeMobilityStyleFallback(moves: Position[]): number {
    if (moves.length === 0) return 0.5;
    const rows = new Set(moves.map(m => m.row)).size;
    const cols = new Set(moves.map(m => m.col)).size;
    const diversity = (rows + cols) / (Math.min(8, moves.length) * 2);
    const center = moves.filter(m => m.row >= 2 && m.row <= 5 && m.col >= 2 && m.col <= 5).length / moves.length;
    return Math.min(1, diversity * 0.6 + center * 0.4);
  }

  private analyzeMobilityStyleCtx(events: OppMoveEvent[]): number {
    if (events.length === 0) return 0.5;
    let sumGain = 0, used = 0;
    for (const e of events) {
      const opp = this.getOpponent(e.player);
      const beforeMy = this.getValidMoves(e.boardBefore, e.player).length;
      const beforeOp = this.getValidMoves(e.boardBefore, opp).length;
      const after = this.simulateMove(e.boardBefore, e.move, e.player);
      if (!after) continue;
      const afterMy = this.getValidMoves(after, e.player).length;
      const afterOp = this.getValidMoves(after, opp).length;
      const gain = (afterMy - beforeMy) - (afterOp - beforeOp);
      sumGain += gain;
      used++;
    }
    if (!used) return this.analyzeMobilityStyleFallback(events.map(x => x.move));
    const avg = sumGain / used;                // typical range ~ [-6..+6]
    return Math.max(0, Math.min(1, 0.5 + avg / 12)); // scale to [0,1]
  }

  // ------------------------------------------------------------------
  // RISK TOLERANCE
  // ------------------------------------------------------------------

  private analyzeRiskToleranceFallback(moves: Position[]): number {
    if (moves.length === 0) return 0.5;
    let risk = 0;
    risk += moves.filter(m => this.isXSquare(m)).length * 0.3;
    risk += moves.filter(m => this.isCSquare(m)).length * 0.2;
    risk -= moves.filter(m => this.isCorner(m)).length * 0.1;
    return Math.max(0, Math.min(1, 0.5 + risk / moves.length));
  }

  private analyzeRiskToleranceCtx(events: OppMoveEvent[]): number {
    if (events.length === 0) return 0.5;
    let risk = 0;
    for (const e of events) {
      if (this.isCorner(e.move)) risk -= 0.25;
      else if (this.isDangerousSquareOn(e.boardBefore, e.move)) risk += 0.6;
      else if (this.isCSquare(e.move) || this.isXSquare(e.move)) risk += 0.2; // geometric hint
    }
    return Math.max(0, Math.min(1, 0.5 + risk / (events.length * 1.2)));
  }

  // ------------------------------------------------------------------
  // STABILITY PREFERENCE
  // ------------------------------------------------------------------

  private analyzeStabilityPreferenceFallback(moves: Position[]): number {
    const stable = moves.filter(m => this.isCorner(m) || this.isEdge(m)).length;
    return moves.length ? stable / moves.length : 0.5;
  }

  private analyzeStabilityPreferenceCtx(events: OppMoveEvent[]): number {
    if (events.length === 0) return 0.5;
    let stable = 0;
    for (const e of events) {
      if (this.isCorner(e.move)) { stable++; continue; }
      if (this.isEdge(e.move) && this.isEdgeSafeOn(e.boardBefore, e.move)) stable++;
    }
    return stable / events.length;
  }

  // ------------------------------------------------------------------
  // WEAKNESS-LIKE TENDENCIES (DETAILS)
  // ------------------------------------------------------------------

  private analyzeMobilityRiskFallback(moves: Position[]): number {
    if (moves.length === 0) return 0;
    let score = 0;
    // geometric risk
    const risky = moves.filter(m => this.isXSquare(m) || this.isCSquare(m)).length;
    score += risky * 0.3;
    // clustering → poorer mobility
    score += this.findClusteredPairs(moves) * 0.05;
    return Math.min(1, score / Math.max(1, moves.length));
  }

  private analyzeMobilityRiskCtx(events: OppMoveEvent[]): number {
    if (events.length === 0) return 0;
    let bad = 0, used = 0;
    for (const e of events) {
      const opp = this.getOpponent(e.player);
      const beforeMy = this.getValidMoves(e.boardBefore, e.player).length;
      const beforeOp = this.getValidMoves(e.boardBefore, opp).length;
      const after = this.simulateMove(e.boardBefore, e.move, e.player);
      if (!after) continue;
      const afterMy = this.getValidMoves(after, e.player).length;
      const afterOp = this.getValidMoves(after, opp).length;
      if ((afterMy - beforeMy) < 0 && (afterOp - beforeOp) > 0) bad++;
      used++;
    }
    return used ? bad / used : 0;
  }

  private analyzeTimingTendencyFallback(moves: Position[]): number {
    if (moves.length === 0) return 0;
    const early = moves.slice(0, Math.min(10, moves.length));
    const late  = moves.slice(-Math.min(10, moves.length));
    let risk = 0;
    // early corners → sometimes hasty
    risk += early.filter(m => this.isCorner(m)).length * 0.1;
    // late risky squares
    risk += late.filter(m => this.isXSquare(m) || this.isCSquare(m)).length * 0.2;
    return Math.min(1, risk / Math.max(1, moves.length));
  }

  private analyzeTimingTendencyCtx(events: OppMoveEvent[]): number {
    if (events.length === 0) return 0;
    const k = Math.min(10, events.length);
    const early = events.slice(0, k);
    const late  = events.slice(-k);
    let risk = 0;

    // Early: X/C near empty corner
    risk += early.filter(e => this.isDangerousSquareOn(e.boardBefore, e.move)).length * 0.2;

    // Late: still using X/C or skipping safe edges/corners
    const lateRisky = late.filter(e =>
      this.isDangerousSquareOn(e.boardBefore, e.move) || this.isXSquare(e.move) || this.isCSquare(e.move)
    ).length;
    risk += lateRisky * 0.25;

    return Math.min(1, risk / Math.max(1, events.length));
  }

  private analyzeEndgameTendencyFallback(moves: Position[]): number {
    if (moves.length === 0) return 0;
    const k = Math.min(20, moves.length);
    const end = moves.slice(-k);
    let risk = 0;
    const cornerRatio = end.filter(m => this.isCorner(m)).length / k;
    if (cornerRatio < 0.30) risk += 0.4;
    risk += end.filter(m => this.isXSquare(m) || this.isCSquare(m)).length * 0.2;
    return Math.min(1, risk);
  }

  private analyzeEndgameTendencyCtx(events: OppMoveEvent[]): number {
    if (events.length === 0) return 0;
    const k = Math.min(20, events.length);
    const end = events.slice(-k);
    let risk = 0;

    const cornerRatio = end.filter(e => this.isCorner(e.move)).length / k;
    if (cornerRatio < 0.30) risk += 0.35;

    const risky = end.filter(e => this.isDangerousSquareOn(e.boardBefore, e.move) || this.isXSquare(e.move) || this.isCSquare(e.move)).length;
    risk += risky * 0.25;

    return Math.min(1, risk);
  }

  // ------------------------------------------------------------------
  // CLUSTERING
  // ------------------------------------------------------------------

  private findClusteredPairs(moves: Position[]): number {
    if (moves.length < 3) return 0;
    let clustered = 0;
    for (let i = 0; i < moves.length - 1; i++) {
      for (let j = i + 1; j < moves.length; j++) {
        const d = Math.abs(moves[i].row - moves[j].row) + Math.abs(moves[i].col - moves[j].col);
        if (d <= 2) clustered++;
      }
    }
    return clustered;
  }

  // ------------------------------------------------------------------
  // X/C RISK & EDGE SAFETY (BOARD-AWARE)
  // ------------------------------------------------------------------

  private isDangerousSquareOn(board: Board, move: Position): boolean {
    const { row, col } = move;
    const X: Array<[number,number,number,number]> = [
      [1,1,0,0],[1,6,0,7],[6,1,7,0],[6,6,7,7],
    ];
    for (const [r,c,cr,cc] of X) {
      if (row === r && col === c && board[cr][cc] === null) return true;
    }
    const C = [
      { corner:[0,0], cells:[[0,1],[1,0]] },
      { corner:[0,7], cells:[[0,6],[1,7]] },
      { corner:[7,0], cells:[[6,0],[7,1]] },
      { corner:[7,7], cells:[[6,7],[7,6]] },
    ];
    for (const g of C) {
      const [cr,cc] = g.corner as [number,number];
      if (board[cr][cc] !== null) continue;
      for (const [r,c] of g.cells) if (row===r && col===c) return true;
    }
    return false;
  }

  private isEdgeSafeOn(board: Board, move: Position): boolean {
    const { row, col } = move;
    if (row === 0) { if ((col<=1 && board[0][0]===null) || (col>=6 && board[0][7]===null)) return false; }
    if (row === 7) { if ((col<=1 && board[7][0]===null) || (col>=6 && board[7][7]===null)) return false; }
    if (col === 0) { if ((row<=1 && board[0][0]===null) || (row>=6 && board[7][0]===null)) return false; }
    if (col === 7) { if ((row<=1 && board[0][7]===null) || (row>=6 && board[7][7]===null)) return false; }
    return true;
  }

  // ------------------------------------------------------------------
  // MINIMAL OTHELLO OPS (2D) — can be replaced by engine bitboards
  // ------------------------------------------------------------------

  private getOpponent(p: Player): Player { return p === 'black' ? 'white' : 'black'; }

  private simulateMove(board: Board, move: Position, player: Player): Board | null {
    if (board[move.row][move.col] !== null) return null;
    const nb: Board = board.map(r => [...r]);
    const opp = this.getOpponent(player);
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    let flipped = 0;

    nb[move.row][move.col] = player;

    for (const [dr,dc] of dirs) {
      const flips: Position[] = [];
      let r = move.row + dr, c = move.col + dc;
      while (r>=0 && r<8 && c>=0 && c<8 && nb[r][c] === opp) { flips.push({row:r,col:c}); r+=dr; c+=dc; }
      if (r>=0 && r<8 && c>=0 && c<8 && nb[r][c] === player && flips.length) {
        for (const f of flips) { nb[f.row][f.col] = player; flipped++; }
      }
    }
    return flipped ? nb : null;
  }

  private getValidMoves(board: Board, player: Player): Position[] {
    const ms: Position[] = [];
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
      if (board[r][c] !== null) continue;
      if (this.isValidMove(board, {row:r, col:c}, player)) ms.push({row:r, col:c});
    }
    return ms;
  }

  private isValidMove(board: Board, m: Position, player: Player): boolean {
    if (board[m.row][m.col] !== null) return false;
    const opp = this.getOpponent(player);
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr,dc] of dirs) {
      if (this.canFlip(board, m.row, m.col, dr, dc, player, opp)) return true;
    }
    return false;
  }

  private canFlip(board: Board, row:number, col:number, dr:number, dc:number, me:Player, opp:Player): boolean {
    let r=row+dr, c=col+dc, seenOpp=false;
    while (r>=0 && r<8 && c>=0 && c<8) {
      const cell = board[r][c];
      if (cell === opp) seenOpp = true;
      else if (cell === me) return seenOpp;
      else break;
      r += dr; c += dc;
    }
    return false;
  }

  // ------------------------------------------------------------------
  // PATTERN DB (simple reference)
  // ------------------------------------------------------------------

  private initializePatternDatabase(): void {
    this.patternDatabase.set('corner_control', {
      name: 'Corner Control',
      description: 'Focuses on controlling corners',
      strength: 0.8,
      weakness: 0.2
    });
    this.patternDatabase.set('edge_control', {
      name: 'Edge Control',
      description: 'Focuses on controlling edges',
      strength: 0.6,
      weakness: 0.4
    });
    this.patternDatabase.set('mobility_focus', {
      name: 'Mobility Focus',
      description: 'Focuses on maintaining mobility',
      strength: 0.7,
      weakness: 0.3
    });
  }

  private getDefaultProfile(): OpponentProfile {
    return {
      style: 'balanced',
      preferences: [],
      weaknesses: [],
      summary: '분석 실패'
    };
  }
}

// ---------- Interfaces ----------

export interface MovePatternAnalysis {
  cornerPreference: number;
  edgePreference: number;
  centerPreference: number;
  mobilityStyle: number;
  riskTolerance: number;
  consistency: number;
}

export interface OpponentAnalysisHistory {
  timestamp: number;
  profile: OpponentProfile;
  moves: Position[];
  patterns: string[];
  // (optional) opponentId?: string;
}

export interface PatternData {
  name: string;
  description: string;
  strength: number;
  weakness: number;
}

export interface OpponentAnalysisStats {
  totalAnalyses: number;
  uniqueOpponents: number;
  averageMoves: number;
  patternCount: number;
}
