"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const database_1 = require("./config/database");
const environment_1 = require("./config/environment");
const mailer_1 = require("./config/mailer");
const subscriber_1 = require("./subscriber");
const start = async () => {
    console.log("🚀 Starting Notification Service...");
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
    // Verify Gmail SMTP
    console.log("📧 Verifying Gmail SMTP...");
    try {
        await (0, mailer_1.verifyMailer)();
    }
    catch (err) {
        console.error("❌ Gmail SMTP verification failed:", err);
        console.error("   Check GMAIL_USER and GMAIL_APP_PASSWORD in your .env file");
        process.exit(1);
    }
    // Start Redis subscriber
    console.log("📡 Starting Redis subscriber...");
    try {
        await (0, subscriber_1.startSubscriber)();
    }
    catch (err) {
        console.error("❌ Redis subscriber failed to start:", err);
        process.exit(1);
    }
    console.log("\n✅ Notification Service is running");
    console.log(`   Listening for events on channel: ${environment_1.env.REDIS_EVENT_CHANNEL}\n`);
    // Graceful shutdown
    const shutdown = async (signal) => {
        console.log(`\n${signal} received — shutting down notification service...`);
        await (0, subscriber_1.stopSubscriber)();
        await database_1.prisma.$disconnect();
        process.exit(0);
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("unhandledRejection", (reason, promise) => {
        console.error("[Notification] Unhandled rejection at:", promise, "reason:", reason);
    });
};
start();
