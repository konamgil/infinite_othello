/**
 * Replay Record Domain - 게임 기록과 리플레이 데이터 타입
 * 게임 히스토리, 기록 저장, 메타데이터 등
 */

import type { GameMove, GameResult, PlayerInfo, GameMode, GameAnalysis } from '../game';

// === 게임 기록 ===
export interface GameRecord {
  id: string;
  date: Date | string;
  mode: GameMode;

  // 플레이어 정보
  playerBlack: PlayerInfo;
  playerWhite: PlayerInfo;

  // 게임 진행
  moves: GameMove[];
  result: GameResult;

  // 시간 정보
  duration: number; // seconds
  gameInfo: GameTimeInfo;

  // 분석과 메타데이터
  analysis?: GameAnalysis;
  metadata: GameMetadata;
  tags?: string[];
}

export interface GameTimeInfo {
  startTime: number; // timestamp
  endTime: number;   // timestamp
  duration: number;  // seconds
  boardSize: number; // 8x8 기본
  totalMoves: number;

  // 시간 제어
  timeControl?: {
    initialTime: number; // seconds
    increment: number;   // seconds per move
    type: 'none' | 'fischer' | 'bronstein' | 'sudden_death';
  };

  // 플레이어별 시간 사용
  timeUsed?: {
    black: number; // seconds
    white: number; // seconds
  };

  // 턴별 시간
  moveTimings?: {
    moveNumber: number;
    player: 'black' | 'white';
    timeSpent: number; // seconds for this move
    timeRemaining: number; // seconds left after move
  }[];
}

export interface GameMetadata {
  version: string; // 앱 버전
  platform: 'web' | 'mobile' | 'desktop';

  // 위치 정보 (토너먼트용)
  location?: {
    venue?: string;
    city?: string;
    country?: string;
    timezone?: string;
  };

  // 이벤트 정보
  event?: {
    name?: string;
    round?: number;
    section?: string;
    organizer?: string;
  };

  // 기술적 정보
  engine?: {
    name?: string;
    version?: string;
    analysis?: boolean;
  };

  // 커스텀 태그와 노트
  tags?: string[];
  notes?: string;

  // 가져오기/내보내기
  importedFrom?: string;
  exportFormat?: 'pgn' | 'json' | 'custom';
}

// === 리플레이 컬렉션 ===
export interface ReplayCollection {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  isPublic: boolean;

  // 게임들
  gameIds: string[];
  games?: GameRecord[];

  // 메타데이터
  createdAt: string;
  updatedAt: string;
  tags?: string[];

  // 통계
  stats?: {
    totalGames: number;
    totalDuration: number;
    averageRating: number;
    winRate: number;
  };
}

// === 게임 주석 ===
export interface GameAnnotation {
  id: string;
  gameId: string;
  moveNumber: number; // 0이면 게임 전체 주석

  // 주석 내용
  text: string;
  type: 'comment' | 'variation' | 'assessment' | 'question';

  // 작성자
  authorId: string;
  authorName: string;

  // 메타데이터
  createdAt: string;
  updatedAt?: string;
  isPublic: boolean;

  // 평가
  assessment?: 'brilliant' | 'great' | 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  symbols?: string[]; // !, ?, !!, ??, !?, ?!
}

export interface GameVariation {
  id: string;
  gameId: string;
  fromMoveNumber: number;

  // 변형 수순
  moves: GameMove[];
  comment?: string;

  // 메타데이터
  createdBy: string;
  createdAt: string;
  analysis?: GameAnalysis;
}

// === 리플레이 통계 ===
export interface ReplayStatistics {
  // 기본 통계
  totalGames: number;
  winRate: number;
  averageGameDuration: number;
  averageMovesPerGame: number;

  // 상세 통계
  favoriteOpenings: OpeningStats[];
  strongestOpponents: OpponentStats[];
  performanceByMode: ModePerformance;

  // 시간대별 통계
  recentTrends: {
    last7Days: PeriodStats;
    last30Days: PeriodStats;
    last90Days: PeriodStats;
  };

  // 분석 통계
  analysisStats?: {
    averageAccuracy: number;
    totalBlunders: number;
    improvementTrend: number; // positive means improving
    strongestPhase: 'opening' | 'midgame' | 'endgame';
  };
}

export interface OpeningStats {
  name: string;
  count: number;
  winRate: number;
  averageAccuracy?: number;
  elo?: number; // performance rating in this opening
}

export interface OpponentStats {
  name: string;
  gamesPlayed: number;
  winRate: number;
  averageRating?: number;
  lastPlayed?: string;
}

export interface ModePerformance {
  [mode: string]: {
    games: number;
    winRate: number;
    averageRating?: number;
    timeSpent?: number; // total seconds
  };
}

export interface PeriodStats {
  games: number;
  winRate: number;
  averageRating?: number;
  timeSpent?: number;
  improvement?: number; // rating change
}

// === 리플레이 가져오기/내보내기 ===
export interface ImportOptions {
  format: 'pgn' | 'json' | 'csv' | 'othello_format';
  source: 'file' | 'url' | 'text';
  validateMoves: boolean;
  includeAnalysis: boolean;
  createCollection?: boolean;
  collectionName?: string;
}

export interface ExportOptions {
  format: 'pgn' | 'json' | 'csv' | 'pdf';
  includeAnalysis: boolean;
  includeComments: boolean;
  includeVariations: boolean;
  includeStatistics: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  gameIds?: string[];
}

export interface ImportResult {
  success: boolean;
  gamesImported: number;
  gamesSkipped: number;
  errors: string[];
  gameIds: string[];
  collectionId?: string;
}

export interface ExportResult {
  success: boolean;
  format: string;
  filename: string;
  downloadUrl?: string;
  data?: string | Blob;
  error?: string;
}

// === 백업과 동기화 ===
export interface BackupData {
  version: string;
  exportedAt: string;
  userId: string;

  // 데이터
  games: GameRecord[];
  collections: ReplayCollection[];
  annotations: GameAnnotation[];
  variations: GameVariation[];

  // 설정
  userSettings?: any;
  preferences?: any;

  // 메타데이터
  totalSize: number; // bytes
  gameCount: number;
  checksum?: string;
}

export interface SyncStatus {
  lastSyncAt: string | null;
  isEnabled: boolean;
  conflicts: SyncConflict[];
  pendingUploads: string[]; // game IDs
  pendingDownloads: string[]; // game IDs
}

export interface SyncConflict {
  gameId: string;
  type: 'modified' | 'deleted' | 'created';
  localVersion: GameRecord;
  remoteVersion: GameRecord;
  conflictedAt: string;
}

// === 타입 가드 함수들 ===
export const isValidGameRecord = (record: any): record is GameRecord => {
  return (
    record &&
    typeof record.id === 'string' &&
    Array.isArray(record.moves) &&
    record.result &&
    record.playerBlack &&
    record.playerWhite
  );
};

export const hasAnalysis = (record: GameRecord): record is GameRecord & { analysis: GameAnalysis } => {
  return record.analysis !== undefined;
};

export const isRecentGame = (record: GameRecord, days: number = 7): boolean => {
  const gameDate = typeof record.date === 'string' ? new Date(record.date) : record.date;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return gameDate >= cutoff;
};

// === 유틸리티 타입들 ===
export type GameRecordSummary = Pick<GameRecord, 'id' | 'date' | 'mode' | 'result' | 'duration'>;
export type CollectionSummary = Pick<ReplayCollection, 'id' | 'name' | 'gameIds' | 'stats'>;
export type StatsPeriod = 'week' | 'month' | 'quarter' | 'year' | 'all_time';