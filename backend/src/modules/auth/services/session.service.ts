import { getRedisClient } from "../../../config/redis";

export interface SessionRecord {
  sessionId: string;
  userId: string;
  createdAt: string;
  lastSeenAt: string;
}

const userSessionsKey = (userId: string) => `auth:sessions:${userId}`;

export const sessionService = {
  async createSession(userId: string, sessionId: string) {
    const client = await getRedisClient();
    const now = new Date().toISOString();

    const record: SessionRecord = {
      sessionId,
      userId,
      createdAt: now,
      lastSeenAt: now,
    };

    await client.hSet(
      userSessionsKey(userId),
      sessionId,
      JSON.stringify(record),
    );
    await client.expire(userSessionsKey(userId), 60 * 60 * 24 * 30);
    return record;
  },

  async touchSession(userId: string, sessionId: string) {
    const client = await getRedisClient();
    const key = userSessionsKey(userId);
    const raw = await client.hGet(key, sessionId);
    if (!raw) return false;

    const parsed = JSON.parse(raw) as SessionRecord;
    parsed.lastSeenAt = new Date().toISOString();

    await client.hSet(key, sessionId, JSON.stringify(parsed));
    await client.expire(key, 60 * 60 * 24 * 30);
    return true;
  },

  async listSessions(userId: string) {
    const client = await getRedisClient();
    const map = await client.hGetAll(userSessionsKey(userId));

    return Object.values(map)
      .map((raw) => JSON.parse(raw) as SessionRecord)
      .sort(
        (a, b) =>
          new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime(),
      );
  },

  async isSessionActive(userId: string, sessionId: string) {
    const client = await getRedisClient();
    return client.hExists(userSessionsKey(userId), sessionId);
  },

  async revokeSession(userId: string, sessionId: string) {
    const client = await getRedisClient();
    await client.hDel(userSessionsKey(userId), sessionId);
    return { revoked: true };
  },

  async revokeOtherSessions(userId: string, currentSessionId?: string) {
    const client = await getRedisClient();
    const key = userSessionsKey(userId);
    const map = await client.hGetAll(key);

    const ids = Object.keys(map).filter((id) => id !== currentSessionId);
    if (ids.length) {
      await client.hDel(key, ids);
    }

    return { revokedCount: ids.length };
  },
};

export default sessionService;
