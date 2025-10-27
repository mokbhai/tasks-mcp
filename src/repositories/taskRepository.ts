import type Redis from "ioredis";
import type { Task } from "../types";

const TASK_INDEX_KEY = "tasks:index";
const taskKey = (id: string) => `task:${id}`;
const projectTasksKey = (projectId: string) => `project:${projectId}:tasks`;

const parseTask = (value: string | null): Task | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as Task;
  } catch (error) {
    console.error("[taskRepository] failed to parse task:", error);
    return null;
  }
};

export class TaskRepository {
  constructor(private readonly redis: Redis) {}

  async create(task: Task): Promise<void> {
    await this.redis
      .multi()
      .set(taskKey(task.id), JSON.stringify(task))
      .sadd(TASK_INDEX_KEY, task.id)
      .sadd(projectTasksKey(task.projectId), task.id)
      .exec();
  }

  async save(task: Task): Promise<void> {
    await this.redis.set(taskKey(task.id), JSON.stringify(task));
  }

  async saveMany(tasks: Task[]): Promise<void> {
    if (!tasks.length) {
      return;
    }

    const pipeline = this.redis.multi();
    for (const task of tasks) {
      pipeline.set(taskKey(task.id), JSON.stringify(task));
    }
    await pipeline.exec();
  }

  async getById(id: string): Promise<Task | null> {
    const data = await this.redis.get(taskKey(id));
    return parseTask(data);
  }

  async listAll(): Promise<Task[]> {
    const ids = await this.redis.smembers(TASK_INDEX_KEY);
    return this.listByIds(ids);
  }

  async listByProject(projectId: string): Promise<Task[]> {
    const ids = await this.redis.smembers(projectTasksKey(projectId));
    return this.listByIds(ids);
  }

  private async listByIds(ids: string[]): Promise<Task[]> {
    if (!ids.length) {
      return [];
    }

    const values = await this.redis.mget(...ids.map((id) => taskKey(id)));
    return values
      .map((value) => parseTask(value))
      .filter((task): task is Task => Boolean(task));
  }
}
