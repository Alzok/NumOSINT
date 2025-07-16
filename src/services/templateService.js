const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

class TemplateService {
  constructor() {
    this.prisma = prisma;
  }

  async createTemplate(userId, name, inputData) {
    try {
      const template = await this.prisma.investigationTemplate.create({
        data: {
          userId,
          name,
          inputData,
        },
      });
      logger.info(`Modèle '${name}' créé pour l'utilisateur ${userId}.`);
      return template;
    } catch (error) {
      logger.error(`Erreur lors de la création du modèle pour l'utilisateur ${userId}:`, error);
      throw new Error('Impossible de créer le modèle.');
    }
  }

  async getTemplates(userId) {
    try {
      const templates = await this.prisma.investigationTemplate.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      return templates;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des modèles pour l'utilisateur ${userId}:`, error);
      throw new Error('Impossible de récupérer les modèles.');
    }
  }

  async deleteTemplate(userId, templateId) {
    try {
      const result = await this.prisma.investigationTemplate.deleteMany({
        where: {
          id: templateId,
          userId,
        },
      });
      if (result.count > 0) {
        logger.info(`Modèle ${templateId} supprimé pour l'utilisateur ${userId}.`);
      }
      return result;
    } catch (error) {
      logger.error(`Erreur lors de la suppression du modèle ${templateId} pour l'utilisateur ${userId}:`, error);
      throw new Error('Impossible de supprimer le modèle.');
    }
  }
}

module.exports = new TemplateService();