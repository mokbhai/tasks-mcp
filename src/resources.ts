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
}
