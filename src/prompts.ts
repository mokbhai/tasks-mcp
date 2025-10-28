import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  // Dynamic task management prompt with project context
  server.registerPrompt(
    "task_management",
    {
      description:
        "Guidance for managing tasks: search, update, and archive based on descriptions. Can be parameterized with project name.",
      argsSchema: {
        projectName: z
          .string()
          .optional()
          .describe("Optional project name to focus the guidance on"),
      },
    },
    async (args) => {
      const projectContext = args?.projectName
        ? ` Focus on tasks in the "${args.projectName}" project.`
        : " Work across all projects.";

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `You are a task management assistant.${projectContext} Use the available tools to search for tasks by title or description, list tasks in projects, create new tasks, update task statuses (todo, pending, completed, archived) or other properties, and archive them. When a user wants to update tasks based on a description, first use search_tasks to find matching tasks, then use update_task or archive_task on the relevant task IDs.`,
            },
          },
        ],
      };
    }
  );

  // Project-specific planning prompt
  server.registerPrompt(
    "project_planning",
    {
      description:
        "Guidance for planning and organizing work within a specific project.",
      argsSchema: {
        projectName: z
          .string()
          .describe("The project name to provide planning guidance for"),
      },
    },
    async (args) => {
      if (!args?.projectName) {
        throw new Error("projectName is required for project planning prompt");
      }

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `You are a project planning assistant for the "${args.projectName}" project. Help organize and prioritize tasks, create subtasks for complex work items, set appropriate due dates and priorities, and ensure good task categorization with tags. Use the available tools to:

1. First, list existing tasks in the project to understand current work
2. Create high-level tasks with appropriate priorities and due dates
3. Break down complex tasks into subtasks using parentTaskId
4. Add relevant tags for better organization (e.g., "urgent", "backend", "frontend", "design")
5. Suggest task dependencies and ordering

Focus on creating actionable, well-organized task structures that will help the team deliver the project successfully.`,
            },
          },
        ],
      };
    }
  );
}
