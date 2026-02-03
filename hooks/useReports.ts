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
 */
export function useReports(params?: ReportsQueryParams) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: () => reportService.getReports(params),
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
