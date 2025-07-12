const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cases
 *   description: Gestion des dossiers d'investigation
 */

/**
 * @swagger
 * /api/cases:
 *   get:
 *     summary: Lister tous les dossiers
 *     tags: [Cases]
 *     responses:
 *       200:
 *         description: Une liste de dossiers
 *       500:
 *         description: Erreur serveur
 */
router.get('/', async (req, res) => {
  try {
    const cases = await prisma.case.findMany({
      include: {
        investigations: true, // Inclure les investigations associées
      },
    });
    res.json(cases);
  } catch (error) {
    console.error("Error fetching cases:", error);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

/**
 * @swagger
 * /api/cases:
 *   post:
 *     summary: Créer un nouveau dossier
 *     tags: [Cases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               investigationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Dossier créé
 *       400:
 *         description: Nom manquant
 *       500:
 *         description: Erreur serveur
 */
router.post('/', async (req, res) => {
  const { name, description, investigationIds } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const newCase = await prisma.case.create({
      data: {
        name,
        description,
        investigations: {
          connect: investigationIds?.map((id) => ({ id })) || [],
        },
      },
      include: {
        investigations: true,
      }
    });
    res.status(201).json(newCase);
  } catch (error) {
    console.error("Error creating case:", error);
    res.status(500).json({ error: 'Failed to create case' });
  }
});

/**
 * @swagger
 * /api/cases/{id}:
 *   get:
 *     summary: Obtenir les détails d'un dossier
 *     tags: [Cases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails du dossier
 *       404:
 *         description: Dossier non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const caseDetails = await prisma.case.findUnique({
            where: { id },
            include: {
                investigations: {
                    include: {
                        results: true,
                    }
                },
            },
        });

        if (!caseDetails) {
            return res.status(404).json({ error: 'Case not found' });
        }

        // TODO: Ajouter une logique de synthèse plus complexe ici
        res.json(caseDetails);
    } catch (error) {
        console.error(`Error fetching case ${id}:`, error);
        res.status(500).json({ error: 'Failed to fetch case details' });
    }
});

/**
 * @swagger
 * /api/cases/{id}:
 *   put:
 *     summary: Mettre à jour un dossier
 *     tags: [Cases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dossier mis à jour
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    try {
        const updatedCase = await prisma.case.update({
            where: { id },
            data: {
                name,
                description,
            },
        });
        res.json(updatedCase);
    } catch (error) {
        console.error(`Error updating case ${id}:`, error);
        res.status(500).json({ error: 'Failed to update case' });
    }
});

/**
 * @swagger
 * /api/cases/{id}:
 *   delete:
 *     summary: Supprimer un dossier
 *     tags: [Cases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Dossier supprimé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.case.delete({
            where: { id },
        });
        res.status(204).send();
    } catch (error) {
        console.error(`Error deleting case ${id}:`, error);
        res.status(500).json({ error: 'Failed to delete case' });
    }
});

/**
 * @swagger
 * /api/cases/{id}/investigations:
 *   put:
 *     summary: Associer/Dissocier des investigations à un dossier
 *     tags: [Cases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               investigationIdsToConnect:
 *                 type: array
 *                 items:
 *                   type: string
 *               investigationIdsToDisconnect:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Investigations du dossier mises à jour
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id/investigations', async (req, res) => {
    const { id } = req.params;
    const { investigationIdsToConnect, investigationIdsToDisconnect } = req.body;

    try {
        const updatedCase = await prisma.case.update({
            where: { id },
            data: {
                investigations: {
                    connect: investigationIdsToConnect?.map((id) => ({ id })) || [],
                    disconnect: investigationIdsToDisconnect?.map((id) => ({ id })) || [],
                },
            },
            include: {
                investigations: true,
            }
        });
        res.json(updatedCase);
    } catch (error) {
        console.error(`Error updating investigations for case ${id}:`, error);
        res.status(500).json({ error: 'Failed to update investigations for case' });
    }
});


module.exports = router;