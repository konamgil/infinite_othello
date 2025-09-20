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
 * The main Supabase client instance for the application.
 *
 * This client is configured with the project's URL and anon key from environment variables.
 * It includes settings for authentication, real-time subscriptions, and global headers.
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

/** A type alias for the Supabase client, providing type safety. */
export type SupabaseClient = typeof supabase;

/** Generic helper types for Supabase table rows, inserts, and updates. */
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

/**
 * A helper class for managing Supabase real-time subscriptions.
 *
 * This class allows for easy tracking, unsubscribing, and cleanup of multiple
 * real-time subscriptions, preventing memory leaks.
 */
export class SupabaseSubscriptionManager {
  private subscriptions = new Map<string, any>();

  /**
   * Adds a new subscription to the manager.
   * If a subscription with the same key already exists, it is unsubscribed first.
   * @param {string} key - A unique key for the subscription.
   * @param {any} subscription - The subscription object returned from Supabase.
   * @returns The subscription object.
   */
  subscribe(key: string, subscription: any) {
    // 기존 구독이 있으면 제거
    this.unsubscribe(key);
    this.subscriptions.set(key, subscription);
    return subscription;
  }

  /**
   * Removes and unsubscribes a specific subscription by its key.
   * @param {string} key - The key of the subscription to remove.
   */
  unsubscribe(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  /**
   * Unsubscribes from all currently managed subscriptions.
   */
  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }
}

/** A global instance of the subscription manager. */
export const subscriptionManager = new SupabaseSubscriptionManager();

/**
 * A simple getter function for the Supabase client.
 * This might be used for compatibility or to abstract away the direct export.
 * @returns The Supabase client instance.
 */
export function getSupabase() {
  return supabase;
}

/**
 * A utility function to test the connection to the Supabase backend.
 * It performs a simple query and returns a success or error status.
 * @returns {Promise<{ success: boolean; message?: string; error?: any }>} The result of the connection test.
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
 * A collection of miscellaneous utility functions for common Supabase operations.
 */
export const supabaseUtils = {
  /** Gets the ID of the currently authenticated user. */
  getCurrentUserId: () => supabase.auth.getUser().then(({ data }) => data.user?.id),

  /** Gets the current session data. */
  getCurrentSession: () => supabase.auth.getSession().then(({ data }) => data.session),

  /** Translates common Supabase error messages into Korean. */
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

  /** Generates a public URL for a file in Supabase storage. */
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  /** Uploads a file to a specified Supabase storage bucket. */
  uploadFile: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
      });

    if (error) throw error;
    return data;
  },

  /** Creates a Supabase client with the service role key for admin operations that bypass RLS. */
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
 * A factory object for generating consistent query keys for use with React Query.
 * This helps to avoid typos and ensures consistency when fetching and caching Supabase data.
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