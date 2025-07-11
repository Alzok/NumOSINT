const puppeteer = require('puppeteer');
const papaparse = require('papaparse');
const logger = require('../utils/logger');

class ReportService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Génère un rapport pour une investigation donnée.
   * @param {string} investigationId - L'ID de l'investigation.
   * @param {'pdf' | 'csv'} format - Le format du rapport.
   * @returns {Promise<Buffer|string>} - Le contenu du rapport.
   */
  async generateInvestigationReport(investigationId, format) {
    logger.info(`Génération du rapport au format ${format} pour l'investigation ${investigationId}`);
    
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
      include: { indicators: true, results: true },
    });

    if (!investigation) {
      throw new Error('Investigation non trouvée');
    }

    if (format === 'pdf') {
      return this.generatePdfReport(investigation);
    } else if (format === 'csv') {
      return this.generateCsvReport(investigation);
    } else if (format === 'json') {
      return this.generateJsonReport(investigation);
    } else {
      throw new Error('Format de rapport non supporté');
    }
  }

  /**
   * Génère un rapport pour un dossier donné.
   * @param {string} caseId - L'ID du dossier.
   * @param {'pdf' | 'csv'} format - Le format du rapport.
   * @returns {Promise<Buffer|string>} - Le contenu du rapport.
   */
  async generateCaseReport(caseId, format) {
    logger.info(`Génération du rapport au format ${format} pour le dossier ${caseId}`);
    
    // Logique à implémenter pour récupérer les données d'un dossier complet
    // et les passer aux générateurs PDF/CSV.
    
    throw new Error('La génération de rapport pour les dossiers n\'est pas encore implémentée.');
  }

  /**
   * Génère un rapport PDF à partir des données d'une investigation.
   * @private
   */
  async generatePdfReport(data) {
    logger.info(`Génération du PDF pour l'investigation ${data.id}`);
    // TODO: Implémenter la logique de rendu HTML avec React et de conversion avec Puppeteer.
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Exemple simple de contenu HTML
    const htmlContent = `
      <html>
        <body>
          <h1>Rapport d'Investigation: ${data.name}</h1>
          <p>ID: ${data.id}</p>
          <h2>Indicateurs (${data.indicators.length})</h2>
          <ul>
            ${data.indicators.map(i => `<li>${i.type}: ${i.value}</li>`).join('')}
          </ul>
          <h2>Résultats (${data.results.length})</h2>
          <p>Détails à implémenter...</p>
        </body>
      </html>
    `;

    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();
    
    return pdfBuffer;
  }

  /**
   * Génère un rapport CSV à partir des données d'une investigation.
   * @private
   */
  async generateCsvReport(data) {
    logger.info(`Génération du CSV pour l'investigation ${data.id}`);
    
    const flattenedResults = data.results.map(result => ({
      id_resultat: result.id,
      source_outil: result.toolSource,
      type_indicateur_associe: result.indicator?.type || 'N/A',
      valeur_indicateur_associe: result.indicator?.value || 'N/A',
      donnees_json: JSON.stringify(result.data),
      score: result.score,
      date_creation: result.createdAt,
    }));

    if (flattenedResults.length === 0) {
        return "";
    }

    return papaparse.unparse(flattenedResults);
  }

  /**
   * Génère un rapport JSON à partir des données d'une investigation.
   * @private
   */
  async generateJsonReport(data) {
    logger.info(`Génération du JSON pour l'investigation ${data.id}`);
    // On retourne simplement les données de l'investigation.
    // On pourrait vouloir nettoyer ou formater ces données à l'avenir.
    return data;
  }
}

module.exports = ReportService;