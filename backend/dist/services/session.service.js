"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionService = void 0;
const redis_1 = require("../config/redis");
const userSessionsKey = (userId) => `auth:sessions:${userId}`;
exports.sessionService = {
    async createSession(userId, sessionId) {
        const client = await (0, redis_1.getRedisClient)();
        const now = new Date().toISOString();
        const record = {
            sessionId,
            userId,
            createdAt: now,
            lastSeenAt: now,
        };
        await client.hSet(userSessionsKey(userId), sessionId, JSON.stringify(record));
        await client.expire(userSessionsKey(userId), 60 * 60 * 24 * 30);
        return record;
    },
    async touchSession(userId, sessionId) {
        const client = await (0, redis_1.getRedisClient)();
        const key = userSessionsKey(userId);
        const raw = await client.hGet(key, sessionId);
        if (!raw)
            return false;
        const parsed = JSON.parse(raw);
        parsed.lastSeenAt = new Date().toISOString();
        await client.hSet(key, sessionId, JSON.stringify(parsed));
        await client.expire(key, 60 * 60 * 24 * 30);
        return true;
    },
    async listSessions(userId) {
        const client = await (0, redis_1.getRedisClient)();
        const map = await client.hGetAll(userSessionsKey(userId));
        return Object.values(map)
            .map((raw) => JSON.parse(raw))
            .sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
    },
    async isSessionActive(userId, sessionId) {
        const client = await (0, redis_1.getRedisClient)();
        return client.hExists(userSessionsKey(userId), sessionId);
    },
    async revokeSession(userId, sessionId) {
        const client = await (0, redis_1.getRedisClient)();
        await client.hDel(userSessionsKey(userId), sessionId);
        return { revoked: true };
    },
    async revokeOtherSessions(userId, currentSessionId) {
        const client = await (0, redis_1.getRedisClient)();
        const key = userSessionsKey(userId);
        const map = await client.hGetAll(key);
        const ids = Object.keys(map).filter((id) => id !== currentSessionId);
        if (ids.length) {
            await client.hDel(key, ids);
        }
        return { revokedCount: ids.length };
    },
};
exports.default = exports.sessionService;
