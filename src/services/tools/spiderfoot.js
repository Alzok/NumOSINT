const axios = require('axios');
const logger = require('../../utils/logger');
const { IndicatorType } = require('@prisma/client');
const eventBus = require('../../utils/eventBus');
const BaseToolService = require('./BaseToolService');

class SpiderFootService extends BaseToolService {
  constructor(prisma) {
    super(prisma, 'spiderfoot');
    this.serviceUrl = process.env.SPIDERFOOT_SERVICE_URL;
    if (!this.serviceUrl) {
      throw new Error("La variable d'environnement SPIDERFOOT_SERVICE_URL est requise.");
    }
    this.axios = axios.create({
      baseURL: this.serviceUrl,
      timeout: 15 * 60 * 1000, // 15 minutes
    });
  }

  async startScan(investigationId, indicators) {
    if (!indicators || indicators.length === 0) {
      logger.warn(`[${this.toolName}] Aucun indicateur fourni pour le scan.`);
      eventBus.emit('tool:scan_completed', { investigationId, tool: this.toolName, success: true, message: 'Aucun indicateur à scanner.' });
      return;
    }

    const targets = indicators.map(ind => ind.value).join(',');
    logger.info(`[${this.toolName}] Démarrage du scan pour ${indicators.length} indicateurs.`);

    try {
      const response = await this.axios.post('/scan', { targets });
      const scanData = response.data;
      
      logger.info(`[${this.toolName}] Scan terminé avec succès.`);
      
      await this._processAndSaveResults(investigationId, scanData);
      
      eventBus.emit('tool:scan_completed', { investigationId, tool: this.toolName, success: true });

    } catch (error) {
      this._handleApiError(error, `scanner les cibles pour l'investigation ${investigationId}`);
      eventBus.emit('tool:scan_completed', { investigationId, tool: this.toolName, success: false, error: error.message });
    }
  }

  async _processAndSaveResults(investigationId, scanData) {
    const summary = {
      totalItems: scanData.length,
      typesFound: [...new Set(scanData.map(item => item.type))],
    };

    await this._saveResult(investigationId, null, summary, scanData);
    await this._extractAndSaveNewIndicators(investigationId, scanData);

    const graphData = this._generateGraphData(scanData);
    await this.prisma.investigation.update({
      where: { id: investigationId },
      data: { graphData },
    });
  }

  async _extractAndSaveNewIndicators(investigationId, scanData) {
    const typeMapping = {
      'IP_ADDRESS': IndicatorType.IP,
      'DOMAIN_NAME': IndicatorType.DOMAIN,
      'EMAILADDR': IndicatorType.EMAIL,
      'USERNAME': IndicatorType.USERNAME,
      'PHONE_NUMBER': IndicatorType.PHONE,
      'GEOINFO': IndicatorType.LOCATION,
      'SOCIAL_MEDIA': IndicatorType.URL,
      'WEB_ANALYTICS_ID': IndicatorType.URL,
      'URL_ADVERSARY_INFRA': IndicatorType.URL,
      'URL_GENERAL': IndicatorType.URL,
    };

    const newIndicators = scanData.map(item => {
      const indicatorType = typeMapping[item.type];
      if (!indicatorType) return null;

      let value = item.data;
      if (item.type === 'SOCIAL_MEDIA' && item.data.includes('(')) {
        value = item.data.substring(0, item.data.indexOf('(')).trim();
      }
      
      return { type: indicatorType, value, confidence: 75 };
    }).filter(Boolean);

    // Pour Spiderfoot, il n'y a pas de "parent" clair, on passe null.
    await this._saveIndicators(investigationId, null, newIndicators);
  }

  _generateGraphData(scanData) {
    const nodes = [];
    const edges = [];
    const nodeIds = new Set();

    scanData.forEach(item => {
      const nodeId = `${item.type}-${item.data}`;
      if (!nodeIds.has(nodeId)) {
        nodes.push({
          id: nodeId,
          type: item.type,
          data: { label: item.data },
          position: { x: Math.random() * 400, y: Math.random() * 400 },
        });
        nodeIds.add(nodeId);
      }

      if (item.source_finding_id) {
        const sourceItem = scanData.find(d => d.id === item.source_finding_id);
        if (sourceItem) {
          const sourceNodeId = `${sourceItem.type}-${sourceItem.data}`;
          edges.push({
            id: `${sourceNodeId}-${nodeId}`,
            source: sourceNodeId,
            target: nodeId,
            animated: true,
          });
        }
      }
    });

    return { nodes, edges };
  }
}

module.exports = SpiderFootService;