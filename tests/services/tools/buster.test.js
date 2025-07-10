const BusterService = require('../../../src/services/tools/buster');
const { PrismaClient, IndicatorType } = require('@prisma/client');
const axios = require('axios');

jest.mock('axios');

const prisma = new PrismaClient();

describe('BusterService', () => {
  let busterService;

  beforeAll(() => {
    busterService = new BusterService(prisma);
    process.env.BUSTER_SERVICE_URL = 'http://buster-service:5003';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should generate and save emails when domains are found', async () => {
    const investigationId = 1;
    const nameIndicator = { id: 1, value: 'John Doe', generation: 0 };
    const domains = [{ value: 'example.com' }];
    const foundEmails = ['john.doe@example.com'];

    busterService.getDomainsForInvestigation = jest.fn().mockResolvedValue(domains.map(d => d.value));
    axios.post.mockResolvedValue({ data: { emails: foundEmails } });
    prisma.indicator.createMany = jest.fn().mockResolvedValue({});

    await busterService.generateEmails(investigationId, nameIndicator);

    expect(busterService.getDomainsForInvestigation).toHaveBeenCalledWith(investigationId);
    expect(axios.post).toHaveBeenCalledWith(
      'http://buster-service:5003/scan',
      { firstName: 'John', lastName: 'Doe', domain: 'example.com' },
      { timeout: 60000 }
    );
    expect(prisma.indicator.createMany).toHaveBeenCalledWith({
      data: [
        {
          investigationId,
          type: IndicatorType.EMAIL,
          value: 'john.doe@example.com',
          source: 'buster',
          confidence: 0.6,
          generation: 1,
          verified: false,
          processed: false,
        },
      ],
      skipDuplicates: true,
    });
  });

  it('should not call buster service if no domains are found', async () => {
    const investigationId = 1;
    const nameIndicator = { id: 1, value: 'Jane Doe', generation: 0 };

    busterService.getDomainsForInvestigation = jest.fn().mockResolvedValue([]);
    
    await busterService.generateEmails(investigationId, nameIndicator);

    expect(axios.post).not.toHaveBeenCalled();
    expect(prisma.indicator.createMany).not.toHaveBeenCalled();
  });
});