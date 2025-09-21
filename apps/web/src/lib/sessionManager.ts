import { supabase } from './supabase';
import type { Profile } from '../types/supabase';

/**
 * 사용자 세션을 관리하고 동시 로그인을 방지하는 클래스입니다.
 *
 * 이 매니저는 새 세션 시작, 충돌 확인, 세션 유지를 위한 주기적인 "하트비트" 전송 등
 * 사용자 세션의 생명주기를 처리합니다. 또한 세션 하이재킹 처리 및 브라우저 종료 시
 * 정리 로직을 포함합니다.
 */
export class SessionManager {
  private static readonly SESSION_HEARTBEAT_INTERVAL = 30000; // 30초
  private static readonly SESSION_TIMEOUT = 120000; // 2분
  private static heartbeatTimer: NodeJS.Timeout | null = null;

  // 현재 세션 정보
  private static currentSession: {
    userId: string;
    sessionId: string;
    deviceInfo: string;
    startedAt: number;
  } | null = null;

  // 디바이스 정보 생성
  private static generateDeviceInfo(): string {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const screenSize = `${screen.width}x${screen.height}`;

    // 디바이스 고유 식별자 생성 (개인정보 없이)
    const deviceSignature = btoa(`${platform}-${language}-${screenSize}`).slice(0, 16);

    return `${this.getDeviceType()}-${deviceSignature}-${Date.now()}`;
  }

