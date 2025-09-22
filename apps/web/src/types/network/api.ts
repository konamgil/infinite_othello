/**
 * Network API Domain - HTTP API와 데이터 통신 관련 타입
 * REST API, 에러 처리, 응답 형식 등
 */

// === 기본 API 응답 구조 ===
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
  requestId: string;
  version: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string; // for validation errors
  stack?: string; // for debug mode
  documentation?: string; // link to docs
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
  filters?: any;
  sort?: SortInfo;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SortInfo {
  field: string;
  direction: 'asc' | 'desc';
}

// === HTTP 메서드와 상태 ===
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type HttpStatus = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503;

// === API 요청 설정 ===
export interface ApiRequestConfig {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, any>; // query parameters
  data?: any; // request body
  timeout?: number; // ms
  retries?: number;
  retryDelay?: number; // ms
  cache?: boolean;
  cacheTimeout?: number; // seconds
  signal?: AbortSignal;
}

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
  interceptors: {
    request: RequestInterceptor[];
    response: ResponseInterceptor[];
  };
  cache: CacheConfig;
  auth: AuthConfig;
}

export interface RequestInterceptor {
  name: string;
  handler: (config: ApiRequestConfig) => ApiRequestConfig | Promise<ApiRequestConfig>;
  order?: number;
}

export interface ResponseInterceptor {
  name: string;
  handler: (response: any) => any | Promise<any>;
  errorHandler?: (error: any) => any | Promise<any>;
  order?: number;
}

// === 캐싱 설정 ===
export interface CacheConfig {
  enabled: boolean;
  defaultTTL: number; // seconds
  maxSize: number; // MB
  strategy: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
  keyPrefix: string;
  compression: boolean;
}

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number; // seconds
  compressed?: boolean;
  size?: number; // bytes
}

// === 인증 설정 ===
export interface AuthConfig {
  type: 'bearer' | 'basic' | 'apikey' | 'custom';
  tokenKey: string; // where to store the token
  refreshTokenKey?: string;
  autoRefresh: boolean;
  refreshEndpoint?: string;
  headerName: string; // Authorization header name
  tokenPrefix: string; // Bearer, Basic, etc.
}

// === API 엔드포인트 정의 ===
export interface ApiEndpoints {
  // 인증
  auth: {
    login: '/auth/login';
    logout: '/auth/logout';
    refresh: '/auth/refresh';
    register: '/auth/register';
    forgotPassword: '/auth/forgot-password';
    resetPassword: '/auth/reset-password';
    verifyEmail: '/auth/verify-email';
  };

  // 사용자
  users: {
    me: '/users/me';
    profile: '/users/:id';
    update: '/users/:id';
    delete: '/users/:id';
    search: '/users/search';
    stats: '/users/:id/stats';
    achievements: '/users/:id/achievements';
    friends: '/users/:id/friends';
  };

  // 게임
  games: {
    create: '/games';
    join: '/games/:id/join';
    leave: '/games/:id/leave';
    move: '/games/:id/moves';
    state: '/games/:id/state';
    history: '/games/:id/history';
    analysis: '/games/:id/analysis';
    export: '/games/:id/export';
  };

  // 리플레이
  replays: {
    list: '/replays';
    get: '/replays/:id';
    save: '/replays';
    update: '/replays/:id';
    delete: '/replays/:id';
    search: '/replays/search';
    import: '/replays/import';
    export: '/replays/export';
    collections: '/replays/collections';
  };

  // 방
  rooms: {
    list: '/rooms';
    create: '/rooms';
    get: '/rooms/:id';
    join: '/rooms/:id/join';
    leave: '/rooms/:id/leave';
    update: '/rooms/:id';
    delete: '/rooms/:id';
    chat: '/rooms/:id/chat';
  };

  // 매치메이킹
  matchmaking: {
    queue: '/matchmaking/queue';
    cancel: '/matchmaking/cancel';
    status: '/matchmaking/status';
    accept: '/matchmaking/accept';
    decline: '/matchmaking/decline';
  };

  // 시스템
  system: {
    health: '/health';
    status: '/status';
    version: '/version';
    metrics: '/metrics';
    announcements: '/announcements';
  };
}

// === 요청/응답 타입들 ===
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: string;
}

export interface LoginResponse {
  user: any; // UserProfile type
  token: string;
  refreshToken?: string;
  expiresIn: number; // seconds
  permissions: string[];
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  displayName?: string;
  acceptTerms: boolean;
  newsletter?: boolean;
}

export interface GameCreateRequest {
  mode: 'casual' | 'ranked' | 'private';
  timeControl?: {
    type: 'none' | 'fischer' | 'sudden_death';
    initialTime: number;
    increment: number;
  };
  boardSize?: number;
  isPrivate?: boolean;
  password?: string;
  allowSpectators?: boolean;
}

