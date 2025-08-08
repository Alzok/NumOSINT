const express = require('express');
const prisma = require('../utils/prisma');
const protect = require('../middlewares/auth');
const { InvestigationStatus } = require('@prisma/client');
const logger = require('../utils/logger');
const ResultTransformer = require('../utils/resultTransformer');
const validate = require('../middlewares/validate');
const investigationValidation = require('../validations/investigation.validation');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Investigations
 *   description: Gestion des investigations
 */

// GET /api/investigations - Lister toutes les investigations
router.get('/', protect, catchAsync(async (req, res) => {
  const { 
    page = 1, 
    limit = 10,
    status,
    search,
    date,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {
    userId: req.user.id,
  };
  if (status) {
    where.status = status;
  }
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    where.createdAt = {
      gte: startDate,
      lt: endDate,
    };
  }
  if (search) {
    where.OR = [
      { inputData: { path: '$.indicators[*].value', string_contains: search } },
    ];
  }

  const validSortFields = ['createdAt', 'updatedAt', 'status', 'progress'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const order = sortOrder === 'asc' ? 'asc' : 'desc';

  const [investigations, total] = await prisma.$transaction([
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

  res.json({
    data: investigations,
    pagination: {
      page: parseInt(page),
      limit: take,
      total,
      totalPages,
    },
  });
}));

// GET /api/investigations/:id - Obtenir une investigation
router.get('/:id', protect, validate(investigationValidation.getInvestigation), catchAsync(async (req, res) => {
  const { id } = req.params;
  const investigation = await prisma.investigation.findFirst({
    where: { 
      id,
      userId: req.user.id
    },
    include: {
      indicators: { orderBy: { createdAt: 'desc' } },
      results: { include: { indicator: true }, orderBy: { createdAt: 'desc' } },
      logs: { orderBy: { timestamp: 'desc' }, take: 50 },
      _count: { select: { indicators: true, results: true, logs: true } }
    }
  });

  if (!investigation) {
    throw new ApiError('Investigation non trouvée', 404);
  }

  res.json({ investigation });
}));

// POST /api/investigations/cost - Calculer le coût d'une investigation
router.post('/cost', protect, validate(investigationValidation.startInvestigation), catchAsync(async (req, res) => {
  const { indicators, options, userId } = req.body;
  const { orchestrator } = req.app.locals;

  if (!orchestrator) {
    throw new ApiError('Orchestrateur non disponible', 500);
  }

  const result = await orchestrator.calculateInvestigationCost(indicators, options, userId);
  
  res.json(result);
}));

// POST /api/investigations - Créer une investigation
router.post('/', protect, validate(investigationValidation.startInvestigation), catchAsync(async (req, res) => {
  const { caseId, options, indicators } = req.body;

  const { orchestrator } = req.app.locals;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (!orchestrator) {
    throw new ApiError('Orchestrateur non disponible', 500);
  }
  
  logger.debug(`[Debug] Creating investigation with indicators: ${JSON.stringify(indicators)}`);
  logger.debug(`[Debug] Creating investigation with options: ${JSON.stringify(options)}`);

  const costResult = await orchestrator.calculateInvestigationCost(indicators, options, req.user.id);
  logger.info(`[Create Investigation] userId: ${req.user.id}, costResult: ${JSON.stringify(costResult)}`);

  if (!costResult.hasEnoughCredits) {
    logger.warn(`[Create Investigation] User ${req.user.id} has insufficient credits.`);
    throw new ApiError('Jetons insuffisants pour lancer cette investigation.', 402);
  }

  // La déduction des jetons est maintenant gérée par l'orchestrateur à la fin.
  const investigation = await prisma.investigation.create({
    data: {
      userId: req.user.id,
      status: InvestigationStatus.INITIALIZING,
      progress: 0,
      currentStep: 'initialization',
      inputData: { indicators, options, cost: costResult.cost }, // On enregistre le coût pour plus tard
      maxGeneration: options?.maxGeneration,
      minConfidence: options?.minConfidence,
      caseId: caseId,
      indicators: {
        create: indicators.map(ind => ({
          type: ind.type,
          value: ind.value,
          source: 'input',
          confidence: 1.0,
          verified: true,
        })),
      },
    },
    include: {
      indicators: true,
    },
  });

  logger.investigation(investigation.id, 'Nouvelle investigation créée', { userId: req.user.id, inputData: req.body, cost: costResult.cost });

  res.status(201).json({
    message: 'Investigation créée avec succès',
    investigation,
  });
}));

// DELETE /api/investigations/:id - Supprimer une investigation
router.delete('/:id', protect, validate(investigationValidation.deleteInvestigation), catchAsync(async (req, res) => {
  const { id } = req.params;
  
  await prisma.investigation.findFirstOrThrow({ 
    where: { id, userId: req.user.id } 
  });

  await prisma.investigation.delete({ where: { id } });

  logger.investigation(id, 'Investigation supprimée', { userId: req.user.id });
  res.status(204).send();
}));

// POST /api/investigations/:id/start - Démarrer une investigation
router.post('/:id/start', protect, validate(investigationValidation.getInvestigation), catchAsync(async (req, res) => {
  const { id } = req.params;
  const { orchestrator } = req.app.locals;

  const investigation = await prisma.investigation.findFirstOrThrow({ 
    where: { id, userId: req.user.id } 
  });

  const runningStatuses = [
    InvestigationStatus.ENRICHING,
    InvestigationStatus.SCANNING,
    InvestigationStatus.CONSOLIDATING
  ];

  if (runningStatuses.includes(investigation.status)) {
    throw new ApiError('Investigation déjà en cours', 400);
  }

  if (!orchestrator) {
    throw new ApiError('Orchestrateur non disponible', 500);
  }

  orchestrator.runInvestigationFlow(id, req.user.id);

  logger.investigation(id, 'Investigation démarrée', { userId: req.user.id });
  res.status(202).json({ message: 'Investigation démarrée avec succès' });
}));

// POST /api/investigations/:id/stop - Arrêter une investigation
router.post('/:id/stop', protect, validate(investigationValidation.stopInvestigation), catchAsync(async (req, res) => {
  const { id } = req.params;
  const { orchestrator } = req.app.locals;
  
  await prisma.investigation.findFirstOrThrow({ 
    where: { id, userId: req.user.id } 
  });

  if (!orchestrator) {
    throw new ApiError('Orchestrateur non disponible', 500);
  }

  const result = await orchestrator.stopInvestigation(id);
  logger.investigation(id, 'Demande d\'arrêt de l\'investigation', { userId: req.user.id });
  res.status(202).json(result);
}));

// GET /api/investigations/:id/results - Obtenir les résultats
router.get('/:id/results', protect, validate(investigationValidation.getInvestigation), catchAsync(async (req, res) => {
  const { id } = req.params;
  const { tool, type, limit = 100 } = req.query;

  await prisma.investigation.findFirstOrThrow({ 
    where: { id, userId: req.user.id } 
  });

  const where = { investigationId: id };
  if (tool) where.toolSource = tool;
  if (type) where.indicator = { type: type };

  const results = await prisma.result.findMany({
    where,
    include: { indicator: true },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit)
  });

  res.json({
    investigationId: id,
    results,
    count: results.length
  });
}));

// GET /api/investigations/:id/logs - Obtenir les logs
router.get('/:id/logs', protect, validate(investigationValidation.getInvestigation), catchAsync(async (req, res) => {
  const { id } = req.params;
  const { step, level, limit = 100 } = req.query;

  await prisma.investigation.findFirstOrThrow({ 
    where: { id, userId: req.user.id } 
  });

  const where = { investigationId: id };
  if (step) where.step = step;
  if (level) where.level = level;

  const logs = await prisma.investigationLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: parseInt(limit)
  });

  res.json({
    investigationId: id,
    logs,
    count: logs.length
  });
}));

