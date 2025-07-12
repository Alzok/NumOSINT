const axios = require('axios');
const logger = require('../../utils/logger');
const { IndicatorType } = require('@prisma/client');
const eventBus = require('../../utils/eventBus');

const spiderfootServiceUrl = process.env.SPIDERFOOT_SERVICE_URL;

class SpiderFootService {
  constructor(prisma) {
    this.prisma = prisma;
    this.name = 'spiderfoot';
  }

  /**
   * Démarre un scan SpiderFoot pour une liste d'indicateurs via le microservice.
   * Le scan est lancé en arrière-plan et un événement est émis à la fin.
   */
  async startScan(investigationId, indicators) {
    if (!spiderfootServiceUrl) {
      logger.error('🕷️ SpiderFoot: URL du service non définie. Vérifiez SPIDERFOOT_SERVICE_URL.');
      eventBus.emit('tool:scan_completed', { investigationId, tool: this.name, success: false, error: 'Service non configuré.' });
      return;
    }

    if (!indicators || indicators.length === 0) {
      logger.warn('🕷️ SpiderFoot: Aucun indicateur fourni pour le scan.');
      eventBus.emit('tool:scan_completed', { investigationId, tool: this.name, success: true, message: 'Aucun indicateur à scanner.' });
      return;
    }

    const targets = indicators.map(ind => ind.value).join(',');
    logger.info(`🕷️ SpiderFoot: Démarrage du scan pour ${indicators.length} indicateurs (investigation ${investigationId})`);

    try {
      // L'appel est asynchrone, mais le service SpiderFoot lui-même prendra du temps.
      // Nous ne bloquons pas ici, mais nous attendons la réponse initiale du service.
      const response = await axios.post(`${spiderfootServiceUrl}/scan`, { targets }, { timeout: 15 * 60 * 1000 /* 15 minutes */ });
      
      const scanData = response.data;
      
      logger.info(`🕷️ SpiderFoot: Scan terminé avec succès pour l'investigation ${investigationId}.`);
      
      await this.processAndSaveResults(investigationId, null, scanData);
      await this.extractAndSaveNewIndicators(investigationId, scanData);
      
      const graphData = this.generateGraphData(scanData);
      await this.prisma.investigation.update({
        where: { id: investigationId },
        data: { graphData },
      });

      eventBus.emit('tool:scan_completed', { investigationId, tool: this.name, success: true });

    } catch (error) {
      const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
      logger.error(`🕷️ SpiderFoot: Erreur lors du scan pour ${investigationId}: ${errorMessage}`);
      eventBus.emit('tool:scan_completed', { investigationId, tool: this.name, success: false, error: errorMessage });
    }
  }

  /**
   * Traite et sauvegarde le résultat principal du scan.
   */
  async processAndSaveResults(investigationId, indicatorId, scanData) {
    const summary = {
      totalItems: scanData.length,
      typesFound: [...new Set(scanData.map(item => item.type))],
    };

    const existingResult = await this.prisma.result.findFirst({
        where: {
            investigationId,
            indicatorId,
            toolSource: this.name,
        }
    });

    if (!existingResult) {
        return this.prisma.result.create({
          data: {
            investigationId,
            indicatorId,
            toolSource: this.name,
            data: summary,
            score: this.calculateScore(scanData),
          },
        });
    } else {
        logger.info(`🕷️ SpiderFoot: Résultat déjà existant pour l'indicateur ${indicatorId}. Pas de nouvelle sauvegarde.`);
        return existingResult;
    }
  }

  /**
   * Extrait et sauvegarde les nouveaux indicateurs trouvés dans le scan.
   */
  async extractAndSaveNewIndicators(investigationId, scanData) {
    const indicatorsToCreate = [];
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

    for (const item of scanData) {
      const indicatorType = typeMapping[item.type];
      if (indicatorType) {
        let value = item.data;
        if (item.type === 'SOCIAL_MEDIA' && item.data.includes('(')) {
          value = item.data.substring(0, item.data.indexOf('(')).trim();
        }
        
        indicatorsToCreate.push({
          investigationId,
          type: indicatorType,
          value,
          source: this.name,
          confidence: 0.75,
          verified: false,
          processed: false,
        });
      }
    }

    if (indicatorsToCreate.length === 0) return 0;

    const result = await this.prisma.indicator.createMany({
      data: indicatorsToCreate,
      skipDuplicates: true,
    });

    return result.count;
  }

  /**
   * Génère les données du graphe à partir des résultats du scan.
   */
  generateGraphData(scanData) {
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

  calculateScore(scanData) {
    if (!scanData || scanData.length === 0) return 0;
    return Math.min(scanData.length / 200, 1.0);
  }

  async testConfiguration() {
    try {
      const { stdout } = await execAsync(`${this.spiderfootPath} -v`);
      if (stdout.includes('SpiderFoot')) {
        return { status: 'success', message: `SpiderFoot est accessible. Version: ${stdout.trim()}` };
      }
      return { status: 'error', message: 'La commande spiderfoot a retourné une sortie inattendue.' };
    } catch (error) {
      logger.error('Erreur lors du test de configuration SpiderFoot:', error);
      return {
        status: 'error',
        message: 'Impossible d\'exécuter la commande spiderfoot.',
        error: error.message,
      };
    }
  }
}

module.exports = SpiderFootService;