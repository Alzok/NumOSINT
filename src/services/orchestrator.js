const logger = require('../utils/logger');
const { InvestigationStatus, IndicatorType } = require('@prisma/client');

// Services des outils OSINT
const BusterService = require('./tools/buster');
const MosintService = require('./tools/mosint');
const MaigretService = require('./tools/maigret');
const PhoneInfogaService = require('./tools/phoneinfoga');
const SpiderFootService = require('./tools/spiderfoot');

class OrchestratorService {
  constructor(prisma, io) {
    this.prisma = prisma;
    this.io = io;
    this.activeInvestigations = new Map();
    
    // Initialisation des services
    this.busterService = new BusterService(prisma);
    this.mosintService = new MosintService(prisma);
    this.maigretService = new MaigretService(prisma);
    this.phoneinfogaService = new PhoneInfogaService(prisma);
    this.spiderfootService = new SpiderFootService(prisma);
  }

  /**
   * Démarre une nouvelle investigation
   */
  async startInvestigation(inputData) {
    try {
      logger.info(`🚀 Démarrage d'une nouvelle investigation`, { inputData });

      // Création de l'investigation en base
      const investigation = await this.prisma.investigation.create({
        data: {
          status: InvestigationStatus.INITIALIZING,
          progress: 0,
          currentStep: 'initialization',
          inputData: inputData,
          indicators: {
            create: this.extractInitialIndicators(inputData)
          }
        },
        include: {
          indicators: true
        }
      });

      // Ajout à la liste des investigations actives
      this.activeInvestigations.set(investigation.id, {
        investigation,
        status: 'running',
        startTime: new Date()
      });

      // Notification temps réel
      this.io.to(investigation.id).emit('investigation:started', {
        id: investigation.id,
        status: investigation.status,
        progress: investigation.progress
      });

      // Démarrage du flux d'enrichissement
      this.runEnrichmentFlow(investigation.id);

      return investigation;

    } catch (error) {
      logger.error('❌ Erreur lors du démarrage de l\'investigation:', error);
      throw error;
    }
  }

  /**
   * Extrait les indicateurs initiaux depuis les données d'entrée
   */
  extractInitialIndicators(inputData) {
    const indicators = [];

    if (inputData.names && Array.isArray(inputData.names)) {
      inputData.names.forEach(name => {
        indicators.push({
          type: IndicatorType.NAME,
          value: name.trim(),
          source: 'input',
          confidence: 1.0,
          verified: true
        });
      });
    }

    if (inputData.emails && Array.isArray(inputData.emails)) {
      inputData.emails.forEach(email => {
        indicators.push({
          type: IndicatorType.EMAIL,
          value: email.trim(),
          source: 'input',
          confidence: 1.0,
          verified: true
        });
      });
    }

    if (inputData.usernames && Array.isArray(inputData.usernames)) {
      inputData.usernames.forEach(username => {
        indicators.push({
          type: IndicatorType.USERNAME,
          value: username.trim(),
          source: 'input',
          confidence: 1.0,
          verified: true
        });
      });
    }

    if (inputData.phones && Array.isArray(inputData.phones)) {
      inputData.phones.forEach(phone => {
        indicators.push({
          type: IndicatorType.PHONE,
          value: phone.trim(),
          source: 'input',
          confidence: 1.0,
          verified: true
        });
      });
    }

    if (inputData.domains && Array.isArray(inputData.domains)) {
      inputData.domains.forEach(domain => {
        indicators.push({
          type: IndicatorType.DOMAIN,
          value: domain.trim(),
          source: 'input',
          confidence: 1.0,
          verified: true
        });
      });
    }

    return indicators;
  }

  /**
   * Exécute le flux d'enrichissement complet
   */
  async runEnrichmentFlow(investigationId) {
    try {
      logger.info(`🔄 Démarrage du flux d'enrichissement pour l'investigation ${investigationId}`);

      // Mise à jour du statut
      await this.updateInvestigationStatus(investigationId, InvestigationStatus.ENRICHING, 10, 'enrichment_started');

      // Étape 1: Génération d'emails avec buster (10-25%)
      await this.runBusterStep(investigationId);

      // Étape 2: Analyse d'emails avec mosint (25-40%)
      await this.runMosintStep(investigationId);

      // Étape 3: Analyse de usernames avec Maigret (40-60%)
      await this.runMaigretStep(investigationId);

      // Étape 4: Analyse de téléphones avec PhoneInfoga (60-75%)
      await this.runPhoneInfogaStep(investigationId);

      // Mise à jour du statut pour le scan exhaustif
      await this.updateInvestigationStatus(investigationId, InvestigationStatus.SCANNING, 75, 'scanning_started');

      // Étape 5: Scan exhaustif avec SpiderFoot (75-90%)
      await this.runSpiderFootStep(investigationId);

      // Étape 6: Consolidation (90-100%)
      await this.runConsolidationStep(investigationId);

      // Finalisation
      await this.finalizeInvestigation(investigationId);

    } catch (error) {
      logger.error(`❌ Erreur dans le flux d'enrichissement pour ${investigationId}:`, error);
      await this.handleInvestigationError(investigationId, error);
    }
  }

