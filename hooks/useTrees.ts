import { offlineStorage } from '@/services/offlineStorage';
import { treeService } from '@/services/treeService';
import type { TreesQueryParams } from '@/types/tree';
import { useQuery } from '@tanstack/react-query';
import { useNetworkStatus } from './useNetworkStatus';

/**
 * React Query keys for trees
 */
export const treeKeys = {
  all: ['trees'] as const,
  lists: () => [...treeKeys.all, 'list'] as const,
  list: (params?: TreesQueryParams) => [...treeKeys.lists(), params] as const,
  detail: (id: string | number) => [...treeKeys.all, 'detail', id] as const,
};

/**
 * Hook to fetch trees list
 * Checks network status and uses cached data when offline
 */
export function useTrees(params?: TreesQueryParams) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: treeKeys.list(params),
    queryFn: async () => {
      // If online, try to fetch from API
      if (isOnline) {
        try {
          const data = await treeService.getTrees(params);
          // Save to cache for offline use
          if (!params || (!params.page && !params.page_size)) {
            // Only cache full list requests, not filtered/paginated ones
            await offlineStorage.saveTrees(data);
          }
          return data;
        } catch (error) {
          // If API fails, try to get from cache
          if (__DEV__) {
            console.log('[useTrees] API failed, trying cache...');
          }
          const cachedData = await offlineStorage.getTrees();
          if (cachedData) {
            return cachedData;
          }
          throw error;
        }
      } else {
        // If offline, get from cache
        if (__DEV__) {
          console.log('[useTrees] Offline, using cache...');
        }
        const cachedData = await offlineStorage.getTrees();
        if (cachedData) {
          return cachedData;
        }
        // If no cache, return empty result
        return {
          data: [],
          total: 0,
          page: 1,
          page_size: 0,
        };
      }
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}
