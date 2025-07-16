const BusterService = require('../../../src/services/tools/buster');
const { IndicatorType } = require('@prisma/client');

describe('BusterService', () => {
  let busterService;
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = {
      indicator: {
        findMany: jest.fn(),
      },
    };
    busterService = new BusterService(mockPrisma);
    busterService.axios = {
      post: jest.fn(),
    };
    busterService._saveResult = jest.fn();
    busterService._saveIndicators = jest.fn();
  });

  describe('reverseWhois', () => {
    it('should call reverse-whois endpoint and save results and indicators', async () => {
      const investigationId = 'inv-123';
      const emailIndicator = { id: 'ind-abc', value: 'test@example.com' };
      const apiResponse = { data: { domains: ['example.com', 'example.org'] } };

      busterService.axios.post.mockResolvedValue(apiResponse);

      await busterService.reverseWhois(investigationId, emailIndicator);

      expect(busterService.axios.post).toHaveBeenCalledWith('/reverse-whois', { email: 'test@example.com' });
      
      expect(busterService._saveResult).toHaveBeenCalledWith(
        investigationId,
        emailIndicator.id,
        { reverse_whois: ['example.com', 'example.org'] }
      );

      const expectedNewIndicators = [
        { type: IndicatorType.DOMAIN, value: 'example.com', confidence: 85 },
        { type: IndicatorType.DOMAIN, value: 'example.org', confidence: 85 },
      ];
      expect(busterService._saveIndicators).toHaveBeenCalledWith(
        investigationId,
        emailIndicator,
        expectedNewIndicators
      );
    });

    it('should handle cases where no domains are found', async () => {
      const investigationId = 'inv-123';
      const emailIndicator = { id: 'ind-abc', value: 'test@example.com' };
      const apiResponse = { data: { domains: [] } };

      busterService.axios.post.mockResolvedValue(apiResponse);

      await busterService.reverseWhois(investigationId, emailIndicator);

      expect(busterService.axios.post).toHaveBeenCalledWith('/reverse-whois', { email: 'test@example.com' });
      expect(busterService._saveResult).not.toHaveBeenCalled();
      expect(busterService._saveIndicators).not.toHaveBeenCalled();
    });
  });
});