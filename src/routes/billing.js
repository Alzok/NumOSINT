const express = require('express');
const prisma = require('../utils/prisma');
const protect = require('../middlewares/auth');
const logger = require('../utils/logger');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /api/billing/history:
 *   get:
 *     summary: Récupère l'historique des transactions de crédits pour l'utilisateur authentifié.
 *     tags: [Billing]
 *     responses:
 *       200:
 *         description: Une liste de transactions de crédits.
 *       500:
 *         description: Erreur serveur.
 */
router.get('/history', async (req, res) => {
  try {
    const transactions = await prisma.creditTransaction.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        investigation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(transactions);
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'historique de facturation pour l'utilisateur ${req.user.id}:`, error);
    res.status(500).json({ error: "Impossible de récupérer l'historique des transactions." });
  }
});

module.exports = router;