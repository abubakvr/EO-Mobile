import type { Report, ReportsQueryParams, ReportsResponse } from '@/types/report';
import { apiClient, ApiError } from './apiClient';
import { tokenStorage } from './tokenStorage';

/**
 * Report service
 * Handles all report-related API calls
 */
export const reportService = {
  /**
   * Get reports list
   */
  async getReports(params?: ReportsQueryParams): Promise<ReportsResponse> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.ward_id) queryParams.append('ward_id', params.ward_id.toString());
      if (params?.species_id) queryParams.append('species_id', params.species_id.toString());

      const queryString = queryParams.toString();
      const url = queryString ? `/api/reports/?${queryString}` : '/api/reports/';

      // The API returns the response directly
      const axiosInstance = apiClient.getInstance();
      const response = await axiosInstance.get<ReportsResponse>(url);

      return response.data;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Handle axios errors
      if (error.response) {
        const message = error.response.data?.message || 'Failed to fetch reports.';
        throw new ApiError(message, error.response.status, error.response.data);
      }
      throw new ApiError('Failed to fetch reports. Please try again.');
    }
  },

  /**
   * Get single report by ID
   */
  async getReportById(reportId: string | number): Promise<Report> {
    try {
      const url = `/api/reports/${reportId}`;

      // The API returns the response wrapped in a data object
      // Structure: { data: { data: Report, status: 200 } }
      const axiosInstance = apiClient.getInstance();
      const response = await axiosInstance.get(url);

      // Handle nested data structure: response.data.data.data
      // The API response structure is: { data: { data: Report, status: 200 } }
      const responseData = response.data;
      
      if (__DEV__) {
        console.log('[ReportService] getReportById response structure:', {
          hasData: !!responseData,
          hasDataData: !!responseData?.data,
          hasDataDataData: !!responseData?.data?.data,
          responseDataKeys: responseData ? Object.keys(responseData) : [],
        });
      }

      // Try different possible response structures
      if (responseData?.data?.data) {
        // Structure: { data: { data: Report, status: 200 } }
        return responseData.data.data;
      } else if (responseData?.data) {
        // Structure: { data: Report }
        return responseData.data;
      } else if (responseData) {
        // Structure: Report (direct)
        return responseData;
      }
      
      throw new ApiError('Invalid response structure from API: No data found');
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Handle axios errors
      if (error.response) {
        const message = error.response.data?.message || 'Failed to fetch report.';
        throw new ApiError(message, error.response.status, error.response.data);
      }
      throw new ApiError('Failed to fetch report. Please try again.');
    }
  },

  /**
   * Validate tree
   * POST /api/reports/validation
   * Uses fetch API for FormData in React Native to avoid axios FormData issues
   */
  async validateTree(formData: FormData): Promise<{ message: string }> {
    try {
      if (__DEV__) {
        console.log('[ReportService] Validating tree with FormData');
      }

      // Get base URL and auth token
      const baseURL = apiClient.getInstance().defaults.baseURL || 'https://dev.greenlegacy.ng';
      const accessToken = await tokenStorage.getAccessToken();

      // Use fetch API for FormData - React Native's fetch handles FormData correctly
      const url = `${baseURL}/api/reports/validation`;
      
      const headers: HeadersInit = {
        Accept: 'application/json',
        // DO NOT set Content-Type - fetch will set it automatically with boundary for FormData
      };

      // Add Authorization header if token exists
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || `Request failed with status ${response.status}`;
        throw new ApiError(message, response.status, errorData);
      }

      const data = await response.json();

      if (__DEV__) {
        console.log('[ReportService] Validation response:', data);
      }

      return data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[ReportService] Validation error:', {
          message: error.message,
          status: error.statusCode,
        });
      }

      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle network errors
      if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
        throw new ApiError('Network error. Please check your connection.', 0);
      }
      
      throw new ApiError(error.message || 'Failed to validate tree. Please try again.');
    }
  },

  /**
   * Submit growth stage report
   * POST /api/reports/growth-stage
   * Uses fetch API for FormData in React Native to avoid axios FormData issues
   */
  async submitGrowthStage(formData: FormData): Promise<{ message: string }> {
    try {
      if (__DEV__) {
        console.log('[ReportService] Submitting growth stage with FormData');
      }

      // Get base URL and auth token
      const baseURL = apiClient.getInstance().defaults.baseURL || 'https://dev.greenlegacy.ng';
      const accessToken = await tokenStorage.getAccessToken();

      // Use fetch API for FormData - React Native's fetch handles FormData correctly
      const url = `${baseURL}/api/reports/growth-stage`;
      
      const headers: HeadersInit = {
        Accept: 'application/json',
        // DO NOT set Content-Type - fetch will set it automatically with boundary for FormData
      };

      // Add Authorization header if token exists
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || `Request failed with status ${response.status}`;
        throw new ApiError(message, response.status, errorData);
      }

      const data = await response.json();

      if (__DEV__) {
        console.log('[ReportService] Growth stage response:', data);
      }

      return data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[ReportService] Growth stage error:', {
          message: error.message,
          status: error.statusCode,
        });
      }

      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle network errors
      if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
        throw new ApiError('Network error. Please check your connection.', 0);
      }
      
      throw new ApiError(error.message || 'Failed to submit growth stage. Please try again.');
    }
  },

  /**
   * Submit incident report
   * POST /api/reports/incident
   * Uses fetch API for FormData in React Native to avoid axios FormData issues
   */
  async submitIncident(formData: FormData): Promise<{ message: string }> {
    try {
      if (__DEV__) {
        console.log('[ReportService] Submitting incident report with FormData');
      }

      // Get base URL and auth token
      const baseURL = apiClient.getInstance().defaults.baseURL || 'https://dev.greenlegacy.ng';
      const accessToken = await tokenStorage.getAccessToken();

      // Use fetch API for FormData - React Native's fetch handles FormData correctly
      const url = `${baseURL}/api/reports/incident`;
      
      const headers: HeadersInit = {
        Accept: 'application/json',
        // DO NOT set Content-Type - fetch will set it automatically with boundary for FormData
      };

      // Add Authorization header if token exists
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || `Request failed with status ${response.status}`;
        throw new ApiError(message, response.status, errorData);
      }

      const data = await response.json();

      if (__DEV__) {
        console.log('[ReportService] Incident report response:', data);
      }

      return data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[ReportService] Incident report error:', {
          message: error.message,
          status: error.statusCode,
        });
      }

      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle network errors
      if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
        throw new ApiError('Network error. Please check your connection.', 0);
      }
      
      throw new ApiError(error.message || 'Failed to submit incident report. Please try again.');
    }
  },
};
