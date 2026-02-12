import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Derive online status from NetInfo state.
 * isConnected: true if any link (wifi/cellular/ethernet). isInternetReachable: null (unknown), true, or false.
 */
function isOnlineFromState(state: { isConnected: boolean | null; isInternetReachable: boolean | null }): boolean {
  const connected = state.isConnected === true;
  const reachable = state.isInternetReachable;
  return connected && (reachable === null || reachable === true);
}

/**
 * Hook to monitor network connectivity using @react-native-community/netinfo (Expo SDK 54).
 *
 * How it checks:
 * 1. On mount: NetInfo.fetch() gets current state immediately.
 * 2. Instantly: NetInfo.addEventListener() fires whenever the device goes online/offline
 *    (Wi‑Fi, cellular, or none), so the UI updates without delay.
 *
 * No polling – the native layer pushes updates as soon as connectivity changes.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    // Subscribe first so we don't miss any change between fetch and listener
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!isMounted) return;
      setIsOnline(isOnlineFromState(state));
      setIsChecking(false);
    });

    // Get current state immediately (runs in parallel with listener setup)
    NetInfo.fetch().then((state) => {
      if (!isMounted) return;
      setIsOnline(isOnlineFromState(state));
      setIsChecking(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Treat "unknown" (null) as online for backward compatibility so UI doesn't flash offline
  const isOnlineResolved = isOnline ?? true;
  return { isOnline: isOnlineResolved, isChecking };
}
