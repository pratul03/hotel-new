import { createClient } from "redis";
import { env } from "./environment";

export type RedisClientType = ReturnType<typeof createClient>;

let publisher: RedisClientType | null = null;

export const getPublisher = async (): Promise<RedisClientType> => {
  if (publisher && publisher.isOpen) return publisher;

  publisher = createClient({
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD || undefined,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) return new Error("Redis reconnect limit reached");
        return Math.min(retries * 100, 3000);
      },
    },
  });

  publisher.on("error", (err) => console.error("[Redis] Error:", err));
  publisher.on("connect", () => console.log("✅ Redis publisher connected"));

  await publisher.connect();
  return publisher;
};

export const disconnectPublisher = async (): Promise<void> => {
  if (publisher) {
    await publisher.disconnect();
    publisher = null;
  }
};
