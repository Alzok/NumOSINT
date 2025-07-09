const { BusterService } = require('../../../src/services/tools/buster');
const { PrismaClient } = require('@prisma/client');

// Mock Prisma
jest.mock('@prisma/client');

describe('BusterService', () => {
  let service;
  let mockPrisma;
  
  beforeEach(() => {
    mockPrisma = new PrismaClient();
    service = new BusterService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('should generate email variations for a given name', async () => {
      const firstName = 'John';
      const lastName = 'Doe';
      
      const result = await service.generate(firstName, lastName);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result.emails)).toBe(true);
      expect(result.emails.length).toBeGreaterThan(0);
      
      // Check for expected email patterns
      expect(result.emails).toContain('john.doe@gmail.com');
      expect(result.emails).toContain('j.doe@gmail.com');
      expect(result.emails).toContain('john_doe@gmail.com');
    });

    it('should handle empty names gracefully', async () => {
      const result = await service.generate('', '');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result.emails)).toBe(true);
      expect(result.emails.length).toBe(0);
    });
  });

  describe('validate', () => {
    it('should validate email existence', async () => {
      const email = 'test@example.com';
      
      const result = await service.validate(email);
      
      expect(result).toBeDefined();
      expect(result.email).toBe(email);
      expect(typeof result.exists).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle invalid email format', async () => {
      const email = 'invalid-email';
      
      const result = await service.validate(email);
      
      expect(result).toBeDefined();
      expect(result.email).toBe(email);
      expect(result.exists).toBe(false);
      expect(result.confidence).toBe(0);
    });
  });

  describe('run', () => {
    it('should run complete buster analysis', async () => {
      const investigationId = 'test-id';
      const indicators = [
        { type: 'NAME', value: 'John Doe' }
      ];
      
      mockPrisma.indicator.create.mockResolvedValue({
        id: 'indicator-id',
        type: 'EMAIL',
        value: 'john.doe@gmail.com'
      });
      
      mockPrisma.result.create.mockResolvedValue({
        id: 'result-id'
      });
      
      const result = await service.run(investigationId, indicators);
      
      expect(result).toBeDefined();
      expect(result.generated).toBeDefined();
      expect(result.validated).toBeDefined();
      expect(Array.isArray(result.generated)).toBe(true);
      expect(Array.isArray(result.validated)).toBe(true);
    });
  });
}); 