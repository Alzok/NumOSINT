const { OrchestratorService } = require('../../src/services/orchestrator');
const EnrichmentPhaseManager = require('../../src/services/phases/EnrichmentPhaseManager');

// Mock les dépendances
jest.mock('../../src/services/phases/EnrichmentPhaseManager');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

describe('OrchestratorService', () => {
  let service;
  let mockPrisma;
  let mockIo;

  beforeEach(() => {
    mockPrisma = {
      investigation: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      investigationLog: {
        create: jest.fn(),
      },
    };
    mockIo = {
      emit: jest.fn(),
    };
    service = new OrchestratorService(mockPrisma, mockIo);
    // On s'assure que le mock est bien utilisé par l'instance
    service.enrichmentManager = new EnrichmentPhaseManager();
    jest.clearAllMocks();
  });

  describe('runInvestigationFlow', () => {
    it('should call EnrichmentPhaseManager when investigation phase is ENRICHMENT', async () => {
      const investigationId = 'test-investigation';
      const mockInvestigation = {
        id: investigationId,
        status: 'ENRICHING',
        currentPhase: 'ENRICHMENT',
      };

      mockPrisma.investigation.findUnique.mockResolvedValue(mockInvestigation);
      // Mock la méthode run du manager
      service.enrichmentManager.run = jest.fn().mockResolvedValue();

      await service.runInvestigationFlow(investigationId, 'user-id');

      expect(mockPrisma.investigation.findUnique).toHaveBeenCalledWith({ where: { id: investigationId } });
      expect(service.enrichmentManager.run).toHaveBeenCalledWith(investigationId);
    });

    it('should call a placeholder for SCANNING phase', async () => {
        const investigationId = 'test-investigation-scan';
        const mockInvestigation = {
          id: investigationId,
          status: 'SCANNING',
          currentPhase: 'SCANNING',
        };
  
        mockPrisma.investigation.findUnique.mockResolvedValue(mockInvestigation);
        // On mock la méthode de la phase de scan pour ne pas la tester ici
        service.runPhaseScanning = jest.fn().mockResolvedValue();
  
        await service.runInvestigationFlow(investigationId, 'user-id');
  
        expect(service.runPhaseScanning).toHaveBeenCalledWith(investigationId);
    });

    it('should handle unknown phases gracefully', async () => {
        const investigationId = 'test-investigation-unknown';
        const mockInvestigation = {
          id: investigationId,
          status: 'RUNNING',
          currentPhase: 'UNKNOWN_PHASE',
        };
  
        mockPrisma.investigation.findUnique.mockResolvedValue(mockInvestigation);
        service.handleInvestigationError = jest.fn();
  
        await service.runInvestigationFlow(investigationId, 'user-id');
  
        expect(service.handleInvestigationError).toHaveBeenCalledWith(
            investigationId,
            expect.any(Error)
        );
    });
  });
});