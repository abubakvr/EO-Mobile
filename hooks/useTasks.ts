import { useQuery } from '@tanstack/react-query';
import { useNetworkStatus } from './useNetworkStatus';
import { offlineStorage } from '@/services/offlineStorage';
import { taskService } from '@/services/taskService';
import type { TasksQueryParams } from '@/types/task';

/**
 * React Query keys for tasks
 */
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params?: TasksQueryParams) => [...taskKeys.lists(), params] as const,
};

/**
 * Hook to fetch tasks
 * Checks network status and uses cached data when offline
 */
export function useTasks(params?: TasksQueryParams) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: async () => {
      // If online, try to fetch from API
      if (isOnline) {
        try {
          const data = await taskService.getTasks(params);
          // Save to cache for offline use
          if (!params || (!params.page && !params.page_size)) {
            // Only cache full list requests, not filtered/paginated ones
            await offlineStorage.saveTasks(data);
          }
          return data;
        } catch (error) {
          // If API fails, try to get from cache
          if (__DEV__) {
            console.log('[useTasks] API failed, trying cache...');
          }
          const cachedData = await offlineStorage.getTasks();
          if (cachedData) {
            return cachedData;
          }
          throw error;
        }
      } else {
        // If offline, get from cache
        if (__DEV__) {
          console.log('[useTasks] Offline, using cache...');
        }
        const cachedData = await offlineStorage.getTasks();
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

/**
 * Hook to get tasks count only (for home page)
 */
export function useTasksCount(params?: TasksQueryParams) {
  const { data, ...rest } = useTasks(params);
  
  return {
    ...rest,
    total: data?.total ?? 0,
    tasks: data?.data ?? [],
  };
}
