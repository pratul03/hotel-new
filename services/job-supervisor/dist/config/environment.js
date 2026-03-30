"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const required = (key) => {
    const val = process.env[key];
    if (!val)
        throw new Error(`Missing required env variable: ${key}`);
    return val;
};
exports.env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    DATABASE_URL: required("DATABASE_URL"),
    REDIS_URL: required("REDIS_URL"),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
    REDIS_EVENT_CHANNEL: process.env.REDIS_EVENT_CHANNEL || "app:v1:events",
    ENABLE_CRON_JOBS: process.env.ENABLE_CRON_JOBS !== "false",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "",
};
