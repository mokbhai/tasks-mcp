export type TaskStatus = "todo" | "pending" | "completed" | "archived";
export type TaskPriority = "low" | "medium" | "high";

export interface Project {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string; // ISO string
  tags: string[];
  parentTaskId?: string; // For subtasks
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListProjectsOptions {
  includeArchived?: boolean;
}

export interface ListTasksOptions {
  projectId?: string;
  includeArchived?: boolean;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[]; // Filter tasks that have any of these tags
  hasSubtasks?: boolean; // true to include only tasks with subtasks, false for only without
  sortBy?: "createdAt" | "dueDate" | "priority" | "title";
  order?: "asc" | "desc";
}
