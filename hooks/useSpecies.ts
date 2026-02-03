import { useQuery } from '@tanstack/react-query';
import { speciesService } from '../services/speciesService';
import { Species } from '../types/species';

/**
 * React Query hook for fetching species
 */
export function useSpecies() {
  return useQuery({
    queryKey: ['species'],
    queryFn: () => speciesService.getSpecies(),
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
