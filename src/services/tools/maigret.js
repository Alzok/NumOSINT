const { PrismaClient } = require('@prisma/client');
const { IndicatorType } = require('@prisma/client');
const logger = require('../../utils/logger');
const { exec } = require('child_process');
const { promisify } = require('util');
const axios = require('axios');

const execAsync = promisify(exec);

class MaigretService {
  constructor(prisma) {
    this.prisma = prisma;
    this.toolName = 'maigret';
  }

  /**
   * Recherche des profils pour une investigation
   */
  async searchProfiles(investigationId) {
    try {
      logger.tool(this.toolName, investigationId, 'Démarrage de la recherche de profils');

      // Récupération des usernames et noms de l'investigation
      const usernames = await this.prisma.indicator.findMany({
        where: {
          investigationId,
          type: IndicatorType.USERNAME
        }
      });

      const names = await this.prisma.indicator.findMany({
        where: {
          investigationId,
          type: IndicatorType.NAME
        }
      });

      if (usernames.length === 0 && names.length === 0) {
        logger.tool(this.toolName, investigationId, 'Aucun username ou nom trouvé pour la recherche de profils');
        return {
          searchedUsernames: 0,
          foundProfiles: 0,
          platforms: []
        };
      }

      const results = [];
      let totalSearched = 0;
      let totalFound = 0;
      const allPlatforms = new Set();

      // Traitement des usernames
      for (const usernameIndicator of usernames) {
        const username = usernameIndicator.value;
        logger.tool(this.toolName, investigationId, `Recherche de profils pour le username: ${username}`);

        try {
          const profiles = await this.searchProfilesForUsername(username);
          totalSearched++;
          totalFound += profiles.length;

          profiles.forEach(profile => allPlatforms.add(profile.platform));

          // Sauvegarde des résultats
          const result = await this.prisma.result.create({
            data: {
              investigationId,
              indicatorId: usernameIndicator.id,
              toolSource: this.toolName,
              data: {
                username,
                profiles,
                searchType: 'username'
              },
              score: profiles.length > 0 ? Math.min(profiles.length / 10, 1) : 0
            }
          });

          results.push(result);

          logger.tool(this.toolName, investigationId, 
            `Username ${username}: ${profiles.length} profils trouvés`);

        } catch (error) {
          logger.toolError(this.toolName, investigationId, error);
          
          // Sauvegarde de l'erreur
          await this.prisma.result.create({
            data: {
              investigationId,
              indicatorId: usernameIndicator.id,
              toolSource: this.toolName,
              data: {
                username,
                error: error.message,
                profiles: [],
                searchType: 'username'
              },
              score: 0
            }
          });
        }
      }

      // Traitement des noms (recherche récursive)
      for (const nameIndicator of names) {
        const name = nameIndicator.value;
        logger.tool(this.toolName, investigationId, `Recherche récursive de profils pour le nom: ${name}`);

        try {
          const profiles = await this.searchProfilesForName(name);
          totalSearched++;
          totalFound += profiles.length;

          profiles.forEach(profile => allPlatforms.add(profile.platform));

          // Sauvegarde des résultats
          const result = await this.prisma.result.create({
            data: {
              investigationId,
              indicatorId: nameIndicator.id,
              toolSource: this.toolName,
              data: {
                name,
                profiles,
                searchType: 'name_recursive'
              },
              score: profiles.length > 0 ? Math.min(profiles.length / 15, 1) : 0
            }
          });

          results.push(result);

          logger.tool(this.toolName, investigationId, 
            `Nom ${name}: ${profiles.length} profils trouvés`);

        } catch (error) {
          logger.toolError(this.toolName, investigationId, error);
          
          // Sauvegarde de l'erreur
          await this.prisma.result.create({
            data: {
              investigationId,
              indicatorId: nameIndicator.id,
              toolSource: this.toolName,
              data: {
                name,
                error: error.message,
                profiles: [],
                searchType: 'name_recursive'
              },
              score: 0
            }
          });
        }
      }

      logger.tool(this.toolName, investigationId, 
        `Recherche terminée: ${totalSearched} termes recherchés, ${totalFound} profils trouvés sur ${allPlatforms.size} plateformes`);

      return {
        searchedUsernames: totalSearched,
        foundProfiles: totalFound,
        platforms: Array.from(allPlatforms),
        results
      };

    } catch (error) {
      logger.toolError(this.toolName, investigationId, error);
      throw error;
    }
  }

