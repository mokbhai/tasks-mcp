import { describe, test, expect, beforeEach, mock } from "bun:test";
import { ProjectService } from "../src/services/projectService";
import type { Project, Task } from "../src/types";

// Mock repositories
const mockProjectRepository = {
  create: mock(() => Promise.resolve()),
  getById: mock(() => Promise.resolve(null as Project | null)),
  save: mock(() => Promise.resolve()),
  listAll: mock(() => Promise.resolve([] as Project[])),
};

const mockTaskRepository = {
  create: mock(() => Promise.resolve()),
  getById: mock(() => Promise.resolve(null as Task | null)),
  save: mock(() => Promise.resolve()),
  saveMany: mock(() => Promise.resolve()),
  listByProject: mock(() => Promise.resolve([] as Task[])),
  listAll: mock(() => Promise.resolve([] as Task[])),
};

describe("ProjectService", () => {
  let projectService: ProjectService;

  beforeEach(() => {
    // Reset all mocks
    Object.values(mockProjectRepository).forEach((mockFn) =>
      mockFn.mockClear()
    );
    Object.values(mockTaskRepository).forEach((mockFn) => mockFn.mockClear());

    // Create service with mocked repositories
    projectService = new ProjectService(
      mockProjectRepository as any,
      mockTaskRepository as any
    );
  });

  describe("createProject", () => {
    test("creates project successfully", async () => {
      const input = {
        name: "Test Project",
        description: "A test project description",
        tags: ["test", "demo"],
      };

      const result = await projectService.createProject(input);

      expect(result).toBeDefined();
      expect(result.id).toBe("Test Project");
      expect(result.name).toBe("Test Project");
      expect(result.description).toBe("A test project description");
      expect(result.tags).toEqual(["test", "demo"]);
      expect(result.archived).toBe(false);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      expect(mockProjectRepository.create).toHaveBeenCalledWith(result);
    });

    test("creates project with minimal data", async () => {
      const input = {
        name: "Minimal Project",
      };

      const result = await projectService.createProject(input);

      expect(result.name).toBe("Minimal Project");
      expect(result.description).toBeUndefined();
      expect(result.tags).toEqual([]);
    });

    test("trims whitespace from name and description", async () => {
      const input = {
        name: "  Project Name  ",
        description: "  Description with spaces  ",
      };

      const result = await projectService.createProject(input);

      expect(result.name).toBe("Project Name");
      expect(result.description).toBe("Description with spaces");
    });
  });

  describe("listProjects", () => {
    test("lists all active projects by default", async () => {
      const mockProjects = [
        {
          id: "project-1",
          name: "Project 1",
          archived: false,
          tags: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "project-2",
          name: "Project 2",
          archived: true,
          tags: [],
          createdAt: "2025-01-02T00:00:00Z",
          updatedAt: "2025-01-02T00:00:00Z",
        },
      ];

      mockProjectRepository.listAll.mockResolvedValue(mockProjects);

      const result = await projectService.listProjects();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("project-1");
      expect(mockProjectRepository.listAll).toHaveBeenCalledTimes(1);
    });

    test("includes archived projects when requested", async () => {
      const mockProjects = [
        {
          id: "project-1",
          name: "Project 1",
          archived: false,
          tags: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "project-2",
          name: "Project 2",
          archived: true,
          tags: [],
          createdAt: "2025-01-02T00:00:00Z",
          updatedAt: "2025-01-02T00:00:00Z",
        },
      ];

      mockProjectRepository.listAll.mockResolvedValue(mockProjects);

      const result = await projectService.listProjects({
        includeArchived: true,
      });

      expect(result).toHaveLength(2);
    });

    test("sorts projects by created date", async () => {
      const mockProjects = [
        {
          id: "project-2",
          name: "Project 2",
          archived: false,
          tags: [],
          createdAt: "2025-01-02T00:00:00Z",
          updatedAt: "2025-01-02T00:00:00Z",
        },
        {
          id: "project-1",
          name: "Project 1",
          archived: false,
          tags: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ];

      mockProjectRepository.listAll.mockResolvedValue(mockProjects);

      const result = await projectService.listProjects();

      expect(result[0].id).toBe("project-1");
      expect(result[1].id).toBe("project-2");
    });
  });

  describe("getByIdOrThrow", () => {
    test("returns project when found", async () => {
      const mockProject = {
        id: "project-1",
        name: "Test Project",
        archived: false,
        tags: [],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockProjectRepository.getById.mockResolvedValue(mockProject);

      const result = await projectService.getByIdOrThrow("project-1");

      expect(result).toEqual(mockProject);
      expect(mockProjectRepository.getById).toHaveBeenCalledWith("project-1");
    });

    test("throws error when project not found", async () => {
      mockProjectRepository.getById.mockResolvedValue(null);

      await expect(
        projectService.getByIdOrThrow("nonexistent")
      ).rejects.toThrow("Project nonexistent does not exist.");
    });
  });

  describe("ensureActiveProject", () => {
    test("returns active project", async () => {
      const mockProject = {
        id: "project-1",
        name: "Active Project",
        archived: false,
        tags: [],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockProjectRepository.getById.mockResolvedValue(mockProject);

      const result = await projectService.ensureActiveProject("project-1");

      expect(result).toEqual(mockProject);
    });

    test("throws error for archived project", async () => {
      const mockProject = {
        id: "project-1",
        name: "Archived Project",
        archived: true,
        tags: [],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockProjectRepository.getById.mockResolvedValue(mockProject);

      await expect(
        projectService.ensureActiveProject("project-1")
      ).rejects.toThrow("Project project-1 is archived.");
    });

    test("throws error when project not found", async () => {
      mockProjectRepository.getById.mockResolvedValue(null);

      await expect(
        projectService.ensureActiveProject("nonexistent")
      ).rejects.toThrow("Project nonexistent does not exist.");
    });
  });

  describe("archiveProject", () => {
    test("archives project successfully", async () => {
      const mockProject = {
        id: "project-1",
        name: "Test Project",
        archived: false,
        tags: [],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      const mockTasks = [
        {
          id: "task-1",
          projectId: "project-1",
          title: "Task 1",
          status: "todo" as const,
          archived: false,
          tags: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "task-2",
          projectId: "project-1",
          title: "Task 2",
          status: "completed" as const,
          archived: false,
          tags: [],
          createdAt: "2025-01-02T00:00:00Z",
          updatedAt: "2025-01-02T00:00:00Z",
        },
      ];

      mockProjectRepository.getById.mockResolvedValue(mockProject);
      mockTaskRepository.listByProject.mockResolvedValue(mockTasks);

      const originalUpdatedAt = mockProject.updatedAt;

      const result = await projectService.archiveProject("project-1");

      expect(result.archived).toBe(true);
      expect(result.updatedAt).not.toBe(originalUpdatedAt);

      expect(mockProjectRepository.save).toHaveBeenCalledTimes(1);
      expect(mockTaskRepository.saveMany).toHaveBeenCalledTimes(1);
      expect(mockTaskRepository.saveMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: "task-1",
            archived: true,
            status: "archived",
          }),
          expect.objectContaining({
            id: "task-2",
            archived: true,
            status: "archived",
          }),
        ])
      );
    });

    test("returns already archived project", async () => {
      const mockProject = {
        id: "project-1",
        name: "Archived Project",
        archived: true,
        tags: [],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockProjectRepository.getById.mockResolvedValue(mockProject);

      const result = await projectService.archiveProject("project-1");

      expect(result).toEqual(mockProject);
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
      expect(mockTaskRepository.listByProject).not.toHaveBeenCalled();
    });

    test("throws error when project not found", async () => {
      mockProjectRepository.getById.mockResolvedValue(null);

      await expect(
        projectService.archiveProject("nonexistent")
      ).rejects.toThrow("Project nonexistent does not exist.");
    });
  });

  describe("getByName", () => {
    test("returns project when found by name", async () => {
      const mockProjects = [
        {
          id: "project-1",
          name: "First Project",
          archived: false,
          tags: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "project-2",
          name: "Second Project",
          archived: false,
          tags: [],
          createdAt: "2025-01-02T00:00:00Z",
          updatedAt: "2025-01-02T00:00:00Z",
        },
      ];

      mockProjectRepository.listAll.mockResolvedValue(mockProjects);

      const result = await projectService.getByName("Second Project");

      expect(result).toEqual(mockProjects[1]);
    });

    test("returns null when project not found by name", async () => {
      const mockProjects = [
        {
          id: "project-1",
          name: "First Project",
          archived: false,
          tags: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ];

      mockProjectRepository.listAll.mockResolvedValue(mockProjects);

      const result = await projectService.getByName("Nonexistent Project");

      expect(result).toBeNull();
    });

    test("includes archived projects in name search", async () => {
      const mockProjects = [
        {
          id: "project-1",
          name: "Active Project",
          archived: false,
          tags: [],
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "project-2",
          name: "Archived Project",
          archived: true,
          tags: [],
          createdAt: "2025-01-02T00:00:00Z",
          updatedAt: "2025-01-02T00:00:00Z",
        },
      ];

      mockProjectRepository.listAll.mockResolvedValue(mockProjects);

      const result = await projectService.getByName("Archived Project");

      expect(result).toEqual(mockProjects[1]);
    });
  });
});
