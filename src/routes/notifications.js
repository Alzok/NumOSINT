const express = require('express');
const logger = require('../utils/logger');
const NotificationService = require('../services/notificationService');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestion des notifications
 */
function createNotificationRoutes(prisma, io) {
  const router = express.Router();
  const notificationService = new NotificationService(prisma, io);

  // Middleware pour simuler un utilisateur authentifié
  // TODO: Remplacer par une vraie authentification
  const fakeAuth = (req, res, next) => {
    req.userId = 'static_user_id';
    next();
  };

  /**
   * @swagger
   * /api/notifications:
   *   get:
   *     summary: Récupère les notifications pour l'utilisateur authentifié.
   *     tags: [Notifications]
   *     parameters:
   *       - in: query
   *         name: unread
   *         schema:
   *           type: boolean
   *         description: 'true' pour ne récupérer que les non lues.
   *     responses:
   *       200:
   *         description: Liste des notifications
   *       500:
   *         description: Erreur serveur
   */
  router.get('/', fakeAuth, async (req, res) => {
    try {
      const unreadOnly = req.query.unread === 'true';
      const notifications = await notificationService.getNotifications(req.userId, unreadOnly);
      res.json(notifications);
    } catch (error) {
      logger.error("Erreur API - GET /notifications:", error);
      res.status(500).json({ error: "Impossible de récupérer les notifications." });
    }
  });

  /**
   * @swagger
   * /api/notifications/mark-as-read:
   *   post:
   *     summary: Marque des notifications spécifiques comme lues.
   *     tags: [Notifications]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               ids:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Notifications marquées comme lues
   *       400:
   *         description: Tableau 'ids' manquant ou invalide
   *       500:
   *         description: Erreur serveur
   */
  router.post('/mark-as-read', fakeAuth, async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Le tableau 'ids' est requis." });
    }

    try {
      const result = await notificationService.markAsRead(req.userId, ids);
      res.json({ message: `${result.count} notification(s) marquée(s) comme lue(s).` });
    } catch (error) {
      logger.error("Erreur API - POST /notifications/mark-as-read:", error);
      res.status(500).json({ error: "Impossible de marquer les notifications comme lues." });
    }
  });
  
  /**
   * @swagger
   * /api/notifications/mark-all-as-read:
   *   post:
   *     summary: Marque toutes les notifications de l'utilisateur comme lues.
   *     tags: [Notifications]
   *     responses:
   *       200:
   *         description: Toutes les notifications marquées comme lues
   *       500:
   *         description: Erreur serveur
   */
  router.post('/mark-all-as-read', fakeAuth, async (req, res) => {
    try {
      const result = await notificationService.markAllAsRead(req.userId);
      res.json({ message: `${result.count} notification(s) marquée(s) comme lue(s).` });
    } catch (error) {
      logger.error("Erreur API - POST /notifications/mark-all-as-read:", error);
      res.status(500).json({ error: "Impossible de marquer toutes les notifications comme lues." });
    }
  });

  return router;
}

module.exports = createNotificationRoutes;