  /**
   * Étape 1: Génération d'emails avec buster
   */
  async runBusterStep(investigationId) {
    try {
      logger.info(`📧 Étape Buster pour l'investigation ${investigationId}`);
      
      await this.logStep(investigationId, 'buster', 'Démarrage de la génération d\'emails avec Buster');
      
      const result = await this.busterService.generateEmails(investigationId);
      
      await this.updateInvestigationStatus(investigationId, InvestigationStatus.ENRICHING, 25, 'buster_completed');
      
      await this.logStep(investigationId, 'buster', `Génération terminée: ${result.generatedEmails} emails générés`);
      
      return result;

    } catch (error) {
      logger.error(`❌ Erreur Buster pour ${investigationId}:`, error);
      await this.logStep(investigationId, 'buster', `Erreur: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Étape 2: Analyse d'emails avec mosint
   */
  async runMosintStep(investigationId) {
    try {
      logger.info(`🔍 Étape Mosint pour l'investigation ${investigationId}`);
      
      await this.logStep(investigationId, 'mosint', 'Démarrage de l\'analyse d\'emails avec Mosint');
      
      const result = await this.mosintService.analyzeEmails(investigationId);
      
      await this.updateInvestigationStatus(investigationId, InvestigationStatus.ENRICHING, 40, 'mosint_completed');
      
      await this.logStep(investigationId, 'mosint', `Analyse terminée: ${result.analyzedEmails} emails analysés`);
      
      return result;

    } catch (error) {
      logger.error(`❌ Erreur Mosint pour ${investigationId}:`, error);
      await this.logStep(investigationId, 'mosint', `Erreur: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Étape 3: Analyse de usernames avec Maigret
   */
  async runMaigretStep(investigationId) {
    try {
      logger.info(`👤 Étape Maigret pour l'investigation ${investigationId}`);
      
      await this.logStep(investigationId, 'maigret', 'Démarrage de l\'analyse de profils avec Maigret');
      
      const result = await this.maigretService.searchProfiles(investigationId);
      
      await this.updateInvestigationStatus(investigationId, InvestigationStatus.ENRICHING, 60, 'maigret_completed');
      
      await this.logStep(investigationId, 'maigret', `Recherche terminée: ${result.foundProfiles} profils trouvés`);
      
      return result;

    } catch (error) {
      logger.error(`❌ Erreur Maigret pour ${investigationId}:`, error);
      await this.logStep(investigationId, 'maigret', `Erreur: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Étape 4: Analyse de téléphones avec PhoneInfoga
   */
  async runPhoneInfogaStep(investigationId) {
    try {
      logger.info(`📱 Étape PhoneInfoga pour l'investigation ${investigationId}`);
      
      await this.logStep(investigationId, 'phoneinfoga', 'Démarrage de l\'analyse de téléphones avec PhoneInfoga');
      
      const result = await this.phoneinfogaService.analyzePhones(investigationId);
      
      await this.updateInvestigationStatus(investigationId, InvestigationStatus.ENRICHING, 75, 'phoneinfoga_completed');
      
      await this.logStep(investigationId, 'phoneinfoga', `Analyse terminée: ${result.analyzedPhones} téléphones analysés`);
      
      return result;

    } catch (error) {
      logger.error(`❌ Erreur PhoneInfoga pour ${investigationId}:`, error);
      await this.logStep(investigationId, 'phoneinfoga', `Erreur: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Étape 5: Scan exhaustif avec SpiderFoot
   */
  async runSpiderFootStep(investigationId) {
    try {
      logger.info(`🕷️ Étape SpiderFoot pour l'investigation ${investigationId}`);
      
      await this.logStep(investigationId, 'spiderfoot', 'Démarrage du scan exhaustif avec SpiderFoot');
      
      const result = await this.spiderfootService.startScan(investigationId);
      
      await this.updateInvestigationStatus(investigationId, InvestigationStatus.CONSOLIDATING, 90, 'spiderfoot_completed');
      
      await this.logStep(investigationId, 'spiderfoot', `Scan terminé: ${result.scanResults} résultats collectés`);
      
      return result;

    } catch (error) {
      logger.error(`❌ Erreur SpiderFoot pour ${investigationId}:`, error);
      await this.logStep(investigationId, 'spiderfoot', `Erreur: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Étape 6: Consolidation des résultats
   */
  async runConsolidationStep(investigationId) {
    try {
      logger.info(`🔗 Étape Consolidation pour l'investigation ${investigationId}`);
      
      await this.logStep(investigationId, 'consolidation', 'Démarrage de la consolidation des résultats');
      
      // Récupération de tous les résultats
      const allResults = await this.prisma.result.findMany({
        where: { investigationId },
        include: { indicator: true }
      });

      // Déduplication et scoring
      const consolidatedResults = await this.consolidateResults(allResults);
      
      // Génération du rapport final
      const finalReport = await this.generateFinalReport(investigationId, consolidatedResults);
      
      await this.updateInvestigationStatus(investigationId, InvestigationStatus.CONSOLIDATING, 100, 'consolidation_completed');
      
      await this.logStep(investigationId, 'consolidation', 'Consolidation terminée avec succès');
      
      return { consolidatedResults, finalReport };

    } catch (error) {
      logger.error(`❌ Erreur Consolidation pour ${investigationId}:`, error);
      await this.logStep(investigationId, 'consolidation', `Erreur: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Finalise l'investigation
   */
  async finalizeInvestigation(investigationId) {
    try {
      logger.info(`✅ Finalisation de l'investigation ${investigationId}`);
      
      // Mise à jour du statut final
      await this.prisma.investigation.update({
        where: { id: investigationId },
        data: {
          status: InvestigationStatus.COMPLETED,
          progress: 100,
          currentStep: 'completed'
        }
      });

      // Suppression de la liste des investigations actives
      this.activeInvestigations.delete(investigationId);

      // Notification temps réel
      this.io.to(investigationId).emit('investigation:completed', {
        id: investigationId,
        status: 'COMPLETED',
        progress: 100
      });

      await this.logStep(investigationId, 'finalization', 'Investigation terminée avec succès');

    } catch (error) {
      logger.error(`❌ Erreur lors de la finalisation de ${investigationId}:`, error);
      throw error;
    }
  }

  /**
   * Gère les erreurs d'investigation
   */
  async handleInvestigationError(investigationId, error) {
    try {
      logger.error(`❌ Gestion d'erreur pour l'investigation ${investigationId}:`, error);

      // Mise à jour du statut d'erreur
      await this.prisma.investigation.update({
        where: { id: investigationId },
        data: {
          status: InvestigationStatus.FAILED,
          currentStep: 'error'
        }
      });

      // Log de l'erreur
      await this.logStep(investigationId, 'error', `Erreur: ${error.message}`, 'ERROR');

      // Suppression de la liste des investigations actives
      this.activeInvestigations.delete(investigationId);

      // Notification temps réel
      this.io.to(investigationId).emit('investigation:failed', {
        id: investigationId,
        status: 'FAILED',
        error: error.message
      });

    } catch (finalizationError) {
      logger.error(`❌ Erreur lors de la gestion d'erreur pour ${investigationId}:`, finalizationError);
    }
  }

  /**
   * Met à jour le statut d'une investigation
   */
  async updateInvestigationStatus(investigationId, status, progress, currentStep) {
    try {
      await this.prisma.investigation.update({
        where: { id: investigationId },
        data: {
          status,
          progress,
          currentStep
        }
      });

      // Notification temps réel
      this.io.to(investigationId).emit('investigation:status_update', {
        id: investigationId,
        status,
        progress,
        currentStep
      });

    } catch (error) {
      logger.error(`❌ Erreur lors de la mise à jour du statut pour ${investigationId}:`, error);
      throw error;
    }
  }

  /**
   * Enregistre un log d'étape
   */
  async logStep(investigationId, step, message, level = 'INFO') {
    try {
      await this.prisma.investigationLog.create({
        data: {
          investigationId,
          step,
          message,
          level
        }
      });

      // Notification temps réel
      this.io.to(investigationId).emit('investigation:log', {
        step,
        message,
        level,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error(`❌ Erreur lors de l'enregistrement du log pour ${investigationId}:`, error);
    }
  }

  /**
   * Consolide les résultats de tous les outils
   */
  async consolidateResults(results) {
    // Logique de consolidation et déduplication
    const consolidated = {
      emails: new Set(),
      profiles: new Set(),
      phones: new Set(),
      domains: new Set(),
      ips: new Set(),
      urls: new Set()
    };

    results.forEach(result => {
      const data = result.data;
      
      // Extraction et déduplication selon le type d'outil
      if (result.toolSource === 'buster' && data.emails) {
        data.emails.forEach(email => consolidated.emails.add(email));
      }
      
      if (result.toolSource === 'mosint' && data.breaches) {
        // Traitement des fuites de données
      }
      
      if (result.toolSource === 'maigret' && data.profiles) {
        data.profiles.forEach(profile => consolidated.profiles.add(profile));
      }
      
      // ... autres consolidations
    });

    return {
      emails: Array.from(consolidated.emails),
      profiles: Array.from(consolidated.profiles),
      phones: Array.from(consolidated.phones),
      domains: Array.from(consolidated.domains),
      ips: Array.from(consolidated.ips),
      urls: Array.from(consolidated.urls)
    };
  }

  /**
   * Génère le rapport final
   */
  async generateFinalReport(investigationId, consolidatedResults) {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
      include: {
        indicators: true,
        results: true
      }
    });

    const finalReport = {
      investigationId,
      summary: {
        totalIndicators: investigation.indicators.length,
        totalResults: investigation.results.length,
        toolsUsed: [...new Set(investigation.results.map(r => r.toolSource))],
        completionTime: new Date()
      },
      consolidatedResults,
      recommendations: this.generateRecommendations(consolidatedResults)
    };

    // Sauvegarde du rapport final
    await this.prisma.investigation.update({
      where: { id: investigationId },
      data: { finalReport }
    });

    return finalReport;
  }

  /**
   * Génère des recommandations basées sur les résultats
   */
  generateRecommendations(results) {
    const recommendations = [];

    if (results.emails.length > 0) {
      recommendations.push({
        type: 'email_security',
        priority: 'high',
        message: `${results.emails.length} adresses email trouvées. Vérifiez la sécurité de ces comptes.`
      });
    }

    if (results.profiles.length > 0) {
      recommendations.push({
        type: 'social_media',
        priority: 'medium',
        message: `${results.profiles.length} profils sociaux identifiés. Analysez l'empreinte numérique.`
      });
    }

    return recommendations;
  }

  /**
   * Récupère le statut d'une investigation
   */
  async getInvestigationStatus(investigationId) {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
      include: {
        indicators: true,
        results: {
          include: { indicator: true }
        },
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 10
        }
      }
    });

    return investigation;
  }

  /**
   * Arrête une investigation en cours
   */
  async stopInvestigation(investigationId) {
    try {
      logger.info(`🛑 Arrêt de l'investigation ${investigationId}`);

      // Mise à jour du statut
      await this.prisma.investigation.update({
        where: { id: investigationId },
        data: {
          status: InvestigationStatus.FAILED,
          currentStep: 'stopped'
        }
      });

      // Suppression de la liste des investigations actives
      this.activeInvestigations.delete(investigationId);

      // Notification temps réel
      this.io.to(investigationId).emit('investigation:stopped', {
        id: investigationId,
        status: 'STOPPED'
      });

      await this.logStep(investigationId, 'stopped', 'Investigation arrêtée par l\'utilisateur');

    } catch (error) {
      logger.error(`❌ Erreur lors de l'arrêt de l'investigation ${investigationId}:`, error);
      throw error;
    }
  }
}

// Fonction d'initialisation de l'orchestrateur
async function setupOrchestrator(prisma, io) {
  const orchestrator = new OrchestratorService(prisma, io);
  
  // Configuration des événements Socket.IO
  io.on('connection', (socket) => {
    logger.info(`🔌 Nouvelle connexion Socket.IO: ${socket.id}`);

    // Rejoindre une room d'investigation
    socket.on('join_investigation', (investigationId) => {
      socket.join(investigationId);
      logger.info(`👥 Socket ${socket.id} a rejoint l'investigation ${investigationId}`);
    });

    // Quitter une room d'investigation
    socket.on('leave_investigation', (investigationId) => {
      socket.leave(investigationId);
      logger.info(`👋 Socket ${socket.id} a quitté l'investigation ${investigationId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Déconnexion Socket.IO: ${socket.id}`);
    });
  });

  return orchestrator;
}

module.exports = { setupOrchestrator, OrchestratorService };