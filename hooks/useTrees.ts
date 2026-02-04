import { useQuery } from '@tanstack/react-query';
import { treeService } from '@/services/treeService';
import type { TreesQueryParams } from '@/types/tree';

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
 */
export function useTrees(params?: TreesQueryParams) {
  return useQuery({
    queryKey: treeKeys.list(params),
    queryFn: () => treeService.getTrees(params),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}
