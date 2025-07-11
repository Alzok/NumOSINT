const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const logger = require('../../utils/logger');
const { IndicatorType } = require('@prisma/client');
const eventBus = require('../../utils/eventBus');

class SpiderFootService {
  constructor(prisma) {
    this.prisma = prisma;
    this.name = 'spiderfoot';
    this.reportsDir = path.join(os.tmpdir(), 'numosint_reports', 'spiderfoot');
    this.spiderfootPath = 'spiderfoot'; // Assumes sf.py is in PATH
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      logger.error(`Impossible de créer le répertoire pour les rapports SpiderFoot: ${error.message}`);
    }
  }

  /**
   * Démarre un scan SpiderFoot pour une liste d'indicateurs.
   * Le scan est lancé en arrière-plan et un événement est émis à la fin.
   */
  startScan(investigationId, indicators) {
    if (!indicators || indicators.length === 0) {
      logger.warn('🕷️ SpiderFoot: Aucun indicateur fourni pour le scan.');
      // Émettre un événement d'échec ou de complétion immédiate pour ne pas bloquer le flux
      eventBus.emit('tool:scan_completed', { investigationId, tool: this.name, success: true, message: 'Aucun indicateur à scanner.' });
      return;
    }

    const scanId = `inv_${investigationId}_${Date.now()}`;
    const targets = indicators.map(ind => ind.value).join(',');
    const reportPath = path.join(this.reportsDir, `sf_report_${scanId}.json`);

    logger.info(`🕷️ SpiderFoot: Démarrage du scan pour ${indicators.length} indicateurs (investigation ${investigationId})`);
    
    this.executeScanCommand(investigationId, targets, reportPath);
  }

  /**
   * Exécute une commande de scan SpiderFoot en arrière-plan.
   */
  executeScanCommand(investigationId, targets, reportPath) {
    const safeTargets = targets.replace(/(["'$`\\])/g, '\\$1');
    const command = `${this.spiderfootPath} -s "${safeTargets}" -o json -F "${reportPath}"`;

    logger.info(`🕷️ SpiderFoot: Exécution de la commande: ${command}`);

    const child = exec(command, { timeout: 900000 /* 15 minutes */ });

    // --- Début de l'implémentation du "pulse" ---
    const pulseInterval = setInterval(() => {
      eventBus.emit('tool:pulse', { investigationId, tool: this.name });
    }, 5000); // Émettre une pulsation toutes les 5 secondes
    // --- Fin de l'implémentation du "pulse" ---

    child.stdout.on('data', (data) => {
      logger.debug(`🕷️ SpiderFoot stdout: ${data.trim()}`);
    });

    child.stderr.on('data', (data) => {
      logger.warn(`🕷️ SpiderFoot stderr: ${data.trim()}`);
    });

    child.on('close', async (code) => {
      clearInterval(pulseInterval); // Arrêter les pulsations à la fin du scan

      if (code === 0) {
        logger.info(`🕷️ SpiderFoot: Scan terminé avec succès pour l'investigation ${investigationId}.`);
        try {
          const scanData = await this.parseScanResults(reportPath);
          await this.processAndSaveResults(investigationId, null, scanData); // indicatorId est null car multi-indicateurs
          await this.extractAndSaveNewIndicators(investigationId, scanData);
          
          const graphData = this.generateGraphData(scanData);
          await this.prisma.investigation.update({
            where: { id: investigationId },
            data: { graphData },
          });

          eventBus.emit('tool:scan_completed', { investigationId, tool: this.name, success: true });
        } catch (processingError) {
          logger.error(`🕷️ SpiderFoot: Erreur lors du traitement des résultats pour ${investigationId}:`, processingError);
          eventBus.emit('tool:scan_completed', { investigationId, tool: this.name, success: false, error: processingError.message });
        } finally {
            await fs.unlink(reportPath).catch(() => {});
        }
      } else {
        const errorMessage = `L'exécution de SpiderFoot a échoué avec le code ${code}.`;
        logger.error(`🕷️ SpiderFoot: ${errorMessage} pour l'investigation ${investigationId}.`);
        eventBus.emit('tool:scan_completed', { investigationId, tool: this.name, success: false, error: errorMessage });
      }
    });
  }

  /**
   * Lit et analyse le rapport JSON de SpiderFoot.
   */
  async parseScanResults(reportPath) {
    try {
      const reportContent = await fs.readFile(reportPath, 'utf8');
      return JSON.parse(reportContent);
    } catch (error) {
      logger.error(`Impossible de lire ou d'analyser le rapport SpiderFoot à ${reportPath}:`, error);
      throw new Error('Analyse du rapport SpiderFoot échouée.');
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