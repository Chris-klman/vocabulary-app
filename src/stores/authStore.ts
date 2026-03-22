import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';

export type MigrationStatus = 'idle' | 'in-progress' | 'done' | 'error';

interface AuthStore {
  user: User | null;
  session: Session | null;
  /** True while Supabase resolves the initial session on startup. */
  isLoading: boolean;
  migrationStatus: MigrationStatus;
  migrationError: string | null;

  _setUser: (user: User | null) => void;
  _setSession: (session: Session | null) => void;
  _setLoading: (loading: boolean) => void;
  _setMigrationStatus: (status: MigrationStatus) => void;
  _setMigrationError: (err: string | null) => void;

  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  migrationStatus: 'idle',
  migrationError: null,

  _setUser: (user) => set({ user }),
  _setSession: (session) => set({ session }),
  _setLoading: (isLoading) => set({ isLoading }),
  _setMigrationStatus: (migrationStatus) => set({ migrationStatus }),
  _setMigrationError: (migrationError) => set({ migrationError }),

  isAuthenticated: () => get().user !== null,
}));
