const { PrismaClient } = require('@prisma/client');
const { IndicatorType } = require('@prisma/client');
const logger = require('../../utils/logger');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

class MosintService {
  constructor(prisma) {
    this.prisma = prisma;
    this.toolName = 'mosint';
    this.reportsDir = path.join(os.tmpdir(), 'numosint_reports', 'mosint');
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      logger.error(`Impossible de créer le répertoire pour les rapports Mosint: ${error.message}`);
    }
  }

  /**
   * Analyse un email spécifique d'une investigation.
   */
  async analyzeEmail(investigationId, emailIndicator) {
    const email = emailIndicator.value;
    try {
      logger.tool(this.toolName, investigationId, `Analyse de l'email: ${email}`);

      const reportPath = path.join(this.reportsDir, `${email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`);
      const analysis = await this.executeMosintCommand(email, reportPath);

      // Sauvegarde des résultats
      await this.prisma.result.create({
        data: {
          investigationId,
          indicatorId: emailIndicator.id,
          toolSource: this.toolName,
          data: analysis,
          score: this.calculateEmailScore(analysis),
        },
      });

      // Ajout des nouveaux indicateurs découverts
      await this.addDiscoveredIndicators(investigationId, analysis);

      logger.tool(this.toolName, investigationId, `Email ${email}: ${analysis.breaches?.length || 0} fuites, ${analysis.social_media?.length || 0} profils sociaux`);

    } catch (error) {
      logger.toolError(this.toolName, investigationId, error);
      await this.prisma.result.create({
        data: {
          investigationId,
          indicatorId: emailIndicator.id,
          toolSource: this.toolName,
          data: {
            email,
            error: error.message,
          },
          score: 0,
        },
      });
    }
  }

  /**
   * Exécute Mosint en ligne de commande.
   */
  async executeMosintCommand(email, reportPath) {
    const safeEmail = email.replace(/(["'$`\\])/g, '\\$1');
    // La configuration de Mosint doit être faite en amont (ex: via un fichier config.json)
    const command = `mosint -j "${safeEmail}" > "${reportPath}"`;

    try {
      const { stderr } = await execAsync(command, {
        timeout: 180000, // 3 minutes
      });

      if (stderr) {
        logger.warn(`Mosint stderr for email ${safeEmail}: ${stderr}`);
      }

      return this.parseMosintOutput(reportPath);

    } catch (error) {
      logger.error(`Erreur lors de l'exécution de Mosint pour ${safeEmail}:`, error);
      throw error;
    } finally {
        await fs.unlink(reportPath).catch(() => {});
    }
  }

  /**
   * Parse la sortie JSON de Mosint.
   */
  async parseMosintOutput(reportPath) {
    try {
      const fileContent = await fs.readFile(reportPath, 'utf-8');
      if (!fileContent) return {};
      return JSON.parse(fileContent);
    } catch (error) {
      logger.error(`Erreur lors du parsing du rapport Mosint ${reportPath}:`, error);
      return {};
    }
  }

  /**
   * Calcule le score global d'un email basé sur les résultats de Mosint.
   */
  calculateEmailScore(analysis) {
    let score = 0.1; // Score de base si l'analyse réussit

    if (analysis.breaches && analysis.breaches.length > 0) {
      score += 0.4;
    }
    if (analysis.social_media && analysis.social_media.length > 0) {
      score += 0.3;
    }
    if (analysis.related_emails && analysis.related_emails.length > 0) {
        score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Ajoute les indicateurs découverts à l'investigation.
   */
  async addDiscoveredIndicators(investigationId, analysis) {
    const indicators = [];

    if (analysis.social_media) {
      for (const profile of analysis.social_media) {
        if (profile.url) {
            indicators.push({
                type: IndicatorType.URL,
                value: profile.url,
                source: this.toolName,
            });
        }
      }
    }
    
    if (analysis.related_emails) {
        for (const relEmail of analysis.related_emails) {
            indicators.push({
                type: IndicatorType.EMAIL,
                value: relEmail,
                source: this.toolName,
            });
        }
    }

    if (indicators.length > 0) {
        const dataToCreate = indicators.map(ind => ({
            ...ind,
            investigationId,
            confidence: 0.8,
            verified: false,
            processed: false,
        }));

        await this.prisma.indicator.createMany({
            data: dataToCreate,
            skipDuplicates: true,
        });
    }
  }

  /**
   * Teste la configuration de Mosint.
   */
  async testConfiguration() {
    try {
      const { stdout, stderr } = await execAsync('mosint -h');
      if (stderr && !stdout) {
        throw new Error(stderr);
      }
      return { status: 'success', message: 'Mosint est correctement configuré.' };
    } catch (error) {
      logger.error('Erreur lors du test de configuration Mosint:', error);
      return {
        status: 'error',
        message: 'Impossible d\'exécuter la commande mosint.',
        error: error.message,
      };
    }
  }
}

module.exports = MosintService;