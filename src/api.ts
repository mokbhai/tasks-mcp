// Simple REST API routes for the UI
import type { Express } from "express";
import type { ProjectService } from "./services/projectService";
import type { TaskService } from "./services/taskService";

export function registerRestApi(
  app: Express,
  projectService: ProjectService,
  taskService: TaskService
) {
  // Projects endpoints
  app.get("/api/projects", async (req, res) => {
    try {
      const includeArchived = req.query.includeArchived === "true";
      const projects = await projectService.listProjects({ includeArchived });
      res.json({ projects });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const { name, description } = req.body;
      const project = await projectService.createProject({ name, description });
      res.json({ project });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/projects/:id/archive", async (req, res) => {
    try {
      const project = await projectService.archiveProject(req.params.id);
      res.json({ project });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Tasks endpoints
  app.get("/api/tasks", async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.projectId) filters.projectId = req.query.projectId as string;
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.priority) filters.priority = req.query.priority as string;
      if (req.query.includeArchived) filters.includeArchived = req.query.includeArchived === "true";
      if (req.query.sortBy) filters.sortBy = req.query.sortBy as string;
      if (req.query.order) filters.order = req.query.order as string;
      
      const tasks = await taskService.listTasks(filters);
      res.json({ tasks });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const task = await taskService.createTask(req.body);
      res.json({ task });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const task = await taskService.updateTask({ taskId: req.params.id, ...req.body });
      res.json({ task });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/tasks/:id/move", async (req, res) => {
    try {
      const { status } = req.body;
      const task = await taskService.moveTask(req.params.id, status);
      res.json({ task });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/tasks/:id/archive", async (req, res) => {
    try {
      const task = await taskService.archiveTask(req.params.id);
      res.json({ task });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
}
