const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { InvestigationStatus } = require('@prisma/client');
const logger = require('../utils/logger');
const Joi = require('joi');

const router = express.Router();
const prisma = new PrismaClient();

// Schémas de validation
const createInvestigationSchema = Joi.object({
  names: Joi.array().items(Joi.string().min(1).max(100)).optional(),
  emails: Joi.array().items(Joi.string().email()).optional(),
  usernames: Joi.array().items(Joi.string().min(1).max(50)).optional(),
  phones: Joi.array().items(Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]+$/)).optional(),
  domains: Joi.array().items(Joi.string().domain()).optional(),
  ips: Joi.array().items(Joi.string().ip()).optional(),
  urls: Joi.array().items(Joi.string().uri()).optional()
}).min(1);

const updateInvestigationSchema = Joi.object({
  status: Joi.string().valid(...Object.values(InvestigationStatus)).optional(),
  progress: Joi.number().min(0).max(100).optional(),
  currentStep: Joi.string().optional()
});

/**
 * GET /api/investigations
 * Récupère la liste des investigations
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construction des filtres
    const where = {};
    
    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { inputData: { path: '$.names', string_contains: search } },
        { inputData: { path: '$.emails', string_contains: search } },
        { inputData: { path: '$.usernames', string_contains: search } }
      ];
    }

    // Validation du tri
    const validSortFields = ['createdAt', 'updatedAt', 'status', 'progress'];
    const validSortOrders = ['asc', 'desc'];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder : 'desc';

    // Récupération des investigations
    const [investigations, total] = await Promise.all([
      prisma.investigation.findMany({
        where,
        skip,
        take,
        orderBy: { [sortField]: order },
        include: {
          _count: {
            select: {
              indicators: true,
              results: true,
              logs: true
            }
          }
        }
      }),
      prisma.investigation.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    logger.database('SELECT', 'investigations', { 
      count: investigations.length, 
      total, 
      page: parseInt(page), 
      totalPages 
    });

    res.json({
      investigations,
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
    logger.error('Erreur lors de la récupération des investigations:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: error.message
    });
  }
});

/**
 * GET /api/investigations/:id
 * Récupère une investigation spécifique
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const investigation = await prisma.investigation.findUnique({
      where: { id },
      include: {
        indicators: {
          orderBy: { createdAt: 'desc' }
        },
        results: {
          include: {
            indicator: true
          },
          orderBy: { createdAt: 'desc' }
        },
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 50
        },
        _count: {
          select: {
            indicators: true,
            results: true,
            logs: true
          }
        }
      }
    });

    if (!investigation) {
      return res.status(404).json({
        error: 'Investigation non trouvée',
        message: `Aucune investigation trouvée avec l'ID ${id}`
      });
    }

    logger.database('SELECT', 'investigation', { id });

    res.json({ investigation });

  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'investigation:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: error.message
    });
  }
});

/**
 * POST /api/investigations
 * Crée une nouvelle investigation
 */
router.post('/', async (req, res) => {
  try {
    // Validation des données d'entrée
    const { error, value } = createInvestigationSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.details.map(detail => detail.message)
      });
    }

    // Vérification qu'au moins un indicateur est fourni
    const hasIndicators = Object.values(value).some(arr => Array.isArray(arr) && arr.length > 0);
    
    if (!hasIndicators) {
      return res.status(400).json({
        error: 'Données insuffisantes',
        message: 'Au moins un indicateur doit être fourni (noms, emails, usernames, téléphones, domaines, IPs ou URLs)'
      });
    }

    // Création de l'investigation
    const investigation = await prisma.investigation.create({
      data: {
        status: InvestigationStatus.INITIALIZING,
        progress: 0,
        currentStep: 'initialization',
        inputData: value,
        indicators: {
          create: extractInitialIndicators(value)
        }
      },
      include: {
        indicators: true
      }
    });

    logger.database('INSERT', 'investigation', { id: investigation.id });
    logger.investigation(investigation.id, 'Nouvelle investigation créée', { inputData: value });

    res.status(201).json({
      message: 'Investigation créée avec succès',
      investigation
    });

  } catch (error) {
    logger.error('Erreur lors de la création de l\'investigation:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: error.message
    });
  }
});

