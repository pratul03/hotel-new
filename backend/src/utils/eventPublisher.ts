import { getRedisClient } from "../config/redis";

export const EVENT_CHANNEL = "app:events";

export interface AppEvent<T = Record<string, any>> {
  type: string;
  data: T;
  timestamp: string;
}

/**
 * Publishes an event to the Redis pub/sub channel.
 * Fire-and-forget — never throws, so it never blocks the main request.
 */
export const publishEvent = async (
  type: string,
  data: Record<string, any>,
): Promise<void> => {
  try {
    const redis = await getRedisClient();
    const event: AppEvent = { type, data, timestamp: new Date().toISOString() };
    await redis.publish(EVENT_CHANNEL, JSON.stringify(event));
  } catch (err) {
    console.error(`[EventPublisher] Failed to publish event "${type}":`, err);
  }
};
