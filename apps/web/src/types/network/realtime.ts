/**
 * Network Realtime Domain - 실시간 통신과 이벤트 관련 타입
 * WebSocket, 실시간 게임, 채팅, 알림 등
 */

import type { PlayerColor, GameMove } from '../game';
import type { UserProfile } from '../auth';

// === 실시간 연결 상태 ===
export interface RealtimeConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  connectionId: string | null;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectInterval: number; // ms
  latency: number | null; // ms
  quality: ConnectionQuality;
}

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';

// === 실시간 이벤트 ===
export interface RealtimeEvent<T = any> {
  id: string;
  type: EventType;
  payload: T;
  timestamp: Date;
  source: EventSource;
  targetId?: string; // specific user/room target
  broadcast?: boolean; // broadcast to all
}

export type EventType =
  // 게임 이벤트
  | 'game:move'
  | 'game:start'
  | 'game:end'
  | 'game:pause'
  | 'game:resume'
  | 'game:abandon'
  | 'game:join'
  | 'game:leave'
  // 사용자 이벤트
  | 'user:online'
  | 'user:offline'
  | 'user:idle'
  | 'user:typing'
  | 'user:profile_update'
  // 방 이벤트
  | 'room:created'
  | 'room:updated'
  | 'room:deleted'
  | 'room:join'
  | 'room:leave'
  | 'room:message'
  // 시스템 이벤트
  | 'system:maintenance'
  | 'system:announcement'
  | 'system:update'
  | 'connection:established'
  | 'connection:lost'
  | 'connection:restored';

export type EventSource = 'client' | 'server' | 'system' | 'broadcast';

// === 게임 실시간 이벤트 ===
export interface GameMoveEvent {
  gameId: string;
  playerId: string;
  move: GameMove;
  boardState: Array<Array<PlayerColor | null>>;
  validMoves: Array<{ row: number; col: number }>;
  timeRemaining?: {
    black: number;
    white: number;
  };
}

export interface GameStateEvent {
  gameId: string;
  status: 'waiting' | 'playing' | 'paused' | 'finished';
  players: {
    black: UserProfile;
    white: UserProfile;
  };
  currentPlayer: PlayerColor;
  moveCount: number;
  score: {
    black: number;
    white: number;
  };
}

export interface GameEndEvent {
  gameId: string;
  winner: PlayerColor | 'draw';
  reason: 'normal' | 'resignation' | 'timeout' | 'disconnect';
  finalScore: {
    black: number;
    white: number;
  };
  duration: number; // seconds
  moves: GameMove[];
}

// === 사용자 상태 이벤트 ===
export interface UserPresenceEvent {
  userId: string;
  status: 'online' | 'offline' | 'idle' | 'busy' | 'playing';
  lastSeen: Date;
  activity?: {
    type: 'game' | 'replay' | 'browse' | 'idle';
    details?: string;
    gameId?: string;
  };
  device?: {
    type: 'web' | 'mobile' | 'desktop';
    os?: string;
    browser?: string;
  };
}

export interface UserTypingEvent {
  userId: string;
  roomId: string;
  isTyping: boolean;
  timestamp: Date;
}

// === 방(Room) 시스템 ===
export interface GameRoom {
  id: string;
  name: string;
  description?: string;
  host: UserProfile;
  players: RoomPlayer[];
  spectators: RoomSpectator[];

  // 방 설정
  settings: RoomSettings;

  // 상태
  status: RoomStatus;
  maxPlayers: number;
  maxSpectators: number;
  isPrivate: boolean;
  password?: string;

  // 게임 정보
  currentGame?: {
    id: string;
    status: 'waiting' | 'playing' | 'paused' | 'finished';
    players: { black: UserProfile; white: UserProfile };
  };

  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface RoomPlayer {
  user: UserProfile;
  role: 'host' | 'player';
  color?: PlayerColor;
  isReady: boolean;
  joinedAt: Date;
  lastActivity: Date;
}

export interface RoomSpectator {
  user: UserProfile;
  joinedAt: Date;
  canChat: boolean;
}

export interface RoomSettings {
  gameMode: 'casual' | 'ranked' | 'tournament';
  timeControl: {
    type: 'none' | 'fischer' | 'sudden_death';
    initialTime: number; // seconds
    increment: number; // seconds per move
  };
  boardSize: number;
  allowSpectators: boolean;
  allowChat: boolean;
  autoStart: boolean;
  allowUndo: boolean;
  showAnalysis: boolean;
}

export type RoomStatus = 'waiting' | 'playing' | 'finished' | 'closed';

// === 채팅 시스템 ===
export interface ChatMessage {
  id: string;
  roomId: string;
  author: UserProfile;
  content: string;
  type: 'text' | 'emote' | 'system' | 'game_event';
  timestamp: Date;

  // 메타데이터
  edited?: boolean;
  editedAt?: Date;
  deleted?: boolean;
  deletedAt?: Date;

  // 추가 데이터
  attachments?: ChatAttachment[];
  mentions?: string[]; // user IDs
  reactions?: ChatReaction[];