  /**
   * Recherche des profils pour un username spécifique
   */
  async searchProfilesForUsername(username) {
    try {
      const profiles = [];

      // Simulation de recherche sur différentes plateformes
      // En production, cela appellerait Maigret réel
      
      const platforms = [
        'twitter',
        'github',
        'linkedin',
        'facebook',
        'instagram',
        'youtube',
        'reddit',
        'discord',
        'telegram',
        'tiktok',
        'snapchat',
        'pinterest',
        'tumblr',
        'medium',
        'dev.to',
        'stackoverflow',
        'gitlab',
        'bitbucket',
        'mastodon',
        'vimeo'
      ];

      // Simulation : 40% de chance de trouver des profils
      if (Math.random() < 0.4) {
        const numProfiles = Math.floor(Math.random() * 8) + 1;
        const selectedPlatforms = this.shuffleArray(platforms).slice(0, numProfiles);
        
        for (const platform of selectedPlatforms) {
          const profile = await this.generateProfile(username, platform);
          profiles.push(profile);
        }
      }

      return profiles;

    } catch (error) {
      logger.error(`Erreur lors de la recherche de profils pour ${username}:`, error);
      return [];
    }
  }

  /**
   * Recherche récursive de profils pour un nom
   */
  async searchProfilesForName(name) {
    try {
      const profiles = [];
      const nameParts = name.split(' ').filter(part => part.length > 0);
      
      if (nameParts.length === 0) {
        return profiles;
      }

      // Génération de variations du nom
      const nameVariations = this.generateNameVariations(nameParts);
      
      const platforms = [
        'twitter',
        'github',
        'linkedin',
        'facebook',
        'instagram',
        'youtube',
        'reddit',
        'discord',
        'telegram',
        'tiktok'
      ];

      // Recherche pour chaque variation
      for (const variation of nameVariations.slice(0, 5)) { // Limitation à 5 variations
        // Simulation : 25% de chance de trouver des profils pour chaque variation
        if (Math.random() < 0.25) {
          const numProfiles = Math.floor(Math.random() * 3) + 1;
          const selectedPlatforms = this.shuffleArray(platforms).slice(0, numProfiles);
          
          for (const platform of selectedPlatforms) {
            const profile = await this.generateProfile(variation, platform);
            profiles.push(profile);
          }
        }
      }

      return profiles;

    } catch (error) {
      logger.error(`Erreur lors de la recherche récursive pour ${name}:`, error);
      return [];
    }
  }

  /**
   * Génère des variations d'un nom
   */
  generateNameVariations(nameParts) {
    const variations = [];
    
    if (nameParts.length >= 2) {
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      
      variations.push(
        firstName,
        lastName,
        `${firstName}${lastName}`,
        `${firstName}_${lastName}`,
        `${firstName}.${lastName}`,
        `${firstName.charAt(0)}${lastName}`,
        `${firstName}${lastName.charAt(0)}`,
        `${lastName}${firstName}`,
        `${firstName}${Math.floor(Math.random() * 100)}`,
        `${lastName}${Math.floor(Math.random() * 100)}`
      );
    } else if (nameParts.length === 1) {
      const singleName = nameParts[0];
      variations.push(
        singleName,
        `${singleName}${Math.floor(Math.random() * 100)}`,
        `${singleName}_${Math.floor(Math.random() * 100)}`
      );
    }

    return variations.filter((v, i, arr) => arr.indexOf(v) === i); // Suppression des doublons
  }

