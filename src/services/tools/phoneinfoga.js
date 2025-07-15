const axios = require('axios');
const logger = require('../../utils/logger');
const { IndicatorType } = require('@prisma/client');
const BaseToolService = require('./BaseToolService');

class PhoneInfogaService extends BaseToolService {
  constructor(prisma) {
    super(prisma, 'phoneinfoga');
    this.serviceUrl = process.env.PHONEINFOGA_SERVICE_URL;
    if (!this.serviceUrl) {
      throw new Error("La variable d'environnement PHONEINFOGA_SERVICE_URL est requise.");
    }
    this.axios = axios.create({
      baseURL: this.serviceUrl,
      timeout: 180000, // 3 minutes
    });
  }

  async analyzePhone(investigationId, phoneIndicator) {
    const phoneNumber = phoneIndicator.value;
    try {
      logger.info(`[${this.toolName}] Démarrage de l'analyse pour ${phoneNumber}`);
      const normalizedPhone = this._normalizePhoneNumber(phoneNumber);

      const response = await this.axios.post('/scan', { phoneNumber: normalizedPhone });
      const analysis = response.data;

      await this._saveResult(investigationId, phoneIndicator.id, { original: phoneNumber, ...analysis });
      await this._addDiscoveredIndicators(investigationId, analysis, phoneIndicator);

      logger.info(`[${this.toolName}] Analyse terminée pour ${phoneNumber}`);
    } catch (error) {
      this._handleApiError(error, `analyser le numéro ${phoneNumber}`);
    }
  }

  _normalizePhoneNumber(phoneNumber) {
    let normalized = phoneNumber.replace(/[^\d+]/g, '');
    if (!normalized.startsWith('+')) {
      if (normalized.startsWith('0')) {
        normalized = '+33' + normalized.substring(1);
      } else {
        normalized = '+' + normalized;
      }
    }
    return normalized;
  }

  async _addDiscoveredIndicators(investigationId, analysis, parentIndicator) {
    const newIndicators = [];
    if (!analysis) return;

    if (analysis.countryCode) {
      newIndicators.push({
        type: IndicatorType.COUNTRY,
        value: analysis.countryCode,
        confidence: 95,
      });
    }
    if (analysis.city) {
      newIndicators.push({
        type: IndicatorType.LOCATION,
        value: analysis.city,
        confidence: 70,
      });
    }
    if (analysis.carrier) {
      newIndicators.push({
        type: IndicatorType.ORGANIZATION,
        value: analysis.carrier,
        confidence: 80,
      });
    }

    await this._saveIndicators(investigationId, parentIndicator, newIndicators);
  }
}

module.exports = PhoneInfogaService;