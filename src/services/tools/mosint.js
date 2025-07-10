const { PrismaClient } = require('@prisma/client');
const { IndicatorType } = require('@prisma/client');
const logger = require('../../utils/logger');
const axios = require('axios');

const mosintServiceUrl = process.env.MOSINT_SERVICE_URL;

class MosintService {
  constructor(prisma) {
    this.prisma = prisma;
    this.toolName = 'mosint';
  }

  /**
   * Analyse un email spécifique d'une investigation.
   */
  async analyzeEmail(investigationId, emailIndicator) {
    const email = emailIndicator.value;
    if (!mosintServiceUrl) {
        logger.toolError(this.toolName, investigationId, "La variable d'environnement MOSINT_SERVICE_URL n'est pas définie.");
        return;
    }

    try {
      logger.tool(this.toolName, investigationId, `Analyse de l'email: ${email}`);

      const response = await axios.post(`${mosintServiceUrl}/scan`, { email }, {
        timeout: 180000, // 3 minutes
      });
      
      const analysis = response.data;

      // Vérification des doublons avant de sauvegarder les résultats
      const existingResult = await this.prisma.result.findFirst({
        where: {
          investigationId,
          indicatorId: emailIndicator.id,
          toolSource: this.toolName,
        }
      });

      if (!existingResult) {
        await this.prisma.result.create({
          data: {
            investigationId,
            indicatorId: emailIndicator.id,
            toolSource: this.toolName,
            data: analysis,
            score: this.calculateEmailScore(analysis),
          },
        });
      } else {
        logger.tool(this.toolName, investigationId, `Résultat déjà existant pour l'email ${email}. Pas de nouvelle sauvegarde.`);
      }

      // Ajout des nouveaux indicateurs découverts
      await this.addDiscoveredIndicators(investigationId, analysis, emailIndicator);

      logger.tool(this.toolName, investigationId, `Email ${email}: ${analysis.breaches?.length || 0} fuites, ${analysis.social_media?.length || 0} profils sociaux`);

    } catch (error) {
      const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
      logger.toolError(this.toolName, investigationId, `Erreur lors de l'appel au service Mosint pour ${email}: ${errorMessage}`);
      await this.prisma.result.create({
        data: {
          investigationId,
          indicatorId: emailIndicator.id,
          toolSource: this.toolName,
          data: {
            email,
            error: `Erreur du service Mosint: ${errorMessage}`,
          },
          score: 0,
        },
      });
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
  async addDiscoveredIndicators(investigationId, analysis, parentIndicator) {
    const indicators = [];
    const newGeneration = parentIndicator.generation + 1;

    if (analysis.social_media) {
      for (const profile of analysis.social_media) {
        if (profile.url) {
            indicators.push({
                type: IndicatorType.URL,
                value: profile.url,
                source: this.toolName,
                confidence: 0.7, // Confiance haute pour un profil social trouvé
                generation: newGeneration,
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
                confidence: 0.8, // Confiance très haute pour un email relié
                generation: newGeneration,
            });
        }
    }

    if (indicators.length > 0) {
        const dataToCreate = indicators.map(ind => ({
            ...ind,
            investigationId,
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
    if (!mosintServiceUrl) {
        return { status: 'error', message: "La variable d'environnement MOSINT_SERVICE_URL n'est pas définie." };
    }
    try {
      // Le service mosint n'a pas de route /health, on teste avec une requête vide qui devrait échouer avec un 400
      await axios.post(`${mosintServiceUrl}/scan`, {}, { timeout: 5000 });
      // Si on arrive ici, c'est inattendu, mais le service répond
      return { status: 'success', message: 'Le service Mosint est accessible.' };
    } catch (error) {
      if (error.response && error.response.status === 400) {
        return { status: 'success', message: 'Le service Mosint est correctement configuré et répond.' };
      }
      logger.error('Erreur lors du test de configuration Mosint:', error.message);
      return {
        status: 'error',
        message: 'Impossible de contacter le service Mosint.',
        error: error.message,
      };
    }
  }
}

module.exports = MosintService;