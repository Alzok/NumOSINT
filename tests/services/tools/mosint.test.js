const MosintService = require('../../../src/services/tools/mosint');
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

jest.mock('child_process', () => ({
  exec: jest.fn((command, options, callback) => callback(null, { stdout: '', stderr: '' })),
}));
const { exec } = require('child_process');

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(),
  readFile: jest.fn().mockResolvedValue('{}'),
  unlink: jest.fn().mockResolvedValue(),
}));


describe('MosintService', () => {
  let mosintService;

  beforeEach(() => {
    mosintService = new MosintService(mockPrisma);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(mosintService).toBeDefined();
  });

  describe('analyzeEmail', () => {
    it('should call mosint command and save results', async () => {
      const investigationId = 'test-investigation';
      const emailIndicator = { id: 'test-indicator', value: 'test@example.com' };
      
      // Mock a successful execution
      mosintService.executeMosintCommand = jest.fn().mockResolvedValue({
        breaches: [{ name: 'TestBreach' }],
        social_media: [{ url: 'http://test.com/profile' }],
      });

      await mosintService.analyzeEmail(investigationId, emailIndicator);

      // Check if result was created
      expect(mockPrisma.result.create).toHaveBeenCalled();
      const resultCall = mockPrisma.result.create.mock.calls[0][0];
      expect(resultCall.data.investigationId).toBe(investigationId);
      expect(resultCall.data.indicatorId).toBe(emailIndicator.id);
      expect(resultCall.data.toolSource).toBe('mosint');
      expect(resultCall.data.data.breaches).toHaveLength(1);

      // Check if new indicators were created
      expect(mockPrisma.indicator.createMany).toHaveBeenCalled();
      const indicatorCall = mockPrisma.indicator.createMany.mock.calls[0][0];
      expect(indicatorCall.data).toHaveLength(1);
      expect(indicatorCall.data[0].value).toBe('http://test.com/profile');
    });
  });
});