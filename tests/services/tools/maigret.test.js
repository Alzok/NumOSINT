const MaigretService = require('../../../src/services/tools/maigret');
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

describe('MaigretService', () => {
  let maigretService;

  beforeEach(() => {
    maigretService = new MaigretService(mockPrisma);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(maigretService).toBeDefined();
  });

  describe('searchProfiles', () => {
    it('should call maigret command and save results', async () => {
      const investigationId = 'test-investigation';
      const usernameIndicator = { id: 'test-indicator', value: 'testuser' };
      
      const mockProfiles = [{ url: 'http://instagram.com/testuser' }];
      maigretService.executeMaigretCommand = jest.fn().mockResolvedValue(mockProfiles);

      await maigretService.searchProfiles(investigationId, usernameIndicator);

      // Check if result was created
      expect(mockPrisma.result.create).toHaveBeenCalled();
      const resultCall = mockPrisma.result.create.mock.calls[0][0];
      expect(resultCall.data.data.profiles).toHaveLength(1);

      // Check if new indicators were created
      expect(mockPrisma.indicator.createMany).toHaveBeenCalled();
      const indicatorCall = mockPrisma.indicator.createMany.mock.calls[0][0];
      expect(indicatorCall.data[0].value).toBe('http://instagram.com/testuser');
    });
  });
});