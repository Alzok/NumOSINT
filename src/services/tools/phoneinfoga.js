const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const logger = require('../../utils/logger');
const { IndicatorType } = require('@prisma/client');

const execAsync = promisify(exec);

class PhoneInfogaService {
  constructor(prisma) {
    this.prisma = prisma;
    this.name = 'phoneinfoga';
    this.reportsDir = path.join(os.tmpdir(), 'numosint_reports', 'phoneinfoga');
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      logger.error(`Impossible de créer le répertoire pour les rapports PhoneInfoga: ${error.message}`);
    }
  }

  /**
   * Analyse un numéro de téléphone spécifique d'une investigation.
   */
  async analyzePhone(investigationId, phoneIndicator) {
    const phoneNumber = phoneIndicator.value;
    try {
      logger.info(`📱 PhoneInfoga: Démarrage de l'analyse pour ${phoneNumber}`);
      
      const phoneAnalysis = await this.analyzeSinglePhone(phoneNumber);
      
      // Sauvegarder le résultat
      await this.prisma.result.create({
        data: {
          investigationId,
          indicatorId: phoneIndicator.id,
          toolSource: this.name,
          data: phoneAnalysis,
          score: this.calculateScore(phoneAnalysis),
        },
      });

      // Extraire et sauvegarder les nouveaux indicateurs
      const extractedIndicators = this.extractIndicators(phoneAnalysis);
      if (extractedIndicators.length > 0) {
        const dataToCreate = extractedIndicators.map(ind => ({
            ...ind,
            investigationId,
            processed: false,
        }));
        await this.prisma.indicator.createMany({
          data: dataToCreate,
          skipDuplicates: true,
        });
      }

      logger.info(`📱 PhoneInfoga: Analyse terminée pour ${phoneNumber}`);

    } catch (error) {
      logger.error(`📱 PhoneInfoga: Erreur lors de l'analyse de ${phoneNumber}: ${error.message}`);
      await this.prisma.result.create({
        data: {
          investigationId,
          indicatorId: phoneIndicator.id,
          toolSource: this.name,
          data: {
            phoneNumber,
            error: error.message,
          },
          score: 0,
        },
      });
    }
  }

  /**
   * Analyse un numéro de téléphone individuel en utilisant la CLI de PhoneInfoga.
   */
  async analyzeSinglePhone(phoneNumber) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const reportPath = path.join(this.reportsDir, `${normalizedPhone.replace('+', '')}_${Date.now()}.json`);

    try {
      await this.executePhoneInfogaCommand(normalizedPhone, reportPath);
      const analysis = await this.parsePhoneInfogaOutput(reportPath);
      
      return {
        phoneNumber: normalizedPhone,
        originalNumber: phoneNumber,
        analysis,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`📱 PhoneInfoga: Erreur d'analyse pour ${phoneNumber}: ${error.message}`);
      throw error;
    } finally {
      await fs.unlink(reportPath).catch(() => {});
    }
  }
  
  async executePhoneInfogaCommand(phoneNumber, reportPath) {
    const command = `phoneinfoga scan -n "${phoneNumber}" --output "${reportPath}"`;
    try {
        await execAsync(command, { timeout: 180000 }); // 3 min timeout
    } catch(error) {
        // PhoneInfoga peut retourner un code d'erreur même si un rapport est généré
        logger.warn(`PhoneInfoga a terminé avec une erreur potentielle pour ${phoneNumber}: ${error.message}`);
        // On continue car le rapport peut exister
    }
  }

  async parsePhoneInfogaOutput(reportPath) {
    try {
        const reportContent = await fs.readFile(reportPath, 'utf8');
        return JSON.parse(reportContent);
    } catch (error) {
        logger.error(`Impossible de lire ou parser le rapport PhoneInfoga à ${reportPath}:`, error);
        // Retourner un objet vide pour ne pas bloquer le flux
        return {};
    }
  }

  normalizePhoneNumber(phoneNumber) {
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

  calculateScore(phoneData) {
    let score = 0;
    const analysis = phoneData.analysis;

    if (!analysis || !analysis.valid) {
      return 0;
    }
    score += 0.3;

    if (analysis.carrier) score += 0.1;
    if (analysis.lineType === 'mobile') score += 0.2;
    if (analysis.country) score += 0.1;

    const scannerMatches = Object.values(analysis.scanners || {}).filter(
      (scanner) => scanner.found
    ).length;
    score += Math.min(scannerMatches * 0.05, 0.3);

    return Math.min(score, 1.0);
  }

  extractIndicators(phoneData) {
    const indicators = [];
    const analysis = phoneData.analysis;

    if (!analysis) return indicators;

    if (analysis.countryCode) {
      indicators.push({
        type: IndicatorType.COUNTRY,
        value: analysis.countryCode,
        confidence: 0.95,
        source: this.name,
      });
    }
    if (analysis.city) {
      indicators.push({
        type: IndicatorType.LOCATION,
        value: analysis.city,
        confidence: 0.7,
        source: this.name,
      });
    }
    if (analysis.carrier) {
      indicators.push({
        type: IndicatorType.ORGANIZATION,
        value: analysis.carrier,
        confidence: 0.8,
        source: this.name,
      });
    }

    return indicators;
  }

  async testConfiguration() {
    try {
      const { stdout } = await execAsync('phoneinfoga version');
      if (stdout.includes('PhoneInfoga')) {
        return { status: 'success', message: `PhoneInfoga est accessible. Version: ${stdout.trim()}` };
      }
      return { status: 'error', message: 'La commande phoneinfoga a retourné une sortie inattendue.' };
    } catch (error) {
      logger.error('Erreur lors du test de configuration PhoneInfoga:', error);
      return {
        status: 'error',
        message: 'Impossible d\'exécuter la commande phoneinfoga.',
        error: error.message,
      };
    }
  }
}

module.exports = PhoneInfogaService;