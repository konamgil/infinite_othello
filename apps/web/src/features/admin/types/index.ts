// Admin Types - 관리자 시스템의 모든 타입 정의
// 확장 가능한 타입 시스템으로 설계

// 기본 관리자 타입들
export interface AdminConfiguration {
  secretKey: string;
  maxEngines: number;
  enableAutoRegistration: boolean;
  enableRealTimeMonitoring: boolean;
  enableAnalytics: boolean;
  enableAlerts: boolean;
  alertThreshold: number;
  reportFormat: 'simple' | 'detailed' | 'comprehensive';
  timezone: string;
  language: string;
}

export interface SystemStatus {
  modules: ModuleStatus[];
  plugins: PluginStatus[];
  config: AdminConfiguration;
  uptime: number;
  health: 'good' | 'warning' | 'critical';
  lastUpdate: number;
}

export interface ModuleStatus {
  name: string;
  enabled: boolean;
  status: {
    status: 'running' | 'stopped' | 'error';
    health: 'good' | 'warning' | 'critical';
    lastUpdate: number;
    error?: string;
  };
}

export interface PluginStatus {
  name: string;
  enabled: boolean;
  status: {
    status: 'running' | 'stopped' | 'error';
    health: 'good' | 'warning' | 'critical';
    lastUpdate: number;
    error?: string;
  };
}

// 모듈 관련 타입들
export interface AdminModule {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly dependencies: string[];
  readonly features: AdminFeature[];

  initialize(): Promise<void>;
  destroy(): Promise<void>;
  setEnabled(enabled: boolean): void;
  isEnabled(): boolean;
  getStatus(): ModuleStatus;
  getConfig(): any;
  updateConfig(config: any): void;
  getUI(): React.ComponentType;
  getAPI(): AdminModuleAPI;
}

export interface AdminFeature {
  name: string;
  description: string;
  category?: string;
  enabled?: boolean;
  config?: any;
}

export interface AdminModuleAPI {
  [key: string]: (...args: any[]) => any;
}

// 플러그인 관련 타입들
export interface AdminPlugin {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly dependencies: string[];
  readonly hooks: PluginHook[];

  initialize(): Promise<void>;
  destroy(): Promise<void>;
  setEnabled(enabled: boolean): void;
  isEnabled(): boolean;
  getStatus(): PluginStatus;
  getConfig(): any;
  updateConfig(config: any): void;
  getUI(): React.ComponentType;
  getAPI(): AdminPluginAPI;
}

export interface PluginHook {
  name: string;
  handler: (...args: any[]) => Promise<void>;
  priority?: number;
  enabled?: boolean;
}

export interface AdminPluginAPI {
  [key: string]: (...args: any[]) => any;
}

// AI 엔진 관련 타입들
export interface AIEngine {
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly category: EngineCategory;
  readonly description: string;
  readonly features: string[];
  readonly config: any;
  analyze(request: EngineRequest): Promise<EngineResponse>;
  stop?(): void;
}

export interface EngineCategory {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
  type: 'classical' | 'neural' | 'quantum' | 'hybrid';
  specialization: string[];
}

export interface EngineRequest {
  readonly gameCore: any;
  readonly timeLimit?: number;
  readonly depth?: number;
  readonly skill?: number;
  readonly opponentMoves?: any[];
}

export interface EngineResponse {
  readonly bestMove?: any;
  readonly evaluation: number;
  readonly nodes: number;
  readonly depth: number;
  readonly timeUsed: number;
  readonly pv?: any[];
  readonly stats?: any;
}

// 벤치마크 관련 타입들
export interface BenchmarkConfig {
  rounds: number;
  timeLimit: number;
  depthLimit?: number;
  skillLevel?: number;
  enableLearning: boolean;
  enableAnalysis: boolean;
  enableStatistics: boolean;
  tournamentType: 'round_robin' | 'swiss' | 'elimination';
  pairingMethod: 'random' | 'balanced' | 'performance';
}

export interface GameResult {
  id: string;
  engine1: string;
  engine2: string;
  winner: string | null;
  score: number;
  moves: number;
  timeUsed: number;
  analysis?: GameAnalysis;
  timestamp: number;
}

export interface GameAnalysis {
  openingPhase: PhaseAnalysis;
  midgamePhase: PhaseAnalysis;
  endgamePhase: PhaseAnalysis;
  criticalMoves: CriticalMove[];
  mistakes: Mistake[];
  strengths: Strength[];
  weaknesses: Weakness[];
  overallRating: number;
}

export interface PhaseAnalysis {
  phase: 'opening' | 'midgame' | 'endgame';
  moves: number;
  averageTime: number;
  accuracy: number;
  strategy: string;
  effectiveness: number;
}

export interface CriticalMove {
  move: any;
  position: number;
  impact: number;
  description: string;
}

export interface Mistake {
  move: any;
  position: number;
  severity: 'minor' | 'major' | 'critical';
  description: string;
  suggestion: string;
}

export interface Strength {
  aspect: string;
  score: number;
  description: string;
  examples: any[];
}

export interface Weakness {
  aspect: string;
  score: number;
  description: string;
  suggestions: string[];
}

export interface TournamentResult {
  id: string;
  name: string;
  engines: string[];
  results: GameResult[];
  standings: EngineStanding[];
  statistics: TournamentStatistics;
  startTime: number;
  endTime: number;
  status: 'pending' | 'running' | 'completed' | 'cancelled';
}

