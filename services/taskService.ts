import { apiClient, ApiError } from './apiClient';
import type { TasksResponse, TasksQueryParams } from '@/types/task';

/**
 * Task service
 * Handles all task-related API calls
 */
export const taskService = {
  /**
   * Get tasks list
   */
  async getTasks(params?: TasksQueryParams): Promise<TasksResponse> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.ward_id) queryParams.append('ward_id', params.ward_id.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.task_type) queryParams.append('task_type', params.task_type);
      if (params?.tree_id) queryParams.append('tree_id', params.tree_id.toString());

      const queryString = queryParams.toString();
      const url = queryString ? `/api/tasks/?${queryString}` : '/api/tasks/';

      // The API returns the response directly
      const axiosInstance = apiClient.getInstance();
      const response = await axiosInstance.get<TasksResponse>(url);

      return response.data;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Handle axios errors
      if (error.response) {
        const message = error.response.data?.message || 'Failed to fetch tasks.';
        throw new ApiError(message, error.response.status, error.response.data);
      }
      throw new ApiError('Failed to fetch tasks. Please try again.');
    }
  },
};
