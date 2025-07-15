const express = require('express');
const prisma = require('../utils/prisma');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const protect = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const caseValidation = require('../validations/case.validation');

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
 *     summary: Lister tous les dossiers d'investigation
 *     description: Récupère une liste paginée de tous les dossiers d'investigation.
 *     tags: [Cases]
 *     responses:
 *       200:
 *         description: Une liste paginée de dossiers.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Case'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Erreur serveur
 */
router.get('/', protect, catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [cases, total] = await prisma.$transaction([
    prisma.case.findMany({
      skip,
      take: limit,
      include: {
        investigations: true, // Inclure les investigations associées
      },
      orderBy: {
        createdAt: 'desc',
      }
    }),
    prisma.case.count(),
  ]);

  res.json({
    data: cases,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}));

/**
 * @swagger
 * /api/cases:
 *   post:
 *     summary: Créer un nouveau dossier d'investigation
 *     description: Crée un nouveau dossier et peut optionnellement l'associer à des investigations existantes.
 *     tags: [Cases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewCase'
 *           example:
 *             name: "Enquête sur le groupe de hackers 'Shadow Coders'"
 *             description: "Ce dossier centralise toutes les informations sur les activités du groupe 'Shadow Coders'."
 *             investigationIds: ["clx...1", "clx...2"]
 *     responses:
 *       201:
 *         description: Le dossier a été créé avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Case'
 *       400:
 *         description: "Les données fournies sont invalides (ex: nom manquant)."
 *       500:
 *         description: Erreur serveur
 */
router.post('/', protect, validate(caseValidation.createCase), catchAsync(async (req, res) => {
  const { name, description, investigationIds } = req.body;

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
}));

/**
 * @swagger
 * /api/cases/{id}:
 *   get:
 *     summary: Obtenir les détails d'un dossier spécifique
 *     description: Récupère les informations complètes d'un dossier, y compris les investigations associées et leurs résultats.
 *     tags: [Cases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: L'ID unique du dossier.
 *     responses:
 *       200:
 *         description: Détails du dossier.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CaseWithDetails'
 *       404:
 *         description: Le dossier avec l'ID spécifié n'a pas été trouvé.
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', protect, validate(caseValidation.getCase), catchAsync(async (req, res) => {
    const { id } = req.params;
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
        throw new ApiError('CaseNotFound', 404, true, `Case with id ${id} not found.`);
    }

    // TODO: Ajouter une logique de synthèse plus complexe ici
    res.json(caseDetails);
}));

/**
 * @swagger
 * /api/cases/{id}:
 *   put:
 *     summary: Mettre à jour un dossier existant
 *     description: Met à jour le nom et/ou la description d'un dossier spécifique.
 *     tags: [Cases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: L'ID unique du dossier à mettre à jour.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCase'
 *           example:
 *             name: "DOSSIER-007 (Mis à jour)"
 *             description: "Description mise à jour avec de nouvelles informations."
 *     responses:
 *       200:
 *         description: Le dossier a été mis à jour avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Case'
 *       404:
 *         description: Le dossier avec l'ID spécifié n'a pas été trouvé.
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id', protect, validate(caseValidation.updateCase), catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const updatedCase = await prisma.case.update({
        where: { id },
        data: {
            name,
            description,
        },
    });
    res.json(updatedCase);
}));

/**
 * @swagger
 * /api/cases/{id}:
 *   delete:
 *     summary: Supprimer un dossier
 *     description: Supprime un dossier de manière permanente. Cette action est irréversible.
 *     tags: [Cases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: L'ID unique du dossier à supprimer.
 *     responses:
 *       204:
 *         description: Le dossier a été supprimé avec succès.
 *       404:
 *         description: Le dossier avec l'ID spécifié n'a pas été trouvé.
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', protect, validate(caseValidation.deleteCase), catchAsync(async (req, res) => {
    const { id } = req.params;
    await prisma.case.delete({
        where: { id },
    });
    res.status(204).send();
}));

/**
 * @swagger
 * /api/cases/{id}/investigations:
 *   put:
 *     summary: Gérer les associations d'investigations
 *     description: Permet d'ajouter ou de retirer des investigations d'un dossier en une seule opération.
 *     tags: [Cases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: L'ID unique du dossier.
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
 *                 description: Liste des IDs d'investigation à associer au dossier.
 *               investigationIdsToDisconnect:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Liste des IDs d'investigation à dissocier du dossier.
 *           example:
 *             investigationIdsToConnect: ["clx...3"]
 *             investigationIdsToDisconnect: ["clx...1"]
 *     responses:
 *       200:
 *         description: Les associations du dossier ont été mises à jour.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CaseWithDetails'
 *       404:
 *         description: Le dossier avec l'ID spécifié n'a pas été trouvé.
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id/investigations', protect, validate(caseValidation.manageCaseInvestigations), catchAsync(async (req, res) => {
    const { id } = req.params;
    const { investigationIdsToConnect, investigationIdsToDisconnect } = req.body;

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
}));


module.exports = router;