const ResultTransformer = require('../../src/utils/resultTransformer');
const { EvidenceType, EvidenceCategory } = require('../../src/config/evidence');

describe('ResultTransformer', () => {
  describe('transformMaigret', () => {
    it('should transform Maigret results into standard evidence items', () => {
      const maigretResult = {
        toolSource: 'maigret',
        data: {
          profiles: [
            { url: 'http://twitter.com/test', category: 'social', username: 'test', sitename: 'Twitter' },
            { url: 'http://github.com/test', category: 'coding', username: 'test', sitename: 'GitHub' },
          ],
        },
      };

      const transformed = ResultTransformer.transform([maigretResult]);
      
      expect(transformed).toHaveLength(2);
      expect(transformed[0]).toEqual({
        type: EvidenceType.PROFILE,
        value: 'http://twitter.com/test',
        category: 'social',
        sourceTool: 'maigret',
        details: { username: 'test', siteName: 'Twitter' },
        link: 'http://twitter.com/test',
      });
      expect(transformed[1].category).toBe('coding');
    });
  });

  describe('transformMosint', () => {
    it('should transform Mosint results into standard evidence items', () => {
      const mosintResult = {
        toolSource: 'mosint',
        data: {
          breaches: [{ name: 'TestBreach' }],
          ip_info: { ip: '1.2.3.4', city: 'Testville', country: 'Testland', org: 'Test ISP', country_code: 'TS' },
          social_media: [{ url: 'http://facebook.com/test', site: 'Facebook', username: 'test' }],
          related_emails: ['test2@email.com'],
        },
      };

      const transformed = ResultTransformer.transform([mosintResult]);

      expect(transformed).toHaveLength(6);
      expect(transformed).toContainEqual(expect.objectContaining({ type: EvidenceType.BREACH, value: 'TestBreach' }));
      expect(transformed).toContainEqual(expect.objectContaining({ type: EvidenceType.IP_ADDRESS, value: '1.2.3.4' }));
      expect(transformed).toContainEqual(expect.objectContaining({ type: EvidenceType.LOCATION, value: 'Testville, Testland' }));
      expect(transformed).toContainEqual(expect.objectContaining({ type: EvidenceType.ORGANIZATION, value: 'Test ISP' }));
      expect(transformed).toContainEqual(expect.objectContaining({ type: EvidenceType.PROFILE, value: 'http://facebook.com/test' }));
      expect(transformed).toContainEqual(expect.objectContaining({ type: EvidenceType.EMAIL, value: 'test2@email.com' }));
    });
  });

  describe('transformBuster', () => {
    it('should transform Buster results into standard evidence items', () => {
      const busterResult = {
        toolSource: 'buster',
        data: {
          reverse_whois: ['domain1.com', 'domain2.com'],
        },
      };

      const transformed = ResultTransformer.transform([busterResult]);

      expect(transformed).toHaveLength(2);
      expect(transformed[0]).toEqual(expect.objectContaining({ type: EvidenceType.DOMAIN, value: 'domain1.com' }));
      expect(transformed[1]).toEqual(expect.objectContaining({ type: EvidenceType.DOMAIN, value: 'domain2.com' }));
    });
  });

  describe('transformPhoneInfoga', () => {
    it('should transform PhoneInfoga results into standard evidence items', () => {
      const phoneInfogaResult = {
        toolSource: 'phoneinfoga',
        data: {
          analysis: {
            countryName: 'France',
            countryCode: 'FR',
            carrier: 'Orange',
            lineType: 'mobile',
          },
        },
      };

      const transformed = ResultTransformer.transform([phoneInfogaResult]);

      expect(transformed).toHaveLength(2);
      expect(transformed).toContainEqual(expect.objectContaining({ type: EvidenceType.LOCATION, value: 'France' }));
      expect(transformed).toContainEqual(expect.objectContaining({ type: EvidenceType.ORGANIZATION, value: 'Orange' }));
    });
  });

  describe('transformWaybulk', () => {
    it('should transform Waybulk results into standard evidence items', () => {
      const waybulkResult = {
        toolSource: 'waybulk',
        data: {
          archived_snapshots: {
            closest: { url: 'http://example.com', timestamp: '20230101' },
          },
        },
      };
      const transformed = ResultTransformer.transform([waybulkResult]);
      expect(transformed[0]).toEqual(expect.objectContaining({ type: EvidenceType.URL_ARCHIVE }));
    });
  });

  describe('transformAsn', () => {
    it('should transform ASN results into standard evidence items', () => {
      const asnResult = {
        toolSource: 'asn',
        data: { asn: 'AS15169', country: 'US' },
      };
      const transformed = ResultTransformer.transform([asnResult]);
      expect(transformed).toHaveLength(2);
      expect(transformed).toContainEqual(expect.objectContaining({ type: EvidenceType.ORGANIZATION, value: 'AS15169' }));
      expect(transformed).toContainEqual(expect.objectContaining({ type: EvidenceType.LOCATION, value: 'US' }));
    });
  });

  describe('transformWau', () => {
    it('should transform Wau results into standard evidence items', () => {
      const wauResult = {
        toolSource: 'wau',
        indicatorValue: 'test@email.com',
        data: { is_valid: true, reason: 'valid_mailbox' },
      };
      const transformed = ResultTransformer.transform([wauResult]);
      expect(transformed[0]).toEqual(expect.objectContaining({ type: EvidenceType.VALIDATION, value: 'test@email.com' }));
    });
  });

  describe('transformPdl', () => {
    it('should transform PDL results into standard evidence items', () => {
      const pdlResult = {
        toolSource: 'pdl',
        data: {
          full_name: 'Test User',
          job_title: 'Developer',
          job_company_name: 'Test Inc',
          profiles: [{ url: 'http://linkedin.com/in/test', network: 'linkedin' }],
        },
      };
      const transformed = ResultTransformer.transform([pdlResult]);
      expect(transformed).toHaveLength(3);
      expect(transformed).toContainEqual(expect.objectContaining({ type: EvidenceType.NAME }));
      expect(transformed).toContainEqual(expect.objectContaining({ type: EvidenceType.JOB }));
      expect(transformed).toContainEqual(expect.objectContaining({ type: EvidenceType.PROFILE }));
    });
  });

  describe('transformSpiderfoot', () => {
    it('should transform Spiderfoot results into a summary item', () => {
      const spiderfootResult = {
        toolSource: 'spiderfoot',
        data: { summary: 'Scan finished', totalItems: 10 },
      };
      const transformed = ResultTransformer.transform([spiderfootResult]);
      expect(transformed[0]).toEqual(expect.objectContaining({ type: EvidenceType.SUMMARY }));
    });
  });
});