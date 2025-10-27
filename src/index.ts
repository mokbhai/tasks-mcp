import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { getConfig } from "./config";
import { getRedisClient } from "./storage/redisClient";
import { ProjectRepository } from "./repositories/projectRepository";
import { TaskRepository } from "./repositories/taskRepository";
import { ProjectService } from "./services/projectService";
import { TaskService } from "./services/taskService";
import { ensureAuthorized } from "./auth/basicAuth";
import type { TaskStatus } from "./types";
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
    ensureAuthorized(config, metadata);
  };

  const metadataFromContext = (
    context: unknown
  ): Record<string, unknown> | undefined => {
    if (!context || typeof context !== "object") {
      return undefined;
    }
    const record = context as Record<string, unknown>;
    const metadata = record.metadata;
    if (metadata && typeof metadata === "object") {
      return metadata as Record<string, unknown>;
    }
    return undefined;
  };

  server.registerTool(
    "create_project",
    {
      title: "Create Project",
      description: "Create a new project container for tasks.",
      inputSchema: {
        name: z
          .string()
          .min(1, "Project name cannot be empty.")
          .max(200, "Project name is too long."),
        description: z
          .string()
          .max(2000, "Description is too long.")
          .optional(),
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const project = await projectService.createProject(input);
      return toJsonResponse(project);
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
        input?.includeArchived
          ? { includeArchived: true }
          : {}
      );
      return toJsonResponse(projects);
    }
  );

  server.registerTool(
    "archive_project",
    {
      title: "Archive Project",
      description: "Archive a project and all of its tasks.",
      inputSchema: {
        projectId: z.string().min(1, "Project id is required."),
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const project = await projectService.archiveProject(input.projectId);
      return toJsonResponse(project);
    }
  );

  server.registerTool(
    "create_task",
    {
      title: "Create Task",
      description:
        "Create a new task inside a project. Defaults to todo status.",
      inputSchema: {
        projectId: z.string().min(1, "Project id is required."),
        title: z
          .string()
          .min(1, "Task title cannot be empty.")
          .max(500, "Task title is too long."),
        description: z
          .string()
          .max(4000, "Task description is too long.")
          .optional(),
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const task = await taskService.createTask(input);
      return toJsonResponse(task);
    }
  );

  server.registerTool(
    "list_tasks",
    {
      title: "List Tasks",
      description:
        "List tasks across projects. Archived items are excluded unless includeArchived is true.",
      inputSchema: {
        projectId: z.string().optional(),
        status: z.enum(TASK_STATUS_ENUM).optional(),
        includeArchived: z.boolean().optional(),
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const tasks = await taskService.listTasks({
        projectId: input?.projectId,
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
      description: "Archive an individual task.",
      inputSchema: {
        taskId: z.string().min(1, "Task id is required."),
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const task = await taskService.archiveTask(input.taskId);
      return toJsonResponse(task);
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
  const data = payload as Record<string, unknown>;
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
};

main().catch((error) => {
  console.error("[mcp] Fatal error", error);
  process.exit(1);
});
