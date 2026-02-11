import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';
const USER_NAME_KEY = 'user_name';
const USER_WARD_KEY = 'user_ward';

/**
 * Token storage utility using Expo SecureStore
 * Provides secure storage for authentication tokens
 */
export const tokenStorage = {
  /**
   * Save access token
   */
  async saveAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save access token:', error);
      throw error;
    }
  },

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      return token;
    } catch (error) {
      // SecureStore might not be available in all environments
      console.warn('Failed to get access token from SecureStore:', error);
      return null;
    }
  },

  /**
   * Save refresh token
   */
  async saveRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save refresh token:', error);
      throw error;
    }
  },

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  },

  /**
   * Save both tokens
   */
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      this.saveAccessToken(accessToken),
      this.saveRefreshToken(refreshToken),
    ]);
  },

  /**
   * Save token expiry timestamp (milliseconds since epoch).
   * Used to keep user logged in until expiry; clear and log out when expired.
   */
  async saveTokenExpiry(expiresAtMs: number): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, String(expiresAtMs));
    } catch (error) {
      console.warn('Failed to save token expiry:', error);
    }
  },

  /**
   * Get token expiry timestamp (milliseconds), or null if not set.
   */
  async getTokenExpiry(): Promise<number | null> {
    try {
      const value = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
      if (value == null) return null;
      const n = parseInt(value, 10);
      return Number.isFinite(n) ? n : null;
    } catch (error) {
      console.warn('Failed to get token expiry:', error);
      return null;
    }
  },

  /**
   * Check if the stored token is expired (or missing expiry = treat as not expired for backward compat).
   */
  async isTokenExpired(): Promise<boolean> {
    const expiresAt = await this.getTokenExpiry();
    if (expiresAt == null) return false;
    return Date.now() >= expiresAt;
  },

  /**
   * Save user name
   */
  async saveUserName(name: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_NAME_KEY, name);
    } catch (error) {
      console.error('Failed to save user name:', error);
      throw error;
    }
  },

  /**
   * Get user name
   */
  async getUserName(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(USER_NAME_KEY);
    } catch (error) {
      console.warn('Failed to get user name from SecureStore:', error);
      return null;
    }
  },

  /**
   * Save user ward
   */
  async saveUserWard(ward: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_WARD_KEY, ward);
    } catch (error) {
      console.error('Failed to save user ward:', error);
      throw error;
    }
  },

  /**
   * Get user ward
   */
  async getUserWard(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(USER_WARD_KEY);
    } catch (error) {
      console.warn('Failed to get user ward from SecureStore:', error);
      return null;
    }
  },

  /**
   * Save user data (name and ward)
   */
  async saveUserData(name: string, ward: string): Promise<void> {
    await Promise.all([
      this.saveUserName(name),
      this.saveUserWard(ward),
    ]);
  },

  /**
   * Clear all tokens and user data
   */
  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY),
        SecureStore.deleteItemAsync(USER_NAME_KEY),
        SecureStore.deleteItemAsync(USER_WARD_KEY),
      ]);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  },
};
