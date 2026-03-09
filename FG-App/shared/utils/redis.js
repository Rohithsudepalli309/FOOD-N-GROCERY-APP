const Redis = require('ioredis');

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
};

// Main client for commands (get/set/geo)
const redis = new Redis(process.env.REDIS_URL || redisOptions);

// Separate subscriber client for pub/sub if needed
const redisSub = new Redis(process.env.REDIS_URL || redisOptions);

redis.on('error', (err) => console.error('Redis Client Error', err));
redis.on('connect', () => console.log('✅ Connected to Redis'));

module.exports = { redis, redisSub };
