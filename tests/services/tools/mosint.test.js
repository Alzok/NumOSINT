const MosintService = require('../../../src/services/tools/mosint');

describe('MosintService', () => {
  let mosintService;

  beforeEach(() => {
    // La méthode `calculateEmailScore` est statique dans son utilisation,
    // pas besoin de mocker Prisma pour ce test.
    mosintService = new MosintService(null);
  });

  describe('calculateEmailScore', () => {
    it('should return a base score of 0.1 for a successful analysis with no data', () => {
      const analysis = {};
      expect(mosintService.calculateEmailScore(analysis)).toBe(0.1);
    });

    it('should add 0.4 to the score if breaches are found', () => {
      const analysis = { breaches: [{ Source: 'SomeBreach' }] };
      expect(mosintService.calculateEmailScore(analysis)).toBe(0.5);
    });

    it('should add 0.3 to the score if social media profiles are found', () => {
      const analysis = { social_media: [{ url: 'http://example.com' }] };
      expect(mosintService.calculateEmailScore(analysis)).toBe(0.4);
    });

    it('should add 0.2 to the score if related emails are found', () => {
      const analysis = { related_emails: ['related@example.com'] };
      expect(mosintService.calculateEmailScore(analysis)).toBe(0.3);
    });

    it('should sum scores for breaches and social media', () => {
      const analysis = {
        breaches: [{ Source: 'SomeBreach' }],
        social_media: [{ url: 'http://example.com' }],
      };
      expect(mosintService.calculateEmailScore(analysis)).toBe(0.8);
    });

    it('should sum scores for all findings', () => {
      const analysis = {
        breaches: [{ Source: 'SomeBreach' }],
        social_media: [{ url: 'http://example.com' }],
        related_emails: ['related@example.com'],
      };
      expect(mosintService.calculateEmailScore(analysis)).toBe(1.0);
    });

    it('should cap the score at 1.0', () => {
      // Ce cas est théorique avec la logique actuelle, mais teste la robustesse.
      const analysis = {
        breaches: [{ Source: 'SomeBreach' }],
        social_media: [{ url: 'http://example.com' }],
        related_emails: ['related@example.com'],
      };
      // La somme est 0.1 + 0.4 + 0.3 + 0.2 = 1.0
      expect(mosintService.calculateEmailScore(analysis)).toBe(1.0);
    });

    it('should handle empty arrays for findings', () => {
      const analysis = {
        breaches: [],
        social_media: [],
        related_emails: [],
      };
      expect(mosintService.calculateEmailScore(analysis)).toBe(0.1);
    });
  });
});