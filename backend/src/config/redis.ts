import { createClient } from 'redis';
import { env } from './environment';

let redisClient: ReturnType<typeof createClient> | null = null;

export const getRedisClient = async () => {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  redisClient = createClient({
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD || undefined,
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

export const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
  }
};

export default getRedisClient;
