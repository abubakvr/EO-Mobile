import { SpeciesResponse } from '../types/species';
import { apiClient, ApiError } from './apiClient';

/**
 * Species service
 * Handles API calls related to species
 */
export const speciesService = {
  /**
   * Get all species
   */
  async getSpecies(): Promise<SpeciesResponse> {
    try {
      // The API returns the response directly
      const axiosInstance = apiClient.getInstance();
      const response = await axiosInstance.get<SpeciesResponse>('/api/species');
      return response.data;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Handle axios errors
      if (error.response) {
        const message = error.response.data?.message || 'Failed to fetch species.';
        throw new ApiError(message, error.response.status, error.response.data);
      }
      throw new ApiError('Failed to fetch species. Please try again.');
    }
  },
};
