import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../services/api/tasks';
import type { CreateTaskInput, UpdateTaskInput, MoveTaskInput } from '../types/api';
import type { TaskFilters, TaskSort } from '../types/filters';

export const useTasks = (filters?: TaskFilters & TaskSort) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => tasksApi.list(filters),
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: UpdateTaskInput) => tasksApi.update(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useMoveTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: MoveTaskInput) => tasksApi.move(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useArchiveTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.archive(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
