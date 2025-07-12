const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { generatePdfReport, generateCsvReport } = require('../services/reportService');

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Génération de rapports
 */

/**
 * @swagger
 * /api/reports/investigation/{id}/export:
 *   get:
 *     summary: Exporter le rapport d'une investigation
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'investigation
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, csv]
 *         description: Format du rapport
 *     responses:
 *       200:
 *         description: Rapport généré avec succès
 *       400:
 *         description: Format de rapport invalide
 *       404:
 *         description: Investigation non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/investigation/:id/export', async (req, res) => {
  const { id } = req.params;
  const { format } = req.query;

  if (!format || !['pdf', 'csv'].includes(format)) {
    return res.status(400).json({ error: 'Format de rapport invalide. Utilisez "pdf" ou "csv".' });
  }

  try {
    const investigation = await prisma.investigation.findUnique({
      where: { id: id },
      include: {
        results: {
          include: {
            indicator: true,
          },
        },
      },
    });

    if (!investigation) {
      return res.status(404).json({ error: 'Investigation non trouvée.' });
    }

    if (format === 'pdf') {
      const pdfBuffer = await generatePdfReport(investigation);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report-investigation-${id}.pdf"`);
      res.send(pdfBuffer);
    } else if (format === 'csv') {
      const csvContent = await generateCsvReport(investigation);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report-investigation-${id}.csv"`);
      res.send(csvContent);
    }
  } catch (error) {
    console.error("Erreur lors de la génération du rapport :", error);
    res.status(500).json({ error: "Erreur interne du serveur lors de la génération du rapport." });
  }
});

// TODO: Ajouter la route pour l'export de cas (case)
// router.get('/case/:id/export', ...);

module.exports = router;