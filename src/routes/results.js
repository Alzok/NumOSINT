const express = require('express');
const prisma = require('../utils/prisma');
const protect = require('../middlewares/auth');
const logger = require('../utils/logger');
const ResultTransformer = require('../utils/resultTransformer');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Results
 *   description: Gestion des résultats d'investigation
 */

/**
 * @swagger
 * /api/results:
 *   get:
 *     summary: Récupère la liste de tous les résultats de manière paginée
 *     tags: [Results]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *       - in: query
 *         name: toolSource
 *         schema:
 *           type: string
 *       - in: query
 *         name: indicatorType
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, toolSource, score]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Une liste paginée de résultats
 *       500:
 *         description: Erreur serveur
 */
router.get('/', protect, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 25, 
      toolSource,
      indicatorType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construction des filtres
    const where = {};
    if (toolSource) {
      where.toolSource = toolSource;
    }
    if (indicatorType) {
      where.indicator = { type: indicatorType };
    }

    // Validation du tri
    const validSortFields = ['createdAt', 'toolSource', 'score'];
    const validSortOrders = ['asc', 'desc'];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder : 'desc';

    // Récupération des résultats
    const [results, total] = await Promise.all([
      prisma.result.findMany({
        where,
        skip,
        take,
        orderBy: { [sortField]: order },
        include: {
          indicator: true,
          investigation: {
            select: { id: true, inputData: true }
          }
        }
      }),
      prisma.result.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    logger.database('SELECT', 'all_results', { 
      count: results.length, 
      total, 
      page: parseInt(page), 
      totalPages 
    });

    res.json({
      results,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération de tous les résultats:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/results/grouped:
 *   get:
 *     summary: Récupère tous les résultats et les groupe par investigation pour la vue détaillée.
 *     tags: [Results]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [INITIALIZING, ENRICHING, SCANNING, CONSOLIDATING, COMPLETED, FAILED, CANCELLED]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: tools
 *         schema:
 *           type: string
 *         description: "Liste d'outils séparés par des virgules"
 *       - in: query
 *         name: indicatorType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Une liste d'investigations avec leurs résultats groupés
 *       500:
 *         description: Erreur serveur
 */
router.get('/grouped', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      tools,
      indicatorType
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      results: {
        some: {}, // Ne récupérer que les investigations qui ont au moins un résultat
      },
    };

    // Ajout des filtres à la clause `where`
    if (status) {
      where.status = status;
    }
    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }
    if (tools) {
      where.results.some.toolSource = { in: tools.split(',') };
    }
    if (indicatorType) {
      where.results.some.indicator = { type: indicatorType };
    }

    const [investigations, total] = await Promise.all([
      prisma.investigation.findMany({
        where,
        skip,
        take,
        include: {
          results: {
            include: {
              indicator: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.investigation.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    // Transformation des données en utilisant le nouveau transformer
    const transformedInvestigations = investigations.map(inv => {
      const summary = ResultTransformer.transform(inv.results);
      const input = inv.inputData || {};
      const name = input.names?.[0] || `Investigation ${inv.id}`;

      return {
        id: inv.id,
        name: name,
        createdAt: inv.createdAt,
        status: inv.status,
        summary: summary, // La liste des items de preuve standardisés
        _count: {
          results: summary.length
        }
      };
    });

    logger.database('SELECT', 'grouped_results', { count: transformedInvestigations.length, total, page: parseInt(page), totalPages });

    res.json({
      investigations: transformedInvestigations,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des résultats groupés:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/results/recent:
 *   get:
 *     summary: Récupère les résultats les plus récents toutes investigations confondues
 *     tags: [Results]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Une liste de résultats récents
 *       500:
 *         description: Erreur serveur
 */
router.get('/recent', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const take = parseInt(limit);

    const recentResults = await prisma.result.findMany({
      take,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        investigation: {
          select: {
            id: true,
            inputData: true,
          },
        },
        indicator: true
      },
    });

    logger.database('SELECT', 'recent_results', { count: recentResults.length });

    res.json({
      results: recentResults,
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des résultats récents:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: error.message,
    });
  }
});

module.exports = router;