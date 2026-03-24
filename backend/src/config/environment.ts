import 'dotenv/config';

// Environment variables validation
const requiredEnvVars = [
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'REDIS_URL',
  'MINIO_ENDPOINT',
  'MINIO_PORT',
  'RAZORPAY_KEY_ID',
];

const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DATABASE_URL: process.env.DATABASE_URL!,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',

  // Redis
  REDIS_URL: process.env.REDIS_URL!,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',

  // MinIO
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT!,
  MINIO_PORT: parseInt(process.env.MINIO_PORT || '9000', 10),
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || 'minioadmin',
  MINIO_USE_SSL: process.env.MINIO_USE_SSL === 'true',
  MINIO_BUCKET_PREFIX: process.env.MINIO_BUCKET_PREFIX || 'airbnb',

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID!,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET!,

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',

  // Features
  ENABLE_CRON_JOBS: process.env.ENABLE_CRON_JOBS !== 'false',
  LOG_JOBS: process.env.LOG_JOBS !== 'false',
};

export default env;
