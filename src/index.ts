import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { getConfig } from "./config";
import { getRedisClient } from "./storage/redisClient";
import { ProjectRepository } from "./repositories/projectRepository";
import { TaskRepository } from "./repositories/taskRepository";
import { ProjectService } from "./services/projectService";
import { TaskService } from "./services/taskService";
import { ensureAuthorized } from "./auth/basicAuth";
import type { TaskStatus, Project } from "./types";
import express from "express";
import { registerProjectTools } from "./tools/projects";
import { registerTaskTools } from "./tools/tasks";
import { registerResources } from "./resources";
import { registerPrompts } from "./prompts";

const main = async () => {
  const config = getConfig();
  const redis = getRedisClient(config);

  const projectRepository = new ProjectRepository(redis);
  const taskRepository = new TaskRepository(redis);
  const projectService = new ProjectService(projectRepository, taskRepository);
  const taskService = new TaskService(taskRepository, projectService);

  const server = new McpServer({
    name: config.serverName,
    version: config.serverVersion,
    description: "Task and project management MCP server powered by Redis.",
  });

  const guardAuth = (metadata?: Record<string, unknown>) => {
    ensureAuthorized(config, metadata);
  };

  const metadataFromContext = (
    context: unknown
  ): Record<string, unknown> | undefined => {
    if (!context || typeof context !== "object") {
      return undefined;
    }
    const record = context as Record<string, unknown>;
    const metadata = (record as any).requestInfo;
    if (metadata && typeof metadata === "object" && "headers" in metadata) {
      return (metadata as any).headers as Record<string, unknown>;
    }
    return undefined;
  };

  registerProjectTools(server, projectService, guardAuth, metadataFromContext);
  registerTaskTools(
    server,
    projectService,
    taskService,
    guardAuth,
    metadataFromContext
  );
  registerResources(server, projectService, taskService);
  registerPrompts(server);

  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req: any, res: any) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);

    res.on("close", () => {
      transport.close();
    });

    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT || "3000");
  const serverInstance = app
    .listen(port, () => {
      console.log(
        `[mcp] Server "${config.serverName}" is ready on http://localhost:${port}/mcp`
      );
    })
    .on("error", (error: any) => {
      console.error("Server error:", error);
      process.exit(1);
    });

  const shutdown = async () => {
    try {
      serverInstance.close();
      await redis.quit();
    } catch {
      redis.disconnect();
    }
  };

  process.on("SIGINT", () => {
    shutdown()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });

  process.on("SIGTERM", () => {
    shutdown()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });
};

main().catch((error) => {
  console.error("[mcp] Fatal error", error);
  process.exit(1);
});
