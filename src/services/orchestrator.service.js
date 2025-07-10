const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Orchestrateur de workflow dynamique.
 * Décide quelle chaîne d'outils lancer en fonction des données d'entrée.
 */
class DynamicOrchestrator {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Démarre une investigation en analysant les données d'entrée pour
   * déterminer le workflow approprié.
   *
   * @param {object} data - Les données du formulaire initial.
   * @param {string[]} [data.emails] - Liste d'emails.
   * @param {string[]} [data.domains] - Liste de domaines.
   * @param {string[]} [data.names] - Liste de noms.
   * @param {string[]} [data.phones] - Liste de numéros de téléphone.
   * @param {string[]} [data.usernames] - Liste de noms d'utilisateur.
   */
  async startInvestigation(data) {
    logger.info('WORKFLOW: Starting dynamic investigation orchestration.', { data });

    const { emails, domains, names, phones, usernames } = data;

    if (emails && emails.length > 0) {
      try {
        const response = await axios.post('http://wau-service:5006/validate', { email: emails[0] });
        logger.info('Wau validation successful', { result: response.data });
      } catch (error) {
        logger.error('Error calling wau-service', { error: error.message });
      }

      // Reverse Whois lookup
      try {
        const response = await axios.post('http://buster-service:5003/reverse-whois', { email: emails[0] });
        logger.info('Buster reverse whois lookup successful', { result: response.data });
      } catch (error) {
        logger.error('Error calling buster-service for reverse whois', { error: error.message });
      }

      // HIBP lookup
      try {
        const response = await axios.post('http://mosint-service:5004/hibp-lookup', { email: emails[0] });
        logger.info('Mosint HIBP lookup successful', { result: response.data });
      } catch (error) {
        logger.error('Error calling mosint-service for HIBP lookup', { error: error.message });
      }
      
      console.log(`WORKFLOW: Starting Mosint for email(s): ${emails.join(', ')}`);
      logger.info(`WORKFLOW: Starting Mosint for email(s): ${emails.join(', ')}`);
    }

    if (phones && phones.length > 0) {
      console.log(`WORKFLOW: Starting PhoneInfoga for phone(s): ${phones.join(', ')}`);
      logger.info(`WORKFLOW: Starting PhoneInfoga for phone(s): ${phones.join(', ')}`);
    }

    if (usernames && usernames.length > 0) {
      console.log(`WORKFLOW: Starting Maigret for username(s): ${usernames.join(', ')}`);
      logger.info(`WORKFLOW: Starting Maigret for username(s): ${usernames.join(', ')}`);
    }

    if (names && names.length > 0) {
      console.log(`WORKFLOW: Starting Buster for name(s): ${names.join(', ')}`);
      logger.info(`WORKFLOW: Starting Buster for name(s): ${names.join(', ')}`);
    }
    
    if (domains && domains.length > 0) {
        try {
            const response = await axios.post('http://waybulk-service:5007/lookup', { domain: domains[0] });
            logger.info('Waybulk lookup successful', { result: response.data });
        } catch (error) {
            logger.error('Error calling waybulk-service', { error: error.message });
        }
        console.log(`WORKFLOW: Starting Buster for domain(s): ${domains.join(', ')}`);
        logger.info(`WORKFLOW: Starting Buster for domain(s): ${domains.join(', ')}`);
    }

    // Placeholder pour la logique de retour
    return {
      message: "Workflow started based on input data.",
      workflow: this.determineWorkflow(data)
    };
  }

  /**
   * Détermine la chaîne d'outils à utiliser.
   * @private
   */
  determineWorkflow(data) {
    const workflow = [];
    if (data.emails && data.emails.length > 0) workflow.push('Mosint');
    if (data.phones && data.phones.length > 0) workflow.push('PhoneInfoga');
    if (data.usernames && data.usernames.length > 0) workflow.push('Maigret');
    if (data.names && data.names.length > 0) workflow.push('Buster (names)');
    if (data.domains && data.domains.length > 0) workflow.push('Buster (domains)');
    return workflow;
  }
}

module.exports = DynamicOrchestrator;