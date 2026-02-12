import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { tokenStorage } from './tokenStorage';

/**
 * API Client Configuration
 * Configure your base URL and default settings here
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://dev.greenlegacy.ng';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Response wrapper type
 */
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * Request configuration interface
 */
export interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
}

/**
 * API Client class
 * Centralized HTTP client for making API calls throughout the app
 */
class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiryMs: number | null = null;
  private onUnauthorizedCallback?: () => void;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds
      headers: {
        'Accept': 'application/json',
        // Don't set Content-Type here - let it be set per-request based on data type
      },
      // For React Native, we need to handle FormData specially
      // Don't use transformRequest - let FormData pass through naturally
    });

    this.setupInterceptors();
    this.loadTokenFromStorage();
  }

  /**
   * Load token and expiry from secure storage on initialization.
   * If token is expired, clears storage and does not set token.
   */
  private async loadTokenFromStorage(): Promise<void> {
    try {
      const [token, expiry] = await Promise.all([
        tokenStorage.getAccessToken(),
        tokenStorage.getTokenExpiry(),
      ]);
      if (!token) return;
      const expired = expiry != null && Date.now() >= expiry;
      if (expired) {
        await tokenStorage.clearTokens();
        return;
      }
      this.accessToken = token;
      this.tokenExpiryMs = expiry;
      this.setAuthToken(token);
    } catch (error) {
      console.error('Failed to load token from storage:', error);
    }
  }

  /**
   * Set callback for unauthorized access
   */
  setUnauthorizedCallback(callback: () => void): void {
    this.onUnauthorizedCallback = callback;
  }

  /**
   * Check if URL should skip authentication
   */
  private shouldSkipAuth(url?: string): boolean {
    if (!url) return false;
    // Skip auth for login and signup endpoints
    return url.includes('/api/auth/login') || 
           url.includes('/api/auth/signup') || 
           url.includes('/api/auth/register');
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - Add auth token, modify requests
    this.client.interceptors.request.use(
      (config) => {
        // Check if this endpoint should skip auth
        const skipAuth = (config as RequestConfig).skipAuth || this.shouldSkipAuth(config.url);
        
        // Handle authentication token
        if (skipAuth) {
          delete config.headers.Authorization;
        } else {
          // Use token only if present and not expired; otherwise clear and trigger logout
          const token = this.getAuthToken();
          const expired = this.tokenExpiryMs != null && Date.now() >= this.tokenExpiryMs;
          if (expired && token) {
            this.handleUnauthorized().catch(console.error);
            return Promise.reject(new ApiError('Session expired. Please sign in again.', 401));
          }
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          } else {
            delete config.headers.Authorization;
          }
        }

        // Handle Content-Type for FormData
        // In React Native, FormData must pass through without any transformation
        if (config.data instanceof FormData) {
          // Remove any Content-Type header - React Native network layer will set it automatically
          delete config.headers['Content-Type'];
          delete config.headers['content-type'];
          // Ensure FormData is not transformed
          // React Native's network layer needs FormData to be passed as-is
        } else if (!config.headers['Content-Type'] && !config.headers['content-type']) {
          // For non-FormData object requests, set application/json
          if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
          }
        }

        // Log request in development
        if (__DEV__) {
          console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data instanceof FormData ? '[FormData]' : config.data,
            headers: {
              Authorization: config.headers.Authorization ? 'Bearer ***' : 'None',
              'Content-Type': config.headers['Content-Type'],
            },
          });
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors, transform responses
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (__DEV__) {
          console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
          });
        }

        return response;
      },
      (error: AxiosError) => {
        // Handle errors
        if (error.response) {
          // Server responded with error status
          const statusCode = error.response.status;
          const errorData = error.response.data;

          // Log error in development
          if (__DEV__) {
            console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
              status: statusCode,
              data: errorData,
            });
          }

          // Handle specific status codes
          switch (statusCode) {
            case 401:
              // Unauthorized - Clear token and redirect to login
              this.handleUnauthorized().catch(console.error);
              break;
            case 403:
              // Forbidden
              break;
            case 404:
              // Not found
              break;
            case 500:
              // Server error
              break;
          }

          // Skip error handling if requested
          if ((error.config as RequestConfig)?.skipErrorHandling) {
            return Promise.reject(error);
          }

          const errorMessage =
            (errorData as any)?.message ||
            (errorData as any)?.error ||
            error.message ||
            'An error occurred';

          return Promise.reject(
            new ApiError(errorMessage, statusCode, errorData)
          );
        } else if (error.request) {
          // Request made but no response received (e.g. device offline, network error)
          let errorMessage = 'Network error. Please check your connection.';
          const requestError = error.request?._response || error.message || '';
          const code = (error as any)?.code;

          if (typeof requestError === 'string') {
            if (requestError.includes('timeout') || code === 'ECONNABORTED') {
              errorMessage = 'Request timed out. The server may be slow or unavailable. Please try again.';
            } else if (requestError.includes('Unable to resolve host') || requestError.includes('No address associated with hostname')) {
              errorMessage = `Unable to connect to server (${API_BASE_URL}). Please check:\n\n1. Your internet connection\n2. The API server is accessible\n3. DNS settings`;
            } else if (requestError.includes('Network request failed')) {
              errorMessage = 'Network request failed. Please check your internet connection.';
            }
          }

          // Log as warn (not error) so offline/network failures don't spam console
          if (__DEV__) {
            console.warn('[API] No response received (device may be offline):', error.config?.method, error.config?.url);
          }

          return Promise.reject(
            new ApiError(errorMessage, 0, error.request)
          );
        } else {
          // Error setting up request
          if (__DEV__) {
            console.error('[API Error] Request setup error', error.message);
          }

          return Promise.reject(new ApiError(error.message || 'An unexpected error occurred'));
        }
      }
    );
  }

  /**
   * Get authentication token from memory
   */
  private getAuthToken(): string | null {
    return this.accessToken;
  }

  /**
   * Handle unauthorized access (expired or 401)
   */
  private async handleUnauthorized(): Promise<void> {
    this.accessToken = null;
    this.tokenExpiryMs = null;
    this.setAuthToken(null);
    await tokenStorage.clearTokens();

    if (this.onUnauthorizedCallback) {
      this.onUnauthorizedCallback();
    }
  }

  /**
   * Set token expiry (ms since epoch). Used after login so requests can check before sending.
   */
  setTokenExpiry(expiresAtMs: number | null): void {
    this.tokenExpiryMs = expiresAtMs;
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * Upload file
   */
  async upload<T = any>(
    url: string,
    file: { uri: string; type: string; name: string },
    data?: any,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    if (data) {
      Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
      });
    }

    const config: RequestConfig = {
      // Don't set Content-Type - axios will set it automatically with boundary for FormData
      headers: {
        Accept: 'application/json',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    };

    const response = await this.client.post<ApiResponse<T>>(url, formData, config);
    return response.data;
  }

  /**
   * Set authentication token
   * Note: We don't set it in defaults.headers.common because we handle it per-request
   * in the interceptor to allow skipping auth for certain endpoints
   */
  setAuthToken(token: string | null): void {
    this.accessToken = token;
    if (!token) {
      this.tokenExpiryMs = null;
      delete this.client.defaults.headers.common.Authorization;
    }
  }

  /**
   * Update base URL
   */
  setBaseURL(url: string): void {
    this.client.defaults.baseURL = url;
  }

  /**
   * Get the underlying axios instance (for advanced use cases)
   */
  getInstance(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export default for convenience
export default apiClient;
