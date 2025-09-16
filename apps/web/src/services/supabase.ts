// Supabase client with graceful fallback
interface SupabaseClient {
  auth: {
    getSession(): Promise<{ data: { session: null }, error: null }>;
    signInWithPassword(credentials: any): Promise<{ data: null, error: { message: string } }>;
    signOut(): Promise<{ error: null }>;
  };
  from(table: string): any;
}

// Mock client for development - replace with real Supabase when configured
const mockSupabase: SupabaseClient = {
  auth: {
    async getSession() {
      return { data: { session: null }, error: null };
    },
    async signInWithPassword() {
      return { data: null, error: { message: 'Supabase not configured' } };
    },
    async signOut() {
      return { error: null };
    }
  },
  from() {
    return {
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
      update: () => ({ data: null, error: { message: 'Supabase not configured' } }),
      delete: () => ({ data: null, error: { message: 'Supabase not configured' } })
    };
  }
};

export function getSupabase(): SupabaseClient {
  // TODO: Replace with actual Supabase client when configured
  // const supabase = createClient(url, key);
  return mockSupabase;
}

