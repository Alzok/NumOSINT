const express = require('express');
const { PrismaClient } = require('@prisma/client');
const ReportService = require('../services/reportService');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();
const reportService = new ReportService(prisma);

  /**
   * Endpoint pour exporter le rapport d'une investigation.
   * GET /api/reports/investigation/:id/export?format=pdf
   */
  router.get('/investigation/:id/export', async (req, res) => {
    const { id } = req.params;
    const { format } = req.query;

    if (!format || !['pdf', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Le paramètre "format" (pdf ou csv) est requis.' });
    }

    try {
      const reportContent = await reportService.generateInvestigationReport(id, format);
      
      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="rapport-investigation-${id}.pdf"`);
        res.send(reportContent);
      } else if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="rapport-investigation-${id}.csv"`);
        res.send(reportContent);
      }
    } catch (error) {
      logger.error(`Erreur lors de la génération du rapport pour l'investigation ${id}:`, error);
      if (error.message === 'Investigation non trouvée') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erreur interne du serveur lors de la génération du rapport.' });
    }
  });

  /**
   * Endpoint pour exporter le rapport d'un dossier.
   * GET /api/reports/case/:id/export?format=pdf
   */
  router.get('/case/:id/export', async (req, res) => {
    const { id } = req.params;
    const { format } = req.query;

    if (!format || !['pdf', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Le paramètre "format" (pdf ou csv) est requis.' });
    }
    
    // Note: La logique pour les dossiers n'est pas encore implémentée dans le service.
    // Cet endpoint est prêt pour quand elle le sera.
    return res.status(501).json({ error: 'La génération de rapport pour les dossiers n\'est pas encore implémentée.' });
  });

module.exports = router;