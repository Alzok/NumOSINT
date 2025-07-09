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

      this.activeInvestigations.set(investigation.id, {
        investigation,
        status: 'running',
        startTime: new Date()
      });

      this.io.to(investigation.id).emit('investigation:started', {
        id: investigation.id,
        status: investigation.status,
        progress: investigation.progress
      });

      // Démarrage de la boucle d'enrichissement en arrière-plan
      this.runEnrichmentLoop(investigation.id).catch(err => {
        logger.error(`Erreur non capturée dans la boucle d'enrichissement pour ${investigation.id}:`, err);
        this.handleInvestigationError(investigation.id, err);
      });

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
    const processInput = (items, type) => {
        if (items && Array.isArray(items)) {
            items.forEach(value => {
                if (value && value.trim()) {
                    indicators.push({
                        type,
                        value: value.trim(),
                        source: 'input',
                        confidence: 1.0,
                        verified: true,
                        processed: false,
                    });
                }
            });
        }
    };

    processInput(inputData.names, IndicatorType.NAME);
    processInput(inputData.emails, IndicatorType.EMAIL);
    processInput(inputData.usernames, IndicatorType.USERNAME);
    processInput(inputData.phones, IndicatorType.PHONE);
    processInput(inputData.domains, IndicatorType.DOMAIN);

    return indicators;
  }

  /**
   * Exécute la boucle d'enrichissement récursive.
   */
  async runEnrichmentLoop(investigationId) {
    try {
      logger.info(`🔄 Démarrage de la boucle d'enrichissement pour l'investigation ${investigationId}`);
      await this.updateInvestigationStatus(investigationId, InvestigationStatus.ENRICHING, 5, 'enrichment_started');

      let unprocessedIndicator = await this.findNextIndicator(investigationId);

      while (unprocessedIndicator) {
        await this.prisma.indicator.update({
          where: { id: unprocessedIndicator.id },
          data: { processed: true },
        });

        await this.dispatchIndicatorToTool(unprocessedIndicator);
        
        await this.updateProgress(investigationId);

        unprocessedIndicator = await this.findNextIndicator(investigationId);
      }

      logger.info(`✅ Boucle d'enrichissement terminée pour l'investigation ${investigationId}`);
      await this.runConsolidationStep(investigationId);
      await this.finalizeInvestigation(investigationId);

    } catch (error) {
      logger.error(`❌ Erreur dans la boucle d'enrichissement pour ${investigationId}:`, error);
      await this.handleInvestigationError(investigationId, error);
    }
  }

  /**
   * Trouve le prochain indicateur non traité.
   */
  async findNextIndicator(investigationId) {
    return this.prisma.indicator.findFirst({
      where: {
        investigationId: investigationId,
        processed: false,
      },
    });
  }

  /**
   * Met à jour la progression de l'investigation.
   */
  async updateProgress(investigationId) {
    const totalCount = await this.prisma.indicator.count({ where: { investigationId } });
    const processedCount = await this.prisma.indicator.count({ where: { investigationId, processed: true } });
    // La progression va de 5% à 95% pendant l'enrichissement.
    const progress = totalCount > 0 ? 5 + Math.round((processedCount / totalCount) * 90) : 5;
    
    await this.updateInvestigationStatus(investigationId, InvestigationStatus.ENRICHING, progress, `processing_indicator_${processedCount}_of_${totalCount}`);
  }

  /**
   * Appelle le bon outil en fonction du type d'indicateur.
   */
  async dispatchIndicatorToTool(indicator) {
    const { investigationId } = indicator;
    logger.info(`Dispatching indicator ${indicator.value} of type ${indicator.type}`);
    await this.logStep(investigationId, 'dispatcher', `Traitement de l'indicateur ${indicator.type}: ${indicator.value}`);

    try {
      switch (indicator.type) {
        case IndicatorType.NAME:
          await this.busterService.generateEmails(investigationId, indicator);
          break;
        case IndicatorType.EMAIL:
          await this.mosintService.analyzeEmail(investigationId, indicator);
          break;
        case IndicatorType.USERNAME:
          await this.maigretService.searchProfiles(investigationId, indicator);
          break;
        case IndicatorType.PHONE:
          await this.phoneinfogaService.analyzePhone(investigationId, indicator);
          break;
        case IndicatorType.DOMAIN:
        case IndicatorType.IP:
        case IndicatorType.URL:
          await this.spiderfootService.startScan(investigationId, indicator);
          break;
        default:
          logger.warn(`Aucun outil configuré pour le type d'indicateur: ${indicator.type}`);
          await this.logStep(investigationId, 'dispatcher', `Aucun outil pour le type ${indicator.type}`, 'WARN');
      }
    } catch (error) {
        logger.error(`❌ Erreur de l'outil pour l'indicateur ${indicator.id}:`, error);
        await this.logStep(investigationId, 'tool_error', `Erreur pour ${indicator.type} ${indicator.value}: ${error.message}`, 'ERROR');
    }
  }

  /**
   * Étape de Consolidation des résultats
   */
  async runConsolidationStep(investigationId) {
    try {
      logger.info(`🔗 Étape Consolidation pour l'investigation ${investigationId}`);
      await this.updateInvestigationStatus(investigationId, InvestigationStatus.CONSOLIDATING, 95, 'consolidation_started');
      await this.logStep(investigationId, 'consolidation', 'Démarrage de la consolidation des résultats');
      
      const allResults = await this.prisma.result.findMany({
        where: { investigationId },
        include: { indicator: true }
      });

      const consolidatedResults = this.consolidateResults(allResults);
      await this.generateFinalReport(investigationId, consolidatedResults);
      
      await this.logStep(investigationId, 'consolidation', 'Consolidation terminée avec succès');
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
      
      await this.prisma.investigation.update({
        where: { id: investigationId },
        data: {
          status: InvestigationStatus.COMPLETED,
          progress: 100,
          currentStep: 'completed'
        }
      });

      this.activeInvestigations.delete(investigationId);

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

      await this.prisma.investigation.update({
        where: { id: investigationId },
        data: {
          status: InvestigationStatus.FAILED,
          currentStep: 'error'
        }
      });

      await this.logStep(investigationId, 'error', `Erreur: ${error.message}`, 'ERROR');

      this.activeInvestigations.delete(investigationId);

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

      this.io.to(investigationId).emit('investigation:status_update', {
        id: investigationId,
        status,
        progress,
        currentStep
      });

    } catch (error) {
      logger.error(`❌ Erreur lors de la mise à jour du statut pour ${investigationId}:`, error);
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
  consolidateResults(results) {
    const consolidated = {};

    results.forEach(result => {
        const tool = result.toolSource;
        if (!consolidated[tool]) {
            consolidated[tool] = [];
        }
        consolidated[tool].push(result.data);
    });

    return consolidated;
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
    };

    await this.prisma.investigation.update({
      where: { id: investigationId },
      data: { finalReport }
    });

    return finalReport;
  }
}

function setupOrchestrator(prisma, io) {
  const orchestrator = new OrchestratorService(prisma, io);
  
  io.on('connection', (socket) => {
    logger.info(`🔌 Nouvelle connexion Socket.IO: ${socket.id}`);

    socket.on('join_investigation', (investigationId) => {
      socket.join(investigationId);
      logger.info(`👥 Socket ${socket.id} a rejoint l'investigation ${investigationId}`);
    });

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