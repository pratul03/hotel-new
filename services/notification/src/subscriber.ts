import { createRedisClient } from "./config/redis";
import { handleEvent } from "./handlers/eventHandlers";
import { AppEvent, EVENT_CHANNEL } from "./types";

export const startSubscriber = async (): Promise<void> => {
  const client = createRedisClient();

  client.on("error", (err) => console.error("[Redis Sub] Error:", err));
  client.on("connect", () => console.log(`✅ Redis subscriber connected`));
  client.on("reconnecting", () => console.log("[Redis Sub] Reconnecting..."));

  await client.connect();

  await client.subscribe(EVENT_CHANNEL, async (message) => {
    let event: AppEvent;
    try {
      event = JSON.parse(message) as AppEvent;
    } catch {
      console.error("[Subscriber] Received malformed message:", message);
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

  console.log(`📡 Subscribed to Redis channel: ${EVENT_CHANNEL}`);
};
