import { supabase } from './supabase';
import { GuestAuthManager } from './guestAuth';
import type { Profile } from '../types/supabase';
import type { Provider } from '@supabase/supabase-js';

// OAuth 제공자 설정
export type SupportedProvider = 'google' | 'apple' | 'facebook';

export interface OAuthConfig {
  provider: SupportedProvider;
  scopes?: string;
  queryParams?: Record<string, string>;
  redirectTo?: string;
}

// OAuth 제공자별 설정
const OAUTH_CONFIGS: Record<SupportedProvider, OAuthConfig> = {
  google: {
    provider: 'google',
    scopes: 'openid profile email',
    redirectTo: `${window.location.origin}/auth/callback`,
  },
  apple: {
    provider: 'apple',
    scopes: 'name email',
    redirectTo: `${window.location.origin}/auth/callback`,
  },
  facebook: {
    provider: 'facebook',
    scopes: 'email,public_profile',
    redirectTo: `${window.location.origin}/auth/callback`,
  },
};

/**
 * OAuth 인증 흐름을 관리하기 위한 유틸리티 클래스입니다.
 *
 * 이 클래스는 다양한 OAuth 제공업체를 통한 로그인, 게스트 계정을 영구 OAuth 계정에 연결,
 * 그리고 OAuth 콜백 처리를 위한 정적 메서드를 제공합니다.
 */
export class OAuthManager {
  /**
   * 주어진 제공업체에 대한 OAuth 로그인 흐름을 시작합니다.
   * 게스트 프로필이 제공된 경우, 성공적인 로그인 후 계정 연결을 용이하게 하기 위해
   * OAuth 요청에 게스트 정보를 포함합니다.
   *
   * @param {SupportedProvider} provider - 로그인할 OAuth 제공업체.
   * @param {Profile | null} [guestProfile] - 현재 게스트의 프로필 (있는 경우).
   * @returns {Promise<{ success: boolean; error?: string }>} 로그인 시작 결과 객체.
   */
  static async signInWithProvider(
    provider: SupportedProvider,
    guestProfile?: Profile | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const config = OAUTH_CONFIGS[provider];

      // 게스트 데이터가 있으면 쿼리 파라미터에 포함
      const queryParams: Record<string, string> = {
        ...config.queryParams,
      };

      if (guestProfile?.guest_code) {
        queryParams.guest_code = guestProfile.guest_code;
        queryParams.guest_id = guestProfile.id;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as Provider,
        options: {
          redirectTo: config.redirectTo,
          scopes: config.scopes,
          queryParams,
        },
      });

      if (error) {
        console.error(`${provider} 로그인 실패:`, error);
        return { success: false, error: this.translateOAuthError(error.message) };
      }

