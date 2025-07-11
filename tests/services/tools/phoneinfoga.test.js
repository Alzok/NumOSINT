const PhoneInfogaService = require('../../../src/services/tools/phoneinfoga');
const { PrismaClient } = require('@prisma/client');

// Mock Prisma
const mockPrisma = {
  result: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  indicator: {
    createMany: jest.fn(),
  },
};

describe('PhoneInfogaService', () => {
  let phoneinfogaService;

  beforeEach(() => {
    phoneinfogaService = new PhoneInfogaService(mockPrisma);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(phoneinfogaService).toBeDefined();
  });

  describe('analyzePhone', () => {
    it('should call phoneinfoga command and save results', async () => {
      const investigationId = 'test-investigation';
      const phoneIndicator = { id: 'test-indicator', value: '+15551234567' };
      
      const mockAnalysis = { valid: true, countryCode: 'US', city: 'New York' };
      phoneinfogaService.analyzeSinglePhone = jest.fn().mockResolvedValue({
        analysis: mockAnalysis
      });

      await phoneinfogaService.analyzePhone(investigationId, phoneIndicator);

      // Check if result was created
      expect(mockPrisma.result.create).toHaveBeenCalled();
      const resultCall = mockPrisma.result.create.mock.calls[0][0];
      expect(resultCall.data.data.analysis.valid).toBe(true);

      // Check if new indicators were created
      expect(mockPrisma.indicator.createMany).toHaveBeenCalled();
      const indicatorCall = mockPrisma.indicator.createMany.mock.calls[0][0];
      expect(indicatorCall.data).toHaveLength(2); // Country and City
    });
  });
});