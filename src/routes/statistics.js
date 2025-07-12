const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
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
router.get('/', async (req, res) => {
  try {
    const totalInvestigations = await prisma.investigation.count();
    const totalResults = await prisma.result.count();

    const resultsByTool = await prisma.result.groupBy({
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
      totalResults,
      resultsByTool: resultsByTool.map(item => ({ toolSource: item.toolSource, count: item._count.toolSource })),
      indicatorsByType: indicatorsByType.map(item => ({ type: item.type, count: item._count.type })),
    });
  } catch (error) {
    console.error('Error fetching global statistics:', error);
    res.status(500).json({ error: 'Failed to fetch global statistics' });
  }
});

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
router.get('/investigations-over-time', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT DATE_TRUNC('day', "createdAt")::DATE as date, COUNT(*)::int as count
      FROM "investigations"
      GROUP BY date
      ORDER BY date ASC
    `;

    // Format data for easier consumption by charting libraries
    const formattedResult = result.map(item => ({
      date: item.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
      count: item.count,
    }));

    res.json(formattedResult);
  } catch (error) {
    console.error('Error fetching investigations over time statistics:', error);
    res.status(500).json({ error: 'Failed to fetch investigations over time statistics' });
  }
});

module.exports = router;