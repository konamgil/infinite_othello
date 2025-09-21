import React, { Component, ReactNode } from 'react';
import {
  AlertTriangle, RefreshCw, Home, Bug, MessageCircle,
  ArrowLeft, FileX, Zap
} from 'lucide-react';

/**
 * @interface Props
 * `ReplayErrorBoundary` 컴포넌트의 props를 정의합니다.
 */
interface Props {
  /** @property {ReactNode} children - 오류 경계가 감싸는 자식 컴포넌트들. */
  children: ReactNode;
  /** @property {ReactNode} [fallback] - 오류 발생 시 렌더링할 커스텀 UI. 제공되지 않으면 기본 UI가 사용됩니다. */
  fallback?: ReactNode;
  /** @property {(error: Error, errorInfo: React.ErrorInfo) => void} [onError] - 오류 발생 시 호출될 콜백. */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** @property {() => void} [onRetry] - 사용자가 '다시 시도'를 클릭했을 때 호출될 콜백. */
  onRetry?: () => void;
  /** @property {boolean} [enableReporting] - 오류 자동 리포팅 기능 활성화 여부. */
  enableReporting?: boolean;
}

/**
 * @interface State
 * `ReplayErrorBoundary` 컴포넌트의 내부 상태를 정의합니다.
 */
interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

/**
 * 리플레이 시스템을 위한 React 오류 경계(Error Boundary) 클래스 컴포넌트입니다.
 * 자식 컴포넌트 트리에서 발생하는 자바스크립트 오류를 포착하여,
 * UI가 깨지는 대신 사용자 친화적인 대체 UI를 보여줍니다.
 * 재시도, 오류 리포팅 등 다양한 기능을 포함합니다.
 */
