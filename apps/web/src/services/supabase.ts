import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL 또는 Anon Key가 설정되지 않았습니다. ' +
    '.env.local 파일을 확인하세요.'
  );
}

// Supabase 클라이언트 생성
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 자동 새로고침 설정
    autoRefreshToken: true,
    // 세션 유지 설정
    persistSession: true,
    // 스토리지 키 (여러 앱에서 사용할 때 충돌 방지)
    storageKey: 'infinity-othello-auth',
  },
  // 실시간 기능 설정
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  // 글로벌 설정
  global: {
    headers: {
      'x-application-name': 'infinity-othello',
    },
  },
});

// 타입 안전한 Supabase 클라이언트 export
export type SupabaseClient = typeof supabase;

// 자주 사용되는 테이블 타입들
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// 실시간 구독 관리를 위한 헬퍼
export class SupabaseSubscriptionManager {
  private subscriptions = new Map<string, any>();

  subscribe(key: string, subscription: any) {
    // 기존 구독이 있으면 제거
    this.unsubscribe(key);
    this.subscriptions.set(key, subscription);
    return subscription;
  }

  unsubscribe(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }
}

// 글로벌 구독 관리자
export const subscriptionManager = new SupabaseSubscriptionManager();

// 호환성을 위한 getSupabase 함수
export function getSupabase() {
  return supabase;
}

// 연결 테스트 함수
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { success: false, error };
  }
}

// 유틸리티 함수들
export const supabaseUtils = {
  // 현재 사용자 ID 가져오기
  getCurrentUserId: () => supabase.auth.getUser().then(({ data }) => data.user?.id),

  // 현재 세션 가져오기
  getCurrentSession: () => supabase.auth.getSession().then(({ data }) => data.session),

  // 에러 메시지 변환 (한국어)
  translateError: (error: any): string => {
    if (!error) return '알 수 없는 오류가 발생했습니다.';

    const errorMap: Record<string, string> = {
      'Invalid login credentials': '로그인 정보가 올바르지 않습니다.',
      'User not found': '사용자를 찾을 수 없습니다.',
      'Email not confirmed': '이메일 인증이 필요합니다.',
      'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 합니다.',
      'User already registered': '이미 가입된 사용자입니다.',
      'Email rate limit exceeded': '이메일 전송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
    };

    return errorMap[error.message] || error.message || '알 수 없는 오류가 발생했습니다.';
  },

  // 업로드 파일 URL 생성
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  // 파일 업로드
  uploadFile: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
      });

    if (error) throw error;
    return data;
  },

  // RLS 정책 우회 (관리자 전용)
  createServiceClient: () => {
    const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      throw new Error('Service role key not found');
    }

    return createClient<Database>(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  },
};

// React Query와 함께 사용할 때 유용한 키 팩토리
export const supabaseQueryKeys = {
  auth: ['auth'] as const,
  user: (userId?: string) => ['user', userId] as const,
  profiles: () => ['profiles'] as const,
  profile: (userId: string) => ['profile', userId] as const,
  games: () => ['games'] as const,
  game: (gameId: string) => ['game', gameId] as const,
  gameHistory: (userId: string) => ['gameHistory', userId] as const,
  leaderboard: () => ['leaderboard'] as const,
  rooms: () => ['rooms'] as const,
  room: (roomId: string) => ['room', roomId] as const,
} as const;