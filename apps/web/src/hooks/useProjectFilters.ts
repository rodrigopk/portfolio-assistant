import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ProjectFilters } from '../types/project';

export function useProjectFilters() {
  return useQuery<ProjectFilters>({
    queryKey: ['projectFilters'],
    queryFn: () => api.getProjectFilters(),
    staleTime: 30 * 60 * 1000, // 30 minutes - match server cache
    gcTime: 60 * 60 * 1000, // 60 minutes
  });
}
