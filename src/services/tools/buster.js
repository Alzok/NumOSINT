const axios = require('axios');
const { IndicatorType } = require('@prisma/client');
const logger = require('../../utils/logger');
const BaseToolService = require('./BaseToolService');

class BusterService extends BaseToolService {
  constructor(prisma) {
    super(prisma, 'buster');
    this.serviceUrl = process.env.BUSTER_SERVICE_URL;
    if (!this.serviceUrl) {
      throw new Error("La variable d'environnement BUSTER_SERVICE_URL est requise.");
    }
    this.axios = axios.create({
      baseURL: this.serviceUrl,
      timeout: 60000, // 1 minute
    });
  }

  async generateEmails(investigationId, nameIndicator) {
    const name = nameIndicator.value;
    const parts = name.split(' ');
    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';

    if (!lastName) {
      logger.warn(`[${this.toolName}] Nom incomplet pour la génération d'emails: ${name}`);
      return;
    }

    const domains = await this._getDomainsForInvestigation(investigationId);
    if (domains.length === 0) {
      logger.info(`[${this.toolName}] Aucun domaine trouvé pour générer des emails pour ${name}.`);
      return;
    }

    for (const domain of domains) {
      try {
        logger.info(`[${this.toolName}] Recherche d'emails pour ${name} sur le domaine ${domain}`);
        const response = await this.axios.post('/scan', { firstName, lastName, domain });
        const result = response.data;

        if (result.emails && result.emails.length > 0) {
          const newIndicators = result.emails.map(email => ({
            type: IndicatorType.EMAIL,
            value: email,
            confidence: 60,
          }));
          await this._saveIndicators(investigationId, nameIndicator, newIndicators);
          logger.info(`[${this.toolName}] ${result.emails.length} email(s) trouvé(s) pour ${name} sur ${domain}.`);
        }
      } catch (error) {
        this._handleApiError(error, `générer des emails pour ${name} sur ${domain}`);
      }
    }
  }

  async _getDomainsForInvestigation(investigationId) {
    const domainIndicators = await this.prisma.indicator.findMany({
      where: { investigationId, type: IndicatorType.DOMAIN },
      select: { value: true },
    });
    return [...new Set(domainIndicators.map(d => d.value))];
  }
}

module.exports = BusterService;