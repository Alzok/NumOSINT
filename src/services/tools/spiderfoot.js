const logger = require('../../utils/logger');
const { IndicatorType } = require('@prisma/client');

/**
 * Service SpiderFoot pour le scan exhaustif OSINT
 * Effectue des analyses complètes avec tous les indicateurs collectés
 */
class SpiderFootService {
  constructor(prisma) {
    this.prisma = prisma;
    this.name = 'spiderfoot';
    this.description = 'Scan exhaustif OSINT avec analyse complète des indicateurs';
  }

  /**
   * Démarre un scan SpiderFoot pour une investigation
   * @param {string} investigationId - ID de l'investigation
   * @returns {Promise<Object>} Résultats du scan
   */
  async startScan(investigationId) {
    try {
      logger.info(`🕷️ SpiderFoot: Démarrage du scan pour l'investigation ${investigationId}`);

      // Récupérer tous les indicateurs de l'investigation
      const allIndicators = await this.prisma.indicator.findMany({
        where: { investigationId }
      });

      if (allIndicators.length === 0) {
        logger.info(`🕷️ SpiderFoot: Aucun indicateur à analyser`);
        return {
          scanResults: 0,
          newIndicators: 0,
          results: []
        };
      }

      // Configuration du scan
      const scanConfig = this.createScanConfig(allIndicators);
      
      // Exécuter le scan
      const scanResults = await this.executeScan(scanConfig, investigationId);
      
      // Traiter et sauvegarder les résultats
      const processedResults = await this.processResults(scanResults, investigationId);
      
      // Extraire les nouveaux indicateurs
      const newIndicators = await this.extractNewIndicators(scanResults, investigationId);

      logger.info(`🕷️ SpiderFoot: Scan terminé - ${processedResults.length} résultats, ${newIndicators} nouveaux indicateurs`);

      return {
        scanResults: processedResults.length,
        newIndicators,
        results: processedResults
      };

    } catch (error) {
      logger.error(`🕷️ SpiderFoot: Erreur générale: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crée la configuration du scan basée sur les indicateurs
   * @param {Array} indicators - Liste des indicateurs
   * @returns {Object} Configuration du scan
   */
  createScanConfig(indicators) {
    const targets = indicators.map(indicator => indicator.value);
    
    // Déterminer les modules à utiliser basés sur les types d'indicateurs
    const modules = this.determineModules(indicators);
    
    return {
      targets,
      modules,
      options: {
        maxDepth: 3,
        timeout: 300, // 5 minutes
        maxResults: 1000,
        scanId: `sf_${Date.now()}`,
        startTime: new Date().toISOString()
      }
    };
  }

  /**
   * Détermine les modules SpiderFoot à utiliser
   * @param {Array} indicators - Liste des indicateurs
   * @returns {Array} Liste des modules
   */
  determineModules(indicators) {
    const modules = ['sfp_whois', 'sfp_dnsresolve', 'sfp_shodan']; // Modules de base

    // Ajouter des modules basés sur les types d'indicateurs
    for (const indicator of indicators) {
      switch (indicator.type) {
        case IndicatorType.EMAIL:
          modules.push('sfp_haveibeenpwned', 'sfp_hunter', 'sfp_emailrep');
          break;
        case IndicatorType.DOMAIN:
          modules.push('sfp_whois', 'sfp_dnsresolve', 'sfp_shodan', 'sfp_censys');
          break;
        case IndicatorType.IP:
          modules.push('sfp_shodan', 'sfp_censys', 'sfp_abuseipdb');
          break;
        case IndicatorType.USERNAME:
          modules.push('sfp_socialscan', 'sfp_github', 'sfp_twitter');
          break;
        case IndicatorType.PHONE:
          modules.push('sfp_phoneinfoga', 'sfp_numverify');
          break;
      }
    }

    // Dédupliquer et retourner
    return [...new Set(modules)];
  }

  /**
   * Exécute le scan SpiderFoot
   * @param {Object} config - Configuration du scan
   * @param {string} investigationId - ID de l'investigation
   * @returns {Promise<Array>} Résultats du scan
   */
  async executeScan(config, investigationId) {
    try {
      logger.info(`🕷️ SpiderFoot: Exécution du scan avec ${config.targets.length} cibles et ${config.modules.length} modules`);

      const results = [];

      // Simuler l'exécution des modules pour chaque cible
      for (const target of config.targets) {
        for (const module of config.modules) {
          try {
            const moduleResults = await this.executeModule(module, target, config.options);
            results.push(...moduleResults);
            
            // Log de progression
            logger.info(`🕷️ SpiderFoot: Module ${module} terminé pour ${target}`);
            
          } catch (error) {
            logger.warn(`🕷️ SpiderFoot: Erreur module ${module} pour ${target}: ${error.message}`);
          }
        }
      }

      return results;

    } catch (error) {
      logger.error(`🕷️ SpiderFoot: Erreur lors de l'exécution du scan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Exécute un module SpiderFoot spécifique
   * @param {string} moduleName - Nom du module
   * @param {string} target - Cible à analyser
   * @param {Object} options - Options du scan
   * @returns {Promise<Array>} Résultats du module
   */
  async executeModule(moduleName, target, options) {
    // Simulation d'un délai d'exécution
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const results = [];

    switch (moduleName) {
      case 'sfp_whois':
        results.push(...await this.simulateWhoisModule(target));
        break;
      case 'sfp_dnsresolve':
        results.push(...await this.simulateDnsModule(target));
        break;
      case 'sfp_shodan':
        results.push(...await this.simulateShodanModule(target));
        break;
      case 'sfp_haveibeenpwned':
        results.push(...await this.simulateHibpModule(target));
        break;
      case 'sfp_socialscan':
        results.push(...await this.simulateSocialScanModule(target));
        break;
      case 'sfp_github':
        results.push(...await this.simulateGithubModule(target));
        break;
      case 'sfp_censys':
        results.push(...await this.simulateCensysModule(target));
        break;
      default:
        results.push(...await this.simulateGenericModule(moduleName, target));
    }

    return results.map(result => ({
      ...result,
      module: moduleName,
      target,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Simule le module WHOIS
   * @param {string} target - Cible à analyser
   * @returns {Promise<Array>} Résultats WHOIS
   */
  async simulateWhoisModule(target) {
    const results = [];

    if (this.isDomain(target)) {
      results.push({
        type: 'DOMAIN_NAME',
        value: target,
        data: {
          registrar: 'Example Registrar',
          creationDate: '2020-01-01',
          expirationDate: '2025-01-01',
          status: 'active',
          nameservers: ['ns1.example.com', 'ns2.example.com']
        }
      });

      results.push({
        type: 'IP_ADDRESS',
        value: '192.168.1.1',
        data: {
          country: 'France',
          city: 'Paris',
          isp: 'Example ISP'
        }
      });
    }

    return results;
  }

  /**
   * Simule le module DNS
   * @param {string} target - Cible à analyser
   * @returns {Promise<Array>} Résultats DNS
   */
  async simulateDnsModule(target) {
    const results = [];

    if (this.isDomain(target)) {
      results.push({
        type: 'IP_ADDRESS',
        value: '192.168.1.1',
        data: {
          recordType: 'A',
          ttl: 3600
        }
      });

      results.push({
        type: 'DOMAIN_NAME',
        value: 'mail.' + target,
        data: {
          recordType: 'MX',
          priority: 10
        }
      });
    }

    return results;
  }

  /**
   * Simule le module Shodan
   * @param {string} target - Cible à analyser
   * @returns {Promise<Array>} Résultats Shodan
   */
  async simulateShodanModule(target) {
    const results = [];

    if (this.isIP(target) || this.isDomain(target)) {
      results.push({
        type: 'OPEN_PORT',
        value: '80',
        data: {
          service: 'http',
          banner: 'Apache/2.4.41',
          country: 'France',
          city: 'Paris'
        }
      });

      results.push({
        type: 'OPEN_PORT',
        value: '443',
        data: {
          service: 'https',
          banner: 'nginx/1.18.0',
          ssl: true
        }
      });
    }

    return results;
  }

  /**
   * Simule le module HaveIBeenPwned
   * @param {string} target - Cible à analyser
   * @returns {Promise<Array>} Résultats HIBP
   */
  async simulateHibpModule(target) {
    const results = [];

    if (this.isEmail(target)) {
      results.push({
        type: 'DATA_BREACH',
        value: 'example-breach-2023',
        data: {
          breachName: 'Example Breach 2023',
          breachDate: '2023-06-15',
          pwnCount: 15000000,
          dataClasses: ['email-addresses', 'passwords', 'usernames']
        }
      });
    }

    return results;
  }

  /**
   * Simule le module SocialScan
   * @param {string} target - Cible à analyser
   * @returns {Promise<Array>} Résultats SocialScan
   */
  async simulateSocialScanModule(target) {
    const results = [];

    if (this.isUsername(target)) {
      const platforms = ['twitter', 'github', 'instagram', 'facebook', 'linkedin'];
      
      for (const platform of platforms) {
        if (Math.random() > 0.5) { // 50% de chance de trouver un profil
          results.push({
            type: 'SOCIAL_PROFILE',
            value: `${target}@${platform}`,
            data: {
              platform,
              username: target,
              url: `https://${platform}.com/${target}`,
              exists: true,
              followers: Math.floor(Math.random() * 10000)
            }
          });
        }
      }
    }

    return results;
  }

  /**
   * Simule le module GitHub
   * @param {string} target - Cible à analyser
   * @returns {Promise<Array>} Résultats GitHub
   */
  async simulateGithubModule(target) {
    const results = [];

    if (this.isUsername(target)) {
      results.push({
        type: 'GITHUB_PROFILE',
        value: target,
        data: {
          username: target,
          url: `https://github.com/${target}`,
          exists: true,
          publicRepos: Math.floor(Math.random() * 50),
          followers: Math.floor(Math.random() * 100),
          location: 'Paris, France',
          bio: 'Software Developer'
        }
      });

      // Simuler des repositories
      const repos = ['project1', 'project2', 'project3'];
      for (const repo of repos) {
        results.push({
          type: 'GITHUB_REPO',
          value: `${target}/${repo}`,
          data: {
            name: repo,
            owner: target,
            url: `https://github.com/${target}/${repo}`,
            language: 'JavaScript',
            stars: Math.floor(Math.random() * 100)
          }
        });
      }
    }

    return results;
  }

  /**
   * Simule le module Censys
   * @param {string} target - Cible à analyser
   * @returns {Promise<Array>} Résultats Censys
   */
  async simulateCensysModule(target) {
    const results = [];

    if (this.isIP(target) || this.isDomain(target)) {
      results.push({
        type: 'CERTIFICATE',
        value: 'example-cert',
        data: {
          issuer: 'Let\'s Encrypt',
          subject: target,
          validFrom: '2023-01-01',
          validTo: '2024-01-01',
          serialNumber: '1234567890abcdef'
        }
      });

      results.push({
        type: 'SERVICE',
        value: 'https-service',
        data: {
          port: 443,
          protocol: 'https',
          service: 'nginx',
          version: '1.18.0'
        }
      });
    }

    return results;
  }

  /**
   * Simule un module générique
   * @param {string} moduleName - Nom du module
   * @param {string} target - Cible à analyser
   * @returns {Promise<Array>} Résultats génériques
   */
  async simulateGenericModule(moduleName, target) {
    return [{
      type: 'GENERIC_RESULT',
      value: `${moduleName}-${target}`,
      data: {
        module: moduleName,
        target,
        status: 'completed',
        confidence: Math.random() * 0.5 + 0.5
      }
    }];
  }

  /**
   * Traite et sauvegarde les résultats du scan
   * @param {Array} scanResults - Résultats du scan
   * @param {string} investigationId - ID de l'investigation
   * @returns {Promise<Array>} Résultats traités
   */
  async processResults(scanResults, investigationId) {
    const processedResults = [];

    for (const result of scanResults) {
      try {
        // Sauvegarder le résultat
        const savedResult = await this.prisma.result.create({
          data: {
            investigationId,
            toolSource: this.name,
            data: result,
            score: this.calculateScore(result)
          }
        });

        processedResults.push(savedResult);

      } catch (error) {
        logger.warn(`🕷️ SpiderFoot: Erreur lors de la sauvegarde du résultat: ${error.message}`);
      }
    }

    return processedResults;
  }

  /**
   * Extrait les nouveaux indicateurs des résultats
   * @param {Array} scanResults - Résultats du scan
   * @param {string} investigationId - ID de l'investigation
   * @returns {Promise<number>} Nombre de nouveaux indicateurs
   */
  async extractNewIndicators(scanResults, investigationId) {
    let newIndicators = 0;

    for (const result of scanResults) {
      const extractedIndicators = this.extractIndicatorsFromResult(result);
      
      for (const indicator of extractedIndicators) {
        try {
          await this.prisma.indicator.create({
            data: {
              investigationId,
              type: indicator.type,
              value: indicator.value,
              source: this.name,
              confidence: indicator.confidence
            }
          });
          newIndicators++;
        } catch (error) {
          // Ignorer les doublons
          if (!error.message.includes('Unique constraint')) {
            logger.warn(`🕷️ SpiderFoot: Erreur lors de la sauvegarde de l'indicateur: ${error.message}`);
          }
        }
      }
    }

    return newIndicators;
  }

  /**
   * Extrait les indicateurs d'un résultat
   * @param {Object} result - Résultat du scan
   * @returns {Array} Liste des indicateurs extraits
   */
  extractIndicatorsFromResult(result) {
    const indicators = [];

    // Extraire les indicateurs basés sur le type de résultat
    switch (result.type) {
      case 'DOMAIN_NAME':
        indicators.push({
          type: IndicatorType.DOMAIN,
          value: result.value,
          confidence: 0.9
        });
        break;
      case 'IP_ADDRESS':
        indicators.push({
          type: IndicatorType.IP,
          value: result.value,
          confidence: 0.8
        });
        break;
      case 'EMAIL_ADDRESS':
        indicators.push({
          type: IndicatorType.EMAIL,
          value: result.value,
          confidence: 0.7
        });
        break;
      case 'SOCIAL_PROFILE':
        indicators.push({
          type: IndicatorType.USERNAME,
          value: result.value.split('@')[0],
          confidence: 0.6
        });
        break;
      case 'GITHUB_PROFILE':
        indicators.push({
          type: IndicatorType.USERNAME,
          value: result.value,
          confidence: 0.8
        });
        break;
    }

    // Extraire les indicateurs des données
    if (result.data) {
      const dataIndicators = this.extractIndicatorsFromData(result.data);
      indicators.push(...dataIndicators);
    }

    return indicators;
  }

  /**
   * Extrait les indicateurs des données d'un résultat
   * @param {Object} data - Données du résultat
   * @returns {Array} Liste des indicateurs extraits
   */
  extractIndicatorsFromData(data) {
    const indicators = [];

    // Extraire les domaines des URLs
    if (data.url && typeof data.url === 'string') {
      const domain = this.extractDomainFromUrl(data.url);
      if (domain) {
        indicators.push({
          type: IndicatorType.DOMAIN,
          value: domain,
          confidence: 0.7
        });
      }
    }

    // Extraire les emails
    if (data.email && typeof data.email === 'string') {
      indicators.push({
        type: IndicatorType.EMAIL,
        value: data.email,
        confidence: 0.8
      });
    }

    // Extraire les IPs
    if (data.ip && typeof data.ip === 'string') {
      indicators.push({
        type: IndicatorType.IP,
        value: data.ip,
        confidence: 0.8
      });
    }

    return indicators;
  }

  /**
   * Calcule le score de confiance d'un résultat
   * @param {Object} result - Résultat du scan
   * @returns {number} Score de confiance (0-1)
   */
  calculateScore(result) {
    let score = 0.5; // Score de base

    // Bonus pour les types de résultats fiables
    const reliableTypes = ['DOMAIN_NAME', 'IP_ADDRESS', 'CERTIFICATE'];
    if (reliableTypes.includes(result.type)) score += 0.2;

    // Bonus pour les données complètes
    if (result.data && Object.keys(result.data).length > 3) score += 0.15;

    // Bonus pour la confiance dans les données
    if (result.data && result.data.confidence) {
      score += result.data.confidence * 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Vérifie si une chaîne est un domaine
   * @param {string} str - Chaîne à vérifier
   * @returns {boolean} True si c'est un domaine
   */
  isDomain(str) {
    return /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(str);
  }

  /**
   * Vérifie si une chaîne est une IP
   * @param {string} str - Chaîne à vérifier
   * @returns {boolean} True si c'est une IP
   */
  isIP(str) {
    return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(str);
  }

  /**
   * Vérifie si une chaîne est un email
   * @param {string} str - Chaîne à vérifier
   * @returns {boolean} True si c'est un email
   */
  isEmail(str) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }

  /**
   * Vérifie si une chaîne est un username
   * @param {string} str - Chaîne à vérifier
   * @returns {boolean} True si c'est un username
   */
  isUsername(str) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(str);
  }

  /**
   * Extrait un domaine d'une URL
   * @param {string} url - URL
   * @returns {string|null} Domaine extrait
   */
  extractDomainFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return null;
    }
  }

  /**
   * Teste la connectivité du service
   * @returns {Promise<boolean>} True si le service est disponible
   */
  async testConnection() {
    try {
      // Simulation d'un test de connectivité
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      logger.error(`🕷️ SpiderFoot: Erreur de test de connectivité: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtient les statistiques du service
   * @returns {Promise<Object>} Statistiques
   */
  async getStats() {
    try {
      const totalResults = await this.prisma.result.count({
        where: { toolSource: this.name }
      });

      const recentResults = await this.prisma.result.count({
        where: {
          toolSource: this.name,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24h
          }
        }
      });

      return {
        totalResults,
        recentResults,
        status: 'active',
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`🕷️ SpiderFoot: Erreur lors de la récupération des stats: ${error.message}`);
      return {
        totalResults: 0,
        recentResults: 0,
        status: 'error',
        lastUpdate: new Date().toISOString()
      };
    }
  }
}

module.exports = SpiderFootService;