const { PrismaClient } = require('@prisma/client');
const { IndicatorType } = require('@prisma/client');
const logger = require('../../utils/logger');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

class MaigretService {
  constructor(prisma) {
    this.prisma = prisma;
    this.toolName = 'maigret';
    this.reportsDir = path.join(process.cwd(), 'reports', 'maigret');
    this.initialize();
  }

  async initialize() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      logger.error(`Failed to create Maigret reports directory: ${error.message}`);
    }
  }

  /**
   * Recherche des profils pour un username spécifique.
   */
  async searchProfiles(investigationId, usernameIndicator) {
    const username = usernameIndicator.value;
    try {
      logger.tool(this.toolName, investigationId, `Recherche de profils pour le username: ${username}`);

      const profiles = await this.executeMaigretCommand(username);
      
      // Sauvegarde des résultats
      await this.prisma.result.create({
        data: {
          investigationId,
          indicatorId: usernameIndicator.id,
          toolSource: this.toolName,
          data: {
            username,
            profiles,
          },
          score: profiles.length > 0 ? Math.min(profiles.length / 50, 1) : 0, // Score basé sur le nombre de profils
        },
      });

      // Ajout des URLs de profil comme nouveaux indicateurs
      if (profiles.length > 0) {
        const indicatorData = profiles.map(profile => ({
          investigationId,
          type: IndicatorType.URL,
          value: profile.url,
          source: this.toolName,
          confidence: 0.9,
          verified: true, // Maigret a confirmé l'existence
          processed: false,
        }));

        await this.prisma.indicator.createMany({
          data: indicatorData,
          skipDuplicates: true,
        });
      }

      logger.tool(this.toolName, investigationId, `Username ${username}: ${profiles.length} profils trouvés`);

    } catch (error) {
      logger.toolError(this.toolName, investigationId, error);
      await this.prisma.result.create({
        data: {
          investigationId,
          indicatorId: usernameIndicator.id,
          toolSource: this.toolName,
          data: {
            username,
            error: error.message,
          },
          score: 0,
        },
      });
    }
  }

  /**
   * Exécute Maigret en ligne de commande.
   */
  async executeMaigretCommand(username, options = {}) {
    const safeUsername = username.replace(/(["'$`\\])/g, '\\$1');
    const reportPath = path.join(this.reportsDir, `${safeUsername}_${Date.now()}.json`);

    try {
      // Utilisation de l'option --json-file pour une sortie structurée
      let command = `maigret --json-file "${reportPath}" "${safeUsername}"`;
      
      if (options.timeout) {
        command += ` --timeout ${options.timeout}`;
      }

      const { stderr } = await execAsync(command, {
        timeout: (options.timeout || 300) * 1000, // 5 minutes timeout par défaut
      });

      if (stderr) {
        logger.warn(`Maigret stderr for ${safeUsername}: ${stderr}`);
      }

      return await this.parseMaigretOutput(reportPath);

    } catch (error) {
      logger.error(`Erreur lors de l'exécution de Maigret pour ${safeUsername}:`, error);
      throw error;
    } finally {
      await fs.unlink(reportPath).catch(() => {});
    }
  }

  /**
   * Parse la sortie JSON de Maigret.
   */
  async parseMaigretOutput(reportPath) {
    try {
      const fileContent = await fs.readFile(reportPath, 'utf-8');
      const report = JSON.parse(fileContent);
      
      if (report && report.sites) {
        return Object.values(report.sites).filter(site => site.status === 'found' && site.url);
      }

      return [];

    } catch (error) {
      logger.error(`Erreur lors du parsing du rapport Maigret ${reportPath}:`, error);
      return [];
    }
  }

  /**
   * Teste la configuration de Maigret.
   */
  async testConfiguration() {
    try {
      const { stdout, stderr } = await execAsync('maigret --version');
      if (stderr && !stdout) {
        throw new Error(stderr);
      }
      return { status: 'success', message: `Maigret est accessible. Version: ${stdout.trim()}` };
    } catch (error) {
      logger.error('Erreur lors du test de configuration Maigret:', error);
      return {
        status: 'error',
        message: 'Impossible d\'exécuter la commande maigret.',
        error: error.message,
      };
    }
  }
}

module.exports = MaigretService;