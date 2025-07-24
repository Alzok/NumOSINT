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
 *     summary: Récupère l'historique des transactions de jetons pour l'utilisateur authentifié.
 *     tags: [Billing]
 *     responses:
 *       200:
 *         description: Une liste de transactions de jetons.
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

router.post('/purchase-tokens', async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Le montant doit être positif.' });
  }

  try {
    // Mettre à jour les crédits de l'utilisateur et créer une transaction
    const [, user] = await prisma.$transaction([
      prisma.creditTransaction.create({
        data: {
          amount,
          type: 'PURCHASE',
          userId,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: amount,
          },
        },
      }),
    ]);

    res.json({ message: 'Achat réussi.', credits: user.credits });
  } catch (error) {
    logger.error(`Erreur lors de l'achat de jetons pour l'utilisateur ${userId}:`, error);
    res.status(500).json({ error: "Impossible de finaliser l'achat." });
  }
});

module.exports = router;