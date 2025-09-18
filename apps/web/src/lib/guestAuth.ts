import { supabase } from './supabase';
import type { Profile } from '../types/supabase';

// 게스트 계정 유틸리티
export class GuestAuthManager {
  private static readonly GUEST_STORAGE_KEY = 'infinity-othello-guest';
  private static readonly GUEST_CODE_PREFIX = 'G';
  private static readonly GUEST_EXPIRY_DAYS = 30;

  // 유니크한 게스트 코드 생성
  static generateGuestCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const hash = Math.random().toString(36).substring(2, 4);

    return `${this.GUEST_CODE_PREFIX}${timestamp}${random}${hash}`.toUpperCase().slice(0, 12);
  }

  // 게스트 계정 생성
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

  // 로컬 스토리지에 게스트 정보 저장
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

  // 로컬에서 게스트 정보 불러오기
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

  // 로컬에서 게스트 정보 제거
  static clearGuestFromLocal() {
    try {
      localStorage.removeItem(this.GUEST_STORAGE_KEY);
    } catch (error) {
      console.error('로컬 게스트 정리 실패:', error);
    }
  }

  // 게스트 코드로 계정 조회
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

  // 게스트 계정 만료 확인
  static isGuestExpired(profile: Profile): boolean {
    if (!profile.expires_at) return false;
    return new Date(profile.expires_at) < new Date();
  }

  // 게스트 계정 갱신 (활동 시 만료일 연장)
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

  // 게스트 게임 기록 업데이트
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

  // 게스트 기능 제한 확인
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

  // 연동 유도 조건 확인
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

  // 게스트 데이터 내보내기 (연동 전 백업용)
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

  // 게스트 계정 정리 (만료된 계정들)
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

// 게스트 인증 상태 타입
export interface GuestAuthState {
  profile: Profile | null;
  isGuest: boolean;
  isExpired: boolean;
  canLink: boolean;
  limitations: ReturnType<typeof GuestAuthManager.getGuestLimitations>;
}

// 게스트 인증 훅용 유틸리티
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