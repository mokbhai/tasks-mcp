import Redis from "ioredis";
import type { AppConfig } from "../config";
import { getLogger } from "../logger";

let redisInstance: Redis | null = null;

export const getRedisClient = (config: AppConfig): Redis => {
  if (!redisInstance) {
    redisInstance = new Redis(config.redisUrl, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
    });

    redisInstance.on("error", (err) => {
      getLogger().error("Redis connection error", {
        error: err,
        redisUrl: config.redisUrl,
      });
    });
  }

  return redisInstance;
};
