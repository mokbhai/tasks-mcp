export type TaskStatus = "todo" | "pending" | "completed" | "archived";

export interface Project {
  id: string;
  name: string;
  description?: string;
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
}
