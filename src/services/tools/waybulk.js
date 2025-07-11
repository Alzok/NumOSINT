const { IndicatorType } = require('@prisma/client');
const logger = require('../../utils/logger');
const { exec } = require('child_process');

class WaybulkService {
  constructor(prisma) {
    this.prisma = prisma;
    this.toolName = 'waybulk';
  }

  /**
   * Recherche les URLs archivées pour un domaine en utilisant l'exécutable waybulk.
   */
  async lookupDomain(investigationId, domainIndicator) {
    const domain = domainIndicator.value;
    logger.tool(this.toolName, investigationId, `Recherche d'archives pour le domaine: ${domain}`);

    return new Promise((resolve, reject) => {
      exec(`echo ${domain} | waybulk`, { maxBuffer: 1024 * 1024 * 10 }, async (error, stdout, stderr) => { // 10MB buffer
        if (error) {
          logger.toolError(this.toolName, investigationId, `Erreur lors de la recherche d'archives pour ${domain}: ${stderr}`);
          return resolve(); // Résoudre sans rejeter pour ne pas bloquer l'orchestrateur
        }

        const urls = stdout.split('\n').filter(url => url.trim() !== '');

        if (urls.length > 0) {
          try {
            await this.prisma.result.create({
              data: {
                investigationId,
                indicatorId: domainIndicator.id,
                toolSource: this.toolName,
                data: {
                  domain,
                  urls,
                },
                score: Math.min(urls.length / 100, 1),
              },
            });

            const newIndicators = urls.map(url => ({
              investigationId,
              type: IndicatorType.URL,
              value: url,
              source: this.toolName,
              confidence: 0.8,
              generation: domainIndicator.generation + 1,
              verified: true,
              processed: false,
            }));

            if (newIndicators.length > 0) {
              await this.prisma.indicator.createMany({
                data: newIndicators,
                skipDuplicates: true,
              });
            }
            logger.tool(this.toolName, investigationId, `${urls.length} URL(s) archivée(s) trouvée(s) pour ${domain}.`);
          } catch (dbError) {
            logger.toolError(this.toolName, investigationId, `Erreur de base de données pour waybulk: ${dbError.message}`);
          }
        }
        resolve();
      });
    });
  }
}

module.exports = WaybulkService;