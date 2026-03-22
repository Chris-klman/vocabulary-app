import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initializeDatabase } from './lib/db';
import { supabase } from './lib/supabase/client';
import { useAuthStore } from './stores/authStore';
import { migrateLocalDataToCloud, isMigrated } from './lib/supabase/migration';

// Initialize local IndexedDB
initializeDatabase();

// Register Supabase auth listener BEFORE React renders.
// Supabase fires INITIAL_SESSION synchronously from the persisted localStorage session,
// so auth state is resolved by the time components mount.
supabase.auth.onAuthStateChange(async (event, session) => {
  const store = useAuthStore.getState();

  store._setSession(session);
  store._setUser(session?.user ?? null);
  store._setLoading(false);

  if (event === 'SIGNED_IN' && session && !isMigrated()) {
    store._setMigrationStatus('in-progress');
    try {
      await migrateLocalDataToCloud(session.user.id);
      store._setMigrationStatus('done');
    } catch (err) {
      console.error('Migration failed:', err);
      store._setMigrationStatus('error');
      store._setMigrationError(err instanceof Error ? err.message : 'Sync-Fehler');
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
