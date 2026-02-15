import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { useOnlineStatus } from '@/hooks';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isOnline = useOnlineStatus();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-error text-white px-4 py-2 text-center text-sm font-medium">
          📡 Offline-Modus - Einige Funktionen sind eingeschränkt
        </div>
      )}

      {/* Main content with padding for bottom nav */}
      <main className="flex-1 pb-nav overflow-y-auto">
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
