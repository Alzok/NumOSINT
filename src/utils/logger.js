const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Configuration des formats
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Configuration des transports
const transports = [
  // Console pour le développement
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // Fichier de logs généraux
  new DailyRotateFile({
    filename: path.join('logs', 'numosint-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat
  }),
  
  // Fichier de logs d'erreurs
  new DailyRotateFile({
    filename: path.join('logs', 'numosint-error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: logFormat
  }),
  
  // Fichier de logs d'investigations
  new DailyRotateFile({
    filename: path.join('logs', 'investigations-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: logFormat
  })
];

// Création du logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// Fonction pour logger les investigations spécifiquement
logger.investigation = (investigationId, message, meta = {}) => {
  logger.info(message, {
    investigationId,
    type: 'investigation',
    ...meta
  });
};

// Fonction pour logger les étapes d'outils
logger.tool = (toolName, investigationId, message, meta = {}) => {
  logger.info(message, {
    tool: toolName,
    investigationId,
    type: 'tool_execution',
    ...meta
  });
};

// Fonction pour logger les erreurs d'outils
logger.toolError = (toolName, investigationId, error, meta = {}) => {
  logger.error(`Erreur ${toolName}: ${error.message}`, {
    tool: toolName,
    investigationId,
    type: 'tool_error',
    error: error.stack,
    ...meta
  });
};

// Fonction pour logger les performances
logger.performance = (operation, duration, meta = {}) => {
  logger.info(`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    type: 'performance',
    ...meta
  });
};

// Fonction pour logger les événements de base de données
logger.database = (operation, table, meta = {}) => {
  logger.info(`Database: ${operation}`, {
    operation,
    table,
    type: 'database',
    ...meta
  });
};

// Fonction pour logger les événements Socket.IO
logger.socket = (event, socketId, meta = {}) => {
  logger.info(`Socket: ${event}`, {
    event,
    socketId,
    type: 'socket',
    ...meta
  });
};

// Gestion des erreurs non capturées
logger.exceptions.handle(
  new DailyRotateFile({
    filename: path.join('logs', 'exceptions-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d'
  })
);

// Gestion des rejets de promesses non gérés
logger.rejections.handle(
  new DailyRotateFile({
    filename: path.join('logs', 'rejections-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d'
  })
);

module.exports = logger;