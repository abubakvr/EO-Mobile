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

/** Build empty page result for reports */
function emptyReportsPage(page: number, pageSize: number, total?: number) {
  return {
    data: [],
    total: total ?? 0,
    page,
    page_size: pageSize,
    page_count: total != null && pageSize > 0 ? Math.ceil(total / pageSize) : 1,
  };
}

/** True if cache holds all pages (merged list) so we can slice by page */
function isFullReportsCache(cached: { data: any[]; total?: number; page_size?: number }): boolean {
  const total = cached.total ?? 0;
  const len = cached.data?.length ?? 0;
  return total > 0 && len >= total;
}

/** When offline, return the requested page from cache (full list slice or single-page) so pagination works */
function reportsFromCacheForPage(
  cached: { data: any[]; page?: number; page_size?: number; total?: number; page_count?: number },
  requestedPage: number,
  requestedPageSize: number
) {
  const total = cached.total ?? cached.data?.length ?? 0;
  const cacheSize = cached.page_size ?? requestedPageSize;
  const pageCount = cached.page_count ?? (cacheSize > 0 && total > 0 ? Math.ceil(total / cacheSize) : 1);

  if (isFullReportsCache(cached)) {
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

/** Fetch all report pages and merge for offline cache (run in background) */
async function syncAllReportsPagesForOffline(pageSize: number, pageCount: number, total: number, firstPageData: any[]) {
  const allData = [...firstPageData];
  for (let p = 2; p <= pageCount; p++) {
    try {
      const res = await reportService.getReports({ page: p, page_size: pageSize });
      if (res.data?.length) allData.push(...res.data);
    } catch (e) {
      if (__DEV__) console.warn('[useReports] Background sync page', p, 'failed', e);
    }
  }
  return { data: allData, total, page_size: pageSize, page_count: pageCount };
}

/**
 * Hook to fetch reports
 * Checks network status and uses cached data when offline. Offline pagination uses cached page or empty.
 */
export function useReports(params?: ReportsQueryParams) {
  const { isOnline } = useNetworkStatus();
  const page = params?.page ?? 1;
  const pageSize = params?.page_size ?? 10;

  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: async () => {
      // If online, try to fetch from API
      if (isOnline) {
        try {
          const data = await reportService.getReports(params);
          const pageNum = data.page ?? params?.page ?? 1;
          const pageCount = data.page_count ?? (data.page_size && data.total ? Math.ceil(data.total / data.page_size) : 1);
          const pageSizeResp = data.page_size ?? pageSize;

          if (pageNum === 1) {
            await offlineStorage.saveReports(data);
            if (pageCount > 1 && data.data?.length) {
              syncAllReportsPagesForOffline(pageSizeResp, pageCount, data.total ?? 0, data.data)
                .then((merged) => offlineStorage.saveReports(merged))
                .catch((e) => __DEV__ && console.warn('[useReports] Background full sync failed', e));
            }
          }
          return data;
        } catch (error) {
          if (__DEV__) {
            console.log('[useReports] API failed, trying cache...');
          }
          const cachedData = await offlineStorage.getReports();
          if (cachedData) {
            return reportsFromCacheForPage(cachedData, page, pageSize);
          }
          return emptyReportsPage(page, pageSize, 0);
        }
      }
      // Offline: load from cache and return correct page (or empty for other pages)
      if (__DEV__) {
        console.log('[useReports] Offline, using cache...');
      }
      const cachedData = await offlineStorage.getReports();
      if (cachedData) {
        return reportsFromCacheForPage(cachedData, page, pageSize);
      }
      return emptyReportsPage(1, pageSize, 0);
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
