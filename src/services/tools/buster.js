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
   * Génère des emails à partir des noms d'une investigation
   */
  async generateEmails(investigationId) {
    try {
      logger.tool(this.toolName, investigationId, 'Démarrage de la génération d\'emails');

      // Récupération des noms de l'investigation
      const names = await this.prisma.indicator.findMany({
        where: {
          investigationId,
          type: IndicatorType.NAME
        }
      });

      if (names.length === 0) {
        logger.tool(this.toolName, investigationId, 'Aucun nom trouvé pour la génération d\'emails');
        return {
          generatedEmails: 0,
          validEmails: 0,
          invalidEmails: 0
        };
      }

      const results = [];
      let totalGenerated = 0;
      let totalValid = 0;
      let totalInvalid = 0;

      // Traitement de chaque nom
      for (const nameIndicator of names) {
        const name = nameIndicator.value;
        logger.tool(this.toolName, investigationId, `Traitement du nom: ${name}`);

        try {
          // Génération d'emails avec Buster
          const emails = await this.generateEmailsForName(name);
          totalGenerated += emails.length;

          // Validation des emails générés
          const validationResults = await this.validateEmails(emails);
          
          const validEmails = validationResults.filter(result => result.valid);
          const invalidEmails = validationResults.filter(result => !result.valid);
          
          totalValid += validEmails.length;
          totalInvalid += invalidEmails.length;

          // Sauvegarde des résultats
          const result = await this.prisma.result.create({
            data: {
              investigationId,
              indicatorId: nameIndicator.id,
              toolSource: this.toolName,
              data: {
                name,
                generatedEmails: emails,
                validEmails: validEmails.map(e => e.email),
                invalidEmails: invalidEmails.map(e => e.email),
                validationResults
              },
              score: validEmails.length / emails.length
            }
          });

          results.push(result);

          // Ajout des emails valides comme nouveaux indicateurs
          for (const validEmail of validEmails) {
            await this.prisma.indicator.create({
              data: {
                investigationId,
                type: IndicatorType.EMAIL,
                value: validEmail.email,
                source: this.toolName,
                confidence: 0.8,
                verified: true
              }
            });
          }

          logger.tool(this.toolName, investigationId, 
            `Nom ${name}: ${emails.length} emails générés, ${validEmails.length} valides`);

        } catch (error) {
          logger.toolError(this.toolName, investigationId, error);
          
          // Sauvegarde de l'erreur
          await this.prisma.result.create({
            data: {
              investigationId,
              indicatorId: nameIndicator.id,
              toolSource: this.toolName,
              data: {
                name,
                error: error.message,
                generatedEmails: [],
                validEmails: [],
                invalidEmails: []
              },
              score: 0
            }
          });
        }
      }

      logger.tool(this.toolName, investigationId, 
        `Génération terminée: ${totalGenerated} emails générés, ${totalValid} valides, ${totalInvalid} invalides`);

      return {
        generatedEmails: totalGenerated,
        validEmails: totalValid,
        invalidEmails: totalInvalid,
        results
      };

    } catch (error) {
      logger.toolError(this.toolName, investigationId, error);
      throw error;
    }
  }

  /**
   * Génère des emails pour un nom donné
   */
  async generateEmailsForName(name) {
    try {
      // Simulation de génération d'emails avec Buster
      // En production, cela appellerait l'outil Buster réel
      
      const commonDomains = [
        'gmail.com',
        'yahoo.com',
        'outlook.com',
        'hotmail.com',
        'icloud.com',
        'protonmail.com'
      ];

      const emailPatterns = [
        // firstname.lastname@domain
        (firstName, lastName, domain) => `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
        // firstname@domain
        (firstName, lastName, domain) => `${firstName.toLowerCase()}@${domain}`,
        // firstname_lastname@domain
        (firstName, lastName, domain) => `${firstName.toLowerCase()}_${lastName.toLowerCase()}@${domain}`,
        // flastname@domain
        (firstName, lastName, domain) => `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}@${domain}`,
        // lastname.firstname@domain
        (firstName, lastName, domain) => `${lastName.toLowerCase()}.${firstName.toLowerCase()}@${domain}`,
        // lastname@domain
        (firstName, lastName, domain) => `${lastName.toLowerCase()}@${domain}`,
        // firstname_lastname@domain
        (firstName, lastName, domain) => `${firstName.toLowerCase()}-${lastName.toLowerCase()}@${domain}`,
        // firstnamelastname@domain
        (firstName, lastName, domain) => `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`
      ];

      const emails = [];
      const nameParts = name.split(' ').filter(part => part.length > 0);
      
      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];

        for (const domain of commonDomains) {
          for (const pattern of emailPatterns) {
            const email = pattern(firstName, lastName, domain);
            if (!emails.includes(email)) {
              emails.push(email);
            }
          }
        }
      } else if (nameParts.length === 1) {
        // Cas d'un nom unique
        const singleName = nameParts[0];
        for (const domain of commonDomains) {
          emails.push(`${singleName.toLowerCase()}@${domain}`);
        }
      }

      // Limitation du nombre d'emails générés
      return emails.slice(0, 20);

    } catch (error) {
      logger.error(`Erreur lors de la génération d'emails pour ${name}:`, error);
      throw error;
    }
  }

  /**
   * Valide une liste d'emails
   */
  async validateEmails(emails) {
    try {
      const results = [];

      for (const email of emails) {
        try {
          // Validation basique du format
          const isValidFormat = this.validateEmailFormat(email);
          
          if (isValidFormat) {
            // Simulation de validation SMTP
            const isValidSMTP = await this.validateEmailSMTP(email);
            
            results.push({
              email,
              valid: isValidSMTP,
              format: isValidFormat,
              smtp: isValidSMTP,
              timestamp: new Date().toISOString()
            });
          } else {
            results.push({
              email,
              valid: false,
              format: false,
              smtp: false,
              timestamp: new Date().toISOString()
            });
          }

        } catch (error) {
          results.push({
            email,
            valid: false,
            format: false,
            smtp: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }

      return results;

    } catch (error) {
      logger.error('Erreur lors de la validation des emails:', error);
      throw error;
    }
  }

  /**
   * Valide le format d'un email
   */
  validateEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valide un email via SMTP (simulation)
   */
  async validateEmailSMTP(email) {
    try {
      // Simulation de validation SMTP
      // En production, cela utiliserait une vraie validation SMTP
      
      // Pour la simulation, on considère qu'un email sur 3 est valide
      const random = Math.random();
      const isValid = random > 0.7; // 30% de chance d'être valide
      
      // Simulation d'un délai de validation
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      
      return isValid;

    } catch (error) {
      logger.error(`Erreur lors de la validation SMTP de ${email}:`, error);
      return false;
    }
  }

  /**
   * Exécute Buster en ligne de commande (pour une vraie intégration)
   */
  async executeBusterCommand(name, domain = null) {
    try {
      let command = `buster -n "${name}"`;
      
      if (domain) {
        command += ` -d "${domain}"`;
      }

      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 secondes de timeout
        maxBuffer: 1024 * 1024 // 1MB de buffer
      });

      if (stderr) {
        logger.warn(`Buster stderr: ${stderr}`);
      }

      // Parsing de la sortie de Buster
      return this.parseBusterOutput(stdout);

    } catch (error) {
      logger.error(`Erreur lors de l'exécution de Buster:`, error);
      throw error;
    }
  }

  /**
   * Parse la sortie de Buster
   */
  parseBusterOutput(output) {
    try {
      const lines = output.split('\n').filter(line => line.trim());
      const emails = [];

      for (const line of lines) {
        // Supposons que Buster retourne des emails un par ligne
        if (line.includes('@') && this.validateEmailFormat(line.trim())) {
          emails.push(line.trim());
        }
      }

      return emails;

    } catch (error) {
      logger.error('Erreur lors du parsing de la sortie Buster:', error);
      return [];
    }
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
        totalEmailsValid: 0,
        totalEmailsInvalid: 0,
        averageScore: 0,
        successRate: 0
      };

      if (results.length > 0) {
        for (const result of results) {
          const data = result.data;
          
          if (data.generatedEmails) {
            stats.totalEmailsGenerated += data.generatedEmails.length;
          }
          
          if (data.validEmails) {
            stats.totalEmailsValid += data.validEmails.length;
          }
          
          if (data.invalidEmails) {
            stats.totalEmailsInvalid += data.invalidEmails.length;
          }
        }

        stats.averageScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
        stats.successRate = (stats.totalEmailsValid / stats.totalEmailsGenerated) * 100;
      }

      return stats;

    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques Buster:', error);
      throw error;
    }
  }

  /**
   * Teste la configuration de Buster
   */
  async testConfiguration() {
    try {
      // Test de base de Buster
      const testName = 'John Doe';
      const testEmails = await this.generateEmailsForName(testName);
      
      return {
        status: 'success',
        message: 'Configuration Buster testée avec succès',
        details: {
          testName,
          emailsGenerated: testEmails.length,
          sampleEmails: testEmails.slice(0, 3)
        }
      };

    } catch (error) {
      logger.error('Erreur lors du test de configuration Buster:', error);
      
      return {
        status: 'error',
        message: 'Erreur lors du test de configuration',
        error: error.message
      };
    }
  }
}

module.exports = BusterService;