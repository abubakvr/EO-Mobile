import { apiClient, ApiError } from './apiClient';
import type { TreesResponse, TreesQueryParams } from '@/types/tree';

/**
 * Tree service
 * Handles all tree-related API calls
 */
export const treeService = {
  /**
   * Get trees list
   */
  async getTrees(params?: TreesQueryParams): Promise<TreesResponse> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.health_status) queryParams.append('health_status', params.health_status);
      if (params?.growth_stage) queryParams.append('growth_stage', params.growth_stage);
      if (params?.ward_id) queryParams.append('ward_id', params.ward_id.toString());
      if (params?.species_id) queryParams.append('species_id', params.species_id.toString());

      const queryString = queryParams.toString();
      const url = queryString ? `/api/trees/?${queryString}` : '/api/trees/';

      // The API returns the response directly
      const axiosInstance = apiClient.getInstance();
      const response = await axiosInstance.get<TreesResponse>(url);

      return response.data;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Handle axios errors
      if (error.response) {
        const message = error.response.data?.message || 'Failed to fetch trees.';
        throw new ApiError(message, error.response.status, error.response.data);
      }
      throw new ApiError('Failed to fetch trees. Please try again.');
    }
  },
};
