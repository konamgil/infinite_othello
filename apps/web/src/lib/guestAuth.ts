import { supabase } from './supabase';
import type { Profile } from '../types/supabase';

/**
 * A utility class for managing guest user accounts.
 *
 * This class provides a set of static methods to handle the entire lifecycle of a guest account,
 * from creation and local storage to expiration and cleanup. It interacts with both the
 * browser's localStorage and the Supabase backend.
 */
export class GuestAuthManager {
  private static readonly GUEST_STORAGE_KEY = 'infinity-othello-guest';
  private static readonly GUEST_CODE_PREFIX = 'G';
  private static readonly GUEST_EXPIRY_DAYS = 30;

  /**
   * Generates a unique, human-readable code for a guest account.
   * @returns {string} A unique guest code.
   */
  static generateGuestCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const hash = Math.random().toString(36).substring(2, 4);

    return `${this.GUEST_CODE_PREFIX}${timestamp}${random}${hash}`.toUpperCase().slice(0, 12);
  }

  /**
   * Creates a new guest account profile.
   *
   * The profile is first saved to the Supabase backend. If that fails, it falls back
   * to saving the profile only in the browser's localStorage.
   *
   * @returns {Promise<Profile>} A promise that resolves with the newly created guest profile.
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
   * Saves the guest profile to the browser's localStorage.
   * @param {Profile} profile - The guest profile to save.
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
   * Retrieves the guest profile from localStorage.
   * It also checks if the stored guest profile has expired.
   *
   * @returns {Profile | null} The guest profile, or null if not found or expired.
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
   * Removes the guest profile from localStorage.
   */
  static clearGuestFromLocal() {
    try {
      localStorage.removeItem(this.GUEST_STORAGE_KEY);
    } catch (error) {
      console.error('로컬 게스트 정리 실패:', error);
    }
  }

  /**
   * Finds a guest account in the database using a guest code.
   * @param {string} guestCode - The guest code to search for.
   * @returns {Promise<Profile | null>} The guest profile, or null if not found or expired.
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
   * Checks if a guest profile has expired.
   * @param {Profile} profile - The guest profile to check.
   * @returns {boolean} True if the profile is expired, false otherwise.
   */
  static isGuestExpired(profile: Profile): boolean {
    if (!profile.expires_at) return false;
    return new Date(profile.expires_at) < new Date();
  }

  /**
   * Renews a guest account's expiration date upon activity.
   * @param {string} guestId - The ID of the guest account to renew.
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
   * Updates a guest's game statistics after a match.
   * @param {string} guestId - The ID of the guest account.
   * @param {'win' | 'loss' | 'draw'} result - The result of the game.
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
   * Returns an object describing the limitations of a guest account.
   * @returns An object detailing what a guest user can and cannot do.
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
   * Determines whether to prompt a guest user to link their account based on their activity.
   * @param {Profile} profile - The guest's profile.
   * @param {string} context - The context in which the check is being made (e.g., 'ranked_attempt').
   * @returns {boolean} True if the user should be prompted to link their account.
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
   * Exports a guest's data, including their profile and recent games.
   * This can be used for backup purposes before linking to a permanent account.
   * @param {string} guestId - The ID of the guest account to export.
   * @returns {Promise<object | null>} An object containing the guest's data, or null on failure.
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
   * A maintenance function to delete expired guest accounts from the database.
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
 * Represents the authentication state for a guest user.
 */
export interface GuestAuthState {
  /** The guest user's profile data, or null if not logged in. */
  profile: Profile | null;
  /** True if the current user is a guest. */
  isGuest: boolean;
  /** True if the guest account has expired. */
  isExpired: boolean;
  /** True if the guest is eligible to link their account to a permanent one. */
  canLink: boolean;
  /** An object detailing the limitations of the guest account. */
  limitations: ReturnType<typeof GuestAuthManager.getGuestLimitations>;
}

/**
 * A utility object that exports key methods from the GuestAuthManager.
 * This is likely used to provide a clean interface for a custom hook (e.g., `useGuestAuth`).
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