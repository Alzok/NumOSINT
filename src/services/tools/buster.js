const { IndicatorType } = require('@prisma/client');
const logger = require('../../utils/logger');
const axios = require('axios');

const busterServiceUrl = process.env.BUSTER_SERVICE_URL;

class BusterService {
  constructor(prisma) {
    this.prisma = prisma;
    this.toolName = 'buster';
  }

  /**
   * Génère des emails potentiels à partir d'un nom et les ajoute comme indicateurs.
   */
  async generateEmails(investigationId, nameIndicator) {
    if (!busterServiceUrl) {
      logger.toolError(this.toolName, investigationId, "La variable d'environnement BUSTER_SERVICE_URL n'est pas définie.");
      return;
    }

    const name = nameIndicator.value;
    const parts = name.split(' ');
    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';

    if (!lastName) {
      logger.tool(this.toolName, investigationId, `Nom incomplet pour la génération d'emails: ${name}`);
      return;
    }

    // Pour l'instant, on se base sur les domaines déjà découverts dans l'investigation
    const domains = await this.getDomainsForInvestigation(investigationId);
    if (domains.length === 0) {
      logger.tool(this.toolName, investigationId, `Aucun domaine trouvé pour générer des emails pour ${name}.`);
      return;
    }

    for (const domain of domains) {
      try {
        logger.tool(this.toolName, investigationId, `Recherche d'emails pour ${name} sur le domaine ${domain}`);
        
        const response = await axios.post(`${busterServiceUrl}/scan`, {
          firstName,
          lastName,
          domain,
        }, { timeout: 60000 }); // 1 minute timeout

        const result = response.data;

        if (result.emails && result.emails.length > 0) {
          await this.saveNewEmailIndicators(investigationId, result.emails, nameIndicator.generation + 1);
          logger.tool(this.toolName, investigationId, `${result.emails.length} email(s) trouvé(s) pour ${name} sur ${domain}.`);
        }
      } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        logger.toolError(this.toolName, investigationId, `Erreur lors de l'appel au service Buster pour ${name} sur ${domain}: ${errorMessage}`);
      }
    }
  }

  async getDomainsForInvestigation(investigationId) {
    const domainIndicators = await this.prisma.indicator.findMany({
      where: {
        investigationId,
        type: IndicatorType.DOMAIN,
      },
      select: {
        value: true,
      },
    });
    return [...new Set(domainIndicators.map(d => d.value))];
  }

  async saveNewEmailIndicators(investigationId, emails, generation) {
    const newIndicators = emails.map(email => ({
      investigationId,
      type: IndicatorType.EMAIL,
      value: email,
      source: this.toolName,
      confidence: 0.6, // Confiance moyenne pour un email généré et trouvé
      generation,
      verified: false,
      processed: false,
    }));

    if (newIndicators.length > 0) {
      await this.prisma.indicator.createMany({
        data: newIndicators,
        skipDuplicates: true,
      });
    }
  }

  /**
   * Effectue une recherche Reverse Whois pour un email donné.
   */
  async reverseWhois(investigationId, emailIndicator) {
    if (!busterServiceUrl) {
      logger.toolError(this.toolName, investigationId, "La variable d'environnement BUSTER_SERVICE_URL n'est pas définie.");
      return;
    }

    const email = emailIndicator.value;
    try {
      logger.tool(this.toolName, investigationId, `Recherche Reverse Whois pour: ${email}`);
      
      const response = await axios.post(`${busterServiceUrl}/reverse-whois`, { email }, { timeout: 120000 }); // 2 minutes timeout
      const result = response.data;

      if (result.domains && result.domains.length > 0) {
        // Sauvegarder les résultats
        await this.prisma.result.create({
          data: {
            investigationId,
            indicatorId: emailIndicator.id,
            toolSource: this.toolName,
            data: {
              email,
              reverse_whois: result.domains,
            },
            score: Math.min(result.domains.length / 10, 1),
          },
        });

        // Créer de nouveaux indicateurs de domaine
        const newIndicators = result.domains.map(domain => ({
          investigationId,
          type: IndicatorType.DOMAIN,
          value: domain,
          source: this.toolName,
          confidence: 0.9,
          generation: emailIndicator.generation + 1,
          verified: true,
          processed: false,
        }));

        if (newIndicators.length > 0) {
          await this.prisma.indicator.createMany({
            data: newIndicators,
            skipDuplicates: true,
          });
        }
        logger.tool(this.toolName, investigationId, `${result.domains.length} domaine(s) trouvé(s) pour ${email}.`);
      }
    } catch (error) {
      const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
      logger.toolError(this.toolName, investigationId, `Erreur lors de la recherche Reverse Whois pour ${email}: ${errorMessage}`);
    }
  }

  async testConfiguration() {
    if (!busterServiceUrl) {
        return { status: 'error', message: "La variable d'environnement BUSTER_SERVICE_URL n'est pas définie." };
    }
    try {
      await axios.post(`${busterServiceUrl}/scan`, {}, { timeout: 5000 });
      return { status: 'success', message: 'Le service Buster est accessible.' };
    } catch (error) {
      if (error.response && error.response.status === 400) {
        return { status: 'success', message: 'Le service Buster est correctement configuré et répond.' };
      }
      logger.error('Erreur lors du test de configuration Buster:', error.message);
      return {
        status: 'error',
        message: 'Impossible de contacter le service Buster.',
        error: error.message,
      };
    }
  }
}

module.exports = BusterService;