  // 디바이스 타입 감지
  private static getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/mobile|android|iphone|ipod|blackberry|iemobile/.test(userAgent)) {
      return 'mobile';
    } else if (/tablet|ipad/.test(userAgent)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * 새로운 사용자 세션을 시작합니다.
   *
   * 시작하기 전에 동일한 사용자에 대한 기존 활성 세션을 확인합니다.
   * 충돌이 발견되면 오류를 반환합니다. 그렇지 않으면 사용자의 프로필을
   * 새 세션 정보로 업데이트하고 세션을 유지하기 위한 하트비트를 시작합니다.
   *
   * @param {string} userId - 세션을 시작하는 사용자의 ID.
   * @returns {Promise<{ success: boolean; error?: string; conflictInfo?: any }>} 세션 시작 시도 결과.
   */
  static async startSession(userId: string): Promise<{ success: boolean; error?: string; conflictInfo?: any }> {
    try {
      const sessionId = crypto.randomUUID();
      const deviceInfo = this.generateDeviceInfo();
      const now = Date.now();

      // 기존 활성 세션 확인
      const conflictCheck = await this.checkSessionConflict(userId);
      if (!conflictCheck.success) {
        return {
          success: false,
          error: '다른 기기에서 이미 로그인되어 있습니다.',
          conflictInfo: conflictCheck.existingSession,
        };
      }

      // 새 세션 정보를 프로필에 저장
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          current_session_id: sessionId,
          current_device_info: deviceInfo,
          session_started_at: new Date(now).toISOString(),
          last_seen: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('세션 시작 실패:', updateError);
        return { success: false, error: '세션 시작 중 오류가 발생했습니다.' };
      }

      // 현재 세션 정보 저장
      this.currentSession = {
        userId,
        sessionId,
        deviceInfo,
        startedAt: now,
      };

      // 세션 하트비트 시작
      this.startHeartbeat();

      // 브라우저 종료 시 세션 정리
      this.setupSessionCleanup();

      return { success: true };
    } catch (error) {
      console.error('세션 시작 예외:', error);
      return { success: false, error: '세션 시작 중 예상치 못한 오류가 발생했습니다.' };
    }
  }

  // 세션 충돌 확인
  private static async checkSessionConflict(userId: string): Promise<{
    success: boolean;
    existingSession?: {
      deviceInfo: string;
      startedAt: string;
      lastSeen: string;
    };
  }> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_session_id, current_device_info, session_started_at, last_seen')
        .eq('id', userId)
        .single();

      if (!profile || !profile.current_session_id) {
        return { success: true }; // 기존 세션 없음
      }

      // 기존 세션이 타임아웃되었는지 확인
      const lastSeen = new Date(profile.last_seen || 0).getTime();
      const now = Date.now();

      if (now - lastSeen > this.SESSION_TIMEOUT) {
        // 타임아웃된 세션은 자동 정리
        await this.clearSession(userId);
        return { success: true };
      }

      // 활성 세션이 존재함
      return {
        success: false,
        existingSession: {
          deviceInfo: profile.current_device_info || 'Unknown Device',
          startedAt: profile.session_started_at || '',
          lastSeen: profile.last_seen || '',
        },
      };
    } catch (error) {
      console.error('세션 충돌 확인 실패:', error);
      return { success: true }; // 에러 시 허용
    }
  }

  /**
   * 데이터베이스에서 사용자의 기존 세션을 강제로 종료합니다.
   * 일반적으로 사용자가 새 기기에서 로그인하고 이전 기기의 세션을
   * 종료하기로 선택했을 때 호출됩니다.
   *
   * @param {string} userId - 세션을 종료할 사용자의 ID.
   * @returns {Promise<{ success: boolean; error?: string }>} 작업 결과.
   */
  static async forceEndSession(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.clearSession(userId);
      return { success: true };
    } catch (error) {
      console.error('강제 세션 종료 실패:', error);
      return { success: false, error: '세션 종료 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 현재 로컬 세션을 종료합니다.
   *
   * 이 메서드는 하트비트를 중지하고 데이터베이스에서 세션 정보를 지우며,
   * 로컬 세션 상태를 리셋합니다.
   */
  static async endSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // 하트비트 정지
      this.stopHeartbeat();

      // DB에서 세션 정보 제거
      await this.clearSession(this.currentSession.userId);

      // 현재 세션 정보 초기화
      this.currentSession = null;
    } catch (error) {
      console.error('세션 종료 실패:', error);
    }
  }

  // DB에서 세션 정보 정리
  private static async clearSession(userId: string): Promise<void> {
    await supabase
      .from('profiles')
      .update({
        current_session_id: null,
        current_device_info: null,
        session_started_at: null,
      })
      .eq('id', userId);
  }

  // 세션 하트비트 시작
  private static startHeartbeat(): void {
    this.stopHeartbeat(); // 기존 타이머 정리

    this.heartbeatTimer = setInterval(async () => {
      if (!this.currentSession) {
        this.stopHeartbeat();
        return;
      }

      try {
        // 세션 유지 신호 전송
        await supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', this.currentSession.userId);

        // 세션 충돌 재확인 (다른 기기에서 로그인했는지)
        const conflictCheck = await this.detectSessionHijack();
        if (!conflictCheck.isValid) {
          // 세션 탈취/충돌 감지 시 강제 로그아웃
          this.handleSessionConflict();
        }
      } catch (error) {
        console.error('하트비트 실패:', error);
      }
    }, this.SESSION_HEARTBEAT_INTERVAL);
  }

  // 하트비트 정지
  private static stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 세션 하이재킹 감지
  private static async detectSessionHijack(): Promise<{ isValid: boolean }> {
    if (!this.currentSession) return { isValid: false };

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_session_id, current_device_info')
        .eq('id', this.currentSession.userId)
        .single();

      if (!profile) return { isValid: false };

      // 세션 ID나 디바이스 정보가 변경되었는지 확인
      const sessionMatches = profile.current_session_id === this.currentSession.sessionId;
      const deviceMatches = profile.current_device_info === this.currentSession.deviceInfo;

      return { isValid: sessionMatches && deviceMatches };
    } catch (error) {
      console.error('세션 검증 실패:', error);
      return { isValid: false };
    }
  }

  // 세션 충돌 처리
  private static handleSessionConflict(): void {
    console.warn('세션 충돌 감지됨 - 강제 로그아웃 진행');

    // 현재 세션 정리
    this.endSession();

    // 전역 이벤트 발생 (AuthStore에서 처리)
    window.dispatchEvent(new CustomEvent('session-conflict', {
      detail: {
        reason: 'concurrent-login',
        message: '다른 기기에서 로그인되어 현재 세션이 종료되었습니다.'
      }
    }));
  }

  // 브라우저 종료 시 세션 정리 설정
  private static setupSessionCleanup(): void {
    // 페이지 언로드 시
    const cleanup = () => {
      if (this.currentSession) {
        // 동기적으로 세션 정리
        navigator.sendBeacon(
          '/api/end-session', // 별도 API 엔드포인트 필요 시
          JSON.stringify({ userId: this.currentSession.userId })
        );
        this.endSession();
      }
    };

    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('unload', cleanup);

    // 페이지 숨김 시 (모바일 대응)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.currentSession) {
        // 페이지가 숨겨지면 세션 일시 중단 표시
        supabase
          .from('profiles')
          .update({
            last_seen: new Date().toISOString(),
            // 세션은 유지하되 비활성 상태 표시
          })
          .eq('id', this.currentSession.userId);
      }
    });
  }

  /**
   * 현재 로컬 세션 정보를 가져옵니다.
   * @returns 활성 세션 객체, 또는 활성 세션이 없는 경우 null.
   */
  static getCurrentSession() {
    return this.currentSession;
  }

  /**
   * 데이터베이스에서 사용자의 활성 세션 정보를 검색합니다.
   * 관리자 목적 또는 사용자에게 세션 정보를 표시하는 데 사용될 수 있습니다.
   * @param {string} userId - 사용자의 ID.
   * @returns {Promise<object | null>} 사용자의 활성 세션 데이터.
   */
  static async getActiveSessions(userId: string) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('current_device_info, session_started_at, last_seen')
        .eq('id', userId)
        .single();

      return data;
    } catch (error) {
      console.error('활성 세션 조회 실패:', error);
      return null;
    }
  }

  /**
   * 마지막 활동 타임스탬프를 기준으로 세션이 타임아웃되었는지 확인합니다.
   * @param {string} lastSeen - 마지막 활동 시간의 ISO 문자열.
   * @returns {boolean} 세션이 타임아웃되었으면 true.
   */
  static isSessionTimedOut(lastSeen: string): boolean {
    const lastSeenTime = new Date(lastSeen).getTime();
    const now = Date.now();
    return now - lastSeenTime > this.SESSION_TIMEOUT;
  }
}

