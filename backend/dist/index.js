"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const environment_1 = require("./config/environment");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const minio_1 = require("./config/minio");
const setup_1 = require("./middleware/setup");
const startServer = async () => {
    const app = (0, express_1.default)();
    try {
        // Initialize configurations
        console.log("🚀 Starting Airbnb Clone API Server...");
        console.log(`📝 Environment: ${environment_1.env.NODE_ENV}`);
        // Setup middleware
        (0, setup_1.setupMiddleware)(app);
        // Initialize database connection
        console.log("📚 Connecting to PostgreSQL...");
        try {
            await database_1.prisma.$connect();
            console.log("✅ PostgreSQL connected");
        }
        catch (dbError) {
            console.error("❌ Database connection failed:", dbError);
            process.exit(1);
        }
        // Initialize Redis connection
        console.log("⚡ Connecting to Redis...");
        try {
            await (0, redis_1.getRedisClient)();
            console.log("✅ Redis connected");
        }
        catch (redisError) {
            console.error("❌ Redis connection failed:", redisError);
            process.exit(1);
        }
        // Initialize MinIO buckets
        console.log("🪣 Initializing MinIO buckets...");
        try {
            await (0, minio_1.initializeMinIOBuckets)();
            console.log("✅ MinIO initialized");
        }
        catch (minioError) {
            console.error("❌ MinIO initialization failed:", minioError);
            process.exit(1);
        }
        // Routes are mounted inside setupMiddleware(app) above
        // CRON jobs are handled by the job-supervisor microservice
        // Start listening
        app.listen(environment_1.env.PORT, () => {
            console.log(`\n✅ Server running on http://localhost:${environment_1.env.PORT}`);
            console.log(`🔗 Health check: http://localhost:${environment_1.env.PORT}/health\n`);
        });
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            console.log(`\n${signal} received, shutting down gracefully...`);
            try {
                await database_1.prisma.$disconnect();
                console.log("✅ PostgreSQL disconnected");
            }
            catch (error) {
                console.error("❌ Error disconnecting PostgreSQL:", error);
            }
            try {
                await (0, redis_1.disconnectRedis)();
                console.log("✅ Redis disconnected");
            }
            catch (error) {
                console.error("❌ Error disconnecting Redis:", error);
            }
            process.exit(0);
        };
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
        process.on("unhandledRejection", (reason, promise) => {
            console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
        });
    }
    catch (error) {
        console.error("❌ Fatal error during server startup:", error);
        process.exit(1);
    }
};
startServer();
exports.default = {};
