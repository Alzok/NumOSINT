const PhoneInfogaService = require('../../../src/services/tools/phoneinfoga');

// Mock le logger pour éviter l'écriture de fichiers
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Mock Prisma
const mockPrisma = {
  result: {
    create: jest.fn(),
  },
  indicator: {
    create: jest.fn(), // On mock 'create' au lieu de 'createMany'
    findFirst: jest.fn().mockResolvedValue(null),
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
      const phoneIndicator = { id: 'test-indicator', value: '+15551234567', generation: 1 };
      
      const mockAnalysis = { valid: true, countryCode: 'US', city: 'New York' };
      phoneinfogaService.axios.post = jest.fn().mockResolvedValue({ data: mockAnalysis });

      await phoneinfogaService.analyzePhone(investigationId, phoneIndicator);

      expect(phoneinfogaService.axios.post).toHaveBeenCalledWith('/scan', { phoneNumber: '+15551234567' });

      // Vérifie que le résultat est sauvegardé
      expect(mockPrisma.result.create).toHaveBeenCalled();
      const resultCall = mockPrisma.result.create.mock.calls[0][0];
      expect(resultCall.data.data.valid).toBe(true);

      // Vérifie que les nouveaux indicateurs sont sauvegardés
      expect(mockPrisma.indicator.findFirst).toHaveBeenCalledTimes(2);
      expect(mockPrisma.indicator.create).toHaveBeenCalledTimes(2);
      
      // On peut même vérifier le contenu du premier appel
      const firstIndicatorCall = mockPrisma.indicator.create.mock.calls[0][0];
      expect(firstIndicatorCall.data.type).toBe('COUNTRY');
      expect(firstIndicatorCall.data.value).toBe('US');
    });
  });

  describe('_normalizePhoneNumber', () => {
    it('should keep an already normalized number', () => {
      const number = '+33612345678';
      expect(phoneinfogaService._normalizePhoneNumber(number)).toBe(number);
    });

    it('should add +33 to a french number starting with 0', () => {
      const number = '06 12 34 56 78';
      expect(phoneinfogaService._normalizePhoneNumber(number)).toBe('+33612345678');
    });

    it('should add + to an international number without it', () => {
      const number = '447912345678';
      expect(phoneinfogaService._normalizePhoneNumber(number)).toBe('+447912345678');
    });

    it('should remove spaces and special characters', () => {
      const number = '+1 (555) 123-4567';
      expect(phoneinfogaService._normalizePhoneNumber(number)).toBe('+15551234567');
    });
  });
});