// GET /api/investigations/:id/summary - Obtenir le résumé
router.get('/:id/summary', protect, validate(investigationValidation.getInvestigation), catchAsync(async (req, res) => {
  const { id } = req.params;

  await prisma.investigation.findFirstOrThrow({ 
    where: { id, userId: req.user.id } 
  });

  const results = await prisma.result.findMany({
    where: { investigationId: id },
    orderBy: { createdAt: 'desc' },
  });

  const summary = ResultTransformer.transform(results);
  res.json({ summary });
}));

// GET /api/investigations/:id/graph - Obtenir les données du graphe
router.get('/:id/graph', protect, validate(investigationValidation.getInvestigation), catchAsync(async (req, res) => {
  const { id } = req.params;
  const investigation = await prisma.investigation.findFirstOrThrow({
    where: { id, userId: req.user.id },
    include: { indicators: true }
  });

  const nodes = investigation.indicators.map((indicator, index) => ({
    id: indicator.id,
    type: indicator.type, // Utiliser le type de l'indicateur comme type de noeud
    data: { label: indicator.value, type: indicator.type },
    position: { x: Math.random() * 400, y: Math.random() * 400 },
  }));

  // Logique de création des liens
  const edges = [];
  const initialIndicators = investigation.indicators.filter(i => i.generation === 0);

  if (initialIndicators.length > 0) {
    const initialIndicatorId = initialIndicators[0].id; // On prend le premier comme source principale
    investigation.indicators.forEach(indicator => {
      if (indicator.id !== initialIndicatorId) {
        edges.push({
          id: `e-${initialIndicatorId}-${indicator.id}`,
          source: initialIndicatorId,
          target: indicator.id,
          animated: true,
        });
      }
    });
  }

  res.json({ nodes, edges });
}));

module.exports = router;