/**
 * PUT /api/investigations/:id
 * Met à jour une investigation
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validation des données d'entrée
    const { error, value } = updateInvestigationSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.details.map(detail => detail.message)
      });
    }

    // Vérification de l'existence de l'investigation
    const existingInvestigation = await prisma.investigation.findUnique({
      where: { id }
    });

    if (!existingInvestigation) {
      return res.status(404).json({
        error: 'Investigation non trouvée',
        message: `Aucune investigation trouvée avec l'ID ${id}`
      });
    }

    // Mise à jour de l'investigation
    const updatedInvestigation = await prisma.investigation.update({
      where: { id },
      data: value,
      include: {
        indicators: true,
        results: {
          include: { indicator: true }
        }
      }
    });

    logger.database('UPDATE', 'investigation', { id });
    logger.investigation(id, 'Investigation mise à jour', { updates: value });

    res.json({
      message: 'Investigation mise à jour avec succès',
      investigation: updatedInvestigation
    });

  } catch (error) {
    logger.error('Erreur lors de la mise à jour de l\'investigation:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: error.message
    });
  }
});

/**
 * DELETE /api/investigations/:id
 * Supprime une investigation
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérification de l'existence de l'investigation
    const existingInvestigation = await prisma.investigation.findUnique({
      where: { id }
    });

    if (!existingInvestigation) {
      return res.status(404).json({
        error: 'Investigation non trouvée',
        message: `Aucune investigation trouvée avec l'ID ${id}`
      });
    }

    // Suppression de l'investigation (cascade automatique grâce aux relations)
    await prisma.investigation.delete({
      where: { id }
    });

    logger.database('DELETE', 'investigation', { id });
    logger.investigation(id, 'Investigation supprimée');

    res.json({
      message: 'Investigation supprimée avec succès'
    });

  } catch (error) {
    logger.error('Erreur lors de la suppression de l\'investigation:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: error.message
    });
  }
});

/**
 * POST /api/investigations/:id/start
 * Démarre une investigation
 */
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérification de l'existence de l'investigation
    const investigation = await prisma.investigation.findUnique({
      where: { id },
      include: {
        indicators: true
      }
    });

    if (!investigation) {
      return res.status(404).json({
        error: 'Investigation non trouvée',
        message: `Aucune investigation trouvée avec l'ID ${id}`
      });
    }

    // Vérification que l'investigation n'est pas déjà en cours
    if (investigation.status === InvestigationStatus.ENRICHING || 
        investigation.status === InvestigationStatus.SCANNING ||
        investigation.status === InvestigationStatus.CONSOLIDATING) {
      return res.status(400).json({
        error: 'Investigation déjà en cours',
        message: 'Cette investigation est déjà en cours d\'exécution'
      });
    }

    // Démarrage de l'investigation via l'orchestrateur
    // Note: L'orchestrateur sera injecté via le middleware
    const { orchestrator } = req.app.locals;
    
    if (!orchestrator) {
      return res.status(500).json({
        error: 'Orchestrateur non disponible',
        message: 'Le service d\'orchestration n\'est pas disponible'
      });
    }

    // Démarrage asynchrone de l'investigation
    orchestrator.runEnrichmentFlow(id);

    logger.investigation(id, 'Investigation démarrée');

    res.json({
      message: 'Investigation démarrée avec succès',
      investigationId: id
    });

  } catch (error) {
    logger.error('Erreur lors du démarrage de l\'investigation:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: error.message
    });
  }
});

