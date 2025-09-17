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

export class OAuthManager {
  // OAuth 로그인 시작 (게스트 데이터 포함)
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

  // 게스트 계정을 OAuth 계정으로 연동
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

  // 기존 OAuth 연동 확인
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

  // 이메일에서 사용자명 생성
  private static generateUsernameFromEmail(email?: string): string | null {
    if (!email) return null;

    const localPart = email.split('@')[0];
    // 특수문자 제거하고 소문자로 변환
    const cleaned = localPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    // 너무 짧으면 랜덤 숫자 추가
    return cleaned.length < 3 ? `${cleaned}${Math.floor(Math.random() * 1000)}` : cleaned;
  }

  // 게스트 게임 기록 마이그레이션
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

  // OAuth 콜백 처리
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

  // 사용자에서 제공자 정보 추출
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

  // 연동된 프로필 조회
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

  // 새 OAuth 프로필 생성
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

  // 제공자 표시 이름
  static getProviderDisplayName(provider: SupportedProvider): string {
    const names = {
      google: 'Google',
      apple: 'Apple',
      facebook: 'Facebook',
    };
    return names[provider];
  }

  // OAuth 에러 메시지 번역
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

  // 제공자별 아이콘/색상 정보
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

// OAuth 관련 유틸리티 함수들
export const oauthUtils = {
  signIn: OAuthManager.signInWithProvider,
  handleCallback: OAuthManager.handleOAuthCallback,
  linkGuest: OAuthManager.linkGuestToOAuth,
  getProviderName: OAuthManager.getProviderDisplayName,
  getProviderStyle: OAuthManager.getProviderStyle,
};