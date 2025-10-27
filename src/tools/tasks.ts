import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ProjectService } from "../services/projectService";
import type { TaskService } from "../services/taskService";
import type { Project, TaskStatus, TaskPriority } from "../types";
import {
  ProjectNameSchema,
  TaskTitlesSchema,
  TaskTitleSchema,
  TaskDescriptionSchema,
  PrioritySchema,
  DueDateSchema,
  TagsSchema,
  TaskIdSchema,
  StatusSchema,
  SortBySchema,
  OrderSchema,
  BooleanSchema,
  SearchQuerySchema,
} from "../validation";

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
        projectName: ProjectNameSchema,
        titles: TaskTitlesSchema,
        description: TaskDescriptionSchema,
        priority: PrioritySchema.optional(),
        dueDate: DueDateSchema,
        tags: TagsSchema,
        parentTaskId: TaskIdSchema.optional(),
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
      // titles is now already an array from TaskTitlesSchema transform
      const titleList = titles;
      const tasks = [];
      for (const title of titleList) {
        const task = await taskService.createTask({
          projectId: project.id,
          title,
          description,
          priority: priority as TaskPriority | undefined,
          dueDate,
          tags,
          parentTaskId,
        });
        tasks.push(task);
      }
      const suggestions: string[] = [];
      if (tasks.length > 0) {
        suggestions.push(
          "Use update_task to modify priority, due dates, or tags after creation"
        );
        suggestions.push(
          "Create subtasks by setting parentTaskId to this task's ID"
        );
        if (!tags || tags.length === 0) {
          suggestions.push(
            "Add tags for better organization (e.g., 'urgent', 'backend', 'feature')"
          );
        }
        if (!priority) {
          suggestions.push(
            "Set priority levels: 'high' for urgent tasks, 'medium' for important, 'low' for nice-to-have"
          );
        }
        if (!dueDate) {
          suggestions.push(
            "Set due dates for time-sensitive tasks using ISO format (e.g., '2025-11-01T10:00:00Z')"
          );
        }
      }

      return toJsonResponse(tasks, suggestions);
    }
  );

  server.registerTool(
    "list_tasks",
    {
      title: "List Tasks",
      description:
        "List tasks across projects. Archived items are excluded unless includeArchived is true. Supports filtering by status, priority, tags, and subtasks. Supports sorting by createdAt, dueDate, priority, or title.",
      inputSchema: {
        projectName: ProjectNameSchema.optional(),
        status: StatusSchema.optional(),
        priority: PrioritySchema.optional(),
        tags: TagsSchema, // comma-separated tags to filter by
        hasSubtasks: BooleanSchema.optional(), // true for tasks with subtasks, false for without
        sortBy: SortBySchema.optional(),
        order: OrderSchema.optional(),
        includeArchived: BooleanSchema.optional(),
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
      const parsedTags = input?.tags || [];
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

      // Add suggestions based on the results
      const suggestions: string[] = [];
      if (tasks.length === 0) {
        if (input?.projectName) {
          suggestions.push(
            `Check if project "${input.projectName}" exists and has tasks`
          );
          suggestions.push(
            "Try listing tasks without project filter to see all tasks"
          );
        }
        if (input?.status) {
          suggestions.push(
            `Try different status filters or remove status filter to see all tasks`
          );
        }
        if (input?.priority) {
          suggestions.push(
            "Try different priority levels or remove priority filter"
          );
        }
        if (parsedTags) {
          suggestions.push(
            "Try different tags or remove tag filter to see more tasks"
          );
        }
        if (!input?.includeArchived) {
          suggestions.push("Include archived tasks with includeArchived=true");
        }
      }

      return toJsonResponse(tasks, suggestions);
    }
  );

  server.registerTool(
    "move_task",
    {
      title: "Move Task",
      description:
        "Move a task between todo, pending, completed, or archived states.",
      inputSchema: {
        taskId: TaskIdSchema,
        status: StatusSchema,
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const task = await taskService.moveTask({
        taskId: input.taskId,
        status: input.status as TaskStatus,
      });

      const suggestions: string[] = [];
      if (task) {
        if (task.status === "completed") {
          suggestions.push(
            "Consider creating follow-up tasks or subtasks for completed work"
          );
          suggestions.push("Use archive_task if this task is no longer needed");
        } else if (task.status === "pending") {
          suggestions.push(
            "Set a due date for pending tasks to track progress"
          );
          suggestions.push("Update priority if this task became more urgent");
        } else if (task.status === "todo") {
          suggestions.push("Break down large tasks into smaller subtasks");
          suggestions.push("Add tags for better organization");
        }
      }

      return toJsonResponse(task, suggestions);
    }
  );

  server.registerTool(
    "update_task",
    {
      title: "Update Task",
      description:
        "Update existing task properties like title, description, priority, due date, and tags.",
      inputSchema: {
        taskId: TaskIdSchema,
        title: TaskTitleSchema.optional(),
        description: TaskDescriptionSchema.optional(),
        priority: PrioritySchema.optional(),
        dueDate: DueDateSchema,
        tags: TagsSchema,
      },
    },
    async (input, extra) => {
      guardAuth(metadataFromContext(extra));
      const { taskId, title, description, priority, dueDate, tags } = input;
      const parsedTags = tags || [];
      const task = await taskService.updateTask({
        taskId,
        title,
        description,
        priority: priority as TaskPriority | undefined,
        dueDate,
        tags: parsedTags,
      });

      const suggestions: string[] = [];
      if (task) {
        suggestions.push("Use list_tasks to see all tasks in the project");
        suggestions.push(
          "Use search_tasks for advanced filtering by tags, priority, or due dates"
        );
        if (task.status === "completed") {
          suggestions.push(
            "Consider creating follow-up tasks or subtasks for completed work"
          );
        }
        if (task.dueDate && new Date(task.dueDate) < new Date()) {
          suggestions.push(
            "Task is overdue - consider updating the due date or priority"
          );
        }
      }

      return toJsonResponse(task, suggestions);
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

      const suggestions: string[] = [];
      if (tasks.length > 0) {
        suggestions.push(
          "Archived tasks can be viewed by setting includeArchived=true in list_tasks or search_tasks"
        );
        suggestions.push(
          "Use search_tasks with 'status:archived' to find archived tasks"
        );
        suggestions.push(
          "Consider creating new tasks to replace archived ones if needed"
        );
      }

      return toJsonResponse(tasks, suggestions);
    }
  );

  server.registerTool(
    "search_tasks",
    {
      title: "Search Tasks",
      description:
        "Search tasks by title or description across all projects. Supports advanced query syntax like 'priority:high due:before:2025-11-01' and tag filtering. Supports sorting.",
      inputSchema: {
        query: SearchQuerySchema, // Can be advanced query or simple text
        tags: TagsSchema, // comma-separated tags to filter by
        sortBy: SortBySchema.optional(),
        order: OrderSchema.optional(),
        includeArchived: BooleanSchema.optional(),
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
      if (input.tags && input.tags.length > 0) {
        filteredTasks = filteredTasks.filter((task) =>
          input.tags.some((tag: string) => task.tags.includes(tag))
        );
      }

      // Apply sorting
      const sortBy = input?.sortBy || "createdAt";
      const order = input?.order || "asc";
      filteredTasks = sortTasks(filteredTasks, sortBy, order);

      // Add suggestions based on the search results
      const suggestions: string[] = [];
      if (filteredTasks.length === 0) {
        suggestions.push(
          "Try using broader search terms or check if the project name is correct"
        );
        suggestions.push(
          "Use advanced query syntax like 'priority:high' or 'status:pending'"
        );
        suggestions.push(
          "Try searching without tags filter to see all matching tasks"
        );
      } else if (input.query && !input.query.includes(":")) {
        suggestions.push(
          "For more precise results, try advanced queries like 'priority:high due:before:2025-11-01'"
        );
      }

      return toJsonResponse(filteredTasks, suggestions);
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

const toJsonResponse = (payload: unknown, suggestions?: string[]) => {
  const result: any = {
    content: [
      { type: "text" as const, text: JSON.stringify(payload, null, 2) },
    ],
  };

  if (Array.isArray(payload)) {
    result.structuredContent = { items: payload };
  } else {
    result.structuredContent = payload as Record<string, unknown>;
  }

  if (suggestions && suggestions.length > 0) {
    result.content.push({
      type: "text" as const,
      text: `\n💡 Suggestions:\n${suggestions.map((s) => `• ${s}`).join("\n")}`,
    });
  }

  return result;
};
