const logger = require('../utils/logger');
const { InvestigationStatus, IndicatorType } = require('@prisma/client');
const eventBus = require('../utils/eventBus');

// Services des outils OSINT
const BusterService = require('./tools/buster');
const MosintService = require('./tools/mosint');
const MaigretService = require('./tools/maigret');
const PhoneInfogaService = require('./tools/phoneinfoga');
const SpiderFootService = require('./tools/spiderfoot');
const AsnService = require('./tools/asn');
const PdlService = require('./tools/pdl');
const WauService = require('./tools/wau');
const WaybulkService = require('./tools/waybulk');
const NotificationService = require('./notificationService');
const EnrichmentPhaseManager = require('./phases/EnrichmentPhaseManager');

class OrchestratorService {
  constructor(prisma, io) {
    this.prisma = prisma;
    this.io = io;
    this.notificationService = new NotificationService(prisma, io);
    this.activeInvestigations = new Map();
    
    // Initialisation des services
    const toolServices = {
      busterService: new BusterService(prisma),
      mosintService: new MosintService(prisma),
      maigretService: new MaigretService(prisma),
      phoneinfogaService: new PhoneInfogaService(prisma),
      spiderfootService: new SpiderFootService(prisma),
      asnService: new AsnService(prisma),
      pdlService: new PdlService(prisma),
      wauService: new WauService(prisma),
      waybulkService: new WaybulkService(prisma),
    };

    this.spiderfootService = toolServices.spiderfootService;

    // Initialisation des managers de phase
    this.enrichmentManager = new EnrichmentPhaseManager(prisma, io, toolServices, this);

    // Écoute des événements globaux de l'application
    eventBus.on('tool:scan_completed', this.handleToolCompletion.bind(this));
    eventBus.on('tool:pulse', this.handleToolPulse.bind(this));
  }

  /**
   * Démarre et pilote le flux d'une investigation en fonction de sa phase.
   * C'est le routeur principal de la machine à états.
   */
  async runInvestigationFlow(investigationId, userId) {
    try {
      // Stocker le userId pour une utilisation ultérieure dans le flux
      const activeInvestigation = this.activeInvestigations.get(investigationId) || {};
      this.activeInvestigations.set(investigationId, { ...activeInvestigation, userId });

      let investigation = await this.prisma.investigation.findUnique({ where: { id: investigationId } });
      if (!investigation) {
        logger.error(`Investigation ${investigationId} non trouvée pour le démarrage du flux.`);
        return;
      }

      // Vérification d'annulation ou d'échec
      if (this.isCancelled(investigationId)) {
        await this.cancelInvestigation(investigationId);
        return;
      }
      if (investigation.status === 'FAILED') {
        logger.warn(`Arrêt du flux pour l'investigation ${investigationId} car son statut est FAILED.`);
        this.activeInvestigations.delete(investigationId);
        return;
      }

      logger.info(`Investigation ${investigationId} - Phase actuelle: ${investigation.currentPhase}`);

      switch (investigation.currentPhase) {
        case 'ENRICHMENT':
          await this.enrichmentManager.run(investigationId);
          break;
        case 'SCANNING':
          await this.runPhaseScanning(investigationId);
          break;
        case 'CONSOLIDATION':
          await this.runPhaseConsolidation(investigationId);
          break;
        default:
          logger.error(`Phase inconnue "${investigation.currentPhase}" pour l'investigation ${investigationId}.`);
          await this.handleInvestigationError(investigationId, new Error(`Phase inconnue: ${investigation.currentPhase}`));
      }
    } catch (error) {
      logger.error(`Erreur dans le flux principal de l'investigation ${investigationId}:`, error);
      await this.handleInvestigationError(investigationId, error);
    }
  }
    
  /**
   * Gère les pulsations des outils longue durée pour montrer une progression.
   */
  async handleToolPulse(data) {
    const { investigationId, tool } = data;
    try {
      const investigation = await this.prisma.investigation.findUnique({
        where: { id: investigationId },
        select: { progress: true, currentPhase: true, status: true }
      });
    
      // On ne met à jour que si l'investigation est en cours et dans la bonne phase
      if (investigation && investigation.status === 'SCANNING' && investigation.currentPhase === 'SCANNING') {
        const newProgress = Math.min(investigation.progress + 1, 94); // Plafonne à 94%
        if (newProgress > investigation.progress) {
          await this.updateInvestigationStatus(investigationId, undefined, newProgress, `scanning_pulse_from_${tool}`);
        }
      }
    } catch (error) {
      logger.warn(`Impossible de traiter la pulsation pour l'investigation ${investigationId}:`, error);
    }
  }

