import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForDb = globalThis as unknown as {
  notificationPgPool?: pg.Pool;
  notificationPrisma?: PrismaClient;
};

const buildPool = () =>
  new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env.DB_POOL_MAX || "5", 10),
    min: parseInt(process.env.DB_POOL_MIN || "1", 10),
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 5000,
    allowExitOnIdle: true,
  });

const pool = globalForDb.notificationPgPool ?? buildPool();

if (pool.listenerCount("error") === 0) {
  pool.on("error", (err) => {
    console.error(`[Notification DB Pool] Unexpected error on idle client: ${err.message}`);
  });
}

const adapter = new PrismaPg(pool);
const prisma =
  globalForDb.notificationPrisma ??
  new PrismaClient({
    adapter,
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.notificationPgPool = pool;
  globalForDb.notificationPrisma = prisma;
}

export { prisma, pool };
export default prisma;
