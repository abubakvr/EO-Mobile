import type { LoginRequest, LoginResponse } from '@/types/auth';
import { apiClient, ApiError, RequestConfig } from './apiClient';
import { tokenStorage } from './tokenStorage';

/**
 * Authentication service
 * Handles all authentication-related API calls
 */
export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // The API returns the response directly (201 status)
      // We need to get the raw response data
      const axiosInstance = apiClient.getInstance();
      const config: RequestConfig = { skipAuth: true };
      const response = await axiosInstance.post<LoginResponse>(
        '/api/auth/login',
        credentials,
        config
      );

      // Extract the login data from the response
      const loginData: LoginResponse = response.data;

      // Save access token and expiry to secure storage (SecureStore - better than localStorage for mobile)
      if (loginData.access_token) {
        // Save both tokens
        if (loginData.refresh_token) {
          await tokenStorage.saveTokens(
            loginData.access_token,
            loginData.refresh_token
          );
        } else {
          await tokenStorage.saveAccessToken(loginData.access_token);
        }

        // Save token expiry so we can keep user logged in until it expires
        const expiresInSeconds = loginData.expires_in ?? 24 * 60 * 60; // default 24h if API omits it
        const expiresAtMs = Date.now() + expiresInSeconds * 1000;
        await tokenStorage.saveTokenExpiry(expiresAtMs);

        // Set token in API client for immediate use
        apiClient.setAuthToken(loginData.access_token);
        apiClient.setTokenExpiry(expiresAtMs);

        if (__DEV__) {
          console.log('✅ Access token and expiry saved to secure storage');
        }
      } else {
        console.warn('⚠️ No access_token received in login response');
      }

      // Save user data (name and ward) to secure storage
      if (loginData.user) {
        const userName = loginData.user.full_name || '';
        // For now, use ward_ids. If ward_name is available in the future, use that instead
        // ward_ids is a string (possibly comma-separated IDs), we'll use it as-is for now
        const userWard = loginData.user.ward_ids || '';
        
        if (userName) {
          await tokenStorage.saveUserData(userName, userWard);
          if (__DEV__) {
            console.log('✅ User data saved to secure storage:', { userName, userWard });
          }
        }
      }

      return loginData;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Handle axios errors
      if (error.response) {
        const message = error.response.data?.message || 'Login failed. Please check your credentials.';
        throw new ApiError(message, error.response.status, error.response.data);
      }
      throw new ApiError('Login failed. Please try again.');
    }
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    // Clear tokens from storage
    await tokenStorage.clearTokens();

    // Clear token from API client
    apiClient.setAuthToken(null);
  },

  /**
   * Check if user is authenticated (has valid, non-expired token).
   * If token is expired, clears storage and returns false.
   * When valid, syncs token and expiry to apiClient so requests are authenticated.
   */
  async isAuthenticated(): Promise<boolean> {
    const [token, expiry] = await Promise.all([
      tokenStorage.getAccessToken(),
      tokenStorage.getTokenExpiry(),
    ]);
    if (!token) return false;
    const expired = expiry != null && Date.now() >= expiry;
    if (expired) {
      await this.logout();
      return false;
    }
    apiClient.setAuthToken(token);
    apiClient.setTokenExpiry(expiry);
    return true;
  },
};
