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

module.exports = router;