const logger = require('../../utils/logger');
const { IndicatorType } = require('@prisma/client');

/**
 * Classe de base pour tous les services d'outils OSINT.
 * Elle centralise la logique commune de sauvegarde des résultats,
 * de création de nouveaux indicateurs et de gestion des erreurs.
 */
class BaseToolService {
  constructor(prisma, toolName) {
    if (!prisma) {
      throw new Error("L'instance de Prisma est requise.");
    }
    if (!toolName) {
        throw new Error("Le nom de l'outil ('toolName') est requis.");
    }
    this.prisma = prisma;
    this.toolName = toolName;
  }

  /**
   * Méthode principale que chaque service devra implémenter.
   */
  async run(investigationId, indicator) {
    throw new Error("La méthode 'run' doit être implémentée par le service enfant.");
  }

  /**
   * Sauvegarde un résultat brut dans la base de données.
   * @protected
   */
  async _saveResult(investigationId, indicatorId, data, rawData = null) {
    try {
      return await this.prisma.result.create({
        data: {
          investigationId,
          indicatorId,
          toolSource: this.toolName,
          data,
          rawData: rawData || data,
        },
      });
    } catch (error) {
      logger.error(`[${this.toolName}] Erreur lors de la sauvegarde du résultat pour l'indicateur ${indicatorId}:`, error);
      // Ne propage pas l'erreur pour ne pas bloquer le flux complet
    }
  }

  /**
   * Crée de nouveaux indicateurs à partir des résultats d'un outil.
   * @protected
   */
  async _saveIndicators(investigationId, parentIndicator, newIndicatorsData) {
    if (!newIndicatorsData || newIndicatorsData.length === 0) {
      return;
    }

    const createdIndicators = [];
    for (const item of newIndicatorsData) {
        // Éviter les doublons pour le même type/valeur dans une investigation
        const existing = await this.prisma.indicator.findFirst({
            where: {
                investigationId,
                type: item.type,
                value: item.value,
            }
        });

        if (!existing) {
            try {
                const newIndicator = await this.prisma.indicator.create({
                    data: {
                        investigationId,
                        type: item.type,
                        value: item.value,
                        confidence: item.confidence || 75, // Confiance par défaut
                        generation: parentIndicator.generation + 1,
                        sourceTool: this.toolName,
                        parentId: parentIndicator.id,
                    },
                });
                createdIndicators.push(newIndicator);
            } catch (error) {
                 // Gérer les erreurs de contrainte unique si deux appels créent le même en même temps
                if (error.code !== 'P2002') {
                    logger.error(`[${this.toolName}] Erreur lors de la création de l'indicateur ${item.value}:`, error);
                }
            }
        }
    }
    
    if (createdIndicators.length > 0) {
        logger.info(`[${this.toolName}] ${createdIndicators.length} nouvel(s) indicateur(s) créé(s) à partir de ${parentIndicator.value}.`);
    }
  }

  /**
   * Gère les erreurs d'API de manière standardisée.
   * @protected
   */
  _handleApiError(error, context) {
    let errorMessage = `[${this.toolName}] Erreur API`;
    if (context) {
      errorMessage += ` pour ${context}`;
    }

    if (error.response) {
      logger.error(`${errorMessage}:`, { status: error.response.status, data: error.response.data });
    } else if (error.request) {
      logger.error(`${errorMessage}: Aucune réponse reçue`, { request: error.request });
    } else {
      logger.error(`${errorMessage}:`, { message: error.message });
    }
    
    // Propager une erreur générique pour que _runToolWithRetry puisse la gérer
    throw new Error(`${this.toolName} a échoué. Voir les logs pour plus de détails.`);
  }
}

module.exports = BaseToolService;