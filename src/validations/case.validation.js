const { z } = require('zod');

const createCase = z.object({
  body: z.object({
    name: z.string().min(3, 'Le nom du dossier doit contenir au moins 3 caractères.'),
    description: z.string().optional(),
    investigationIds: z.array(z.string().cuid('ID d\'investigation invalide.')).optional(),
  }),
});

const updateCase = z.object({
  params: z.object({
    id: z.string().cuid('ID de dossier invalide.'),
  }),
  body: z.object({
    name: z.string().min(3, 'Le nom du dossier doit contenir au moins 3 caractères.').optional(),
    description: z.string().optional(),
  }),
});

const manageCaseInvestigations = z.object({
    params: z.object({
        id: z.string().cuid('ID de dossier invalide.'),
    }),
    body: z.object({
        investigationIdsToConnect: z.array(z.string().cuid('ID d\'investigation invalide.')).optional(),
        investigationIdsToDisconnect: z.array(z.string().cuid('ID d\'investigation invalide.')).optional(),
    }),
});

const getCase = z.object({
    params: z.object({
        id: z.string().cuid('ID de dossier invalide.'),
    }),
});

const deleteCase = z.object({
    params: z.object({
        id: z.string().cuid('ID de dossier invalide.'),
    }),
});


module.exports = {
  createCase,
  updateCase,
  getCase,
  deleteCase,
  manageCaseInvestigations,
};