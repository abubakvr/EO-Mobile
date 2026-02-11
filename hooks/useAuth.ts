import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { authService } from '@/services/authService';
import { tokenStorage } from '@/services/tokenStorage';
import { apiClient } from '@/services/apiClient';
import type { LoginRequest, LoginResponse, User } from '@/types/auth';

/**
 * React Query keys for auth
 */
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  login: () => [...authKeys.all, 'login'] as const,
};

/**
 * Hook to check authentication status
 */
export function useAuthStatus() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      try {
        const isAuthenticated = await authService.isAuthenticated();
        return { isAuthenticated: !!isAuthenticated };
      } catch (error) {
        if (__DEV__) console.error('Error checking auth status:', error);
        return { isAuthenticated: false };
      }
    },
    initialData: { isAuthenticated: false }, // Provide initial data to prevent loading state
    staleTime: 0, // Always re-check auth when the hook is used (e.g. app open / index mount)
    gcTime: Infinity,
    retry: false,
    refetchOnMount: true, // Re-check on app open so we can redirect if still logged in
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data: LoginResponse) => {
      // Invalidate and refetch auth queries
      queryClient.setQueryData(authKeys.user(), {
        isAuthenticated: true,
        user: data.user,
      });

      // Navigate to home after successful login
      router.replace('/(tabs)');
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });
}

/**
 * Hook for logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();

      // Clear auth data
      queryClient.setQueryData(authKeys.user(), {
        isAuthenticated: false,
        user: null,
      });

      // Navigate to login
      router.replace('/');
    },
    onError: (error) => {
      console.error('Logout error:', error);
    },
  });
}

/**
 * Main auth hook that provides authentication state and methods
 */
export function useAuth() {
  const { data: authStatus, isLoading: isCheckingAuth } = useAuthStatus();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  // Don't block UI on initial auth check - use initialData so it's never truly loading
  const isLoading = loginMutation.isPending || logoutMutation.isPending;

  return {
    // State
    isAuthenticated: authStatus?.isAuthenticated ?? false,
    isLoading,

    // Methods
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    logoutAsync: logoutMutation.mutateAsync,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
  };
}
