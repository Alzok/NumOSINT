const { IndicatorType } = require('@prisma/client');
const logger = require('../../utils/logger');
const axios = require('axios');

const asnServiceUrl = process.env.ASN_SERVICE_URL;

class AsnService {
  constructor(prisma) {
    this.prisma = prisma;
    this.toolName = 'asn';
  }

  /**
   * Recherche les informations ASN pour une adresse IP.
   */
  async lookupIp(investigationId, ipIndicator) {
    if (!asnServiceUrl) {
      logger.toolError(this.toolName, investigationId, "La variable d'environnement ASN_SERVICE_URL n'est pas définie.");
      return;
    }

    const ip = ipIndicator.value;
    try {
      logger.tool(this.toolName, investigationId, `Recherche ASN pour l'IP: ${ip}`);
      
      const response = await axios.post(`${asnServiceUrl}/lookup`, { ip }, { timeout: 60000 });
      const result = response.data;

      if (result) {
        await this.prisma.result.create({
          data: {
            investigationId,
            indicatorId: ipIndicator.id,
            toolSource: this.toolName,
            data: result,
            score: 0.5, // Score de base pour un résultat ASN
          },
        });
        logger.tool(this.toolName, investigationId, `Informations ASN trouvées pour ${ip}.`);
      }
    } catch (error) {
      const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
      logger.toolError(this.toolName, investigationId, `Erreur lors de la recherche ASN pour ${ip}: ${errorMessage}`);
    }
  }
}

module.exports = AsnService;