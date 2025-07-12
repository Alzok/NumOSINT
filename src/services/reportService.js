const puppeteer = require('puppeteer');
const { Parser } = require('json2csv');

/**
 * Generates a PDF report for an investigation.
 * @param {object} investigationData - The data of the investigation.
 * @returns {Promise<Buffer>} - A promise that resolves with the PDF buffer.
 */
async function generatePdfReport(investigationData) {
  // TODO: Implement PDF generation with Puppeteer
  // For now, returning a placeholder
  return Buffer.from(`<h1>Report for ${investigationData.name}</h1>`);
}

/**
 * Generates a CSV report for an investigation.
 * @param {object} investigationData - The data of the investigation.
 * @returns {Promise<string>} - A promise that resolves with the CSV content.
 */
async function generateCsvReport(investigationData) {
    const results = investigationData.results || [];
    const fields = [
        { label: 'ID Résultat', value: 'id' },
        { label: 'Outil Source', value: 'tool' },
        { label: 'Type Indicateur', value: 'indicator.type' },
        { label: 'Valeur Indicateur', value: 'indicator.value' },
        { label: 'Donnée Principale', value: 'key' },
        { label: 'Détails JSON', value: 'data' },
        { label: 'Score', value: 'score' },
        { label: 'Date Création', value: 'createdAt' },
    ];

    const json2csvParser = new Parser({ fields, unwind: 'indicator' });
    const csv = json2csvParser.parse(results);
    return csv;
}

module.exports = {
  generatePdfReport,
  generateCsvReport,
};