const { PrismaClient } = require('@prisma/client');
const { IndicatorType } = require('@prisma/client');
const logger = require('../../utils/logger');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class BusterService {
  constructor(prisma) {
    this.prisma = prisma;
    this.toolName = 'buster';
  }

  /**
   * Génère des emails pour un indicateur de nom spécifique.
   */
  async generateEmails(investigationId, nameIndicator) {
    const name = nameIndicator.value;
    try {
      logger.tool(this.toolName, investigationId, `Traitement du nom: ${name}`);

      // Génération d'emails avec Buster
      const emails = await this.findEmailsForName(name);

      // Les emails générés sont ajoutés directement comme indicateurs.
      // La validation est retirée car elle n'est pas le but premier de Buster.
      
      // Sauvegarde des résultats
      await this.prisma.result.create({
        data: {
          investigationId,
          indicatorId: nameIndicator.id,
          toolSource: this.toolName,
          data: {
            name,
            generatedEmails: emails,
          },
          score: emails.length > 0 ? Math.min(emails.length / 20, 1) : 0,
        },
      });

      // Ajout des emails générés comme nouveaux indicateurs
      if (emails.length > 0) {
        const indicatorData = emails.map(email => ({
          investigationId,
          type: IndicatorType.EMAIL,
          value: email,
          source: this.toolName,
          confidence: 0.7,
          verified: false,
          processed: false,
        }));

        await this.prisma.indicator.createMany({
          data: indicatorData,
          skipDuplicates: true,
        });
      }

      logger.tool(this.toolName, investigationId, `Nom ${name}: ${emails.length} emails générés.`);

      return {
        generatedEmails: emails.length,
      };

    } catch (error) {
      logger.toolError(this.toolName, investigationId, error);
      await this.prisma.result.create({
        data: {
          investigationId,
          indicatorId: nameIndicator.id,
          toolSource: this.toolName,
          data: {
            name,
            error: error.message,
          },
          score: 0,
        },
      });
    }
  }

  /**
   * Recherche des emails pour un nom donné en utilisant Buster.
   */
  async findEmailsForName(name, domains = []) {
    try {
      logger.tool(this.toolName, null, `Recherche d'emails pour: ${name}`);
      const rawOutput = await this.executeBusterCommand(name, domains);
      const foundEmails = this.parseBusterOutput(rawOutput);
      
      logger.tool(this.toolName, null, `${foundEmails.length} emails trouvés pour ${name}`);
      return foundEmails;

    } catch (error) {
      logger.error(`Erreur lors de la recherche d'emails pour ${name}:`, error);
      throw error;
    }
  }

  /**
   * Exécute Buster en ligne de commande.
   */
  async executeBusterCommand(name, domains = []) {
    const safeName = name.replace(/(["'$`\\])/g, '\\$1');
    let command = `buster -n "${safeName}"`;

    if (domains.length > 0) {
      const safeDomains = domains.map(d => `"${d.replace(/(["'$`\\])/g, '\\$1')}"`).join(' ');
      command += ` -d ${safeDomains}`;
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 180000, // 3 minutes
        maxBuffer: 2 * 1024 * 1024 // 2MB
      });

      if (stderr) {
        logger.warn(`Buster stderr for name "${safeName}": ${stderr}`);
      }

      return stdout;

    } catch (error) {
      if (error.killed) {
        throw new Error('Buster a dépassé le temps limite d\'exécution.');
      }
      logger.error(`Erreur lors de l'exécution de Buster pour "${safeName}":`, error);
      throw error;
    }
  }

  /**
   * Analyse la sortie de Buster pour extraire les emails.
   */
  parseBusterOutput(output) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = output.match(emailRegex) || [];
    return [...new Set(emails)];
  }

  /**
   * Récupère les statistiques d'utilisation de Buster
   */
  async getStats(investigationId) {
    try {
      const results = await this.prisma.result.findMany({
        where: {
          investigationId,
          toolSource: this.toolName
        }
      });

      const stats = {
        totalExecutions: results.length,
        totalEmailsGenerated: 0,
        averageScore: 0,
      };

      if (results.length > 0) {
        for (const result of results) {
          const data = result.data;
          if (data.generatedEmails) {
            stats.totalEmailsGenerated += data.generatedEmails.length;
          }
        }
        stats.averageScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
      }

      return stats;

    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques Buster:', error);
      throw error;
    }
  }

  /**
   * Teste la configuration de Buster.
   */
  async testConfiguration() {
    try {
      const { stdout, stderr } = await execAsync('buster -h');
      
      if (stderr && !stdout.includes('Usage')) {
        return {
          status: 'error',
          message: 'Buster a retourné une erreur lors du test.',
          error: stderr
        };
      }

      if (stdout.includes('buster')) {
        return {
          status: 'success',
          message: 'Buster est correctement configuré et accessible.'
        };
      }

      return {
        status: 'error',
        message: 'La sortie de la commande de test Buster est inattendue.',
        details: stdout
      };

    } catch (error) {
      logger.error('Erreur lors du test de configuration Buster:', error);
      return {
        status: 'error',
        message: 'Impossible d\'exécuter la commande buster. Assurez-vous qu\'elle est installée et dans le PATH.',
        error: error.message
      };
    }
  }
}

module.exports = BusterService;