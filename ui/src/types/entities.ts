// Entity types based on the MCP server
export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'pending' | 'completed' | 'archived';

export interface Project {
  id: string;
  name: string;
  description?: string;
  isArchived: boolean;
  createdAt: string;
  modifiedAt: string;
  taskCount?: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  tags?: string[];
  remarks?: string;
  parentTaskId?: string;
  createdAt: string;
  modifiedAt: string;
  archivedAt?: string;
}

export interface TaskWithProject extends Task {
  project?: Project;
}
