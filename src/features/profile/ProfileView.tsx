import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { Spinner } from '@/components/ui';

export function ProfileView() {
  const { user, isLoading, isAuthenticated, migrationStatus, migrationError, signIn, signUp, signOut } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [signUpDone, setSignUpDone] = useState(false);

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Authenticated state ──────────────────────────────────────────────────
  if (isAuthenticated && user) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="mb-6">
          <h1 className="font-display font-normal text-3xl text-warm-900 mb-1">Profil</h1>
          <p className="text-warm-500 text-sm">Konto & Sync</p>
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest mb-1">Angemeldet als</p>
            <p className="font-medium text-warm-900">{user.email}</p>
          </div>

          {/* Migration / sync status */}
          {migrationStatus !== 'idle' && (
            <div className={[
              'p-3 rounded-xl text-sm flex items-center gap-2',
              migrationStatus === 'in-progress' ? 'bg-warm-100 text-warm-600' :
              migrationStatus === 'done'        ? 'bg-[#d4e8e0] text-[#2d5a4a]' :
                                                  'bg-[#f0d4d4] text-[#7c2828]',
            ].join(' ')}>
              {migrationStatus === 'in-progress' && (
                <>
                  <Spinner size="sm" />
                  <span>Daten werden synchronisiert…</span>
                </>
              )}
              {migrationStatus === 'done' && <span>✓ Synchronisiert</span>}
              {migrationStatus === 'error' && (
                <span>Sync fehlgeschlagen: {migrationError}</span>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-warm-100">
            <p className="text-xs text-warm-400 mb-3">
              Deine Vokabeln und Einstufungen werden automatisch in der Cloud gespeichert.
            </p>
            <button
              onClick={signOut}
              className="btn btn-outline w-full"
            >
              Abmelden
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Unauthenticated state ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsBusy(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        navigate('/');
      } else {
        await signUp(email, password);
        setSignUpDone(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      if (msg.includes('Invalid login credentials')) {
        setError('E-Mail oder Passwort falsch.');
      } else if (msg.includes('User already registered')) {
        setError('Diese E-Mail ist bereits registriert. Bitte anmelden.');
      } else {
        setError(msg);
      }
    } finally {
      setIsBusy(false);
    }
  };

  if (signUpDone) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="mb-6">
          <h1 className="font-display font-normal text-3xl text-warm-900 mb-1">Profil</h1>
        </div>
        <div className="card p-6 text-center space-y-4">
          <h2 className="font-display font-normal text-2xl text-warm-900">Bestätigungsmail gesendet</h2>
          <p className="text-sm text-warm-600">
            Bitte bestätige deine E-Mail-Adresse <strong className="text-warm-900">{email}</strong> und melde dich dann an.
          </p>
          <button
            onClick={() => { setSignUpDone(false); setMode('signin'); }}
            className="btn btn-primary w-full mt-2"
          >
            Zum Anmelden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="mb-6">
        <h1 className="font-display font-normal text-3xl text-warm-900 mb-1">Profil</h1>
        <p className="text-warm-500 text-sm">
          Melde dich an, um deine Daten geräteübergreifend zu speichern.
        </p>
      </div>

      <div className="card p-6 space-y-5">
        {/* Mode toggle */}
        <div className="flex bg-warm-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); }}
            className={[
              'flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors',
              mode === 'signin' ? 'bg-white shadow-sm text-warm-900' : 'text-warm-500',
            ].join(' ')}
          >
            Anmelden
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={[
              'flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors',
              mode === 'signup' ? 'bg-white shadow-sm text-warm-900' : 'text-warm-500',
            ].join(' ')}
          >
            Registrieren
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-warm-700" htmlFor="email">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
              placeholder="deine@email.de"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-warm-700" htmlFor="password">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              placeholder="Mindestens 8 Zeichen"
            />
          </div>

          {error && (
            <p className="text-sm text-[#7c2828] bg-[#f0d4d4] border border-[#d9a8a8] rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isBusy}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            {isBusy && <Spinner size="sm" />}
            {mode === 'signin' ? 'Anmelden' : 'Registrieren'}
          </button>
        </form>
      </div>
    </div>
  );
}
