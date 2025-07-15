const axios = require('axios');
const { IndicatorType } = require('@prisma/client');
const logger = require('../../utils/logger');
const BaseToolService = require('./BaseToolService');

class MosintService extends BaseToolService {
  constructor(prisma) {
    super(prisma, 'mosint');
    this.serviceUrl = process.env.MOSINT_SERVICE_URL;
    if (!this.serviceUrl) {
      throw new Error("La variable d'environnement MOSINT_SERVICE_URL est requise.");
    }
    this.axios = axios.create({
      baseURL: this.serviceUrl,
      timeout: 180000, // 3 minutes
    });
  }

  async analyzeEmail(investigationId, emailIndicator) {
    const email = emailIndicator.value;
    try {
      logger.info(`[${this.toolName}] Analyse de l'email: ${email}`);
      const response = await this.axios.post('/scan', { email });
      const analysis = response.data;

      await this._saveResult(investigationId, emailIndicator.id, analysis);
      await this._addDiscoveredIndicators(investigationId, analysis, emailIndicator);

      logger.info(`[${this.toolName}] Email ${email}: ${analysis.breaches?.length || 0} fuites, ${analysis.social_media?.length || 0} profils sociaux.`);
    } catch (error) {
      this._handleApiError(error, `analyser l'email ${email}`);
    }
  }

  async _addDiscoveredIndicators(investigationId, analysis, parentIndicator) {
    const newIndicators = [];

    if (analysis.social_media) {
      for (const profile of analysis.social_media) {
        if (profile.url) {
          newIndicators.push({
            type: IndicatorType.URL,
            value: profile.url,
            confidence: 70,
          });
        }
      }
    }

    if (analysis.related_emails) {
      for (const relEmail of analysis.related_emails) {
        newIndicators.push({
          type: IndicatorType.EMAIL,
          value: relEmail,
          confidence: 80,
        });
      }
    }

    await this._saveIndicators(investigationId, parentIndicator, newIndicators);
  }
}

module.exports = MosintService;