export interface GameMoveRequest {
  x: number;
  y: number;
  timestamp: number;
  moveNumber: number;
}

export interface ReplaySearchRequest {
  query?: string;
  filters?: {
    mode?: string[];
    result?: 'win' | 'loss' | 'draw';
    dateRange?: {
      start: string;
      end: string;
    };
    ratingRange?: {
      min: number;
      max: number;
    };
    hasAnalysis?: boolean;
    tags?: string[];
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  page?: number;
  pageSize?: number;
}

// === 에러 코드와 처리 ===
export enum ApiErrorCode {
  // 클라이언트 에러
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',

  // 서버 에러
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',

  // 게임 관련 에러
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  INVALID_MOVE = 'INVALID_MOVE',
  NOT_YOUR_TURN = 'NOT_YOUR_TURN',
  GAME_ALREADY_FINISHED = 'GAME_ALREADY_FINISHED',

  // 인증 관련 에러
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',

  // 네트워크 에러
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  OFFLINE_ERROR = 'OFFLINE_ERROR',
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: any;
    validationErrors?: ValidationError[];
    timestamp: string;
    path: string;
    requestId: string;
  };
}

// === 재시도 정책 ===
export interface RetryPolicy {
  maxRetries: number;
  baseDelay: number; // ms
  maxDelay: number; // ms
  backoffFactor: number;
  retryableStatusCodes: HttpStatus[];
  retryableErrorCodes: ApiErrorCode[];
  jitter: boolean;
}

export interface RetryState {
  attempt: number;
  nextDelay: number;
  startTime: number;
  lastError?: ApiError;
}

// === 배치 요청 ===
export interface BatchRequest {
  requests: {
    id: string;
    config: ApiRequestConfig;
  }[];
  parallel?: boolean;
  stopOnError?: boolean;
}

export interface BatchResponse {
  results: {
    id: string;
    success: boolean;
    data?: any;
    error?: ApiError;
  }[];
  totalTime: number;
  successCount: number;
  errorCount: number;
}

// === 파일 업로드 ===
export interface FileUploadConfig {
  url: string;
  method: 'POST' | 'PUT';
  fieldName: string;
  maxSize: number; // bytes
  allowedTypes: string[]; // MIME types
  chunkSize?: number; // for chunked upload
  headers?: Record<string, string>;
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  remainingTime: number; // seconds
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  metadata?: any;
}

// === 웹소켓 API ===
export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnect: boolean;
  reconnectInterval: number; // ms
  maxReconnectAttempts: number;
  heartbeatInterval: number; // ms
  messageQueueSize: number;
  binaryType: 'blob' | 'arraybuffer';
}

export interface WebSocketMessage<T = any> {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
  ack?: boolean; // requires acknowledgment
}

// === API 클라이언트 인터페이스 ===
export interface ApiClient {
  // 기본 HTTP 메서드
  get<T>(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  post<T>(url: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  put<T>(url: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  patch<T>(url: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  delete<T>(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;

  // 유틸리티 메서드
  request<T>(config: ApiRequestConfig): Promise<ApiResponse<T>>;
  batch(request: BatchRequest): Promise<BatchResponse>;

  // 파일 처리
  upload(file: File, config: FileUploadConfig, onProgress?: (progress: FileUploadProgress) => void): Promise<FileUploadResponse>;
  download(url: string, filename?: string): Promise<void>;

  // 설정
  setBaseURL(url: string): void;
  setHeader(name: string, value: string): void;
  removeHeader(name: string): void;
  setTimeout(timeout: number): void;

  // 인터셉터
  addRequestInterceptor(interceptor: RequestInterceptor): void;
  addResponseInterceptor(interceptor: ResponseInterceptor): void;
  removeInterceptor(name: string): void;

  // 캐시
  clearCache(): void;
  getCacheStats(): CacheStats;
}

export interface CacheStats {
  size: number; // bytes
  entries: number;
  hitRate: number; // 0-1
  missRate: number; // 0-1
  oldestEntry: number; // timestamp
  newestEntry: number; // timestamp
}

// === 타입 가드 함수들 ===
export const isApiError = (response: any): response is ErrorResponse => {
  return response && response.error && response.error.code;
};

export const isValidApiResponse = <T>(response: any): response is ApiResponse<T> => {
  return response && typeof response.success === 'boolean' && response.timestamp && response.requestId;
};

export const isRetryableError = (error: ApiError, policy: RetryPolicy): boolean => {
  return policy.retryableErrorCodes.includes(error.code as ApiErrorCode);
};

// === 유틸리티 타입들 ===
export type ApiMethod<T = any> = (config?: Partial<ApiRequestConfig>) => Promise<ApiResponse<T>>;
export type ApiEndpoint = keyof ApiEndpoints;
export type RequestConfig = Partial<ApiRequestConfig>;