const { IndicatorType } = require('@prisma/client');
const logger = require('../../utils/logger');
const axios = require('axios');

const WAYBULK_SERVICE_URL = process.env.WAYBULK_SERVICE_URL || 'http://localhost:5004';

class WaybulkService {
  constructor(prisma) {
    this.prisma = prisma;
    this.toolName = 'waybulk';
    this.serviceUrl = WAYBULK_SERVICE_URL;
  }

  /**
   * Recherche les archives d'un domaine en utilisant le microservice waybulk.
   * @param {string} investigationId - L'ID de l'investigation.
   * @param {object} domainIndicator - L'indicateur de type DOMAIN.
   */
  async scanDomain(investigationId, domainIndicator) {
    const domain = domainIndicator.value;
    try {
      const logMessage = `Recherche d'archives pour le domaine ${domain}`;
      logger.tool(this.toolName, investigationId, logMessage);

      const scanResult = await this.executeWaybulkCommand(domain);

      const existingResult = await this.prisma.result.findFirst({
        where: {
          investigationId,
          indicatorId: domainIndicator.id,
          toolSource: this.toolName,
        }
      });

      if (!existingResult) {
        await this.prisma.result.create({
          data: {
            investigationId,
            indicatorId: domainIndicator.id,
            toolSource: this.toolName,
            data: scanResult,
            score: scanResult.archived_snapshots && scanResult.archived_snapshots.closest ? 1 : 0,
          },
        });
      } else {
        logger.tool(this.toolName, investigationId, `Résultat déjà existant pour le domaine ${domain}. Pas de nouvelle sauvegarde.`);
      }

      if (scanResult.archived_snapshots && scanResult.archived_snapshots.closest) {
        const url = scanResult.archived_snapshots.closest.url;
        await this.prisma.indicator.createMany({
            data: [{
                investigationId,
                type: IndicatorType.URL,
                value: url,
                source: this.toolName,
                confidence: 0.8,
                generation: domainIndicator.generation + 1,
                verified: true,
                processed: false,
            }],
            skipDuplicates: true,
        });
      }

      logger.tool(this.toolName, investigationId, `Domaine ${domain}: recherche d'archives terminée.`);

    } catch (error) {
      logger.toolError(this.toolName, investigationId, error);
      throw error;
    }
  }

  /**
   * Appelle le microservice waybulk.
   * @param {string} domain - Le domaine à scanner.
   */
  async executeWaybulkCommand(domain) {
    const endpoint = '/scan';
    const payload = { domain };
    const timeout = 60000; // 1 minute

    try {
      logger.info(`Calling waybulk service at ${this.serviceUrl}${endpoint} for ${domain}`);
      const response = await axios.post(`${this.serviceUrl}${endpoint}`, payload, { timeout });
      return response.data;
    } catch (error) {
      const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
      logger.error(`Erreur lors de l'appel au microservice waybulk pour ${domain}: ${errorMessage}`);
      throw new Error(`Waybulk service failed for ${domain}: ${errorMessage}`);
    }
  }

  /**
   * Teste la connexion au microservice waybulk.
   */
  async testConfiguration() {
    try {
      if (!this.serviceUrl) {
          throw new Error('WAYBULK_SERVICE_URL is not defined');
      }
      return { status: 'success', message: `Waybulk service est configuré à l'adresse: ${this.serviceUrl}` };
    } catch (error) {
      logger.error('Erreur lors du test de configuration waybulk service:', error);
      return {
        status: 'error',
        message: 'Impossible de contacter le microservice waybulk.',
        error: error.message,
      };
    }
  }
}

module.exports = WaybulkService;