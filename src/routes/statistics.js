const express = require('express');
const prisma = require('../utils/prisma');
const catchAsync = require('../utils/catchAsync');
const protect = require('../middlewares/auth');
const cache = require('../middlewares/cache');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: Statistiques sur les données d'investigation
 */

/**
 * @swagger
 * /api/statistics:
 *   get:
 *     summary: Récupère les statistiques globales
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Un objet contenant les statistiques globales
 *       500:
 *         description: Erreur serveur
 */
router.get('/dashboard', protect, catchAsync(async (req, res) => {
  const { period, date } = req.query;
  const userId = req.user.id;

  const where = { userId };

  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    where.createdAt = { gte: startDate, lt: endDate };
  } else if (period) {
    const startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '30d':
      default:
        startDate.setDate(startDate.getDate() - 30);
        break;
    }
    where.createdAt = { gte: startDate };
  }

  const totalInvestigations = await prisma.investigation.count({ where });
  const completedInvestigations = await prisma.investigation.count({ where: { ...where, status: 'COMPLETED' } });
  const runningInvestigations = await prisma.investigation.count({ where: { ...where, status: { in: ['SCANNING', 'ENRICHING', 'CONSOLIDATING'] } } });
  
  const resultsAggregation = await prisma.result.aggregate({
    where: { investigation: where },
    _count: { _all: true },
  });
  const totalResults = resultsAggregation._count._all;

  const resultsByTool = await prisma.result.groupBy({
    where: { investigation: where },
    by: ['toolSource'],
    _count: {
      toolSource: true,
    },
    orderBy: {
      _count: {
        toolSource: 'desc',
      },
    },
  });

  const indicatorsByType = await prisma.indicator.groupBy({
    where: { investigation: where },
    by: ['type'],
    _count: {
      type: true,
    },
    orderBy: {
      _count: {
        type: 'desc',
      },
    },
  });

  res.json({
    totalInvestigations,
    completedInvestigations,
    runningInvestigations,
    totalResults,
    resultsByTool: resultsByTool.map(item => ({ toolSource: item.toolSource, count: item._count.toolSource })),
    indicatorsByType: indicatorsByType.map(item => ({ type: item.type, count: item._count.type })),
  });
}));

/**
 * @swagger
 * /api/statistics/investigations-over-time:
 *   get:
 *     summary: Récupère le nombre d'investigations créées par jour
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Une liste d'objets avec date et nombre d'investigations
 *       500:
 *         description: Erreur serveur
 */
router.get('/investigations-over-time', protect, catchAsync(async (req, res) => {
  const { period = '30d' } = req.query;
  const userId = req.user.id;

  let startDate = new Date();
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '30d':
    default:
      startDate.setDate(startDate.getDate() - 30);
      break;
  }

  const result = await prisma.$queryRaw`
    SELECT DATE_TRUNC('day', "createdAt")::DATE as date, COUNT(*)::int as count
    FROM "investigations"
    WHERE "createdAt" >= ${startDate} AND "userId" = ${userId}
    GROUP BY date
    ORDER BY date ASC
  `;

  // Format data for easier consumption by charting libraries
  const formattedResult = result.map(item => ({
    date: item.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
    count: item.count,
  }));

  res.json(formattedResult);
}));

module.exports = router;