export class ReplayErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  /**
   * 하위 컴포넌트에서 오류가 발생했을 때 호출되는 정적 생명주기 메서드입니다.
   * 오류 상태를 업데이트하여 다음 렌더링에서 대체 UI가 표시되도록 합니다.
   * @param {Error} error - 발생한 오류.
   * @returns {Partial<State>} 업데이트할 상태 객체.
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `replay_error_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    return { hasError: true, errorId };
  }

  /**
   * 하위 컴포넌트에서 오류가 발생했을 때 호출되는 생명주기 메서드입니다.
   * 오류 로깅 및 리포팅을 수행합니다.
   * @param {Error} error - 발생한 오류.
   * @param {React.ErrorInfo} errorInfo - 오류에 대한 추가 정보 (컴포넌트 스택 등).
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ReplayErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });

    this.props.onError?.(error, errorInfo);

    if (this.props.enableReporting) {
      this.reportError(error, errorInfo);
    }
  }

  /**
   * 포착된 오류를 외부 로깅 서비스로 전송하는 메서드입니다. (현재는 시뮬레이션)
   * @param {Error} error - 발생한 오류.
   * @param {React.ErrorInfo} errorInfo - 오류 정보.
   */
  private reportError = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      const errorReport = {
        error: { message: error.message, stack: error.stack, name: error.name },
        errorInfo,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userId: 'user_id_here', // 실제 앱에서는 인증 컨텍스트에서 가져와야 함
        sessionId: this.state.errorId
      };
      console.log('Error report (would be sent to logging service):', errorReport);
      // await fetch('/api/errors', { method: 'POST', ... });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  /** '다시 시도' 버튼 클릭을 처리합니다. 상태를 초기화하고 `onRetry` 콜백을 호출합니다. */
  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: prevState.retryCount + 1
      }));
      this.props.onRetry?.();
    }
  };

  /** '홈으로' 버튼 클릭을 처리합니다. */
  private handleGoHome = () => {
    window.location.href = '/';
  };

  /** '버그 신고' 버튼 클릭을 처리합니다. 사용자 이메일 클라이언트를 엽니다. */
  private handleReportBug = () => {
    const subject = encodeURIComponent(`리플레이 시스템 오류 신고 (${this.state.errorId})`);
    const body = encodeURIComponent(`\n오류 ID: ${this.state.errorId}\n발생 시간: ${new Date().toLocaleString('ko-KR')}\n브라우저: ${navigator.userAgent}\nURL: ${window.location.href}\n\n오류 메시지:\n${this.state.error?.message || 'Unknown error'}\n\n재현 단계:\n1.\n2.\n3.\n\n추가 정보:\n    `);
    window.open(`mailto:support@infinity-othello.com?subject=${subject}&body=${body}`);
  };

  /** 오류 메시지를 분석하여 오류 카테고리, 아이콘, 색상 등을 결정합니다. */
  private getErrorCategory = (error: Error | null): { category: string; icon: React.ComponentType<any>; color: string; bgColor: string; } => {
    if (!error) return { category: '알 수 없는 오류', icon: AlertTriangle, color: 'text-gray-400', bgColor: 'bg-gray-400/10' };
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) return { category: '네트워크 오류', icon: Zap, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' };
    if (message.includes('parse') || message.includes('json')) return { category: '데이터 파싱 오류', icon: FileX, color: 'text-blue-400', bgColor: 'bg-blue-400/10' };
    if (message.includes('render') || message.includes('component')) return { category: '렌더링 오류', icon: Bug, color: 'text-purple-400', bgColor: 'bg-purple-400/10' };
    return { category: '시스템 오류', icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-400/10' };
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공되면 그것을 렌더링합니다.
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 대체 UI를 렌더링합니다.
      const errorCategory = this.getErrorCategory(this.state.error);
      const Icon = errorCategory.icon;
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            {/* 오류 정보 카드 */}
            <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8">
              {/* 헤더 */}
              <div className="text-center mb-6">
                <div className={`w-20 h-20 ${errorCategory.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Icon size={32} className={errorCategory.color} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-display">앗! 문제가 발생했습니다</h1>
                <p className="text-white/60 font-display">리플레이 시스템에서 예상치 못한 오류가 발생했습니다</p>
              </div>

              {/* 오류 상세 정보 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 ${errorCategory.color.replace('text-', 'bg-')} rounded-full`} />
                  <span className="text-sm font-semibold text-white/90 font-display">{errorCategory.category}</span>
                  {this.state.errorId && (<span className="text-xs text-white/50 font-mono ml-auto">ID: {this.state.errorId.slice(-8)}</span>)}
                </div>
                {this.state.error && (
                  <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                    <p className="text-sm text-white/80 font-mono">{this.state.error.message}</p>
                    {process.env.NODE_ENV === 'development' && this.state.error.stack && (
                      <details className="mt-3">
                        <summary className="text-xs text-white/50 cursor-pointer hover:text-white/70 transition-colors">기술적 세부사항 (개발 모드)</summary>
                        <pre className="text-xs text-white/40 mt-2 overflow-x-auto whitespace-pre-wrap">{this.state.error.stack}</pre>
                      </details>
                    )}
                  </div>
                )}
              </div>

              {/* 재시도 정보 */}
              {this.state.retryCount > 0 && (
                <div className="mb-6 p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
                  <p className="text-sm text-yellow-200 font-display">재시도 {this.state.retryCount}/{this.maxRetries}회 시도됨</p>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {canRetry && (
                  <button onClick={this.handleRetry} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all font-display">
                    <RefreshCw size={18} />
                    다시 시도 ({this.maxRetries - this.state.retryCount}회 남음)
                  </button>
                )}
                <button onClick={() => window.history.back()} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white/90 font-semibold rounded-lg border border-white/20 transition-all font-display">
                  <ArrowLeft size={18} />
                  이전 페이지
                </button>
                <button onClick={this.handleGoHome} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white/90 font-semibold rounded-lg border border-white/20 transition-all font-display">
                  <Home size={18} />
                  홈으로
                </button>
              </div>

              {/* 추가 액션 */}
              <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-white/50 font-display text-center sm:text-left">문제가 지속되면 브라우저를 새로고침하거나 캐시를 지워보세요</div>
                {this.props.enableReporting && (
                  <button onClick={this.handleReportBug} className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white/80 transition-colors font-display">
                    <MessageCircle size={14} />
                    버그 신고
                  </button>
                )}
              </div>
            </div>

            {/* 도움말 텍스트 */}
            <div className="mt-6 text-center">
              <p className="text-sm text-white/40 font-display">이 오류는 자동으로 기록되며, 개발팀이 빠른 시일 내에 해결하겠습니다</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 함수형 컴포넌트를 `ReplayErrorBoundary`로 감싸는 고차 컴포넌트(HOC)입니다.
 * @param {React.ComponentType<P>} WrappedComponent - 감쌀 컴포넌트.
 * @param {Omit<Props, 'children'>} [errorBoundaryProps] - `ReplayErrorBoundary`에 전달할 props.
 * @returns {React.FC<P>} 오류 경계로 감싸진 새로운 컴포넌트.
 */
export function withReplayErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithReplayErrorBoundary(props: P) {
    return (
      <ReplayErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ReplayErrorBoundary>
    );
  };
}

/**
 * 이벤트 핸들러나 비동기 코드 내에서 명령적으로 오류를 발생시켜
 * 가장 가까운 오류 경계에서 포착할 수 있도록 하는 커스텀 훅입니다.
 * @returns {(error: Error | string) => void} 오류를 발생시키는 함수.
 */
export function useThrowReplayError() {
  return (error: Error | string) => {
    throw typeof error === 'string' ? new Error(error) : error;
  };
}

/** 오류 발생 시 표시할 간단한 대체 UI 컴포넌트입니다. */
export const SimpleErrorFallback: React.FC<{ error?: Error; retry?: () => void }> = ({
  error,
  retry
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <AlertTriangle size={48} className="text-red-400 mb-4" />
    <h3 className="text-lg font-semibold text-white mb-2 font-display">리플레이를 불러올 수 없습니다</h3>
    <p className="text-white/60 text-sm mb-4 font-display">{error?.message || '알 수 없는 오류가 발생했습니다'}</p>
    {retry && (
      <button onClick={retry} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-display">
        다시 시도
      </button>
    )}
  </div>
);

/** 오류 발생 시 표시할 더 작은 크기의 대체 UI 컴포넌트입니다. */
export const CompactErrorFallback: React.FC<{ error?: Error; retry?: () => void }> = ({
  error,
  retry
}) => (
  <div className="flex items-center justify-between p-4 bg-red-400/10 border border-red-400/20 rounded-lg">
    <div className="flex items-center gap-3">
      <AlertTriangle size={20} className="text-red-400" />
      <div>
        <p className="text-sm font-semibold text-white font-display">오류 발생</p>
        <p className="text-xs text-white/60 font-display">{error?.message || '리플레이 데이터를 처리할 수 없습니다'}</p>
      </div>
    </div>
    {retry && (
      <button onClick={retry} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="다시 시도">
        <RefreshCw size={16} className="text-white/70" />
      </button>
    )}
  </div>
);