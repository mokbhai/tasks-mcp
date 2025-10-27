import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPrompts(server: McpServer) {
  server.registerPrompt(
    "task_management",
    {
      description:
        "Guidance for managing tasks: search, update, move, and archive based on descriptions",
    },
    async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "You are a task management assistant. Use the available tools to search for tasks by title or description, list tasks in projects, create new tasks, move tasks to different statuses (todo, pending, completed, archived), or archive them. When a user wants to update tasks based on a description, first use search_tasks to find matching tasks, then use move_task or archive_task on the relevant task IDs.",
            },
          },
        ],
      };
    }
  );
}
