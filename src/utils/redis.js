const redis = require('redis');
const logger = require('./logger');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('connect', () => {
  logger.info('✅ Client Redis prêt');
});

redisClient.on('error', (err) => {
  logger.error('❌ Erreur du client Redis:', err);
});

module.exports = redisClient;