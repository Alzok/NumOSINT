const logger = require('../../utils/logger');
const axios = require('axios');

const pdlApiKey = process.env.PDL_API_KEY;

class PdlService {
  constructor(prisma) {
    this.prisma = prisma;
    this.toolName = 'pdl';
  }

  /**
   * Enrichit un email en utilisant l'API de People Data Labs.
   */
  async enrichEmail(investigationId, emailIndicator) {
    if (!pdlApiKey) {
      logger.toolError(this.toolName, investigationId, "La variable d'environnement PDL_API_KEY n'est pas définie.");
      return;
    }

    const email = emailIndicator.value;
    try {
      logger.tool(this.toolName, investigationId, `Enrichissement PDL pour l'email: ${email}`);
      
      const response = await axios.get(`https://api.peopledatalabs.com/v5/person/enrich`, {
        params: { email },
        headers: { 'X-Api-Key': pdlApiKey },
        timeout: 60000,
      });

      const result = response.data;

      if (result.status === 200) {
        await this.prisma.result.create({
          data: {
            investigationId,
            indicatorId: emailIndicator.id,
            toolSource: this.toolName,
            data: result.data,
            score: 1.0, // PDL est une source de haute qualité
          },
        });
        logger.tool(this.toolName, investigationId, `Enrichissement PDL réussi pour ${email}.`);
      } else {
        logger.tool(this.toolName, investigationId, `Aucun résultat PDL pour ${email}.`);
      }
    } catch (error) {
      const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
      logger.toolError(this.toolName, investigationId, `Erreur lors de l'enrichissement PDL pour ${email}: ${errorMessage}`);
    }
  }
}

module.exports = PdlService;