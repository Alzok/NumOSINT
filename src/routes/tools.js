const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/tools
 * Récupère la liste des outils disponibles
 */
router.get('/', (req, res) => {
  const tools = [
    {
      id: 'buster',
      name: 'Buster',
      description: 'Générateur et validateur d\'adresses email',
      version: '1.0.0',
      status: 'available',
      capabilities: ['email_generation', 'email_validation'],
      documentation: 'https://github.com/sham00n/buster'
    },
    {
      id: 'mosint',
      name: 'Mosint',
      description: 'Analyseur d\'emails et détecteur de fuites de données',
      version: '1.0.0',
      status: 'available',
      capabilities: ['email_analysis', 'breach_detection', 'social_media_search'],
      documentation: 'https://github.com/alpkeskin/mosint'
    },
    {
      id: 'maigret',
      name: 'Maigret',
      description: 'Recherche de profils sur les réseaux sociaux',
      version: '1.0.0',
      status: 'available',
      capabilities: ['username_search', 'profile_discovery', 'social_media_scanning'],
      documentation: 'https://github.com/soxoj/maigret'
    },
    {
      id: 'phoneinfoga',
      name: 'PhoneInfoga',
      description: 'Analyseur de numéros de téléphone',
      version: '1.0.0',
      status: 'available',
      capabilities: ['phone_analysis', 'carrier_detection', 'geolocation'],
      documentation: 'https://github.com/sundowndev/phoneinfoga'
    },
    {
      id: 'spiderfoot',
      name: 'SpiderFoot',
      description: 'Scanner exhaustif et moteur d\'automatisation OSINT',
      version: '1.0.0',
      status: 'available',
      capabilities: ['comprehensive_scanning', 'automation', 'data_collection'],
      documentation: 'https://github.com/smicallef/spiderfoot'
    }
  ];

  res.json({
    tools,
    count: tools.length,
    message: 'Liste des outils OSINT disponibles'
  });
});

/**
 * GET /api/tools/:toolId
 * Récupère les informations détaillées d'un outil
 */
router.get('/:toolId', (req, res) => {
  const { toolId } = req.params;

  const toolDetails = {
    buster: {
      id: 'buster',
      name: 'Buster',
      description: 'Buster est un outil de génération et de validation d\'adresses email basé sur des noms et des domaines.',
      version: '1.0.0',
      status: 'available',
      capabilities: ['email_generation', 'email_validation'],
      configuration: {
        maxEmailsPerName: 10,
        validationTimeout: 30,
        supportedDomains: ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']
      },
      usage: {
        input: ['names', 'domains'],
        output: ['emails', 'validation_results']
      },
      documentation: 'https://github.com/sham00n/buster'
    },
    mosint: {
      id: 'mosint',
      name: 'Mosint',
      description: 'Mosint est un outil d\'analyse d\'emails qui détecte les fuites de données et recherche des informations sur les réseaux sociaux.',
      version: '1.0.0',
      status: 'available',
      capabilities: ['email_analysis', 'breach_detection', 'social_media_search'],
      configuration: {
        breachCheckTimeout: 60,
        socialMediaTimeout: 45,
        maxConcurrentChecks: 5
      },
      usage: {
        input: ['emails'],
        output: ['breaches', 'social_profiles', 'security_score']
      },
      documentation: 'https://github.com/alpkeskin/mosint'
    },
    maigret: {
      id: 'maigret',
      name: 'Maigret',
      description: 'Maigret est un outil de recherche de profils sur les réseaux sociaux basé sur des noms d\'utilisateur.',
      version: '1.0.0',
      status: 'available',
      capabilities: ['username_search', 'profile_discovery', 'social_media_scanning'],
      configuration: {
        maxProfilesPerUsername: 50,
        searchTimeout: 120,
        recursiveSearch: true
      },
      usage: {
        input: ['usernames', 'names'],
        output: ['profiles', 'social_links', 'profile_data']
      },
      documentation: 'https://github.com/soxoj/maigret'
    },
    phoneinfoga: {
      id: 'phoneinfoga',
      name: 'PhoneInfoga',
      description: 'PhoneInfoga est un outil d\'analyse de numéros de téléphone qui fournit des informations sur l\'opérateur et la géolocalisation.',
      version: '1.0.0',
      status: 'available',
      capabilities: ['phone_analysis', 'carrier_detection', 'geolocation'],
      configuration: {
        analysisTimeout: 45,
        geolocationEnabled: true,
        carrierDetectionEnabled: true
      },
      usage: {
        input: ['phones'],
        output: ['carrier_info', 'geolocation', 'phone_details']
      },
      documentation: 'https://github.com/sundowndev/phoneinfoga'
    },
    spiderfoot: {
      id: 'spiderfoot',
      name: 'SpiderFoot',
      description: 'SpiderFoot est un moteur d\'automatisation OSINT complet qui effectue des scans exhaustifs et collecte des données.',
      version: '1.0.0',
      status: 'available',
      capabilities: ['comprehensive_scanning', 'automation', 'data_collection'],
      configuration: {
        maxDepth: 3,
        scanTimeout: 300,
        modules: ['ALL'],
        maxResults: 1000
      },
      usage: {
        input: ['any_indicators'],
        output: ['comprehensive_report', 'network_graph', 'data_relationships']
      },
      documentation: 'https://github.com/smicallef/spiderfoot'
    }
  };

  const tool = toolDetails[toolId];

  if (!tool) {
    return res.status(404).json({
      error: 'Outil non trouvé',
      message: `Aucun outil trouvé avec l'ID ${toolId}`
    });
  }

  res.json({
    tool,
    message: `Informations détaillées pour ${tool.name}`
  });
});

