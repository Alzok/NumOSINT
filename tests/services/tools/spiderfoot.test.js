const SpiderFootService = require('../../../src/services/tools/spiderfoot');
const { PrismaClient } = require('@prisma/client');

// Mock Prisma
const mockPrisma = {
  result: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  indicator: {
    createMany: jest.fn().mockResolvedValue({ count: 2 }),
  },
};

describe('SpiderFootService', () => {
  let spiderfootService;

  beforeEach(() => {
    spiderfootService = new SpiderFootService(mockPrisma);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(spiderfootService).toBeDefined();
  });

  describe('startScan', () => {
    it('should call spiderfoot command and save results', async () => {
      const investigationId = 'test-investigation';
      const indicator = { id: 'test-indicator', value: 'example.com' };
      
      const mockScanData = [
        { type: 'IP_ADDRESS', data: '1.2.3.4' },
        { type: 'EMAILADDR', data: 'test@example.com' },
      ];
      spiderfootService.executeScanCommand = jest.fn().mockResolvedValue();
      spiderfootService.parseScanResults = jest.fn().mockResolvedValue(mockScanData);

      await spiderfootService.startScan(investigationId, indicator);

      // Check if result was created
      expect(mockPrisma.result.create).toHaveBeenCalled();
      const resultCall = mockPrisma.result.create.mock.calls[0][0];
      expect(resultCall.data.data.totalItems).toBe(2);

      // Check if new indicators were created
      expect(mockPrisma.indicator.createMany).toHaveBeenCalled();
      const indicatorCall = mockPrisma.indicator.createMany.mock.calls[0][0];
      expect(indicatorCall.data).toHaveLength(2);
    });
  });
});