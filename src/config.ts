import dotenv from "dotenv";

dotenv.config();

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFormat = "json" | "pretty";

export interface LoggingConfig {
  level: LogLevel;
  format: LogFormat;
  includeTimestamp: boolean;
  includeContext: boolean;
}

export interface AppConfig {
  redisUrl: string;
  authUser?: string;
  authPassword?: string;
  serverName: string;
  serverVersion: string;
  logging: LoggingConfig;
}

const parseBoolean = (
  value: string | undefined,
  defaultValue: boolean
): boolean => {
  if (typeof value !== "string") {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }
  return defaultValue;
};

const parseLogLevel = (value: string | undefined): LogLevel => {
  switch (value?.trim().toLowerCase()) {
    case "debug":
    case "info":
    case "warn":
    case "error":
      return value.trim().toLowerCase() as LogLevel;
    default:
      return "info";
  }
};

const parseLogFormat = (value: string | undefined): LogFormat => {
  switch (value?.trim().toLowerCase()) {
    case "json":
      return "json";
    case "pretty":
      return "pretty";
    default:
      return "pretty";
  }
};

export const getConfig = (): AppConfig => {
  const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
  const authUser = process.env.MCP_BASIC_AUTH_USER;
  const authPassword = process.env.MCP_BASIC_AUTH_PASSWORD;
  const serverName = process.env.MCP_SERVER_NAME ?? "todo-mcp";
  const serverVersion = process.env.MCP_SERVER_VERSION ?? "0.1.0";

  const logging: LoggingConfig = {
    level: parseLogLevel(process.env.LOG_LEVEL),
    format: parseLogFormat(process.env.LOG_FORMAT),
    includeTimestamp: parseBoolean(
      process.env.LOG_INCLUDE_TIMESTAMP,
      true
    ),
    includeContext: parseBoolean(process.env.LOG_INCLUDE_CONTEXT, true),
  };

  return {
    redisUrl,
    authUser,
    authPassword,
    serverName,
    serverVersion,
    logging,
  };
};
