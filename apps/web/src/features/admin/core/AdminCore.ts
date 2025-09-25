// AdminCore - 확장 가능한 관리자 핵심 시스템
// 모든 관리자 기능의 중심이 되는 핵심 클래스

import { AdminModule, AdminPlugin, AdminFeature, AdminConfiguration, SystemStatus } from '../types';

export class AdminCore {
  private modules: Map<string, AdminModule> = new Map();
  private plugins: Map<string, AdminPlugin> = new Map();
  private config: AdminConfiguration;
  private eventBus: AdminEventBus;
  private startTime: number;

  constructor(config: AdminConfiguration) {
    this.config = config;
    this.eventBus = new AdminEventBus();
    this.startTime = Date.now();
    this.initializeCore();
  }

  /**
   * 핵심 시스템 초기화
   */
  private async initializeCore(): Promise<void> {
    console.log('AdminCore 초기화 시작...');
    
    // 기본 모듈들 등록
    await this.registerDefaultModules();
    
    // 기본 플러그인들 등록
    await this.registerDefaultPlugins();
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    console.log('AdminCore 초기화 완료');
  }

  /**
   * 기본 모듈들 등록
   */
  private async registerDefaultModules(): Promise<void> {
    // 벤치마크 모듈 등록
    const benchmarkModule = new BenchmarkModule();
    await this.registerModule(benchmarkModule);
    
    // AI 엔진 모듈 등록
    const aiModule = new AIModule();
    await this.registerModule(aiModule);
    
    // 분석 모듈 등록
    const analyticsModule = new AnalyticsModule();
    await this.registerModule(analyticsModule);
  }

  /**
   * 기본 플러그인들 등록
   */
  private async registerDefaultPlugins(): Promise<void> {
    // 성능 분석 플러그인 등록
    const performancePlugin = new PerformanceAnalysisPlugin();
    await this.registerPlugin(performancePlugin);
    
    // 모니터링 플러그인 등록
    const monitoringPlugin = new MonitoringPlugin();
    await this.registerPlugin(monitoringPlugin);
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    this.eventBus.on('module:registered', (module: AdminModule) => {
      console.log(`모듈 등록됨: ${module.name}`);
    });
    
    this.eventBus.on('plugin:registered', (plugin: AdminPlugin) => {
      console.log(`플러그인 등록됨: ${plugin.name}`);
    });
    
    this.eventBus.on('module:toggled', ({ name, enabled }: { name: string, enabled: boolean }) => {
      console.log(`모듈 ${name} ${enabled ? '활성화' : '비활성화'}됨`);
    });
    
    this.eventBus.on('plugin:toggled', ({ name, enabled }: { name: string, enabled: boolean }) => {
      console.log(`플러그인 ${name} ${enabled ? '활성화' : '비활성화'}됨`);
    });
  }

  /**
   * 모듈 등록
   */
  async registerModule(module: AdminModule): Promise<void> {
    try {
      await module.initialize();
      this.modules.set(module.name, module);
      this.eventBus.emit('module:registered', module);
    } catch (error) {
      console.error(`모듈 등록 실패: ${module.name}`, error);
      throw error;
    }
  }

  /**
   * 플러그인 등록
   */
  async registerPlugin(plugin: AdminPlugin): Promise<void> {
    try {
      await plugin.initialize();
      this.plugins.set(plugin.name, plugin);
      this.eventBus.emit('plugin:registered', plugin);
    } catch (error) {
      console.error(`플러그인 등록 실패: ${plugin.name}`, error);
      throw error;
    }
  }

  /**
   * 모듈 활성화/비활성화
   */
  toggleModule(name: string, enabled: boolean): void {
    const module = this.modules.get(name);
    if (module) {
      module.setEnabled(enabled);
      this.eventBus.emit('module:toggled', { name, enabled });
    } else {
      console.warn(`모듈을 찾을 수 없습니다: ${name}`);
    }
  }

