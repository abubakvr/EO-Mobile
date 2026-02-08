import { useNetworkStatus } from './useNetworkStatus';
import { offlineStorage } from '@/services/offlineStorage';
import { speciesService } from '../services/speciesService';
import { Species } from '../types/species';
import { useQuery } from '@tanstack/react-query';

/**
 * React Query hook for fetching species
 * Checks network status and uses cached data when offline
 */
export function useSpecies() {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: ['species'],
    queryFn: async () => {
      // If online, try to fetch from API
      if (isOnline) {
        try {
          const data = await speciesService.getSpecies();
          // Save to cache for offline use
          await offlineStorage.saveSpecies(data);
          return data;
        } catch (error) {
          // If API fails, try to get from cache
          if (__DEV__) {
            console.log('[useSpecies] API failed, trying cache...');
          }
          const cachedData = await offlineStorage.getSpecies();
          if (cachedData) {
            return cachedData;
          }
          throw error;
        }
      } else {
        // If offline, get from cache
        if (__DEV__) {
          console.log('[useSpecies] Offline, using cache...');
        }
        const cachedData = await offlineStorage.getSpecies();
        if (cachedData) {
          return cachedData;
        }
        // If no cache, return empty result
        return {
          data: [],
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Get species array from the query result
 */
export function useSpeciesList(): {
  species: Species[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
} {
  const { data, isLoading, error, refetch } = useSpecies();

  return {
    species: data?.data || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
