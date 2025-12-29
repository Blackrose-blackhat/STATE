import IORedis from 'ioredis';

export const redis = new IORedis({
  maxRetriesPerRequest:null,
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
});
