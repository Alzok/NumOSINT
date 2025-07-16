const MaigretService = require('../../../src/services/tools/maigret');

// Mock Prisma complet
const mockPrisma = {
  result: {
    create: jest.fn().mockResolvedValue({}),
  },
  indicator: {
    findFirst: jest.fn().mockResolvedValue(null), // Simule qu'aucun indicateur n'existe déjà
    create: jest.fn().mockResolvedValue({}),
    createMany: jest.fn(), // Gardé pour compatibilité si jamais utilisé
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
    it('should call the maigret service and save results', async () => {
      const investigationId = 'test-investigation';
      const usernameIndicator = { id: 'test-indicator', value: 'testuser' };
      
      // Simuler une réponse réussie du service Maigret
      const mockApiResponse = {
        data: {
          sites: {
            'Instagram': { status: 'found', url: 'http://instagram.com/testuser' },
            'Twitter': { status: 'not-found' }
          }
        }
      };
      
      // Mocker l'appel axios
      const axiosPostSpy = jest.spyOn(maigretService.axios, 'post').mockResolvedValue(mockApiResponse);

      await maigretService.searchProfiles(investigationId, usernameIndicator);

      // Vérifier que axios.post a été appelé avec les bons arguments
      expect(axiosPostSpy).toHaveBeenCalledWith('/scan', { username: 'testuser', tags: 'all' }, { timeout: 300000 });

      // Vérifier que le résultat a été sauvegardé
      expect(mockPrisma.result.create).toHaveBeenCalled();
      const resultCall = mockPrisma.result.create.mock.calls[0][0];
      expect(resultCall.data.data.profiles).toHaveLength(1);
      expect(resultCall.data.data.profiles[0].url).toBe('http://instagram.com/testuser');

      // Vérifier que les nouveaux indicateurs ont été créés
      expect(mockPrisma.indicator.create).toHaveBeenCalled();
      const indicatorCall = mockPrisma.indicator.create.mock.calls[0][0];
      expect(indicatorCall.data.value).toBe('http://instagram.com/testuser');

      // Nettoyer le spy
      axiosPostSpy.mockRestore();
    });
  });
});