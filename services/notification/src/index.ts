import "dotenv/config";
import { prisma } from "./config/database";
import { env } from "./config/environment";
import { verifyMailer } from "./config/mailer";
import { startSubscriber, stopSubscriber } from "./subscriber";

const start = async () => {
  console.log("🚀 Starting Notification Service...");

  // Verify database connection
  console.log("📚 Connecting to PostgreSQL...");
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL connected");
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err);
    process.exit(1);
  }

  // Verify Gmail SMTP
  console.log("📧 Verifying Gmail SMTP...");
  try {
    await verifyMailer();
  } catch (err) {
    console.error("❌ Gmail SMTP verification failed:", err);
    console.error(
      "   Check GMAIL_USER and GMAIL_APP_PASSWORD in your .env file",
    );
    process.exit(1);
  }

  // Start Redis subscriber
  console.log("📡 Starting Redis subscriber...");
  try {
    await startSubscriber();
  } catch (err) {
    console.error("❌ Redis subscriber failed to start:", err);
    process.exit(1);
  }

  console.log("\n✅ Notification Service is running");
  console.log(
    `   Listening for events on channel: ${env.REDIS_EVENT_CHANNEL}\n`,
  );

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down notification service...`);
    await stopSubscriber();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason, promise) => {
    console.error(
      "[Notification] Unhandled rejection at:",
      promise,
      "reason:",
      reason,
    );
  });
};

start();
