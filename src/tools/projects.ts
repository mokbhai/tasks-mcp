import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ProjectService } from "../services/projectService";
import {
  ProjectNameSchema,
  ProjectDescriptionSchema,
  ProjectNamesSchema,
  ProjectNamesStringSchema,
  TagsSchema,
  BooleanSchema,
} from "../validation";

export function registerProjectTools(
  server: McpServer,
  projectService: ProjectService,
  guardAuth: (metadata?: Record<string, unknown>) => void,
  metadataFromContext: (context: unknown) => Record<string, unknown> | undefined
) {
  server.registerTool(
    "create_project",
    {
      title: "Create Project",
      description:
        "Create new project containers for tasks. Multiple names can be provided separated by commas. Supports tags (comma-separated).",
      inputSchema: {
        names: ProjectNamesSchema,
        description: ProjectDescriptionSchema,
        tags: TagsSchema,
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const { names, description, tags } = input;
      // names is now already an array from ProjectNamesSchema transform
      const projects = [];
      for (const name of names) {
        const project = await projectService.createProject({
          name,
          description,
          tags,
        });
        projects.push(project);
      }
      return toJsonResponse(projects);
    }
  );

  server.registerTool(
    "list_projects",
    {
      title: "List Projects",
      description:
        "List projects. Archived projects are excluded unless includeArchived is true.",
      inputSchema: {
        includeArchived: BooleanSchema.optional(),
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const projects = await projectService.listProjects(
        input?.includeArchived ? { includeArchived: true } : {}
      );
      return toJsonResponse(projects);
    }
  );

  server.registerTool(
    "archive_project",
    {
      title: "Archive Project",
      description:
        "Archive projects and all of their tasks. Multiple project names can be provided separated by commas.",
      inputSchema: {
        projectNames: ProjectNamesStringSchema,
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const { projectNames } = input;
      // projectNames is now already an array from ProjectNamesStringSchema transform
      const projects = [];
      for (const name of projectNames) {
        const project = await projectService.archiveProject(name);
        projects.push(project);
      }
      return toJsonResponse(projects);
    }
  );
}

const toJsonResponse = (payload: unknown) => {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(payload, null, 2) },
    ],
    structuredContent: Array.isArray(payload)
      ? { items: payload }
      : (payload as Record<string, unknown>),
  };
};
