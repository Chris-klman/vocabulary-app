import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

function IconSearch() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IconLibrary() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13" />
      <path d="M4 19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

const navItems: NavItem[] = [
  { path: '/',           label: 'Nachschlagen', icon: <IconSearch /> },
  { path: '/vocabulary', label: 'Bibliothek',   icon: <IconLibrary /> },
  { path: '/assessment', label: 'Einstufen',    icon: <IconBolt /> },
  { path: '/learning',   label: 'Lernen',       icon: <IconBook /> },
  { path: '/profile',    label: 'Profil',       icon: <IconUser /> },
];

export function BottomNav() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.user !== null);

  return (
    // Nav background covers the home indicator via inline safe-area padding.
    // Icon content area is fixed at h-nav (72px) in the inner div.
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-warm-50 border-t border-warm-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-nav max-w-2xl mx-auto px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
                          (item.path === '/' && location.pathname === '/dictionary');

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 transition-colors',
                isActive
                  ? 'text-warm-900'
                  : 'text-warm-400 hover:text-warm-600'
              )}
            >
              <span className="flex flex-col items-center gap-1.5">
                <span className="relative inline-flex">
                  {item.icon}
                  {item.path === '/profile' && isAuthenticated && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full border-2 border-warm-50" />
                  )}
                </span>
                {/* Active indicator dot */}
                <span className={cn(
                  'w-1 h-1 rounded-full transition-opacity duration-150',
                  isActive ? 'bg-current opacity-100' : 'opacity-0'
                )} />
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
