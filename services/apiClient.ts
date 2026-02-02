import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * API Client Configuration
 * Configure your base URL and default settings here
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com';

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

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - Add auth token, modify requests
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication token if available
        const token = this.getAuthToken();
        if (token && !(config as RequestConfig).skipAuth) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (__DEV__) {
          console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
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
              this.handleUnauthorized();
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
          // Request made but no response received
          if (__DEV__) {
            console.error('[API Error] No response received', error.request);
          }

          return Promise.reject(
            new ApiError('Network error. Please check your connection.', 0)
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
   * Get authentication token from storage
   * Override this method to implement your token storage logic
   */
  private getAuthToken(): string | null {
    // TODO: Implement token retrieval from AsyncStorage or secure storage
    // Example:
    // return await AsyncStorage.getItem('authToken');
    return null;
  }

  /**
   * Handle unauthorized access
   * Override this method to implement your logout/redirect logic
   */
  private handleUnauthorized(): void {
    // TODO: Implement logout logic
    // Example:
    // AsyncStorage.removeItem('authToken');
    // NavigationService.navigate('Login');
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
      headers: {
        'Content-Type': 'multipart/form-data',
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
   */
  setAuthToken(token: string | null): void {
    if (token) {
      this.client.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
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
