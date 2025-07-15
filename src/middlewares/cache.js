const redis = require('redis');
const cache = require('express-redis-cache')({
  client: redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  }),
  expire: 60 * 60, // 1 hour
});

module.exports = cache;