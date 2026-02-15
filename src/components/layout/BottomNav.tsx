import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  {
    path: '/dictionary',
    label: 'Nachschlagen',
    icon: '📖',
  },
  {
    path: '/vocabulary',
    label: 'Vokabeln',
    icon: '📚',
  },
  {
    path: '/learning',
    label: 'Lernen',
    icon: '🎯',
  },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 h-nav">
      <div className="flex items-center justify-around h-full max-w-2xl mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
                          (location.pathname === '/' && item.path === '/dictionary');

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 flex-1 transition-colors',
                isActive
                  ? 'text-black font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
