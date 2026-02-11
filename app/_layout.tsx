import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, SplashScreen as ExpoRouterSplash, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { apiClient } from '@/services/apiClient';

// Use expo-router's SplashScreen so preventAutoHideAsync works with the router (required for splash to show in build).
try {
  ExpoRouterSplash.preventAutoHideAsync?.();
} catch {
  // ignore if splash screen not available
}

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

const MIN_SPLASH_MS = 800;

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const splashShownAt = useRef<number | null>(null);

  // Don't throw on font error - allow app to render with system font so it doesn't crash
  useEffect(() => {
    if (error && __DEV__) {
      console.warn('[RootLayout] Font failed to load:', error?.message);
    }
  }, [error]);

  useEffect(() => {
    if (!(loaded || error)) return;
    if (splashShownAt.current === null) splashShownAt.current = Date.now();
    const elapsed = Date.now() - splashShownAt.current;
    const delay = Math.max(0, MIN_SPLASH_MS - elapsed);
    const t = setTimeout(() => {
      try {
        ExpoRouterSplash.hideAsync?.();
      } catch {
        // ignore
      }
    }, delay);
    return () => clearTimeout(t);
  }, [loaded, error]);

  // Show app even if font failed (use system font)
  if (!loaded && !error) {
    return null;
  }

  return <RootLayoutNav />;
}

function AuthUnauthorizedHandler() {
  const router = useRouter();
  useEffect(() => {
    apiClient.setUnauthorizedCallback(() => {
      queryClient.clear();
      router.replace('/');
    });
    return () => apiClient.setUnauthorizedCallback(() => {});
  }, [router]);
  return null;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
    <AuthUnauthorizedHandler />
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="validate" options={{ headerShown: false }} />
        <Stack.Screen name="growthcheck" options={{ headerShown: false }} />
        <Stack.Screen name="details" options={{ headerShown: false }} />
        <Stack.Screen name="treelist" options={{ headerShown: false }} />
        <Stack.Screen name="treespecie" options={{ headerShown: false }} />
        <Stack.Screen name="offline-reports" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
    </QueryClientProvider>
  );
}
