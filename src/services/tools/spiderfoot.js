const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const logger = require('../../utils/logger');
const { IndicatorType } = require('@prisma/client');

const execAsync = promisify(exec);

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
   * Démarre un scan SpiderFoot pour un indicateur spécifique.
   */
  async startScan(investigationId, indicator) {
    const target = indicator.value;
    logger.info(`🕷️ SpiderFoot: Démarrage du scan pour ${target} (investigation ${investigationId})`);

    try {
      const reportPath = path.join(this.reportsDir, `sf_report_${indicator.id}_${Date.now()}.json`);
      await this.executeScanCommand(target, reportPath);
      const scanData = await this.parseScanResults(reportPath);
      
      await this.processAndSaveResults(investigationId, indicator.id, scanData);
      const newIndicatorsCount = await this.extractAndSaveNewIndicators(investigationId, scanData);

      logger.info(`🕷️ SpiderFoot: Scan terminé pour ${target}. ${newIndicatorsCount} nouveaux indicateurs trouvés.`);
      await fs.unlink(reportPath).catch(() => {});

    } catch (error) {
      logger.error(`🕷️ SpiderFoot: Échec du scan pour l'indicateur ${target}: ${error.message}`);
       await this.prisma.result.create({
        data: {
          investigationId,
          indicatorId: indicator.id,
          toolSource: this.name,
          data: {
            target,
            error: error.message,
          },
          score: 0,
        },
      });
    }
  }

  /**
   * Exécute une commande de scan SpiderFoot.
   */
  async executeScanCommand(target, reportPath) {
    const safeTarget = target.replace(/(["'$`\\])/g, '\\$1');
    const command = `${this.spiderfootPath} -s "${safeTarget}" -o json -F "${reportPath}"`;

    logger.info(`🕷️ SpiderFoot: Exécution de la commande: ${command}`);

    try {
      const { stderr } = await execAsync(command, {
        timeout: 900000, // 15 minutes
      });
      if (stderr) {
        logger.warn(`🕷️ SpiderFoot stderr for target ${safeTarget}: ${stderr}`);
      }
    } catch (error) {
      logger.error(`Erreur lors de l'exécution de SpiderFoot pour ${safeTarget}:`, error);
      throw new Error(`L'exécution de SpiderFoot a échoué: ${error.message}`);
    }
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

    return this.prisma.result.create({
      data: {
        investigationId,
        indicatorId,
        toolSource: this.name,
        data: summary,
        score: this.calculateScore(scanData),
      },
    });
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