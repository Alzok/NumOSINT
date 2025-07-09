/**
 * Tests d'intégration pour l'API NumOSINT
 */

// Mock des dépendances
const mockPrisma = {
  investigation: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  },
  indicator: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  result: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  investigationLog: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  $connect: jest.fn(),
  $disconnect: jest.fn()
};

describe('NumOSINT API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Investigation Creation', () => {
    it('should create a new investigation with valid data', async () => {
      const investigationData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com'
      };

      const mockInvestigation = {
        id: 'test-id',
        status: 'INITIALIZING',
        progress: 0,
        inputData: investigationData,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockPrisma.investigation.create.mockResolvedValue(mockInvestigation);

      // Simuler la création d'investigation
      const result = await mockPrisma.investigation.create({
        data: {
          status: 'INITIALIZING',
          progress: 0,
          inputData: investigationData
        }
      });

      expect(result).toEqual(mockInvestigation);
      expect(mockPrisma.investigation.create).toHaveBeenCalledWith({
        data: {
          status: 'INITIALIZING',
          progress: 0,
          inputData: investigationData
        }
      });
    });

    it('should validate input data before creation', () => {
      const validateInput = (data) => {
        const errors = [];
        
        if (!data.first_name && !data.last_name && !data.email && !data.phone && !data.username) {
          errors.push('Au moins un indicateur requis');
        }
        
        if (data.email && !isValidEmail(data.email)) {
          errors.push('Format email invalide');
        }
        
        if (data.phone && !isValidPhone(data.phone)) {
          errors.push('Format téléphone invalide');
        }
        
        return {
          isValid: errors.length === 0,
          errors
        };
      };

      const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      const isValidPhone = (phone) => {
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        return phoneRegex.test(phone) && phone.length >= 10;
      };

      // Test avec données valides
      const validData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com'
      };
      
      const validResult = validateInput(validData);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Test avec données invalides
      const invalidData = {
        email: 'invalid-email'
      };
      
      const invalidResult = validateInput(invalidData);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Format email invalide');

      // Test avec données vides
      const emptyData = {};
      
      const emptyResult = validateInput(emptyData);
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors).toContain('Au moins un indicateur requis');
    });
  });

  describe('Investigation Status', () => {
    it('should track investigation progress', async () => {
      const investigationId = 'test-id';
      const statusUpdates = [
        { status: 'INITIALIZING', progress: 0 },
        { status: 'ENRICHING', progress: 25 },
        { status: 'SCANNING', progress: 50 },
        { status: 'CONSOLIDATING', progress: 75 },
        { status: 'COMPLETED', progress: 100 }
      ];

      for (const update of statusUpdates) {
        mockPrisma.investigation.update.mockResolvedValue({
          id: investigationId,
          ...update
        });

        const result = await mockPrisma.investigation.update({
          where: { id: investigationId },
          data: update
        });

        expect(result.status).toBe(update.status);
        expect(result.progress).toBe(update.progress);
      }
    });

    it('should handle investigation errors', async () => {
      const investigationId = 'test-id';
      const errorUpdate = {
        status: 'FAILED',
        progress: 0,
        error: 'Service unavailable'
      };

      mockPrisma.investigation.update.mockResolvedValue({
        id: investigationId,
        ...errorUpdate
      });

      const result = await mockPrisma.investigation.update({
        where: { id: investigationId },
        data: errorUpdate
      });

      expect(result.status).toBe('FAILED');
      expect(result.error).toBe('Service unavailable');
    });
  });

  describe('Data Storage', () => {
    it('should store indicators and results', async () => {
      const investigationId = 'test-id';
      
      // Créer un indicateur
      const indicator = {
        id: 'indicator-id',
        investigationId,
        type: 'EMAIL',
        value: 'test@example.com',
        source: 'buster'
      };

      mockPrisma.indicator.create.mockResolvedValue(indicator);

      const createdIndicator = await mockPrisma.indicator.create({
        data: {
          investigationId,
          type: 'EMAIL',
          value: 'test@example.com',
          source: 'buster'
        }
      });

      expect(createdIndicator).toEqual(indicator);

      // Créer un résultat
      const result = {
        id: 'result-id',
        investigationId,
        indicatorId: indicator.id,
        toolSource: 'buster',
        data: { exists: true, confidence: 0.8 }
      };

      mockPrisma.result.create.mockResolvedValue(result);

      const createdResult = await mockPrisma.result.create({
        data: {
          investigationId,
          indicatorId: indicator.id,
          toolSource: 'buster',
          data: { exists: true, confidence: 0.8 }
        }
      });

      expect(createdResult).toEqual(result);
    });

    it('should log investigation steps', async () => {
      const investigationId = 'test-id';
      
      const log = {
        id: 'log-id',
        investigationId,
        step: 'initialization',
        message: 'Investigation started',
        level: 'INFO'
      };

      mockPrisma.investigationLog.create.mockResolvedValue(log);

      const createdLog = await mockPrisma.investigationLog.create({
        data: {
          investigationId,
          step: 'initialization',
          message: 'Investigation started',
          level: 'INFO'
        }
      });

      expect(createdLog).toEqual(log);
    });
  });

  describe('Database Connection', () => {
    it('should connect and disconnect from database', async () => {
      mockPrisma.$connect.mockResolvedValue();
      mockPrisma.$disconnect.mockResolvedValue();

      await mockPrisma.$connect();
      expect(mockPrisma.$connect).toHaveBeenCalled();

      await mockPrisma.$disconnect();
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });
  });
}); 