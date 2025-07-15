const logger = require('../utils/logger');

class NotificationService {
  constructor(prisma, io) {
    this.prisma = prisma;
    this.io = io;
  }

  /**
   * Crée une nouvelle notification et la pousse au client via WebSocket.
   * @param {string} userId - L'ID de l'utilisateur à notifier.
   * @param {string} message - Le contenu de la notification.
   * @param {string} [link] - Un lien optionnel associé à la notification.
   */
  async createNotification(userId, message, link = null) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          message,
          link,
        },
      });

      // Émettre la notification en temps réel à l'utilisateur concerné
      // On utilise une "room" par utilisateur pour cibler les notifications.
      this.io.to(`user_${userId}`).emit('notification:new', notification);
      
      logger.info(`Notification créée et envoyée à l'utilisateur ${userId}: "${message}"`);
      return notification;
    } catch (error) {
      logger.error(`Erreur lors de la création de la notification pour l'utilisateur ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les notifications d'un utilisateur.
   * @param {string} userId - L'ID de l'utilisateur.
   * @param {boolean} [unreadOnly=false] - Si vrai, ne retourne que les notifications non lues.
   */
  async getNotifications(userId, unreadOnly = false) {
    logger.debug(`[Notif Service] getNotifications pour userId: ${userId}, unreadOnly: ${unreadOnly}`);
    try {
      const where = { userId };
      if (unreadOnly) {
        where.read = false;
      }
      
      logger.debug(`[Notif Service] Exécution de prisma.notification.findMany avec la condition:`, where);
      const notifications = await this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50, // Limite pour ne pas surcharger
      });
      logger.debug(`[Notif Service] Prisma a retourné ${notifications.length} notifications.`);
      return notifications;
    } catch (error) {
      logger.error(`Erreur dans getNotifications pour l'utilisateur ${userId}:`, {
        message: error.message,
        stack: error.stack,
        details: error
      });
      throw error;
    }
  }

  /**
   * Marque une ou plusieurs notifications comme lues.
   * @param {string} userId - L'ID de l'utilisateur.
   * @param {string[]} notificationIds - Un tableau d'IDs de notifications à marquer comme lues.
   */
  async markAsRead(userId, notificationIds) {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: userId, // Sécurité: ne mettre à jour que les notifs de l'utilisateur
        },
        data: { read: true },
      });

      logger.info(`${result.count} notifications marquées comme lues pour l'utilisateur ${userId}.`);
      return result;
    } catch (error) {
      logger.error(`Erreur lors du marquage des notifications comme lues pour l'utilisateur ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Marque toutes les notifications d'un utilisateur comme lues.
   * @param {string} userId - L'ID de l'utilisateur.
   */
  async markAllAsRead(userId) {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          userId: userId,
          read: false,
        },
        data: { read: true },
      });

      logger.info(`Toutes les notifications (${result.count}) ont été marquées comme lues pour l'utilisateur ${userId}.`);
      return result;
    } catch (error) {
      logger.error(`Erreur lors du marquage de toutes les notifications comme lues pour l'utilisateur ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = NotificationService;