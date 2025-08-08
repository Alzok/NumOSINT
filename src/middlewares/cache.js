const redisClient = require('../utils/redis');
const cache = require('express-redis-cache')({
  client: redisClient,
  expire: 60 * 60, // 1 hour
});

module.exports = cache;