"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const cronManager_1 = require("./cronManager");
const environment_1 = require("./config/environment");
const start = async () => {
    console.log("🚀 Starting Job Supervisor Service...");
    console.log(`📝 Environment: ${environment_1.env.NODE_ENV}`);
    // Verify database connection
    console.log("📚 Connecting to PostgreSQL...");
    try {
        await database_1.prisma.$connect();
        console.log("✅ PostgreSQL connected");
    }
    catch (err) {
        console.error("❌ PostgreSQL connection failed:", err);
        process.exit(1);
    }
    // Verify Redis connection
    console.log("⚡ Connecting to Redis...");
    try {
        await (0, redis_1.getPublisher)();
        console.log("✅ Redis publisher connected");
    }
    catch (err) {
        console.error("❌ Redis connection failed:", err);
        process.exit(1);
    }
    if (!environment_1.env.ENABLE_CRON_JOBS) {
        console.log("⚠️  CRON jobs disabled via ENABLE_CRON_JOBS=false — exiting");
        process.exit(0);
    }
    // Start all CRON jobs
    (0, cronManager_1.initializeCronJobs)();
    console.log("✅ Job Supervisor is running\n");
    // Graceful shutdown
    const shutdown = async (signal) => {
        console.log(`\n${signal} received — shutting down job supervisor...`);
        try {
            await database_1.prisma.$disconnect();
            await (0, redis_1.disconnectPublisher)();
        }
        catch (err) {
            console.error("Error during shutdown:", err);
        }
        process.exit(0);
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("unhandledRejection", (reason, promise) => {
        console.error("[Supervisor] Unhandled rejection at:", promise, "reason:", reason);
    });
};
start();