  /**
   * PHASE 2: Scan exhaustif ("Couverture Totale")
   */
  async runPhaseScanning(investigationId) {
    await this.updateInvestigationStatus(investigationId, InvestigationStatus.SCANNING, 75, 'scanning_started');
    
    const indicatorsForScan = await this.prisma.indicator.findMany({
      where: {
        investigationId,
        type: { in: [IndicatorType.DOMAIN, IndicatorType.IP, IndicatorType.URL, IndicatorType.EMAIL] }
      }
    });

    if (indicatorsForScan.length > 0) {
      logger.info(`Lancement du scan SpiderFoot pour ${investigationId} avec ${indicatorsForScan.length} indicateurs.`);
      await this.logStep(investigationId, 'scanning', `Démarrage du scan exhaustif avec ${indicatorsForScan.length} indicateurs.`);
      
      // Le service SpiderFoot est maintenant asynchrone et notifiera via eventBus
      this.spiderfootService.startScan(investigationId, indicatorsForScan);
    } else {
      logger.warn(`Aucun indicateur pertinent pour le scan SpiderFoot dans l'investigation ${investigationId}.`);
      await this.logStep(investigationId, 'scanning', 'Aucun indicateur pour le scan exhaustif, passage direct à la consolidation.', 'WARNING');
      // S'il n'y a rien à scanner, on passe manuellement à la phase suivante pour ne pas bloquer le flux.
      await this.updateInvestigationPhase(investigationId, 'CONSOLIDATION');
      this.runInvestigationFlow(investigationId);
    }
    // On ne fait plus rien ici, on attend l'événement de complétion du scan.
  }

  /**
   * PHASE 3: Consolidation et Rapport
   */
  async runPhaseConsolidation(investigationId) {
    await this.updateInvestigationStatus(investigationId, InvestigationStatus.CONSOLIDATING, 95, 'consolidation_started');
    await this.logStep(investigationId, 'consolidation', 'Démarrage de la consolidation des résultats.');

    const allResults = await this.prisma.result.findMany({
      where: { investigationId },
      include: { indicator: true }
    });

    const consolidatedResults = this.consolidateResults(allResults);
    await this.generateFinalReport(investigationId, consolidatedResults);
    
    await this.logStep(investigationId, 'consolidation', 'Consolidation terminée.');
    await this.finalizeInvestigation(investigationId);
  }

  /**
   * Dispatch un indicateur vers les outils d'enrichissement spécialisés.
   */
  async handleToolCompletion(data) {
    const { investigationId, tool, success, error } = data;
    logger.info(`Événement de complétion reçu pour l'outil ${tool} sur l'investigation ${investigationId}. Succès: ${success}`);

    if (!success) {
      await this.logStep(investigationId, 'tool_completion_error', `L'outil ${tool} a échoué: ${error}`, 'ERROR');
      // Décider si l'échec d'un outil doit faire échouer toute l'investigation.
      // Pour l'instant, on continue le flux.
    }

    // Pour l'instant, seul SpiderFoot est géré. On pourrait ajouter une logique plus complexe ici.
    if (tool === 'spiderfoot') {
      await this.updateInvestigationPhase(investigationId, 'CONSOLIDATION');
      this.runInvestigationFlow(investigationId);
    }
  }

