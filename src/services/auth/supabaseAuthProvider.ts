import { supabase } from '../../lib/supabase';
import type { AuthProvider, AuthResult, AuthUser } from './types';

function mapUser(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): AuthUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    displayName: (supabaseUser.user_metadata?.display_name as string) ?? supabaseUser.email ?? '',
    provider: 'supabase',
  };
}

export function createSupabaseAuthProvider(): AuthProvider | null {
  if (!supabase) return null;

  const client = supabase;

  return {
    async login(email: string, password: string): Promise<AuthResult> {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, user: mapUser(data.user) };
    },

    async register(email: string, password: string, displayName: string): Promise<AuthResult> {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (!data.user) {
        return { success: false, error: 'Registration failed.' };
      }
      return { success: true, user: mapUser(data.user) };
    },

    async logout(): Promise<void> {
      await client.auth.signOut();
    },

    async restoreSession(): Promise<AuthUser | null> {
      const { data: { session } } = await client.auth.getSession();
      if (!session?.user) return null;
      return mapUser(session.user);
    },
  };
}