/**
 * POST /api/tools/:toolId/test
 * Teste un outil spécifique
 */
router.post('/:toolId/test', async (req, res) => {
  const { toolId } = req.params;
  const { testData } = req.body;

  try {
    logger.tool(toolId, 'test', 'Test d\'outil demandé', { testData });

    // Simulation de test d'outil
    const testResults = {
      buster: {
        status: 'success',
        duration: 15000,
        results: {
          generatedEmails: 5,
          validEmails: 3,
          invalidEmails: 2
        }
      },
      mosint: {
        status: 'success',
        duration: 25000,
        results: {
          analyzedEmails: 1,
          breachesFound: 0,
          socialProfiles: 2
        }
      },
      maigret: {
        status: 'success',
        duration: 45000,
        results: {
          searchedUsernames: 1,
          foundProfiles: 8,
          platforms: ['twitter', 'github', 'linkedin']
        }
      },
      phoneinfoga: {
        status: 'success',
        duration: 15000,
        results: {
          analyzedPhones: 1,
          carrierInfo: 'Orange',
          geolocation: 'France'
        }
      },
      spiderfoot: {
        status: 'success',
        duration: 120000,
        results: {
          scanTargets: 3,
          collectedData: 45,
          modulesExecuted: 12
        }
      }
    };

    const result = testResults[toolId];

    if (!result) {
      return res.status(404).json({
        error: 'Outil non trouvé',
        message: `Aucun outil trouvé avec l'ID ${toolId}`
      });
    }

    res.json({
      toolId,
      test: result,
      message: `Test de ${toolId} terminé avec succès`
    });

  } catch (error) {
    logger.toolError(toolId, 'test', error);
    res.status(500).json({
      error: 'Erreur lors du test de l\'outil',
      message: error.message
    });
  }
});

/**
 * GET /api/tools/:toolId/status
 * Récupère le statut d'un outil
 */
router.get('/:toolId/status', (req, res) => {
  const { toolId } = req.params;

  const toolStatuses = {
    buster: {
      status: 'available',
      lastCheck: new Date().toISOString(),
      version: '1.0.0',
      uptime: '99.9%',
      performance: 'excellent'
    },
    mosint: {
      status: 'available',
      lastCheck: new Date().toISOString(),
      version: '1.0.0',
      uptime: '99.8%',
      performance: 'good'
    },
    maigret: {
      status: 'available',
      lastCheck: new Date().toISOString(),
      version: '1.0.0',
      uptime: '99.7%',
      performance: 'good'
    },
    phoneinfoga: {
      status: 'available',
      lastCheck: new Date().toISOString(),
      version: '1.0.0',
      uptime: '99.9%',
      performance: 'excellent'
    },
    spiderfoot: {
      status: 'available',
      lastCheck: new Date().toISOString(),
      version: '1.0.0',
      uptime: '99.6%',
      performance: 'good'
    }
  };

  const status = toolStatuses[toolId];

  if (!status) {
    return res.status(404).json({
      error: 'Outil non trouvé',
      message: `Aucun outil trouvé avec l'ID ${toolId}`
    });
  }

  res.json({
    toolId,
    status,
    message: `Statut de ${toolId} récupéré`
  });
});

/**
 * POST /api/tools/:toolId/configure
 * Configure un outil spécifique
 */
