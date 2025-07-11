const express = require('express');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/results
 * Récupère la liste de tous les résultats de manière paginée
 */
router.get('/', async (req, res) => {
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
 * GET /api/results/grouped
 * Récupère tous les résultats et les groupe par investigation pour la vue détaillée.
 */
router.get('/grouped', async (req, res) => {
  try {
    const investigations = await prisma.investigation.findMany({
      where: {
        results: {
          some: {}, // Ne récupérer que les investigations qui ont au moins un résultat
        },
      },
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
    });

    // Transformation des données pour correspondre à la structure attendue par AccountsTable
    const transformedData = investigations.map(inv => {
      const input = inv.inputData || {};
      const name = input.names?.[0] || 'Inconnu';
      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');

      // Regrouper les comptes par email
      const emailsMap = new Map();

      // 1. Initialiser avec les emails des indicateurs pour s'assurer que tous les emails sont présents
      if (input.emails) {
        input.emails.forEach(email => {
          if (!emailsMap.has(email)) {
            emailsMap.set(email, { email, accounts: [] });
          }
        });
      }

      // 2. Parcourir les résultats pour extraire les comptes
      inv.results.forEach(result => {
        // Mosint & Maigret structure
        if (result.toolSource === 'mosint' || result.toolSource === 'maigret') {
          const email = result.indicator?.value;
          if (email && result.data?.accounts) {
            if (!emailsMap.has(email)) {
              emailsMap.set(email, { email, accounts: [] });
            }
            const emailEntry = emailsMap.get(email);
            result.data.accounts.forEach(acc => {
              emailEntry.accounts.push({
                platform: acc.platform,
                url: acc.url,
                category: acc.category || 'Unknown',
                status: acc.exists ? 'active' : 'inactive', // Simple mapping
              });
            });
          }
        }
        // Ajouter d'autres parsers pour d'autres outils si nécessaire
      });

      return {
        id: inv.id,
        firstName: firstName || 'N/A',
        lastName: lastName || 'N/A',
        emails: Array.from(emailsMap.values()),
      };
    });

    logger.database('SELECT', 'grouped_results', { count: transformedData.length });

    res.json({
      persons: transformedData,
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
 * GET /api/results/recent
 * Récupère les résultats les plus récents toutes investigations confondues
 */
router.get('/recent', async (req, res) => {
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