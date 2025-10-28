import { mcpClient } from '../mcp/client';
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
    const response = await mcpClient.call<ListTasksResponse>('list_tasks', filters || {});
    return response.tasks;
  },

  create: async (input: CreateTaskInput): Promise<Task> => {
    const response = await mcpClient.call<{ task: Task }>('create_task', input);
    return response.task;
  },

  update: async (input: UpdateTaskInput): Promise<Task> => {
    const response = await mcpClient.call<{ task: Task }>('update_task', input);
    return response.task;
  },

  move: async (input: MoveTaskInput): Promise<Task> => {
    const response = await mcpClient.call<{ task: Task }>('move_task', input);
    return response.task;
  },

  archive: async (taskId: string): Promise<Task> => {
    const response = await mcpClient.call<{ task: Task }>('archive_task', {
      taskId,
    });
    return response.task;
  },
};
