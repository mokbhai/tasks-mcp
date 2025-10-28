import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../services/api/projects';
import type { CreateProjectInput } from '../types/api';

export const useProjects = (includeArchived: boolean = false) => {
  return useQuery({
    queryKey: ['projects', includeArchived],
    queryFn: () => projectsApi.list(includeArchived),
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useArchiveProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (projectId: string) => projectsApi.archive(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
