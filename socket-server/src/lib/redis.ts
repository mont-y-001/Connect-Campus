import Redis from 'ioredis';

const redis = process.env.NODE_ENV === 'production' && process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : ({} as any); // mock or disable for local

if (redis.on) {
  redis.on('error', (err: any) => {
  console.error('Redis error:', err);
  });
}

export default redis;
