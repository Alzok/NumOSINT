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
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where = {};
  if (status) {
    where.status = status;
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
  const investigation = await prisma.investigation.findUnique({
    where: { id },
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

// POST /api/investigations - Créer une investigation
router.post('/', protect, validate(investigationValidation.startInvestigation), catchAsync(async (req, res) => {
  const { indicators, caseId, options } = req.body;

  const investigation = await prisma.investigation.create({
    data: {
      status: InvestigationStatus.INITIALIZING,
      progress: 0,
      currentStep: 'initialization',
      inputData: { indicators, options },
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

  logger.investigation(investigation.id, 'Nouvelle investigation créée', { inputData: req.body });

  res.status(201).json({
    message: 'Investigation créée avec succès',
    investigation,
  });
}));

// DELETE /api/investigations/:id - Supprimer une investigation
router.delete('/:id', protect, validate(investigationValidation.deleteInvestigation), catchAsync(async (req, res) => {
  const { id } = req.params;
  
  await prisma.investigation.findUniqueOrThrow({ where: { id } });
  await prisma.investigation.delete({ where: { id } });

  logger.investigation(id, 'Investigation supprimée');
  res.status(204).send();
}));

// POST /api/investigations/:id/start - Démarrer une investigation
router.post('/:id/start', protect, validate(investigationValidation.getInvestigation), catchAsync(async (req, res) => {
  const { id } = req.params;
  const { orchestrator } = req.app.locals;

  const investigation = await prisma.investigation.findUniqueOrThrow({ where: { id } });

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

  logger.investigation(id, 'Investigation démarrée');
  res.status(202).json({ message: 'Investigation démarrée avec succès' });
}));

// POST /api/investigations/:id/stop - Arrêter une investigation
router.post('/:id/stop', protect, validate(investigationValidation.stopInvestigation), catchAsync(async (req, res) => {
  const { id } = req.params;
  const { orchestrator } = req.app.locals;

  if (!orchestrator) {
    throw new ApiError('Orchestrateur non disponible', 500);
  }

  const result = await orchestrator.stopInvestigation(id);
  logger.investigation(id, 'Demande d\'arrêt de l\'investigation');
  res.status(202).json(result);
}));

// GET /api/investigations/:id/results - Obtenir les résultats
router.get('/:id/results', protect, validate(investigationValidation.getInvestigation), catchAsync(async (req, res) => {
  const { id } = req.params;
  const { tool, type, limit = 100 } = req.query;

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

  const results = await prisma.result.findMany({
    where: { investigationId: id },
    orderBy: { createdAt: 'desc' },
  });

  const summary = ResultTransformer.transform(results);
  res.json({ summary });
}));

module.exports = router;