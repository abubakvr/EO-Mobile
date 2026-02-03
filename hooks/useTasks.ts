import { useQuery } from '@tanstack/react-query';
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
 */
export function useTasks(params?: TasksQueryParams) {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => taskService.getTasks(params),
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
