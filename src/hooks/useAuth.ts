import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

/**
 * React hook providing auth state and Supabase auth actions.
 */
export function useAuth() {
  const store = useAuthStore();

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user: store.user,
    session: store.session,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated(),
    migrationStatus: store.migrationStatus,
    migrationError: store.migrationError,
    signIn,
    signUp,
    signOut,
  };
}
