import { randomUUID } from "node:crypto";
import type { ProjectService } from "./projectService";
import type { TaskRepository } from "../repositories/taskRepository";
import type {
  ListTasksOptions,
  Project,
  Task,
  TaskStatus,
} from "../types";

interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
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

    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      projectId: project.id,
      title: input.title.trim(),
      description: input.description?.trim(),
      status: "todo",
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
        tasks = tasks.filter(
          (task) => {
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
          }
        );
      }
    }

    if (options.status) {
      tasks = tasks.filter((task) => task.status === options.status);
    }

    tasks.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    return tasks;
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
