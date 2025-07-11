const logger = require('../../utils/logger');
const { exec } = require('child_process');

class WauService {
  constructor(prisma) {
    this.prisma = prisma;
    this.toolName = 'wau';
  }

  /**
   * Valide un email en utilisant l'exécutable wau.
   */
  async validateEmail(investigationId, emailIndicator) {
    const email = emailIndicator.value;
    return new Promise((resolve, reject) => {
      logger.tool(this.toolName, investigationId, `Validation de l'email: ${email}`);
      
      // Utilise l'option -json pour une sortie structurée
      exec(`wau -json ${email}`, async (error, stdout, stderr) => {
        if (error && !stdout) { // wau peut retourner un code d'erreur même avec une sortie JSON valide (ex: email invalide)
          logger.toolError(this.toolName, investigationId, `Erreur d'exécution de wau pour ${email}: ${stderr}`);
          return resolve({ status: 'error', message: stderr });
        }

        try {
          const result = JSON.parse(stdout);
          let validationStatus = 'invalid';
          let confidence = 0.5;

          if (result.is_valid) {
            validationStatus = 'valid';
            confidence = 0.9;
            logger.tool(this.toolName, investigationId, `Email ${email} validé avec succès.`);
          } else if (result.is_risky) {
            validationStatus = 'risky';
            logger.tool(this.toolName, investigationId, `Email ${email} jugé risqué. Raison: ${result.reason}`);
          } else {
            logger.tool(this.toolName, investigationId, `Email ${email} est invalide. Raison: ${result.reason}`);
          }

          await this.prisma.indicator.update({
            where: { id: emailIndicator.id },
            data: {
              verified: result.is_valid,
              confidence: confidence,
              status: validationStatus,
            },
          });
          resolve({ status: validationStatus, message: result.reason || 'Validation effectuée' });

        } catch (e) {
          if (e instanceof SyntaxError) {
            logger.toolError(this.toolName, investigationId, `Erreur de parsing JSON pour la sortie de wau: ${stdout}`);
            return resolve({ status: 'error', message: 'Impossible de parser la sortie de wau.' });
          }
          // Gérer les erreurs de DB
          logger.toolError(this.toolName, investigationId, `Erreur de base de données après la validation de ${email}: ${e.message}`);
          reject(e);
        }
      });
    });
  }
}

module.exports = WauService;