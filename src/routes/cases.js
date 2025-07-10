const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/cases - Lister tous les dossiers
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

// POST /api/cases - Créer un nouveau dossier
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

// GET /api/cases/:id - Obtenir les détails d'un dossier
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


// PUT /api/cases/:id - Mettre à jour un dossier
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

// DELETE /api/cases/:id - Supprimer un dossier
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

// PUT /api/cases/:id/investigations - Associer/Dissocier des investigations
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