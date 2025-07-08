const logger = require('../../utils/logger');
const { IndicatorType } = require('@prisma/client');

/**
 * Service PhoneInfoga pour l'analyse de numéros de téléphone
 * Fournit des informations sur l'opérateur, la géolocalisation, et autres détails
 */
class PhoneInfogaService {
  constructor(prisma) {
    this.prisma = prisma;
    this.name = 'phoneinfoga';
    this.description = 'Analyse de numéros de téléphone avec informations opérateur et géolocalisation';
  }

  /**
   * Analyse les numéros de téléphone d'une investigation
   * @param {string} investigationId - ID de l'investigation
   * @returns {Promise<Object>} Résultats de l'analyse
   */
  async analyzePhones(investigationId) {
    try {
      logger.info(`📱 PhoneInfoga: Démarrage de l'analyse pour l'investigation ${investigationId}`);

      // Récupérer les indicateurs de téléphone
      const phoneIndicators = await this.prisma.indicator.findMany({
        where: {
          investigationId,
          type: IndicatorType.PHONE
        }
      });

      if (phoneIndicators.length === 0) {
        logger.info(`📱 PhoneInfoga: Aucun numéro de téléphone à analyser`);
        return {
          analyzedPhones: 0,
          newIndicators: 0,
          results: []
        };
      }

      const results = [];
      let newIndicators = 0;

      // Analyser chaque numéro de téléphone
      for (const phoneIndicator of phoneIndicators) {
        try {
          const phoneAnalysis = await this.analyzeSinglePhone(phoneIndicator.value);
          
          // Sauvegarder le résultat
          const result = await this.prisma.result.create({
            data: {
              investigationId,
              indicatorId: phoneIndicator.id,
              toolSource: this.name,
              data: phoneAnalysis,
              score: this.calculateScore(phoneAnalysis)
            }
          });

          results.push(result);

          // Extraire et sauvegarder les nouveaux indicateurs
          const extractedIndicators = this.extractIndicators(phoneAnalysis);
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
                logger.warn(`📱 PhoneInfoga: Erreur lors de la sauvegarde de l'indicateur: ${error.message}`);
              }
            }
          }

          logger.info(`📱 PhoneInfoga: Analyse terminée pour ${phoneIndicator.value}`);

        } catch (error) {
          logger.error(`📱 PhoneInfoga: Erreur lors de l'analyse de ${phoneIndicator.value}: ${error.message}`);
        }
      }

      logger.info(`📱 PhoneInfoga: Analyse terminée - ${results.length} résultats, ${newIndicators} nouveaux indicateurs`);

      return {
        analyzedPhones: results.length,
        newIndicators,
        results
      };

    } catch (error) {
      logger.error(`📱 PhoneInfoga: Erreur générale: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyse un numéro de téléphone individuel
   * @param {string} phoneNumber - Numéro de téléphone à analyser
   * @returns {Promise<Object>} Données d'analyse
   */
  async analyzeSinglePhone(phoneNumber) {
    try {
      // Normaliser le numéro de téléphone
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      
      // Simulation de l'analyse PhoneInfoga
      // En production, cela appellerait l'API PhoneInfoga
      const analysis = await this.simulatePhoneInfogaAnalysis(normalizedPhone);
      
      return {
        phoneNumber: normalizedPhone,
        originalNumber: phoneNumber,
        analysis: analysis,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`📱 PhoneInfoga: Erreur lors de l'analyse de ${phoneNumber}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Normalise un numéro de téléphone
   * @param {string} phoneNumber - Numéro de téléphone
   * @returns {string} Numéro normalisé
   */
  normalizePhoneNumber(phoneNumber) {
    // Supprimer tous les caractères non numériques sauf le +
    let normalized = phoneNumber.replace(/[^\d+]/g, '');
    
    // Ajouter le préfixe + si absent
    if (!normalized.startsWith('+')) {
      // Supposer que c'est un numéro français si pas de préfixe
      if (normalized.startsWith('0')) {
        normalized = '+33' + normalized.substring(1);
      } else {
        normalized = '+' + normalized;
      }
    }
    
    return normalized;
  }

  /**
   * Simule l'analyse PhoneInfoga
   * @param {string} phoneNumber - Numéro de téléphone normalisé
   * @returns {Promise<Object>} Résultats simulés
   */
  async simulatePhoneInfogaAnalysis(phoneNumber) {
    // Simulation d'un délai d'analyse
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Détection du pays basée sur le préfixe
    const countryInfo = this.detectCountry(phoneNumber);
    
    // Simulation des données d'opérateur
    const carrierInfo = this.simulateCarrierInfo(phoneNumber);
    
    // Simulation des données de géolocalisation
    const geolocationInfo = this.simulateGeolocation(phoneNumber);
    
    // Simulation des données de validation
    const validationInfo = this.simulateValidation(phoneNumber);

    return {
      country: countryInfo,
      carrier: carrierInfo,
      geolocation: geolocationInfo,
      validation: validationInfo,
      metadata: {
        format: this.detectFormat(phoneNumber),
        type: this.detectType(phoneNumber),
        risk: this.calculateRisk(phoneNumber)
      }
    };
  }

  /**
   * Détecte le pays basé sur le préfixe
   * @param {string} phoneNumber - Numéro de téléphone
   * @returns {Object} Informations du pays
   */
  detectCountry(phoneNumber) {
    const countryCodes = {
      '+33': { name: 'France', code: 'FR', flag: '🇫🇷' },
      '+1': { name: 'United States', code: 'US', flag: '🇺🇸' },
      '+44': { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
      '+49': { name: 'Germany', code: 'DE', flag: '🇩🇪' },
      '+34': { name: 'Spain', code: 'ES', flag: '🇪🇸' },
      '+39': { name: 'Italy', code: 'IT', flag: '🇮🇹' },
      '+32': { name: 'Belgium', code: 'BE', flag: '🇧🇪' },
      '+41': { name: 'Switzerland', code: 'CH', flag: '🇨🇭' },
      '+31': { name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
      '+46': { name: 'Sweden', code: 'SE', flag: '🇸🇪' }
    };

    for (const [code, info] of Object.entries(countryCodes)) {
      if (phoneNumber.startsWith(code)) {
        return info;
      }
    }

    return { name: 'Unknown', code: 'UN', flag: '🌍' };
  }

  /**
   * Simule les informations d'opérateur
   * @param {string} phoneNumber - Numéro de téléphone
   * @returns {Object} Informations d'opérateur
   */
  simulateCarrierInfo(phoneNumber) {
    const carriers = [
      { name: 'Orange', type: 'Mobile', confidence: 0.95 },
      { name: 'SFR', type: 'Mobile', confidence: 0.92 },
      { name: 'Bouygues Telecom', type: 'Mobile', confidence: 0.89 },
      { name: 'Free Mobile', type: 'Mobile', confidence: 0.87 },
      { name: 'AT&T', type: 'Mobile', confidence: 0.85 },
      { name: 'Verizon', type: 'Mobile', confidence: 0.83 },
      { name: 'T-Mobile', type: 'Mobile', confidence: 0.81 },
      { name: 'Vodafone', type: 'Mobile', confidence: 0.79 },
      { name: 'Tele2', type: 'Mobile', confidence: 0.77 },
      { name: 'Unknown', type: 'Unknown', confidence: 0.5 }
    ];

    // Sélection basée sur le hash du numéro pour la cohérence
    const hash = phoneNumber.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const carrier = carriers[hash % carriers.length];

    return {
      name: carrier.name,
      type: carrier.type,
      confidence: carrier.confidence,
      mcc: this.generateMCC(phoneNumber),
      mnc: this.generateMNC(phoneNumber)
    };
  }

  /**
   * Simule les informations de géolocalisation
   * @param {string} phoneNumber - Numéro de téléphone
   * @returns {Object} Informations de géolocalisation
   */
  simulateGeolocation(phoneNumber) {
    const locations = [
      { city: 'Paris', region: 'Île-de-France', country: 'France', coordinates: { lat: 48.8566, lng: 2.3522 } },
      { city: 'Lyon', region: 'Auvergne-Rhône-Alpes', country: 'France', coordinates: { lat: 45.7578, lng: 4.8320 } },
      { city: 'Marseille', region: 'Provence-Alpes-Côte d\'Azur', country: 'France', coordinates: { lat: 43.2965, lng: 5.3698 } },
      { city: 'Toulouse', region: 'Occitanie', country: 'France', coordinates: { lat: 43.6047, lng: 1.4442 } },
      { city: 'Nice', region: 'Provence-Alpes-Côte d\'Azur', country: 'France', coordinates: { lat: 43.7102, lng: 7.2620 } },
      { city: 'New York', region: 'New York', country: 'United States', coordinates: { lat: 40.7128, lng: -74.0060 } },
      { city: 'London', region: 'England', country: 'United Kingdom', coordinates: { lat: 51.5074, lng: -0.1278 } },
      { city: 'Berlin', region: 'Berlin', country: 'Germany', coordinates: { lat: 52.5200, lng: 13.4050 } },
      { city: 'Madrid', region: 'Madrid', country: 'Spain', coordinates: { lat: 40.4168, lng: -3.7038 } },
      { city: 'Rome', region: 'Lazio', country: 'Italy', coordinates: { lat: 41.9028, lng: 12.4964 } }
    ];

    const hash = phoneNumber.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const location = locations[hash % locations.length];

    return {
      ...location,
      accuracy: Math.floor(Math.random() * 50) + 10, // 10-60 km
      confidence: Math.random() * 0.3 + 0.7 // 0.7-1.0
    };
  }

  /**
   * Simule les informations de validation
   * @param {string} phoneNumber - Numéro de téléphone
   * @returns {Object} Informations de validation
   */
  simulateValidation(phoneNumber) {
    const isValid = phoneNumber.length >= 10 && phoneNumber.length <= 15;
    const isMobile = this.isMobileNumber(phoneNumber);
    const isLandline = !isMobile;

    return {
      valid: isValid,
      format: isValid ? 'valid' : 'invalid',
      type: isMobile ? 'mobile' : 'landline',
      length: phoneNumber.length,
      checks: {
        length: phoneNumber.length >= 10,
        format: /^\+[\d]+$/.test(phoneNumber),
        countryCode: phoneNumber.startsWith('+')
      }
    };
  }

  /**
   * Détecte le format du numéro
   * @param {string} phoneNumber - Numéro de téléphone
   * @returns {string} Format détecté
   */
  detectFormat(phoneNumber) {
    if (phoneNumber.match(/^\+33[1-9]\d{8}$/)) {
      return 'French Mobile';
    } else if (phoneNumber.match(/^\+1\d{10}$/)) {
      return 'US/Canada';
    } else if (phoneNumber.match(/^\+44\d{10}$/)) {
      return 'UK';
    } else {
      return 'International';
    }
  }

  /**
   * Détecte le type de numéro
   * @param {string} phoneNumber - Numéro de téléphone
   * @returns {string} Type de numéro
   */
  detectType(phoneNumber) {
    // Logique simplifiée pour détecter mobile vs fixe
    if (phoneNumber.includes('+33')) {
      const mobilePrefixes = ['6', '7'];
      const digit = phoneNumber.charAt(4);
      return mobilePrefixes.includes(digit) ? 'mobile' : 'landline';
    }
    return 'unknown';
  }

  /**
   * Calcule le score de risque
   * @param {string} phoneNumber - Numéro de téléphone
   * @returns {number} Score de risque (0-1)
   */
  calculateRisk(phoneNumber) {
    let risk = 0.1; // Risque de base

    // Numéros courts = risque plus élevé
    if (phoneNumber.length < 12) risk += 0.2;
    
    // Numéros avec beaucoup de répétitions = risque plus élevé
    const digits = phoneNumber.replace(/\D/g, '');
    const uniqueDigits = new Set(digits).size;
    if (uniqueDigits < digits.length * 0.3) risk += 0.3;

    // Numéros commençant par des patterns suspects
    if (phoneNumber.match(/^\+1(800|888|877|866)/)) risk += 0.1; // Numéros gratuits US
    
    return Math.min(risk, 1.0);
  }

  /**
   * Vérifie si c'est un numéro mobile
   * @param {string} phoneNumber - Numéro de téléphone
   * @returns {boolean} True si mobile
   */
  isMobileNumber(phoneNumber) {
    if (phoneNumber.includes('+33')) {
      const mobilePrefixes = ['6', '7'];
      const digit = phoneNumber.charAt(4);
      return mobilePrefixes.includes(digit);
    }
    return Math.random() > 0.5; // Simulation pour les autres pays
  }

  /**
   * Génère un MCC (Mobile Country Code)
   * @param {string} phoneNumber - Numéro de téléphone
   * @returns {string} MCC
   */
  generateMCC(phoneNumber) {
    const mccCodes = {
      '+33': '208', // France
      '+1': '310',  // US
      '+44': '234', // UK
      '+49': '262', // Germany
      '+34': '214', // Spain
      '+39': '222', // Italy
      '+32': '206', // Belgium
      '+41': '228', // Switzerland
      '+31': '204', // Netherlands
      '+46': '240'  // Sweden
    };

    for (const [code, mcc] of Object.entries(mccCodes)) {
      if (phoneNumber.startsWith(code)) {
        return mcc;
      }
    }
    return '000';
  }

  /**
   * Génère un MNC (Mobile Network Code)
   * @param {string} phoneNumber - Numéro de téléphone
   * @returns {string} MNC
   */
  generateMNC(phoneNumber) {
    const mncCodes = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
    const hash = phoneNumber.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return mncCodes[hash % mncCodes.length];
  }

  /**
   * Calcule le score de confiance d'un résultat
   * @param {Object} analysis - Résultats d'analyse
   * @returns {number} Score de confiance (0-1)
   */
  calculateScore(analysis) {
    let score = 0.5; // Score de base

    // Bonus pour validation réussie
    if (analysis.analysis.validation.valid) score += 0.2;
    
    // Bonus pour opérateur détecté avec confiance élevée
    if (analysis.analysis.carrier.confidence > 0.8) score += 0.15;
    
    // Bonus pour géolocalisation précise
    if (analysis.analysis.geolocation.confidence > 0.8) score += 0.1;
    
    // Bonus pour pays connu
    if (analysis.analysis.country.code !== 'UN') score += 0.05;

    return Math.min(score, 1.0);
  }

  /**
   * Extrait les nouveaux indicateurs des résultats
   * @param {Object} analysis - Résultats d'analyse
   * @returns {Array} Liste des nouveaux indicateurs
   */
  extractIndicators(analysis) {
    const indicators = [];

    // Extraire le pays comme indicateur
    if (analysis.analysis.country) {
      indicators.push({
        type: IndicatorType.DOMAIN,
        value: analysis.analysis.country.code.toLowerCase() + '.country',
        confidence: 0.9
      });
    }

    // Extraire la ville comme indicateur
    if (analysis.analysis.geolocation && analysis.analysis.geolocation.city) {
      indicators.push({
        type: IndicatorType.NAME,
        value: analysis.analysis.geolocation.city,
        confidence: analysis.analysis.geolocation.confidence
      });
    }

    // Extraire l'opérateur comme indicateur
    if (analysis.analysis.carrier && analysis.analysis.carrier.name) {
      indicators.push({
        type: IndicatorType.DOMAIN,
        value: analysis.analysis.carrier.name.toLowerCase().replace(/\s+/g, '') + '.carrier',
        confidence: analysis.analysis.carrier.confidence
      });
    }

    return indicators;
  }

  /**
   * Teste la connectivité du service
   * @returns {Promise<boolean>} True si le service est disponible
   */
  async testConnection() {
    try {
      // Simulation d'un test de connectivité
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      logger.error(`📱 PhoneInfoga: Erreur de test de connectivité: ${error.message}`);
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
      logger.error(`📱 PhoneInfoga: Erreur lors de la récupération des stats: ${error.message}`);
      return {
        totalResults: 0,
        recentResults: 0,
        status: 'error',
        lastUpdate: new Date().toISOString()
      };
    }
  }
}

module.exports = PhoneInfogaService;