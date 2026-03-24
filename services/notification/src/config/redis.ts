import { createClient } from "redis";
import { env } from "./environment";

export type RedisClientType = ReturnType<typeof createClient>;

export const createRedisClient = (): RedisClientType => {
  return createClient({
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD || undefined,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) return new Error("Redis reconnect limit reached");
        const delay = Math.min(retries * 100, 3000);
        console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${retries})`);
        return delay;
      },
    },
  });
};