/**
 * POST /api/investigations/:id/stop
 * Arrête une investigation en cours
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérification de l'existence de l'investigation
    const investigation = await prisma.investigation.findUnique({
      where: { id }
    });

    if (!investigation) {
      return res.status(404).json({
        error: 'Investigation non trouvée',
        message: `Aucune investigation trouvée avec l'ID ${id}`
      });
    }

    // Vérification que l'investigation est en cours
    if (investigation.status !== InvestigationStatus.ENRICHING && 
        investigation.status !== InvestigationStatus.SCANNING &&
        investigation.status !== InvestigationStatus.CONSOLIDATING) {
      return res.status(400).json({
        error: 'Investigation non en cours',
        message: 'Cette investigation n\'est pas en cours d\'exécution'
      });
    }

    // Arrêt de l'investigation via l'orchestrateur
    const { orchestrator } = req.app.locals;
    
    if (orchestrator) {
      await orchestrator.stopInvestigation(id);
    }

    logger.investigation(id, 'Investigation arrêtée');

    res.json({
      message: 'Investigation arrêtée avec succès',
      investigationId: id
    });

  } catch (error) {
    logger.error('Erreur lors de l\'arrêt de l\'investigation:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: error.message
    });
  }
});

/**
 * GET /api/investigations/:id/results
 * Récupère les résultats d'une investigation
 */
router.get('/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    const { tool, type, limit = 100 } = req.query;

    // Construction des filtres
    const where = { investigationId: id };
    
    if (tool) {
      where.toolSource = tool;
    }

    if (type) {
      where.indicator = {
        type: type
      };
    }

    const results = await prisma.result.findMany({
      where,
      include: {
        indicator: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    logger.database('SELECT', 'results', { investigationId: id, count: results.length });

    res.json({
      investigationId: id,
      results,
      count: results.length
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des résultats:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: error.message
    });
  }
});

/**
 * GET /api/investigations/:id/logs
 * Récupère les logs d'une investigation
 */
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { step, level, limit = 100 } = req.query;

    // Construction des filtres
    const where = { investigationId: id };
    
    if (step) {
      where.step = step;
    }

    if (level) {
      where.level = level;
    }

    const logs = await prisma.investigationLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit)
    });

    logger.database('SELECT', 'logs', { investigationId: id, count: logs.length });

    res.json({
      investigationId: id,
      logs,
      count: logs.length
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des logs:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: error.message
    });
  }
});

/**
 * Fonction utilitaire pour extraire les indicateurs initiaux
 */
function extractInitialIndicators(inputData) {
  const indicators = [];

  if (inputData.names && Array.isArray(inputData.names)) {
    inputData.names.forEach(name => {
      indicators.push({
        type: 'NAME',
        value: name.trim(),
        source: 'input',
        confidence: 1.0,
        verified: true
      });
    });
  }

  if (inputData.emails && Array.isArray(inputData.emails)) {
    inputData.emails.forEach(email => {
      indicators.push({
        type: 'EMAIL',
        value: email.trim(),
        source: 'input',
        confidence: 1.0,
        verified: true
      });
    });
  }

  if (inputData.usernames && Array.isArray(inputData.usernames)) {
    inputData.usernames.forEach(username => {
      indicators.push({
        type: 'USERNAME',
        value: username.trim(),
        source: 'input',
        confidence: 1.0,
        verified: true
      });
    });
  }

  if (inputData.phones && Array.isArray(inputData.phones)) {
    inputData.phones.forEach(phone => {
      indicators.push({
        type: 'PHONE',
        value: phone.trim(),
        source: 'input',
        confidence: 1.0,
        verified: true
      });
    });
  }

  if (inputData.domains && Array.isArray(inputData.domains)) {
    inputData.domains.forEach(domain => {
      indicators.push({
        type: 'DOMAIN',
        value: domain.trim(),
        source: 'input',
        confidence: 1.0,
        verified: true
      });
    });
  }

  if (inputData.ips && Array.isArray(inputData.ips)) {
    inputData.ips.forEach(ip => {
      indicators.push({
        type: 'IP',
        value: ip.trim(),
        source: 'input',
        confidence: 1.0,
        verified: true
      });
    });
  }

  if (inputData.urls && Array.isArray(inputData.urls)) {
    inputData.urls.forEach(url => {
      indicators.push({
        type: 'URL',
        value: url.trim(),
        source: 'input',
        confidence: 1.0,
        verified: true
      });
    });
  }

  return indicators;
}

module.exports = router;