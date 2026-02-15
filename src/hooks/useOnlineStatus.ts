import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status
 * Returns true when online, false when offline
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      console.log('Network status: ONLINE');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('Network status: OFFLINE');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
