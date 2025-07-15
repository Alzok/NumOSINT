const { InvestigationStatus, IndicatorType } = require('@prisma/client');
const logger = require('../../utils/logger');
const workflowConfig = require('../../config/workflow.json');

class EnrichmentPhaseManager {
  constructor(prisma, io, toolServices, orchestrator) {
    this.prisma = prisma;
    this.io = io;
    this.toolServices = toolServices;
    this.orchestrator = orchestrator; // Pour accéder aux méthodes partagées comme logStep, isCancelled, etc.
    this.workflowConfig = workflowConfig;
  }

  /**
   * Exécute la phase d'enrichissement pour une investigation donnée.
   */
  async run(investigationId) {
    await this.orchestrator.updateInvestigationStatus(investigationId, InvestigationStatus.ENRICHING, 5, 'enrichment_started');

    const strategy = await this._determineWorkflowStrategy(investigationId);
    const activeInvestigation = this.orchestrator.activeInvestigations.get(investigationId) || {};
    this.orchestrator.activeInvestigations.set(investigationId, { ...activeInvestigation, strategy });
    await this.orchestrator.logStep(investigationId, 'strategy_determined', `Stratégie de workflow déterminée: Primaire=${strategy.primary}, Secondaires=${strategy.secondary.join(',') || 'aucune'}`);

    while (true) {
      if (this.orchestrator.isCancelled(investigationId)) {
        logger.info(`[Enrichment] Annulation détectée pour l'investigation ${investigationId}. Arrêt de la phase.`);
        await this.orchestrator.cancelInvestigation(investigationId);
        return;
      }

      const indicator = await this.findNextSpecializedIndicator(investigationId);

      if (indicator) {
        await this.prisma.indicator.update({
          where: { id: indicator.id },
          data: { processed: true },
        });

        await this.dispatchForEnrichment(indicator, strategy);
        await this.orchestrator.updateProgress(investigationId, 5, 70);
      } else {
        logger.info(`Phase d'enrichissement terminée pour ${investigationId}. Passage au scanning.`);
        await this.orchestrator.updateInvestigationPhase(investigationId, 'SCANNING');
        this.orchestrator.runInvestigationFlow(investigationId);
        break;
      }
    }
  }

  /**
   * Trouve le prochain indicateur pour la phase d'enrichissement.
   */
  async findNextSpecializedIndicator(investigationId) {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
      select: { maxGeneration: true, minConfidence: true }
    });

    if (!investigation) return null;

    const minConfidence = investigation.minConfidence || 0;

    return this.prisma.indicator.findFirst({
      where: {
        investigationId: investigationId,
        processed: false,
        type: { in: [IndicatorType.NAME, IndicatorType.EMAIL, IndicatorType.USERNAME, IndicatorType.PHONE, IndicatorType.DOMAIN, IndicatorType.IP] },
        generation: { lte: investigation.maxGeneration },
        confidence: { gte: minConfidence }
      },
      orderBy: [
        { confidence: 'desc' },
        { generation: 'asc' },
        { createdAt: 'asc' }
      ]
    });
  }

  /**
   * Dispatch un indicateur vers les outils d'enrichissement en se basant sur le workflow configuré.
   */
  async dispatchForEnrichment(indicator, strategy) {
    const { investigationId, type } = indicator;
    const workflow = this.workflowConfig.strategies[type] || this.workflowConfig.strategies.DEFAULT;
    const toolsToRun = workflow.phases.enrichment || [];

    if (toolsToRun.length === 0) {
      await this.orchestrator.logStep(investigationId, 'enrichment_dispatch_skipped', `Aucun outil d'enrichissement configuré pour le type ${type}.`);
      return;
    }

    await this.orchestrator.logStep(investigationId, 'enrichment_dispatch_start', `Dispatch pour ${type} '${indicator.value}' avec ${toolsToRun.length} outil(s) configuré(s).`);

    for (const toolConfig of toolsToRun) {
      const { tool: toolName, condition } = toolConfig;
      const toolService = this.toolServices[toolName];

      if (!toolService) {
        logger.warn(`Service d'outil '${toolName}' non trouvé. Vérifiez la configuration du workflow.`);
        continue;
      }

      // Vérification de la condition (simpliste pour l'instant)
      let shouldRun = true;
      if (condition) {
        if (condition === 'indicator.unverified' && indicator.verified) {
          shouldRun = false;
        }
        if (condition === 'strategy.primary' && strategy.primary !== type) {
          shouldRun = false;
        }
      }

      if (shouldRun) {
        // La méthode à appeler est déduite par convention (ex: 'analyzeEmail' pour 'mosintService')
        // C'est une simplification. Une meilleure approche serait de le spécifier dans le JSON.
        const methodName = this._getToolMethodForIndicator(toolName, type);
        if (toolService[methodName]) {
          await this.orchestrator._runToolWithRetry(toolService[methodName].bind(toolService), investigationId, indicator);
        } else {
          logger.warn(`Méthode '${methodName}' non trouvée sur le service '${toolName}'.`);
        }
      }
    }
  }

  _getToolMethodForIndicator(toolName, indicatorType) {
    // Convention de nommage pour trouver la méthode à appeler sur le service
    switch (toolName) {
      case 'mosintService': return 'analyzeEmail';
      case 'maigretService': return 'searchProfiles';
      case 'phoneinfogaService': return 'analyzePhone';
      case 'busterService': return 'generateEmails';
      case 'pdlService':
        if (indicatorType === 'EMAIL') return 'enrichEmail';
        if (indicatorType === 'PHONE') return 'enrichPhone';
        return null;
      case 'wauService': return 'validateEmail';
      case 'waybulkService': return 'lookupDomain';
      case 'asnService': return 'lookupIp';
      default: return null;
    }
  }

  /**
   * Détermine la stratégie de workflow basée sur les indicateurs initiaux.
   */
  async _determineWorkflowStrategy(investigationId) {
    const initialIndicators = await this.prisma.indicator.findMany({
      where: {
        investigationId,
        generation: 0,
      },
    });

    const initialTypes = new Set(initialIndicators.map(i => i.type));
    const priorityOrder = [IndicatorType.EMAIL, IndicatorType.PHONE, IndicatorType.DOMAIN, IndicatorType.USERNAME, IndicatorType.NAME];
    
    let primary = 'Default';
    for (const type of priorityOrder) {
      if (initialTypes.has(type)) {
        primary = type;
        break;
      }
    }

    const secondary = Array.from(initialTypes).filter(type => type !== primary);

    return { primary, secondary };
  }
}

module.exports = EnrichmentPhaseManager;