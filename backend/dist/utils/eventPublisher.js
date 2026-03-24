"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishEvent = exports.EVENT_CHANNEL = void 0;
const redis_1 = require("../config/redis");
exports.EVENT_CHANNEL = "app:events";
/**
 * Publishes an event to the Redis pub/sub channel.
 * Fire-and-forget — never throws, so it never blocks the main request.
 */
const publishEvent = async (type, data) => {
    try {
        const redis = await (0, redis_1.getRedisClient)();
        const event = { type, data, timestamp: new Date().toISOString() };
        await redis.publish(exports.EVENT_CHANNEL, JSON.stringify(event));
    }
    catch (err) {
        console.error(`[EventPublisher] Failed to publish event "${type}":`, err);
    }
};
exports.publishEvent = publishEvent;