  // 시스템 메시지용
  systemData?: any;
}

export interface ChatAttachment {
  id: string;
  type: 'image' | 'file' | 'link' | 'game_position';
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
  thumbnail?: string;
}

export interface ChatReaction {
  emoji: string;
  users: string[]; // user IDs
  count: number;
}

export interface ChatSettings {
  enabled: boolean;
  allowFiles: boolean;
  allowImages: boolean;
  allowLinks: boolean;
  maxMessageLength: number;
  rateLimitMessages: number; // messages per minute
  moderationEnabled: boolean;
  profanityFilter: boolean;
  allowPrivateMessages: boolean;
}

// === 알림 시스템 ===
export interface RealtimeNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;

  // 대상
  userId?: string; // specific user
  roomId?: string; // room members
  broadcast?: boolean; // all users

  // 타이밍
  timestamp: Date;
  expiresAt?: Date;

  // 동작
  actions?: NotificationAction[];
  persistent?: boolean;
  sound?: boolean;

  // 메타데이터
  source: 'system' | 'game' | 'user' | 'admin';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'game' | 'social' | 'system' | 'achievement';
}

export type NotificationType =
  | 'game_invite'
  | 'game_start'
  | 'game_end'
  | 'turn_reminder'
  | 'friend_request'
  | 'friend_online'
  | 'message_received'
  | 'achievement_unlocked'
  | 'system_maintenance'
  | 'tournament_start'
  | 'tournament_round'
  | 'rating_change';

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: 'accept' | 'decline' | 'view' | 'join' | 'dismiss' | 'custom';
  data?: any;
}

// === 매치메이킹 ===
export interface MatchmakingRequest {
  id: string;
  userId: string;
  preferences: MatchPreferences;
  status: 'searching' | 'found' | 'cancelled' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  estimatedWaitTime?: number; // seconds
}

export interface MatchPreferences {
  gameMode: 'casual' | 'ranked' | 'quick';
  timeControl: {
    min: number;
    max: number;
  };
  ratingRange: {
    min: number;
    max: number;
  };
  preferredColor?: PlayerColor;
  allowBot: boolean;
  region?: string;
}

export interface MatchFound {
  matchId: string;
  players: {
    black: UserProfile;
    white: UserProfile;
  };
  gameSettings: RoomSettings;
  roomId: string;
  expiresAt: Date; // acceptance deadline
}

// === 스펙테이터 시스템 ===
export interface SpectatorSession {
  id: string;
  gameId: string;
  spectator: UserProfile;
  joinedAt: Date;
  permissions: SpectatorPermissions;
  preferences: SpectatorPreferences;
}

export interface SpectatorPermissions {
  canChat: boolean;
  canViewAnalysis: boolean;
  canSuggestMoves: boolean;
  canSharePosition: boolean;
}

export interface SpectatorPreferences {
  showMoveNumbers: boolean;
  showEvaluation: boolean;
  showChat: boolean;
  autoFollow: boolean; // follow current position
  soundEnabled: boolean;
}

// === 네트워크 상태 모니터링 ===
export interface NetworkMetrics {
  latency: number; // ms
  jitter: number; // ms
  packetLoss: number; // percentage
  bandwidth: {
    up: number; // kbps
    down: number; // kbps
  };
  quality: ConnectionQuality;
  timestamp: Date;
}

export interface ConnectionDiagnostics {
  userId: string;
  connectionId: string;
  clientInfo: {
    userAgent: string;
    platform: string;
    connection: string; // navigator.connection.effectiveType
  };
  serverInfo: {
    region: string;
    version: string;
    load: number; // 0-100
  };
  metrics: NetworkMetrics[];
  issues: ConnectionIssue[];
}

export interface ConnectionIssue {
  type: 'high_latency' | 'packet_loss' | 'unstable' | 'timeout';
  severity: 'low' | 'medium' | 'high';
  description: string;
  firstOccurred: Date;
  lastOccurred: Date;
  count: number;
}

// === 이벤트 핸들러와 리스너 ===
export interface RealtimeEventHandler<T = any> {
  (event: RealtimeEvent<T>): void | Promise<void>;
}

export interface EventSubscription {
  id: string;
  eventType: EventType;
  handler: RealtimeEventHandler;
  filter?: EventFilter;
  once?: boolean;
  createdAt: Date;
}

export interface EventFilter {
  userId?: string;
  roomId?: string;
  gameId?: string;
  source?: EventSource;
  priority?: 'low' | 'normal' | 'high';
}

// === 타입 가드 함수들 ===
export const isGameEvent = (event: RealtimeEvent): boolean => {
  return event.type.startsWith('game:');
};

export const isUserEvent = (event: RealtimeEvent): boolean => {
  return event.type.startsWith('user:');
};

export const isSystemEvent = (event: RealtimeEvent): boolean => {
  return event.type.startsWith('system:');
};

export const isConnected = (state: RealtimeConnectionState): boolean => {
  return state.isConnected && !state.isConnecting && !state.isReconnecting;
};

export const canJoinRoom = (room: GameRoom, user: UserProfile): boolean => {
  if (room.status !== 'waiting') return false;
  if (room.players.length >= room.maxPlayers) return false;
  if (room.isPrivate && !room.players.some(p => p.user.id === user.id)) return false;
  return true;
};

// === 유틸리티 타입들 ===
export type RealtimeEventPayload<T extends EventType> =
  T extends 'game:move' ? GameMoveEvent :
  T extends 'game:end' ? GameEndEvent :
  T extends 'user:online' ? UserPresenceEvent :
  T extends 'room:message' ? ChatMessage :
  any;

export type EventHandler<T extends EventType> = RealtimeEventHandler<RealtimeEventPayload<T>>;