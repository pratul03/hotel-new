// Ensure config/environment does not terminate test runs when files import config modules.
process.env.PORT ??= "3000";
process.env.DATABASE_URL ??= "postgresql://localhost:5432/test";
process.env.JWT_SECRET ??= "test_jwt_secret";
process.env.REDIS_URL ??= "redis://localhost:6379";
process.env.MINIO_ENDPOINT ??= "localhost";
process.env.MINIO_PORT ??= "9000";
process.env.RAZORPAY_KEY_ID ??= "test_key_id";
process.env.RAZORPAY_KEY_SECRET ??= "test_key_secret";

afterAll(async () => {
  try {
    const { disconnectRedis } = await import("../config/redis");
    await disconnectRedis();
  } catch {
    // Ignore teardown failures from optional services in unit tests.
  }

  try {
    const { prisma, pool } = await import("../config/database");
    await prisma.$disconnect();
    await pool.end();
  } catch {
    // Ignore teardown failures when DB client was never initialized.
  }
});