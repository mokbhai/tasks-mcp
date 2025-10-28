import type Redis from "ioredis";
import type { Project } from "../types";
import { getLogger } from "../logger";

const PROJECT_INDEX_KEY = "projects:index";
const projectKey = (id: string) => `project:${id}`;

const parseProject = (value: string | null): Project | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as Project;
  } catch (error) {
    getLogger().error("Failed to parse project from Redis", {
      error,
      rawValue: value,
    });
    return null;
  }
};

export class ProjectRepository {
  constructor(private readonly redis: Redis) {}

  async create(project: Project): Promise<void> {
    await this.redis
      .multi()
      .set(projectKey(project.id), JSON.stringify(project))
      .sadd(PROJECT_INDEX_KEY, project.id)
      .exec();
  }

  async save(project: Project): Promise<void> {
    await this.redis.set(projectKey(project.id), JSON.stringify(project));
  }

  async getById(id: string): Promise<Project | null> {
    const data = await this.redis.get(projectKey(id));
    return parseProject(data);
  }

  async listAll(): Promise<Project[]> {
    const ids = await this.redis.smembers(PROJECT_INDEX_KEY);
    if (!ids.length) {
      return [];
    }

    const values = await this.redis.mget(...ids.map((id) => projectKey(id)));
    return values
      .map((value) => parseProject(value))
      .filter((project): project is Project => Boolean(project));
  }
}