/**
 * @interface SessionConflictInfo
 * 충돌하는 세션에 대한 정보를 설명합니다.
 */
export interface SessionConflictInfo {
  /** @property {string} deviceInfo - 충돌하는 세션의 기기를 식별하는 문자열. */
  deviceInfo: string;
  /** @property {string} startedAt - 충돌하는 세션이 시작된 시간의 ISO 문자열 타임스탬프. */
  startedAt: string;
  /** @property {string} lastSeen - 충돌하는 세션이 마지막으로 활성화된 시간의 ISO 문자열 타임스탬프. */
  lastSeen: string;
}

/**
 * @type SessionEvent
 * 다양한 종류의 세션 관련 이벤트를 나타내는 유니언 타입입니다.
 */
export type SessionEvent =
  | { type: 'conflict'; data: SessionConflictInfo }
  | { type: 'timeout'; data: { reason: string } }
  | { type: 'ended'; data: { reason: string } };

/**
 * `SessionManager`의 주요 메서드를 내보내는 유틸리티 객체입니다.
 * 세션 상태와 상호작용해야 하는 애플리케이션의 다른 부분에
 * 깨끗하고 단순화된 인터페이스를 제공합니다.
 */
export const sessionUtils = {
  start: SessionManager.startSession,
  end: SessionManager.endSession,
  forceEnd: SessionManager.forceEndSession,
  getCurrent: SessionManager.getCurrentSession,
  getActive: SessionManager.getActiveSessions,
  isTimedOut: SessionManager.isSessionTimedOut,
};