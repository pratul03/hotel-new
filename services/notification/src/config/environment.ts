import "dotenv/config";

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env variable: ${key}`);
  return val;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  DATABASE_URL: required("DATABASE_URL"),

  // Redis
  REDIS_URL: required("REDIS_URL"),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
  REDIS_EVENT_CHANNEL: process.env.REDIS_EVENT_CHANNEL || "app:v1:events",

  // Gmail SMTP
  GMAIL_USER: required("GMAIL_USER"),
  GMAIL_APP_PASSWORD: required("GMAIL_APP_PASSWORD"),

  // App
  APP_NAME: process.env.APP_NAME || "My BnB",
  APP_URL: process.env.APP_URL || "http://localhost:3001",
  FROM_EMAIL_NAME: process.env.FROM_EMAIL_NAME || "My BnB",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "",
};
