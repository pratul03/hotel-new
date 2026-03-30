"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopSubscriber = exports.startSubscriber = void 0;
const redis_1 = require("./config/redis");
const environment_1 = require("./config/environment");
const eventHandlers_1 = require("./handlers/eventHandlers");
const events_1 = require("./validation/events");
let subscriberClient = null;
const RECENT_EVENT_TTL_MS = 2 * 60 * 1000;
const recentEvents = new Map();
const eventSignature = (message) => message;
const isDuplicate = (signature) => {
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
const startSubscriber = async () => {
    if (subscriberClient?.isOpen) {
        return;
    }
    const client = (0, redis_1.createRedisClient)();
    subscriberClient = client;
    client.on("error", (err) => console.error("[Redis Sub] Error:", err));
    client.on("connect", () => console.log(`✅ Redis subscriber connected`));
    client.on("reconnecting", () => console.log("[Redis Sub] Reconnecting..."));
    await client.connect();
    const channel = environment_1.env.REDIS_EVENT_CHANNEL;
    await client.subscribe(channel, async (message) => {
        const signature = eventSignature(message);
        if (isDuplicate(signature)) {
            return;
        }
        let decoded;
        try {
            decoded = JSON.parse(message);
        }
        catch {
            console.error("[Subscriber] Received malformed JSON message:", message);
            return;
        }
        const event = (0, events_1.parseAppEvent)(decoded);
        if (!event) {
            console.error("[Subscriber] Received invalid event payload:", decoded);
            return;
        }
        try {
            await (0, eventHandlers_1.handleEvent)(event);
        }
        catch (err) {
            console.error(`[Subscriber] Unhandled error for event "${event.type}":`, err);
        }
    });
    console.log(`📡 Subscribed to Redis channel: ${channel}`);
};
exports.startSubscriber = startSubscriber;
const stopSubscriber = async () => {
    if (!subscriberClient)
        return;
    try {
        if (subscriberClient.isOpen) {
            await subscriberClient.unsubscribe(environment_1.env.REDIS_EVENT_CHANNEL);
            await subscriberClient.quit();
        }
    }
    catch (err) {
        console.error("[Redis Sub] Error during shutdown:", err);
    }
    finally {
        subscriberClient = null;
    }
};
exports.stopSubscriber = stopSubscriber;
