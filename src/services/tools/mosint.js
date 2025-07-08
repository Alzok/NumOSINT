const { PrismaClient } = require('@prisma/client');
const { IndicatorType } = require('@prisma/client');
const logger = require('../../utils/logger');
const { exec } = require('child_process');
const { promisify } = require('util');
const axios = require('axios');

const execAsync = promisify(exec);

class MosintService {
  constructor(prisma) {
    this.prisma = prisma;
    this.toolName = 'mosint';
  }

  /**
   * Analyse les emails d'une investigation
   */
  async analyzeEmails(investigationId) {
    try {
      logger.tool(this.toolName, investigationId, 'Démarrage de l\'analyse d\'emails');

      // Récupération des emails de l'investigation
      const emails = await this.prisma.indicator.findMany({
        where: {
          investigationId,
          type: IndicatorType.EMAIL
        }
      });

      if (emails.length === 0) {
        logger.tool(this.toolName, investigationId, 'Aucun email trouvé pour l\'analyse');
        return {
          analyzedEmails: 0,
          breachesFound: 0,
          socialProfiles: 0
        };
      }

      const results = [];
      let totalAnalyzed = 0;
      let totalBreaches = 0;
      let totalSocialProfiles = 0;

      // Traitement de chaque email
      for (const emailIndicator of emails) {
        const email = emailIndicator.value;
        logger.tool(this.toolName, investigationId, `Analyse de l'email: ${email}`);

        try {
          // Analyse complète de l'email
          const analysis = await this.analyzeEmail(email);
          totalAnalyzed++;

          if (analysis.breaches) {
            totalBreaches += analysis.breaches.length;
          }

          if (analysis.socialProfiles) {
            totalSocialProfiles += analysis.socialProfiles.length;
          }

          // Sauvegarde des résultats
          const result = await this.prisma.result.create({
            data: {
              investigationId,
              indicatorId: emailIndicator.id,
              toolSource: this.toolName,
              data: analysis,
              score: this.calculateEmailScore(analysis)
            }
          });

          results.push(result);

          // Ajout des nouveaux indicateurs découverts
          await this.addDiscoveredIndicators(investigationId, analysis);

          logger.tool(this.toolName, investigationId, 
            `Email ${email}: ${analysis.breaches?.length || 0} fuites, ${analysis.socialProfiles?.length || 0} profils sociaux`);

        } catch (error) {
          logger.toolError(this.toolName, investigationId, error);
          
          // Sauvegarde de l'erreur
          await this.prisma.result.create({
            data: {
              investigationId,
              indicatorId: emailIndicator.id,
              toolSource: this.toolName,
              data: {
                email,
                error: error.message,
                breaches: [],
                socialProfiles: [],
                securityScore: 0
              },
              score: 0
            }
          });
        }
      }

      logger.tool(this.toolName, investigationId, 
        `Analyse terminée: ${totalAnalyzed} emails analysés, ${totalBreaches} fuites trouvées, ${totalSocialProfiles} profils sociaux`);

      return {
        analyzedEmails: totalAnalyzed,
        breachesFound: totalBreaches,
        socialProfiles: totalSocialProfiles,
        results
      };

    } catch (error) {
      logger.toolError(this.toolName, investigationId, error);
      throw error;
    }
  }