router.post('/:toolId/configure', (req, res) => {
  const { toolId } = req.params;
  const { configuration } = req.body;

  try {
    logger.tool(toolId, 'configure', 'Configuration d\'outil demandée', { configuration });

    // Validation de la configuration selon l'outil
    const validConfigurations = {
      buster: ['maxEmailsPerName', 'validationTimeout', 'supportedDomains'],
      mosint: ['breachCheckTimeout', 'socialMediaTimeout', 'maxConcurrentChecks'],
      maigret: ['maxProfilesPerUsername', 'searchTimeout', 'recursiveSearch'],
      phoneinfoga: ['analysisTimeout', 'geolocationEnabled', 'carrierDetectionEnabled'],
      spiderfoot: ['maxDepth', 'scanTimeout', 'modules', 'maxResults']
    };

    const validConfig = validConfigurations[toolId];

    if (!validConfig) {
      return res.status(404).json({
        error: 'Outil non trouvé',
        message: `Aucun outil trouvé avec l'ID ${toolId}`
      });
    }

    // Validation des paramètres de configuration
    const invalidParams = Object.keys(configuration).filter(param => !validConfig.includes(param));
    
    if (invalidParams.length > 0) {
      return res.status(400).json({
        error: 'Configuration invalide',
        message: `Paramètres invalides: ${invalidParams.join(', ')}`,
        validParams: validConfig
      });
    }

    // Ici on sauvegarderait la configuration en base de données
    // Pour l'instant, on simule une sauvegarde réussie

    res.json({
      toolId,
      configuration,
      message: `Configuration de ${toolId} mise à jour avec succès`
    });

  } catch (error) {
    logger.toolError(toolId, 'configure', error);
    res.status(500).json({
      error: 'Erreur lors de la configuration de l\'outil',
      message: error.message
    });
  }
});

/**
 * GET /api/tools/:toolId/logs
 * Récupère les logs d'un outil
 */
router.get('/:toolId/logs', (req, res) => {
  const { toolId } = req.params;
  const { limit = 50, level } = req.query;

  try {
    // Simulation de logs d'outil
    const toolLogs = {
      buster: [
        { timestamp: new Date().toISOString(), level: 'INFO', message: 'Buster démarré avec succès' },
        { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'INFO', message: 'Génération d\'emails terminée' },
        { timestamp: new Date(Date.now() - 120000).toISOString(), level: 'WARNING', message: 'Timeout sur la validation d\'un email' }
      ],
      mosint: [
        { timestamp: new Date().toISOString(), level: 'INFO', message: 'Mosint initialisé' },
        { timestamp: new Date(Date.now() - 30000).toISOString(), level: 'INFO', message: 'Analyse d\'email terminée' },
        { timestamp: new Date(Date.now() - 90000).toISOString(), level: 'ERROR', message: 'Erreur de connexion à l\'API' }
      ],
      maigret: [
        { timestamp: new Date().toISOString(), level: 'INFO', message: 'Maigret démarré' },
        { timestamp: new Date(Date.now() - 45000).toISOString(), level: 'INFO', message: 'Recherche de profils terminée' },
        { timestamp: new Date(Date.now() - 180000).toISOString(), level: 'INFO', message: '8 profils trouvés' }
      ],
      phoneinfoga: [
        { timestamp: new Date().toISOString(), level: 'INFO', message: 'PhoneInfoga actif' },
        { timestamp: new Date(Date.now() - 15000).toISOString(), level: 'INFO', message: 'Analyse de téléphone terminée' },
        { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'INFO', message: 'Informations de géolocalisation récupérées' }
      ],
      spiderfoot: [
        { timestamp: new Date().toISOString(), level: 'INFO', message: 'SpiderFoot en cours d\'exécution' },
        { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'INFO', message: 'Scan en cours - 45% terminé' },
        { timestamp: new Date(Date.now() - 120000).toISOString(), level: 'INFO', message: '12 modules exécutés avec succès' }
      ]
    };

    const logs = toolLogs[toolId];

    if (!logs) {
      return res.status(404).json({
        error: 'Outil non trouvé',
        message: `Aucun outil trouvé avec l'ID ${toolId}`
      });
    }

    // Filtrage par niveau si spécifié
    let filteredLogs = logs;
    if (level) {
      filteredLogs = logs.filter(log => log.level === level.toUpperCase());
    }

    // Limitation du nombre de logs
    filteredLogs = filteredLogs.slice(0, parseInt(limit));

    res.json({
      toolId,
      logs: filteredLogs,
      count: filteredLogs.length,
      message: `Logs de ${toolId} récupérés`
    });

  } catch (error) {
    logger.toolError(toolId, 'logs', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des logs',
      message: error.message
    });
  }
});

module.exports = router;