  /**
   * 플러그인 활성화/비활성화
   */
  togglePlugin(name: string, enabled: boolean): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.setEnabled(enabled);
      this.eventBus.emit('plugin:toggled', { name, enabled });
    } else {
      console.warn(`플러그인을 찾을 수 없습니다: ${name}`);
    }
  }

  /**
   * 동적 기능 추가
   */
  addFeature(feature: AdminFeature): void {
    this.eventBus.emit('feature:added', feature);
  }

  /**
   * 설정 업데이트
   */
  updateConfig(updates: Partial<AdminConfiguration>): void {
    this.config = { ...this.config, ...updates };
    this.eventBus.emit('config:updated', this.config);
  }

  /**
   * 시스템 상태 조회
   */
  getSystemStatus(): SystemStatus {
    return {
      modules: Array.from(this.modules.values()).map(m => ({
        name: m.name,
        enabled: m.isEnabled(),
        status: m.getStatus()
      })),
      plugins: Array.from(this.plugins.values()).map(p => ({
        name: p.name,
        enabled: p.isEnabled(),
        status: p.getStatus()
      })),
      config: this.config,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * 모듈 조회
   */
  getModule(name: string): AdminModule | undefined {
    return this.modules.get(name);
  }

  /**
   * 플러그인 조회
   */
  getPlugin(name: string): AdminPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * 모든 모듈 조회
   */
  getAllModules(): AdminModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * 모든 플러그인 조회
   */
  getAllPlugins(): AdminPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 활성화된 모듈들 조회
   */
  getEnabledModules(): AdminModule[] {
    return Array.from(this.modules.values()).filter(m => m.isEnabled());
  }

  /**
   * 활성화된 플러그인들 조회
   */
  getEnabledPlugins(): AdminPlugin[] {
    return Array.from(this.plugins.values()).filter(p => p.isEnabled());
  }

  /**
   * 시스템 종료
   */
  async shutdown(): Promise<void> {
    console.log('AdminCore 종료 시작...');
    
    // 모든 플러그인 종료
    for (const plugin of this.plugins.values()) {
      try {
        await plugin.destroy();
      } catch (error) {
        console.error(`플러그인 종료 실패: ${plugin.name}`, error);
      }
    }
    
    // 모든 모듈 종료
    for (const module of this.modules.values()) {
      try {
        await module.destroy();
      } catch (error) {
        console.error(`모듈 종료 실패: ${module.name}`, error);
      }
    }
    
    console.log('AdminCore 종료 완료');
  }
}

/**
 * 이벤트 버스 클래스
 */
class AdminEventBus {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`이벤트 리스너 실행 실패: ${event}`, error);
        }
      });
    }
  }

  off(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }
}

// 임시 모듈/플러그인 클래스들 (실제 구현 시 별도 파일로 분리)
class BenchmarkModule implements AdminModule {
  readonly name = 'benchmark';
  readonly version = '1.0.0';
  readonly description = 'AI 벤치마크 시스템';
  readonly dependencies: string[] = ['ai'];
  readonly features: AdminFeature[] = [
    { name: 'runBenchmark', description: '벤치마크 실행' },
    { name: 'createTournament', description: '토너먼트 생성' },
    { name: 'analyzeResults', description: '결과 분석' }
  ];

  private enabled = false;

  async initialize(): Promise<void> {
    console.log('BenchmarkModule 초기화');
  }

  async destroy(): Promise<void> {
    console.log('BenchmarkModule 종료');
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getStatus(): any {
    return { status: 'running', health: 'good' };
  }

  getConfig(): any {
    return { timeLimit: 30000, rounds: 10 };
  }

  updateConfig(config: any): void {
    // 설정 업데이트 로직
  }

  getUI(): any {
    return null; // 실제 구현 시 React 컴포넌트 반환
  }

  getAPI(): any {
    return {}; // 실제 구현 시 API 객체 반환
  }
}

class AIModule implements AdminModule {
  readonly name = 'ai';
  readonly version = '1.0.0';
  readonly description = 'AI 엔진 관리 시스템';
  readonly dependencies: string[] = [];
  readonly features: AdminFeature[] = [
    { name: 'registerEngine', description: '엔진 등록' },
    { name: 'manageEngine', description: '엔진 관리' },
    { name: 'analyzeEngine', description: '엔진 분석' }
  ];