  /**
   * Déclenche un enrichissement avancé avec People Data Labs.
   */
  async runPdlEnrichment(investigationId, indicatorId) {
    const indicator = await this.prisma.indicator.findUnique({ where: { id: indicatorId } });
    if (!indicator) {
      logger.error(`[PDL] Indicateur ${indicatorId} non trouvé pour l'enrichissement.`);
      return;
    }

    logger.info(`[PDL] Démarrage de l'enrichissement avancé pour ${indicator.value}`);
    await this.logStep(investigationId, 'pdl_enrichment_start', `Lancement de l'enrichissement PDL pour: ${indicator.value}.`);

    try {
      if (indicator.type === IndicatorType.EMAIL) {
        await this.pdlService.enrichEmail(investigationId, indicator);
      } else {
        logger.warn(`[PDL] Type d'indicateur non supporté pour l'enrichissement PDL: ${indicator.type}`);
      }
      await this.logStep(investigationId, 'pdl_enrichment_success', `Enrichissement PDL pour ${indicator.value} terminé.`);
    } catch (error) {
      logger.error(`[PDL] Échec de l'enrichissement pour ${indicator.value}:`, error);
      await this.logStep(investigationId, 'pdl_enrichment_error', `Échec de l'enrichissement PDL pour ${indicator.value}: ${error.message}`, 'ERROR');
    }
  }

  /**
   * Met à jour la phase de l'investigation.
   */
  async updateInvestigationPhase(investigationId, newPhase) {
    await this.logStep(investigationId, 'phase_update', `Passage à la phase: ${newPhase}`);
    // On ne met pas à jour la DB ici, on délègue à updateInvestigationStatus
    // pour centraliser la mise à jour et l'émission de l'événement.
    const investigation = await this.prisma.investigation.findUnique({ where: { id: investigationId } });
    await this.updateInvestigationStatus(investigationId, investigation.status, investigation.progress, `phase_change:${newPhase}`, newPhase);
  }

    /**
     * Déclenche une recherche récursive Maigret pour un username spécifique.
     * C'est une action qui sera typiquement initiée par l'utilisateur depuis l'UI.
     */
    async runRecursiveMaigretSearch(investigationId, username) {
      logger.info(`[Recursive Search] Démarrage de la recherche récursive Maigret pour ${username} dans l'investigation ${investigationId}.`);
      await this.logStep(investigationId, 'recursive_search_start', `Lancement d'une recherche récursive pour le pseudo: ${username}.`);
  
      try {
        // On crée un "pseudo-indicateur" pour passer au service, ou on cherche l'existant.
        let indicator = await this.prisma.indicator.findFirst({
          where: { investigationId, value: username, type: IndicatorType.USERNAME }
        });
  
        if (!indicator) {
          indicator = { value: username, generation: 0 }; // Mock indicator
          logger.warn(`[Recursive Search] Aucun indicateur existant pour ${username}. Lancement avec un indicateur mock.`);
        }
  
        // On appelle directement le service avec l'option récursive activée.
        await this.maigretService.searchProfiles(investigationId, indicator, 'all', true);
  
        await this.logStep(investigationId, 'recursive_search_success', `Recherche récursive pour ${username} terminée.`);
        
        // On pourrait vouloir relancer une phase d'enrichissement si de nouveaux indicateurs ont été trouvés.
        // Pour l'instant, on se contente de logger.
        this.io.emit('investigation:update', {
          id: investigationId,
          status: 'ENRICHING', // Pour rafraîchir l'UI
          currentStep: `Recherche récursive sur ${username} terminée.`,
        });
  
      } catch (error) {
        logger.error(`[Recursive Search] Échec de la recherche récursive pour ${username} dans l'investigation ${investigationId}:`, error);
        await this.logStep(investigationId, 'recursive_search_error', `Échec de la recherche récursive pour ${username}: ${error.message}`, 'ERROR');
        this.io.emit('investigation:update', {
          id: investigationId,
          status: 'FAILED',
          error: `La recherche récursive a échoué: ${error.message}`,
        });
      }
    }
  
