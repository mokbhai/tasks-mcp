import dotenv from "dotenv";

dotenv.config();

export interface AppConfig {
  redisUrl: string;
  authUser?: string;
  authPassword?: string;
  serverName: string;
  serverVersion: string;
}

export const getConfig = (): AppConfig => {
  const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
  const authUser = process.env.MCP_BASIC_AUTH_USER;
  const authPassword = process.env.MCP_BASIC_AUTH_PASSWORD;
  const serverName = process.env.MCP_SERVER_NAME ?? "todo-mcp";
  const serverVersion = process.env.MCP_SERVER_VERSION ?? "0.1.0";

  return {
    redisUrl,
    authUser,
    authPassword,
    serverName,
    serverVersion,
  };
};
