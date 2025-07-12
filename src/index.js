const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const logger = require('./utils/logger');
const { setupSocketIO } = require('./utils/socket');
const { setupOrchestrator } = require('./services/orchestrator');

// Import des routes
const investigationRoutes = require('./routes/investigations');
const toolRoutes = require('./routes/tools');
const healthRoutes = require('./routes/health');
const resultsRoutes = require('./routes/results');
const statisticsRoutes = require('./routes/statistics');
const casesRoutes = require('./routes/cases.js');
const reportRoutes = require('./routes/reports.js');
const v1InvestigationRoutes = require('./routes/v1/investigations.js');
const notificationRoutes = require('./routes/notifications.js');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3001", "http://frontend:3001"],
    methods: ["GET", "POST"]
  }
});

// Initialisation Prisma
const prisma = new PrismaClient();

// Configuration de base
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Middleware de base
app.use(compression());
app.use(cors({
  origin: ["http://localhost:3001", "http://frontend:3001"],
  credentials: true
}));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuration Socket.IO
setupSocketIO(io);

// Routes
app.use('/api/investigations', investigationRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/v1/investigations', v1InvestigationRoutes);
app.use('/api/notifications', notificationRoutes(prisma, io));

// Configuration Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'NumOSINT API',
      version: '1.0.0',
      description: 'Documentation de l\'API pour la plateforme NumOSINT',
      contact: {
        name: 'Support NumOSINT'
      },
      servers: [{ url: `http://localhost:${PORT}` }]
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'NumOSINT API - Plateforme OSINT Multi-Outils',
    version: '1.0.0',
    status: 'running',
    environment: NODE_ENV
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  logger.error('Erreur non gérée:', err);
  
  res.status(err.status || 500).json({
    error: NODE_ENV === 'production' ? 'Erreur interne du serveur' : err.message,
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Fonction d'initialisation
async function initializeApp() {
  try {
    // Test de connexion à la base de données
    await prisma.$connect();
    logger.info('✅ Connexion à PostgreSQL établie');

    // Nettoyage des investigations en cours au démarrage
    await cleanupOngoingInvestigations();

    // Initialisation de l'orchestrateur
    const orchestrator = await setupOrchestrator(prisma, io);
    app.locals.orchestrator = orchestrator;
    logger.info('✅ Orchestrateur initialisé');

    // Démarrage du serveur
    server.listen(PORT, () => {
      logger.info(`🚀 Serveur NumOSINT démarré sur le port ${PORT}`);
      logger.info(`📊 Environnement: ${NODE_ENV}`);
      logger.info(`🔗 API disponible sur: http://localhost:${PORT}`);
      logger.info(`🔗 Frontend attendu sur: http://localhost:3001`);
    });

  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

// Gestion de l'arrêt gracieux
process.on('SIGTERM', async () => {
  logger.info('🛑 Signal SIGTERM reçu, arrêt gracieux...');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('🛑 Signal SIGINT reçu, arrêt gracieux...');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (err) => {
  logger.error('❌ Exception non capturée:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Promesse rejetée non gérée:', reason);
  process.exit(1);
});

// Démarrage de l'application
initializeApp();

/**
 * Nettoie les investigations qui étaient en cours d'exécution lorsque le serveur s'est arrêté.
 * Cela évite de relancer des analyses lourdes de manière inattendue au redémarrage.
 */
async function cleanupOngoingInvestigations() {
  const activeStatuses = ['ENRICHING', 'SCANNING', 'CONSOLIDATING'];
  try {
    const investigationsToClean = await prisma.investigation.findMany({
      where: {
        status: { in: activeStatuses },
      },
    });

    if (investigationsToClean.length > 0) {
      logger.warn(`🧹 Nettoyage de ${investigationsToClean.length} investigation(s) 'zombie' trouvée(s) au démarrage.`);
      
      for (const inv of investigationsToClean) {
        await prisma.investigation.update({
          where: { id: inv.id },
          data: {
            status: 'FAILED',
            currentStep: 'Interrompu par un redémarrage du serveur.',
          },
        });
        logger.info(`   -> Investigation ${inv.id} marquée comme FAILED.`);
      }
    } else {
      logger.info("✅ Aucune investigation 'zombie' à nettoyer. Démarrage propre.");
    }
  } catch (error) {
    logger.error('❌ Erreur lors du nettoyage des investigations en cours:', error);
    // On ne bloque pas le démarrage de l'application pour cette erreur
  }
}

module.exports = { app, server, prisma };