const express = require('express');
const logger = require('../utils/logger');
const NotificationService = require('../services/notificationService');
const protect = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestion des notifications
 */
function createNotificationRoutes(prisma, io) {
  const router = express.Router();
  const notificationService = new NotificationService(prisma, io);

  // Toutes les routes de notification sont maintenant protégées
  router.use(protect);

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
   *         description: "Si 'true', ne retourne que les notifications non lues."
   *     responses:
   *       200:
   *         description: Liste des notifications
   *       500:
   *         description: Erreur serveur
   */
  router.get('/', async (req, res) => {
    logger.debug(`[Notif Route] GET / avec userId: ${req.user.id}`);
    try {
      const unreadOnly = req.query.unread === 'true';
      logger.debug(`[Notif Route] Appel de notificationService.getNotifications avec unreadOnly: ${unreadOnly}`);
      const notifications = await notificationService.getNotifications(req.user.id, unreadOnly);
      logger.debug(`[Notif Route] Succès. ${notifications.length} notifications trouvées.`);
      res.json(notifications);
    } catch (error) {
      logger.error("Erreur API - GET /notifications:", {
        message: error.message,
        stack: error.stack,
        details: error
      });
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
   *                 description: "Un tableau d'IDs de notifications à marquer comme lues."
   *     responses:
   *       200:
   *         description: Notifications marquées comme lues
   *       400:
   *         description: Tableau 'ids' manquant ou invalide
   *       500:
   *         description: Erreur serveur
   */
  router.post('/mark-as-read', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Le tableau 'ids' est requis." });
    }

    try {
      const result = await notificationService.markAsRead(req.user.id, ids);
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
  router.post('/mark-all-as-read', async (req, res) => {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      res.json({ message: `${result.count} notification(s) marquée(s) comme lue(s).` });
    } catch (error) {
      logger.error("Erreur API - POST /notifications/mark-all-as-read:", error);
      res.status(500).json({ error: "Impossible de marquer toutes les notifications comme lues." });
    }
  });

  /**
   * @swagger
   * /api/notifications/{id}:
   *   delete:
   *     summary: Supprime une notification spécifique.
   *     tags: [Notifications]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: L'ID de la notification à supprimer.
   *     responses:
   *       204:
   *         description: Notification supprimée avec succès.
   *       404:
   *         description: Notification non trouvée ou non autorisée.
   *       500:
   *         description: Erreur serveur.
   */
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const result = await notificationService.deleteNotification(req.user.id, id);
      if (result.count === 0) {
        return res.status(404).json({ error: "Notification non trouvée ou vous n'avez pas la permission de la supprimer." });
      }
      res.status(204).send();
    } catch (error) {
      logger.error(`Erreur API - DELETE /notifications/${id}:`, error);
      res.status(500).json({ error: "Impossible de supprimer la notification." });
    }
  });

  return router;
}

module.exports = createNotificationRoutes;