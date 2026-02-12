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

/** Build empty page result for tasks */
function emptyTasksPage(page: number, pageSize: number, total?: number) {
  return {
    data: [],
    total: total ?? 0,
    page,
    page_size: pageSize,
    page_count: total != null && pageSize > 0 ? Math.ceil(total / pageSize) : 1,
  };
}

/** True if cache holds all pages (merged list) so we can slice by page */
function isFullTasksCache(cached: { data: any[]; total?: number; page_size?: number }): boolean {
  const total = cached.total ?? 0;
  const len = cached.data?.length ?? 0;
  return total > 0 && len >= total;
}

/** When offline, return the requested page from cache (full list slice or single-page) so pagination works */
function tasksFromCacheForPage(
  cached: { data: any[]; page?: number; page_size?: number; total?: number; page_count?: number },
  requestedPage: number,
  requestedPageSize: number
) {
  const total = cached.total ?? cached.data?.length ?? 0;
  const cacheSize = cached.page_size ?? requestedPageSize;
  const pageCount = cached.page_count ?? (cacheSize > 0 && total > 0 ? Math.ceil(total / cacheSize) : 1);

  if (isFullTasksCache(cached)) {
    const start = (requestedPage - 1) * requestedPageSize;
    const end = start + requestedPageSize;
    const slice = (cached.data ?? []).slice(start, end);
    return {
      data: slice,
      total,
      page: requestedPage,
      page_size: requestedPageSize,
      page_count: requestedPageSize > 0 && total > 0 ? Math.ceil(total / requestedPageSize) : 1,
    };
  }

  const cachePage = cached.page ?? 1;
  if (requestedPage === cachePage && requestedPageSize === cacheSize) {
    return { ...cached, page_count: pageCount };
  }
  return {
    data: [],
    total,
    page: requestedPage,
    page_size: requestedPageSize,
    page_count: requestedPageSize > 0 && total > 0 ? Math.ceil(total / requestedPageSize) : 1,
  };
}

/** Fetch all task pages and merge for offline cache (run in background) */
async function syncAllTasksPagesForOffline(pageSize: number, pageCount: number, total: number, firstPageData: any[]) {
  const allData = [...firstPageData];
  for (let p = 2; p <= pageCount; p++) {
    try {
      const res = await taskService.getTasks({ page: p, page_size: pageSize });
      if (res.data?.length) allData.push(...res.data);
    } catch (e) {
      if (__DEV__) console.warn('[useTasks] Background sync page', p, 'failed', e);
    }
  }
  return { data: allData, total, page_size: pageSize, page_count: pageCount };
}

/**
 * Hook to fetch tasks
 * Checks network status and uses cached data when offline. Offline pagination uses cached page or empty.
 */
export function useTasks(params?: TasksQueryParams) {
  const { isOnline } = useNetworkStatus();
  const page = params?.page ?? 1;
  const pageSize = params?.page_size ?? 10;

  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: async () => {
      // If online, try to fetch from API
      if (isOnline) {
        try {
          const data = await taskService.getTasks(params);
          const pageNum = data.page ?? params?.page ?? 1;
          const pageCount = data.page_count ?? (data.page_size && data.total ? Math.ceil(data.total / data.page_size) : 1);
          const pageSizeResp = data.page_size ?? pageSize;

          if (pageNum === 1) {
            await offlineStorage.saveTasks(data);
            if (pageCount > 1 && data.data?.length) {
              syncAllTasksPagesForOffline(pageSizeResp, pageCount, data.total ?? 0, data.data)
                .then((merged) => offlineStorage.saveTasks(merged))
                .catch((e) => __DEV__ && console.warn('[useTasks] Background full sync failed', e));
            }
          }
          return data;
        } catch (error) {
          // If API fails (e.g. device went offline), try cache first
          if (__DEV__) {
            console.log('[useTasks] API failed, trying cache...');
          }
          const cachedData = await offlineStorage.getTasks();
          if (cachedData) {
            return tasksFromCacheForPage(cachedData, page, pageSize);
          }
          return emptyTasksPage(page, pageSize, 0);
        }
      }
      // Offline: load from cache and return correct page (or empty for other pages)
      if (__DEV__) {
        console.log('[useTasks] Offline, using cache...');
      }
      const cachedData = await offlineStorage.getTasks();
      if (cachedData) {
        return tasksFromCacheForPage(cachedData, page, pageSize);
      }
      return emptyTasksPage(1, pageSize, 0);
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
