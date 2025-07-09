const { OrchestratorService } = require('../../src/services/orchestrator');
const { PrismaClient } = require('@prisma/client');

// Mock Prisma et services
jest.mock('@prisma/client');
jest.mock('../../src/services/tools/buster');
jest.mock('../../src/services/tools/mosint');
jest.mock('../../src/services/tools/maigret');
jest.mock('../../src/services/tools/phoneinfoga');
jest.mock('../../src/services/tools/spiderfoot');

describe('OrchestratorService', () => {
  let service;
  let mockPrisma;
  let mockSocket;
  
  beforeEach(() => {
    mockPrisma = new PrismaClient();
    mockSocket = {
      emit: jest.fn()
    };
    service = new OrchestratorService(mockPrisma, mockSocket);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateInput', () => {
    it('should validate valid input data', () => {
      const inputData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        username: 'johndoe'
      };
      
      const result = service.validateInput(inputData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty input', () => {
      const inputData = {};
      
      const result = service.validateInput(inputData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Au moins un indicateur requis');
    });

    it('should validate email format', () => {
      const inputData = {
        email: 'invalid-email'
      };
      
      const result = service.validateInput(inputData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Format email invalide');
    });

    it('should validate phone format', () => {
      const inputData = {
        phone: '123'
      };
      
      const result = service.validateInput(inputData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Format téléphone invalide');
    });
  });

  describe('createInvestigation', () => {
    it('should create investigation with valid data', async () => {
      const inputData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com'
      };
      
      mockPrisma.investigation.create.mockResolvedValue({
        id: 'investigation-id',
        status: 'INITIALIZING',
        progress: 0
      });
      
      const result = await service.createInvestigation(inputData);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('investigation-id');
      expect(mockPrisma.investigation.create).toHaveBeenCalledWith({
        data: {
          status: 'INITIALIZING',
          progress: 0,
          currentStep: 'initialization',
          inputData: inputData
        }
      });
    });

    it('should handle database errors', async () => {
      const inputData = { email: 'test@example.com' };
      
      mockPrisma.investigation.create.mockRejectedValue(
        new Error('Database error')
      );
      
      await expect(service.createInvestigation(inputData))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('runInvestigation', () => {
    it('should run complete investigation flow', async () => {
      const investigationId = 'test-id';
      const inputData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com'
      };
      
      // Mock investigation updates
      mockPrisma.investigation.update.mockResolvedValue({
        id: investigationId,
        status: 'COMPLETED',
        progress: 100
      });
      
      // Mock indicator creation
      mockPrisma.indicator.create.mockResolvedValue({
        id: 'indicator-id'
      });
      
      // Mock services
      const mockBusterService = {
        run: jest.fn().mockResolvedValue({ generated: [], validated: [] })
      };
      
      const mockMosintService = {
        run: jest.fn().mockResolvedValue({ breaches: [], analysis: {} })
      };
      
      service.busterService = mockBusterService;
      service.mosintService = mockMosintService;
      
      const result = await service.runInvestigation(investigationId, inputData);
      
      expect(result).toBeDefined();
      expect(result.status).toBe('COMPLETED');
      expect(mockSocket.emit).toHaveBeenCalledWith('investigation:progress', {
        investigationId,
        progress: 100,
        status: 'COMPLETED'
      });
    });

    it('should handle service errors gracefully', async () => {
      const investigationId = 'test-id';
      const inputData = { email: 'test@example.com' };
      
      // Mock service error
      const mockBusterService = {
        run: jest.fn().mockRejectedValue(new Error('Service error'))
      };
      
      service.busterService = mockBusterService;
      
      // Mock investigation update for error handling
      mockPrisma.investigation.update.mockResolvedValue({
        id: investigationId,
        status: 'FAILED'
      });
      
      const result = await service.runInvestigation(investigationId, inputData);
      
      expect(result.status).toBe('FAILED');
      expect(mockSocket.emit).toHaveBeenCalledWith('investigation:error', {
        investigationId,
        error: 'Service error'
      });
    });
  });

  describe('getInvestigationStatus', () => {
    it('should return investigation status', async () => {
      const investigationId = 'test-id';
      
      mockPrisma.investigation.findUnique.mockResolvedValue({
        id: investigationId,
        status: 'RUNNING',
        progress: 50,
        currentStep: 'scanning'
      });
      
      const result = await service.getInvestigationStatus(investigationId);
      
      expect(result).toBeDefined();
      expect(result.status).toBe('RUNNING');
      expect(result.progress).toBe(50);
      expect(result.currentStep).toBe('scanning');
    });

    it('should handle missing investigation', async () => {
      const investigationId = 'non-existent';
      
      mockPrisma.investigation.findUnique.mockResolvedValue(null);
      
      const result = await service.getInvestigationStatus(investigationId);
      
      expect(result).toBeNull();
    });
  });
}); 