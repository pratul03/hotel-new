"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisClient = void 0;
const redis_1 = require("redis");
const environment_1 = require("./environment");
const createRedisClient = () => {
    return (0, redis_1.createClient)({
        url: environment_1.env.REDIS_URL,
        password: environment_1.env.REDIS_PASSWORD || undefined,
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 10)
                    return new Error("Redis reconnect limit reached");
                const delay = Math.min(retries * 100, 3000);
                console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${retries})`);
                return delay;
            },
        },
    });
};
exports.createRedisClient = createRedisClient;
