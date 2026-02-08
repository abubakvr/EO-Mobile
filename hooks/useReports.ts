import { useNetworkStatus } from './useNetworkStatus';
import { offlineStorage } from '@/services/offlineStorage';
import { reportService } from '@/services/reportService';
import type { ReportsQueryParams } from '@/types/report';
import { useQuery } from '@tanstack/react-query';

/**
 * React Query keys for reports
 */
export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (params?: ReportsQueryParams) => [...reportKeys.lists(), params] as const,
  detail: (id: string | number) => [...reportKeys.all, 'detail', id] as const,
};

/**
 * Hook to fetch reports
 * Checks network status and uses cached data when offline
 */
export function useReports(params?: ReportsQueryParams) {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: async () => {
      // If online, try to fetch from API
      if (isOnline) {
        try {
          const data = await reportService.getReports(params);
          // Save to cache for offline use
          if (!params || (!params.page && !params.page_size)) {
            // Only cache full list requests, not filtered/paginated ones
            await offlineStorage.saveReports(data);
          }
          return data;
        } catch (error) {
          // If API fails, try to get from cache
          if (__DEV__) {
            console.log('[useReports] API failed, trying cache...');
          }
          const cachedData = await offlineStorage.getReports();
          if (cachedData) {
            return cachedData;
          }
          throw error;
        }
      } else {
        // If offline, get from cache
        if (__DEV__) {
          console.log('[useReports] Offline, using cache...');
        }
        const cachedData = await offlineStorage.getReports();
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
 * Hook to fetch a single report by ID
 */
export function useReport(reportId: string | number | undefined) {
  return useQuery({
    queryKey: reportKeys.detail(reportId || ''),
    queryFn: () => {
      if (!reportId) {
        throw new Error('Report ID is required');
      }
      return reportService.getReportById(reportId);
    },
    enabled: !!reportId, // Only run query if reportId is provided
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}
