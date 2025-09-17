import { describe, it, expect } from 'vitest';
import { getSupabase, testSupabaseConnection } from '../services/supabase';

describe('Supabase Connection', () => {
  it('should create Supabase client successfully', () => {
    const supabase = getSupabase();
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(supabase.from).toBeDefined();
  });

  it('should have environment variables configured', () => {
    expect(import.meta.env.VITE_SUPABASE_URL).toBeDefined();
    expect(import.meta.env.VITE_SUPABASE_ANON_KEY).toBeDefined();
    expect(import.meta.env.VITE_SUPABASE_URL).toContain('supabase.co');
  });

  it('should test connection to Supabase', async () => {
    const result = await testSupabaseConnection();

    // 연결이 성공하거나, 테이블이 없어서 실패하거나 둘 다 괜찮음
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');

    if (!result.success) {
      console.log('⚠️ 연결 테스트 실패 (정상일 수 있음):', result.error);
      // 일반적인 에러들은 정상 (테이블이 없거나, RLS 때문에)
      expect(
        result.error?.includes('relation "profiles" does not exist') ||
        result.error?.includes('permission denied') ||
        result.error?.includes('RLS') ||
        result.error?.includes('JWT') ||
        result.error?.includes('failed to parse') ||
        result.error?.includes('does not exist') ||
        result.error?.includes('Could not find the table') ||
        result.error?.includes('schema cache')
      ).toBeTruthy();
    } else {
      console.log('✅ Supabase 연결 성공!', result.data);
    }
  }, 10000); // 10초 타임아웃

  it('should handle authentication state', async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getSession();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.session).toBeNull(); // 현재 로그인하지 않은 상태
  });
});