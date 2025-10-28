import { mcpClient } from '../mcp/client';
import type {
  CreateProjectInput,
  ListProjectsResponse,
} from '../../types/api';
import type { Project } from '../../types/entities';

export const projectsApi = {
  list: async (includeArchived: boolean = false): Promise<Project[]> => {
    const response = await mcpClient.call<ListProjectsResponse>('list_projects', {
      includeArchived,
    });
    return response.projects;
  },

  create: async (input: CreateProjectInput): Promise<Project> => {
    const response = await mcpClient.call<{ project: Project }>('create_project', input);
    return response.project;
  },

  archive: async (projectId: string): Promise<Project> => {
    const response = await mcpClient.call<{ project: Project }>('archive_project', {
      projectId,
    });
    return response.project;
  },
};
