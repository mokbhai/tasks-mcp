import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProjectService } from "./services/projectService";
import type { TaskService } from "./services/taskService";

export function registerResources(
  server: McpServer,
  projectService: ProjectService,
  taskService: TaskService
) {
  // Existing task resource
  server.registerResource(
    "tasks",
    new ResourceTemplate("tasks://{projectName}", { list: undefined }),
    {
      title: "Tasks in Project",
      description: "List of tasks in a specific project",
    },
    async (uri, { projectName }) => {
      const projectNameStr = Array.isArray(projectName)
        ? projectName[0]
        : projectName;
      const project = await projectService.getByName(projectNameStr);
      if (!project) {
        throw new Error(`Project "${projectNameStr}" not found.`);
      }
      const tasks = await taskService.listTasks({ projectId: project.id });
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(tasks, null, 2),
          },
        ],
      };
    }
  );

  // New projects list resource
  server.registerResource(
    "projects",
    "projects://list",
    {
      title: "All Projects",
      description: "List of all projects with their metadata",
    },
    async (uri) => {
      const projects = await projectService.listProjects({
        includeArchived: false,
      });
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(projects, null, 2),
          },
        ],
      };
    }
  );

  // New overdue tasks resource
  server.registerResource(
    "overdue_tasks",
    "tasks://overdue",
    {
      title: "Overdue Tasks",
      description: "List of all tasks that are past their due date",
    },
    async (uri) => {
      const now = new Date().toISOString();
      const allTasks = await taskService.listTasks({
        includeArchived: false,
        status: "todo", // Only include active tasks
      });

      const overdueTasks = allTasks.filter(
        (task) => task.dueDate && new Date(task.dueDate) < new Date(now)
      );

      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(overdueTasks, null, 2),
          },
        ],
      };
    }
  );

  // New high priority tasks resource
  server.registerResource(
    "high_priority_tasks",
    "tasks://high_priority",
    {
      title: "High Priority Tasks",
      description: "List of all high priority tasks across projects",
    },
    async (uri) => {
      const tasks = await taskService.listTasks({
        includeArchived: false,
        priority: "high",
      });
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(tasks, null, 2),
          },
        ],
      };
    }
  );
}
