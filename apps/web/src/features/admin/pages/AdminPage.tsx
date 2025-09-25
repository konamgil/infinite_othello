// AdminPage - 관리자 메인 페이지
// /admin 경로로 접속하는 관리자 전용 페이지

import React, { useState, useEffect } from 'react';
import { AdminCore } from '../core/AdminCore';
import { AdminConfiguration, SystemStatus } from '../types';

export const AdminPage: React.FC = () => {
  const [adminCore, setAdminCore] = useState<AdminCore | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'benchmark' | 'ai' | 'analytics' | 'monitoring'>('dashboard');

  useEffect(() => {
    initializeAdmin();
  }, []);

  /**
   * 관리자 시스템 초기화
   */
  const initializeAdmin = async () => {
    try {
      setLoading(true);
      
      // 관리자 설정 로드
      const config = await loadAdminConfig();
      
      // AdminCore 초기화
      const core = new AdminCore(config);
      await core.initialize();
      
      setAdminCore(core);
      
      // 시스템 상태 조회
      const status = core.getSystemStatus();
      setSystemStatus(status);
      
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '관리자 시스템 초기화 실패');
      setLoading(false);
    }
  };

  /**
   * 관리자 설정 로드
   */
  const loadAdminConfig = async (): Promise<AdminConfiguration> => {
    // 실제 구현 시 설정 파일이나 데이터베이스에서 로드
    return {
      secretKey: 'admin-secret-key',
      maxEngines: 100,
      enableAutoRegistration: true,
      enableRealTimeMonitoring: true,
      enableAnalytics: true,
      enableAlerts: true,
      alertThreshold: 0.8,
      reportFormat: 'detailed',
      timezone: 'Asia/Seoul',
      language: 'ko'
    };
  };

  /**
   * 모듈 활성화/비활성화
   */
  const toggleModule = (moduleName: string, enabled: boolean) => {
    if (adminCore) {
      adminCore.toggleModule(moduleName, enabled);
      const status = adminCore.getSystemStatus();
      setSystemStatus(status);
    }
  };

  /**
   * 플러그인 활성화/비활성화
   */
  const togglePlugin = (pluginName: string, enabled: boolean) => {
    if (adminCore) {
      adminCore.togglePlugin(pluginName, enabled);
      const status = adminCore.getSystemStatus();
      setSystemStatus(status);
    }
  };

  /**
   * 설정 업데이트
   */
  const updateConfig = (updates: Partial<AdminConfiguration>) => {
    if (adminCore) {
      adminCore.updateConfig(updates);
      const status = adminCore.getSystemStatus();
      setSystemStatus(status);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>관리자 시스템 초기화 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h1>관리자 시스템 오류</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          다시 시도
        </button>
      </div>
    );
  }

  if (!adminCore || !systemStatus) {
    return (
      <div className="admin-error">
        <h1>관리자 시스템을 초기화할 수 없습니다.</h1>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* 헤더 */}
      <header className="admin-header">
        <h1>AI 관리자 시스템</h1>
        <div className="admin-status">
          <span className={`status-indicator ${systemStatus.health}`}>
            {systemStatus.health === 'good' ? '정상' : 
             systemStatus.health === 'warning' ? '주의' : '위험'}
          </span>
          <span className="uptime">
            가동시간: {Math.floor(systemStatus.uptime / 1000 / 60)}분
          </span>
        </div>
      </header>

      {/* 네비게이션 */}
      <nav className="admin-nav">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          대시보드
        </button>
        <button 
          className={activeTab === 'benchmark' ? 'active' : ''}
          onClick={() => setActiveTab('benchmark')}
        >
          벤치마크
        </button>
        <button 
          className={activeTab === 'ai' ? 'active' : ''}
          onClick={() => setActiveTab('ai')}
        >
          AI 엔진
        </button>
        <button 
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          분석
        </button>
        <button 
          className={activeTab === 'monitoring' ? 'active' : ''}
          onClick={() => setActiveTab('monitoring')}
        >
          모니터링
        </button>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="admin-main">
        {activeTab === 'dashboard' && (
          <DashboardTab 
            systemStatus={systemStatus}
            onToggleModule={toggleModule}
            onTogglePlugin={togglePlugin}
            onUpdateConfig={updateConfig}
          />
        )}
        
        {activeTab === 'benchmark' && (
          <BenchmarkTab 
            adminCore={adminCore}
            systemStatus={systemStatus}
          />
        )}
        
        {activeTab === 'ai' && (
          <AITab 
            adminCore={adminCore}
            systemStatus={systemStatus}
          />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsTab 
            adminCore={adminCore}
            systemStatus={systemStatus}
          />
        )}
        
        {activeTab === 'monitoring' && (
          <MonitoringTab 
            adminCore={adminCore}
            systemStatus={systemStatus}
          />
        )}
      </main>

      {/* 푸터 */}
      <footer className="admin-footer">
        <p>AI 관리자 시스템 v1.0.0 | 접속: /admin</p>
      </footer>
    </div>
  );
};

