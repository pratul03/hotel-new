import "dotenv/config";
import { prisma } from "./config/database";
import { getPublisher, disconnectPublisher } from "./config/redis";
import { initializeCronJobs } from "./cronManager";
import { env } from "./config/environment";

const start = async () => {
  console.log("🚀 Starting Job Supervisor Service...");
  console.log(`📝 Environment: ${env.NODE_ENV}`);

  // Verify database connection
  console.log("📚 Connecting to PostgreSQL...");
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL connected");
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err);
    process.exit(1);
  }

  // Verify Redis connection
  console.log("⚡ Connecting to Redis...");
  try {
    await getPublisher();
    console.log("✅ Redis publisher connected");
  } catch (err) {
    console.error("❌ Redis connection failed:", err);
    process.exit(1);
  }

  if (!env.ENABLE_CRON_JOBS) {
    console.log("⚠️  CRON jobs disabled via ENABLE_CRON_JOBS=false — exiting");
    process.exit(0);
  }

  // Start all CRON jobs
  initializeCronJobs();

  console.log("✅ Job Supervisor is running\n");

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down job supervisor...`);
    try {
      await prisma.$disconnect();
      await disconnectPublisher();
    } catch (err) {
      console.error("Error during shutdown:", err);
    }
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason, promise) => {
    console.error(
      "[Supervisor] Unhandled rejection at:",
      promise,
      "reason:",
      reason,
    );
  });
};

start();