    /**
     * Déclenche une recherche Maigret par tags.
     */
    async runMaigretTagSearch(investigationId, username, tags) {
      logger.info(`[Tag Search] Démarrage de la recherche Maigret pour ${username} avec les tags '${tags}' dans l'investigation ${investigationId}.`);
      await this.logStep(investigationId, 'tag_search_start', `Lancement d'une recherche par tags pour le pseudo: ${username} (tags: ${tags}).`);
  
      try {
        let indicator = await this.prisma.indicator.findFirst({
          where: { investigationId, value: username, type: IndicatorType.USERNAME }
        });
  
        if (!indicator) {
          indicator = { value: username, generation: 0 }; // Mock indicator
        }
  
        // On appelle le service avec les tags et sans récursion.
        await this.maigretService.searchProfiles(investigationId, indicator, tags, false);
  
        await this.logStep(investigationId, 'tag_search_success', `Recherche par tags pour ${username} terminée.`);
        
        this.io.emit('investigation:update', {
          id: investigationId,
          status: 'ENRICHING',
          currentStep: `Recherche par tags sur ${username} terminée.`,
        });
  
      } catch (error) {
        logger.error(`[Tag Search] Échec de la recherche par tags pour ${username} dans l'investigation ${investigationId}:`, error);
        await this.logStep(investigationId, 'tag_search_error', `Échec de la recherche par tags pour ${username}: ${error.message}`, 'ERROR');
        this.io.emit('investigation:update', {
          id: investigationId,
          status: 'FAILED',
          error: `La recherche par tags a échoué: ${error.message}`,
        });
      }
    }
  
  // ... [Les autres méthodes comme stopInvestigation, _runToolWithRetry, logStep, etc. restent ici]
  // ... [Il faudra adapter updateProgress pour qu'il prenne en compte les bornes de progression par phase]

  async updateProgress(investigationId, phaseStart, phaseEnd) {
    const totalCount = await this.prisma.indicator.count({ where: { investigationId } });
    const processedCount = await this.prisma.indicator.count({ where: { investigationId, processed: true } });
    
    const phaseProgress = totalCount > 0 ? (processedCount / totalCount) : 1;
    const overallProgress = phaseStart + Math.round(phaseProgress * (phaseEnd - phaseStart));
    
    await this.updateInvestigationStatus(investigationId, undefined, overallProgress, `processing_indicator_${processedCount}_of_${totalCount}`);
  }

  isCancelled(investigationId) {
    const activeInvestigation = this.activeInvestigations.get(investigationId);
    return activeInvestigation?.status === 'cancelled';
  }

  async cancelInvestigation(investigationId) {
    logger.info(`🛑 Annulation de l'investigation ${investigationId} confirmée.`);
    await this.updateInvestigationStatus(investigationId, InvestigationStatus.CANCELLED, undefined, 'cancelled');
    this.activeInvestigations.delete(investigationId);
  }
  
  async stopInvestigation(investigationId) {
    logger.info(`🛑 Tentative d'arrêt de l'investigation ${investigationId}`);
    const activeInvestigation = this.activeInvestigations.get(investigationId);

    if (activeInvestigation) {
      activeInvestigation.status = 'cancelled';
      await this.logStep(investigationId, 'cancellation', 'Demande d\'annulation reçue.');
      return { message: 'Annulation de l\'investigation demandée.' };
    } else {
      logger.warn(`Tentative d'arrêt d'une investigation non active: ${investigationId}`);
      const investigation = await this.prisma.investigation.findUnique({ where: { id: investigationId } });
      if (investigation && investigation.status !== 'COMPLETED' && investigation.status !== 'FAILED' && investigation.status !== 'CANCELLED') {
        await this.updateInvestigationStatus(investigationId, InvestigationStatus.CANCELLED, undefined, 'cancelled_by_user');
        return { message: 'Investigation annulée.' };
      }
      return { message: 'L\'investigation n\'est pas active ou est déjà terminée.' };
    }
  }

  getToolForIndicator(indicatorType) {
    switch (indicatorType) {
      case IndicatorType.EMAIL: return 'Mosint';
      case IndicatorType.USERNAME: return 'Maigret';
      case IndicatorType.PHONE: return 'PhoneInfoga';
      case IndicatorType.NAME: return 'Buster/Maigret';
      default: return 'Inconnu';
    }
  }

