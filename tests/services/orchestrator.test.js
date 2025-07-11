const { OrchestratorService } = require('../../src/services/orchestrator');
const { PrismaClient } = require('@prisma/client');

// Mock Prisma et services
jest.mock('@prisma/client');
jest.mock('../../src/services/tools/buster');
jest.mock('../../src/services/tools/mosint');
jest.mock('../../src/services/tools/maigret');
jest.mock('../../src/services/tools/phoneinfoga');
jest.mock('../../src/services/tools/spiderfoot');
jest.mock('../../src/services/tools/wau');
jest.mock('../../src/services/tools/waybulk');

describe('OrchestratorService', () => {
  let service;
  let mockPrisma;
  let mockIo;

  beforeEach(() => {
    mockPrisma = {
      investigation: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      indicator: {
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      result: { // Ajout du mock manquant
        findMany: jest.fn(),
      },
      investigationLog: {
        create: jest.fn(),
      },
    };
    mockIo = {
      emit: jest.fn(),
    };
    service = new OrchestratorService(mockPrisma, mockIo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startInvestigation', () => {
    it('should create an investigation and start the enrichment loop', async () => {
      const inputData = { emails: ['test@example.com'] };
      const mockInvestigation = {
        id: 'test-investigation',
        status: 'INITIALIZING',
        progress: 0,
        indicators: [{ id: 'indicator-1', type: 'EMAIL', value: 'test@example.com', processed: false }],
      };

      mockPrisma.investigation.create.mockResolvedValue(mockInvestigation);
      // Mock la fin de la boucle pour ne pas la tester ici
      mockPrisma.indicator.findFirst.mockResolvedValue(null);
      // Mock pour l'étape de consolidation
      mockPrisma.result.findMany.mockResolvedValue([]);
      mockPrisma.investigation.findUnique.mockResolvedValue(mockInvestigation);


      const investigation = await service.startInvestigation(inputData);

      expect(mockPrisma.investigation.create).toHaveBeenCalled();
      expect(investigation.id).toBe('test-investigation');
      expect(service.activeInvestigations.has('test-investigation')).toBe(true);
      expect(mockIo.emit).toHaveBeenCalledWith('investigation:started', expect.any(Object));
    });
  });

  describe('runEnrichmentLoop', () => {
    it('should process indicators and finalize investigation', async () => {
      const investigationId = 'test-investigation';
      const indicator = { id: 'indicator-1', type: 'EMAIL', value: 'test@example.com', processed: false, investigationId };
      
      // Premier appel trouve un indicateur, le second non pour terminer la boucle
      mockPrisma.indicator.findFirst
        .mockResolvedValueOnce(indicator)
        .mockResolvedValue(null);
      
      mockPrisma.indicator.count.mockResolvedValue(1);
      mockPrisma.investigation.update.mockResolvedValue({});
      mockPrisma.investigationLog.create.mockResolvedValue({});
      mockPrisma.result.findMany.mockResolvedValue([]); // Mock pour la consolidation
      mockPrisma.investigation.findUnique.mockResolvedValue({ // Mock pour le rapport final
        id: investigationId,
        indicators: [],
        results: [],
      });


      // Mock du service outil
      service.mosintService.analyzeEmail = jest.fn().mockResolvedValue();

      await service.runEnrichmentLoop(investigationId);

      expect(mockPrisma.indicator.findFirst).toHaveBeenCalledTimes(2);
      expect(service.mosintService.analyzeEmail).toHaveBeenCalledWith(investigationId, indicator);
      // Vérification plus souple
      expect(mockPrisma.investigation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) })
      );
      expect(service.activeInvestigations.has(investigationId)).toBe(false);
    });

    it('should stop when investigation is cancelled', async () => {
      const investigationId = 'test-investigation-cancel';
      const indicator = { id: 'indicator-2', type: 'EMAIL', value: 'test@example.com', processed: false, investigationId };

      service.activeInvestigations.set(investigationId, { status: 'running' });
      mockPrisma.indicator.findFirst.mockResolvedValue(indicator);
      mockPrisma.investigation.update.mockResolvedValue({});
      mockPrisma.investigationLog.create.mockResolvedValue({});

      // Simule l'annulation pendant le traitement
      service.activeInvestigations.get(investigationId).status = 'cancelled';

      await service.runEnrichmentLoop(investigationId);

      expect(mockPrisma.investigation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'CANCELLED' }) })
      );
      expect(service.activeInvestigations.has(investigationId)).toBe(false);
    });

    it('should call wau service for unverified email and continue if valid', async () => {
      const investigationId = 'test-investigation-wau-valid';
      const indicator = { id: 'indicator-3', type: 'EMAIL', value: 'valid@example.com', verified: false, investigationId };
      
      mockPrisma.indicator.findFirst.mockResolvedValueOnce(indicator);
      mockPrisma.indicator.findUnique.mockResolvedValue({ ...indicator, verified: true }); // Simulate successful validation
      service.wauService.validateEmail = jest.fn().mockResolvedValue();
      service.mosintService.analyzeEmail = jest.fn().mockResolvedValue();

      await service._enrichEmail(investigationId, indicator);

      expect(service.wauService.validateEmail).toHaveBeenCalledWith(investigationId, indicator);
      expect(service.mosintService.analyzeEmail).toHaveBeenCalled();
    });

    it('should call wau service for unverified email and stop if invalid', async () => {
      const investigationId = 'test-investigation-wau-invalid';
      const indicator = { id: 'indicator-4', type: 'EMAIL', value: 'invalid@example.com', verified: false, investigationId };
      
      mockPrisma.indicator.findFirst.mockResolvedValueOnce(indicator);
      mockPrisma.indicator.findUnique.mockResolvedValue({ ...indicator, verified: false }); // Simulate failed validation
      service.wauService.validateEmail = jest.fn().mockResolvedValue();
      service.mosintService.analyzeEmail = jest.fn();

      await service._enrichEmail(investigationId, indicator);

      expect(service.wauService.validateEmail).toHaveBeenCalledWith(investigationId, indicator);
      expect(service.mosintService.analyzeEmail).not.toHaveBeenCalled();
    });

    it('should call waybulk service for domain indicator', async () => {
      const investigationId = 'test-investigation-waybulk';
      const indicator = { id: 'indicator-5', type: 'DOMAIN', value: 'example.com', investigationId };
      
      service.waybulkService.lookupDomain = jest.fn().mockResolvedValue();

      await service._enrichDomain(investigationId, indicator);

      expect(service.waybulkService.lookupDomain).toHaveBeenCalledWith(investigationId, indicator);
    });
  });

  describe('stopInvestigation', () => {
    it('should mark an active investigation as cancelled', async () => {
      const investigationId = 'test-investigation-stop';
      service.activeInvestigations.set(investigationId, { status: 'running' });
      mockPrisma.investigationLog.create.mockResolvedValue({});

      const result = await service.stopInvestigation(investigationId);

      expect(service.activeInvestigations.get(investigationId).status).toBe('cancelled');
      expect(result.message).toContain('Annulation de l\'investigation demandée');
    });

    it('should update db if investigation is not in active map', async () => {
        const investigationId = 'test-investigation-stop-db';
        mockPrisma.investigation.findUnique.mockResolvedValue({ id: investigationId, status: 'ENRICHING' });
        mockPrisma.investigation.update.mockResolvedValue({});

        const result = await service.stopInvestigation(investigationId);

        expect(mockPrisma.investigation.update).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ status: 'CANCELLED' }) })
        );
        expect(result.message).toContain('Investigation annulée');
    });
  });
});