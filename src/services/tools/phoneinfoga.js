const logger = require('../../utils/logger');
const { IndicatorType } = require('@prisma/client');
const axios = require('axios');

const phoneinfogaServiceUrl = process.env.PHONEINFOGA_SERVICE_URL;

class PhoneInfogaService {
  constructor(prisma) {
    this.prisma = prisma;
    this.name = 'phoneinfoga';
  }

  /**
   * Analyse un numéro de téléphone spécifique d'une investigation.
   */
  async analyzePhone(investigationId, phoneIndicator) {
    const phoneNumber = phoneIndicator.value;
    if (!phoneinfogaServiceUrl) {
        logger.toolError(this.name, investigationId, "La variable d'environnement PHONEINFOGA_SERVICE_URL n'est pas définie.");
        return;
    }

    try {
      logger.tool(this.name, investigationId, `Démarrage de l'analyse pour ${phoneNumber}`);
      
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

      const response = await axios.post(`${phoneinfogaServiceUrl}/scan`, { phoneNumber: normalizedPhone }, {
        timeout: 180000, // 3 minutes
      });

      const analysis = response.data;
      
      const phoneAnalysisResult = {
        phoneNumber: normalizedPhone,
        originalNumber: phoneNumber,
        analysis,
        timestamp: new Date().toISOString(),
      };

      // Vérification des doublons avant de sauvegarder les résultats
      const existingResult = await this.prisma.result.findFirst({
        where: {
          investigationId,
          indicatorId: phoneIndicator.id,
          toolSource: this.name,
        }
      });

      if (!existingResult) {
        await this.prisma.result.create({
          data: {
            investigationId,
            indicatorId: phoneIndicator.id,
            toolSource: this.name,
            data: phoneAnalysisResult,
            score: this.calculateScore(phoneAnalysisResult),
          },
        });
      } else {
        logger.tool(this.name, investigationId, `Résultat déjà existant pour ${phoneNumber}. Pas de nouvelle sauvegarde.`);
      }

      // Extraire et sauvegarder les nouveaux indicateurs
      const extractedIndicators = this.extractIndicators(phoneAnalysisResult);
      if (extractedIndicators.length > 0) {
        const dataToCreate = extractedIndicators.map(ind => ({
            ...ind,
            investigationId,
            generation: phoneIndicator.generation + 1,
            processed: false,
        }));
        await this.prisma.indicator.createMany({
          data: dataToCreate,
          skipDuplicates: true,
        });
      }

      logger.tool(this.name, investigationId, `Analyse terminée pour ${phoneNumber}`);

    } catch (error) {
      const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
      logger.toolError(this.name, investigationId, `Erreur lors de l'appel au service PhoneInfoga pour ${phoneNumber}: ${errorMessage}`);
      await this.prisma.result.create({
        data: {
          investigationId,
          indicatorId: phoneIndicator.id,
          toolSource: this.name,
          data: {
            phoneNumber,
            error: `Erreur du service PhoneInfoga: ${errorMessage}`,
          },
          score: 0,
        },
      });
    }
  }
  
  normalizePhoneNumber(phoneNumber) {
    let normalized = phoneNumber.replace(/[^\d+]/g, '');
    if (!normalized.startsWith('+')) {
      // Suppose un code pays par défaut si non fourni, ici la France.
      // Une logique plus complexe pourrait être nécessaire pour l'international.
      if (normalized.startsWith('0')) {
        normalized = '+33' + normalized.substring(1);
      } else {
        // Ne peut pas deviner, on préfixe juste avec '+'
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
    if (!phoneinfogaServiceUrl) {
        return { status: 'error', message: "La variable d'environnement PHONEINFOGA_SERVICE_URL n'est pas définie." };
    }
    try {
      // Teste avec une requête vide qui devrait échouer avec un 400
      await axios.post(`${phoneinfogaServiceUrl}/scan`, {}, { timeout: 5000 });
      return { status: 'success', message: 'Le service PhoneInfoga est accessible.' };
    } catch (error) {
      if (error.response && error.response.status === 400) {
        return { status: 'success', message: 'Le service PhoneInfoga est correctement configuré et répond.' };
      }
      logger.error('Erreur lors du test de configuration PhoneInfoga:', error.message);
      return {
        status: 'error',
        message: 'Impossible de contacter le service PhoneInfoga.',
        error: error.message,
      };
    }
  }
}

module.exports = PhoneInfogaService;