  async _runToolWithRetry(toolFunction, investigationId, indicator, ...args) {
    const maxRetries = 3;
    let attempt = 1;
    let delay = 1000;
    const toolName = this.getToolForIndicator(indicator.type);

    while (attempt <= maxRetries) {
      try {
        await this.logStep(investigationId, 'tool_attempt', `[${toolName}] Tentative ${attempt}/${maxRetries} pour ${indicator.value}`);
        await toolFunction(investigationId, indicator, ...args);
        await this.logStep(investigationId, 'tool_success', `[${toolName}] Succès pour ${indicator.value}`);
        return;
      } catch (error) {
        logger.warn(`[Tentative ${attempt}/${maxRetries}] Échec pour l'indicateur ${indicator.id}`, { error: error.message });
        await this.logStep(investigationId, 'tool_warning', `[Tentative ${attempt}/${maxRetries}] Échec pour ${indicator.type} ${indicator.value}: ${error.message}`, 'WARNING');
        
        if (attempt === maxRetries) {
          logger.error(`❌ Échec final de l'outil après ${maxRetries} tentatives pour l'indicateur ${indicator.id}:`, error);
          await this.logStep(investigationId, 'tool_error', `Échec final de l'outil pour ${indicator.type} ${indicator.value} après ${maxRetries} tentatives. L'investigation continue.`, 'ERROR');
          // Ne pas propager l'erreur pour ne pas arrêter toute l'investigation
          // throw error;
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        attempt++;
      }
    }
  }

  async finalizeInvestigation(investigationId) {
    try {
      logger.info(`✅ Finalisation de l'investigation ${investigationId}`);
      await this.updateInvestigationStatus(investigationId, InvestigationStatus.COMPLETED, 100, 'completed');
      this.activeInvestigations.delete(investigationId);
      await this.logStep(investigationId, 'finalization', 'Investigation terminée avec succès');
      
      // Envoyer une notification
      const activeInvestigation = this.activeInvestigations.get(investigationId);
      if (activeInvestigation && activeInvestigation.userId) {
        await this.notificationService.createNotification(
          activeInvestigation.userId,
          `L'investigation #${investigationId.substring(0, 8)} est terminée.`,
          `/investigation/${investigationId}`
        );
      } else {
        logger.warn(`Impossible d'envoyer la notification de fin pour l'investigation ${investigationId}, userId non trouvé.`);
      }
    } catch (error) {
      logger.error(`❌ Erreur lors de la finalisation de ${investigationId}:`, error);
      throw error;
    }
  }

  async handleInvestigationError(investigationId, error) {
    try {
      logger.error(`❌ Gestion d'erreur pour l'investigation ${investigationId}:`, error);
      await this.updateInvestigationStatus(investigationId, InvestigationStatus.FAILED, undefined, 'error');
      await this.logStep(investigationId, 'error', `Erreur: ${error.message}`, 'ERROR');
      this.activeInvestigations.delete(investigationId);
      this.io.emit('investigation:update', {
        id: investigationId,
        status: 'FAILED',
        error: error.message,
      });
    } catch (finalizationError) {
      logger.error(`❌ Erreur lors de la gestion d'erreur pour ${investigationId}:`, finalizationError);
    }
  }

  async updateInvestigationStatus(investigationId, status, progress, currentStep, phase) {
    try {
      const data = {};
      if (currentStep) data.currentStep = currentStep;
      if (status) data.status = status;
      if (progress !== undefined) data.progress = progress;
      if (phase) data.currentPhase = phase;
      
      if (Object.keys(data).length === 0) return;

      const updatedInvestigation = await this.prisma.investigation.update({
        where: { id: investigationId },
        data,
      });

      // Émettre un seul événement avec toutes les informations à jour
      this.io.emit('investigation:update', {
        id: investigationId,
        status: updatedInvestigation.status,
        progress: updatedInvestigation.progress,
        currentPhase: updatedInvestigation.currentPhase,
        currentStep: updatedInvestigation.currentStep,
      });

    } catch (error) {
      logger.error(`❌ Erreur lors de la mise à jour du statut pour ${investigationId}:`, error);
    }
  }

  async logStep(investigationId, step, message, level = 'INFO') {
    try {
      const log = await this.prisma.investigationLog.create({
        data: { investigationId, step, message, level }
      });
      this.io.emit('investigation:log', { ...log, investigationId });
    } catch (error) {
      logger.error(`❌ Erreur lors de l'enregistrement du log pour ${investigationId}:`, error);
    }
  }
  
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

  async generateFinalReport(investigationId, consolidatedResults) {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
      include: { indicators: true, results: true }
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
  
  // L'enregistrement des listeners d'événements est maintenant dans le constructeur de l'OrchestratorService.
  // La logique ci-dessous reste pour la gestion des connexions Socket.IO spécifiques.

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