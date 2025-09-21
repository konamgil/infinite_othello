import { supabase } from './supabase';
import type { Profile } from '../types/supabase';

/**
 * 게스트 사용자 계정을 관리하기 위한 유틸리티 클래스입니다.
 *
 * 이 클래스는 생성, 로컬 저장, 만료, 정리에 이르기까지 게스트 계정의 전체 생명주기를
 * 처리하기 위한 정적 메서드 집합을 제공합니다. 브라우저의 localStorage와 Supabase 백엔드
 * 모두와 상호작용합니다.
 */
export class GuestAuthManager {
  private static readonly GUEST_STORAGE_KEY = 'infinity-othello-guest';
  private static readonly GUEST_CODE_PREFIX = 'G';
  private static readonly GUEST_EXPIRY_DAYS = 30;

  /**
   * 게스트 계정을 위한 고유하고 사람이 읽을 수 있는 코드를 생성합니다.
   * @returns {string} 고유한 게스트 코드.
   */
  static generateGuestCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const hash = Math.random().toString(36).substring(2, 4);

    return `${this.GUEST_CODE_PREFIX}${timestamp}${random}${hash}`.toUpperCase().slice(0, 12);
  }

  /**
   * 새로운 게스트 계정 프로필을 생성합니다.
   *
   * 프로필은 먼저 Supabase 백엔드에 저장됩니다. 실패할 경우, 브라우저의
   * localStorage에만 프로필을 저장하는 것으로 대체됩니다.
   *
   * @returns {Promise<Profile>} 새로 생성된 게스트 프로필로 귀결되는 프로미스.
   */
  static async createGuestAccount(): Promise<Profile> {
    const guestCode = this.generateGuestCode();
    const guestId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.GUEST_EXPIRY_DAYS);

    const guestProfile: Profile = {
      id: guestId,
      account_type: 'guest',
      guest_code: guestCode,
      email: null,
      username: null,
      display_name: `게스트_${guestCode.slice(-4)}`,
      avatar_url: null,
      rating: 1500,
      rank: 'Bronze',
      total_games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      expires_at: expiresAt.toISOString(),
      google_id: null,
      apple_id: null,
      facebook_id: null,
      linked_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      current_session_id: null,
      current_device_info: null,
      session_started_at: null,
    };

    try {
      // Supabase에 게스트 프로필 저장
      const { data, error } = await supabase
        .from('profiles')
        .insert(guestProfile)
        .select()
        .single();

      if (error) {
        console.error('게스트 계정 생성 실패:', error);
        throw error;
      }

      // 로컬 스토리지에 게스트 정보 저장
      this.saveGuestToLocal(data);

      return data;
    } catch (error) {
      // DB 저장 실패 시 로컬에만 저장
      console.warn('DB 저장 실패, 로컬 전용 게스트 생성:', error);
      this.saveGuestToLocal(guestProfile);
      return guestProfile;
    }
  }

  /**
   * 게스트 프로필을 브라우저의 localStorage에 저장합니다.
   * @param {Profile} profile - 저장할 게스트 프로필.
   */
  private static saveGuestToLocal(profile: Profile) {
    try {
      localStorage.setItem(this.GUEST_STORAGE_KEY, JSON.stringify({
        profile,
        createdAt: Date.now(),
      }));
    } catch (error) {
      console.error('로컬 스토리지 저장 실패:', error);
    }
  }

  /**
   * localStorage에서 게스트 프로필을 검색합니다.
   * 저장된 게스트 프로필이 만료되었는지도 확인합니다.
   *
   * @returns {Profile | null} 게스트 프로필. 찾을 수 없거나 만료된 경우 null.
   */
  static getGuestFromLocal(): Profile | null {
    try {
      const stored = localStorage.getItem(this.GUEST_STORAGE_KEY);
      if (!stored) return null;

      const { profile, createdAt } = JSON.parse(stored);

      // 만료 확인
      if (this.isGuestExpired(profile)) {
        this.clearGuestFromLocal();
        return null;
      }

      return profile;
    } catch (error) {
      console.error('로컬 게스트 불러오기 실패:', error);
      return null;
    }
  }

  /**
   * localStorage에서 게스트 프로필을 제거합니다.
   */
  static clearGuestFromLocal() {
    try {
      localStorage.removeItem(this.GUEST_STORAGE_KEY);
    } catch (error) {
      console.error('로컬 게스트 정리 실패:', error);
    }
  }

  /**
   * 게스트 코드를 사용하여 데이터베이스에서 게스트 계정을 찾습니다.
   * @param {string} guestCode - 검색할 게스트 코드.
   * @returns {Promise<Profile | null>} 게스트 프로필. 찾을 수 없거나 만료된 경우 null.
   */
  static async getGuestByCode(guestCode: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('guest_code', guestCode)
        .eq('account_type', 'guest')
        .single();

      if (error || !data) return null;

      return this.isGuestExpired(data) ? null : data;
    } catch (error) {
      console.error('게스트 코드 조회 실패:', error);
      return null;
    }
  }

  /**
   * 게스트 프로필이 만료되었는지 확인합니다.
   * @param {Profile} profile - 확인할 게스트 프로필.
   * @returns {boolean} 프로필이 만료되었으면 true, 그렇지 않으면 false.
   */
  static isGuestExpired(profile: Profile): boolean {
    if (!profile.expires_at) return false;
    return new Date(profile.expires_at) < new Date();
  }

  /**
   * 활동 시 게스트 계정의 만료 날짜를 갱신합니다.
   * @param {string} guestId - 갱신할 게스트 계정의 ID.
   */
  static async renewGuestAccount(guestId: string): Promise<void> {
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + this.GUEST_EXPIRY_DAYS);

    try {
      await supabase
        .from('profiles')
        .update({
          expires_at: newExpiryDate.toISOString(),
          last_seen: new Date().toISOString(),
        })
        .eq('id', guestId);
    } catch (error) {
      console.error('게스트 계정 갱신 실패:', error);
    }
  }

  /**
   * 경기 후 게스트의 게임 통계를 업데이트합니다.
   * @param {string} guestId - 게스트 계정의 ID.
   * @param {'win' | 'loss' | 'draw'} result - 게임 결과.
   */
  static async updateGuestStats(guestId: string, result: 'win' | 'loss' | 'draw'): Promise<void> {
    try {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('wins, losses, draws, total_games')
        .eq('id', guestId)
        .single();

      if (!currentProfile) return;

      const updates = {
        total_games: currentProfile.total_games + 1,
        wins: currentProfile.wins + (result === 'win' ? 1 : 0),
        losses: currentProfile.losses + (result === 'loss' ? 1 : 0),
        draws: currentProfile.draws + (result === 'draw' ? 1 : 0),
        last_seen: new Date().toISOString(),
      };

      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', guestId);

      // 로컬 스토리지도 업데이트
      const localGuest = this.getGuestFromLocal();
      if (localGuest && localGuest.id === guestId) {
        const updatedProfile = { ...localGuest, ...updates };
        this.saveGuestToLocal(updatedProfile);
      }
    } catch (error) {
      console.error('게스트 통계 업데이트 실패:', error);
    }
  }

  /**
   * 게스트 계정의 제한 사항을 설명하는 객체를 반환합니다.
   * @returns 게스트 사용자가 할 수 있는 것과 할 수 없는 것을 상세히 기술한 객체.
   */
  static getGuestLimitations() {
    return {
      canPlayRanked: false,
      canAddFriends: false,
      canJoinTournaments: false,
      canSaveGameHistory: false, // 제한된 기록만
      canEarnAchievements: false,
      canCustomizeAvatar: false,
      maxDailyGames: 10, // 일일 게임 제한
    };
  }

  /**
   * 게스트 사용자의 활동을 기반으로 계정 연동을 유도할지 여부를 결정합니다.
   * @param {Profile} profile - 게스트의 프로필.
   * @param {string} context - 확인이 이루어지는 맥락 (예: 'ranked_attempt').
   * @returns {boolean} 사용자에게 계정 연동을 유도해야 하면 true.
   */
  static shouldPromptLinking(profile: Profile, context: string): boolean {
    const triggers = {
      'ranked_attempt': () => true, // 랭크 게임 시도 시 항상 유도
      'friend_attempt': () => true, // 친구 추가 시도 시 항상 유도
      'game_count': () => profile.total_games >= 5, // 5게임 이상 시
      'achievement_unlock': () => true, // 업적 해제 시
      'high_rating': () => profile.rating > 1600, // 높은 레이팅 달성 시
      'expiry_warning': () => {
        if (!profile.expires_at) return false;
        const daysLeft = Math.ceil((new Date(profile.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 3; // 만료 3일 전
      },
    };

    const trigger = triggers[context as keyof typeof triggers];
    return trigger ? trigger() : false;
  }

  /**
   * 프로필과 최근 게임을 포함한 게스트의 데이터를 내보냅니다.
   * 영구 계정으로 연동하기 전 백업 목적으로 사용될 수 있습니다.
   * @param {string} guestId - 내보낼 게스트 계정의 ID.
   * @returns {Promise<object | null>} 게스트 데이터를 담은 객체, 또는 실패 시 null.
   */
  static async exportGuestData(guestId: string) {
    try {
      // 프로필 정보
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', guestId)
        .single();

      // 게임 기록
      const { data: games } = await supabase
        .from('games')
        .select('*')
        .or(`black_player_id.eq.${guestId},white_player_id.eq.${guestId}`)
        .order('created_at', { ascending: false })
        .limit(50); // 최근 50게임만

      return {
        profile,
        games: games || [],
        exportedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('게스트 데이터 내보내기 실패:', error);
      return null;
    }
  }

  /**
   * 데이터베이스에서 만료된 게스트 계정을 삭제하는 유지보수 함수입니다.
   */
  static async cleanupExpiredGuests(): Promise<void> {
    try {
      const now = new Date().toISOString();

      // 만료된 게스트 계정 삭제
      await supabase
        .from('profiles')
        .delete()
        .eq('account_type', 'guest')
        .lt('expires_at', now);

      console.log('만료된 게스트 계정 정리 완료');
    } catch (error) {
      console.error('게스트 계정 정리 실패:', error);
    }
  }
}

/**
 * @interface GuestAuthState
 * 게스트 사용자의 인증 상태를 나타냅니다.
 */
export interface GuestAuthState {
  /** @property {Profile | null} profile - 게스트 사용자의 프로필 데이터, 로그인하지 않은 경우 null. */
  profile: Profile | null;
  /** @property {boolean} isGuest - 현재 사용자가 게스트인 경우 true. */
  isGuest: boolean;
  /** @property {boolean} isExpired - 게스트 계정이 만료된 경우 true. */
  isExpired: boolean;
  /** @property {boolean} canLink - 게스트가 계정을 영구 계정으로 연동할 자격이 있는 경우 true. */
  canLink: boolean;
  /** @property {object} limitations - 게스트 계정의 제한 사항을 상세히 기술한 객체. */
  limitations: ReturnType<typeof GuestAuthManager.getGuestLimitations>;
}

/**
 * `GuestAuthManager`의 주요 메서드를 내보내는 유틸리티 객체입니다.
 * 커스텀 훅(예: `useGuestAuth`)에 깔끔한 인터페이스를 제공하기 위해 사용될 수 있습니다.
 */
export const guestAuthUtils = {
  createGuest: GuestAuthManager.createGuestAccount,
  getLocalGuest: GuestAuthManager.getGuestFromLocal,
  clearLocalGuest: GuestAuthManager.clearGuestFromLocal,
  isExpired: GuestAuthManager.isGuestExpired,
  shouldPromptLinking: GuestAuthManager.shouldPromptLinking,
  getLimitations: GuestAuthManager.getGuestLimitations,
  renewGuest: GuestAuthManager.renewGuestAccount,
  updateStats: GuestAuthManager.updateGuestStats,
  exportData: GuestAuthManager.exportGuestData,
};