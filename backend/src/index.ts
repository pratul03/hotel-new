import express, { Express } from "express";
import { env } from "./config/environment";
import { prisma } from "./config/database";
import { getRedisClient, disconnectRedis } from "./config/redis";
import { initializeMinIOBuckets } from "./config/minio";
import { setupMiddleware } from "./middleware/setup";

const startServer = async () => {
  const app: Express = express();

  try {
    // Initialize configurations
    console.log("🚀 Starting Airbnb Clone API Server...");
    console.log(`📝 Environment: ${env.NODE_ENV}`);

    // Setup middleware
    await setupMiddleware(app);

    // Initialize database connection
    console.log("📚 Connecting to PostgreSQL...");
    try {
      await prisma.$connect();
      console.log("✅ PostgreSQL connected");
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError);
      process.exit(1);
    }

    // Initialize Redis connection
    console.log("⚡ Connecting to Redis...");
    try {
      await getRedisClient();
      console.log("✅ Redis connected");
    } catch (redisError) {
      console.error("❌ Redis connection failed:", redisError);
      process.exit(1);
    }

    // Initialize MinIO buckets
    console.log("🪣 Initializing MinIO buckets...");
    try {
      await initializeMinIOBuckets();
      console.log("✅ MinIO initialized");
    } catch (minioError) {
      console.error("❌ MinIO initialization failed:", minioError);
      process.exit(1);
    }

    // Routes are mounted inside setupMiddleware(app) above
    // CRON jobs are handled by the job-supervisor microservice

    // Start listening
    app.listen(env.PORT, () => {
      console.log(`\n✅ Server running on http://localhost:${env.PORT}`);
      console.log(
        `🔗 GraphQL endpoint: http://localhost:${env.PORT}/api/graphql`,
      );
      console.log(`📚 Swagger UI: http://localhost:${env.PORT}/api/docs`);
      console.log(
        `📄 OpenAPI JSON: http://localhost:${env.PORT}/api/docs.json\n`,
      );
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);

      try {
        await prisma.$disconnect();
        console.log("✅ PostgreSQL disconnected");
      } catch (error) {
        console.error("❌ Error disconnecting PostgreSQL:", error);
      }

      try {
        await disconnectRedis();
        console.log("✅ Redis disconnected");
      } catch (error) {
        console.error("❌ Error disconnecting Redis:", error);
      }

      process.exit(0);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    });
  } catch (error) {
    console.error("❌ Fatal error during server startup:", error);
    process.exit(1);
  }
};

startServer();

export default {};
