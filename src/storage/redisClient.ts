import Redis from "ioredis";
import type { AppConfig } from "../config";

let redisInstance: Redis | null = null;

export const getRedisClient = (config: AppConfig): Redis => {
  if (!redisInstance) {
    redisInstance = new Redis(config.redisUrl, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
    });

    redisInstance.on("error", (err) => {
      console.error("[redis] connection error:", err);
    });
  }

  return redisInstance;
};
