import { describe, test, expect, mock, beforeEach } from "bun:test";
import { TaskService } from "../src/services/taskService";
import type { Task, TaskStatus, TaskPriority } from "../src/types";

// Mock repositories
const mockTaskRepository = {
  create: mock(),
  save: mock(),
  saveMany: mock(),
  getById: mock(),
  listAll: mock(),
  listByProject: mock(),
};

const mockProjectService = {
  ensureActiveProject: mock(),
  getByIdOrThrow: mock(),
  listProjects: mock(),
};

describe("TaskService", () => {
  let taskService: TaskService;

  beforeEach(() => {
    // Reset all mocks
    Object.values(mockTaskRepository).forEach((mockFn) => mockFn.mockClear());
    Object.values(mockProjectService).forEach((mockFn) => mockFn.mockClear());

    // Set default mock behaviors
    mockProjectService.ensureActiveProject.mockResolvedValue({
      id: "project-1",
      name: "Test Project",
      archived: false,
    });
    mockProjectService.getByIdOrThrow.mockResolvedValue({
      id: "project-1",
      name: "Test Project",
      archived: false,
    });
    mockProjectService.listProjects.mockResolvedValue([]);
    mockTaskRepository.getById.mockResolvedValue(null);
    mockTaskRepository.listByProject.mockResolvedValue([]);

    // Create service with mocked repositories
    taskService = new TaskService(
      mockTaskRepository as any,
      mockProjectService as any
    );
  });

  describe("createTask", () => {
    test("creates a task successfully", async () => {
      const taskData = {
        projectId: "project-1",
        title: "Test Task",
        description: "Test description",
        remarks: "Initial remarks",
        priority: "high" as TaskPriority,
        dueDate: "2025-12-01T10:00:00Z",
        tags: ["urgent", "backend"],
        parentTaskId: undefined,
      };

      const result = await taskService.createTask(taskData);

      expect(result).toBeDefined();
      expect(result.title).toBe("Test Task");
      expect(result.description).toBe("Test description");
      expect(result.remarks).toBe("Initial remarks");
      expect(result.priority).toBe("high");
      expect(result.dueDate).toBe("2025-12-01T10:00:00Z");
      expect(result.tags).toEqual(["urgent", "backend"]);
      expect(result.status).toBe("todo");
      expect(result.archived).toBe(false);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      expect(mockTaskRepository.create).toHaveBeenCalledTimes(1);
    });

    test("creates task with minimal data", async () => {
      const taskData = {
        projectId: "project-1",
        title: "Minimal Task",
      };

      const result = await taskService.createTask(taskData);

      expect(result.title).toBe("Minimal Task");
      expect(result.description).toBeUndefined();
      expect(result.remarks).toBeUndefined();
      expect(result.priority).toBeUndefined();
      expect(result.dueDate).toBeUndefined();
      expect(result.tags).toEqual([]);
      expect(result.parentTaskId).toBeUndefined();
    });

    test("handles parent task relationships", async () => {
      const parentTask = {
        id: "parent-123",
        projectId: "project-1",
        title: "Parent Task",
        status: "todo" as TaskStatus,
        archived: false,
        tags: [],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockTaskRepository.getById.mockResolvedValue(parentTask);

      const taskData = {
        projectId: "project-1",
        title: "Subtask",
        parentTaskId: "parent-123",
      };

      const result = await taskService.createTask(taskData);

      expect(result.parentTaskId).toBe("parent-123");
      expect(mockTaskRepository.getById).toHaveBeenCalledWith("parent-123");
    });

    test("creates task with provided status", async () => {
      const taskData = {
        projectId: "project-1",
        title: "In progress task",
        status: "pending" as TaskStatus,
      };

      const result = await taskService.createTask(taskData);

      expect(result.status).toBe("pending");
      expect(result.archived).toBe(false);
      expect(mockTaskRepository.create).toHaveBeenCalledTimes(1);
    });

    test("creates archived task when status is archived", async () => {
      const taskData = {
        projectId: "project-1",
        title: "Archived task",
        status: "archived" as TaskStatus,
      };

      const result = await taskService.createTask(taskData);

      expect(result.status).toBe("archived");
      expect(result.archived).toBe(true);
    });
  });

  describe("updateTask", () => {
    test("updates task successfully", async () => {
      const existingTask = {
        id: "task-1",
        projectId: "project-1",
        title: "Old Title",
        description: "Old description",
        remarks: "Old remarks",
        status: "todo" as TaskStatus,
        priority: "low" as TaskPriority,
        tags: ["old"],
        archived: false,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockTaskRepository.getById.mockResolvedValue(existingTask);

      const updateData = {
        taskId: "task-1",
        title: "New Title",
        remarks: "Updated remarks",
        priority: "high" as TaskPriority,
        tags: ["new", "urgent"],
      };

      const result = await taskService.updateTask(updateData);

      expect(result).toBeDefined();
      expect(result!.title).toBe("New Title");
      expect(result!.remarks).toBe("Updated remarks");
      expect(result!.priority).toBe("high");
      expect(result!.tags).toEqual(["new", "urgent"]);
      expect(result!.description).toBe("Old description"); // Unchanged
      expect(result!.updatedAt).not.toBe(existingTask.updatedAt);

      expect(mockTaskRepository.save).toHaveBeenCalledTimes(1);
    });

    test("returns error when task not found", async () => {
      mockTaskRepository.getById.mockResolvedValue(null);

      await expect(
        taskService.updateTask({
          taskId: "nonexistent",
          title: "New Title",
        })
      ).rejects.toThrow("Task nonexistent does not exist.");
    });

    test("updates remarks without changing other fields", async () => {
      const existingTask = {
        id: "task-1",
        projectId: "project-1",
        title: "Test Task",
        description: "Original description",
        remarks: "Old remarks",
        status: "todo" as TaskStatus,
        priority: "medium" as TaskPriority,
        tags: ["important"],
        archived: false,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockTaskRepository.getById.mockResolvedValue(existingTask);

      const updateData = {
        taskId: "task-1",
        remarks: "New remarks after review",
      };

      const result = await taskService.updateTask(updateData);

      expect(result!.remarks).toBe("New remarks after review");
      expect(result!.title).toBe("Test Task"); // Unchanged
      expect(result!.description).toBe("Original description"); // Unchanged
      expect(result!.priority).toBe("medium"); // Unchanged

      expect(mockTaskRepository.save).toHaveBeenCalledTimes(1);
    });

    test("updates status and archived flag", async () => {
      const existingTask = {
        id: "task-1",
        projectId: "project-1",
        title: "Test Task",
        description: "Original description",
        remarks: "Old remarks",
        status: "todo" as TaskStatus,
        priority: "medium" as TaskPriority,
        tags: ["important"],
        archived: false,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockTaskRepository.getById.mockResolvedValue(existingTask);

      const result = await taskService.updateTask({
        taskId: "task-1",
        status: "archived",
      });

      expect(result.status).toBe("archived");
      expect(result.archived).toBe(true);
      expect(mockTaskRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("moveTask", () => {
    test("moves task to new status", async () => {
      const existingTask = {
        id: "task-1",
        projectId: "project-1",
        title: "Test Task",
        status: "todo" as TaskStatus,
        archived: false,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockTaskRepository.getById.mockResolvedValue(existingTask);

      const result = await taskService.moveTask({
        taskId: "task-1",
        status: "completed",
      });

      expect(result.status).toBe("completed");
      expect(result.updatedAt).not.toBe(existingTask.updatedAt);
      expect(mockTaskRepository.save).toHaveBeenCalledTimes(1);
    });

    test("archives task when status is archived", async () => {
      const existingTask = {
        id: "task-1",
        projectId: "project-1",
        title: "Test Task",
        status: "completed" as TaskStatus,
        archived: false,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockTaskRepository.getById.mockResolvedValue(existingTask);

      const result = await taskService.moveTask({
        taskId: "task-1",
        status: "archived",
      });

      expect(result.status).toBe("archived");
      expect(result.archived).toBe(true);
    });
  });

  describe("listTasks", () => {
    test("lists tasks with filters", async () => {
      const mockTasks = [
        {
          id: "task-1",
          projectId: "project-1",
          title: "Task 1",
          status: "todo" as TaskStatus,
          priority: "high" as TaskPriority,
          archived: false,
          tags: ["urgent"],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "task-2",
          projectId: "project-1",
          title: "Task 2",
          status: "completed" as TaskStatus,
          priority: "low" as TaskPriority,
          archived: false,
          tags: ["done"],
          createdAt: "2025-01-02T00:00:00Z",
          updatedAt: "2025-01-02T00:00:00Z",
        },
      ];

      mockTaskRepository.listByProject.mockResolvedValue(mockTasks);

      const result = await taskService.listTasks({
        projectId: "project-1",
        status: "todo",
        priority: "high",
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("task-1");
      expect(mockTaskRepository.listByProject).toHaveBeenCalledWith(
        "project-1"
      );
    });

    test("applies sorting", async () => {
      const mockTasks = [
        {
          id: "task-1",
          title: "B Task",
          priority: "low" as TaskPriority,
          createdAt: "2025-01-02T00:00:00Z",
          status: "todo" as TaskStatus,
          archived: false,
          tags: [],
          updatedAt: "2025-01-02T00:00:00Z",
          projectId: "project-1",
        },
        {
          id: "task-2",
          title: "A Task",
          priority: "high" as TaskPriority,
          createdAt: "2025-01-01T00:00:00Z",
          status: "todo" as TaskStatus,
          archived: false,
          tags: [],
          updatedAt: "2025-01-01T00:00:00Z",
          projectId: "project-1",
        },
      ];

      mockTaskRepository.listByProject.mockResolvedValue(mockTasks);

      const result = await taskService.listTasks({
        projectId: "project-1",
        sortBy: "title",
        order: "asc",
      });

      expect(result[0].title).toBe("A Task");
      expect(result[1].title).toBe("B Task");
    });
  });
});
