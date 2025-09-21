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

/**
 * 애플리케이션의 메인 Supabase 클라이언트 인스턴스입니다.
 *
 * 이 클라이언트는 환경 변수로부터 프로젝트 URL과 anon 키를 받아 구성됩니다.
 * 인증, 실시간 구독, 전역 헤더에 대한 설정을 포함합니다.
 */
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

/** @type {typeof supabase} SupabaseClient - 타입 안전성을 제공하는 Supabase 클라이언트의 타입 별칭. */
export type SupabaseClient = typeof supabase;

/** Supabase 테이블의 행, 삽입, 업데이트를 위한 제네릭 헬퍼 타입들. */
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

/**
 * Supabase 실시간 구독을 관리하기 위한 헬퍼 클래스입니다.
 *
 * 이 클래스를 사용하면 여러 실시간 구독을 쉽게 추적, 구독 해지 및 정리하여
 * 메모리 누수를 방지할 수 있습니다.
 */
export class SupabaseSubscriptionManager {
  private subscriptions = new Map<string, any>();

  /**
   * 관리자에 새 구독을 추가합니다.
   * 동일한 키의 구독이 이미 존재하는 경우, 먼저 기존 구독을 해지합니다.
   * @param {string} key - 구독을 위한 고유 키.
   * @param {any} subscription - Supabase에서 반환된 구독 객체.
   * @returns {any} 구독 객체.
   */
  subscribe(key: string, subscription: any) {
    // 기존 구독이 있으면 제거
    this.unsubscribe(key);
    this.subscriptions.set(key, subscription);
    return subscription;
  }

  /**
   * 키를 사용하여 특정 구독을 제거하고 구독을 해지합니다.
   * @param {string} key - 제거할 구독의 키.
   */
  unsubscribe(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  /**
   * 현재 관리 중인 모든 구독을 해지합니다.
   */
  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }
}

/** @type {SupabaseSubscriptionManager} subscriptionManager - 구독 관리자의 전역 인스턴스. */
export const subscriptionManager = new SupabaseSubscriptionManager();

/**
 * Supabase 클라이언트를 위한 간단한 getter 함수입니다.
 * 호환성을 위해 또는 직접적인 export를 추상화하기 위해 사용될 수 있습니다.
 * @returns {SupabaseClient} Supabase 클라이언트 인스턴스.
 */
export function getSupabase() {
  return supabase;
}

/**
 * Supabase 백엔드와의 연결을 테스트하는 유틸리티 함수입니다.
 * 간단한 쿼리를 수행하고 성공 또는 에러 상태를 반환합니다.
 * @returns {Promise<{ success: boolean; message?: string; error?: any }>} 연결 테스트 결과.
 */
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * 일반적인 Supabase 작업을 위한 다양한 유틸리티 함수 모음입니다.
 */
export const supabaseUtils = {
  /** 현재 인증된 사용자의 ID를 가져옵니다. */
  getCurrentUserId: () => supabase.auth.getUser().then(({ data }) => data.user?.id),

  /** 현재 세션 데이터를 가져옵니다. */
  getCurrentSession: () => supabase.auth.getSession().then(({ data }) => data.session),

  /** 일반적인 Supabase 에러 메시지를 한국어로 번역합니다. */
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

  /** Supabase 스토리지에 있는 파일의 공개 URL을 생성합니다. */
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  /** 지정된 Supabase 스토리지 버킷에 파일을 업로드합니다. */
  uploadFile: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
      });

    if (error) throw error;
    return data;
  },

  /** RLS를 우회하는 관리자 작업을 위해 서비스 역할 키로 Supabase 클라이언트를 생성합니다. */
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

/**
 * React Query와 함께 사용할 일관된 쿼리 키를 생성하기 위한 팩토리 객체입니다.
 * 오타를 방지하고 Supabase 데이터를 가져오고 캐싱할 때 일관성을 보장하는 데 도움이 됩니다.
 */
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