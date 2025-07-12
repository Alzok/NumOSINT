const { IndicatorType } = require('@prisma/client');
const logger = require('../../utils/logger');
const axios = require('axios');

const WAU_SERVICE_URL = process.env.WAU_SERVICE_URL || 'http://localhost:8080';

class WauService {
  constructor(prisma) {
    this.prisma = prisma;
    this.toolName = 'wau';
    this.serviceUrl = WAU_SERVICE_URL;
  }

  /**
   * Valide une adresse e-mail en utilisant le microservice wau.
   * @param {string} investigationId - L'ID de l'investigation.
   * @param {object} emailIndicator - L'indicateur de type EMAIL.
   */
  async validateEmail(investigationId, emailIndicator) {
    const email = emailIndicator.value;
    try {
      const logMessage = `Validation de l'e-mail ${email}`;
      logger.tool(this.toolName, investigationId, logMessage);

      const validationResult = await this.executeWauCommand(email);

      const existingResult = await this.prisma.result.findFirst({
        where: {
          investigationId,
          indicatorId: emailIndicator.id,
          toolSource: this.toolName,
        }
      });

      if (!existingResult) {
        await this.prisma.result.create({
          data: {
            investigationId,
            indicatorId: emailIndicator.id,
            toolSource: this.toolName,
            data: validationResult,
            score: validationResult.is_valid ? 1 : 0,
          },
        });
      } else {
        logger.tool(this.toolName, investigationId, `Résultat déjà existant pour l'e-mail ${email}. Pas de nouvelle sauvegarde.`);
      }

      logger.tool(this.toolName, investigationId, `E-mail ${email}: validation terminée.`);

    } catch (error) {
      logger.toolError(this.toolName, investigationId, error);
      throw error;
    }
  }

  /**
   * Appelle le microservice wau.
   * @param {string} email - L'adresse e-mail à valider.
   */
  async executeWauCommand(email) {
    const endpoint = '/validate';
    const payload = { email };
    const timeout = 60000; // 1 minute

    try {
      logger.info(`Calling wau service at ${this.serviceUrl}${endpoint} for ${email}`);
      const response = await axios.post(`${this.serviceUrl}${endpoint}`, payload, { timeout });
      return response.data;
    } catch (error) {
      const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
      logger.error(`Erreur lors de l'appel au microservice wau pour ${email}: ${errorMessage}`);
      throw new Error(`Wau service failed for ${email}: ${errorMessage}`);
    }
  }

  /**
   * Teste la connexion au microservice wau.
   */
  async testConfiguration() {
    try {
      if (!this.serviceUrl) {
          throw new Error('WAU_SERVICE_URL is not defined');
      }
      // Un test plus approfondi pourrait faire un appel à un endpoint /health
      return { status: 'success', message: `Wau service est configuré à l'adresse: ${this.serviceUrl}` };
    } catch (error) {
      logger.error('Erreur lors du test de configuration wau service:', error);
      return {
        status: 'error',
        message: 'Impossible de contacter le microservice wau.',
        error: error.message,
      };
    }
  }
}

module.exports = WauService;