      return { success: true };
    } catch (error) {
      console.error(`${provider} 로그인 예외:`, error);
      return {
        success: false,
        error: `${this.getProviderDisplayName(provider)} 로그인 중 오류가 발생했습니다.`,
      };
    }
  }

  /**
   * 기존 게스트 계정을 새로운 OAuth ID에 연결합니다.
   *
   * 이 메서드는 게스트의 프로필을 OAuth 사용자의 정보로 업데이트하고,
   * 게임 기록을 마이그레이션하며, 임시 게스트 데이터를 제거합니다.
   *
   * @param {string} guestCode - 연결할 게스트 계정의 코드.
   * @param {string} oauthUserId - OAuth 제공업체의 사용자 ID.
   * @param {SupportedProvider} provider - 연결 중인 OAuth 제공업체.
   * @param {object} oauthData - OAuth 제공업체의 사용자 데이터.
   * @returns {Promise<{ success: boolean; profile?: Profile; error?: string }>} 연결 작업 결과.
   */
  static async linkGuestToOAuth(
    guestCode: string,
    oauthUserId: string,
    provider: SupportedProvider,
    oauthData: {
      email?: string;
      name?: string;
      picture?: string;
      providerId: string;
    }
  ): Promise<{ success: boolean; profile?: Profile; error?: string }> {
    try {
      // 1. 게스트 계정 조회
      const guestProfile = await GuestAuthManager.getGuestByCode(guestCode);
      if (!guestProfile) {
        return { success: false, error: '게스트 계정을 찾을 수 없습니다.' };
      }

      // 2. 중복 연동 확인
      const duplicateCheck = await this.checkExistingOAuthLink(provider, oauthData.providerId);
      if (duplicateCheck) {
        return {
          success: false,
          error: `이미 연동된 ${this.getProviderDisplayName(provider)} 계정입니다.`,
        };
      }

      // 3. OAuth 계정으로 프로필 업데이트
      const updatedProfile: Partial<Profile> = {
        account_type: 'linked',
        email: oauthData.email || guestProfile.email,
        username: this.generateUsernameFromEmail(oauthData.email),
        display_name: oauthData.name || guestProfile.display_name,
        avatar_url: oauthData.picture || guestProfile.avatar_url,
        [`${provider}_id`]: oauthData.providerId,
        linked_at: new Date().toISOString(),
        guest_code: null, // 게스트 코드 제거
        expires_at: null, // 만료 시간 제거
        updated_at: new Date().toISOString(),
      };

      // 4. Supabase 프로필 업데이트
      const { data: linkedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', guestProfile.id)
        .select()
        .single();

      if (updateError) {
        console.error('프로필 연동 업데이트 실패:', updateError);
        return { success: false, error: '계정 연동 중 오류가 발생했습니다.' };
      }

      // 5. 게임 기록 업데이트 (guest_code → user_id)
      await this.migrateGuestGameHistory(guestCode, oauthUserId);

      // 6. 로컬 게스트 데이터 정리
      GuestAuthManager.clearGuestFromLocal();

      return { success: true, profile: linkedProfile };
    } catch (error) {
      console.error('OAuth 연동 실패:', error);
      return { success: false, error: '계정 연동 중 예상치 못한 오류가 발생했습니다.' };
    }
  }

  /**
   * 주어진 OAuth 제공업체 ID가 이미 기존 프로필에 연결되어 있는지 확인합니다.
   * @private
   */
  private static async checkExistingOAuthLink(
    provider: SupportedProvider,
    providerId: string
  ): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq(`${provider}_id`, providerId)
        .single();

      return !!data;
    } catch {
      return false;
    }
  }

  /**
   * 이메일 주소에서 기본 사용자 이름을 생성합니다.
   * @private
   */
  private static generateUsernameFromEmail(email?: string): string | null {
    if (!email) return null;

    const localPart = email.split('@')[0];
    // 특수문자 제거하고 소문자로 변환
    const cleaned = localPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    // 너무 짧으면 랜덤 숫자 추가
    return cleaned.length < 3 ? `${cleaned}${Math.floor(Math.random() * 1000)}` : cleaned;
  }

  /**
   * 게스트의 게임 기록을 새로운 영구 사용자 ID로 마이그레이션합니다.
   * @private
   */
  private static async migrateGuestGameHistory(guestCode: string, newUserId: string): Promise<void> {
    try {
      // 게스트로 플레이한 게임들의 플레이어 ID 업데이트
      await supabase
        .from('games')
        .update({ black_player_id: newUserId })
        .eq('black_player_id', guestCode);

      await supabase
        .from('games')
        .update({ white_player_id: newUserId })
        .eq('white_player_id', guestCode);

      console.log('게스트 게임 기록 마이그레이션 완료');
    } catch (error) {
      console.error('게임 기록 마이그레이션 실패:', error);
    }
  }

  /**
   * 사용자가 로그인한 후 OAuth 콜백을 처리합니다.
   *
   * 이 복잡한 메서드는 사용자가 신규인지, 게스트 계정에서 연결 중인지,
   * 또는 재방문 사용자인지를 결정합니다. 그에 따라 사용자 프로필의 생성 또는
   * 업데이트를 조율합니다.
   *
   * @returns {Promise<{ success: boolean; profile?: Profile; isNewUser?: boolean; error?: string }>} 콜백 처리 결과.
   */
  static async handleOAuthCallback(): Promise<{
    success: boolean;
    profile?: Profile;
    isNewUser?: boolean;
    error?: string;
  }> {
    try {
      // URL에서 게스트 정보 추출
      const urlParams = new URLSearchParams(window.location.search);
      const guestCode = urlParams.get('guest_code');
      const guestId = urlParams.get('guest_id');

      // 현재 인증된 사용자 정보 가져오기
      const {
        data: { user, session },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user || !session) {
        return { success: false, error: '인증 정보를 확인할 수 없습니다.' };
      }

      // OAuth 제공자 정보 추출
      const provider = this.extractProviderFromUser(user);
      if (!provider) {
        return { success: false, error: '지원하지 않는 OAuth 제공자입니다.' };
      }

      // 기존 연동된 계정 확인
      let existingProfile = await this.getLinkedProfile(user.id);

      // 게스트 연동인 경우
      if (guestCode && !existingProfile) {
        const linkResult = await this.linkGuestToOAuth(guestCode, user.id, provider.type, {
          email: user.email,
          name: user.user_metadata?.name || user.user_metadata?.full_name,
          picture: user.user_metadata?.picture || user.user_metadata?.avatar_url,
          providerId: provider.id,
        });

        if (linkResult.success) {
          return {
            success: true,
            profile: linkResult.profile,
            isNewUser: false, // 게스트에서 연동
          };
        } else {
          return { success: false, error: linkResult.error };
        }
      }

      // 새 OAuth 계정인 경우
      if (!existingProfile) {
        const newProfile = await this.createOAuthProfile(user, provider);
        return {
          success: true,
          profile: newProfile,
          isNewUser: true,
        };
      }

      // 기존 연동된 계정
      return {
        success: true,
        profile: existingProfile,
        isNewUser: false,
      };
    } catch (error) {
      console.error('OAuth 콜백 처리 실패:', error);
      return { success: false, error: '로그인 처리 중 오류가 발생했습니다.' };
    }
  }

  /**
   * Supabase 사용자 객체에서 OAuth 제공업체 유형과 ID를 추출합니다.
   * @private
   */
  private static extractProviderFromUser(user: any): {
    type: SupportedProvider;
    id: string;
  } | null {
    const identities = user.identities || [];
    const identity = identities[0]; // 첫 번째 identity 사용

    if (!identity) return null;

    const providerMap: Record<string, SupportedProvider> = {
      google: 'google',
      apple: 'apple',
      facebook: 'facebook',
    };

    const provider = providerMap[identity.provider];
    if (!provider) return null;

    return {
      type: provider,
      id: identity.id || identity.user_id,
    };
  }

  /**
   * 사용자 ID로 데이터베이스에서 기존 사용자 프로필을 가져옵니다.
   * @private
   */
  private static async getLinkedProfile(userId: string): Promise<Profile | null> {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      return data;
    } catch {
      return null;
    }
  }

  /**
   * 새로운 OAuth 사용자를 위해 데이터베이스에 새 사용자 프로필을 생성합니다.
   * @private
   */
  private static async createOAuthProfile(
    user: any,
    provider: { type: SupportedProvider; id: string }
  ): Promise<Profile> {
    const newProfile: Partial<Profile> = {
      id: user.id,
      account_type: 'linked',
      email: user.email,
      username: this.generateUsernameFromEmail(user.email),
      display_name: user.user_metadata?.name || user.user_metadata?.full_name || '새 사용자',
      avatar_url: user.user_metadata?.picture || user.user_metadata?.avatar_url,
      rating: 1500,
      rank: 'Bronze',
      total_games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      [`${provider.type}_id`]: provider.id,
      linked_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (error) {
      throw new Error('프로필 생성 실패: ' + error.message);
    }

    return data;
  }

  /**
   * 주어진 OAuth 제공업체의 표시 이름을 가져옵니다.
   * @param {SupportedProvider} provider - 제공업체.
   * @returns {string} 표시 이름 (예: "Google").
   */
  static getProviderDisplayName(provider: SupportedProvider): string {
    const names = {
      google: 'Google',
      apple: 'Apple',
      facebook: 'Facebook',
    };
    return names[provider];
  }

  /**
   * 일반적인 OAuth 오류 메시지를 한국어로 번역합니다.
   * @private
   */
  private static translateOAuthError(error: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': '로그인 정보가 올바르지 않습니다.',
      'Email not confirmed': '이메일 인증이 필요합니다.',
      'Signup not allowed for this instance': '회원가입이 허용되지 않았습니다.',
      'OAuth error': 'OAuth 인증 중 오류가 발생했습니다.',
      'User denied': '사용자가 인증을 거부했습니다.',
    };

    return errorMap[error] || `인증 오류: ${error}`;
  }

  /**
   * 주어진 OAuth 제공업체에 대한 UI 스타일링 정보(아이콘, 색상)를 제공합니다.
   * @param {SupportedProvider} provider - 제공업체.
   * @returns 스타일링 속성을 가진 객체.
   */
  static getProviderStyle(provider: SupportedProvider) {
    const styles = {
      google: {
        icon: '🔍',
        color: '#4285f4',
        bgColor: '#ffffff',
        textColor: '#757575',
      },
      apple: {
        icon: '🍎',
        color: '#000000',
        bgColor: '#000000',
        textColor: '#ffffff',
      },
      facebook: {
        icon: '📘',
        color: '#1877f2',
        bgColor: '#1877f2',
        textColor: '#ffffff',
      },
    };
    return styles[provider];
  }
}

/**
 * `OAuthManager`의 주요 메서드를 내보내는 유틸리티 객체입니다.
 * 이는 애플리케이션의 다른 부분, 특히 인증 흐름을 트리거해야 하는
 * UI 컴포넌트나 훅에 깨끗하고 단순화된 인터페이스를 제공합니다.
 */
export const oauthUtils = {
  signIn: OAuthManager.signInWithProvider,
  handleCallback: OAuthManager.handleOAuthCallback,
  linkGuest: OAuthManager.linkGuestToOAuth,
  getProviderName: OAuthManager.getProviderDisplayName,
  getProviderStyle: OAuthManager.getProviderStyle,
};