import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ProjectsQueryParams } from '../types/project';

export function useProjects(params?: ProjectsQueryParams) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => api.getProjects(params),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}
