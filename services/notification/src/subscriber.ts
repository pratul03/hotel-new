import { createRedisClient } from "./config/redis";
import { env } from "./config/environment";
import { handleEvent } from "./handlers/eventHandlers";
import { parseAppEvent } from "./validation/events";

let subscriberClient: ReturnType<typeof createRedisClient> | null = null;
const RECENT_EVENT_TTL_MS = 2 * 60 * 1000;
const recentEvents = new Map<string, number>();

const eventSignature = (message: string): string => message;

const isDuplicate = (signature: string): boolean => {
  const now = Date.now();

  for (const [key, ts] of recentEvents) {
    if (now - ts > RECENT_EVENT_TTL_MS) {
      recentEvents.delete(key);
    }
  }

  if (recentEvents.has(signature)) {
    return true;
  }

  recentEvents.set(signature, now);
  return false;
};

export const startSubscriber = async (): Promise<void> => {
  if (subscriberClient?.isOpen) {
    return;
  }

  const client = createRedisClient();
  subscriberClient = client;

  client.on("error", (err) => console.error("[Redis Sub] Error:", err));
  client.on("connect", () => console.log(`✅ Redis subscriber connected`));
  client.on("reconnecting", () => console.log("[Redis Sub] Reconnecting..."));

  await client.connect();

  const channel = env.REDIS_EVENT_CHANNEL;
  await client.subscribe(channel, async (message) => {
    const signature = eventSignature(message);
    if (isDuplicate(signature)) {
      return;
    }

    let decoded: unknown;
    try {
      decoded = JSON.parse(message);
    } catch {
      console.error("[Subscriber] Received malformed JSON message:", message);
      return;
    }

    const event = parseAppEvent(decoded);
    if (!event) {
      console.error("[Subscriber] Received invalid event payload:", decoded);
      return;
    }

    try {
      await handleEvent(event);
    } catch (err) {
      console.error(
        `[Subscriber] Unhandled error for event "${event.type}":`,
        err,
      );
    }
  });

  console.log(`📡 Subscribed to Redis channel: ${channel}`);
};

export const stopSubscriber = async (): Promise<void> => {
  if (!subscriberClient) return;

  try {
    if (subscriberClient.isOpen) {
      await subscriberClient.unsubscribe(env.REDIS_EVENT_CHANNEL);
      await subscriberClient.quit();
    }
  } catch (err) {
    console.error("[Redis Sub] Error during shutdown:", err);
  } finally {
    subscriberClient = null;
  }
};
