const express = require('express');
const Joi = require('joi');
const { PrismaClient } = require('@prisma/client');
const logger = require('../../utils/logger');
const DynamicOrchestrator = require('../../services/orchestrator.service');

const router = express.Router();
const prisma = new PrismaClient();
const orchestrator = new DynamicOrchestrator(prisma);

// Schéma de validation pour le démarrage d'une investigation
const startInvestigationSchema = Joi.object({
  emails: Joi.array().items(Joi.string().email()).optional(),
  domains: Joi.array().items(Joi.string().domain()).optional(),
  names: Joi.array().items(Joi.string().min(1).max(100)).optional(),
  phones: Joi.array().items(Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]+$/)).optional(),
  usernames: Joi.array().items(Joi.string().min(1).max(50)).optional(),
}).min(1).messages({
  'object.min': 'Au moins un des champs suivants est requis: emails, domains, names, phones, usernames.'
});

/**
 * POST /api/v1/investigations/start
 * Démarre une nouvelle investigation basée sur les données d'entrée.
 */
router.post('/start', async (req, res) => {
  try {
    // Validation des données d'entrée
    const { error, value } = startInvestigationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Données invalides',
        details: error.details.map(detail => detail.message)
      });
    }

    // Appel de l'orchestrateur dynamique
    const result = await orchestrator.startInvestigation(value);

    logger.info('API: Dynamic investigation started', { input: value, result });

    res.status(202).json({
      message: 'Investigation dynamique démarrée avec succès.',
      ...result
    });

  } catch (err) {
    logger.error('Erreur lors du démarrage de l\'investigation dynamique:', err);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: err.message
    });
  }
});

const recursiveSearchSchema = Joi.object({
  username: Joi.string().min(1).max(50).required(),
});

/**
 * POST /api/v1/investigations/:id/recursive-search
 * Lance une recherche récursive Maigret pour un username donné dans une investigation existante.
 */
router.post('/:id/recursive-search', async (req, res) => {
  const { id } = req.params;
  const { error, value } = recursiveSearchSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Données invalides',
      details: error.details.map(detail => detail.message)
    });
  }

  try {
    // L'orchestrateur est maintenant asynchrone et gère lui-même les logs et les mises à jour.
    orchestrator.runRecursiveMaigretSearch(id, value.username);

    res.status(202).json({
      message: `La recherche récursive pour '${value.username}' a été lancée pour l'investigation ${id}.`
    });

  } catch (err) {
    logger.error(`Erreur lors du lancement de la recherche récursive pour l'investigation ${id}:`, err);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: err.message
    });
  }
});

const tagSearchSchema = Joi.object({
  username: Joi.string().min(1).max(50).required(),
  tags: Joi.string().min(1).required(),
});

/**
 * POST /api/v1/investigations/:id/tag-search
 * Lance une recherche Maigret par tags pour un username donné.
 */
router.post('/:id/tag-search', async (req, res) => {
  const { id } = req.params;
  const { error, value } = tagSearchSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Données invalides',
      details: error.details.map(detail => detail.message)
    });
  }

  try {
    // Cette méthode n'existe pas encore sur l'orchestrateur, il faudra l'ajouter.
    orchestrator.runMaigretTagSearch(id, value.username, value.tags);

    res.status(202).json({
      message: `La recherche par tags '${value.tags}' pour '${value.username}' a été lancée pour l'investigation ${id}.`
    });

  } catch (err) {
    logger.error(`Erreur lors du lancement de la recherche par tags pour l'investigation ${id}:`, err);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: err.message
    });
  }
});

/**
 * GET /api/v1/investigations/:id/graph
 * Récupère les données du graphe de corrélation pour une investigation.
 */
router.get('/:id/graph', async (req, res) => {
  const { id } = req.params;
  try {
    const investigation = await prisma.investigation.findUnique({
      where: { id },
      select: { graphData: true },
    });

    if (!investigation) {
      return res.status(404).json({ error: 'Investigation non trouvée.' });
    }

    res.json(investigation.graphData || { nodes: [], edges: [] });
  } catch (err) {
    logger.error(`Erreur lors de la récupération des données du graphe pour l'investigation ${id}:`, err);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: err.message,
    });
  }
});

const pdlEnrichmentSchema = Joi.object({
  indicatorId: Joi.string().required(),
});

/**
 * POST /api/v1/investigations/:id/pdl-enrich
 * Lance un enrichissement avancé avec People Data Labs.
 */
router.post('/:id/pdl-enrich', async (req, res) => {
  const { id } = req.params;
  const { error, value } = pdlEnrichmentSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: 'Données invalides',
      details: error.details.map(detail => detail.message)
    });
  }

  try {
    orchestrator.runPdlEnrichment(id, value.indicatorId);
    res.status(202).json({ message: 'Enrichissement PDL lancé.' });
  } catch (err) {
    logger.error(`Erreur lors du lancement de l'enrichissement PDL pour l'investigation ${id}:`, err);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: err.message,
    });
  }
});

module.exports = router;