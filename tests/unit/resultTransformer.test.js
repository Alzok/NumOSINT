const ResultTransformer = require('../../src/utils/resultTransformer');

describe('ResultTransformer', () => {
  describe('transform', () => {
    it('should return an empty array for null, undefined or empty input', () => {
      expect(ResultTransformer.transform(null)).toEqual([]);
      expect(ResultTransformer.transform(undefined)).toEqual([]);
      expect(ResultTransformer.transform([])).toEqual([]);
    });

    it('should call the correct transformer based on toolSource', () => {
      const maigretSpy = jest.spyOn(ResultTransformer, 'transformMaigret').mockReturnValue([]);
      const busterSpy = jest.spyOn(ResultTransformer, 'transformBuster').mockReturnValue([]);

      const results = [
        { toolSource: 'maigret', data: {} },
        { toolSource: 'buster', data: {} },
      ];

      ResultTransformer.transform(results);

      expect(maigretSpy).toHaveBeenCalledWith(results[0]);
      expect(busterSpy).toHaveBeenCalledWith(results[1]);

      maigretSpy.mockRestore();
      busterSpy.mockRestore();
    });

    it('should deduplicate items based on type and value', () => {
        const results = [
            { 
                toolSource: 'maigret', 
                data: { profiles: [{ url: 'http://example.com/user', sitename: 'Example' }] } 
            },
            { 
                toolSource: 'buster', 
                data: { reverse_whois: ['example.com'] } // This will be transformed to a DOMAIN
            },
            { 
                toolSource: 'mosint', 
                data: { social_media: [{ url: 'http://example.com/user', site: 'Example' }] } 
            },
        ];

        const transformed = ResultTransformer.transform(results);
        
        // We expect 2 items: one PROFILE and one DOMAIN. The second profile is a duplicate.
        expect(transformed).toHaveLength(2);
        expect(transformed.some(item => item.type === 'PROFILE')).toBe(true);
        expect(transformed.some(item => item.type === 'DOMAIN')).toBe(true);
    });
  });

  // Placeholder for individual transformer tests
  describe('Individual Transformers', () => {
    
    describe('transformMaigret', () => {
        it('should transform maigret data correctly', () => {
            const result = {
                toolSource: 'maigret',
                data: {
                    profiles: [
                        { url: 'http://site1.com/user', username: 'user', sitename: 'Site1', category: 'Social' },
                        { url: 'http://site2.com/user', username: 'user', sitename: 'Site2', category: 'Forum' },
                    ]
                }
            };
            const expected = [
                { type: 'PROFILE', value: 'http://site1.com/user', category: 'Social', sourceTool: 'maigret', details: { username: 'user', siteName: 'Site1' }, link: 'http://site1.com/user' },
                { type: 'PROFILE', value: 'http://site2.com/user', category: 'Forum', sourceTool: 'maigret', details: { username: 'user', siteName: 'Site2' }, link: 'http://site2.com/user' },
            ];
            expect(ResultTransformer.transformMaigret(result)).toEqual(expected);
        });

        it('should return an empty array if data or profiles are missing', () => {
            expect(ResultTransformer.transformMaigret({ toolSource: 'maigret', data: {} })).toEqual([]);
            expect(ResultTransformer.transformMaigret({ toolSource: 'maigret', data: { profiles: [] } })).toEqual([]);
            expect(ResultTransformer.transformMaigret({ toolSource: 'maigret', data: null })).toEqual([]);
        });
    });

    // Add more tests for other transformers here...

  });
describe('transformBuster', () => {
        it('should transform buster data correctly', () => {
            const result = {
                toolSource: 'buster',
                data: {
                    reverse_whois: ['domain1.com', 'domain2.com']
                }
            };
            const expected = [
                { type: 'DOMAIN', value: 'domain1.com', category: 'Domaine enregistré', sourceTool: 'buster', details: {}, link: null },
                { type: 'DOMAIN', value: 'domain2.com', category: 'Domaine enregistré', sourceTool: 'buster', details: {}, link: null },
            ];
            expect(ResultTransformer.transformBuster(result)).toEqual(expected);
        });

        it('should return an empty array if data or reverse_whois are missing', () => {
            expect(ResultTransformer.transformBuster({ toolSource: 'buster', data: {} })).toEqual([]);
            expect(ResultTransformer.transformBuster({ toolSource: 'buster', data: { reverse_whois: [] } })).toEqual([]);
            expect(ResultTransformer.transformBuster({ toolSource: 'buster', data: null })).toEqual([]);
        });
    });

    describe('transformMosint', () => {
        it('should transform mosint data correctly', () => {
            const result = {
                toolSource: 'mosint',
                data: {
                    breaches: [{ name: 'Breach1' }],
                    ip_info: { ip: '1.1.1.1' },
                    social_media: [{ url: 'http://social.com/user', username: 'user', site: 'Social' }],
                    related_emails: ['related@email.com']
                }
            };
            const transformed = ResultTransformer.transformMosint(result);
            expect(transformed).toHaveLength(4);
            expect(transformed).toContainEqual({ type: 'BREACH', value: 'Breach1', category: 'Fuite de données', sourceTool: 'mosint', details: { name: 'Breach1' }, link: null });
            expect(transformed).toContainEqual({ type: 'IP', value: '1.1.1.1', category: 'Réseau', sourceTool: 'mosint', details: { ip: '1.1.1.1' }, link: null });
            expect(transformed).toContainEqual({ type: 'PROFILE', value: 'http://social.com/user', category: 'Social', sourceTool: 'mosint', details: { username: 'user', siteName: 'Social' }, link: 'http://social.com/user' });
            expect(transformed).toContainEqual({ type: 'EMAIL', value: 'related@email.com', category: 'Email relié', sourceTool: 'mosint', details: {}, link: null });
        });

        it('should return an empty array if data is missing', () => {
            expect(ResultTransformer.transformMosint({ toolSource: 'mosint', data: null })).toEqual([]);
        });
    });
});
describe('transformPhoneInfoga', () => {
        it('should transform phoneinfoga data correctly', () => {
            const result = {
                toolSource: 'phoneinfoga',
                data: {
                    analysis: { countryName: 'France', countryCode: 'FR', carrier: 'Orange', lineType: 'Mobile' }
                }
            };
            const transformed = ResultTransformer.transformPhoneInfoga(result);
            expect(transformed).toHaveLength(2);
            expect(transformed).toContainEqual({ type: 'LOCATION', value: 'France', category: 'Géolocalisation', sourceTool: 'phoneinfoga', details: { code: 'FR' }, link: null });
            expect(transformed).toContainEqual({ type: 'ORGANIZATION', value: 'Orange', category: 'Télécom', sourceTool: 'phoneinfoga', details: { lineType: 'Mobile' }, link: null });
        });

        it('should return an empty array if analysis is missing', () => {
            expect(ResultTransformer.transformPhoneInfoga({ toolSource: 'phoneinfoga', data: {} })).toEqual([]);
        });
    });

    describe('transformWaybulk', () => {
        it('should transform waybulk data correctly', () => {
            const result = {
                toolSource: 'waybulk',
                data: {
                    archived_snapshots: { closest: { url: 'http://archive.org/page', timestamp: '20230101' } }
                }
            };
            const expected = [
                { type: 'URL', value: 'http://archive.org/page', category: 'Archive Web', sourceTool: 'waybulk', details: { timestamp: '20230101' }, link: 'http://archive.org/page' }
            ];
            expect(ResultTransformer.transformWaybulk(result)).toEqual(expected);
        });

        it('should return an empty array if snapshots are missing', () => {
            expect(ResultTransformer.transformWaybulk({ toolSource: 'waybulk', data: {} })).toEqual([]);
        });
    });

    describe('transformAsn', () => {
        it('should transform asn data correctly', () => {
            const result = {
                toolSource: 'asn',
                data: { asn: 'AS15169', country: 'US' }
            };
            const transformed = ResultTransformer.transformAsn(result);
            expect(transformed).toHaveLength(2);
            expect(transformed).toContainEqual({ type: 'ORGANIZATION', value: 'AS15169', category: 'Réseau', sourceTool: 'asn', details: { asn: 'AS15169', country: 'US' }, link: null });
            expect(transformed).toContainEqual({ type: 'LOCATION', value: 'US', category: 'Géolocalisation', sourceTool: 'asn', details: { asn: 'AS15169', country: 'US' }, link: null });
        });
    });

    describe('transformWau', () => {
        it('should transform wau data correctly for a valid email', () => {
            const result = {
                toolSource: 'wau',
                indicatorValue: 'test@valid.com',
                data: { is_valid: true, reason: 'accepted_email', is_disposable: false }
            };
            const expected = [
                { type: 'VALIDATION', value: 'test@valid.com', category: 'Email Valide', sourceTool: 'wau', details: { reason: 'accepted_email', is_disposable: false }, link: null }
            ];
            expect(ResultTransformer.transformWau(result)).toEqual(expected);
        });
    });

    describe('transformPdl', () => {
        it('should transform pdl data correctly', () => {
            const result = {
                toolSource: 'pdl',
                data: {
                    full_name: 'John Doe',
                    location_name: 'Paris, France',
                    job_title: 'Engineer',
                    job_company_name: 'Tech Corp',
                    work_email: 'john.doe@techcorp.com',
                    profiles: [{ url: 'http://linkedin.com/johndoe', network: 'linkedin', username: 'johndoe' }]
                }
            };
            const transformed = ResultTransformer.transformPdl(result);
            expect(transformed).toHaveLength(5);
            expect(transformed).toContainEqual({ type: 'NAME', value: 'John Doe', category: 'Identité', sourceTool: 'pdl', details: {}, link: null });
            expect(transformed).toContainEqual({ type: 'LOCATION', value: 'Paris, France', category: 'Géolocalisation', sourceTool: 'pdl', details: {}, link: null });
            expect(transformed).toContainEqual({ type: 'JOB', value: 'Engineer @ Tech Corp', category: 'Emploi', sourceTool: 'pdl', details: {}, link: null });
            expect(transformed).toContainEqual({ type: 'EMAIL', value: 'john.doe@techcorp.com', category: 'Email Professionnel', sourceTool: 'pdl', details: {}, link: null });
            expect(transformed).toContainEqual({ type: 'PROFILE', value: 'http://linkedin.com/johndoe', category: 'linkedin', sourceTool: 'pdl', details: { username: 'johndoe' }, link: 'http://linkedin.com/johndoe' });
        });
    });

    describe('transformSpiderfoot', () => {
        it('should transform spiderfoot data correctly', () => {
            const result = {
                toolSource: 'spiderfoot',
                data: { summary: 'Scan summary', totalItems: 10 }
            };
            const expected = [
                { type: 'SUMMARY', value: 'Scan terminé avec 10 éléments trouvés.', category: 'Résumé de Scan', sourceTool: 'spiderfoot', details: { summary: 'Scan summary', totalItems: 10 }, link: null }
            ];
            expect(ResultTransformer.transformSpiderfoot(result)).toEqual(expected);
        });

        it('should return an empty array if summary is missing', () => {
            expect(ResultTransformer.transformSpiderfoot({ toolSource: 'spiderfoot', data: {} })).toEqual([]);
        });
    });