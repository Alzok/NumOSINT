const axios = require('axios');
const { IndicatorType } = require('@prisma/client');
const logger = require('../../utils/logger');
const BaseToolService = require('./BaseToolService');

class MaigretService extends BaseToolService {
  constructor(prisma) {
    super(prisma, 'maigret');
    this.serviceUrl = process.env.MAIGRET_SERVICE_URL || 'http://localhost:5002';
    this.axios = axios.create({
      baseURL: this.serviceUrl,
    });
  }

  async searchProfiles(investigationId, usernameIndicator, tags = 'all', recursive = false) {
    const username = usernameIndicator.value;
    const endpoint = recursive ? '/recursive-search' : '/scan';
    const payload = { username, tags };
    const timeout = recursive ? 900000 : 300000; // 15 min pour récursif, 5 pour normal

    try {
      logger.info(`[${this.toolName}] Recherche de profils pour ${username} (tags: ${tags}, récursif: ${recursive})`);
      const response = await this.axios.post(endpoint, payload, { timeout });
      
      const profiles = this._formatProfiles(response.data);

      await this._saveResult(investigationId, usernameIndicator.id, { username, profiles });

      if (profiles.length > 0) {
        const newIndicators = profiles.map(profile => ({
          type: IndicatorType.URL,
          value: profile.url,
          confidence: 90,
        }));
        await this._saveIndicators(investigationId, usernameIndicator, newIndicators);
      }

      logger.info(`[${this.toolName}] ${profiles.length} profils trouvés pour ${username}.`);
    } catch (error) {
      this._handleApiError(error, `rechercher des profils pour ${username}`);
    }
  }

  _formatProfiles(responseData) {
    if (responseData && responseData.sites && typeof responseData.sites === 'object') {
      return Object.values(responseData.sites).filter(site => site.status === 'found' && site.url);
    }
    return [];
  }
}

module.exports = MaigretService;