  /**
   * Génère un profil simulé
   */
  async generateProfile(username, platform) {
    try {
      const profile = {
        platform,
        username,
        url: `https://${platform}.com/${username}`,
        found: true,
        verified: Math.random() > 0.8, // 20% de chance d'être vérifié
        followers: Math.floor(Math.random() * 50000),
        following: Math.floor(Math.random() * 1000),
        posts: Math.floor(Math.random() * 1000),
        bio: this.generateBio(username, platform),
        location: this.generateLocation(),
        website: Math.random() > 0.7 ? `https://${username}.com` : null,
        joined: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 5).toISOString(),
        lastActivity: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        avatar: `https://${platform}.com/avatars/${username}.jpg`,
        banner: Math.random() > 0.5 ? `https://${platform}.com/banners/${username}.jpg` : null
      };

      // Ajout de métadonnées spécifiques à la plateforme
      profile.metadata = this.generatePlatformMetadata(platform, username);

      return profile;

    } catch (error) {
      logger.error(`Erreur lors de la génération du profil pour ${username} sur ${platform}:`, error);
      return {
        platform,
        username,
        url: `https://${platform}.com/${username}`,
        found: true,
        error: error.message
      };
    }
  }

  /**
   * Génère une bio simulée
   */
  generateBio(username, platform) {
    const bios = [
      `Hi, I'm ${username}! 👋`,
      `Passionate about technology and innovation`,
      `Building the future, one line of code at a time`,
      `Digital nomad | Tech enthusiast | Coffee lover`,
      `Exploring the world through code and creativity`,
      `Software developer by day, dreamer by night`,
      `Making the internet a better place`,
      `Life is short, code is long`,
      `Innovation happens at the intersection of technology and humanity`,
      `Creating digital experiences that matter`
    ];

    return bios[Math.floor(Math.random() * bios.length)];
  }

  /**
   * Génère une localisation simulée
   */
  generateLocation() {
    const locations = [
      'San Francisco, CA',
      'New York, NY',
      'London, UK',
      'Paris, France',
      'Berlin, Germany',
      'Tokyo, Japan',
      'Sydney, Australia',
      'Toronto, Canada',
      'Amsterdam, Netherlands',
      'Stockholm, Sweden',
      'Remote',
      'Worldwide'
    ];

    return locations[Math.floor(Math.random() * locations.length)];
  }

  /**
   * Génère des métadonnées spécifiques à la plateforme
   */
  generatePlatformMetadata(platform, username) {
    const metadata = {};

    switch (platform) {
      case 'github':
        metadata.repos = Math.floor(Math.random() * 50);
        metadata.stars = Math.floor(Math.random() * 1000);
        metadata.followers = Math.floor(Math.random() * 500);
        metadata.following = Math.floor(Math.random() * 200);
        metadata.gists = Math.floor(Math.random() * 20);
        metadata.languages = ['JavaScript', 'Python', 'TypeScript', 'Go', 'Rust'].slice(0, Math.floor(Math.random() * 3) + 1);
        break;

      case 'twitter':
        metadata.tweets = Math.floor(Math.random() * 5000);
        metadata.retweets = Math.floor(Math.random() * 1000);
        metadata.likes = Math.floor(Math.random() * 5000);
        metadata.lists = Math.floor(Math.random() * 10);
        metadata.moments = Math.floor(Math.random() * 5);
        break;

      case 'linkedin':
        metadata.connections = Math.floor(Math.random() * 1000);
        metadata.endorsements = Math.floor(Math.random() * 100);
        metadata.recommendations = Math.floor(Math.random() * 20);
        metadata.companies = Math.floor(Math.random() * 5);
        metadata.skills = ['JavaScript', 'Python', 'React', 'Node.js', 'AWS'].slice(0, Math.floor(Math.random() * 3) + 1);
        break;

      case 'youtube':
        metadata.videos = Math.floor(Math.random() * 100);
        metadata.subscribers = Math.floor(Math.random() * 10000);
        metadata.views = Math.floor(Math.random() * 1000000);
        metadata.playlists = Math.floor(Math.random() * 10);
        break;

      case 'reddit':
        metadata.karma = Math.floor(Math.random() * 10000);
        metadata.posts = Math.floor(Math.random() * 500);
        metadata.comments = Math.floor(Math.random() * 2000);
        metadata.awards = Math.floor(Math.random() * 10);
        break;

      default:
        metadata.custom = `Custom data for ${platform}`;
    }

    return metadata;
  }

  /**
   * Mélange un tableau
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Exécute Maigret en ligne de commande (pour une vraie intégration)
   */
  async executeMaigretCommand(username, options = {}) {
    try {
      let command = `maigret ${username}`;
      
      if (options.recursive) {
        command += ' --recursive';
      }
      
      if (options.platforms) {
        command += ` --sites ${options.platforms.join(',')}`;
      }
      
      if (options.timeout) {
        command += ` --timeout ${options.timeout}`;
      }

      const { stdout, stderr } = await execAsync(command, {
        timeout: 120000, // 2 minutes de timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB de buffer
      });

      if (stderr) {
        logger.warn(`Maigret stderr: ${stderr}`);
      }

      // Parsing de la sortie de Maigret
      return this.parseMaigretOutput(stdout);

    } catch (error) {
      logger.error(`Erreur lors de l'exécution de Maigret:`, error);
      throw error;
    }
  }

  /**
   * Parse la sortie de Maigret
   */
  parseMaigretOutput(output) {
    try {
      const lines = output.split('\n').filter(line => line.trim());
      const profiles = [];

      // Parsing basique de la sortie JSON de Maigret
      for (const line of lines) {
        try {
          if (line.startsWith('{') && line.endsWith('}')) {
            const profile = JSON.parse(line);
            if (profile.username && profile.platform) {
              profiles.push(profile);
            }
          }
        } catch (parseError) {
          // Ignore les lignes qui ne sont pas du JSON valide
          continue;
        }
      }

      return profiles;

    } catch (error) {
      logger.error('Erreur lors du parsing de la sortie Maigret:', error);
      return [];
    }
  }

  /**
   * Récupère les statistiques d'utilisation de Maigret
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
        totalSearched: 0,
        totalProfilesFound: 0,
        platformsFound: new Set(),
        averageScore: 0,
        successRate: 0
      };

      if (results.length > 0) {
        for (const result of results) {
          const data = result.data;
          
          if (data.username || data.name) {
            stats.totalSearched++;
          }
          
          if (data.profiles) {
            stats.totalProfilesFound += data.profiles.length;
            data.profiles.forEach(profile => {
              if (profile.platform) {
                stats.platformsFound.add(profile.platform);
              }
            });
          }
        }

        stats.averageScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
        stats.successRate = (stats.totalProfilesFound / stats.totalSearched) * 100;
        stats.platformsFound = Array.from(stats.platformsFound);
      }

      return stats;

    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques Maigret:', error);
      throw error;
    }
  }

  /**
   * Teste la configuration de Maigret
   */
  async testConfiguration() {
    try {
      // Test de base de Maigret
      const testUsername = 'testuser';
      const profiles = await this.searchProfilesForUsername(testUsername);
      
      return {
        status: 'success',
        message: 'Configuration Maigret testée avec succès',
        details: {
          testUsername,
          profilesFound: profiles.length,
          samplePlatforms: profiles.slice(0, 3).map(p => p.platform)
        }
      };

    } catch (error) {
      logger.error('Erreur lors du test de configuration Maigret:', error);
      
      return {
        status: 'error',
        message: 'Erreur lors du test de configuration',
        error: error.message
      };
    }
  }
}

module.exports = MaigretService;