import { randomUUID } from "node:crypto";
import type { ProjectService } from "./projectService";
import type { TaskRepository } from "../repositories/taskRepository";
import type {
  ListTasksOptions,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
} from "../types";

interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  tags?: string[];
  parentTaskId?: string;
}

interface UpdateTaskInput {
  taskId: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  tags?: string[];
}

interface MoveTaskInput {
  taskId: string;
  status: TaskStatus;
}

export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly projectService: ProjectService
  ) {}

  async createTask(input: CreateTaskInput): Promise<Task> {
    const project = await this.projectService.ensureActiveProject(
      input.projectId
    );

    // Validate parentTaskId if provided
    if (input.parentTaskId) {
      const parentTask = await this.taskRepository.getById(input.parentTaskId);
      if (!parentTask) {
        throw new Error(`Parent task ${input.parentTaskId} does not exist.`);
      }
      if (parentTask.projectId !== input.projectId) {
        throw new Error(`Parent task must be in the same project.`);
      }
    }

    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      projectId: project.id,
      title: input.title.trim(),
      description: input.description?.trim(),
      status: "todo",
      priority: input.priority,
      dueDate: input.dueDate,
      tags: input.tags || [],
      parentTaskId: input.parentTaskId,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };

    await this.taskRepository.create(task);
    return task;
  }

  async listTasks(options: ListTasksOptions = {}): Promise<Task[]> {
    const includeArchived = Boolean(options.includeArchived);
    let projectMap: Map<string, Project> | null = null;
    let tasks: Task[];
    if (options.projectId) {
      const project = await this.projectService.getByIdOrThrow(
        options.projectId
      );
      if (project.archived && !includeArchived) {
        return [];
      }
      tasks = await this.taskRepository.listByProject(project.id);
      if (!includeArchived) {
        tasks = tasks.filter((task) => !task.archived);
      }
    } else {
      if (!includeArchived) {
        const projects = await this.projectService.listProjects({
          includeArchived: true,
        });
        projectMap = new Map(projects.map((project) => [project.id, project]));
      }

      tasks = await this.taskRepository.listAll();
      if (!includeArchived) {
        tasks = tasks.filter((task) => {
          if (task.archived) {
            return false;
          }
          if (!projectMap) {
            return true;
          }
          const project = projectMap.get(task.projectId);
          if (!project) {
            return false;
          }
          return !project.archived;
        });
      }
    }

    // Apply filters
    if (options.status) {
      tasks = tasks.filter((task) => task.status === options.status);
    }
    if (options.priority) {
      tasks = tasks.filter((task) => task.priority === options.priority);
    }
    if (options.tags && options.tags.length > 0) {
      tasks = tasks.filter((task) =>
        options.tags!.some((tag) => task.tags.includes(tag))
      );
    }
    if (options.hasSubtasks !== undefined) {
      const allTasks = await this.taskRepository.listAll();
      const taskIdsWithSubtasks = new Set(
        allTasks.filter((t) => t.parentTaskId).map((t) => t.parentTaskId!)
      );
      if (options.hasSubtasks) {
        tasks = tasks.filter((task) => taskIdsWithSubtasks.has(task.id));
      } else {
        tasks = tasks.filter((task) => !taskIdsWithSubtasks.has(task.id));
      }
    }

    // Apply sorting
    tasks = this.sortTasks(
      tasks,
      options.sortBy || "createdAt",
      options.order || "asc"
    );

    return tasks;
  }

  private sortTasks(
    tasks: Task[],
    sortBy: string,
    order: "asc" | "desc"
  ): Task[] {
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
          aValue = a.priority ? priorityOrder[a.priority] : 0;
          bValue = b.priority ? priorityOrder[b.priority] : 0;
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

  async moveTask(input: MoveTaskInput): Promise<Task> {
    const task = await this.taskRepository.getById(input.taskId);
    if (!task) {
      throw new Error(`Task ${input.taskId} does not exist.`);
    }

    const project = await this.projectService.getByIdOrThrow(task.projectId);
    if (project.archived) {
      throw new Error("Cannot update tasks inside an archived project.");
    }

    if (!VALID_STATUSES.has(input.status)) {
      throw new Error(
        `Unsupported task status "${input.status}". Valid values: ${[
          ...VALID_STATUSES,
        ].join(", ")}`
      );
    }

    const now = new Date().toISOString();
    const archived = input.status === "archived";
    const updated: Task = {
      ...task,
      status: input.status,
      archived,
      updatedAt: now,
    };

    await this.taskRepository.save(updated);
    return updated;
  }

  async updateTask(input: UpdateTaskInput): Promise<Task> {
    const task = await this.taskRepository.getById(input.taskId);
    if (!task) {
      throw new Error(`Task ${input.taskId} does not exist.`);
    }

    const project = await this.projectService.getByIdOrThrow(task.projectId);
    if (project.archived) {
      throw new Error("Cannot update tasks inside an archived project.");
    }

    const now = new Date().toISOString();
    const updated: Task = {
      ...task,
      title: input.title !== undefined ? input.title.trim() : task.title,
      description:
        input.description !== undefined
          ? input.description?.trim()
          : task.description,
      priority: input.priority !== undefined ? input.priority : task.priority,
      dueDate: input.dueDate !== undefined ? input.dueDate : task.dueDate,
      tags: input.tags !== undefined ? input.tags : task.tags,
      updatedAt: now,
    };

    await this.taskRepository.save(updated);
    return updated;
  }

  async archiveTask(taskId: string): Promise<Task> {
    return this.moveTask({ taskId, status: "archived" });
  }
}

const VALID_STATUSES: Set<TaskStatus> = new Set([
  "todo",
  "pending",
  "completed",
  "archived",
]);
