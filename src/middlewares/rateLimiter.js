const rateLimit = require('express-rate-limit');
const prisma = require('../utils/prisma');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

const conditionalRateLimiter = async (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }
  return limiter(req, res, next);
};

module.exports = conditionalRateLimiter;