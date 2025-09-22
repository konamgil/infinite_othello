/**
 * Network Domain - 네트워크와 통신 관련 모든 타입의 중앙 집중화
 * 실시간 통신, API 호출, 웹소켓 등
 */

// Core network types
export * from './realtime';
export * from './api';

// Re-export commonly used types with aliases
export type {
  RealtimeEvent as Event,
  RealtimeConnectionState as ConnectionState,
  GameRoom as Room,
  ChatMessage as Message,
  RealtimeNotification as Notification,
} from './realtime';

export type {
  ApiResponse as Response,
  ApiError as Error,
  ApiRequestConfig as RequestConfig,
  PaginatedResponse as Paginated,
} from './api';