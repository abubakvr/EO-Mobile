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

      // Save access token to secure storage (SecureStore - better than localStorage for mobile)
      if (loginData.access_token) {
        // Save both tokens
        if (loginData.refresh_token) {
          await tokenStorage.saveTokens(
            loginData.access_token,
            loginData.refresh_token
          );
        } else {
          // If only access token is provided, save it
          await tokenStorage.saveAccessToken(loginData.access_token);
        }

        // Set token in API client for immediate use
        apiClient.setAuthToken(loginData.access_token);
        
        if (__DEV__) {
          console.log('✅ Access token saved to secure storage');
        }
      } else {
        console.warn('⚠️ No access_token received in login response');
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
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await tokenStorage.getAccessToken();
    return !!token;
  },
};
