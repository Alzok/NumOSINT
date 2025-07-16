const SpiderFootService = require('../../../src/services/tools/spiderfoot');

// Mock Prisma complet
const mockPrisma = {
  result: {
    create: jest.fn().mockResolvedValue({}),
  },
  investigation: {
    update: jest.fn().mockResolvedValue({})
  },
  indicator: {
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
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
    it('should call the spiderfoot service and save results', async () => {
      const investigationId = 'test-investigation';
      const indicators = [{ id: 'test-indicator', value: 'example.com' }];
      
      const mockScanData = [
        { type: 'IP_ADDRESS', data: '1.2.3.4' },
        { type: 'EMAILADDR', data: 'test@example.com' },
      ];
      
      // Mocker l'appel axios
      const axiosPostSpy = jest.spyOn(spiderfootService.axios, 'post').mockResolvedValue({ data: mockScanData });

      await spiderfootService.startScan(investigationId, indicators);

      // Vérifier que axios.post a été appelé
      expect(axiosPostSpy).toHaveBeenCalledWith('/scan', { targets: 'example.com' });

      // Vérifier que le résultat a été sauvegardé
      expect(mockPrisma.result.create).toHaveBeenCalled();
      const resultCall = mockPrisma.result.create.mock.calls[0][0];
      expect(resultCall.data.data.totalItems).toBe(2);

      // Vérifier que les nouveaux indicateurs ont été créés
      expect(mockPrisma.indicator.create).toHaveBeenCalledTimes(2);
      const firstIndicatorCall = mockPrisma.indicator.create.mock.calls[0][0];
      expect(firstIndicatorCall.data.value).toBe('1.2.3.4');
      const secondIndicatorCall = mockPrisma.indicator.create.mock.calls[1][0];
      expect(secondIndicatorCall.data.value).toBe('test@example.com');

      // Nettoyer le spy
      axiosPostSpy.mockRestore();
    });
  });
});