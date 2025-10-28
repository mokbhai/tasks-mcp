import type { Project, Task } from './entities';

// API request types
export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags?: string;
  parentTaskId?: string;
}

export interface UpdateTaskInput {
  taskId: string;
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags?: string;
  remarks?: string;
}

export interface MoveTaskInput {
  taskId: string;
  status: 'todo' | 'pending' | 'completed' | 'archived';
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface ListProjectsResponse {
  projects: Project[];
}

export interface ListTasksResponse {
  tasks: Task[];
}

export interface TaskStatistics {
  total: number;
  todo: number;
  pending: number;
  completed: number;
  overdue: number;
}
