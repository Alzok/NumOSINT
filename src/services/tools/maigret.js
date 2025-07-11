const { IndicatorType } = require('@prisma/client');
const logger = require('../../utils/logger');
const axios = require('axios');

const MAIGRET_SERVICE_URL = process.env.MAIGRET_SERVICE_URL || 'http://localhost:5002';

class MaigretService {
  constructor(prisma) {
    this.prisma = prisma;
    this.toolName = 'maigret';
    this.serviceUrl = MAIGRET_SERVICE_URL;
  }

  /**
   * Recherche des profils pour un username spécifique en appelant le microservice Maigret.
   */
  async searchProfiles(investigationId, usernameIndicator) {
    const username = usernameIndicator.value;
    try {
      logger.tool(this.toolName, investigationId, `Recherche de profils pour le username: ${username} via le microservice`);

      const profiles = await this.executeMaigretCommand(username);
      
      // La logique de sauvegarde des résultats et de création de nouveaux indicateurs reste la même.
      const existingResult = await this.prisma.result.findFirst({
        where: {
          investigationId,
          indicatorId: usernameIndicator.id,
          toolSource: this.toolName,
        }
      });

      if (!existingResult) {
        await this.prisma.result.create({
          data: {
            investigationId,
            indicatorId: usernameIndicator.id,
            toolSource: this.toolName,
            data: {
              username,
              profiles,
            },
            score: profiles.length > 0 ? Math.min(profiles.length / 50, 1) : 0,
          },
        });
      } else {
        logger.tool(this.toolName, investigationId, `Résultat déjà existant pour le username ${username}. Pas de nouvelle sauvegarde.`);
      }

      if (profiles.length > 0) {
        const indicatorData = profiles
          .filter(profile => profile && profile.url) // S'assurer que le profil et l'URL existent
          .map(profile => ({
            investigationId,
            type: IndicatorType.URL,
            value: profile.url,
            source: this.toolName,
            confidence: 0.9,
            generation: usernameIndicator.generation + 1,
            verified: true,
            processed: false,
          }));

        if (indicatorData.length > 0) {
            await this.prisma.indicator.createMany({
                data: indicatorData,
                skipDuplicates: true,
            });
        }
      }

      logger.tool(this.toolName, investigationId, `Username ${username}: ${profiles.length} profils trouvés via le microservice`);

    } catch (error) {
      logger.toolError(this.toolName, investigationId, error);
      // On ne crée plus de résultat d'erreur ici, car l'orchestrateur va marquer l'investigation comme FAILED.
      // Cela évite de polluer les résultats avec des entrées d'erreur.
      // On propage l'erreur pour que l'orchestrateur la traite.
      throw error;
    }
  }

  /**
   * Appelle le microservice Maigret.
   * @param {string} username - Le nom d'utilisateur à rechercher.
   * @param {string} tags - Les tags pour filtrer.
   * @param {boolean} recursive - Activer la recherche récursive.
   */
  async executeMaigretCommand(username, tags = 'all', recursive = false) {
    const endpoint = recursive ? '/recursive-search' : '/scan';
    const payload = { username, tags };
    const timeout = recursive ? 900000 : 300000; // 15 minutes pour récursif, 5 pour normal

    try {
      logger.info(`Calling Maigret service at ${this.serviceUrl}${endpoint} for ${username}`);
      const response = await axios.post(`${this.serviceUrl}${endpoint}`, payload, { timeout });
      
      // Le microservice retourne directement la liste des profils trouvés.
      // On s'assure de retourner un tableau même si la réponse est vide ou malformée.
      const data = response.data;
      if (data && data.sites && typeof data.sites === 'object') {
        return Object.values(data.sites).filter(site => site.status === 'found' && site.url);
      }
      return [];

    } catch (error) {
      const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
      logger.error(`Erreur lors de l'appel au microservice Maigret pour ${username} (recursive: ${recursive}): ${errorMessage}`);
      // Propage une erreur plus explicite pour l'orchestrateur.
      throw new Error(`Maigret service failed for ${username}: ${errorMessage}`);
    }
  }

  /**
   * Teste la connexion au microservice Maigret.
   */
  async testConfiguration() {
    try {
      // On pourrait ajouter un endpoint /health au microservice pour un meilleur test.
      // Pour l'instant, on se contente de vérifier que l'URL est définie.
      if (!this.serviceUrl) {
          throw new Error('MAIGRET_SERVICE_URL is not defined');
      }
      // Un test plus approfondi pourrait faire un appel à un endpoint /health
      // const response = await axios.get(`${this.serviceUrl}/health`);
      // if (response.status !== 200) {
      //     throw new Error(`Maigret service health check failed with status ${response.status}`);
      // }
      return { status: 'success', message: `Maigret service est configuré à l'adresse: ${this.serviceUrl}` };
    } catch (error) {
      logger.error('Erreur lors du test de configuration Maigret service:', error);
      return {
        status: 'error',
        message: 'Impossible de contacter le microservice Maigret.',
        error: error.message,
      };
    }
  }
}

module.exports = MaigretService;