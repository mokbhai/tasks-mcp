import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ProjectService } from "../services/projectService";

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
        names: z
          .string()
          .min(1, "Names cannot be empty.")
          .max(1000, "Names too long."),
        description: z
          .string()
          .max(2000, "Description is too long.")
          .optional(),
        tags: z.string().optional(), // comma-separated
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const names = input.names
        .split(",")
        .map((n) => n.trim())
        .filter((n) => n && /^\S+$/.test(n));
      if (names.length === 0) {
        throw new Error("No valid names provided.");
      }
      const parsedTags = input.tags
        ? input.tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t)
        : undefined;
      const projects = [];
      for (const name of names) {
        const project = await projectService.createProject({
          name,
          description: input.description,
          tags: parsedTags,
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
        includeArchived: z.boolean().optional(),
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
        projectNames: z.string().min(1, "Project names are required."),
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const names = input.projectNames
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name);
      if (names.length === 0) {
        throw new Error("No valid project names provided.");
      }
      const projects = [];
      for (const name of names) {
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
