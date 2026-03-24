"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.prisma = exports.getPrismaClient = void 0;
const tslib_1 = require("tslib");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = tslib_1.__importDefault(require("pg"));
const globalForDb = globalThis;
const buildPool = () => new pg_1.default.Pool({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 5000,
    allowExitOnIdle: true,
});
const pool = globalForDb.pgPool ?? buildPool();
exports.pool = pool;
if (pool.listenerCount('error') === 0) {
    pool.on('error', (err) => {
        console.error(`[DB Pool] Unexpected error on idle client: ${err.message}`);
    });
}
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = globalForDb.prisma ?? new client_1.PrismaClient({ adapter });
exports.prisma = prisma;
if (process.env.NODE_ENV !== 'production') {
    globalForDb.pgPool = pool;
    globalForDb.prisma = prisma;
}
const getPrismaClient = () => prisma;
exports.getPrismaClient = getPrismaClient;
exports.default = prisma;
