import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ProjectService } from "../services/projectService";
import type { TaskService } from "../services/taskService";
import type { Project, TaskStatus, TaskPriority } from "../types";

const TASK_STATUS_ENUM = ["todo", "pending", "completed", "archived"] as const;
const TASK_PRIORITY_ENUM = ["low", "medium", "high"] as const;

export function registerTaskTools(
  server: McpServer,
  projectService: ProjectService,
  taskService: TaskService,
  guardAuth: (metadata?: Record<string, unknown>) => void,
  metadataFromContext: (context: unknown) => Record<string, unknown> | undefined
) {
  server.registerTool(
    "create_task",
    {
      title: "Create Task",
      description:
        "Create new tasks inside a project. Multiple titles can be provided separated by commas. Supports due dates (ISO string), priority (low/medium/high), tags (comma-separated), and parent task ID for subtasks.",
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
        priority: z.enum(TASK_PRIORITY_ENUM).optional(),
        dueDate: z.string().optional(), // ISO string
        tags: z.string().optional(), // comma-separated
        parentTaskId: z.string().optional(),
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const {
        projectName,
        titles,
        description,
        priority,
        dueDate,
        tags,
        parentTaskId,
      } = input;
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
      const parsedTags = tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t)
        : undefined;
      const tasks = [];
      for (const title of titleList) {
        const task = await taskService.createTask({
          projectId: project.id,
          title,
          description,
          priority: priority as TaskPriority | undefined,
          dueDate,
          tags: parsedTags,
          parentTaskId,
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
        "List tasks across projects. Archived items are excluded unless includeArchived is true. Supports filtering by status, priority, tags, and subtasks. Supports sorting by createdAt, dueDate, priority, or title.",
      inputSchema: {
        projectName: z.string().optional(),
        status: z.enum(TASK_STATUS_ENUM).optional(),
        priority: z.enum(TASK_PRIORITY_ENUM).optional(),
        tags: z.string().optional(), // comma-separated tags to filter by
        hasSubtasks: z.boolean().optional(), // true for tasks with subtasks, false for without
        sortBy: z
          .enum(["createdAt", "dueDate", "priority", "title"])
          .optional(),
        order: z.enum(["asc", "desc"]).optional(),
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
      const parsedTags = input?.tags
        ? input.tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t)
        : undefined;
      const tasks = await taskService.listTasks({
        projectId,
        includeArchived: input?.includeArchived,
        status: input?.status as TaskStatus | undefined,
        priority: input?.priority as TaskPriority | undefined,
        tags: parsedTags,
        hasSubtasks: input?.hasSubtasks,
        sortBy: input?.sortBy,
        order: input?.order,
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
      const task = await taskService.moveTask({
        taskId: input.taskId,
        status: input.status as TaskStatus,
      });
      return toJsonResponse(task);
    }
  );

  server.registerTool(
    "update_task",
    {
      title: "Update Task",
      description:
        "Update existing task properties like title, description, priority, due date, and tags.",
      inputSchema: {
        taskId: z.string().min(1, "Task id is required."),
        title: z.string().min(1, "Title cannot be empty.").optional(),
        description: z
          .string()
          .max(4000, "Task description is too long.")
          .optional(),
        priority: z.enum(TASK_PRIORITY_ENUM).optional(),
        dueDate: z.string().optional(), // ISO string
        tags: z.string().optional(), // comma-separated
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const { taskId, title, description, priority, dueDate, tags } = input;
      const parsedTags = tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t)
        : undefined;
      const task = await taskService.updateTask({
        taskId,
        title,
        description,
        priority: priority as TaskPriority | undefined,
        dueDate,
        tags: parsedTags,
      });
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
      description:
        "Search tasks by title or description across all projects. Supports advanced query syntax like 'priority:high due:before:2025-11-01' and tag filtering. Supports sorting.",
      inputSchema: {
        query: z.string().min(1, "Query is required.").optional(), // Can be advanced query or simple text
        tags: z.string().optional(), // comma-separated tags to filter by
        sortBy: z
          .enum(["createdAt", "dueDate", "priority", "title"])
          .optional(),
        order: z.enum(["asc", "desc"]).optional(),
        includeArchived: z.boolean().optional(),
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const allTasks = await taskService.listTasks({
        includeArchived: input?.includeArchived,
      });

      let filteredTasks = allTasks;

      // Parse advanced query if provided
      if (input.query) {
        const searchFilters = parseSearchQuery(input.query);

        filteredTasks = allTasks.filter((task) => {
          // Check text search
          if (searchFilters.text) {
            const textMatch =
              task.title
                .toLowerCase()
                .includes(searchFilters.text.toLowerCase()) ||
              (task.description &&
                task.description
                  .toLowerCase()
                  .includes(searchFilters.text.toLowerCase()));
            if (!textMatch) return false;
          }

          // Check priority filter
          if (
            searchFilters.priority &&
            task.priority !== searchFilters.priority
          ) {
            return false;
          }

          // Check status filter
          if (searchFilters.status && task.status !== searchFilters.status) {
            return false;
          }

          // Check due date filters
          if (searchFilters.dueBefore && task.dueDate) {
            if (new Date(task.dueDate) >= new Date(searchFilters.dueBefore))
              return false;
          }
          if (searchFilters.dueAfter && task.dueDate) {
            if (new Date(task.dueDate) <= new Date(searchFilters.dueAfter))
              return false;
          }

          return true;
        });
      }

      // Filter by tags if provided
      if (input.tags) {
        const parsedTags = input.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t);
        filteredTasks = filteredTasks.filter((task) =>
          parsedTags.some((tag) => task.tags.includes(tag))
        );
      }

      // Apply sorting
      const sortBy = input?.sortBy || "createdAt";
      const order = input?.order || "asc";
      filteredTasks = sortTasks(filteredTasks, sortBy, order);

      return toJsonResponse(filteredTasks);
    }
  );
}

function parseSearchQuery(query: string): {
  text?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueBefore?: string;
  dueAfter?: string;
  projectName?: string;
} {
  const filters: any = {};
  const parts = query.split(/\s+/);

  for (const part of parts) {
    if (part.includes(":")) {
      const [key, value] = part.split(":", 2);
      switch (key.toLowerCase()) {
        case "priority":
          if (["low", "medium", "high"].includes(value.toLowerCase())) {
            filters.priority = value.toLowerCase() as TaskPriority;
          }
          break;
        case "status":
          if (
            ["todo", "pending", "completed", "archived"].includes(
              value.toLowerCase()
            )
          ) {
            filters.status = value.toLowerCase() as TaskStatus;
          }
          break;
        case "due":
          if (value.startsWith("before:")) {
            filters.dueBefore = value.substring(7);
          } else if (value.startsWith("after:")) {
            filters.dueAfter = value.substring(6);
          }
          break;
        case "project":
          filters.projectName = value;
          break;
      }
    } else {
      // If no colon, treat as text search
      filters.text = (filters.text || "") + " " + part;
    }
  }

  if (filters.text) {
    filters.text = filters.text.trim();
  }

  return filters;
}

function sortTasks(tasks: any[], sortBy: string, order: "asc" | "desc"): any[] {
  return [...tasks].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case "createdAt":
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case "dueDate":
        aValue = a.dueDate ? new Date(a.dueDate) : new Date("9999-12-31");
        bValue = b.dueDate ? new Date(b.dueDate) : new Date("9999-12-31");
        break;
      case "priority":
        const priorityOrder = { low: 1, medium: 2, high: 3 };
        aValue = a.priority
          ? priorityOrder[a.priority as keyof typeof priorityOrder]
          : 0;
        bValue = b.priority
          ? priorityOrder[b.priority as keyof typeof priorityOrder]
          : 0;
        break;
      case "title":
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      default:
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
    }

    if (order === "desc") {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    } else {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    }
  });
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
