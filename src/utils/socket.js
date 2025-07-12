const logger = require('./logger');

/**
 * Configuration Socket.IO pour les communications temps réel
 */
function setupSocketIO(io) {
  logger.info('🔌 Configuration Socket.IO démarrée');

  // Middleware d'authentification (optionnel)
  io.use((socket, next) => {
    // Ici on pourrait ajouter une authentification si nécessaire
    // Pour l'instant, on accepte toutes les connexions
    next();
  });

  io.on('connection', (socket) => {
    logger.socket('connection', socket.id);

    // Gestion des rooms d'investigation
    socket.on('join_investigation', (investigationId) => {
      socket.join(investigationId);
      logger.socket('join_investigation', socket.id, { investigationId });
      
      // Confirmation de connexion à la room
      socket.emit('investigation:joined', {
        investigationId,
        message: `Connecté à l'investigation ${investigationId}`
      });
    });

    // Gestion des rooms par utilisateur pour les notifications
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        logger.socket('join_user', socket.id, { userId });
      }
    });

    socket.on('leave_investigation', (investigationId) => {
      socket.leave(investigationId);
      logger.socket('leave_investigation', socket.id, { investigationId });
      
      socket.emit('investigation:left', {
        investigationId,
        message: `Déconnecté de l'investigation ${investigationId}`
      });
    });

    // Gestion des demandes de statut en temps réel
    socket.on('get_investigation_status', (investigationId) => {
      logger.socket('get_investigation_status', socket.id, { investigationId });
      
      // Ici on pourrait récupérer le statut depuis la base de données
      // et l'envoyer au client
      socket.emit('investigation:status', {
        investigationId,
        status: 'unknown',
        message: 'Statut non disponible'
      });
    });

    // Gestion des demandes de logs en temps réel
    socket.on('get_investigation_logs', (investigationId) => {
      logger.socket('get_investigation_logs', socket.id, { investigationId });
      
      // Ici on pourrait récupérer les logs depuis la base de données
      // et les envoyer au client
      socket.emit('investigation:logs', {
        investigationId,
        logs: [],
        message: 'Logs non disponibles'
      });
    });

    // Gestion des demandes d'arrêt d'investigation
    socket.on('stop_investigation', (investigationId) => {
      logger.socket('stop_investigation', socket.id, { investigationId });
      
      // Ici on pourrait arrêter l'investigation
      socket.emit('investigation:stop_requested', {
        investigationId,
        message: 'Demande d\'arrêt reçue'
      });
    });

    // Gestion des demandes de résultats
    socket.on('get_investigation_results', (investigationId) => {
      logger.socket('get_investigation_results', socket.id, { investigationId });
      
      // Ici on pourrait récupérer les résultats depuis la base de données
      // et les envoyer au client
      socket.emit('investigation:results', {
        investigationId,
        results: [],
        message: 'Résultats non disponibles'
      });
    });

    // Gestion des erreurs de socket
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });

    // Gestion de la déconnexion
    socket.on('disconnect', (reason) => {
      logger.socket('disconnect', socket.id, { reason });
    });

    // Gestion des événements personnalisés
    socket.on('custom_event', (data) => {
      logger.socket('custom_event', socket.id, data);
      
      // Traitement des événements personnalisés
      socket.emit('custom_event_response', {
        received: true,
        data: data
      });
    });
  });

  // Fonctions utilitaires pour émettre des événements
  io.investigation = {
    // Émettre un événement à tous les clients d'une investigation
    emit: (investigationId, event, data) => {
      io.to(investigationId).emit(event, data);
      logger.socket(`emit_to_investigation:${event}`, 'server', { investigationId });
    },

    // Émettre un événement à tous les clients sauf l'émetteur
    emitToOthers: (investigationId, event, data, excludeSocketId) => {
      socket.to(investigationId).emit(event, data);
      logger.socket(`emit_to_others:${event}`, 'server', { investigationId, excludeSocketId });
    },

    // Émettre un événement à un client spécifique
    emitToClient: (socketId, event, data) => {
      io.to(socketId).emit(event, data);
      logger.socket(`emit_to_client:${event}`, 'server', { socketId });
    }
  };

  // Événements globaux du système
  io.system = {
    // Notification de maintenance
    maintenance: (message, scheduled = false) => {
      io.emit('system:maintenance', {
        message,
        scheduled,
        timestamp: new Date()
      });
      logger.socket('system:maintenance', 'server', { message, scheduled });
    },

    // Notification de mise à jour
    update: (version, changelog) => {
      io.emit('system:update', {
        version,
        changelog,
        timestamp: new Date()
      });
      logger.socket('system:update', 'server', { version });
    },

    // Notification d'erreur système
    error: (error, context) => {
      io.emit('system:error', {
        error: error.message,
        context,
        timestamp: new Date()
      });
      logger.socket('system:error', 'server', { error: error.message, context });
    }
  };

  logger.info('✅ Configuration Socket.IO terminée');
}

module.exports = { setupSocketIO };