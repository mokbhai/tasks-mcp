import { apiClient } from '../mcp/client';
import type {
  CreateProjectInput,
  ListProjectsResponse,
} from '../../types/api';
import type { Project } from '../../types/entities';

export const projectsApi = {
  list: async (includeArchived: boolean = false): Promise<Project[]> => {
    const response = await apiClient.get<ListProjectsResponse>(
      `/projects?includeArchived=${includeArchived}`
    );
    return response.projects;
  },

  create: async (input: CreateProjectInput): Promise<Project> => {
    const response = await apiClient.post<{ project: Project }>('/projects', input);
    return response.project;
  },

  archive: async (projectId: string): Promise<Project> => {
    const response = await apiClient.post<{ project: Project }>(
      `/projects/${projectId}/archive`
    );
    return response.project;
  },
};
