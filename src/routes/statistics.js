const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/statistics
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

module.exports = router;