// 대시보드 탭 컴포넌트
const DashboardTab: React.FC<{
  systemStatus: SystemStatus;
  onToggleModule: (name: string, enabled: boolean) => void;
  onTogglePlugin: (name: string, enabled: boolean) => void;
  onUpdateConfig: (config: Partial<AdminConfiguration>) => void;
}> = ({ systemStatus, onToggleModule, onTogglePlugin, onUpdateConfig }) => {
  return (
    <div className="dashboard-tab">
      <h2>시스템 대시보드</h2>
      
      {/* 시스템 상태 */}
      <div className="system-status">
        <h3>시스템 상태</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="label">모듈 수:</span>
            <span className="value">{systemStatus.modules.length}</span>
          </div>
          <div className="status-item">
            <span className="label">플러그인 수:</span>
            <span className="value">{systemStatus.plugins.length}</span>
          </div>
          <div className="status-item">
            <span className="label">가동시간:</span>
            <span className="value">{Math.floor(systemStatus.uptime / 1000 / 60)}분</span>
          </div>
          <div className="status-item">
            <span className="label">상태:</span>
            <span className={`value status-${systemStatus.health}`}>
              {systemStatus.health === 'good' ? '정상' : 
               systemStatus.health === 'warning' ? '주의' : '위험'}
            </span>
          </div>
        </div>
      </div>

      {/* 모듈 상태 */}
      <div className="modules-status">
        <h3>모듈 상태</h3>
        <div className="module-list">
          {systemStatus.modules.map(module => (
            <div key={module.name} className="module-item">
              <span className="module-name">{module.name}</span>
              <span className={`module-status ${module.enabled ? 'enabled' : 'disabled'}`}>
                {module.enabled ? '활성화' : '비활성화'}
              </span>
              <button 
                onClick={() => onToggleModule(module.name, !module.enabled)}
                className="toggle-button"
              >
                {module.enabled ? '비활성화' : '활성화'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 플러그인 상태 */}
      <div className="plugins-status">
        <h3>플러그인 상태</h3>
        <div className="plugin-list">
          {systemStatus.plugins.map(plugin => (
            <div key={plugin.name} className="plugin-item">
              <span className="plugin-name">{plugin.name}</span>
              <span className={`plugin-status ${plugin.enabled ? 'enabled' : 'disabled'}`}>
                {plugin.enabled ? '활성화' : '비활성화'}
              </span>
              <button 
                onClick={() => onTogglePlugin(plugin.name, !plugin.enabled)}
                className="toggle-button"
              >
                {plugin.enabled ? '비활성화' : '활성화'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 벤치마크 탭 컴포넌트
const BenchmarkTab: React.FC<{
  adminCore: AdminCore;
  systemStatus: SystemStatus;
}> = ({ adminCore, systemStatus }) => {
  const [benchmarkConfig, setBenchmarkConfig] = useState({
    rounds: 10,
    timeLimit: 30000,
    enableLearning: true
  });

  const runBenchmark = async () => {
    const benchmarkModule = adminCore.getModule('benchmark');
    if (benchmarkModule) {
      const api = benchmarkModule.getAPI();
      try {
        const result = await api.runBenchmark([], benchmarkConfig);
        console.log('벤치마크 결과:', result);
      } catch (error) {
        console.error('벤치마크 실행 실패:', error);
      }
    }
  };

  return (
    <div className="benchmark-tab">
      <h2>벤치마크 관리</h2>
      
      <div className="benchmark-config">
        <h3>벤치마크 설정</h3>
        <div className="config-form">
          <div className="form-group">
            <label>라운드 수:</label>
            <input 
              type="number" 
              value={benchmarkConfig.rounds}
              onChange={(e) => setBenchmarkConfig({
                ...benchmarkConfig,
                rounds: parseInt(e.target.value)
              })}
            />
          </div>
          <div className="form-group">
            <label>시간 제한 (ms):</label>
            <input 
              type="number" 
              value={benchmarkConfig.timeLimit}
              onChange={(e) => setBenchmarkConfig({
                ...benchmarkConfig,
                timeLimit: parseInt(e.target.value)
              })}
            />
          </div>
          <div className="form-group">
            <label>
              <input 
                type="checkbox" 
                checked={benchmarkConfig.enableLearning}
                onChange={(e) => setBenchmarkConfig({
                  ...benchmarkConfig,
                  enableLearning: e.target.checked
                })}
              />
              학습 활성화
            </label>
          </div>
        </div>
        <button onClick={runBenchmark} className="run-button">
          벤치마크 실행
        </button>
      </div>
    </div>
  );
};

// AI 탭 컴포넌트
const AITab: React.FC<{
  adminCore: AdminCore;
  systemStatus: SystemStatus;
}> = ({ adminCore, systemStatus }) => {
  const [engines, setEngines] = useState<any[]>([]);

  useEffect(() => {
    const aiModule = adminCore.getModule('ai');
    if (aiModule) {
      const api = aiModule.getAPI();
      const allEngines = api.getAllEngines();
      setEngines(allEngines);
    }
  }, [adminCore]);

  return (
    <div className="ai-tab">
      <h2>AI 엔진 관리</h2>
      
      <div className="engine-list">
        <h3>등록된 AI 엔진들</h3>
        <div className="engine-grid">
          {engines.map(engine => (
            <div key={engine.name} className="engine-card">
              <h4>{engine.name}</h4>
              <p>버전: {engine.version}</p>
              <p>작성자: {engine.author}</p>
              <p>카테고리: {engine.category?.level}</p>
              <div className="engine-actions">
                <button>테스트</button>
                <button>분석</button>
                <button>설정</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 분석 탭 컴포넌트
const AnalyticsTab: React.FC<{
  adminCore: AdminCore;
  systemStatus: SystemStatus;
}> = ({ adminCore, systemStatus }) => {
  return (
    <div className="analytics-tab">
      <h2>분석 도구</h2>
      <p>분석 기능이 구현될 예정입니다.</p>
    </div>
  );
};

// 모니터링 탭 컴포넌트
const MonitoringTab: React.FC<{
  adminCore: AdminCore;
  systemStatus: SystemStatus;
}> = ({ adminCore, systemStatus }) => {
  return (
    <div className="monitoring-tab">
      <h2>시스템 모니터링</h2>
      <p>모니터링 기능이 구현될 예정입니다.</p>
    </div>
  );
};

export default AdminPage;