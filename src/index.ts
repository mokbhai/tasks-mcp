import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { getConfig } from "./config";
import { getRedisClient } from "./storage/redisClient";
import { ProjectRepository } from "./repositories/projectRepository";
import { TaskRepository } from "./repositories/taskRepository";
import { ProjectService } from "./services/projectService";
import { TaskService } from "./services/taskService";
import { ensureAuthorized } from "./auth/basicAuth";
import type { TaskStatus, Project } from "./types";
import express from "express";

const TASK_STATUS_ENUM: [TaskStatus, TaskStatus, TaskStatus, TaskStatus] = [
  "todo",
  "pending",
  "completed",
  "archived",
];

const main = async () => {
  const config = getConfig();
  const redis = getRedisClient(config);

  const projectRepository = new ProjectRepository(redis);
  const taskRepository = new TaskRepository(redis);
  const projectService = new ProjectService(projectRepository, taskRepository);
  const taskService = new TaskService(taskRepository, projectService);

  const server = new McpServer({
    name: config.serverName,
    version: config.serverVersion,
    description: "Task and project management MCP server powered by Redis.",
  });

  const guardAuth = (metadata?: Record<string, unknown>) => {
    console.log("Provided Auth Header:", metadata);
    ensureAuthorized(config, metadata);
  };

  const metadataFromContext = (
    context: unknown
  ): Record<string, unknown> | undefined => {
    if (!context || typeof context !== "object") {
      return undefined;
    }
    const record = context as Record<string, unknown>;
    const metadata = (record as any).requestInfo;
    if (metadata && typeof metadata === "object" && "headers" in metadata) {
      return (metadata as any).headers as Record<string, unknown>;
    }
    return undefined;
  };

  server.registerTool(
    "create_project",
    {
      title: "Create Project",
      description:
        "Create new project containers for tasks. Multiple names can be provided separated by commas.",
      inputSchema: {
        names: z
          .string()
          .min(1, "Names cannot be empty.")
          .max(1000, "Names too long."),
        description: z
          .string()
          .max(2000, "Description is too long.")
          .optional(),
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
      const projects = [];
      for (const name of names) {
        const project = await projectService.createProject({
          name,
          description: input.description,
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

  server.registerTool(
    "create_task",
    {
      title: "Create Task",
      description:
        "Create new tasks inside a project. Multiple titles can be provided separated by commas.",
      inputSchema: {
        projectName: z.string(),
        titles: z
          .string()
          .min(1, "Task titles cannot be empty.")
          .max(2000, "Task titles too long."),
        description: z
          .string()
          .max(4000, "Task description is too long.")
          .optional(),
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const { projectName, titles, description } = input;
      const found = await projectService.getByName(projectName);
      if (!found) {
        throw new Error(`Project with name "${projectName}" not found.`);
      }
      if (found.archived) {
        throw new Error(`Project "${projectName}" is archived.`);
      }
      const project = found;
      const titleList = titles
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
      if (titleList.length === 0) {
        throw new Error("No valid titles provided.");
      }
      const tasks = [];
      for (const title of titleList) {
        const task = await taskService.createTask({
          projectId: project.id,
          title,
          description,
        });
        tasks.push(task);
      }
      return toJsonResponse(tasks);
    }
  );

  server.registerTool(
    "list_tasks",
    {
      title: "List Tasks",
      description:
        "List tasks across projects. Archived items are excluded unless includeArchived is true.",
      inputSchema: {
        projectName: z.string().optional(),
        status: z.enum(TASK_STATUS_ENUM).optional(),
        includeArchived: z.boolean().optional(),
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      let projectId: string | undefined;
      if (input?.projectName) {
        const project = await projectService.getByName(input.projectName);
        if (!project) {
          throw new Error(`Project "${input.projectName}" not found.`);
        }
        projectId = project.id;
      }
      const tasks = await taskService.listTasks({
        projectId,
        includeArchived: input?.includeArchived,
        status: input?.status,
      });
      return toJsonResponse(tasks);
    }
  );

  server.registerTool(
    "move_task",
    {
      title: "Move Task",
      description:
        "Move a task between todo, pending, completed, or archived states.",
      inputSchema: {
        taskId: z.string().min(1, "Task id is required."),
        status: z.enum(TASK_STATUS_ENUM),
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const task = await taskService.moveTask(input);
      return toJsonResponse(task);
    }
  );

  server.registerTool(
    "archive_task",
    {
      title: "Archive Task",
      description:
        "Archive individual tasks. Multiple task IDs can be provided separated by commas.",
      inputSchema: {
        taskIds: z.string().min(1, "Task ids are required."),
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const ids = input.taskIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);
      if (ids.length === 0) {
        throw new Error("No valid task ids provided.");
      }
      const tasks = [];
      for (const id of ids) {
        const task = await taskService.archiveTask(id);
        tasks.push(task);
      }
      return toJsonResponse(tasks);
    }
  );

  server.registerTool(
    "search_tasks",
    {
      title: "Search Tasks",
      description: "Search tasks by title or description across all projects.",
      inputSchema: {
        query: z.string().min(1, "Query is required."),
        includeArchived: z.boolean().optional(),
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const allTasks = await taskService.listTasks({
        includeArchived: input?.includeArchived,
      });
      const query = input.query.toLowerCase();
      const matchingTasks = allTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query))
      );
      return toJsonResponse(matchingTasks);
    }
  );

  server.registerResource(
    "tasks",
    new ResourceTemplate("tasks://{projectName}", { list: undefined }),
    {
      title: "Tasks in Project",
      description: "List of tasks in a specific project",
    },
    async (uri, { projectName }) => {
      const projectNameStr = Array.isArray(projectName)
        ? projectName[0]
        : projectName;
      const project = await projectService.getByName(projectNameStr);
      if (!project) {
        throw new Error(`Project "${projectNameStr}" not found.`);
      }
      const tasks = await taskService.listTasks({ projectId: project.id });
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(tasks, null, 2),
          },
        ],
      };
    }
  );

  server.registerPrompt(
    "task_management",
    {
      description:
        "Guidance for managing tasks: search, update, move, and archive based on descriptions",
    },
    async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "You are a task management assistant. Use the available tools to search for tasks by title or description, list tasks in projects, create new tasks, move tasks to different statuses (todo, pending, completed, archived), or archive them. When a user wants to update tasks based on a description, first use search_tasks to find matching tasks, then use move_task or archive_task on the relevant task IDs.",
            },
          },
        ],
      };
    }
  );

  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req: any, res: any) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);

    res.on("close", () => {
      transport.close();
    });

    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT || "3000");
  const serverInstance = app
    .listen(port, () => {
      console.log(
        `[mcp] Server "${config.serverName}" is ready on http://localhost:${port}/mcp`
      );
    })
    .on("error", (error: any) => {
      console.error("Server error:", error);
      process.exit(1);
    });

  const shutdown = async () => {
    try {
      serverInstance.close();
      await redis.quit();
    } catch {
      redis.disconnect();
    }
  };

  process.on("SIGINT", () => {
    shutdown()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });

  process.on("SIGTERM", () => {
    shutdown()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });
};

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

main().catch((error) => {
  console.error("[mcp] Fatal error", error);
  process.exit(1);
});
