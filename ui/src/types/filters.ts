import type { Priority, TaskStatus } from './entities';

export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  priority?: Priority;
  tags?: string[];
  search?: string;
  hasSubtasks?: boolean;
  includeArchived?: boolean;
}

export interface TaskSort {
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'title';
  order?: 'asc' | 'desc';
}

export interface ProjectFilters {
  includeArchived?: boolean;
}