export interface EngineStanding {
  engine: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  winRate: number;
  averageTime: number;
  rank: number;
  performance: PerformanceMetrics;
}

export interface PerformanceMetrics {
  averageNodes: number;
  averageDepth: number;
  averageTime: number;
  accuracy: number;
  consistency: number;
  efficiency: number;
}

export interface TournamentStatistics {
  totalGames: number;
  totalMoves: number;
  averageGameTime: number;
  mostWins: string;
  mostLosses: string;
  bestWinRate: string;
  worstWinRate: string;
  averageMoves: number;
  longestGame: number;
  shortestGame: number;
  mostImproved: string;
  mostDeclined: string;
}

export interface BenchmarkResult {
  id: string;
  name: string;
  engines: AIEngine[];
  results: TournamentResult[];
  overallStandings: EngineStanding[];
  statistics: BenchmarkStatistics;
  recommendations: string[];
  timestamp: number;
}

export interface BenchmarkStatistics {
  totalEngines: number;
  totalGames: number;
  totalTournaments: number;
  averageGameTime: number;
  bestEngine: string;
  worstEngine: string;
  mostImproved: string;
  mostDeclined: string;
  averageWinRate: number;
  totalMoves: number;
  systemPerformance: SystemPerformance;
}

export interface SystemPerformance {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkUsage: number;
  responseTime: number;
  throughput: number;
}

// 분석 관련 타입들
export interface AnalysisResult {
  id: string;
  type: 'performance' | 'strategy' | 'trend' | 'comparison';
  target: string;
  data: any;
  insights: Insight[];
  recommendations: Recommendation[];
  confidence: number;
  timestamp: number;
}

export interface Insight {
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  evidence: any[];
  confidence: number;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high' | 'critical';
  steps: string[];
}

// 모니터링 관련 타입들
export interface MonitoringData {
  timestamp: number;
  system: SystemMetrics;
  engines: EngineMetrics[];
  benchmarks: BenchmarkMetrics[];
  alerts: Alert[];
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  processes: number;
  uptime: number;
}

export interface EngineMetrics {
  name: string;
  status: 'running' | 'stopped' | 'error';
  performance: PerformanceMetrics;
  health: 'good' | 'warning' | 'critical';
  lastUpdate: number;
}

export interface BenchmarkMetrics {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'cancelled';
  progress: number;
  currentGame: string;
  estimatedTime: number;
  performance: PerformanceMetrics;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: number;
  acknowledged: boolean;
  resolved: boolean;
}

// UI 관련 타입들
export interface AdminUIProps {
  config: AdminConfiguration;
  status: SystemStatus;
  onConfigUpdate: (config: Partial<AdminConfiguration>) => void;
  onModuleToggle: (name: string, enabled: boolean) => void;
  onPluginToggle: (name: string, enabled: boolean) => void;
}

export interface ModuleUIProps {
  module: AdminModule;
  config: any;
  onConfigUpdate: (config: any) => void;
  onToggle: (enabled: boolean) => void;
}

export interface PluginUIProps {
  plugin: AdminPlugin;
  config: any;
  onConfigUpdate: (config: any) => void;
  onToggle: (enabled: boolean) => void;
}

// 이벤트 관련 타입들
export interface AdminEvent {
  type: string;
  data: any;
  timestamp: number;
  source: string;
}

export interface AdminEventListener {
  event: string;
  handler: (data: any) => void;
  priority?: number;
  once?: boolean;
}

// 설정 관련 타입들
export interface AdminSettings {
  general: GeneralSettings;
  security: SecuritySettings;
  performance: PerformanceSettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
}

export interface GeneralSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  autoSave: boolean;
  autoSaveInterval: number;
}

export interface SecuritySettings {
  requireAuth: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  enableAuditLog: boolean;
  enableEncryption: boolean;
}

export interface PerformanceSettings {
  maxConcurrentGames: number;
  maxMemoryUsage: number;
  enableCaching: boolean;
  cacheSize: number;
  enableCompression: boolean;
}

export interface NotificationSettings {
  enableEmail: boolean;
  enablePush: boolean;
  enableSMS: boolean;
  emailAddress: string;
  phoneNumber: string;
  alertThreshold: number;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: string;
  layout: 'compact' | 'comfortable' | 'spacious';
  showSidebar: boolean;
  showToolbar: boolean;
}

// 내보내기 타입들
export type {
  AdminConfiguration,
  SystemStatus,
  ModuleStatus,
  PluginStatus,
  AdminModule,
  AdminFeature,
  AdminModuleAPI,
  AdminPlugin,
  PluginHook,
  AdminPluginAPI,
  AIEngine,
  EngineCategory,
  EngineRequest,
  EngineResponse,
  BenchmarkConfig,
  GameResult,
  GameAnalysis,
  PhaseAnalysis,
  CriticalMove,
  Mistake,
  Strength,
  Weakness,
  TournamentResult,
  EngineStanding,
  PerformanceMetrics,
  TournamentStatistics,
  BenchmarkResult,
  BenchmarkStatistics,
  SystemPerformance,
  AnalysisResult,
  Insight,
  Recommendation,
  MonitoringData,
  SystemMetrics,
  EngineMetrics,
  BenchmarkMetrics,
  Alert,
  AdminUIProps,
  ModuleUIProps,
  PluginUIProps,
  AdminEvent,
  AdminEventListener,
  AdminSettings,
  GeneralSettings,
  SecuritySettings,
  PerformanceSettings,
  NotificationSettings,
  AppearanceSettings
};
