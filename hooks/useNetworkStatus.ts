import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://dev.greenlegacy.ng';

/**
 * Hook to monitor network connectivity status
 * Uses periodic checks to determine if the device is online
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let isMounted = true;

    const checkNetworkStatus = async () => {
      if (isChecking) return;
      
      setIsChecking(true);
      try {
        // Try to fetch from the API base URL to check connectivity
        // Using a small timeout to avoid blocking
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        // Try to reach the API server
        await fetch(`${API_BASE_URL}/api/`, {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache',
        });

        clearTimeout(timeoutId);
        
        if (isMounted) {
          setIsOnline(true);
        }
      } catch (error) {
        // Network request failed - likely offline
        if (isMounted) {
          setIsOnline(false);
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    // Check immediately
    checkNetworkStatus();

    // Check every 10 seconds
    intervalId = setInterval(() => {
      checkNetworkStatus();
    }, 10000);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isChecking]);

  return { isOnline, isChecking };
}
