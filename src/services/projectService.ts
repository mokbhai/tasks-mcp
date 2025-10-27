import { randomUUID } from "node:crypto";
import type { ProjectRepository } from "../repositories/projectRepository";
import type { TaskRepository } from "../repositories/taskRepository";
import type { ListProjectsOptions, Project, Task } from "../types";

interface CreateProjectInput {
  name: string;
  description?: string;
}

export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly taskRepository: TaskRepository
  ) {}

  async createProject(input: CreateProjectInput): Promise<Project> {
    const now = new Date().toISOString();
    const project: Project = {
      id: randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim(),
      archived: false,
      createdAt: now,
      updatedAt: now,
    };

    await this.projectRepository.create(project);
    return project;
  }

  async listProjects(options: ListProjectsOptions = {}): Promise<Project[]> {
    const projects = await this.projectRepository.listAll();
    if (options.includeArchived) {
      return projects.sort(sortByCreatedAt);
    }

    return projects.filter((project) => !project.archived).sort(sortByCreatedAt);
  }

  async getByIdOrThrow(id: string): Promise<Project> {
    const project = await this.projectRepository.getById(id);
    if (!project) {
      throw new Error(`Project ${id} does not exist.`);
    }
    return project;
  }

  async ensureActiveProject(projectId: string): Promise<Project> {
    const project = await this.getByIdOrThrow(projectId);
    if (project.archived) {
      throw new Error(`Project ${projectId} is archived.`);
    }
    return project;
  }

  async archiveProject(id: string): Promise<Project> {
    const project = await this.getByIdOrThrow(id);
    if (project.archived) {
      return project;
    }

    const now = new Date().toISOString();
    project.archived = true;
    project.updatedAt = now;
    await this.projectRepository.save(project);

    const tasks = await this.taskRepository.listByProject(project.id);
    const updatedTasks: Task[] = tasks.map((task) => {
      if (task.archived) {
        return task;
      }
      return {
        ...task,
        archived: true,
        status: "archived",
        updatedAt: now,
      };
    });
    await this.taskRepository.saveMany(updatedTasks);

    return project;
  }
}

const sortByCreatedAt = (left: Project, right: Project): number =>
  left.createdAt.localeCompare(right.createdAt);
