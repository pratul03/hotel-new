"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectPublisher = exports.getPublisher = void 0;
const redis_1 = require("redis");
const environment_1 = require("./environment");
let publisher = null;
const getPublisher = async () => {
    if (publisher && publisher.isOpen)
        return publisher;
    publisher = (0, redis_1.createClient)({
        url: environment_1.env.REDIS_URL,
        password: environment_1.env.REDIS_PASSWORD || undefined,
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 10)
                    return new Error("Redis reconnect limit reached");
                return Math.min(retries * 100, 3000);
            },
        },
    });
    publisher.on("error", (err) => console.error("[Redis] Error:", err));
    publisher.on("connect", () => console.log("✅ Redis publisher connected"));
    await publisher.connect();
    return publisher;
};
exports.getPublisher = getPublisher;
const disconnectPublisher = async () => {
    if (publisher) {
        await publisher.disconnect();
        publisher = null;
    }
};
exports.disconnectPublisher = disconnectPublisher;
