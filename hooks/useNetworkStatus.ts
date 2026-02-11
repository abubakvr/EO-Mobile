import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Hook to monitor network connectivity status using NetInfo.
 * Updates instantly when the device goes online/offline (Wi‑Fi, cellular, or none).
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!isMounted) return;
      // isConnected: true if any connection (wifi/cellular/ethernet etc)
      // isInternetReachable can be null (unknown), true, or false
      const connected = state.isConnected === true;
      const reachable = state.isInternetReachable;
      const online = connected && (reachable === null || reachable === true);
      setIsOnline(online);
      setIsChecking(false);
    });

    NetInfo.fetch().then((state) => {
      if (!isMounted) return;
      const connected = state.isConnected === true;
      const reachable = state.isInternetReachable;
      const online = connected && (reachable === null || reachable === true);
      setIsOnline(online);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { isOnline, isChecking };
}
