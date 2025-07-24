const express = require('express');
const protect = require('../middlewares/auth');
const logger = require('../utils/logger');
const prisma = require('../utils/prisma');

const router = express.Router();

router.use(protect);

// Simule la création d'une session de paiement Stripe
router.post('/create-checkout-session', async (req, res) => {
  const { plan } = req.body;
  const userId = req.user.id;

  logger.info(`[Subscription] User ${userId} is creating a checkout session for plan: ${plan}`);

  // Logique de simulation
  // Dans une vraie application, ici on créerait une session Stripe
  // et on retournerait l'URL de la session.
  
  // Mettre à jour la base de données pour refléter le nouvel abonnement (simulation)
  try {
    await prisma.subscription.update({
      where: { userId },
      data: {
        plan: plan.toUpperCase(), // ex: 'ENQUETEUR', 'STRATEGE'
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      },
    });
    res.json({ message: 'Subscription updated successfully (simulation)', plan });
  } catch (error) {
    logger.error(`[Subscription] Failed to update subscription for user ${userId}:`, error);
    res.status(500).json({ error: 'Failed to update subscription.' });
  }
});

// Simule la redirection vers le portail de gestion Stripe
router.post('/manage', (req, res) => {
  const userId = req.user.id;
  logger.info(`[Subscription] User ${userId} is accessing the management portal.`);
  
  // Dans une vraie application, on créerait une session pour le portail Stripe
  res.json({ message: 'Redirecting to management portal (simulation)' });
});

module.exports = router;