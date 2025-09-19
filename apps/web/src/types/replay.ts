// Types for game replay and history system
export interface GameMove {
  x: number;
  y: number;
  player: 'black' | 'white';
  timestamp: number;
  flippedDiscs: { x: number; y: number }[];
  moveNumber: number;
  evaluationScore?: number; // AI evaluation of the move (-100 to 100)
  isOptimal?: boolean; // Whether this was the best move available
  alternativeMoves?: { x: number; y: number; score: number }[]; // Other good moves
}

export interface GameReplay {
  id: string;
  gameMode: 'tower' | 'battle' | 'casual' | 'ai';
  playerBlack: {
    name: string;
    rating?: number;
    isAI: boolean;
    aiLevel?: 'easy' | 'medium' | 'hard' | 'expert';
  };
  playerWhite: {
    name: string;
    rating?: number;
    isAI: boolean;
    aiLevel?: 'easy' | 'medium' | 'hard' | 'expert';
  };
  result: {
    winner: 'black' | 'white' | 'draw';
    finalScore: { black: number; white: number };
    gameEndReason: 'normal' | 'resignation' | 'timeout' | 'disconnect';
  };
  gameInfo: {
    startTime: number;
    endTime: number;
    duration: number; // in seconds
    boardSize: number; // typically 8x8
    totalMoves: number;
  };
  moves: GameMove[];
  analysis?: GameAnalysis;
  metadata: {
    version: string;
    platform: 'web' | 'mobile';
    location?: string; // for tournaments
    tags?: string[];
  };
}

export interface GameAnalysis {
  accuracy: {
    black: number; // 0-100%
    white: number; // 0-100%
  };
  turningPoints: {
    moveNumber: number;
    previousEvaluation: number;
    newEvaluation: number;
    significance: 'minor' | 'major' | 'critical';
    description: string;
  }[];
  openingName?: string;
  gamePhases: {
    opening: { startMove: number; endMove: number; evaluation: string };
    midgame: { startMove: number; endMove: number; evaluation: string };
    endgame: { startMove: number; endMove: number; evaluation: string };
  };
  bestMoves: number[]; // Move numbers that were optimal
  blunders: number[]; // Move numbers that were significant mistakes
  timeAnalysis?: {
    averageThinkTime: { black: number; white: number };
    longestThink: { moveNumber: number; player: 'black' | 'white'; duration: number };
    timeDistribution: 'even' | 'frontloaded' | 'backloaded';
  };
}

export interface ReplayFilters {
  gameMode?: ('tower' | 'battle' | 'casual' | 'ai')[];
  opponent?: 'human' | 'ai' | 'any';
  result?: 'win' | 'loss' | 'draw' | 'any';
  dateRange?: {
    start: Date;
    end: Date;
  };
  minDuration?: number;
  maxDuration?: number;
  ratingRange?: {
    min: number;
    max: number;
  };
  tags?: string[];
}

export interface ReplaySortOptions {
  field: 'date' | 'duration' | 'rating' | 'accuracy' | 'moves';
  direction: 'asc' | 'desc';
}

export interface ReplayPlayerControls {
  isPlaying: boolean;
  currentMoveIndex: number;
  playbackSpeed: 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2 | 2.5 | 3 | 4;
  autoPlay: boolean;
  showAnalysis: boolean;
  showCoordinates: boolean;
  highlightLastMove: boolean;
  // Enhanced features
  showMoveAnnotations?: boolean;
  criticalMoveDetection?: boolean;
  soundEnabled?: boolean;
  keyboardShortcutsEnabled?: boolean;
}

export interface ReplayStatistics {
  totalGames: number;
  winRate: number;
  averageGameDuration: number;
  averageMovesPerGame: number;
  favoriteOpenings: { name: string; count: number; winRate: number }[];
  strongestOpponents: { name: string; gamesPlayed: number; winRate: number }[];
  performanceByMode: {
    [K in 'tower' | 'battle' | 'casual' | 'ai']: {
      games: number;
      winRate: number;
      averageRating?: number;
    };
  };
  recentTrends: {
    last7Days: { games: number; winRate: number };
    last30Days: { games: number; winRate: number };
    last90Days: { games: number; winRate: number };
  };
}

// UI State types
export interface ReplayUIState {
  selectedReplay: GameReplay | null;
  viewMode: 'list' | 'replay' | 'analysis';
  filters: ReplayFilters;
  sortOptions: ReplaySortOptions;
  playerControls: ReplayPlayerControls;
  showStatistics: boolean;
  searchQuery: string;
}

// Event types for replay player
export interface ReplayPlayerEvents {
  onPlay: () => void;
  onPause: () => void;
  onStep: (direction: 'forward' | 'backward') => void;
  onSeek: (moveIndex: number) => void;
  onSpeedChange: (speed: ReplayPlayerControls['playbackSpeed']) => void;
  onToggleAnalysis: () => void;
  onExit: () => void;
}