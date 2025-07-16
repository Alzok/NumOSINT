const puppeteer = require('puppeteer');
const { Parser } = require('json2csv');
const ResultTransformer = require('../utils/resultTransformer');

/**
 * Generates a PDF report for an investigation.
 * @param {object} investigationData - The data of the investigation.
 * @returns {Promise<Buffer>} - A promise that resolves with the PDF buffer.
 */
async function generatePdfReport(investigationData) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Requis pour l'exécution dans Docker
    });
    const page = await browser.newPage();
    
    // L'URL doit utiliser le nom du service interne de Docker
    const reportUrl = `http://frontend:3000/report/${investigationData.id}`;
    
    await page.goto(reportUrl, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });
    
    return pdfBuffer;
  } catch (error) {
    console.error("Erreur lors de la génération du PDF avec Puppeteer:", error);
    throw new Error("Impossible de générer le rapport PDF.");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generates a CSV report for an investigation using standardized evidence items.
 * @param {object} investigationData - The data of the investigation.
 * @returns {Promise<string>} - A promise that resolves with the CSV content.
 */
async function generateCsvReport(investigationData) {
    const transformedResults = ResultTransformer.transform(investigationData.results || []);
    
    const fields = [
        { label: 'Type', value: 'type' },
        { label: 'Catégorie', value: 'category' },
        { label: 'Valeur', value: 'value' },
        { label: 'Source', value: 'sourceTool' },
        { label: 'Lien', value: 'link' },
        { label: 'Détails', value: (row) => JSON.stringify(row.details) },
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(transformedResults);
    return csv;
}

module.exports = {
  generatePdfReport,
  generateCsvReport,
};