"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectRedis = exports.getRedisClient = void 0;
const redis_1 = require("redis");
const environment_1 = require("./environment");
let redisClient = null;
const getRedisClient = async () => {
    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }
    redisClient = (0, redis_1.createClient)({
        url: environment_1.env.REDIS_URL,
        password: environment_1.env.REDIS_PASSWORD || undefined,
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    console.error('❌ Redis reconnection failed after 10 retries');
                    return new Error('Redis retry strategy exhausted');
                }
                return retries * 50;
            },
        },
    });
    redisClient.on('error', (err) => {
        console.error('❌ Redis client error:', err);
    });
    redisClient.on('connect', () => {
        console.log('✅ Redis connected');
    });
    redisClient.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
    });
    await redisClient.connect();
    return redisClient;
};
exports.getRedisClient = getRedisClient;
const disconnectRedis = async () => {
    if (redisClient) {
        await redisClient.disconnect();
        redisClient = null;
    }
};
exports.disconnectRedis = disconnectRedis;
exports.default = exports.getRedisClient;
