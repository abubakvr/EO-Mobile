import { useAuthStatus } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import SignInScreen from '../screens/SignInScreen';

/**
 * Entry screen: show Sign In, or redirect to main app if user has a valid (non-expired) token.
 * Keeps users logged in across app restarts until the token expires.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const { data, isFetched } = useAuthStatus();
  const isAuthenticated = data?.isAuthenticated ?? false;

  useEffect(() => {
    if (!isFetched) return;
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isFetched, isAuthenticated, router]);

  return <SignInScreen />;
}
