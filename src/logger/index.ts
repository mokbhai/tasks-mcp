import type { LogLevel, LoggingConfig } from "../config";

type LogContext = Record<string, unknown>;

export interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  child: (context: LogContext) => Logger;
}

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const consoleMethods: Record<LogLevel, (message?: unknown, ...optionalParams: unknown[]) => void> =
  {
    debug: console.debug.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

const normalizeContextValue = (value: unknown): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
};

const normalizeContext = (context: LogContext): LogContext => {
  const entries = Object.entries(context).reduce<LogContext>(
    (acc, [key, value]) => {
      if (value === undefined) {
        return acc;
      }
      acc[key] = normalizeContextValue(value);
      return acc;
    },
    {}
  );
  return entries;
};

const hasContextEntries = (context?: LogContext): context is LogContext =>
  !!context && Object.keys(context).length > 0;

const shouldLog = (level: LogLevel, configuredLevel: LogLevel): boolean =>
  levelPriority[level] >= levelPriority[configuredLevel];

const formatPrettyMessage = (
  level: LogLevel,
  message: string,
  timestamp?: string
): string => {
  const parts: string[] = [];
  if (timestamp) {
    parts.push(timestamp);
  }
  parts.push(level.toUpperCase());
  parts.push(message);
  return parts.join(" ");
};

const formatJsonMessage = (
  level: LogLevel,
  message: string,
  timestamp?: string,
  context?: LogContext
) => {
  const payload: Record<string, unknown> = {
    level,
    message,
  };

  if (timestamp) {
    payload.timestamp = timestamp;
  }

  if (context && hasContextEntries(context)) {
    payload.context = context;
  }

  try {
    return JSON.stringify(payload);
  } catch {
    return JSON.stringify({
      level,
      message: "Failed to serialize log payload",
      reason: "Failed to stringify log payload",
    });
  }
};

const createLogFunction =
  (
    level: LogLevel,
    options: LoggingConfig,
    baseContext: LogContext
  ) =>
  (message: string, context?: LogContext) => {
    if (!shouldLog(level, options.level)) {
      return;
    }

    const timestamp = options.includeTimestamp
      ? new Date().toISOString()
      : undefined;
    const resolvedContext =
      options.includeContext && (context || hasContextEntries(baseContext))
        ? normalizeContext({
            ...baseContext,
            ...(context ?? {}),
          })
        : undefined;

    if (options.format === "json") {
      const serialized = formatJsonMessage(
        level,
        message,
        timestamp,
        resolvedContext
      );
      consoleMethods[level](serialized);
      return;
    }

    const prettyMessage = formatPrettyMessage(level, message, timestamp);
    if (resolvedContext && hasContextEntries(resolvedContext)) {
      consoleMethods[level](prettyMessage, resolvedContext);
    } else {
      consoleMethods[level](prettyMessage);
    }
  };

export const createLogger = (
  options: LoggingConfig,
  baseContext: LogContext = {}
): Logger => {
  const debug = createLogFunction("debug", options, baseContext);
  const info = createLogFunction("info", options, baseContext);
  const warn = createLogFunction("warn", options, baseContext);
  const error = createLogFunction("error", options, baseContext);

  const child = (context: LogContext): Logger =>
    createLogger(
      options,
      options.includeContext
        ? {
            ...baseContext,
            ...context,
          }
        : baseContext
    );

  return {
    debug,
    info,
    warn,
    error,
    child,
  };
};

const defaultLogger = createLogger({
  level: "info",
  format: "pretty",
  includeTimestamp: true,
  includeContext: true,
});

let activeLogger: Logger = defaultLogger;

export const initLogger = (options: LoggingConfig): void => {
  activeLogger = createLogger(options);
};

export const getLogger = (): Logger => activeLogger;
