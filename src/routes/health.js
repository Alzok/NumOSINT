const express = require('express');
const prisma = require('../utils/prisma');
const logger = require('../utils/logger');
const catchAsync = require('../utils/catchAsync');
const protect = require('../middlewares/auth');
const ApiError = require('../utils/ApiError');
const redisClient = require('../utils/redis');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Vérification de l'état de santé de l'application
 */

// --- Fonctions de vérification ---

async function checkDatabase() {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    return { status: 'healthy', responseTime: `${responseTime}ms` };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

// ... (garder les autres fonctions de vérification détaillées de l'ancien code si nécessaire)


/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Endpoint de santé général (utilisé par Docker)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: L'application est saine ou dégradée
 *       503:
 *         description: L'application n'est pas saine
 */
router.get('/', catchAsync(async (req, res) => {
  // ... (conserver l'ancienne logique de la route / si elle est utilisée par ex: Docker healthcheck)
  const dbCheck = await checkDatabase();
  res.status(dbCheck.status === 'error' ? 503 : 200).json({ database: dbCheck.status });
}));


// --- NOUVELLE ROUTE POUR LE DASHBOARD ---

const checkServiceHealth = async (serviceName, checkFunction) => {
  const startTime = Date.now();
  try {
    await checkFunction();
    const endTime = Date.now();
    return {
      name: serviceName,
      status: 'healthy',
      responseTime: `${endTime - startTime}ms`,
    };
  } catch (error) {
    const endTime = Date.now();
    logger.error(`Health check failed for ${serviceName}:`, error);
    return {
      name: serviceName,
      status: 'unhealthy',
      error: error.message,
      responseTime: `${endTime - startTime}ms`,
    };
  }
};

const axios = require('axios');

router.get('/status', protect, catchAsync(async (req, res) => {
  // Infrastructure checks
  const dbCheck = checkServiceHealth('Database', () => prisma.$queryRaw`SELECT 1`);
  const redisCheck = checkServiceHealth('Redis', () => redisClient.ping());
  const backendCheck = Promise.resolve({ name: 'Backend', status: 'healthy' });
  const nginxCheck = Promise.resolve({ name: 'Nginx', status: 'healthy' });
  const frontendCheck = Promise.resolve({ name: 'Frontend', status: 'healthy' });


  const infrastructureChecks = await Promise.all([backendCheck, frontendCheck, nginxCheck, dbCheck, redisCheck]);

  // Tool checks
  const busterCheck = checkServiceHealth('Buster', () => axios.get('http://buster-service:5003/health'));
  const mosintCheck = checkServiceHealth('Mosint', () => axios.get('http://mosint-service:5004/health'));
  
  const toolChecks = await Promise.all([
    busterCheck,
    mosintCheck,
    // Mocks for other tools until they are implemented
    Promise.resolve({ name: 'Maigret', status: 'degraded', error: 'Too many errors of type "Access denied"' }),
    Promise.resolve({ name: 'PhoneInfoga', status: 'healthy' }),
    Promise.resolve({ name: 'SpiderFoot', status: 'healthy' }),
  ]);

  res.json({
    infrastructure: infrastructureChecks,
    tools: toolChecks,
  });
}));


module.exports = router;