  private enabled = false;

  async initialize(): Promise<void> {
    console.log('AIModule 초기화');
  }

  async destroy(): Promise<void> {
    console.log('AIModule 종료');
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getStatus(): any {
    return { status: 'running', health: 'good' };
  }

  getConfig(): any {
    return { autoRegister: true, maxEngines: 100 };
  }

  updateConfig(config: any): void {
    // 설정 업데이트 로직
  }

  getUI(): any {
    return null; // 실제 구현 시 React 컴포넌트 반환
  }

  getAPI(): any {
    return {}; // 실제 구현 시 API 객체 반환
  }
}

class AnalyticsModule implements AdminModule {
  readonly name = 'analytics';
  readonly version = '1.0.0';
  readonly description = '분석 시스템';
  readonly dependencies: string[] = ['benchmark'];
  readonly features: AdminFeature[] = [
    { name: 'analyzePerformance', description: '성능 분석' },
    { name: 'generateReport', description: '리포트 생성' },
    { name: 'trackTrends', description: '트렌드 추적' }
  ];

  private enabled = false;

  async initialize(): Promise<void> {
    console.log('AnalyticsModule 초기화');
  }

  async destroy(): Promise<void> {
    console.log('AnalyticsModule 종료');
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getStatus(): any {
    return { status: 'running', health: 'good' };
  }

  getConfig(): any {
    return { enableRealTime: true, reportFormat: 'detailed' };
  }

  updateConfig(config: any): void {
    // 설정 업데이트 로직
  }

  getUI(): any {
    return null; // 실제 구현 시 React 컴포넌트 반환
  }

  getAPI(): any {
    return {}; // 실제 구현 시 API 객체 반환
  }
}

class PerformanceAnalysisPlugin implements AdminPlugin {
  readonly name = 'performance-analysis';
  readonly version = '1.0.0';
  readonly description = '성능 분석 플러그인';
  readonly dependencies: string[] = ['benchmark'];
  readonly hooks: any[] = [];

  private enabled = false;

  async initialize(): Promise<void> {
    console.log('PerformanceAnalysisPlugin 초기화');
  }

  async destroy(): Promise<void> {
    console.log('PerformanceAnalysisPlugin 종료');
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getStatus(): any {
    return { status: 'running', health: 'good' };
  }

  getConfig(): any {
    return { enableRealTimeAnalysis: true };
  }

  updateConfig(config: any): void {
    // 설정 업데이트 로직
  }

  getUI(): any {
    return null; // 실제 구현 시 React 컴포넌트 반환
  }

  getAPI(): any {
    return {}; // 실제 구현 시 API 객체 반환
  }
}

class MonitoringPlugin implements AdminPlugin {
  readonly name = 'monitoring';
  readonly version = '1.0.0';
  readonly description = '모니터링 플러그인';
  readonly dependencies: string[] = [];
  readonly hooks: any[] = [];

  private enabled = false;

  async initialize(): Promise<void> {
    console.log('MonitoringPlugin 초기화');
  }

  async destroy(): Promise<void> {
    console.log('MonitoringPlugin 종료');
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getStatus(): any {
    return { status: 'running', health: 'good' };
  }

  getConfig(): any {
    return { enableAlerts: true, alertThreshold: 0.8 };
  }

  updateConfig(config: any): void {
    // 설정 업데이트 로직
  }

  getUI(): any {
    return null; // 실제 구현 시 React 컴포넌트 반환
  }

  getAPI(): any {
    return {}; // 실제 구현 시 API 객체 반환
  }
}
