import { apiClient } from '../mcp/client';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  ListTasksResponse,
} from '../../types/api';
import type { Task } from '../../types/entities';
import type { TaskFilters, TaskSort } from '../../types/filters';

export const tasksApi = {
  list: async (filters?: TaskFilters & TaskSort): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters?.projectId) params.set('projectId', filters.projectId);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.includeArchived) params.set('includeArchived', 'true');
    if (filters?.sortBy) params.set('sortBy', filters.sortBy);
    if (filters?.order) params.set('order', filters.order);

    const queryString = params.toString();
    const response = await apiClient.get<ListTasksResponse>(
      `/tasks${queryString ? `?${queryString}` : ''}`
    );
    return response.tasks;
  },

  create: async (input: CreateTaskInput): Promise<Task> => {
    const response = await apiClient.post<{ task: Task }>('/tasks', input);
    return response.task;
  },

  update: async (input: UpdateTaskInput): Promise<Task> => {
    const { taskId, ...data } = input;
    const response = await apiClient.patch<{ task: Task }>(`/tasks/${taskId}`, data);
    return response.task;
  },

  move: async (input: MoveTaskInput): Promise<Task> => {
    const response = await apiClient.post<{ task: Task }>(
      `/tasks/${input.taskId}/move`,
      { status: input.status }
    );
    return response.task;
  },

  archive: async (taskId: string): Promise<Task> => {
    const response = await apiClient.post<{ task: Task }>(`/tasks/${taskId}/archive`);
    return response.task;
  },
};
