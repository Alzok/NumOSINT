const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { InvestigationStatus } = require('@prisma/client');
const logger = require('../utils/logger');
const Joi = require('joi');
const ResultTransformer = require('../utils/resultTransformer');

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
  urls: Joi.array().items(Joi.string().uri()).optional(),
  maxGeneration: Joi.number().integer().min(1).max(20).optional(),
  minConfidence: Joi.number().min(0).max(1).optional()
}).min(1);

const updateInvestigationSchema = Joi.object({
  status: Joi.string().valid(...Object.values(InvestigationStatus)).optional(),
  progress: Joi.number().min(0).max(100).optional(),
  currentStep: Joi.string().optional()
});

/**
 * @swagger
 * tags:
 *   name: Investigations
 *   description: Gestion des investigations
 */

/**
 * @swagger
 * /api/investigations:
 *   get:
 *     summary: Récupère la liste des investigations
 *     tags: [Investigations]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de la page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [INITIALIZING, ENRICHING, SCANNING, CONSOLIDATING, COMPLETED, FAILED, CANCELLED]
 *         description: Filtrer par statut d'investigation
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche par nom, email ou nom d'utilisateur
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, status, progress]
 *           default: createdAt
 *         description: Champ de tri
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordre de tri
 *     responses:
 *       200:
 *         description: Liste des investigations récupérée avec succès
 *       500:
 *         description: Erreur interne du serveur
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
 * @swagger
 * /api/investigations/{id}:
 *   get:
 *     summary: Récupère une investigation spécifique par son ID
 *     tags: [Investigations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'investigation
 *     responses:
 *       200:
 *         description: Investigation récupérée avec succès
 *       404:
 *         description: Investigation non trouvée
 *       500:
 *         description: Erreur interne du serveur
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
 * @swagger
 * /api/investigations:
 *   post:
 *     summary: Crée une nouvelle investigation
 *     tags: [Investigations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               names:
 *                 type: array
 *                 items:
 *                   type: string
 *               emails:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *               usernames:
 *                 type: array
 *                 items:
 *                   type: string
 *               phones:
 *                 type: array
 *                 items:
 *                   type: string
 *               domains:
 *                 type: array
 *                 items:
 *                   type: string
 *               ips:
 *                 type: array
 *                 items:
 *                   type: string
 *               urls:
 *                 type: array
 *                 items:
 *                   type: string
 *               maxGeneration:
 *                 type: integer
 *                 default: 3
 *               minConfidence:
 *                 type: number
 *                 format: float
 *                 default: 0.7
 *     responses:
 *       201:
 *         description: Investigation créée avec succès
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur interne du serveur
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
    const { maxGeneration, minConfidence, ...inputData } = value;
    const investigation = await prisma.investigation.create({
      data: {
        status: InvestigationStatus.INITIALIZING,
        progress: 0,
        currentStep: 'initialization',
        inputData: inputData,
        maxGeneration: maxGeneration,
        minConfidence: minConfidence,
        indicators: {
          create: extractInitialIndicators(inputData)
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
 * @swagger
 * /api/investigations/{id}:
 *   put:
 *     summary: Met à jour une investigation existante
 *     tags: [Investigations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'investigation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [INITIALIZING, ENRICHING, SCANNING, CONSOLIDATING, COMPLETED, FAILED, CANCELLED]
 *               progress:
 *                 type: integer
 *               currentStep:
 *                 type: string
 *     responses:
 *       200:
 *         description: Investigation mise à jour avec succès
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Investigation non trouvée
 *       500:
 *         description: Erreur interne du serveur
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
 * @swagger
 * /api/investigations/{id}:
 *   delete:
 *     summary: Supprime une investigation
 *     tags: [Investigations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'investigation
 *     responses:
 *       200:
 *         description: Investigation supprimée avec succès
 *       404:
 *         description: Investigation non trouvée
 *       500:
 *         description: Erreur interne du serveur
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
 * @swagger
 * /api/investigations/{id}/start:
 *   post:
 *     summary: Démarre une investigation
 *     tags: [Investigations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'investigation
 *     responses:
 *       200:
 *         description: Investigation démarrée avec succès
 *       400:
 *         description: Investigation déjà en cours
 *       404:
 *         description: Investigation non trouvée
 *       500:
 *         description: Erreur interne du serveur ou orchestrateur non disponible
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
    orchestrator.runInvestigationFlow(id);

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
 * @swagger
 * /api/investigations/{id}/stop:
 *   post:
 *     summary: Arrête une investigation en cours
 *     tags: [Investigations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'investigation
 *     responses:
 *       202:
 *         description: Demande d'arrêt acceptée
 *       500:
 *         description: Erreur interne du serveur ou orchestrateur non disponible
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const { orchestrator } = req.app.locals;

    if (!orchestrator) {
      return res.status(500).json({
        error: 'Orchestrateur non disponible',
        message: 'Le service d\'orchestration n\'est pas disponible'
      });
    }

    const result = await orchestrator.stopInvestigation(id);
    
    logger.investigation(id, 'Demande d\'arrêt de l\'investigation');

    res.status(202).json(result);

  } catch (error) {
    logger.error(`Erreur lors de la demande d'arrêt de l'investigation ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/investigations/{id}/results:
 *   get:
 *     summary: Récupère les résultats d'une investigation
 *     tags: [Investigations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'investigation
 *       - in: query
 *         name: tool
 *         schema:
 *           type: string
 *         description: Filtrer les résultats par outil source
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrer les résultats par type d'indicateur
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Nombre maximum de résultats à retourner
 *     responses:
 *       200:
 *         description: Résultats récupérés avec succès
 *       500:
 *         description: Erreur interne du serveur
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
 * @swagger
 * /api/investigations/{id}/logs:
 *   get:
 *     summary: Récupère les logs d'une investigation
 *     tags: [Investigations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'investigation
 *       - in: query
 *         name: step
 *         schema:
 *           type: string
 *         description: Filtrer les logs par étape
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [INFO, WARNING, ERROR, DEBUG]
 *         description: Filtrer les logs par niveau
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Nombre maximum de logs à retourner
 *     responses:
 *       200:
 *         description: Logs récupérés avec succès
 *       500:
 *         description: Erreur interne du serveur
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
 * @swagger
 * /api/investigations/{id}/summary:
 *   get:
 *     summary: Récupère un résumé standardisé des résultats pour une investigation
 *     tags: [Investigations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'investigation
 *     responses:
 *       200:
 *         description: Résumé récupéré avec succès
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/:id/summary', async (req, res) => {
  try {
    const { id } = req.params;

    const results = await prisma.result.findMany({
      where: { investigationId: id },
      orderBy: { createdAt: 'desc' },
    });

    if (!results) {
      return res.json({ summary: [] });
    }

    const summary = ResultTransformer.transform(results);

    logger.database('SELECT', 'investigation_summary', { investigationId: id, count: summary.length });

    res.json({ summary });

  } catch (error) {
    logger.error(`Erreur lors de la récupération du résumé pour l'investigation ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: error.message,
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