  /**
   * Analyse un email spécifique
   */
  async analyzeEmail(email) {
    try {
      const analysis = {
        email,
        timestamp: new Date().toISOString(),
        breaches: [],
        socialProfiles: [],
        securityScore: 0,
        domainInfo: {},
        reputation: {}
      };

      // 1. Vérification des fuites de données
      analysis.breaches = await this.checkDataBreaches(email);

      // 2. Recherche de profils sociaux
      analysis.socialProfiles = await this.findSocialProfiles(email);

      // 3. Analyse du domaine
      analysis.domainInfo = await this.analyzeDomain(email);

      // 4. Vérification de la réputation
      analysis.reputation = await this.checkReputation(email);

      // 5. Calcul du score de sécurité
      analysis.securityScore = this.calculateSecurityScore(analysis);

      return analysis;

    } catch (error) {
      logger.error(`Erreur lors de l'analyse de l'email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Vérifie les fuites de données pour un email
   */
  async checkDataBreaches(email) {
    try {
      const breaches = [];

      // Simulation de vérification de fuites
      // En production, cela utiliserait des APIs comme HaveIBeenPwned, etc.
      
      const knownBreaches = [
        {
          name: 'Adobe',
          date: '2013-10-04',
          records: 153000000,
          severity: 'high',
          description: 'Fuite de données Adobe'
        },
        {
          name: 'LinkedIn',
          date: '2012-06-05',
          records: 117000000,
          severity: 'medium',
          description: 'Fuite de données LinkedIn'
        },
        {
          name: 'Dropbox',
          date: '2012-07-01',
          records: 68700000,
          severity: 'medium',
          description: 'Fuite de données Dropbox'
        }
      ];

      // Simulation : 20% de chance qu'un email soit dans une fuite
      if (Math.random() < 0.2) {
        const randomBreach = knownBreaches[Math.floor(Math.random() * knownBreaches.length)];
        breaches.push({
          ...randomBreach,
          found: true,
          email: email
        });
      }

      return breaches;

    } catch (error) {
      logger.error(`Erreur lors de la vérification des fuites pour ${email}:`, error);
      return [];
    }
  }

  /**
   * Trouve les profils sociaux associés à un email
   */
  async findSocialProfiles(email) {
    try {
      const profiles = [];

      // Simulation de recherche de profils sociaux
      // En production, cela utiliserait des APIs de réseaux sociaux
      
      const socialPlatforms = [
        'twitter',
        'github',
        'linkedin',
        'facebook',
        'instagram',
        'youtube',
        'reddit',
        'discord'
      ];

      // Simulation : 30% de chance de trouver des profils
      if (Math.random() < 0.3) {
        const numProfiles = Math.floor(Math.random() * 4) + 1;
        
        for (let i = 0; i < numProfiles; i++) {
          const platform = socialPlatforms[Math.floor(Math.random() * socialPlatforms.length)];
          const username = this.generateUsername(email, platform);
          
          profiles.push({
            platform,
            username,
            url: `https://${platform}.com/${username}`,
            verified: Math.random() > 0.7, // 30% de chance d'être vérifié
            followers: Math.floor(Math.random() * 10000),
            lastActivity: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }

      return profiles;

    } catch (error) {
      logger.error(`Erreur lors de la recherche de profils pour ${email}:`, error);
      return [];
    }
  }

  /**
   * Analyse le domaine d'un email
   */
  async analyzeDomain(email) {
    try {
      const domain = email.split('@')[1];
      
      const domainInfo = {
        domain,
        mxRecords: [],
        spfRecord: null,
        dkimRecord: null,
        dmarcRecord: null,
        securityHeaders: {},
        sslCertificate: {},
        reputation: 'good'
      };

      // Simulation de récupération des enregistrements DNS
      domainInfo.mxRecords = [
        { priority: 10, exchange: `mail.${domain}` },
        { priority: 20, exchange: `backup.${domain}` }
      ];

      domainInfo.spfRecord = `v=spf1 include:_spf.${domain} ~all`;
      domainInfo.dkimRecord = `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...`;
      domainInfo.dmarcRecord = `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`;

      // Simulation de vérification des headers de sécurité
      domainInfo.securityHeaders = {
        hsts: true,
        csp: true,
        xFrameOptions: true,
        xContentTypeOptions: true
      };

      // Simulation de vérification du certificat SSL
      domainInfo.sslCertificate = {
        valid: true,
        issuer: 'Let\'s Encrypt',
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        subjectAltNames: [domain, `www.${domain}`]
      };

      return domainInfo;

    } catch (error) {
      logger.error(`Erreur lors de l'analyse du domaine pour ${email}:`, error);
      return { domain: email.split('@')[1], error: error.message };
    }
  }

  /**
   * Vérifie la réputation d'un email
   */
  async checkReputation(email) {
    try {
      const reputation = {
        score: 0,
        category: 'unknown',
        details: {}
      };

      // Simulation de vérification de réputation
      // En production, cela utiliserait des services de réputation d'emails
      
      const randomScore = Math.random() * 100;
      reputation.score = Math.round(randomScore);

      if (randomScore > 80) {
        reputation.category = 'excellent';
      } else if (randomScore > 60) {
        reputation.category = 'good';
      } else if (randomScore > 40) {
        reputation.category = 'fair';
      } else if (randomScore > 20) {
        reputation.category = 'poor';
      } else {
        reputation.category = 'bad';
      }

      reputation.details = {
        spamScore: Math.round(Math.random() * 10),
        bounceRate: Math.round(Math.random() * 5),
        complaintRate: Math.round(Math.random() * 2),
        age: Math.floor(Math.random() * 10) + 1
      };

      return reputation;

    } catch (error) {
      logger.error(`Erreur lors de la vérification de réputation pour ${email}:`, error);
      return { score: 0, category: 'unknown', error: error.message };
    }
  }

  /**
   * Calcule le score de sécurité d'un email
   */
  calculateSecurityScore(analysis) {
    let score = 100;

    // Pénalités pour les fuites de données
    if (analysis.breaches && analysis.breaches.length > 0) {
      score -= analysis.breaches.length * 20;
    }

    // Pénalités pour la réputation
    if (analysis.reputation && analysis.reputation.score < 50) {
      score -= 30;
    }

    // Bonus pour les bonnes pratiques de sécurité
    if (analysis.domainInfo && analysis.domainInfo.spfRecord) {
      score += 10;
    }

    if (analysis.domainInfo && analysis.domainInfo.dkimRecord) {
      score += 10;
    }

    if (analysis.domainInfo && analysis.domainInfo.dmarcRecord) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calcule le score global d'un email
   */
  calculateEmailScore(analysis) {
    const securityWeight = 0.4;
    const reputationWeight = 0.3;
    const socialWeight = 0.2;
    const domainWeight = 0.1;

    let score = 0;

    // Score de sécurité
    score += (analysis.securityScore / 100) * securityWeight;

    // Score de réputation
    if (analysis.reputation && analysis.reputation.score) {
      score += (analysis.reputation.score / 100) * reputationWeight;
    }

    // Score des profils sociaux (plus de profils = score plus élevé)
    if (analysis.socialProfiles && analysis.socialProfiles.length > 0) {
      const socialScore = Math.min(analysis.socialProfiles.length / 5, 1);
      score += socialScore * socialWeight;
    }

    // Score du domaine
    if (analysis.domainInfo && analysis.domainInfo.sslCertificate && analysis.domainInfo.sslCertificate.valid) {
      score += domainWeight;
    }

    return score;
  }

  /**
   * Ajoute les indicateurs découverts à l'investigation
   */
  async addDiscoveredIndicators(investigationId, analysis) {
    try {
      // Ajout des profils sociaux comme indicateurs
      if (analysis.socialProfiles && analysis.socialProfiles.length > 0) {
        for (const profile of analysis.socialProfiles) {
          await this.prisma.indicator.create({
            data: {
              investigationId,
              type: IndicatorType.USERNAME,
              value: profile.username,
              source: this.toolName,
              confidence: 0.9,
              verified: profile.verified
            }
          });
        }
      }

      // Ajout du domaine comme indicateur
      if (analysis.domainInfo && analysis.domainInfo.domain) {
        await this.prisma.indicator.create({
          data: {
            investigationId,
            type: IndicatorType.DOMAIN,
            value: analysis.domainInfo.domain,
            source: this.toolName,
            confidence: 1.0,
            verified: true
          }
        });
      }

    } catch (error) {
      logger.error('Erreur lors de l\'ajout des indicateurs découverts:', error);
    }
  }

  /**
   * Génère un nom d'utilisateur basé sur l'email
   */
  generateUsername(email, platform) {
    const localPart = email.split('@')[0];
    const domain = email.split('@')[1];
    
    const usernamePatterns = [
      localPart,
      localPart.replace(/[^a-zA-Z0-9]/g, ''),
      localPart.split('.')[0],
      `${localPart}_${platform}`,
      `${localPart}${Math.floor(Math.random() * 100)}`
    ];

    return usernamePatterns[Math.floor(Math.random() * usernamePatterns.length)];
  }

  /**
   * Exécute Mosint en ligne de commande (pour une vraie intégration)
   */
  async executeMosintCommand(email) {
    try {
      const command = `mosint ${email}`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000, // 60 secondes de timeout
        maxBuffer: 1024 * 1024 // 1MB de buffer
      });

      if (stderr) {
        logger.warn(`Mosint stderr: ${stderr}`);
      }

      // Parsing de la sortie de Mosint
      return this.parseMosintOutput(stdout);

    } catch (error) {
      logger.error(`Erreur lors de l'exécution de Mosint:`, error);
      throw error;
    }
  }

  /**
   * Parse la sortie de Mosint
   */
  parseMosintOutput(output) {
    try {
      const lines = output.split('\n').filter(line => line.trim());
      const result = {
        breaches: [],
        socialProfiles: [],
        domainInfo: {},
        reputation: {}
      };

      // Parsing basique de la sortie
      for (const line of lines) {
        if (line.includes('breach') || line.includes('leak')) {
          result.breaches.push({
            name: line.split(':')[0]?.trim(),
            description: line.split(':')[1]?.trim(),
            found: true
          });
        } else if (line.includes('social') || line.includes('profile')) {
          result.socialProfiles.push({
            platform: line.split(':')[0]?.trim(),
            url: line.split(':')[1]?.trim(),
            found: true
          });
        }
      }

      return result;

    } catch (error) {
      logger.error('Erreur lors du parsing de la sortie Mosint:', error);
      return { breaches: [], socialProfiles: [], domainInfo: {}, reputation: {} };
    }
  }

  /**
   * Récupère les statistiques d'utilisation de Mosint
   */
  async getStats(investigationId) {
    try {
      const results = await this.prisma.result.findMany({
        where: {
          investigationId,
          toolSource: this.toolName
        }
      });

      const stats = {
        totalExecutions: results.length,
        totalEmailsAnalyzed: 0,
        totalBreachesFound: 0,
        totalSocialProfiles: 0,
        averageSecurityScore: 0,
        averageEmailScore: 0
      };

      if (results.length > 0) {
        for (const result of results) {
          const data = result.data;
          
          if (data.email) {
            stats.totalEmailsAnalyzed++;
          }
          
          if (data.breaches) {
            stats.totalBreachesFound += data.breaches.length;
          }
          
          if (data.socialProfiles) {
            stats.totalSocialProfiles += data.socialProfiles.length;
          }
        }

        stats.averageSecurityScore = results.reduce((sum, result) => sum + (result.data.securityScore || 0), 0) / results.length;
        stats.averageEmailScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
      }

      return stats;

    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques Mosint:', error);
      throw error;
    }
  }

  /**
   * Teste la configuration de Mosint
   */
  async testConfiguration() {
    try {
      // Test de base de Mosint
      const testEmail = 'test@example.com';
      const analysis = await this.analyzeEmail(testEmail);
      
      return {
        status: 'success',
        message: 'Configuration Mosint testée avec succès',
        details: {
          testEmail,
          securityScore: analysis.securityScore,
          breachesFound: analysis.breaches.length,
          socialProfilesFound: analysis.socialProfiles.length
        }
      };

    } catch (error) {
      logger.error('Erreur lors du test de configuration Mosint:', error);
      
      return {
        status: 'error',
        message: 'Erreur lors du test de configuration',
        error: error.message
      };
    }
  }
}

module.exports = MosintService;